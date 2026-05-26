from datetime import datetime
from django.db import transaction
from django.db.models import Sum, Count, Q

from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import pagination

# Import các bản ghi đúng cấu trúc thư mục của ông
from .models import Transaction
from . import serializers
from apps.courses.models import Course, Enrollment
from apps.common.perms import IsAdmin
from apps.users.models import User



class TransactionViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = serializers.TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        queryset = (Transaction.objects
                    .filter(user=self.request.user, is_active=True)
                    .select_related('course')
                    .order_by('-created_date'))

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    @action(methods=['post'], url_path='pay', detail=False)
    def pay(self, request):
        course_id = request.data.get('course_id')
        payment_method = request.data.get('payment_method')

        if not course_id:
            return Response({'detail': 'Thiếu course_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method not in Transaction.PaymentMethod.values:
            return Response(
                {'detail': f'payment_method phải là: {Transaction.PaymentMethod.values}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'detail': 'Khoá học không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)

        if course.price == 0:
            return Response({'detail': 'Khoá học miễn phí. Hãy dùng API enroll.'}, status=status.HTTP_400_BAD_REQUEST)

        if Enrollment.objects.filter(user=request.user, course=course, is_active=True).exists():
            return Response({'detail': 'Bạn đã đăng ký khoá học này rồi.'}, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                payment_transaction = Transaction.objects.create(
                    user=request.user,
                    course=course,
                    amount=course.price,
                    payment_method=payment_method,
                    status=Transaction.Status.SUCCESS,
                )

                Enrollment.objects.create(
                    user=request.user,
                    course=course,
                    status=Enrollment.Status.ACTIVE,
                    last_accessed=datetime.now(),
                    transaction=payment_transaction,
                )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'detail': 'Thanh toán thành công!',
            'transaction': serializers.TransactionSerializer(payment_transaction).data,
            'course_id': course.id,
            'course_name': course.subject,
        }, status=status.HTTP_201_CREATED)


class AdminTransactionViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = serializers.TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        qs = Transaction.objects.filter(is_active=True).select_related('course', 'user')

        query = self.request.query_params.get('q')
        if query:
            qs = qs.filter(
                Q(id__icontains=query) |
                Q(user__username__icontains=query) |
                Q(user__email__icontains=query) |
                Q(course__subject__icontains=query)
            )

        # Các bộ lọc phân loại tĩnh
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        method_param = self.request.query_params.get('method')
        if method_param:
            qs = qs.filter(payment_method=method_param)

        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)

        # Bộ lọc mốc thời gian báo cáo
        date_from = self.request.query_params.get('from')
        if date_from:
            qs = qs.filter(created_date__date__gte=date_from)

        date_to = self.request.query_params.get('to')
        if date_to:
            qs = qs.filter(created_date__date__lte=date_to)

        return qs.order_by('-id')

    def destroy(self, request, *args, **kwargs):
        """ API Xóa mềm giao dịch """
        try:
            instance = Transaction.objects.get(pk=kwargs.get('pk'), is_active=True)
            instance.is_active = False
            instance.save()
            return Response({"detail": "Xóa giao dịch thành công!"}, status=status.HTTP_204_NO_CONTENT)
        except Transaction.DoesNotExist:
            return Response({"detail": "Không tìm thấy giao dịch."}, status=status.HTTP_404_NOT_FOUND)

    # GET /admin/transactions/stats/
    @action(methods=['get'], url_path='stats', detail=False)
    def stats(self, request):
        qs = Transaction.objects.filter(is_active=True)

        # Áp bộ lọc thời gian
        date_from = request.query_params.get('from')
        if date_from:
            qs = qs.filter(created_date__date__gte=date_from)

        date_to = request.query_params.get('to')
        if date_to:
            qs = qs.filter(created_date__date__lte=date_to)

        #
        aggregated_data = qs.aggregate(
            total_transactions=Count('id'),  # Tính tổng số đơn hàng bằng SQL Count
            total_revenue=Sum('amount', filter=Q(status=Transaction.Status.SUCCESS)),
            # Chỉ tính Sum số tiền của đơn thành công
            total_success=Count('id', filter=Q(status=Transaction.Status.SUCCESS))  # Chỉ Count số lượng đơn thành công
        )

        # Phân tích doanh số theo Cổng thanh toán
        by_method = (qs.filter(status=Transaction.Status.SUCCESS)
                     .values('payment_method')
                     .annotate(count=Count('id'), revenue=Sum('amount'))
                     .order_by('-revenue'))

        top_method = by_method[0]['payment_method'] if by_method.exists() else "N/A"

        # Phân tích theo trạng thái hóa đơn hàng
        by_status = (qs.values('status')
                     .annotate(count=Count('id'))
                     .order_by('status'))

        return Response({
            'total_revenue': aggregated_data['total_revenue'] or 0,
            'total_success': aggregated_data['total_success'] or 0,
            'total_transactions': aggregated_data['total_transactions'] or 0,
            'count': aggregated_data['total_transactions'] or 0,  # Đồng bộ biến destructuring trên Mobile
            'top_method': top_method,
            'by_method': list(by_method),
            'by_status': list(by_status),
        }, status=status.HTTP_200_OK)


class AdminOverviewView(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = serializers.DummySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


    def list(self, request, *args, **kwargs):
        return self._generate_overview_response()

    def get(self, request, *args, **kwargs):
        return self._generate_overview_response()

    def _generate_overview_response(self):
        # from django.contrib.auth import get_user_model
        # User = get_user_model()

        # Tính tổng số lượng user hệ thống bằng SQL Count
        user_stats = User.objects.aggregate(total_users=Count('id'))

        # Nhóm đếm quyền hạn người dùng
        role_stats = User.objects.values('role').annotate(count=Count('id'))
        role_map = {r['role']: r['count'] for r in role_stats}

        # Đếm thực thể khóa học & số lượt đăng ký ghi danh học tập
        total_courses = Course.objects.filter(is_active=True).count()
        total_enrollments = Enrollment.objects.filter(is_active=True).count()

        # Tính toán dòng tài chính thực tế bằng SQL Aggregation gộp
        payment_stats = Transaction.objects.filter(
            status=Transaction.Status.SUCCESS
        ).aggregate(
            total_revenue=Sum('amount'),
            total_transactions=Count('id'),
        )

        return Response({
            'total_users': user_stats['total_users'] or 0,
            'total_teachers': role_map.get('teacher', 0) or role_map.get('TEACHER', 0) or 0,
            'total_students': role_map.get('student', 0) or role_map.get('STUDENT', 0) or 0,
            'total_courses': total_courses,
            'total_enrollments': total_enrollments,
            'total_revenue': payment_stats['total_revenue'] or 0,
            'total_transactions': payment_stats['total_transactions'] or 0,
        }, status=status.HTTP_200_OK)