from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  MaterialViewSet

router = DefaultRouter()
router.register(r'Material', MaterialViewSet, basename='Material')


urlpatterns = [
    path('', include(router.urls)),
]