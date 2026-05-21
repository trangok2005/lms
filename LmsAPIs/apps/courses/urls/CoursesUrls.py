from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.courses.views.CoursesViews import CategoryViewSet, TagViewSet, CourseViewSet, EnrollmentViewSet

router = DefaultRouter()

router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'tags', TagViewSet, basename='tags')
router.register(r'category', CategoryViewSet, basename='categories')
router.register(r'', CourseViewSet, basename='courses')

urlpatterns = [
    path('', include(router.urls)),
]