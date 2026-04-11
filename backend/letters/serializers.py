from rest_framework import serializers

from letters.models import LetterImage

from .models import Letter


class LetterImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetterImage
        fields = ["public_id", "file", "file_name"]
        read_only_fields = ["public_id"]


class LetterSerializer(serializers.ModelSerializer):
    images = LetterImageSerializer(many=True, read_only=True)

    class Meta:
        model = Letter
        fields = [
            "public_id",
            "type",
            "status",
            "encrypted_content",
            "encrypted_metadata",
            "encrypted_dek",
            "unlock_at",
            "sealed_at",
            "created_at",
            "updated_at",
            "images",
        ]  # user to be fetched from request
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        if (data.get("encrypted_content") or data.get("encrypted_metadata")) and not data.get("encrypted_dek"):
            raise serializers.ValidationError(
                "encrypted_dek is required when encrypted_content and encrypted_metadata are present"
            )
        return data
