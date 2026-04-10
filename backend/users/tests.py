from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
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
