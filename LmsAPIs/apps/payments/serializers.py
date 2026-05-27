from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.subject', read_only=True)
    course_image = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'course', 'course_name', 'course_image',
            'amount', 'payment_method', 'status', 'created_date',
        ]
        read_only_fields = ['status', 'amount', 'user']

    def get_course_image(self, obj):
        if obj.course.image and hasattr(obj.course.image, 'url'):
            return obj.course.image.url
        return None

class DummySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_transactions = serializers.IntegerField()