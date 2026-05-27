from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .filters import QuizFilter
from .models import Quiz, Question, Answer, TestResult
from .serializers import (
    QuizDetailStudentSerializer, QuizSubmissionSerializer, TestResultSerializer,
    QuizManageSerializer, QuestionManageSerializer, TeacherTestResultSerializer, TeacherStudentSerializer,
)
from ..common.perms import IsTeacherOrAdmin


# ══════════════════════════════════════════════════════════
# STUDENT
# ══════════════════════════════════════════════════════════

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

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        submitted_answers = serializer.validated_data.get('submitted_answers', {})
        total_possible_score = 0
        actual_score = 0

        for question in quiz.questions.all():
            total_possible_score += question.points
            submitted_answer_id = submitted_answers.get(str(question.id))
            if submitted_answer_id:
                try:
                    answer = Answer.objects.get(id=submitted_answer_id, question=question)
                    if answer.is_correct:
                        actual_score += question.points
                except Answer.DoesNotExist:
                    pass

        percentage = (actual_score / total_possible_score) * 100 if total_possible_score > 0 else 0
        is_passed = percentage >= quiz.passing_score

        test_result = TestResult.objects.create(
            user=request.user,
            quiz=quiz,
            score=actual_score,
            percentage=percentage,
            is_passed=is_passed,
            submitted_answers=submitted_answers,
        )

        return Response({
            "message": "Nộp bài thành công",
            "result_id": test_result.id,
            "score": actual_score,
            "percentage": round(percentage, 2),
            "is_passed": is_passed,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='my-results')
    def my_results(self, request):
        results = TestResult.objects.filter(
            user=request.user
        ).select_related('quiz').order_by('-created_date')
        serializer = TestResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='results/(?P<result_id>[^/.]+)')
    def result_detail(self, request, result_id=None):
        result = get_object_or_404(TestResult, id=result_id, user=request.user)
        serializer = TestResultSerializer(result)
        return Response(serializer.data)


# ══════════════════════════════════════════════════════════
# TEACHER
# ══════════════════════════════════════════════════════════

class TeacherQuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizManageSerializer
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        qs = Quiz.objects.select_related('course').prefetch_related('questions')
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if not self.request.user.is_staff:
            qs = qs.filter(course__teacher=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'], url_path='student-results')
    def student_results(self, request, pk=None):
        """
        GET /teacher/quizzes/{quiz_id}/student-results/
        Teacher xem danh sách kết quả của tất cả học viên trong 1 quiz
        """
        quiz = self.get_object()
        results = TestResult.objects.filter(
            quiz=quiz
        ).select_related('user').order_by('-created_date')

        serializer = TeacherTestResultSerializer(results, many=True)
        return Response(serializer.data)

class TeacherQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionManageSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = Question.objects.prefetch_related('answers')
        quiz_id = self.kwargs.get('quiz_pk') or self.request.query_params.get('quiz')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    def perform_create(self, serializer):
        quiz_id = self.kwargs.get('quiz_pk') or self.request.data.get('quiz')
        quiz = Quiz.objects.get(pk=quiz_id)
        serializer.save(quiz=quiz)

class TeacherStudentViewSet(viewsets.ViewSet):
    permission_classes = [IsTeacherOrAdmin]

    def list(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        quiz_id = request.query_params.get('quiz')  # ✅ thêm filter này

        if quiz_id:
            # Chỉ lấy học viên đã nộp bài quiz đó
            students = User.objects.filter(
                test_results__quiz_id=quiz_id
            ).distinct().prefetch_related('enrollments__course', 'test_results')
        else:
            # Lấy tất cả học viên enroll vào course của teacher
            if request.user.is_staff:
                students = User.objects.filter(enrollments__isnull=False)
            else:
                students = User.objects.filter(
                    enrollments__course__teacher=request.user
                )
            students = students.distinct().prefetch_related(
                'enrollments__course', 'test_results'
            )

        serializer = TeacherStudentSerializer(
            students, many=True,
            context={'request': request, 'quiz_id': quiz_id}  # ✅ truyền quiz_id xuống
        )
        return Response(serializer.data)