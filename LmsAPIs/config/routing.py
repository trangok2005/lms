# config/routing.py
from django.urls import re_path
from apps.courses import consumers

websocket_urlpatterns = [
    # Tuyến đường xử lý real-time cho từng forum cụ thể 🔌
    re_path(r'^ws/forum/(?P<forum_id>\d+)/$', consumers.ForumConsumer.as_asgi()),
]