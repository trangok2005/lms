from rest_framework import serializers
from apps.courses.models import Category, Tag, Course, Enrollment
from apps.users.serializers import SimpleUserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name', 'description']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'name']


class CourseSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(is_active=True))
    tags     = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.filter(is_active=True), many=True, required=False)
    teacher  = SimpleUserSerializer(read_only=True)
    student_count  = serializers.SerializerMethodField()
    material_count = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = [
            'id', 'subject', 'description', 'image', 'price',
            'level', 'category', 'teacher', 'tags',
            'student_count', 'material_count', 'created_date',
        ]

    def get_student_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()

    def get_material_count(self, obj):
        return obj.materials.filter(is_active=True).count()

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image and hasattr(instance.image, 'url'):
            data['image'] = instance.image.url

        if instance.category:
            data['category'] = CategorySerializer(instance.category).data

        data['tags'] = TagSerializer(instance.tags.all(), many=True).data

        return data


class EnrollmentSerializer(serializers.ModelSerializer):
    # Nhúng info khoá học vào response — FE khỏi gọi thêm API
    course_name  = serializers.CharField(source='course.subject', read_only=True)
    course_image = serializers.SerializerMethodField()
    course_level = serializers.CharField(source='course.level',   read_only=True)
    course_price = serializers.DecimalField(
        source='course.price', max_digits=10, decimal_places=2, read_only=True
    )
    # Write: chỉ nhận course id khi tạo
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.filter(is_active=True))

    class Meta:
        model  = Enrollment
        fields = [
            'id', 'course', 'course_name', 'course_image', 'course_level', 'course_price',
            'status', 'progress_percent', 'completed_at', 'last_accessed', 'created_date',
        ]
        read_only_fields = ['status', 'progress_percent', 'completed_at', 'last_accessed']

    def get_course_image(self, obj):
        if obj.course.image and hasattr(obj.course.image, 'url'):
            return obj.course.image.url
        return None