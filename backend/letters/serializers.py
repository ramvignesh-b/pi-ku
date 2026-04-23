from datetime import UTC, datetime, timedelta

from rest_framework import serializers

from letters.models import Letter, LetterImage


class LetterImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetterImage
        fields = ["public_id", "file", "file_name"]
        read_only_fields = ["public_id"]


class LetterSerializer(serializers.ModelSerializer):
    images = LetterImageSerializer(many=True, read_only=True)

    class Meta:
        """
        Specifies the public_id as editable field for the client to generate.
        """

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
        ]
        read_only_fields = ["created_at", "updated_at"]

    def to_representation(self, instance):
        fields = super().to_representation(instance)
        if fields["type"] == Letter.Type.VAULT and fields["status"] == Letter.Status.SEALED:
            try:
                unlock_datetime = datetime.fromisoformat(fields["unlock_at"]).replace(tzinfo=UTC)
                if unlock_datetime - datetime.now(tz=UTC) > timedelta(seconds=0):
                    fields["encrypted_content"] = None
                    fields["images"] = None
                    fields["encrypted_dek"] = None
            except (ValueError, TypeError):
                pass

        if fields["status"] == Letter.Status.BURNED:
            fields["encrypted_content"] = None
            fields["images"] = None
            fields["encrypted_dek"] = None

        return fields

    def validate(self, data):
        """
        Validates the requirmnt of DEK when encrypted content and metadata are stored.
        """
        if (data.get("encrypted_content") or data.get("encrypted_metadata")) and not data.get("encrypted_dek"):
            raise serializers.ValidationError(
                "encrypted_dek is required when encrypted_content and encrypted_metadata are present"
            )
        if data.get("type") == Letter.Type.VAULT and not data.get("unlock_at"):
            raise serializers.ValidationError("unlock_at is required for vault letters")
        return data
