from rest_framework import serializers
from .models import Category, Tag, Course
from apps.users.serializers import SimpleUserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class CourseSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(is_active=True))
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.filter(is_active=True), many=True, required=False)
    teacher = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'subject', 'description', 'image', 'price', 'level', 'category', 'teacher', 'tags',
                  'created_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image and hasattr(instance.image, 'url'):
            data['image'] = instance.image.url

        if instance.category:
            data['category'] = CategorySerializer(instance.category).data

        if instance.tags.exists():
            data['tags'] = TagSerializer(instance.tags.all(), many=True).data
        else:
            data['tags'] = []

        return data