from django.db import models
from apps.common.models import BaseModel


class Quiz(BaseModel):
    title = models.CharField(max_length=255)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='quizzes')
    time_limit = models.IntegerField(null=True, blank=True)
    passing_score = models.FloatField(default=50.0)  # % để qua mon
    def __str__(self):
        return self.title


class Question(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField()
    points = models.FloatField(default=1.0)  # Điểm của câu này

    def __str__(self):
        return self.content


class Answer(BaseModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    content = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.content


class TestResult(BaseModel):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='test_results')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='results')

    score = models.FloatField()  # Điểm thực tế đạt được
    percentage = models.FloatField()  # % = score / tổng điểm
    is_passed = models.BooleanField(default=False)

   #thay cho bảng sudentAnswer
    submitted_answers = models.JSONField(null=True, blank=True)

    # AI để sau cùng đi
    strength_analysis = models.TextField(null=True, blank=True)
    weakness_analysis = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} - {self.score} điểm"