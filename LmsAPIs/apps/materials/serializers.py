from rest_framework import serializers
from .models import Material, MaterialProgress, Comment, Note

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
