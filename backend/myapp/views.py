# views.py
import logging
import os
import shutil

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils.crypto import get_random_string
from django.utils import timezone

from .models import Project, Diagram
from .serializers import ProjectSerializer, DiagramSerializer, CreateUserSerializer
from .verification.structural import message
from .verification.missing_info import modify_bpmn_file
from .verification.contradiction import erreur_contradiction
from .verification.reports import generate_report
from .verification.results import build_payload

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """Admin-only user management: list, create, delete, (de)activate."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = CreateUserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def create(self, request, *args, **kwargs):
        """Admin creates a user. Uses the given password, or a random one if none."""
        data = request.data.copy()
        data['password'] = data.get('password') or get_random_string(12)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_active = True   # created by an admin: no activation email
        user.save(update_fields=['is_active'])
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        if self.get_object() == request.user:
            return Response({'detail': 'You cannot delete your own account.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': 'You cannot deactivate your own account.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response(self.get_serializer(user).data)

class ProjectListCreateAPIView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(owner=user)

    def perform_create(self, serializer):
        # Save the project
        project = serializer.save(owner=self.request.user)
        
        # Create directories
        user_directory = os.path.join('media', f'user_{self.request.user.id}')
        project_directory = os.path.join(user_directory, f'project_{project.id}')
        os.makedirs(project_directory, exist_ok=True)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(owner=user)

    def delete(self, request, *args, **kwargs):
        project = self.get_object()
        project_id = project.id
        
        # Delete the project's directory
        user_directory = os.path.join('media', f'user_{self.request.user.id}')
        project_directory = os.path.join(user_directory, f'project_{project_id}')
        if os.path.exists(project_directory):
            shutil.rmtree(project_directory)
        
        # Call the parent delete method to delete the project
        return super().delete(request, *args, **kwargs)

class DiagramListCreateAPIView(generics.ListCreateAPIView):
    queryset = Diagram.objects.all()
    serializer_class = DiagramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Diagram.objects.filter(
            project_id=self.kwargs['project_id'],
            project__owner=self.request.user
        )

    def perform_create(self, serializer):
        project = get_object_or_404(
            Project,
            id=self.kwargs['project_id'],
            owner=self.request.user
        )

        serializer.save(project=project)
    def post(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logging.error(f"Invalid data: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)    


class DiagramDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Diagram.objects.all()
    serializer_class = DiagramSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Diagram.objects.filter(
            project_id=self.kwargs['project_id'],
            id=self.kwargs['id'],
            project__owner=self.request.user,
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project_id = instance.project_id
        
        if project_id is not None:
            # Delete diagram folder
            diagram_folder_path = os.path.join('media', f'user_{request.user.id}', f'project_{project_id}', f'diagram_{instance.id}')
            if os.path.exists(diagram_folder_path):
                shutil.rmtree(diagram_folder_path)

            # Perform the actual destroy operation
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={"message": "Project ID is missing for the diagram."})
    
@api_view(['GET'])
def get_project_diagrams(request, project_id):
    """List the diagrams of one project. Only the owner of the project gets results."""
    diagrams = Diagram.objects.filter(project_id=project_id, project__owner=request.user)
    serialized_diagrams = [
        {'id': d.id, 'name': d.name, 'description': d.description,
         'file': d.file.url, 'verified': d.verified,
         'created_at': d.created_at, 'last_verified_at': d.last_verified_at}
        for d in diagrams
    ]
    return JsonResponse(serialized_diagrams, safe=False)


logger = logging.getLogger(__name__)


MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _run_checks(verified_path):
    """Run the MI, S and C checks on `verified_path` (modified in place: colours, names).
    Returns (french_messages, english_messages)."""
    loi = os.path.join(settings.MEDIA_ROOT, 'loi.txt')
    arts, arts_en = message(verified_path, verified_path, loi)
    annotation, annotation_en = modify_bpmn_file(verified_path)
    contradiction, contradiction_en = erreur_contradiction(verified_path)
    return arts + annotation + contradiction, arts_en + annotation_en + contradiction_en


def _write_reports(messages_fr, messages_en, folder, source_name):
    """Create report.docx (French) and reportENG.docx (English) in `folder`."""
    generate_report(messages_fr, os.path.join(folder, 'report.docx'), source_name, 'fr')
    generate_report(messages_en, os.path.join(folder, 'reportENG.docx'), source_name, 'en')


@api_view(['POST'])
def verify_diagram(request, project_id, diagram_id):
    """Verify a stored diagram, save the result on it and return it."""
    diagram = get_object_or_404(
        Diagram, id=diagram_id, project_id=project_id, project__owner=request.user)
    original_path = diagram.file.path
    if not os.path.exists(original_path):
        return Response({'detail': 'The diagram file is missing on the server.'},
                        status=status.HTTP_404_NOT_FOUND)

    folder = os.path.dirname(original_path)
    rel = os.path.relpath(folder, settings.MEDIA_ROOT).replace(os.sep, '/')
    verified_path = os.path.join(folder, 'verified_diagram.bpmn')
    try:
        shutil.copyfile(original_path, verified_path)  
        messages_fr, messages_en = _run_checks(verified_path)
        _write_reports(messages_fr, messages_en, folder, os.path.basename(original_path))
    except Exception:
        logger.error("Error verifying diagram %s", diagram_id, exc_info=True)
        return Response({'detail': 'Verification failed on the server.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    verified_at = timezone.now()
    payload = build_payload(
        messages_fr, messages_en,
        filename=default_storage.url(f'{rel}/verified_diagram.bpmn'),
        report_url=default_storage.url(f'{rel}/report.docx'),
        report_url_en=default_storage.url(f'{rel}/reportENG.docx'),
        verified_at=verified_at,
    )
    diagram.verified = True
    diagram.last_verified_at = verified_at
    diagram.last_result = payload
    diagram.save(update_fields=['verified', 'last_verified_at', 'last_result'])
    return Response(payload)


@api_view(['GET'])
def get_last_result(request, project_id, diagram_id):
    """Result of the last verification (204 if the diagram was never verified)."""
    diagram = get_object_or_404(
        Diagram, id=diagram_id, project_id=project_id, project__owner=request.user)
    if not diagram.last_result:
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(diagram.last_result)


@api_view(['POST'])
def upload_and_verify_diagram(request):
    """Verify a .bpmn file sent directly (not stored in any project)."""
    uploaded = request.FILES.get('file')
    if uploaded is None or not uploaded.name.lower().endswith('.bpmn'):
        return Response({'detail': 'Please send a .bpmn file.'}, status=status.HTTP_400_BAD_REQUEST)
    if uploaded.size > MAX_UPLOAD_BYTES:
        return Response({'detail': 'The file is larger than 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

    rel = f'uploads/user_{request.user.id}'
    folder = os.path.join(settings.MEDIA_ROOT, 'uploads', f'user_{request.user.id}')
    os.makedirs(folder, exist_ok=True)
    original_path = os.path.join(folder, 'original.bpmn')   
    with open(original_path, 'wb') as destination:
        for chunk in uploaded.chunks():
            destination.write(chunk)
    verified_path = os.path.join(folder, 'verified_diagram.bpmn')
    try:
        shutil.copyfile(original_path, verified_path)
        messages_fr, messages_en = _run_checks(verified_path)
        _write_reports(messages_fr, messages_en, folder, uploaded.name)
    except Exception:
        logger.error("Error in upload_and_verify_diagram", exc_info=True)
        return Response({'detail': 'Verification failed on the server.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(build_payload(
        messages_fr, messages_en,
        filename=default_storage.url(f'{rel}/verified_diagram.bpmn'),
        report_url=default_storage.url(f'{rel}/report.docx'),
        report_url_en=default_storage.url(f'{rel}/reportENG.docx'),
        verified_at=timezone.now(),
    ))