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
    def has_object_permission(self, request, view, obj):
        # obj = ForumTopic
        if IsAdmin().has_permission(request, view):
            return True

        course = obj.course
        if IsTeacher().has_permission(request, view):
            return is_teacher_of(request.user, course)

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
