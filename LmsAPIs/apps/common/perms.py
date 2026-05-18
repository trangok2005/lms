from rest_framework import permissions

class IsOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return request.user == obj.user
        return request.user == obj

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view) and
            (request.user.role == 'admin' or request.user.is_superuser)
        )

class IsAdmin(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view) and
            (request.user.role == 'admin' or request.user.is_superuser)
        )

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view) and
            request.user.role == 'teacher'
        )