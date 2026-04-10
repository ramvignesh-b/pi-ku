from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Letter

User = get_user_model()


class LetterModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@pi-ku.app", password="password1234", full_name="Test User")

    def test_create_letter_basic(self):
        """create a basic Letter model with required fields"""
        letter = Letter.objects.create(user=self.user, type="KEPT", status="DRAFT")

        self.assertEqual(letter.user, self.user)
        self.assertEqual(letter.type, "KEPT")
        self.assertEqual(letter.status, "DRAFT")
        self.assertIsNotNone(letter.public_id)

        # Verify timestamps are auto-added
        self.assertIsNotNone(letter.created_at)
        self.assertIsNotNone(letter.updated_at)
