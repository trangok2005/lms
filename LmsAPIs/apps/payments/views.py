from datetime import datetime

from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import  pagination
from .models import Transaction
from . import serializers
from apps.courses.models import Course, Enrollment
from django.db import transaction



class TransactionViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = serializers.TransactionSerializer
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
            return Response(
                {'detail': 'Thiếu course_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if payment_method not in Transaction.PaymentMethod.values:
            return Response(
                {'detail': f'payment_method phải là: {Transaction.PaymentMethod.values}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Khoá học không tồn tại.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # khóa miễn phí → dùng enroll API
        if course.price == 0:
            return Response(
                {'detail': 'Khoá học miễn phí. Hãy dùng API enroll.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # đã đăng ký rồi
        if Enrollment.objects.filter(
                user=request.user,
                course=course,
                is_active=True
        ).exists():
            return Response(
                {'detail': 'Bạn đã đăng ký khoá học này rồi.'},
                status=status.HTTP_200_OK
            )

        try:
            with transaction.atomic():

                # tạo transaction
                payment_transaction = Transaction.objects.create(
                    user=request.user,
                    course=course,
                    amount=course.price,
                    payment_method=payment_method,
                    status=Transaction.Status.SUCCESS,
                )

                # tạo enrollment
                Enrollment.objects.create(
                    user=request.user,
                    course=course,
                    status=Enrollment.Status.ACTIVE,
                    last_accessed=datetime.now(),
                    transaction=payment_transaction,
                )

        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'detail': 'Thanh toán thành công!',
            'transaction': serializers.TransactionSerializer(payment_transaction).data,
            'course_id': course.id,
            'course_name': course.subject,
        }, status=status.HTTP_201_CREATED)