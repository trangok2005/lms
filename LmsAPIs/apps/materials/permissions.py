from rest_framework import permissions


class MaterialPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return (request.user and request.user.is_staff)
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Chỉ cho phép chủ sở hữu thực hiện hành động
        return obj.user == request.user