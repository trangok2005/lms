from rest_framework import serializers
from .models import Material, MaterialProgress, Comment, Note
from ..users.models import User
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material

        fields = ('id',  'title','content','file','thumbnail','material_type','difficulty','duration_minutes','order_index','course','tags')

        read_only_fields = ['id']

    def to_representation(self, instance):

            data = super().to_representation(instance)
            if instance.course:
                data['course'] = {
                    'id': instance.course.id,
                    'title': getattr(instance.course, 'title', '')
                }
            if instance.tags.exists():
                data['tags'] = [
                    {
                        'id': tag.id,
                        'name': getattr(tag, 'name', '')
                    }
                    for tag in instance.tags.all()
                ]
            data['file'] = instance.file.url if instance.file else None

            return data
class MaterialProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialProgress
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'last_accessed')



class UserMiniSerializer(serializers.ModelSerializer):
        class Meta:
                model = User
                # LƯU Ý: Nếu model User của bạn không có trường 'avatar', hãy xóa nó khỏi mảng fields này.
                fields = ['id', 'username', 'avatar']

class CommentSerializer(
    serializers.ModelSerializer
):
    user = UserMiniSerializer(read_only=True)
    class Meta:

        model = Comment

        fields = (
            'id',
            'content',
            'material',
            'user',
            'created_date'
        )

        read_only_fields = (
            'id',
            'user',
            'created_date'
        )

class NoteSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Note
        fields = (
            'id',
            'content',
            'timestamp_sec',
            'material',
            'user',
            'created_date'
        )
        read_only_fields = (
            'id',
            'user',
            'created_date'
        )