from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from django import forms
from django.db.models import Count, Sum
from ckeditor_uploader.widgets import CKEditorUploadingWidget

from apps.courses.models import (
    Category, Tag, Course, Enrollment, ForumTopic, ForumReply
)
from apps.materials.models import (
    Material, MaterialProgress, Comment, Note
)
from apps.quizzes.models import (
    Quiz, Question, Answer, TestResult
)
from apps.payments.models import Transaction


# ════════════════════════════════════════════════════════════════
#  FORMS
# ════════════════════════════════════════════════════════════════

class CourseForm(forms.ModelForm):
    description = forms.CharField(
        widget=CKEditorUploadingWidget,
        required=False
    )
    class Meta:
        model  = Course
        fields = '__all__'


class MaterialForm(forms.ModelForm):
    content = forms.CharField(
        widget=CKEditorUploadingWidget,
        required=False
    )
    class Meta:
        model  = Material
        fields = '__all__'


# ════════════════════════════════════════════════════════════════
#  INLINES
# ════════════════════════════════════════════════════════════════

class MaterialInline(admin.TabularInline):
    model  = Material
    extra  = 0
    fields = ['title', 'material_type', 'difficulty', 'order_index', 'is_active']
    ordering = ['order_index']


class EnrollmentInline(admin.TabularInline):
    model      = Enrollment
    extra      = 0
    fields     = ['user', 'status', 'progress_percent', 'completed_at']
    readonly_fields = ['progress_percent', 'completed_at']


class QuizInline(admin.TabularInline):
    model  = Quiz
    extra  = 0
    fields = ['title', 'time_limit', 'passing_score', 'is_active']


class AnswerInline(admin.TabularInline):
    model  = Answer
    extra  = 4
    fields = ['content', 'is_correct', 'is_active']


class QuestionInline(admin.TabularInline):
    model  = Question
    extra  = 0
    fields = ['content', 'points', 'is_active']


class ForumTopicInline(admin.TabularInline):
    model       = ForumTopic
    extra       = 0
    fields      = ['user', 'title', 'is_active']
    readonly_fields = ['user']


# ════════════════════════════════════════════════════════════════
#  COURSES MODULE
# ════════════════════════════════════════════════════════════════


class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['id', 'name', 'course_count', 'is_active', 'created_date']
    search_fields = ['name']
    list_filter   = ['is_active']

    def course_count(self, obj):
        return obj.courses.filter(is_active=True).count()
    course_count.short_description = 'Số khoá học'



class TagAdmin(admin.ModelAdmin):
    list_display  = ['id', 'name', 'is_active']
    search_fields = ['name']



class CourseAdmin(admin.ModelAdmin):
    form          = CourseForm
    list_display  = ['id', 'subject', 'teacher', 'category', 'level',
                     'price', 'student_count', 'course_image', 'is_active']
    search_fields = ['subject', 'description', 'teacher__username']
    list_filter   = ['level', 'category', 'is_active']
    readonly_fields = ['course_image', 'created_date', 'updated_date']
    filter_horizontal = ['tags']
    inlines       = [MaterialInline, QuizInline, EnrollmentInline, ForumTopicInline]

    def course_image(self, course):
        if course.image:
            return mark_safe(f'<img src="{course.image.url}" width="120" style="border-radius:6px" />')
        return '(Chưa có ảnh)'
    course_image.short_description = 'Ảnh bìa'

    def student_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()
    student_count.short_description = 'Học viên'


class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'course', 'status', 'progress_percent',
                     'completed_at', 'is_active']
    search_fields = ['user__username', 'course__subject']
    list_filter   = ['status', 'is_active']
    readonly_fields = ['progress_percent', 'completed_at', 'last_accessed']



class ForumTopicAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'user', 'course', 'reply_count', 'is_active', 'created_date']
    search_fields = ['title', 'user__username', 'course__subject']
    list_filter   = ['is_active']
    readonly_fields = ['created_date']

    def reply_count(self, obj):
        return obj.replies.filter(is_active=True).count()
    reply_count.short_description = 'Số phản hồi'



class ForumReplyAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'topic', 'is_active', 'created_date']
    search_fields = ['user__username', 'topic__title']
    list_filter   = ['is_active']


# ════════════════════════════════════════════════════════════════
#  MATERIALS MODULE
# ════════════════════════════════════════════════════════════════


class MaterialAdmin(admin.ModelAdmin):
    form          = MaterialForm
    list_display  = ['id', 'title', 'course', 'material_type', 'difficulty',
                     'duration_minutes', 'order_index', 'is_active']
    search_fields = ['title', 'course__subject']
    list_filter   = ['material_type', 'difficulty', 'is_active']
    readonly_fields = ['material_thumbnail', 'created_date']
    filter_horizontal = ['tags']
    ordering      = ['course', 'order_index']

    def material_thumbnail(self, material):
        if material.thumbnail:
            return mark_safe(f'<img src="{material.thumbnail.url}" width="120" style="border-radius:6px" />')
        return '(Chưa có thumbnail)'
    material_thumbnail.short_description = 'Thumbnail'


class MaterialProgressAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'material', 'status', 'progress_percent',
                     'watched_minutes', 'completed_at']
    search_fields = ['user__username', 'material__title']
    list_filter   = ['status']
    readonly_fields = ['last_accessed', 'completed_at']



class CommentAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'material', 'is_active', 'created_date']
    search_fields = ['user__username', 'material__title', 'content']
    list_filter   = ['is_active']



class NoteAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'material', 'timestamp_sec', 'is_active']
    search_fields = ['user__username', 'material__title']
    list_filter   = ['is_active']


# ════════════════════════════════════════════════════════════════
#  QUIZ MODULE
# ════════════════════════════════════════════════════════════════


class QuizAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'course', 'time_limit', 'passing_score',
                     'question_count', 'is_active']
    search_fields = ['title', 'course__subject']
    list_filter   = ['is_active']
    inlines       = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.filter(is_active=True).count()
    question_count.short_description = 'Số câu hỏi'



class QuestionAdmin(admin.ModelAdmin):
    list_display  = ['id', 'content', 'quiz', 'points', 'is_active']
    search_fields = ['content', 'quiz__title']
    list_filter   = ['is_active']
    inlines       = [AnswerInline]



class AnswerAdmin(admin.ModelAdmin):
    list_display  = ['id', 'content', 'question', 'is_correct', 'is_active']
    search_fields = ['content', 'question__content']
    list_filter   = ['is_correct', 'is_active']



class TestResultAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'quiz', 'score', 'percentage', 'is_passed', 'created_date']
    search_fields = ['user__username', 'quiz__title']
    list_filter   = ['is_passed']
    readonly_fields = ['score', 'percentage', 'is_passed', 'submitted_answers',
                       'strength_analysis', 'weakness_analysis', 'created_date']


# ════════════════════════════════════════════════════════════════
#  PAYMENT MODULE
# ════════════════════════════════════════════════════════════════


class TransactionAdmin(admin.ModelAdmin):
    list_display  = ['id', 'transaction_code', 'user', 'course', 'amount',
                     'payment_method', 'status', 'created_date']
    search_fields = ['transaction_code', 'user__username', 'course__subject']
    list_filter   = ['status', 'payment_method']
    readonly_fields = ['transaction_code', 'gateway_response', 'created_date']


# ════════════════════════════════════════════════════════════════
#  CUSTOM ADMIN SITE
# ════════════════════════════════════════════════════════════════

class MyAdminSite(admin.AdminSite):
    site_header = 'LMS Admin'
    site_title  = 'LMS'
    index_title = 'Quản trị hệ thống'

    def get_urls(self):
        return [
            path('stats/', self.stats_view, name='stats'),
        ] + super().get_urls()

    def stats_view(self, request):
        # thống kê theo category
        category_stats = Category.objects.annotate(
            course_count=Count('courses')
        ).values('id', 'name', 'course_count')

        # thống kê doanh thu
        revenue_stats = Transaction.objects.filter(
            status=Transaction.Status.SUCCESS
        ).values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )

        # thống kê enrollment
        enrollment_stats = Enrollment.objects.values('status').annotate(
            count=Count('id')
        )

        return TemplateResponse(request, 'admin/stats.html', {
            'category_stats'   : category_stats,
            'revenue_stats'    : revenue_stats,
            'enrollment_stats' : enrollment_stats,
        })


# ════════════════════════════════════════════════════════════════
#  ĐĂNG KÝ VÀO CUSTOM ADMIN SITE
# ════════════════════════════════════════════════════════════════

admin_site = MyAdminSite(name='lms_admin')

admin_site.register(Category,         CategoryAdmin)
admin_site.register(Tag,              TagAdmin)
admin_site.register(Course,           CourseAdmin)
admin_site.register(Enrollment,       EnrollmentAdmin)
admin_site.register(ForumTopic,       ForumTopicAdmin)
admin_site.register(ForumReply,       ForumReplyAdmin)
admin_site.register(Material,         MaterialAdmin)
admin_site.register(MaterialProgress, MaterialProgressAdmin)
admin_site.register(Comment,          CommentAdmin)
admin_site.register(Note,             NoteAdmin)
admin_site.register(Quiz,             QuizAdmin)
admin_site.register(Question,         QuestionAdmin)
admin_site.register(Answer,           AnswerAdmin)
admin_site.register(TestResult,       TestResultAdmin)
admin_site.register(Transaction,      TransactionAdmin)