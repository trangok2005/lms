from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from apps.courses.models import ForumTopic, ForumReply
from apps.common import views as common_views
from apps.courses.serializers import ForumSerializers


class ForumTopicViewSet(common_views.BaseViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ForumSerializers.ForumTopicDetailSerializer
        return ForumSerializers.ForumTopicSerializer

    def get_queryset(self):
        qs = (ForumTopic.objects
              .filter(is_active=True)
              .select_related('user', 'course')
              .prefetch_related('replies'))

        # ?course=  lọc theo course id
        if course_id := self.request.query_params.get('course'):
            qs = qs.filter(course_id=course_id)

        # ?q=  tìm theo tiêu đề hoặc nội dung
        if q := self.request.query_params.get('q'):
            qs = qs.filter(Q(title__icontains=q) | Q(content__icontains=q))

        return qs.order_by('-created_date')

    def create(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = ForumSerializers.ForumTopicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        topic = serializer.save(user=request.user)
        return Response(ForumSerializers.ForumTopicSerializer(topic).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            topic = ForumTopic.objects.get(pk=pk, is_active=True)
        except ForumTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if topic.user != request.user and request.user.role != 'admin':
            return Response({'detail': 'Không có quyền xoá.'}, status=status.HTTP_403_FORBIDDEN)
        topic.is_active = False
        topic.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # POST /forum/topics/{id}/reply/
    @action(detail=True, methods=['post'], url_path='reply',
            permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        try:
            topic = ForumTopic.objects.get(pk=pk, is_active=True)
        except ForumTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'detail': 'Nội dung không được trống.'}, status=status.HTTP_400_BAD_REQUEST)

        reply = ForumReply.objects.create(
            user=request.user,
            topic=topic,
            content=content,
        )
        return Response(ForumSerializers.ForumReplySerializer(reply).data, status=status.HTTP_201_CREATED)


class ForumReplyViewSet(common_views.BaseViewSet):
    """
    DELETE /forum/replies/{id}/   → xoá reply (chỉ chủ reply)
    """
    serializer_class   = ForumSerializers.ForumReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ForumReply.objects.filter(is_active=True).select_related('user', 'topic')

    def destroy(self, request, pk=None):
        try:
            reply = self.get_queryset().get(pk=pk)
        except ForumReply.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if reply.user != request.user and request.user.role != 'admin':
            return Response({'detail': 'Không có quyền xoá.'}, status=status.HTTP_403_FORBIDDEN)
        reply.is_active = False
        reply.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
