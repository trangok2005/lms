from rest_framework import serializers
from apps.courses.models import Category, Tag, Course, Enrollment, ForumTopic, ForumReply


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
        fields = ['id', 'name', 'description']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


# ───────────────────────────── USER (nhúng vào response) ─────────────────────────────

class UserInlineSerializer(serializers.Serializer):
    id       = serializers.IntegerField()
    username = serializers.CharField()
    avatar   = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None


# ───────────────────────────── COURSE ─────────────────────────────

class CourseSerializer(ItemSerializer):
    tags     = TagSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    teacher  = UserInlineSerializer(read_only=True)

    class Meta:
        model  = Course
        fields = ['id', 'subject', 'description', 'image',
                  'price', 'level', 'category', 'teacher', 'tags', 'is_active']


class CourseWriteSerializer(ItemSerializer):
    """Dùng riêng cho POST / PUT / PATCH — nhận id thay vì nested object."""
    class Meta:
        model  = Course
        fields = ['subject', 'description', 'image',
                  'price', 'level', 'category', 'tags']


# ───────────────────────────── ENROLLMENT ─────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model  = Enrollment
        fields = ['id', 'course', 'status', 'progress_percent',
                  'completed_at', 'last_accessed']


class StudentProgressSerializer(serializers.ModelSerializer):
    """Dùng cho API 8 — Teacher / Admin xem tiến độ học viên trong 1 khoá."""
    user = UserInlineSerializer(read_only=True)

    class Meta:
        model  = Enrollment
        fields = ['user', 'status', 'progress_percent', 'completed_at', 'last_accessed']


# ───────────────────────────── FORUM ─────────────────────────────

class ForumReplySerializer(serializers.ModelSerializer):
    user = UserInlineSerializer(read_only=True)

    class Meta:
        model  = ForumReply
        fields = ['id', 'user', 'content', 'created_date']
        extra_kwargs = {
            'topic': {'write_only': True}
        }


class ForumTopicSerializer(serializers.ModelSerializer):
    user         = UserInlineSerializer(read_only=True)
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

