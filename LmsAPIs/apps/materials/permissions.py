from rest_framework import permissions

from rest_framework import permissions


class MaterialPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # 1. Cho phép tất cả mọi người (kể cả học viên) được quyền GET (đọc)
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. Các hành động POST, PATCH, DELETE chỉ dành cho người đã đăng nhập
        if not request.user or not request.user.is_authenticated:
            return False

        is_admin = request.user.is_staff
        is_teacher = getattr(request.user, 'role', '') == 'teacher'

        return bool(is_admin or is_teacher)

    # (TÙY CHỌN NÂNG CAO - RẤT KHUYẾN NGHỊ):
    # Ngăn giảng viên này sửa/xóa tài liệu của giảng viên khác
    def has_object_permission(self, request, view, obj):
        # Ai cũng được xem (nếu vượt qua bộ lọc get_queryset ở views)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin có toàn quyền
        if request.user.is_staff:
            return True

        # Giảng viên chỉ được sửa/xóa tài liệu thuộc về khóa học do MÌNH tạo ra
        if getattr(request.user, 'role', '') == 'teacher':
            return obj.course.teacher == request.user

        return False
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Chỉ cho phép chủ sở hữu thực hiện hành động
        return obj.user == request.user