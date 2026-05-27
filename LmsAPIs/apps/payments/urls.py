from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path, re_path, include

router = DefaultRouter()
router.register('payments', views.TransactionViewSet, basename='payment')
router.register('admin/transactions', views.AdminTransactionViewSet, basename='admin-transaction')
router.register('admin/reports/overview', views.AdminOverviewView, basename='admin-report')
urlpatterns =[
    path('', include(router.urls)),
]