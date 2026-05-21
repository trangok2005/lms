from rest_framework.routers import DefaultRouter
from apps.courses.views.ForumViews import ForumReplyViewSet, ForumTopicViewSet

router = DefaultRouter()
router.register('topics',  ForumTopicViewSet, basename='forum-topic')
router.register('replies', ForumReplyViewSet,  basename='forum-reply')

urlpatterns = router.urls

