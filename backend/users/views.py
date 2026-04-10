from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config import settings
from users.utils import send_activation_email, set_response_cookies

from .serializers import UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            # making sure that if email fails, the user is not created
            user = serializer.save()
            send_activation_email(user)


class ActivationView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(public_id=uid)
        except (User.DoesNotExist, TypeError, ValueError):
            return Response({"detail": "Invalid activation link: User Error"}, status=status.HTTP_400_BAD_REQUEST)
        # validate token
        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid activation link: Token Error"}, status=status.HTTP_400_BAD_REQUEST)
        # activate user
        user.is_active = True
        user.save()
        return Response({"detail": "Account activated successfully"}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        # Returns the user associated with the JWT token in the request
        return self.request.user


class TokenGenerateView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data["refresh"]
            response = set_response_cookies(response, refresh_token)
        return response


class RefreshTokenView(TokenRefreshView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
        if not refresh_token:
            return Response({"detail": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
        request.data["refresh"] = refresh_token
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            new_refresh_token = response.data["refresh"]
            response = set_response_cookies(response, new_refresh_token)
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        response = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        # Clear the secure cookie
        response.delete_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE"],
            domain=settings.SIMPLE_JWT.get("AUTH_COOKIE_DOMAIN"),
            samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE"),
            path="/",
        )
        return response
