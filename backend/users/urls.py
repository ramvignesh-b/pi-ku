from django.urls import path

from .views import ActivationView, LogoutView, MeView, RefreshTokenView, RegisterView, TokenGenerateView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # Login and get access and refresh tokens
    path("login/", TokenGenerateView.as_view(), name="token_generate"),
    # Get a new access token using a refresh token
    path("refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    # Get current user info
    path("me/", MeView.as_view(), name="me"),
    # Activate user account
    path("activate/<str:uidb64>/<str:token>/", ActivationView.as_view(), name="activate"),
    # Logout and delete the access token
    path("logout/", LogoutView.as_view(), name="logout"),
]
