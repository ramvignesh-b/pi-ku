from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from letters.models import Letter
from letters.serializers import LetterSerializer


class LetterView(generics.ListCreateAPIView):
    serializer_class = LetterSerializer
    # enforce auth guard
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """return only letters of the authenticated user"""
        return Letter.objects.filter(user=self.request.user)
