from django.db import models
from apps.common.models import BaseModel


class Transaction(BaseModel):
    class PaymentMethod(models.TextChoices):
        VNPAY = 'vnpay', 'VNPay'
        MOMO = 'momo', 'MoMo'
        FREE = 'free', 'Miễn phí'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Đang xử lý'
        SUCCESS = 'success', 'Thành công'
        FAILED = 'failed', 'Thất bại'

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='transactions')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='transactions')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.FREE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    #còn tg làm momo
    # Mã đơn hàng gửi sang cổng thanh toán (VD: ORDER_12345)
    transaction_code = models.CharField(max_length=100, unique=True)
    # Lưu response thô từ cổng thanh toán gửi về — cực kỳ quan trọng để debug
    gateway_response = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.transaction_code} - {self.user.username} - {self.status}"