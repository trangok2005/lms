from django.utils import timezone
from django.db.models import Q, Model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.courses.models import Enrollment
from django.db.models import Avg
from apps.materials import serializers
from apps.materials.models import Material, MaterialProgress, Comment, Note
from apps.materials.paginators import MaterialPaginator , CommentPaginator
from apps.materials.filters import MaterialFilter
from apps.materials.permissions import MaterialPermission,IsOwner

from apps.courses.models import Enrollment


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
        user = self.request.user

        queryset = Material.objects.select_related(
            'course'
        ).prefetch_related(
            'tags'
        )

        # chưa login
        if not user.is_authenticated:
            return Material.objects.none()

        # teacher/admin thấy tất cả
        if user.is_staff or user.role == 'teacher':
            pass

        # student chỉ thấy material của khóa đã enroll
        else:
            queryset = queryset.filter(
                course__enrollments__user=user,
                course__enrollments__status=Enrollment.Status.ACTIVE
            ).distinct()

        # list -> nhẹ hơn
        if self.action == 'list':
            queryset = queryset.defer('content')

        # search
        q = self.request.query_params.get('q')

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
            )

        return queryset

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        parser_classes=[JSONParser, FormParser, MultiPartParser]
    )
    def progress(self, request, pk=None):
        material = self.get_object()

        progress, created = MaterialProgress.objects.get_or_create(
            user=request.user,
            material=material
        )

        # GET progress
        if request.method == 'GET':
            serializer = serializers.MaterialProgressSerializer(progress)
            return Response([serializer.data])

        # POST update progress
        data = request.data

        progress.last_position_sec = data.get(
            'last_position_sec',
            progress.last_position_sec
        )

        progress.watched_minutes = data.get(
            'watched_minutes',
            progress.watched_minutes
        )

        progress.progress_percent = data.get(
            'progress_percent',
            progress.progress_percent
        )

        if progress.progress_percent >= 100:
            progress.status = MaterialProgress.Status.COMPLETED
            if not progress.completed_at:  # chỉ set lần đầu hoàn thành
                progress.completed_at = timezone.now()
        elif progress.progress_percent > 0:
            progress.status = MaterialProgress.Status.IN_PROGRESS
        avg = MaterialProgress.objects.filter(
            user=request.user,
            material__course=material.course
        ).aggregate(avg=Avg('progress_percent'))['avg'] or 0

        Enrollment.objects.filter(
            user=request.user,
            course=material.course
        ).update(progress_percent=avg)
        progress.save()

        serializer = serializers.MaterialProgressSerializer(progress)

        return Response([serializer.data], status=status.HTTP_200_OK)



class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.CommentSerializer
    # Cần IsAuthenticated để gọi, và IsOwner để xóa
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ['get', 'post', 'delete']
    pagination_class = CommentPaginator

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

        # Fix Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Note.objects.none()

        # Chưa đăng nhập
        if not self.request.user.is_authenticated:
            return Note.objects.none()

        queryset = Note.objects.filter(
            user=self.request.user
        ).select_related('user', 'material')

        material_id = self.request.query_params.get('material')
        timestamp = self.request.query_params.get('timestamp')

        if material_id:
            queryset = queryset.filter(material_id=material_id)

        if timestamp:
            queryset = queryset.filter(timestamp_sec=timestamp)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)