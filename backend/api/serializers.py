from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Test, Question, Answer, UserProfile, TestResult


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text', 'value', 'personality_trait')


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'order', 'answers')


class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = ('id', 'name', 'description', 'questions', 'question_count', 'created_at', 'is_active')
    
    def get_question_count(self, obj):
        return obj.questions.count()


class TestListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = ('id', 'name', 'description', 'question_count', 'created_at')
    
    def get_question_count(self, obj):
        return obj.questions.count()


class TestSubmissionSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.IntegerField(),
        help_text="Словарь с ID вопроса в качестве ключа и ID ответа в качестве значения"
    )
    response_time = serializers.DictField(
        child=serializers.FloatField(),
        required=False,
        help_text="Время ответа на каждый вопрос в секундах"
    )
    confidence_levels = serializers.DictField(
        child=serializers.IntegerField(min_value=1, max_value=5),
        required=False,
        help_text="Уровень уверенности в ответах (1-5)"
    )
    metadata = serializers.DictField(
        required=False,
        help_text="Дополнительные метаданные"
    )


class TestResultSerializer(serializers.ModelSerializer):
    test = TestSerializer(read_only=True)
    personality_map = serializers.JSONField(read_only=True)
    score = serializers.JSONField(read_only=True)
    response_time = serializers.JSONField(read_only=True)
    confidence_levels = serializers.JSONField(read_only=True)
    metadata = serializers.JSONField(read_only=True)
    
    class Meta:
        model = TestResult
        fields = ('id', 'test', 'answers', 'personality_map', 'score', 'response_time', 
                 'confidence_levels', 'metadata', 'completed_at')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    history = serializers.JSONField(read_only=True)
    dynamic_profile = serializers.JSONField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'created_at', 'updated_at', 'history', 'dynamic_profile')


class DynamicProfileSerializer(serializers.Serializer):
    """Сериализатор для динамического профиля пользователя"""
    traits = serializers.DictField()
    connections = serializers.ListField()
    inconsistencies = serializers.ListField()
    patterns = serializers.DictField()
    overall_score = serializers.FloatField()
    last_updated = serializers.CharField()
    total_tests = serializers.IntegerField()
    unique_traits = serializers.IntegerField()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Пароли не совпадают")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Профиль создается автоматически через сигнал
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
