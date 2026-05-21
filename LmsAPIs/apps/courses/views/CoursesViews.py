from rest_framework import viewsets, permissions, parsers, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from apps.courses.models import Category, Tag, Course, Enrollment
from apps.courses.serializers import CoursesSerializers
from apps.common import perms


class BaseViewSet(viewsets.ModelViewSet):
    class Meta:
        abstract = True

    def get_permissions(self):
        # if self.action in ['list', 'retrieve']:
        #     permission_classes = [permissions.AllowAny]
        # elif self.action == 'create':
        #     permission_classes = [permissions.IsAuthenticated]
        # else:
        #     permission_classes = [perms.IsAdmin]
        # return [permission() for permission in permission_classes]
        return [permissions.AllowAny()]


class CategoryViewSet(BaseViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CoursesSerializers.CategorySerializer


class TagViewSet(BaseViewSet):
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = CoursesSerializers.TagSerializer


class CourseViewSet(BaseViewSet):
    serializer_class = CoursesSerializers.CourseSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    def get_queryset(self):
        # Sử dụng select_related và prefetch_related để tối ưu hóa truy vấn SQL (Tránh lỗi N+1)
        queryset = (Course.objects
                    .filter(is_active=True)
                    .select_related('category', 'teacher')
                    .prefetch_related('tags', 'enrollments', 'materials'))

        # ?category=  -> Lọc theo danh mục khóa học
        if category_id := self.request.query_params.get('category'):
            queryset = queryset.filter(category_id=category_id)

        # ?level= -> Lọc theo cấp độ học (beginner | intermediate | advanced)
        if level := self.request.query_params.get('level'):
            queryset = queryset.filter(level=level)

        # ?tag= -> Lọc theo ID của tag thương hiệu/nhãn
        if tag_id := self.request.query_params.get('tag'):
            queryset = queryset.filter(tags__id=tag_id)

        # ?q= hoặc ?keyword= -> Tìm kiếm toàn văn theo tiêu đề hoặc mô tả khóa học
        q = self.request.query_params.get('q') or self.request.query_params.get('keyword')
        if q:
            queryset = queryset.filter(
                Q(subject__icontains=q) | Q(description__icontains=q)
            )

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        # Ràng buộc nghiệp vụ: chỉ tài khoản có role là giảng viên mới được tạo khóa học mới
        if request.user.role != 'teacher':
            return Response(
                {'detail': 'Chỉ giảng viên mới được tạo khoá học.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CoursesSerializers.CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save(teacher=request.user)
        return Response(CoursesSerializers.CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class EnrollmentViewSet( mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):
    serializer_class = CoursesSerializers.EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Enrollment.objects.none()

        return (Enrollment.objects
                .filter(user=self.request.user, is_active=True)
                .select_related('course', 'course__teacher', 'course__category')
                .prefetch_related('course__tags'))

    # ── GET /courses/enrollments/ ─────────────────────────
    def list(self, request):
        qs = self.get_queryset()
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)
        return Response(self.get_serializer(qs, many=True).data)

    # ── POST /courses/enrollments/ ────────────────────────
    def create(self, request):
        print(request.user)
        print(request.user.is_authenticated)

        course_id = request.data.get('course')
        if not course_id:
            return Response({'detail': 'Thiếu course id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'detail': 'Khoá học không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)

        # Ràng buộc thanh toán: Khoá học có phí phải kiểm tra đã giao dịch thành công chưa
        if float(course.price) > 0:
            from apps.payments.models import Transaction
            paid = Transaction.objects.filter(
                user=request.user, course=course, status='success'
            ).exists()
            if not paid:
                return Response(
                    {'detail': 'Vui lòng thanh toán trước khi đăng ký.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

        enrollment, created = Enrollment.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={
                'status': Enrollment.Status.ACTIVE,
                'last_accessed': timezone.now(),
            }
        )

        if not created:
            return Response(
                {'detail': 'Bạn đã đăng ký khoá học này rồi.',
                 'enrollment': self.get_serializer(enrollment).data},
                status=status.HTTP_200_OK
            )

        return Response(self.get_serializer(enrollment).data, status=status.HTTP_201_CREATED)

    # ── GET /courses/enrollments/me/ ──────────────────────
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        qs = self.get_queryset()
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)

        # Cập nhật thời gian tương tác (last_accessed) cho các khóa học đang hoạt động liên tục
        qs.filter(status=Enrollment.Status.ACTIVE).update(last_accessed=timezone.now())
        return Response(self.get_serializer(qs, many=True).data)

    # ── GET /courses/enrollments/{id}/ ────────────────────
    def retrieve(self, request, pk=None):
        try:
            enrollment = self.get_queryset().get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(enrollment).data)

    # ── PATCH /courses/enrollments/{id}/progress/ ─────────
    @action(detail=True, methods=['patch'], url_path='progress')
    def update_progress(self, request, pk=None):
        try:
            enrollment = self.get_queryset().get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        percent = request.data.get('progress_percent')
        if percent is None:
            return Response({'detail': 'Thiếu progress_percent.'}, status=status.HTTP_400_BAD_REQUEST)

        enrollment.progress_percent = float(percent)
        enrollment.last_accessed = timezone.now()

        # Nghiệp vụ tự động cập nhật trạng thái khi học viên hoàn thành lộ trình 100%
        if enrollment.progress_percent >= 100:
            enrollment.status = Enrollment.Status.COMPLETED
            enrollment.completed_at = timezone.now()

        enrollment.save()
        return Response(self.get_serializer(enrollment).data)