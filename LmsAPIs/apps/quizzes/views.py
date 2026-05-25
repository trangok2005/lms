from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .filters import QuizFilter
from .models import Quiz, Question, Answer, TestResult
from .serializers import QuizDetailStudentSerializer, QuizSubmissionSerializer,TestResultSerializer


class StudentQuizViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Quiz.objects.all()
    serializer_class = QuizDetailStudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = QuizFilter
    @action(detail=True, methods=['post'], url_path='submit')
    def submit_quiz(self, request, pk=None):

        quiz = self.get_object()
        serializer = QuizSubmissionSerializer(data=request.data)

        # Ngăn chặn nếu payload gửi lên bị sai định dạng
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        submitted_answers = serializer.validated_data.get('submitted_answers', {})

        total_possible_score = 0
        actual_score = 0

        # Lấy danh sách toàn bộ câu hỏi của bài thi này để làm mốc tính điểm
        questions = quiz.questions.all()

        for question in questions:
            total_possible_score += question.points

            # Lấy ID đáp án mà sinh viên đã chọn cho câu hỏi hiện tại

            submitted_answer_id = submitted_answers.get(str(question.id))

            if submitted_answer_id:
                try:
                    # Kiểm tra xem đáp án có tồn tại trong câu hỏi này không và có chính xác không
                    answer = Answer.objects.get(id=submitted_answer_id, question=question)
                    if answer.is_correct:
                        actual_score += question.points
                except Answer.DoesNotExist:
                    # Sinh viên gửi ID đáp án không tồn tại, bỏ qua (điểm câu này vẫn là 0)
                    pass

                    # Tính toán phần trăm hoàn thành và xét xem sinh viên có qua môn không
        percentage = (actual_score / total_possible_score) * 100 if total_possible_score > 0 else 0
        is_passed = percentage >= quiz.passing_score

        # Khởi tạo và lưu kết quả bài làm vào cơ sở dữ liệu
        test_result = TestResult.objects.create(
            user=request.user,
            quiz=quiz,
            score=actual_score,
            percentage=percentage,
            is_passed=is_passed,
            submitted_answers=submitted_answers
        )

        # Trả về kết quả Đậu/Rớt ngay lập tức cho Frontend
        return Response({
            "message": "Nộp bài thành công",
            "result_id": test_result.id,
            "score": actual_score,
            "percentage": round(percentage, 2),
            "is_passed": is_passed
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='my-results')
    def my_results(self, request):
        """Lấy danh sách tất cả kết quả thi của user hiện tại"""
        results = TestResult.objects.filter(
            user=request.user
        ).select_related('quiz').order_by('-created_date')

        serializer = TestResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='results/(?P<result_id>[^/.]+)')
    def result_detail(self, request, result_id=None):

        result = get_object_or_404(
            TestResult,
            id=result_id,
            user=request.user  # bảo vệ: chỉ xem được kết quả của mình
        )
        serializer = TestResultSerializer(result)
        return Response(serializer.data)