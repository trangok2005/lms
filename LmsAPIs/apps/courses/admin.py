from django.contrib import admin
from .models import (
    Category,
    Tag,
    Course,
    Enrollment,
    ForumTopic,
    ForumReply
)


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0


class ForumReplyInline(admin.TabularInline):
    model = ForumReply
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'subject',
        'teacher',
        'category',
        'price',
        'level'
    ]

    list_filter = [
        'level',
        'category'
    ]

    search_fields = [
        'subject',
        'teacher__username'
    ]

    autocomplete_fields = [
        'teacher',
        'category',
        'tags'
    ]

    filter_horizontal = ['tags']

    fieldsets = (
        ('Thông tin khóa học', {
            'fields': (
                'subject',
                'description',
                'image'
            )
        }),

        ('Phân loại', {
            'fields': (
                'category',
                'level',
                'price',
                'tags'
            )
        }),

        ('Giảng viên', {
            'fields': ('teacher',)
        }),
    )

    inlines = [EnrollmentInline]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'user',
        'course',
        'status',
        'progress_percent',
        'last_accessed'
    ]

    list_filter = [
        'status',
        'course'
    ]

    search_fields = [
        'user__username',
        'course__subject'
    ]

    autocomplete_fields = [
        'user',
        'course'
    ]


@admin.register(ForumTopic)
class ForumTopicAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'title',
        'user',
        'course'
    ]

    list_filter = [
        'course'
    ]

    search_fields = [
        'title',
        'user__username'
    ]

    autocomplete_fields = [
        'user',
        'course'
    ]

    inlines = [ForumReplyInline]


@admin.register(ForumReply)
class ForumReplyAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'user',
        'topic'
    ]

    search_fields = [
        'user__username',
        'topic__title'
    ]

    autocomplete_fields = [
        'user',
        'topic'
    ]