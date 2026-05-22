# filters.py
import django_filters
from .models import Material

class MaterialFilter(django_filters.FilterSet):

    class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
        pass


    tags_in = NumberInFilter(field_name='tags', lookup_expr='in')

    class Meta:
        model = Material
        fields = ['course', 'material_type', 'difficulty', 'tags']
