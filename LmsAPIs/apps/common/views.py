from rest_framework import viewsets,  permissions
from apps.common import perms

#student vs admin and teacher
class BaseViewSet(viewsets.ModelViewSet):
    class Meta:
        abstract = True

    def get_permissions(self):
        if self.action in ['list']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), perms.IsTeacher | perms.IsAdmin]