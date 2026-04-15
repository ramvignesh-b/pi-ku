from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        """
        Specifies the public_id as readonly for the system to auto generate
        """

        model = User
        fields = ("public_id", "email", "full_name", "password")
        read_only_fields = ("public_id",)

    def create(self, validated_data):
        """
        Validates and creates a new user with the given data.
        """
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
        )
        return user
