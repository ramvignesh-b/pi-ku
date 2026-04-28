from datetime import UTC, datetime, timedelta
from unittest.mock import ANY, patch

from django.conf import settings
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
        """
        Test the Letter model is created with required fields and auto timestamps.
        """
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
        self.assertIsNotNone(letter.created_at)
        self.assertIsNotNone(letter.updated_at)

    def test_vault_requires_unlock_date_when_sealed(self):
        """
        Test that a sealed VAULT letter cannot be created without an unlock_date
        """
        from django.core.exceptions import ValidationError

        letter = Letter(
            user=self.user,
            type=Letter.Type.VAULT,
            status=Letter.Status.SEALED,
            encrypted_content="enc_content==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
        )

        with self.assertRaises(ValidationError):
            letter.full_clean()


class LetterAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="api@pi-ku.app", password="password1234", full_name="API User")
        self.client.force_authenticate(user=self.user)
        self.url = "/api/letters/"

    def test_create_draft_letter_api(self):
        """
        Test that the API can successfully create a basic draft letter.
        """
        payload = {
            "public_id": "4281edcc-5459-4ff2-bb5e-669fb44e0757",
            "type": "KEPT",
            "encrypted_content": "enc_xyz==",
            "encrypted_metadata": "enc_meta==",
            "encrypted_dek": "enc_dek==",
        }

        response = self.client.put(self.url + payload["public_id"] + "/", payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(Letter.objects.get().status, "DRAFT")
        self.assertEqual(Letter.objects.get().type, "KEPT")
        self.assertEqual(Letter.objects.get().user, self.user)

    def test_update_draft_letter_with_public_id(self):
        """
        Test API can successfully update an existing letter with new values.
        """
        letter = Letter.objects.create(
            user=self.user,
            type="KEPT",
            status="DRAFT",
            public_id="4281edcc-5459-4ff2-bb5e-669fb44e0757",
            encrypted_content="enc_xyz==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
        )
        payload = {
            "public_id": letter.public_id,
            "type": "KEPT",
            "encrypted_content": "enc_abc==",
            "encrypted_metadata": "enc_meta==",
            "encrypted_dek": "enc_dek==",
        }

        response = self.client.put(self.url + letter.public_id + "/", payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(Letter.objects.get().status, "DRAFT")
        self.assertEqual(Letter.objects.get().type, "KEPT")
        self.assertEqual(Letter.objects.get().user, self.user)
        self.assertEqual(Letter.objects.get().encrypted_content, "enc_abc==")
        self.assertEqual(Letter.objects.get().encrypted_metadata, "enc_meta==")
        self.assertEqual(Letter.objects.get().encrypted_dek, "enc_dek==")

    def test_sealed_letters_cannot_be_updated(self):
        """
        Test that the API returns 400 when a user tries to update an already sealed letter.
        """
        letter = Letter.objects.create(
            user=self.user,
            type="KEPT",
            status="SEALED",
            public_id="4281edcc-5459-4ff2-bb5e-669fb44e0757",
            encrypted_content="enc_xyz==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
        )
        payload = {
            "public_id": letter.public_id,
            "type": "KEPT",
            "encrypted_content": "enc_abc==",
            "encrypted_metadata": "enc_meta==",
            "encrypted_dek": "enc_dek==",
        }

        response = self.client.put(self.url + letter.public_id + "/", payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"error": "Sealed letters cannot be modified."})

    def test_encrypted_dek_is_required_when_storing_encrypted_content_and_metadata(self):
        """
        Test that encrypted_dek is required when encrypted_content and encrypted_metadata are added to the letter.
        """
        payload = {"type": "KEPT", "encrypted_content": "enc_xyz==", "encrypted_metadata": "enc_meta=="}

        response = self.client.post(self.url, payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Letter.objects.count(), 0)
        self.assertEqual(
            response.data["non_field_errors"],
            ["encrypted_dek is required when encrypted_content and encrypted_metadata are present"],
        )

    def test_create_letter_with_images_api(self):
        """
        Test that the API can create a letter and attach encrypted images in one request.
        """
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Simulate local files upload
        image1 = SimpleUploadedFile("enc_img1.bin", b"encrypted_bytes_1", content_type="application/octet-stream")
        image2 = SimpleUploadedFile("enc_img2.bin", b"encrypted_bytes_2", content_type="application/octet-stream")
        payload = {
            "public_id": "4281edcc-5459-4ff2-bb5e-669fb44e0757",
            "type": "SENT",
            "status": "SEALED",
            "encrypted_content": "enc_content==",
            "encrypted_metadata": "enc_metadata==",
            "encrypted_dek": "enc_dek==",
            "image_files": [image1, image2],
        }

        response = self.client.put(self.url + payload["public_id"] + "/", payload, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(LetterImage.objects.count(), 2)
        from django.core.files.storage import default_storage

        self.assertTrue(default_storage.exists("encrypted-images/enc_img1.bin"))
        self.assertTrue(default_storage.exists("encrypted-images/enc_img2.bin"))

    def test_cleanup_images_when_letter_is_updated(self):
        """
        Test that the old images are cleaned up when a letter is updated with new images.
        """
        letter = Letter.objects.create(user=self.user, type="KEPT", status="DRAFT")
        LetterImage.objects.create(letter=letter, file_name="old1.bin", file=ContentFile(b"data", name="old1.bin"))
        LetterImage.objects.create(letter=letter, file_name="old2.bin", file=ContentFile(b"data", name="old2.bin"))

        response = self.client.put(
            f"/api/letters/{letter.public_id}/",
            data={
                "encrypted_content": "new_enc==",
                "encrypted_metadata": "new_meta==",
                "encrypted_dek": "new_dek==",
                "image_files": [ContentFile(b"data", name="new.bin")],
            },
            format="multipart",
        )

        from django.core.files.storage import default_storage

        # Verify that the old files are cleared from storage directory as well
        self.assertTrue(LetterImage.objects.filter(file_name="new.bin").exists())
        self.assertEqual(LetterImage.objects.count(), 1)
        self.assertFalse(default_storage.exists("encrypted-images/old1.bin"))
        self.assertFalse(default_storage.exists("encrypted-images/old2.bin"))
        self.assertEqual(response.status_code, 200)

    def test_vault_letters_does_not_return_letter_content_before_the_unlock_date(self):
        """
        Test that the vault letters does not return letter content (images and encrypted_content)
        before the unlock date.
        """
        from datetime import datetime, timedelta

        letter = Letter.objects.create(
            user=self.user,
            type="VAULT",
            status="SEALED",
            public_id="4281edcc-5459-4ff2-bb5e-669fb44e0757",
            encrypted_content="enc_content==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
            unlock_at=datetime.now(UTC),
        )
        from freezegun import freeze_time

        past_datetime = datetime.now(UTC) - timedelta(seconds=1)
        future_datetime = datetime.now(UTC) + timedelta(seconds=1)

        with freeze_time(past_datetime):
            response = self.client.get(f"/api/letters/{letter.public_id}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["encrypted_content"], None)
            self.assertEqual(response.data["encrypted_metadata"], "enc_meta==")
            self.assertEqual(response.data["encrypted_dek"], None)

        with freeze_time(future_datetime):
            response = self.client.get(f"/api/letters/{letter.public_id}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["encrypted_content"], "enc_content==")
            self.assertEqual(response.data["encrypted_metadata"], "enc_meta==")
            self.assertEqual(response.data["encrypted_dek"], "enc_dek==")

    def test_burn_letter(self):
        """
        Test that a sealed letter can only be burned but not updated.
        """
        letter = Letter.objects.create(
            user=self.user,
            type="KEPT",
            status="SEALED",
            public_id="4281edcc-5459-4ff2-bb5e-669fb44e0757",
            encrypted_content="enc_content==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
        )

        response_update_content = self.client.patch(
            self.url + letter.public_id + "/",
            {
                "encrypted_content": "enc_content_new==",
                "encrypted_metadata": "enc_meta_new==",
                "encrypted_dek": "enc_dek_new==",
            },
        )

        self.assertEqual(response_update_content.status_code, 400)
        self.assertEqual(response_update_content.data["error"], "Sealed letters can only be burned or sent.")
        self.assertEqual(Letter.objects.get().encrypted_content, "enc_content==")

        from datetime import UTC, datetime

        from freezegun import freeze_time

        current_time = datetime.now(UTC)
        with freeze_time(current_time):
            response_burn = self.client.patch(self.url + letter.public_id + "/", {"status": "BURNED"})

            self.assertEqual(response_burn.status_code, 200)
            self.assertEqual(Letter.objects.count(), 1)
            self.assertEqual(Letter.objects.get().status, "BURNED")
            self.assertEqual(Letter.objects.get().burned_at, current_time)

    def test_send_sealed_letter(self):
        """
        Test that a sealed letter can be sent.
        """
        letter = Letter.objects.create(
            user=self.user,
            type="KEPT",
            status="SEALED",
            public_id="4281edcc-5459-4ff2-bb5e-669fb44e0757",
            encrypted_content="enc_content==",
            encrypted_metadata="enc_meta==",
            encrypted_dek="enc_dek==",
        )

        response_sent = self.client.patch(self.url + letter.public_id + "/", {"type": "SENT"})

        self.assertEqual(response_sent.status_code, 200)
        self.assertEqual(Letter.objects.count(), 1)
        self.assertEqual(Letter.objects.get().type, "SENT")


class LetterImageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="img_test@pi-ku.app", password="password1234")
        self.letter = Letter.objects.create(user=self.user, type="KEPT", status="DRAFT")

    def test_create_letter_image(self):
        """
        Test that images can be associated with a letter (many to 1).
        """
        image_content = ContentFile(b"fake-encrypted-data", name="test_image.bin")

        letter_image = LetterImage.objects.create(
            letter=self.letter, file_name="encrypted_image.enc", file=image_content
        )

        self.assertEqual(letter_image.letter, self.letter)
        self.assertTrue(letter_image.file.name.startswith("encrypted-images/"))
        self.assertIsNotNone(letter_image.public_id)

    def test_letter_cascade_deletes_images(self):
        """
        TTest that when a letter is deleted, its encrypted images are also removed.
        """
        LetterImage.objects.create(
            letter=self.letter, file_name="will_be_deleted.jpg", file=ContentFile(b"data", name="del.bin")
        )

        self.assertEqual(LetterImage.objects.count(), 1)
        self.letter.delete()
        self.assertEqual(LetterImage.objects.count(), 0)


class LetterTaskTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="task@pi-ku.app", password="password1234")

    def test_get_vault_letters_to_be_notified(self):
        """
        Test that the task can successfully retrieve the letters whose unlock date is passed and haven't been notified.
        """
        from letters.tasks import get_vault_letters_to_notify

        Letter.objects.create(
            user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC) + timedelta(seconds=1)
        )
        Letter.objects.create(user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC))
        Letter.objects.create(
            user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC) - timedelta(seconds=1)
        )
        Letter.objects.create(
            user=self.user,
            type="VAULT",
            status="SEALED",
            unlock_at=datetime.now(UTC) - timedelta(hours=1),
            notified_at=datetime.now(UTC) - timedelta(minutes=59),
        )
        Letter.objects.create(
            user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC) + timedelta(seconds=1)
        )
        Letter.objects.create(
            user=self.user,
            type="KEPT",
            status="SEALED",
        )

        unlocked_letters = get_vault_letters_to_notify()

        self.assertEqual(len(unlocked_letters), 2)

    def test_notify_unlocked_letter(self):
        """
        Test that the task successfully notifies the user via email and updates the database field.
        """
        from letters.tasks import notify_unlocked_letter

        letter_to_notify1 = Letter.objects.create(
            user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC), notified_at=None
        )
        with patch("letters.tasks.send_mail") as mock_send_mail:
            notify_unlocked_letter(letter_to_notify1)

            mock_send_mail.assert_called_with(
                subject=ANY,
                message=ANY,
                from_email=settings.FROM_EMAIL,
                recipient_list=[self.user.email],
                fail_silently=False,
                html_message=ANY,
            )
            self.assertIsNotNone(letter_to_notify1.notified_at)

        letter_to_notify2 = Letter.objects.create(
            user=self.user, type="VAULT", status="SEALED", unlock_at=datetime.now(UTC), notified_at=None
        )
        with patch("letters.tasks.send_mail") as mock_send_mail:
            mock_send_mail.side_effect = Exception()

            notify_unlocked_letter(letter_to_notify2)

            self.assertIsNone(letter_to_notify2.notified_at)
