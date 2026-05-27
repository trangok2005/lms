from rest_framework import viewsets, generics, status, parsers, permissions, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Notification
from . import serializers
from apps.common.perms import IsAdmin

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAuthenticated(), IsAdmin()]
        if self.action in ['current_user']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False)
    def current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            s = serializers.UserSerializer(u, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            u = s.save()

        return Response(serializers.UserSerializer(u).data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = serializers.NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = pagination.PageNumberPagination

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user, is_active=True)

    # PATCH /notifications/{id}/read/
    # 1. mark_read — trả về unread_count sau khi đọc
    @action(methods=['patch'], url_path='read', detail=True)
    def mark_read(self, request, pk=None):
        try:
            notif = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        notif.is_read = True
        notif.save()
        unread = Notification.get_unread_count(request.user.id)
        return Response({
            'detail': 'Đã đánh dấu đọc.',
            'unread_count': unread,  # ✅ FE dùng UPDATE_BADGE_COUNT
            'badge_count': unread,  # ✅ alias cho NotificationWatcher
        })

    # 2. mark_all_read
    @action(methods=['post'], url_path='read-all', detail=False)
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({
            'detail': 'Đã đánh dấu tất cả đã đọc.',
            'unread_count': 0,
            'badge_count': 0,  # ✅ FE emit UPDATE_BADGE_COUNT với 0
        })

    # 3. unread_count — giữ nguyên, thêm badge_count alias
    @action(methods=['get'], url_path='unread-count', detail=False)
    def unread_count(self, request):
        count = Notification.get_unread_count(request.user.id)
        return Response({
            'unread_count': count,
            'badge_count': count,  # ✅ alias
        })