from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentQuizViewSet

router = DefaultRouter()
# Khai báo router cho ViewSet của sinh viên
router.register(r'student/quizzes', StudentQuizViewSet, basename='student-quiz')

urlpatterns = [
    path('', include(router.urls)),
]