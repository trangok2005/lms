from rest_framework import pagination


class MaterialPaginator(pagination.PageNumberPagination):
    page_size = 20

class CommentPaginator(pagination.PageNumberPagination):
        page_size = 15