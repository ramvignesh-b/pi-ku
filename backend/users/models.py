from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    General User Model
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email must be set"))
        # set default activation state as False to enforce email verification
        extra_fields.setdefault("is_active", False)

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Admin Model
        """
        extra_fields.update({"is_staff": True, "is_superuser": True, "is_active": True})

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Database table structure.
    """

    # Reset default fields
    username = None
    first_name = None
    last_name = None

    full_name = models.CharField(max_length=100)
    email = models.EmailField(_("email address"), unique=True)
    kdf_salt = models.CharField(max_length=128, blank=True, null=True)

    # Default is False to enforce email verification
    is_active = models.BooleanField(default=False)

    objects = CustomUserManager()

    # Login uses email instead of username
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
