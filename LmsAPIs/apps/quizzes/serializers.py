from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Quiz, Question, Answer, TestResult


# ══════════════════════════════════════════════════════════
# STUDENT serializers (giữ nguyên)
# ══════════════════════════════════════════════════════════

class AnswerStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'content']


class QuestionStudentSerializer(serializers.ModelSerializer):
    answers = AnswerStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'content', 'points', 'answers']


class QuizDetailStudentSerializer(serializers.ModelSerializer):
    questions = QuestionStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'time_limit', 'passing_score', 'questions']


class QuizSubmissionSerializer(serializers.Serializer):
    submitted_answers = serializers.JSONField()


class AnswerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'content', 'is_correct']


class QuestionReviewSerializer(serializers.ModelSerializer):
    answers = AnswerReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'content', 'points', 'answers']


class QuizReviewSerializer(serializers.ModelSerializer):
    questions = QuestionReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'questions']


class TestResultSerializer(serializers.ModelSerializer):
    quiz = QuizReviewSerializer(read_only=True)

    class Meta:
        model = TestResult
        fields = [
            'id', 'quiz', 'score', 'percentage', 'is_passed',
            'submitted_answers', 'strength_analysis', 'weakness_analysis',
            'created_date','ai_summary'
        ]


# ══════════════════════════════════════════════════════════
# TEACHER serializers
# ══════════════════════════════════════════════════════════

class AnswerManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'content', 'is_correct')
        read_only_fields = ('id',)


class QuestionManageSerializer(serializers.ModelSerializer):

    answers = AnswerManageSerializer(many=True)

    class Meta:
        model = Question

        fields = ('id', 'content', 'points', 'quiz', 'answers')
        read_only_fields = ('id',)
        extra_kwargs = {'quiz': {'required': False}}

    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        question = Question.objects.create(**validated_data)
        for answer_data in answers_data:
            Answer.objects.create(question=question, **answer_data)
        return question

    def update(self, instance, validated_data):
        answers_data = validated_data.pop('answers', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if answers_data is not None:
            instance.answers.all().delete()
            for answer_data in answers_data:
                Answer.objects.create(question=instance, **answer_data)
        return instance


class QuizManageSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'time_limit', 'passing_score', 'course', 'question_count')
        read_only_fields = ('id', 'question_count')

    def get_question_count(self, obj):
        return obj.questions.count()
class TeacherTestResultSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='user.email', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model = TestResult
        fields = [
            'id', 'student_name', 'student_email',
            'quiz_title', 'score', 'percentage',
            'is_passed', 'created_date',
        ]

    def get_student_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class TeacherStudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_quizzes_done = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()
    pass_rate = serializers.SerializerMethodField()
    enrolled_courses = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            'id', 'full_name', 'email',
            'enrolled_courses',
            'total_quizzes_done', 'avg_score', 'pass_rate',
        ]

    def _get_results(self, obj):
        quiz_id = self.context.get('quiz_id')
        qs = obj.test_results.all()
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return list(qs)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_enrolled_courses(self, obj):
        request = self.context.get('request')
        qs = obj.enrollments.all()
        if request and not request.user.is_staff:
            qs = qs.filter(course__teacher=request.user)

        # ĐÃ SỬA LỖI Ở ĐÂY:
        # Lấy thuộc tính 'subject', nếu không có thì thử lấy 'name', nếu vẫn không có thì hiện 'Khóa học'
        return [getattr(e.course, 'subject', getattr(e.course, 'name', 'Khóa học')) for e in qs]

    def get_total_quizzes_done(self, obj):
        return len(self._get_results(obj))

    def get_avg_score(self, obj):
        results = self._get_results(obj)
        if not results:
            return 0
        return round(sum(r.percentage for r in results) / len(results), 1)

    def get_pass_rate(self, obj):
        results = self._get_results(obj)
        if not results:
            return 0
        passed = sum(1 for r in results if r.is_passed)
        return round((passed / len(results)) * 100, 1)
