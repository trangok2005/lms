from rest_framework import serializers
from apps.courses.models import ForumTopic, ForumReply
from apps.users.serializers import SimpleUserSerializer


class ForumReplySerializer(serializers.ModelSerializer):
    user         = SimpleUserSerializer(read_only=True)
    reply_count  = serializers.SerializerMethodField()

    class Meta:
        model  = ForumReply
        fields = ['id', 'user', 'content', 'created_date', 'reply_count']
        read_only_fields = ['user']

    def get_reply_count(self, obj):
        return 0  # ForumReply không nest thêm — placeholder


class ForumTopicSerializer(serializers.ModelSerializer):
    user        = SimpleUserSerializer(read_only=True)
    course_name = serializers.CharField(source='course.subject', read_only=True)
    reply_count = serializers.SerializerMethodField()
    # Ghi: chỉ nhận course id
    course      = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.courses.models', fromlist=['Course']).Course.objects.filter(is_active=True)
    )

    class Meta:
        model  = ForumTopic
        fields = ['id', 'user', 'course', 'course_name', 'title', 'content', 'reply_count', 'created_date']
        read_only_fields = ['user']

    def get_reply_count(self, obj):
        return obj.replies.filter(is_active=True).count()


class ForumTopicDetailSerializer(ForumTopicSerializer):
    """Dùng khi xem chi tiết — nhúng thêm danh sách replies"""
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta(ForumTopicSerializer.Meta):
        fields = ForumTopicSerializer.Meta.fields + ['replies']
