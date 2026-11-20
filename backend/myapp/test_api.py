"""
test_api.py - API tests (run with: python manage.py test myapp)

Django creates a temporary database and we point MEDIA_ROOT at a temporary
folder, so your real data and files are never touched.
"""
import os
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from myapp.models import Project, Diagram



class OwnershipTests(APITestCase):
    """A user must only see and modify their own projects and diagrams."""

    def setUp(self):
        # Fresh media folder for every test, so files never collide.
        media = tempfile.mkdtemp()
        override = override_settings(MEDIA_ROOT=media)
        override.enable()
        self.addCleanup(override.disable)
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)

        User = get_user_model()
        self.alice = User.objects.create_user("Alice", "A", "alice@test.com", "pw-Alice-123")
        self.bob = User.objects.create_user("Bob", "B", "bob@test.com", "pw-Bob-123")
        self.project = Project.objects.create(name="p", description="d", owner=self.alice)
        self.diagram = Diagram.objects.create(
            name="d", description="d", project=self.project,
            file=SimpleUploadedFile("a.bpmn", b"<definitions/>"),
        )

    def test_project_list_shows_only_own_projects(self):
        self.client.force_authenticate(self.bob)
        response = self.client.get("/api/projects/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_unknown_project_returns_404(self):
        self.client.force_authenticate(self.alice)
        response = self.client.get("/api/projects/99999/")
        self.assertEqual(response.status_code, 404)

    def test_other_user_cannot_list_diagrams_of_a_project(self):
        self.client.force_authenticate(self.bob)
        response = self.client.get(f"/api/projects/{self.project.id}/create-diagrams/")
        self.assertEqual(response.json(), [])

    def test_other_user_cannot_open_a_diagram(self):
        self.client.force_authenticate(self.bob)
        response = self.client.get(
            f"/api/projects/{self.project.id}/diagrams/{self.diagram.id}/")
        self.assertEqual(response.status_code, 404)

    def test_owner_can_open_own_diagram(self):
        self.client.force_authenticate(self.alice)
        response = self.client.get(
            f"/api/projects/{self.project.id}/diagrams/{self.diagram.id}/")
        self.assertEqual(response.status_code, 200)

    def test_diagram_list_requires_login(self):
        response = self.client.get(f"/api/projects/{self.project.id}/diagrams/")
        self.assertEqual(response.status_code, 401)

    def test_other_user_gets_empty_diagram_list(self):
        self.client.force_authenticate(self.bob)
        response = self.client.get(f"/api/projects/{self.project.id}/diagrams/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])   

    def test_owner_cannot_transfer_project(self):
        self.client.force_authenticate(self.alice)
        response = self.client.put(
            f"/api/projects/{self.project.id}/",
            {"name": "n", "description": "d", "owner": self.bob.id}, format="json")
        self.assertEqual(response.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.owner, self.alice)

    def test_diagram_file_path_is_relative(self):
        self.diagram.refresh_from_db()
        self.assertFalse(os.path.isabs(self.diagram.file.name), self.diagram.file.name)
        self.assertTrue(self.diagram.file.name.startswith("user_"))   

    def test_diagram_list_has_dates(self):
        self.client.force_authenticate(self.alice)
        item = self.client.get(f"/api/projects/{self.project.id}/diagrams/").json()[0]
        self.assertIsNotNone(item["created_at"])
        self.assertIsNone(item["last_verified_at"])

    def test_rejects_non_bpmn_upload(self):
        self.client.force_authenticate(self.alice)
        response = self.client.post(
            f"/api/projects/{self.project.id}/create-diagrams/",
            {"name": "x", "description": "y",
             "file": SimpleUploadedFile("evil.exe", b"MZ")})
        self.assertEqual(response.status_code, 400)   

    def test_last_result_hidden_from_other_users(self):
        self.client.force_authenticate(self.bob)
        r = self.client.get(f"/api/projects/{self.project.id}/diagrams/{self.diagram.id}/result/")
        self.assertEqual(r.status_code, 404)

    def test_last_result_empty_before_first_verification(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get(f"/api/projects/{self.project.id}/diagrams/{self.diagram.id}/result/")
        self.assertEqual(r.status_code, 204)      


class RegistrationSecurityTests(APITestCase):
    def test_cannot_register_as_staff(self):
        response = self.client.post("/api/v1/auth/users/", {
            "email": "x@test.com", "first_name": "X", "last_name": "Y",
            "password": "Str0ng-pass-987", "re_password": "Str0ng-pass-987",
            "is_staff": True, "is_active": True}, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        user = get_user_model().objects.get(email="x@test.com")
        self.assertFalse(user.is_staff)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("Al", "Ice", "al@test.com", "Old-pass-12345")
        self.client.force_authenticate(self.user)

    def test_me_exposes_is_staff_but_not_password(self):
        data = self.client.get("/api/v1/auth/users/me/").json()
        self.assertIn("is_staff", data)
        self.assertNotIn("password", data)

    def test_me_changes_names_only(self):
        r = self.client.patch("/api/v1/auth/users/me/",
                              {"first_name": "New", "is_staff": True, "email": "x@test.com"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "New")
        self.assertFalse(self.user.is_staff)
        self.assertEqual(self.user.email, "al@test.com")

    def test_change_password(self):
        r = self.client.post("/api/v1/auth/users/set_password/", {
            "current_password": "Old-pass-12345",
            "new_password": "New-pass-98765", "re_new_password": "New-pass-98765"}, format="json")
        self.assertEqual(r.status_code, 204, r.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New-pass-98765"))


class AdminUserTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user("Ad", "Min", "admin@test.com", "Pw-Admin-12345", is_staff=True)
        self.member = User.objects.create_user("Me", "Mber", "m@test.com", "Pw-Member-12345")

    def test_member_cannot_list_users(self):
        self.client.force_authenticate(self.member)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/users/{self.admin.id}/").status_code, 400)

    def test_admin_can_deactivate_a_member(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(f"/api/users/{self.member.id}/toggle_active/")
        self.assertEqual(r.status_code, 200)
        self.member.refresh_from_db()
        self.assertFalse(self.member.is_active)

    def test_put_is_not_allowed(self):
        self.client.force_authenticate(self.admin)
        r = self.client.put(f"/api/users/{self.member.id}/", {"email": "z@test.com"}, format="json")
        self.assertEqual(r.status_code, 405)
