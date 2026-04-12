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

    def put(self, request, public_id):
        # avoiding deepcopy due to osmething called pickle
        data = request.data.dict()
        print(data)
        # remove public_id from data to avoid UniqueValidator firing
        # since we use it from the URL for update_or_create anyway
        data.pop("public_id", None)
        serializer = self.get_serializer(data=data)

        serializer.is_valid(raise_exception=True)

        letter, created = Letter.objects.update_or_create(
            public_id=public_id, user=self.request.user, defaults=serializer.validated_data
        )

        LetterImage.objects.filter(letter=letter).delete()
        for image_file in request.FILES.getlist("image_files"):
            LetterImage.objects.create(letter=letter, file=image_file, file_name=image_file.name)

        return Response(serializer.data, status=201 if created else 200)
