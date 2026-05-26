from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

from apps.common.models import BaseModel


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN   = 'admin',   'Admin'
        TEACHER = 'teacher', 'Teacher'
        STUDENT = 'student', 'Student'

    role   = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    avatar = CloudinaryField(null=True, blank=True)

    def __str__(self):
        return self.username


class StudentProfile(BaseModel):
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Người mới'
        INTERMEDIATE = 'intermediate', 'Trung cấp'
        ADVANCED = 'advanced', 'Nâng cao'

    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='profile')
    current_level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    learning_goals = models.TextField(null=True, blank=True)
    total_hours = models.FloatField(default=0)
    average_score = models.FloatField(default=0)

    def __str__(self):
        return f"{self.user.username} - Profile"

class Notification(BaseModel):

    class NotificationType(models.TextChoices):
        NEW_REPLY = 'NEW_REPLY', 'Có người reply bài thảo luận'
        NEW_QUIZ  = 'NEW_QUIZ',  'Bài kiểm tra mới'

    user = models.ForeignKey('users.User', on_delete=models.CASCADE,related_name='notifications')

    notification_type = models.CharField(max_length=20, choices=NotificationType.choices,default=NotificationType.NEW_REPLY)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)

    data = models.JSONField(null=True, blank=True, default=dict)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_date']
        indexes = [models.Index(fields=['user', 'is_read'])]

    def __str__(self):
        return f"[{self.notification_type}] {self.user.username} — {self.title}"

    #PROPERTY HELPER: Tạo đường tắt lấy nhanh forum_id từ cục JSON data ra ngoài
    @property
    def forum_id(self):
        if self.data and isinstance(self.data, dict):
            return self.data.get('forum_id') or self.data.get('topic_id')
        return None

    #CLASSMETHOD HELPER: Tính tổng số badge chưa đọc của user bất kỳ lúc nào
    @classmethod
    def get_unread_count(cls, user_id):
        return cls.objects.filter(user_id=user_id, is_read=False).count()