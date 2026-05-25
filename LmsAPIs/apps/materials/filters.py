import django_filters
from apps.materials.models import Material


class MaterialFilter(django_filters.FilterSet):

    class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
        pass

    tags_in = NumberInFilter(
        field_name='tags',
        lookup_expr='in'
    )

    is_learning = django_filters.BooleanFilter(
        method='filter_learning'
    )

    class Meta:
        model = Material
        fields = [
            'course',
            'material_type',
            'difficulty',
            'tags',
            'is_learning'
        ]

    def filter_learning(self, queryset, name, value):
        request = self.request

        if not request or not request.user.is_authenticated:
            return queryset.none()

        # material user đang học
        if value:
            return queryset.filter(
                progresses__user=request.user
            ).distinct()

        # material user chưa học
        return queryset.exclude(
            progresses__user=request.user
        ).distinct()