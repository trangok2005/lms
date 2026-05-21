from rest_framework.routers import DefaultRouter
from apps.courses.views import CourseViewSet, ForumTopicViewSet, CategoryViewSet, TagViewSet, ForumReplyViewSet

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('forum', ForumTopicViewSet, basename='forum')
router.register('categories', CategoryViewSet, basename='category')
router.register('tags', TagViewSet, basename='tag')
router.register('forum/reply', ForumReplyViewSet, basename='reply')
urlpatterns = router.urls

# ─────────────────────────────────────────────────────────────
#  API 1  GET    /courses/                     → list
#  API 2  POST   /courses/                     → create
#  API 3  GET    /courses/{id}/                → retrieve
#  API 4  PATCH  /courses/{id}/                → partial_update
#  API 5  DELETE /courses/{id}/                → destroy
#  API 6  GET    /courses/my-courses/          → my_courses
#  API 7  POST   /courses/{id}/enroll/         → enroll
#  API 8  GET    /courses/{id}/students/       → students
#  API 9  GET    /courses/{id}/forum/          → forum (GET)
#  API 10 POST   /courses/{id}/forum/          → forum (POST)
#  API 11 GET    /forum/{pk}/                  → retrieve
#  API 12 GET    /forum/{pk}/replies/          → replies (GET)
#  API 12 POST   /forum/{pk}/replies/          → replies (POST)
#  API 13 DELETE /forum/{pk}/                  → destroy
#  API 14 DELETE /reply/{pk}/                  → destroy
# ─────────────────────────────────────────────────────────────