
from django.utils import timezone
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.materials import serializers
from apps.materials.models import Material, MaterialProgress, Comment, Note
from apps.materials.paginators import MaterialPaginator
from apps.materials.filters import MaterialFilter
from apps.materials.permissions import MaterialPermission,IsOwner





class MaterialViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.MaterialSerializer
    permission_classes = [MaterialPermission]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = MaterialPaginator
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = MaterialFilter
    ordering_fields = ['created_at', 'order_index']
    ordering = ['order_index']

    def get_queryset(self):
        queryset = Material.objects.select_related('course').prefetch_related('tags')
        if self.action == 'list':
            queryset = queryset.defer('content')
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(Q(title__icontains=q) | Q(content__icontains=q))
        return queryset


class MaterialProgressViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.MaterialProgressSerializer
    permission_classes = [IsAuthenticated] # Chỉ cần đăng nhập
    http_method_names = ['get', 'post', 'patch']

    def get_queryset(self):
        return MaterialProgress.objects.filter(user=self.request.user).select_related('material')

    @action(detail=False, methods=['post'], url_path='update-status')
    def update_status(self, request):
        material_id = request.data.get('material')
        status_val = request.data.get('status')
        progress, _ = MaterialProgress.objects.get_or_create(user=request.user, material_id=material_id)
        if status_val == 'completed':
            progress.status = MaterialProgress.Status.COMPLETED
            progress.completed_at = timezone.now()
        else:
            progress.status = MaterialProgress.Status.IN_PROGRESS
        progress.save()
        return Response({"message": "success"})


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.CommentSerializer
    # Cần IsAuthenticated để gọi, và IsOwner để xóa
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        queryset = Comment.objects.select_related('user', 'material')
        material_id = self.request.query_params.get('material')
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        return queryset.order_by('-created_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.NoteSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user).select_related('user', 'material')
        material_id = self.request.query_params.get('material')
        timestamp = self.request.query_params.get('timestamp')
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        if timestamp:
            queryset = queryset.filter(timestamp_sec=timestamp)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
