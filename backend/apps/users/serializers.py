from rest_framework import serializers
from .models import User

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'avatar', 'role']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.avatar and hasattr(instance.avatar, 'url'):
            data['avatar'] = instance.avatar.url
        return data


class UserSerializer(SimpleUserSerializer):
    current_level = serializers.CharField(
        source='profile.current_level',
        read_only=True
    )

    learning_goals = serializers.CharField(
        source='profile.learning_goals',
        read_only=True
    )

    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + [
            'username', 'password', 'email', 'current_level', 'learning_goals'
        ]
        extra_kwargs = {
            'password': {
                'write_only': True
            },
            'role': {
                'read_only': True
            }
        }

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(user.password)
        user.save()
        return user