from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from rest_framework.parsers import (MultiPartParser,FormParser)
from apps.materials import serializers
from apps.materials.models import Material,MaterialProgress,Comment,Note

from apps.materials.paginators import (
    MaterialPaginator
)

from apps.materials.filters import (MaterialFilter
)
from rest_framework.permissions import IsAuthenticated




class MaterialViewSet(viewsets.ModelViewSet):

    serializer_class = serializers.MaterialSerializer

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    pagination_class = MaterialPaginator

    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter
    ]

    filterset_class = MaterialFilter

    ordering_fields = [
        'created_at',
        'order_index'
    ]

    ordering = ['order_index']

    def get_queryset(self):

        queryset = Material.objects.select_related(
            'course'
        ).prefetch_related(
            'tags'
        )

        if self.action == 'list':
            queryset = queryset.defer('content')

        q = self.request.query_params.get('q')

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) |
                Q(content__icontains=q)
            )

        return queryset
class MaterialProgressViewSet(
    viewsets.ModelViewSet
):

    serializer_class = (
        serializers.MaterialProgressSerializer
    )
    permission_classes = [
        IsAuthenticated
    ]
    http_method_names = [
        'get',
        'post',
        'patch'
    ]

    def get_queryset(self):

        return MaterialProgress.objects.filter(
            user=self.request.user
        ).select_related(
            'material'
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user)
class CommentViewSet(viewsets.ModelViewSet):

    serializer_class = serializers.CommentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    http_method_names = [
        'get',
        'post',
        'delete'
    ]

    def get_queryset(self):

        queryset = Comment.objects.select_related(
            'user',
            'material'
        )

        material_id = self.request.query_params.get(
            'material'
        )

        if material_id:
            queryset = queryset.filter(
                material_id=material_id
            )

        return queryset

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )




class NoteViewSet(viewsets.ModelViewSet):

    serializer_class = serializers.NoteSerializer

    permission_classes = [
        IsAuthenticated
    ]

    http_method_names = [
        'get',
        'post',
        'patch',
        'delete'
    ]

    def get_queryset(self):

        queryset = Note.objects.select_related(
            'user',
            'material'
        )

        material_id = self.request.query_params.get(
            'material'
        )

        if material_id:
            queryset = queryset.filter(
                material_id=material_id
            )

        return queryset

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )
