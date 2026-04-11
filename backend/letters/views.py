from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from letters.models import Letter, LetterImage
from letters.serializers import LetterSerializer


class LetterView(generics.ListCreateAPIView):
    serializer_class = LetterSerializer
    # enforce auth guard
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """return only letters of the authenticated user"""
        return Letter.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        letter = serializer.save(user=self.request.user)
        image_files = self.request.FILES.getlist("image_files")
        for image_file in image_files:
            LetterImage.objects.create(letter=letter, file=image_file, file_name=image_file.name)
