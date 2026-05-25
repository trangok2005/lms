# config/routing.py
from django.urls import re_path
from apps.courses import consumers

websocket_urlpatterns = [
    re_path(r'^ws/forum/(?P<forum_id>\d+)/$', consumers.ForumConsumer.as_asgi()),
]