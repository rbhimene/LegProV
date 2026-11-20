from django.contrib.auth import get_user_model
from djoser.serializers import UserCreateSerializer
from rest_framework import serializers
from .models import Project, Diagram


User = get_user_model()

class CreateUserSerializer(UserCreateSerializer):
    num_projects = serializers.SerializerMethodField()
    num_completed_projects = serializers.SerializerMethodField()
    
    

    def get_num_projects(self, obj):
        return Project.objects.filter(owner=obj).count()

    def get_num_completed_projects(self, obj):
        projects = Project.objects.filter(owner=obj)
        completed_projects = 0
        for project in projects:
            if all(diagram.verified for diagram in project.diagrams.all()):
                completed_projects += 1
        return completed_projects
    
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'password',
            'is_active',
            'is_staff',
            'num_projects',
            'num_completed_projects'
        ]

        read_only_fields = ['is_active', 'is_staff']

class ProjectSerializer(serializers.ModelSerializer):
    num_diagrams = serializers.SerializerMethodField()

    def get_num_diagrams(self, obj):
        return obj.diagrams.count()

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'owner',
            'created_at',
            'updated_at',
            'num_diagrams'
        ]

        read_only_fields = ['owner']
        

class DiagramSerializer(serializers.ModelSerializer):
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    class Meta:
        model = Diagram
        fields = ['id', 'name', 'description', 'file', 'verified', 'created_at', 'last_verified_at']
        # Set by the server only (verified/last_verified_at change when a verification runs).
        read_only_fields = ['verified', 'created_at', 'last_verified_at']

    def validate_file(self, value):
        if not value.name.lower().endswith('.bpmn'):
            raise serializers.ValidationError('Only .bpmn files are accepted.')
        if value.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError('The file is larger than 5 MB.')
        return value

    