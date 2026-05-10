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