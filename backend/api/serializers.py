from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Test, Question, Answer, UserProfile, TestResult, PsyToolkitTest, PsyToolkitImportLog


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
        fields = (
            'id', 'text', 'order', 'image_url', 'image_alt', 'answers'
        )


def _localize_test_name(name: str) -> str:
    """Возвращает локализованное русское название теста и убирает числовые скобки."""
    if not name:
        return ''
    import re
    normalized = re.sub(r"\s*\(\s*\d+\s*\)\s*$", "", name)
    mapping = {
        'IPIP Big Five': 'Большая пятёрка (IPIP)',
        'IPIP Big Five (50)': 'Большая пятёрка (IPIP-50)',
        'Big Five Personality Test': 'Большая пятёрка (личностный тест)',
        'PHQ-9': 'PHQ‑9 (депрессия)',
        'GAD-7': 'GAD‑7 (тревога)',
        'Rosenberg Self-Esteem': 'Самооценка Розенберга',
        'PSS-10': 'PSS‑10 (стресс)',
        'Satisfaction With Life (SWLS)': 'Удовлетворённость жизнью (SWLS)',
        'MBTI Short': 'MBTI (сокращённый)',
        'MBTI Short (30)': 'MBTI (сокращённый, 30)',
        'MBTI Personality Assessment': 'MBTI (оценка типа личности)',
        "Raven's Progressive Matrices": 'Прогрессивные матрицы Равена',
        'Beck Depression Inventory': 'Опросник депрессии Бека',
        'Cognitive Reasoning': 'Логико‑аналитические задачи',
        'Working Memory': 'Оперативная память',
        'Emotional Intelligence': 'Эмоциональный интеллект',
        'Resilience': 'Психологическая устойчивость',
        'Mindfulness': 'Осознанность',
        'Sleep Quality': 'Качество сна',
        'Motivation': 'Мотивация',
        'Attentional Control': 'Контроль внимания',
        'Social Anxiety': 'Социальная тревожность',
        'Impulsivity': 'Импульсивность',
        'Visual Pattern Recognition': 'Распознавание визуальных паттернов',
        'Verbal Reasoning': 'Вербальное рассуждение',
        'Learning Strategies': 'Стратегии обучения',
        'MBTI with Confidence Scale': 'MBTI с оценкой уверенности',
    }
    return mapping.get(normalized, normalized)


class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    name_localized = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = (
            'id', 'name', 'name_localized', 'description', 'image_url', 'questions', 'question_count', 'created_at', 'is_active', 
            'source', 'psy_toolkit_id', 'test_type', 'estimated_duration', 'difficulty_level'
        )
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_name_localized(self, obj):
        return _localize_test_name(obj.name)


class TestListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    name_localized = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = ('id', 'name', 'name_localized', 'description', 'question_count', 'created_at', 'source', 'test_type')
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_name_localized(self, obj):
        return _localize_test_name(obj.name)


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
                 'confidence_levels', 'metadata', 'completed_at', 'psy_toolkit_result_id')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    history = serializers.JSONField(read_only=True)
    dynamic_profile = serializers.JSONField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'created_at', 'updated_at', 'history', 'dynamic_profile', 
                 'psy_toolkit_preferences', 'completed_psy_toolkit_tests')


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


class PsyToolkitTestSerializer(serializers.ModelSerializer):
    """Сериализатор для PsyToolkit тестов"""
    imported_test = TestSerializer(read_only=True)
    tags_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PsyToolkitTest
        fields = ('id', 'name', 'description', 'psy_toolkit_id', 'author', 'category', 
                 'tags', 'tags_display', 'is_imported', 'imported_test', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_tags_display(self, obj):
        """Возвращает теги в читаемом формате"""
        return ', '.join(obj.tags) if obj.tags else ''


class PsyToolkitImportLogSerializer(serializers.ModelSerializer):
    """Сериализатор для логов импорта PsyToolkit"""
    psy_toolkit_test = PsyToolkitTestSerializer(read_only=True)
    imported_test = TestSerializer(read_only=True)
    imported_by = UserSerializer(read_only=True)
    
    class Meta:
        model = PsyToolkitImportLog
        fields = ('id', 'psy_toolkit_test', 'imported_test', 'import_date', 'status', 
                 'details', 'imported_by')


class PsyToolkitSearchSerializer(serializers.Serializer):
    """Сериализатор для поиска тестов в PsyToolkit"""
    query = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(min_value=1, max_value=100, default=20)


class PsyToolkitImportSerializer(serializers.Serializer):
    """Сериализатор для импорта теста из PsyToolkit"""
    test_id = serializers.CharField(help_text="ID теста в PsyToolkit")


class PsyToolkitSyncSerializer(serializers.Serializer):
    """Сериализатор для синхронизации тестов из PsyToolkit"""
    categories = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Список категорий для синхронизации"
    )


class PsyToolkitTestDetailsSerializer(serializers.Serializer):
    """Сериализатор для детальной информации о тесте PsyToolkit"""
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    author = serializers.CharField()
    category = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    estimated_duration = serializers.IntegerField()
    difficulty_level = serializers.CharField()
    question_count = serializers.IntegerField()
    is_available = serializers.BooleanField()
