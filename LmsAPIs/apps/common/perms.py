from rest_framework import permissions

class IsOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return request.user == obj.user

        return request.user == obj

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
         return bool(
            request.user and
            request.user.is_authenticated and
            (
                request.user.role == 'admin' or
                request.user.is_superuser
            )
        )

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'teacher'
        )
class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            IsTeacher().has_permission(request, view) or
            IsAdmin().has_permission(request, view)
        )