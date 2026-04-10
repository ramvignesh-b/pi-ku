from rest_framework import serializers

from .models import Letter


class LetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Letter
        fields = [
            "public_id",
            "type",
            "status",
            "encrypted_content",
            "encrypted_metadata",
            "unlock_at",
            "sealed_at",
            "created_at",
            "updated_at",
        ]  # user to be fetched from request
        read_only_fields = ["public_id", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user  # get user from access token
        return Letter.objects.create(user=user, **validated_data)
