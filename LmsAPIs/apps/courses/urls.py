from rest_framework.routers import DefaultRouter
from apps.courses.views import CourseViewSet, ForumTopicViewSet, CategoryViewSet, TagViewSet, ForumReplyViewSet

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('forum', ForumTopicViewSet, basename='forum')
router.register('categories', CategoryViewSet, basename='category')
router.register('tags', TagViewSet, basename='tag')
router.register('forum/reply', ForumReplyViewSet, basename='reply')
urlpatterns = router.urls

#
#  API 1  GET    /courses/category=1&level=beginner&tag=1
#  API 2  POST   /courses/
#  API 3  GET    /courses/{id}/
#  API 4  PATCH  /courses/{id}/
#  API 5  DELETE /courses/{id}/
#  API 6  GET    /courses/my-courses/?status=
#  API 8  GET    /courses/{id}/students/
#  API 9  GET    /courses/{id}/forum/
#  API 10 POST   /courses/{id}/forum/
#  API 11 GET    /forum/{pk}/
#  API 12 GET    /forum/{pk}/replies/
#  API 12 POST   /forum/{pk}/replies/
#  API 13 DELETE /forum/{pk}/
#  API 14 DELETE /reply/{pk}/
