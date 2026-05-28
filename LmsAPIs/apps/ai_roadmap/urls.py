from django.urls import path
from .views import GenerateAIRoadmapAPIView, SaveAIRoadmapAPIView

# Danh sach router dieu huong luong xu ly AI Learning Path
urlpatterns = [
    # Buoc 1: Tiep nhan khao sat tu App, goi GPT-4o de build lo trinh nhap (Draft)
    path(
        'ai-roadmap/generate/',
        GenerateAIRoadmapAPIView.as_view(),
        name='generate_ai_path'
    ),

    # Buoc 2: Kiem tra bao mat, chan bat thanh toan 100k va ghi nhan vao co so du lieu
    path(
        'ai-roadmap/save/',
        SaveAIRoadmapAPIView.as_view(),
        name='save_ai_path'
    ),
]