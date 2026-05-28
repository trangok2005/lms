from rest_framework import serializers
from .models import User, StudentProfile, Notification
import re

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['current_level', 'learning_goals', 'total_hours', 'average_score']


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
    profile = StudentProfileSerializer(required=False)

    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + [
            'username', 'password', 'email', 'profile'
        ]
        extra_kwargs = {
            'password': {
                'write_only': True
            },
            'role': {
                'read_only': True
            },
            'email': {
                'required': True,
                'error_messages': {
                    'invalid': 'Địa chỉ email không đúng định dạng (Ví dụ: user@gmail.com).',
                    'blank': 'Vui lòng nhập địa chỉ email.',
                }
            },
        }

    def validate_username(self, value):
        if len(value) < 4:
            raise serializers.ValidationError("Tên đăng nhập phải chứa ít nhất 4 ký tự.")
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Tên đăng nhập không được chứa ký tự đặc biệt hoặc khoảng trắng.")
        return value


    def validate_password(self, value):
        #dài
        if len(value) < 8:
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 8 ký tự.")

        #chỉ số
        if value.isdigit():
            raise serializers.ValidationError("Mật khẩu không được chỉ chứa toàn chữ số.")

        #chỉ chữ
        if value.isalpha():
            raise serializers.ValidationError(
                "Mật khẩu không được chỉ chứa toàn chữ cái.")

        #trùng username
        username = self.initial_data.get('username')
        if username and value == username:
            raise serializers.ValidationError("Mật khẩu không được trùng với tên đăng nhập.")

        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.role != User.Role.STUDENT:
            data.pop('profile', None)

        elif not hasattr(instance, 'profile'):
            data.pop('profile', None)

        return data

    def create(self, validated_data):
        # user
        validated_data['role'] = User.Role.STUDENT
        profile_data = validated_data.pop('profile', {})

        # print(profile_data.get('current_level'))
        # print(profile_data.get('learning_goals'))
        user = User(**validated_data)
        user.set_password(user.password)
        user.save()

        # profile
        StudentProfile.objects.create(user=user,
              current_level=profile_data.get('current_level', StudentProfile.Level.BEGINNER),
              learning_goals=profile_data.get('learning_goals', ''))

        return user


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data',
                  'is_read', 'forum_id', 'created_date']
        read_only_fields = ['forum_id']