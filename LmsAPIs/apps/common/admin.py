from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from django import forms
from django.db.models import Count, Sum
from ckeditor_uploader.widgets import CKEditorUploadingWidget

# 1. Import các Model hệ thống
from apps.users.models import User, StudentProfile, Notification
from apps.courses.models import Category, Tag, Course, Enrollment, ForumTopic, ForumReply
from apps.materials.models import Material, MaterialProgress, Comment, Note
from apps.quizzes.models import Quiz, Question, Answer, TestResult
from apps.payments.models import Transaction

# 2. Import thư viện OAuth2
from oauth2_provider.models import Application, AccessToken, RefreshToken, IDToken, Grant
from oauth2_provider.admin import ApplicationAdmin, AccessTokenAdmin, RefreshTokenAdmin, IDTokenAdmin, GrantAdmin

#  FORMS (Tạo Form riêng biệt theo phong cách của thầy)


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'avatar', 'is_active', 'is_staff']


class CourseForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorUploadingWidget, required=False)

    class Meta:
        model = Course
        fields = '__all__'


class MaterialForm(forms.ModelForm):
    content = forms.CharField(widget=CKEditorUploadingWidget, required=False)

    class Meta:
        model = Material
        fields = '__all__'


#  INLINES (Hiển thị bảng con lồng vào bảng cha)


class StudentProfileInline(admin.StackedInline):
    # Tác dụng: Xem/Sửa hồ sơ học viên ngay khi đang xem chi tiết User
    model = StudentProfile
    extra = 1


class MaterialInline(admin.StackedInline):
    model = Material
    extra = 1
    form = MaterialForm


class QuizInline(admin.TabularInline):
    model = Quiz
    extra = 1


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 1


class ForumTopicInline(admin.TabularInline):
    model = ForumTopic
    extra = 1


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 4


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1



#  ADMIN CLASSES (Gán Form của thầy vào ModelAdmin)


class UserAdmin(admin.ModelAdmin):
    # Cấu hình quản lý tài khoản người dùng
    list_display = ['id', 'username', 'email', 'role', 'user_avatar', 'is_active']
    search_fields = ['username', 'email']
    list_filter = ['role', 'is_active']
    readonly_fields = ['user_avatar']
    inlines = [StudentProfileInline] # Nhúng thẳng hồ sơ học viên vào đây
    form = UserForm

    def user_avatar(self, obj):
        # Hiển thị ảnh đại diện từ Cloudinary ra ngoài danh sách
        if obj.avatar:
            return mark_safe(f'<img src="{obj.avatar.url}" width="50" style="border-radius:50%" />')
        return '(Không có avatar)'
    user_avatar.short_description = 'Ảnh đại diện'


class NotificationAdmin(admin.ModelAdmin):
    # Cấu hình quản lý thông báo hệ thống
    list_display = ['id', 'user', 'notification_type', 'title', 'is_read', 'created_date']
    search_fields = ['user__username', 'title']
    list_filter = ['notification_type', 'is_read']


class CourseAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'is_active', 'category', 'course_image']
    search_fields = ['subject', 'description']
    list_filter = ['category', 'is_active']
    readonly_fields = ['course_image']
    inlines = [MaterialInline, QuizInline, EnrollmentInline, ForumTopicInline]
    form = CourseForm

    def course_image(self, course):
        if hasattr(course, 'image') and course.image:
            return mark_safe(f'<img src="{course.image.url}" width="150" />')
        elif hasattr(course, 'avatar') and course.avatar:
            return mark_safe(f'<img src="{course.avatar.url}" width="150" />')
        return '(Chưa có ảnh)'


class MaterialAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'course', 'material_type', 'is_active']
    search_fields = ['title']
    list_filter = ['material_type', 'is_active']
    form = MaterialForm


class QuizAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'course', 'time_limit', 'is_active']
    inlines = [QuestionInline]


class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'content', 'quiz', 'points', 'is_active']
    inlines = [AnswerInline]



#  CUSTOM ADMIN SITE & STATS


class MyAdminSite(admin.AdminSite):
    site_header = 'eCourseApp Admin'

    def get_urls(self):
        return [
            path('stats/', self.stats_view, name='stats'),
        ] + super().get_urls()

    def stats_view(self, request):
        category_stats = Category.objects.annotate(c=Count('courses')).values('id', 'name', 'c')
        revenue_stats = Transaction.objects.filter(status='SUCCESS').values('payment_method').annotate(total=Sum('amount'))
        enrollment_stats = Enrollment.objects.values('status').annotate(count=Count('id'))

        return TemplateResponse(request, 'admin/stats.html', {
            'stats': category_stats,
            'revenue_stats': revenue_stats,
            'enrollment_stats': enrollment_stats
        })



#  KÍCH HOẠT ĐĂNG KÝ HỆ THỐNG


admin_site = MyAdminSite(name='lms_admin')

#  0. Phân hệ Người dùng & Thông báo
admin_site.register(User, UserAdmin)
admin_site.register(Notification, NotificationAdmin)


# 1. Các bảng thuộc phân hệ Khóa học & Diễn đàn
admin_site.register(Category)
admin_site.register(Tag)
admin_site.register(Course, CourseAdmin)
admin_site.register(Enrollment)
admin_site.register(ForumTopic)
admin_site.register(ForumReply)

# 2. Các bảng thuộc phân hệ Học liệu bài học
admin_site.register(Material, MaterialAdmin)
admin_site.register(MaterialProgress)
admin_site.register(Comment)
admin_site.register(Note)

# 3. Các bảng thuộc phân hệ Bài tập & Trắc nghiệm
admin_site.register(Quiz, QuizAdmin)
admin_site.register(Question, QuestionAdmin)
admin_site.register(Answer)
admin_site.register(TestResult)

# 4. Bảng thuộc phân hệ Thanh toán giao dịch
admin_site.register(Transaction)

# 5. Các bảng phục vụ đăng nhập OAuth2
admin_site.register(Application, ApplicationAdmin)
admin_site.register(AccessToken, AccessTokenAdmin)
admin_site.register(RefreshToken, RefreshTokenAdmin)
admin_site.register(IDToken, IDTokenAdmin)
admin_site.register(Grant, GrantAdmin)