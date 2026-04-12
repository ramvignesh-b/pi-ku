from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from letters.models import Letter, LetterImage
from letters.serializers import LetterSerializer


class LetterView(generics.ListCreateAPIView):
    serializer_class = LetterSerializer
    # enforce auth guard
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """return only letters of the authenticated user"""
        return Letter.objects.filter(user=self.request.user)


class LetterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LetterSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_queryset(self):
        return Letter.objects.filter(user=self.request.user)

    def put(self, request, public_id):
        # upsert: create if doesn't exist, else update
        letter, created = Letter.objects.get_or_create(public_id=public_id, user=request.user)

        # request.data handles both JSON and Multipart automatically in DRF
        serializer = self.get_serializer(letter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Note: image_files is a list of binary files in request.FILES
        if "image_files" in request.FILES:
            letter.images.all().delete()
            for image_file in request.FILES.getlist("image_files"):
                LetterImage.objects.create(letter=letter, file=image_file, file_name=image_file.name)

        # Return fresh data including the new image URLs
        serializer = self.get_serializer(letter)
        return Response(serializer.data, status=201 if created else 200)
