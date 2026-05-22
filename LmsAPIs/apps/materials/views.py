from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from apps.materials import serializers
from apps.materials.models import Material
from apps.materials.paginators import MaterialPaginator
from apps.materials.permissions import MaterialPermission
from apps.materials.filters import MaterialFilter


class MaterialViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.MaterialSerializer
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = MaterialPaginator
    # permission_classes = [MaterialPermission]
    filter_backends = [DjangoFilterBackend]
    filter_class = MaterialFilter
    def get_queryset(self):
        queryset = Material.objects.select_related('course').prefetch_related('tags')
        if self.action == 'list':
            queryset = queryset.defer('content')
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            pass
        return queryset
  