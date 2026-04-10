from django.urls import path

from .views import ActivationView, LogoutView, MeView, RegisterView, TokenLoginView, TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # Login and get access and refresh tokens
    path("login/", TokenLoginView.as_view(), name="token_obtain_pair"),
    # Get a new access token using a refresh token
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Get current user info
    path("me/", MeView.as_view(), name="me"),
    # Activate user account
    path("activate/<str:uidb64>/<str:token>/", ActivationView.as_view(), name="activate"),
    # Logout and delete the access token
    path("logout/", LogoutView.as_view(), name="logout"),
]
