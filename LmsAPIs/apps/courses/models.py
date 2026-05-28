from django.db import models
from cloudinary.models import CloudinaryField
from ckeditor.fields import RichTextField
from apps.common.models import BaseModel


class Category(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class Tag(BaseModel):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Course(BaseModel):
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Dễ'
        INTERMEDIATE = 'intermediate', 'Trung bình'
        ADVANCED = 'advanced', 'Nâng cao'

    subject = models.CharField(max_length=255)
    description = RichTextField(null=True, blank=True)
    image = CloudinaryField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    level = models.CharField(max_length=15, choices=Level.choices, default=Level.BEGINNER)

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='teaching_courses')
    tags = models.ManyToManyField(Tag, blank=True, related_name='courses')
    students = models.ManyToManyField('users.User', through='courses.Enrollment', related_name='joined_courses')

    # ai
    is_ai_generated = models.BooleanField(default=False)
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True,related_name='ai_courses')
    ai_goal = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.subject


class Enrollment(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Đang học'
        COMPLETED = 'completed', 'Hoàn thành'
        DROPPED = 'dropped', 'Đã bỏ'

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    progress_percent = models.FloatField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(null=True, blank=True)

    transaction = models.ForeignKey('payments.Transaction', on_delete=models.SET_NULL,
                                    null=True, blank=True,related_name='enrollments')

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.username} — {self.course.subject}"

class ForumTopic(BaseModel):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='forum_topics')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='forum_topics')
    title = models.CharField(max_length=255)
    content = models.TextField()

    def __str__(self):
        return self.title


class ForumReply(BaseModel):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='forum_replies')
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()

    def __str__(self):
        return f"Reply by {self.user.username} on {self.topic.title}"