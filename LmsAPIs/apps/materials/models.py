from ckeditor_uploader.fields import RichTextUploadingField
from django.db import models
from cloudinary.models import CloudinaryField
from ckeditor.fields import RichTextField

from apps.common.models import BaseModel


class Material(BaseModel):
    class MaterialType(models.TextChoices):
        VIDEO = 'video', 'Video'
        PDF   = 'pdf',   'PDF'
        SLIDE = 'slide', 'Slide'

    class Difficulty(models.TextChoices):
        EASY   = 'easy',   'Dễ'
        MEDIUM = 'medium', 'Trung bình'
        HARD   = 'hard',   'Khó'

    title            = models.CharField(max_length=255)
    content = RichTextUploadingField(null=True, blank=True)
   
    file = CloudinaryField(
        'file',
        null=True,
        blank=True,
        resource_type='auto'
    )
    thumbnail = CloudinaryField(
        'thumbnail',
        null=True,
        blank=True
    )
    material_type    = models.CharField(max_length=20, choices=MaterialType.choices)
    difficulty       = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    duration_minutes = models.IntegerField(default=0)
    order_index      = models.IntegerField(default=0)

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='materials')
    tags = models.ManyToManyField('courses.Tag', blank=True, related_name='materials')

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return self.title


class MaterialProgress(BaseModel):
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Chưa học'
        IN_PROGRESS = 'in_progress', 'Đang học'
        COMPLETED   = 'completed',   'Hoàn thành'

    user     = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='material_progresses')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='progresses')

    status             = models.CharField(max_length=15, choices=Status.choices, default=Status.NOT_STARTED)
    progress_percent   = models.FloatField(default=0)
    watched_minutes    = models.IntegerField(default=0)
    last_position_sec  = models.IntegerField(default=0)  # resume video tại vị trí đã dừng
    last_accessed      = models.DateTimeField(auto_now=True)
    completed_at       = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'material')

    def __str__(self):
        return f"{self.user.username} — {self.material.title}"


class Interaction(BaseModel):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='%(class)ss')
    material = models.ForeignKey('materials.Material', on_delete=models.CASCADE, related_name='%(class)ss')

    class Meta:
        abstract = True


class Comment(Interaction):
    content = models.TextField()

    def __str__(self):
        return f"Comment by {self.user.username} on {self.material.title}"


class Note(Interaction):
    content = models.TextField()
    timestamp_sec = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Note by {self.user.username} at {self.timestamp_sec}s"
