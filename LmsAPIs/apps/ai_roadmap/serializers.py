from rest_framework import serializers
from apps.courses.models import Course

# Buoc 1: Validate du lieu dau vao tu client de gui len AI
class GenerateAIRoadmapSerializer(serializers.Serializer):
    goal = serializers.CharField(max_length=200)
    level = serializers.CharField(max_length=50)
    hours_per_week = serializers.IntegerField(min_value=1, max_value=168)

# Buoc 2: Validate cấu trúc lộ trình nguoi dung da tinh chinh truoc khi luu
class SaveAIRoadmapSerializer(serializers.Serializer):
    course_title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    goal = serializers.CharField(max_length=255)
    level = serializers.CharField(max_length=50)
    material_ids = serializers.ListField(child=serializers.IntegerField())
    # Xac nhan nguoi dung da hoan tat luong thanh toan tu phia Frontend
    payment_confirmed = serializers.BooleanField(default=False, required=False)

    # Chon loc va kiem tra dieu kien toi thieu phai co 4 bai hoc
    def validate_material_ids(self, value):
        if len(value) < 4:
            raise serializers.ValidationError("Lo luong hoc tap phai chua toi thieu 4 bai hoc.")
        return value

# Tra ve thong tin khoa hoc sau khi ghi vao co so du lieu thanh cong
class AICourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'subject', 'description', 'level', 'is_ai_generated', 'ai_goal', 'price']