from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  MaterialViewSet,CommentViewSet,NoteViewSet

router = DefaultRouter()
router.register(r'Material', MaterialViewSet, basename='Material')

router.register('comments',CommentViewSet,basename='comment')
router.register('notes',NoteViewSet,basename='note')


urlpatterns = [
    path('', include(router.urls)),
]
