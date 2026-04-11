from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase
from rest_framework.test import APITestCase

from letters.models import LetterImage

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
        payload = {
            "type": "KEPT",
            "encrypted_content": "enc_xyz==",
            "encrypted_metadata": "enc_meta==",
            "encrypted_dek": "enc_dek==",
        }

        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(Letter.objects.get().status, "DRAFT")
        self.assertEqual(Letter.objects.get().type, "KEPT")
        self.assertEqual(Letter.objects.get().user, self.user)

    def test_encrypted_dek_is_required_when_storing_encrypted_content_and_metadata(self):
        """encrypted_dek is required when encrypted_content and encrypted_metadata are present"""
        payload = {"type": "KEPT", "encrypted_content": "enc_xyz==", "encrypted_metadata": "enc_meta=="}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Letter.objects.count(), 0)
        self.assertEqual(
            response.data["non_field_errors"],
            ["encrypted_dek is required when encrypted_content and encrypted_metadata are present"],
        )

    def test_create_letter_with_images_api(self):
        """Test API can create a letter and attach encrypted images in one request"""
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Simulate local encryption files
        image1 = SimpleUploadedFile("enc_img1.bin", b"encrypted_bytes_1", content_type="application/octet-stream")
        image2 = SimpleUploadedFile("enc_img2.bin", b"encrypted_bytes_2", content_type="application/octet-stream")

        payload = {
            "type": "SENT",
            "status": "SEALED",
            "encrypted_content": "enc_content==",
            "encrypted_metadata": "enc_metadata==",
            "encrypted_dek": "enc_dek==",
            "image_files": [image1, image2],
        }

        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(LetterImage.objects.count(), 2)


class LetterImageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="img_test@pi-ku.app", password="password1234")
        self.letter = Letter.objects.create(user=self.user, type="KEPT", status="DRAFT")

    def test_create_letter_image(self):
        """Test images can be associated with a letter (many to 1)"""
        image_content = ContentFile(b"fake-encrypted-data", name="test_image.bin")
        letter_image = LetterImage.objects.create(
            letter=self.letter, file_name="encrypted_image.enc", file=image_content
        )
        self.assertEqual(letter_image.letter, self.letter)
        self.assertTrue(letter_image.file.name.startswith("encrypted-images/"))
        self.assertIsNotNone(letter_image.public_id)

    def test_letter_cascade_deletes_images(self):
        """TTest when a letter is deleted, its encrypted images are also removed"""
        LetterImage.objects.create(
            letter=self.letter, file_name="will_be_deleted.jpg", file=ContentFile(b"data", name="del.bin")
        )
        self.assertEqual(LetterImage.objects.count(), 1)
        self.letter.delete()
        self.assertEqual(LetterImage.objects.count(), 0)
