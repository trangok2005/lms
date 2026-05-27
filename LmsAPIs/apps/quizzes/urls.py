from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import StudentQuizViewSet, TeacherQuizViewSet, TeacherQuestionViewSet, TeacherStudentViewSet

router = DefaultRouter()

router.register(r'student/quizzes',   StudentQuizViewSet,   basename='student-quiz')
router.register(r'teacher/quizzes',   TeacherQuizViewSet,   basename='teacher-quiz')
router.register(r'teacher/students',  TeacherStudentViewSet, basename='teacher-student')


quizzes_router = nested_routers.NestedDefaultRouter(router, r'teacher/quizzes', lookup='quiz')
quizzes_router.register(r'questions', TeacherQuestionViewSet, basename='teacher-quiz-questions')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(quizzes_router.urls)),
]