from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Tag, Course
from . import serializers
from apps.common import views

class CategoryViewSet(views.BaseViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer


class TagViewSet(views.BaseViewSet):
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = serializers.TagSerializer


class CourseViewSet(views.BaseViewSet):
    serializer_class = serializers.CourseSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True).select_related('category', 'teacher').prefetch_related('tags')

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)

        tag_id = self.request.query_params.get('tag')
        if tag_id:
            queryset = queryset.filter(tags__id=tag_id)

        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(Q(subject__icontains=q) | Q(description__icontains=q))

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ['teacher']:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save(teacher=user)

        return Response(serializers.CourseSerializer(course).data, status=status.HTTP_201_CREATED)
