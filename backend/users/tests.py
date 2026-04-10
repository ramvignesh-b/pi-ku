from django.conf import settings
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

    def test_login_sets_secure_cookie(self):
        data = {"email": self.user.email, "password": self.password}
        response = self.client.post(self.login_url, data)
        cookie_name = settings.SIMPLE_JWT["AUTH_COOKIE"]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertIn(cookie_name, response.cookies)
        # verify the cookie has a value
        self.assertTrue(response.cookies[cookie_name].value)


class ActivationTests(APITestCase):
    def test_user_activation(self):
        # initial user state
        user = User.objects.create_user(email="inactive@test.com", password="password1234", is_active=False)
        # generate activation link
        uidb64 = urlsafe_base64_encode(force_bytes(user.public_id))
        token = default_token_generator.make_token(user)
        # call activation url
        activation_url = reverse("activate", kwargs={"uidb64": uidb64, "token": token})
        response = self.client.get(activation_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check user is activated
        user.refresh_from_db()
        self.assertTrue(user.is_active)
