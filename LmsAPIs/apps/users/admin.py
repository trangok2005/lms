from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, StudentProfile

class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Thông tin Sinh viên (Profile)'
    fields = ['current_level', 'learning_goals', 'total_hours', 'average_score']

class MyUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_superuser', 'is_active']

    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin vai trò & Ảnh', {'fields': ('role', 'avatar')}),
    )

    inlines = [StudentProfileInline]

admin.site.register(User, MyUserAdmin)