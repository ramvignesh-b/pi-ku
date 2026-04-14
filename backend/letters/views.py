from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    lookup_field = "public_id"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # author can see all their letters (DRAFT, SEALED, etc.)
            return Letter.objects.filter(user=self.request.user)
        # guests can ONLY see SEALED letters
        return Letter.objects.filter(status=Letter.Status.SEALED)

    def put(self, request, public_id):
        # upsert: create if doesn't exist, else update
        letter, created = Letter.objects.get_or_create(public_id=public_id, user=request.user)

        # check if already sealed
        if not created and letter.status == Letter.Status.SEALED:
            return Response({"error": "Sealed letters cannot be modified."}, status=400)

        # request.data handles both JSON and Multipart automatically in DRF
        serializer = self.get_serializer(letter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Note: image_files is a list of binary files in request.FILES
        if "image_files" in request.FILES:
            # Delete old image files from storage and database
            for old_image in letter.images.all():
                old_image.file.delete(save=False)
                old_image.delete()

            for image_file in request.FILES.getlist("image_files"):
                LetterImage.objects.create(letter=letter, file=image_file, file_name=image_file.name)

        # Return fresh data including the new image URLs
        serializer = self.get_serializer(letter)
        return Response(serializer.data, status=201 if created else 200)
