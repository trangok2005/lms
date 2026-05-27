from rest_framework import serializers
from apps.courses.models import Category, Tag, Course, Enrollment, ForumTopic, ForumReply
from apps.users.serializers import SimpleUserSerializer
from django.db.models import Sum
from apps.materials.models import MaterialProgress,Material


# ───────────────────────────── BASE ─────────────────────────────

class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance, 'image') and instance.image:
            data['image'] = instance.image.url
        return data


# ───────────────────────────── CATEGORY & TAG ─────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


# ───────────────────────────── COURSE ─────────────────────────────

class CourseSerializer(ItemSerializer):
    tags     = TagSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    teacher  = SimpleUserSerializer(read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = ['id', 'subject', 'description', 'image',
                  'price', 'level', 'category', 'teacher', 'tags', 'is_active','students_count']

    def get_students_count(self, obj):

        return obj.enrollments.filter(is_active=True).count()

class CourseWriteSerializer(ItemSerializer):
    """Dùng riêng cho POST / PUT / PATCH — nhận id thay vì nested object."""
    class Meta:
        model  = Course
        fields = ['subject', 'description', 'image',
                  'price', 'level', 'category', 'tags']


# ───────────────────────────── ENROLLMENT ─────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    study_minutes = serializers.SerializerMethodField()
    viewed_materials = serializers.SerializerMethodField()
    total_materials = serializers.SerializerMethodField()
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'course',
            'status',
            'progress_percent',
            'completed_at',
            'last_accessed',

            'study_minutes',
            'viewed_materials',
            'total_materials',
        ]

    def get_study_minutes(self, obj):
        total = MaterialProgress.objects.filter(
            user=obj.user,
            material__course=obj.course
        ).aggregate(
            total=Sum('watched_minutes')
        )['total'] or 0

        return round(total)

    def get_viewed_materials(self, obj):
        return MaterialProgress.objects.filter(
            user=obj.user,
            material__course=obj.course
        ).exclude(
            status=MaterialProgress.Status.NOT_STARTED
        ).values('material').distinct().count()
    def get_total_materials(self, obj):
        return Material.objects.filter(
            course=obj.course
        ).count()
class StudentProgressSerializer(serializers.ModelSerializer):
    """Dùng cho API 8 — Teacher / Admin xem tiến độ học viên trong 1 khoá."""
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model  = Enrollment
        fields = ['user', 'status', 'progress_percent', 'completed_at', 'last_accessed']


# ───────────────────────────── FORUM ─────────────────────────────

class ForumReplySerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model  = ForumReply
        fields = ['id', 'user', 'content', 'created_date']
        extra_kwargs = {
            'topic': {'write_only': True}
        }


class ForumTopicSerializer(serializers.ModelSerializer):
    user         = SimpleUserSerializer(read_only=True)
    reply_count  = serializers.SerializerMethodField()

    class Meta:
        model  = ForumTopic
        fields = ['id', 'user', 'title', 'content', 'reply_count', 'created_date']

    def get_reply_count(self, obj):
        return obj.replies.filter(is_active=True).count()


class ForumTopicDetailSerializer(ForumTopicSerializer):
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta:
        model  = ForumTopicSerializer.Meta.model
        fields = ForumTopicSerializer.Meta.fields + ['replies']

