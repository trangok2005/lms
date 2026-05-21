from rest_framework import viewsets, permissions


class BaseViewSet(viewsets.ModelViewSet):
    class Meta:
        abstract = True

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [perms.IsAdmin]
        return [permission() for permission in permission_classes]
        #return [permissions.AllowAny()]
