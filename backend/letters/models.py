import uuid

from django.conf import settings
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

    public_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="letters")
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.KEPT)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.type} - {self.status}"
