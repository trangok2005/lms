from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  MaterialViewSet,CommentViewSet,NoteViewSet,MaterialProgressViewSet

router = DefaultRouter()
router.register(r'Material', MaterialViewSet, basename='Material')
router.register('progress',MaterialProgressViewSet,basename='progress')
router.register('comments',CommentViewSet,basename='comment')
router.register('notes',NoteViewSet,basename='note')


urlpatterns = [
    path('', include(router.urls)),
]
