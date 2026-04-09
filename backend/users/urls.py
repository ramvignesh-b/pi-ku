from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # Login and get access and refresh tokens
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # Get a new access token using a refresh token
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Get current user info
    path("me/", MeView.as_view(), name="me"),
]
