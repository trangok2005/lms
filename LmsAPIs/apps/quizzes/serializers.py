from rest_framework import serializers
from .models import Quiz, Question, Answer, TestResult

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
    quiz = QuizReviewSerializer(read_only=True)  # Nhúng full quiz + answers vào

    class Meta:
        model = TestResult
        fields = [
            'id', 'quiz', 'score', 'percentage', 'is_passed',
            'submitted_answers', 'strength_analysis', 'weakness_analysis',
            'created_date'
        ]