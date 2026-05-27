# config/routing.py
from django.urls import re_path
from apps.courses import ForumConsumers
from apps.users import NotifConsumers

websocket_urlpatterns = [
    re_path(r'^ws/forum/(?P<forum_id>\d+)/$', ForumConsumers.ForumConsumer.as_asgi()),
    re_path(r'^ws/notifications/(?P<user_id>\d+)/$', NotifConsumers.NotificationConsumer.as_asgi()),
]
