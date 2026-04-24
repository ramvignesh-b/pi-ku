from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from letters.models import Letter, LetterImage
from letters.serializers import LetterSerializer


class LetterView(generics.ListCreateAPIView):
    serializer_class = LetterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Returns the letters of the authenticated user.
        """
        return Letter.objects.filter(user=self.request.user)


class LetterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LetterSerializer
    lookup_field = "public_id"

    def get_permissions(self):
        """
        Allow any letter GET requests for guest access and enforce authentication for other operations.
        """
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Returns the letters of the authenticated user.
        Guests can only see SEALED letters.
        """
        if self.request.user.is_authenticated:
            return Letter.objects.filter(user=self.request.user)
        return Letter.objects.filter(status=Letter.Status.SEALED)

    def put(self, request, public_id):
        """
        Upserts letters: create if doesn't exist, else update.
        Validates the payload data, cleans up old images, and returns the upserted data.
        """
        letter, created = Letter.objects.get_or_create(public_id=public_id, user=request.user)

        if not created and letter.status == Letter.Status.SEALED:
            return Response({"error": "Sealed letters cannot be modified."}, status=400)

        write_serializer = self.get_serializer(letter, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        write_serializer.save()

        if "image_files" in request.FILES:
            for old_image in letter.images.all():
                old_image.file.delete(save=False)
                old_image.delete()

            for image_file in request.FILES.getlist("image_files"):
                LetterImage.objects.create(letter=letter, file=image_file, file_name=image_file.name)

        response_serializer = self.get_serializer(letter)
        return Response(response_serializer.data, status=201 if created else 200)

    def patch(self, request, public_id):
        """
        Updates an existing letter.
        Can update type and status only when sealed, sent and burned.
        """
        letter = Letter.objects.get(public_id=public_id, user=request.user)

        if letter.status == Letter.Status.SEALED:
            if (
                len(request.data) > 1
                or (request.data.get("status") != Letter.Status.BURNED and request.data.get("status") is not None)
                or (request.data.get("type") != Letter.Type.SENT and request.data.get("type") is not None)
            ):
                return Response({"error": "Sealed letters can only be burned or sent."}, status=400)

        write_serializer = self.get_serializer(letter, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        write_serializer.save()
        response_serializer = self.get_serializer(letter)
        return Response(response_serializer.data, status=200)
