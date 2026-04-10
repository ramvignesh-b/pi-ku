from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class ActivationView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
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
