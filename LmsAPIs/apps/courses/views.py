from pyasn1_modules.rfc3279 import tpBasis
from rest_framework import viewsets, generics, filters, status, parsers, permissions, mixins, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.courses.models import Course, Enrollment, ForumTopic, ForumReply, Category, Tag
from apps.courses import serializers, perms
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class BaseViewSet(viewsets.ViewSet,generics.ListCreateAPIView,generics.DestroyAPIView):
    class Meta:
        abstract = True

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [perms.IsAdmin]
        return [permission() for permission in permission_classes]


class CategoryViewSet(BaseViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer


class TagViewSet(BaseViewSet):
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = serializers.TagSerializer


# ════════════════════════════════════════════════════════════════
#  COURSE VIEWSET  — API 1 → 8
# ════════════════════════════════════════════════════════════════

class CourseViewSet(viewsets.ViewSet,
                    generics.ListCreateAPIView,
                    generics.RetrieveUpdateDestroyAPIView):

    queryset          = Course.objects.filter(is_active=True).select_related('teacher', 'category')
    serializer_class  = serializers.CourseSerializer
    pagination_class = pagination.PageNumberPagination
    filter_backends   = [filters.SearchFilter, filters.OrderingFilter]
    search_fields     = ['subject']
    ordering_fields   = ['id', 'price']

    # ── phân quyền động theo action ──
    def get_permissions(self):
        # API 1, 3 — public
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]

        # API 2 — Teacher / Admin mới tạo được
        if self.action == 'create':
            return [perms.IsTeacherOrAdmin()]

        # API 4, 5 — phải là chủ khoá hoặc Admin
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), perms.IsCourseOwnerOrAdmin()]

        # API 6, 7, 8 — đăng nhập
        return [permissions.IsAuthenticated()]

    # ── lọc query tham số URL ──
    def get_queryset(self):
        query = self.queryset

        q = self.request.query_params.get('q')
        if q:
            query = query.filter(subject__icontains=q)

        cate_id = self.request.query_params.get('category_id')
        if cate_id:
            query = query.filter(category_id=cate_id)

        level = self.request.query_params.get('level')
        if level:
            query = query.filter(level=level)

        return query

    # ── API 2: tự gán teacher = request.user khi tạo ──
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return serializers.CourseWriteSerializer
        return serializers.CourseSerializer

    # ── API 6: /api/courses/my-courses/ ──
    @action(methods=['get'], url_path='my-courses', detail=False)
    def my_courses(self, request):
        user = request.user
        sta = request.query_params.get('status')

        if user.role == 'admin':
            courses = Course.objects.filter(is_active=True)
            return Response(
                serializers.CourseSerializer(courses, many=True).data,
                status=status.HTTP_200_OK
            )

        if user.role == 'teacher':
            courses = Course.objects.filter(teacher=user, is_active=True)
            return Response(
                serializers.CourseSerializer(courses, many=True).data,
                status=status.HTTP_200_OK
            )

        # student — lấy từ Enrollment
        enrollments = Enrollment.objects.filter(user=user).select_related('course')

        if sta:
            enrollments =  enrollments.filter(status=sta)

        return Response(
            serializers.EnrollmentSerializer(enrollments, many=True).data,
            status=status.HTTP_200_OK
        )

    # ── API 7: /api/courses/{id}/enroll/ ──
    @action(methods=['post'], url_path='enroll', detail=True)
    def enroll(self, request, pk):
        user   = request.user
        course = self.get_object()

        if user.role in ('teacher', 'admin'):
            return Response(
                {'detail': 'Giảng viên và Admin không thể đăng ký học.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # kiểm tra đã enrolled chưa
        if Enrollment.objects.filter(user=user, course=course).exists():
            return Response(
                {'detail': 'Bạn đã đăng ký khoá học này rồi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # khoá có phí
        if float(course.price) > 0:
            return Response(
                {'detail': 'Khoá học này có phí. Vui lòng dùng API thanh toán /payments/pay/'},
                status=status.HTTP_400_BAD_REQUEST
            )


        enrollment = Enrollment.objects.create(user=user, course=course)
        return Response(
            serializers.EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )

    # ── API 8: /api/courses/{id}/students/ ──
    @action(methods=['get'], url_path='students', detail=True)
    def students(self, request, pk):
        course = self.get_object()
        user   = request.user

        if user.role == 'student':
            return Response(status=status.HTTP_403_FORBIDDEN)

        if user.role == 'teacher' and course.teacher_id != user.pk:
            return Response(status=status.HTTP_403_FORBIDDEN)

        enrollments = course.enrollments.select_related('user').filter(is_active=True)
        return Response(
            serializers.StudentProgressSerializer(enrollments, many=True).data,
            status=status.HTTP_200_OK
        )

    # ── API 9, 10: /api/courses/{id}/forum/ ──
    @action(methods=['get', 'post'], url_path='forum', detail=True,
            permission_classes=[permissions.IsAuthenticated, perms.IsForumParticipant])
    def forum(self, request, pk):
        course = self.get_object()

        if request.method == 'POST':
            s = serializers.ForumTopicSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            topic = s.save(user=request.user, course=course)
            return Response(
                serializers.ForumTopicSerializer(topic).data,
                status=status.HTTP_201_CREATED
            )

        topics = course.forum_topics.filter(is_active=True).select_related('user')
        return Response(
            serializers.ForumTopicSerializer(topics, many=True).data,
            status=status.HTTP_200_OK
        )


# ════════════════════════════════════════════════════════════════
#  FORUM VIEWSET  — API 11 → 13
# ════════════════════════════════════════════════════════════════

class ForumTopicViewSet(viewsets.ViewSet,
                        generics.RetrieveDestroyAPIView):
    """
    Router:
        /api/forum/{pk}/          → retrieve (API 11), destroy (API 13)
        /api/forum/{pk}/replies/  → replies  (API 12)
    """
    queryset         = ForumTopic.objects.filter(is_active=True).select_related('user', 'course')
    serializer_class = serializers.ForumTopicSerializer

    def get_permissions(self):
        if self.action == 'retrieve':
            return [permissions.IsAuthenticated(), perms.IsTopicParticipant()]

        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), perms.IsTopicOwnerOrCourseTeacherOrAdmin()]

        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return serializers.ForumTopicDetailSerializer
        return serializers.ForumTopicSerializer

    # ── API 13: check object-level permission trước khi xóa ──
    def destroy(self, request, *args, **kwargs):
        topic = self.get_object()
        self.check_object_permissions(request, topic)


        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'forum_{topic.pk}',
            {
                'type': 'send_new_reply',
                'reply': {'action': 'DELETE_TOPIC', 'topic_id': topic.pk}
            }
        )

        topic.is_active = False
        topic.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── API 12: /api/forum/{pk}/replies/ ──
    @action(methods=['get', 'post'], url_path='replies', detail=True)
    def replies(self, request, pk):
        topic = self.get_object()

        # kiểm tra quyền tham gia forum (dùng lại IsTopicParticipant)
        self.check_object_permissions(request, topic)

        if request.method == 'POST':
            s = serializers.ForumReplySerializer(data={
                'content': request.data.get('content'),
                'topic':   topic.pk,
            })
            s.is_valid(raise_exception=True)
            reply = s.save(user=request.user, topic=topic)

            reply_data = serializers.ForumReplySerializer(reply).data

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'forum_{topic.pk}',
                {
                    'type': 'send_new_reply',  # Tên hàm xử lý trong ForumConsumer
                    'reply': reply_data
                }
            )

            # topic_owner_id = topic.user_id
            #
            # if request.user.id != topic_owner_id:
            #     async_to_sync(channel_layer.group_send)(
            #         f'user_{topic_owner_id}',
            #         {
            #             'type': 'send_notification',
            #             'data': {
            #                 'notification_type': 'NEW_REPLY',
            #                 'title': 'Phản hồi mới trong Forum 💬',
            #                 'message': f'{request.user.username} đã trả lời bài viết "{topic.title}" của bạn.',
            #                 'forum_id': topic.pk,
            #                 'badge_count': 1
            #             }
            #         }
            #     )

            return Response(
                serializers.ForumReplySerializer(reply).data,
                status=status.HTTP_201_CREATED
            )

        replies = topic.replies.filter(is_active=True).select_related('user')
        return Response(
            serializers.ForumReplySerializer(replies, many=True).data,
            status=status.HTTP_200_OK
        )

class ForumReplyViewSet(viewsets.GenericViewSet, mixins.DestroyModelMixin):
    queryset = ForumReply.objects.filter(is_active=True)
    serializer_class = serializers.ForumReplySerializer
    permission_classes = [perms.IsTopicOwnerOrCourseTeacherOrAdmin]

    def destroy(self, request, *args, **kwargs):
        reply = self.get_object()
        self.check_object_permissions(request, reply)
        reply.is_active = False
        reply.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'forum_{reply.topic_id}',  # Gửi vào đúng phòng thảo luận chứa bình luận này
            {
                'type': 'send_new_reply',
                'reply': {'action': 'DELETE_REPLY', 'reply_id': reply.pk}
            }
        )

        return Response(status=status.HTTP_204_NO_CONTENT)