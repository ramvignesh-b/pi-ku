from unittest.mock import _patch_dict

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.password = "password123"
        self.user = User.objects.create_user(
            email="test@example.com", password=self.password, full_name="Test User", is_active=True
        )
        self.login_url = reverse("token_generate")
        self.refresh_url = reverse("token_refresh")
        self.logout_url = reverse("logout")

    @_patch_dict("config.settings.AUTH_COOKIE", {"SECURE": True})
    def test_login_sets_secure_cookie(self):
        """
        Tests if the Login API can generate access token and set secure cookie (when ssl is enabled) for refresh token.
        """
        data = {"email": self.user.email, "password": self.password}
        cookie_name = "refresh_token"

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertIn(cookie_name, response.cookies)
        self.assertIsNotNone(response.cookies[cookie_name].value)
        self.assertTrue(response.cookies[cookie_name].get("httponly"))
        self.assertTrue(response.cookies[cookie_name].get("secure"))
        self.assertEqual(response.cookies[cookie_name].get("samesite"), "Lax")


class ActivationTests(APITestCase):
    def test_user_activation(self):
        """
        Tests if the Activation API can activate an inactive user.
        """
        user = User.objects.create_user(email="inactiveuser@test.com", password="password1234", is_active=False)
        uidb64 = urlsafe_base64_encode(force_bytes(user.public_id))
        token = default_token_generator.make_token(user)
        activation_url = reverse("activate", kwargs={"uidb64": uidb64, "token": token})

        response = self.client.get(activation_url)
        user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(user.is_active)
