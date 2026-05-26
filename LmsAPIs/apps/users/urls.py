from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from apps.users import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register('notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]