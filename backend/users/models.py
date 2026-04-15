import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Creates and saves a User with email and password.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email must be set"))
        extra_fields.setdefault("is_active", False)

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Creates a Superuser with email and password.
        """
        extra_fields.update({"is_staff": True, "is_superuser": True, "is_active": True})

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Creates a User with email as primary identifier.
    Requires manual email verification for activation.
    """

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)

    username = None
    first_name = None
    last_name = None

    full_name = models.CharField(max_length=100)
    email = models.EmailField(_("email address"), unique=True)
    is_active = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
