from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('payments', views.TransactionViewSet, basename='payment')

urlpatterns = router.urls