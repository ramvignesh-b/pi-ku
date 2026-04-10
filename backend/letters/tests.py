from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Letter

User = get_user_model()


class LetterModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@pi-ku.app", password="password1234", full_name="Test User")

    def test_create_letter_draft(self):
        """create a basic Letter model with required fields"""
        letter = Letter.objects.create(user=self.user, type="KEPT", status="DRAFT")

        self.assertEqual(letter.user, self.user)
        self.assertEqual(letter.type, "KEPT")
        self.assertEqual(letter.status, "DRAFT")
        self.assertIsNotNone(letter.public_id)
        self.assertIsNone(letter.unlock_at)
        self.assertEqual(letter.encrypted_content, None)
        self.assertEqual(letter.encrypted_metadata, None)
        self.assertIsNone(letter.sealed_at)
        self.assertIsNone(letter.opened_at)
        self.assertIsNone(letter.burned_at)
        # Verify timestamps are auto-added
        self.assertIsNotNone(letter.created_at)
        self.assertIsNotNone(letter.updated_at)

    def test_vault_requires_unlock_date_when_sealed(self):
        """a sealed VAULT letter must have an unlock_date"""
        from django.core.exceptions import ValidationError

        letter = Letter(
            user=self.user,
            type=Letter.Type.VAULT,
            status=Letter.Status.SEALED,
            encrypted_content="enc_v1...",
        )
        with self.assertRaises(ValidationError):
            letter.full_clean()


class LetterAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="api@pi-ku.app", password="password1234", full_name="API User")
        self.client.force_authenticate(user=self.user)
        self.url = "/api/letters/"

    def test_create_draft_letter_api(self):
        """Test API can successfully create a basic draft letter."""
        payload = {"type": "KEPT", "encrypted_content": "enc_xyz==", "encrypted_metadata": "enc_meta=="}

        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(Letter.objects.get().status, "DRAFT")
        self.assertEqual(Letter.objects.get().type, "KEPT")
        self.assertEqual(Letter.objects.get().user, self.user)
