from apps.courses.models import Course, Enrollment
from apps.common.perms import IsOwner, IsAdmin, IsTeacher, IsTeacherOrAdmin

def is_enrolled(user, course_id):
    return Enrollment.objects.filter(
        user=user,
        course_id=course_id,
        status=Enrollment.Status.ACTIVE
    ).exists()


def is_teacher_of(user, course):
    return course.teacher_id == user.pk


class IsCourseOwnerOrAdmin(IsAdmin):
    def has_object_permission(self, request, view, obj):
        if super().has_permission(request, view):
            return True
        return is_teacher_of(request.user, obj)


class IsForumParticipant(IsTeacherOrAdmin):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if IsAdmin().has_permission(request, view):
            return True

        course_id =  view.kwargs.get('pk') or view.kwargs.get('course_id')

        # là người dạy khóa học
        if IsTeacher().has_permission(request, view):
            return Course.objects.filter(pk=course_id, teacher=request.user).exists()

        # la hs đăng ký
        return is_enrolled(request.user, course_id)

#xem
class IsTopicParticipant(IsTeacherOrAdmin):
    """
    Quy định quyền tham gia vào một Topic (Chủ đề diễn đàn cụ thể).
    Áp dụng cho các API chi tiết có ID như: /api/forum/{pk}/ hoặc /api/forum/{pk}/replies/
    """

    def has_permission(self, request, view):
        # VÒNG 1 (Toàn cục): Cho phép tất cả User đã đăng nhập thành công đi qua cửa này.
        # (Không phân biệt Student, Teacher hay Admin ở vòng này để tránh bị chặn nhầm Student).
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # VÒNG 2 (Chi tiết đối tượng): Tiến hành bóc tách thực thể bài viết (obj = ForumTopic)

        # Trường hợp 1: Nếu là Admin -> Toàn quyền truy cập
        if IsAdmin().has_permission(request, view):
            return True

        course = obj.course

        # Trường hợp 2: Nếu là Giảng viên -> Phải là người phụ trách chính của Khóa học này
        if IsTeacher().has_permission(request, view):
            return is_teacher_of(request.user, course)

        # Trường hợp 3: Nếu là Học sinh -> Bản ghi đăng ký học (Enrollment) bắt buộc phải ACTIVE
        return is_enrolled(request.user, course.pk)

#xóa
class IsTopicOwnerOrCourseTeacherOrAdmin(IsOwner):
    def has_object_permission(self, request, view, obj):
        # obj = ForumTopic
        if IsAdmin().has_permission(request, view):
            return True

        if IsTeacher().has_permission(request, view):
            return is_teacher_of(request.user, obj.course)

        # kiemre tra nguwoiftao mới xóa dc
        return super().has_object_permission(request, view, obj)
