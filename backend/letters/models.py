import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Letter(models.Model):
    class Type(models.TextChoices):
        KEPT = "KEPT", "Kept"
        SENT = "SENT", "Sent"
        VAULT = "VAULT", "Vault"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SEALED = "SEALED", "Sealed"
        BURNED = "BURNED", "Burned"

    public_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="letters")
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.KEPT)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    encrypted_content = models.TextField(null=True, blank=True)
    encrypted_metadata = models.TextField(null=True, blank=True)
    unlock_at = models.DateTimeField(null=True, blank=True)
    sealed_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    burned_at = models.DateTimeField(null=True, blank=True)
    encrypted_dek = models.TextField(null=True, blank=True)

    def clean(self):
        # custom validation
        super().clean()
        if self.type == Letter.Type.VAULT and self.status == Letter.Status.SEALED and not self.unlock_at:
            raise ValidationError("A sealed VAULT letter must have an unlock_date.")

    def __str__(self):
        return f"{self.type} - {self.status}"


class LetterImage(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    letter = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name="images")
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="encrypted-images/")

    def __str__(self):
        return f"Image {self.public_id} for {self.letter}"
