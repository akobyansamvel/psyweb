from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField
import json


class Test(models.Model):
    name = models.CharField(max_length=200, verbose_name="Название теста")
    description = models.TextField(verbose_name="Описание теста")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        verbose_name = "Тест"
        verbose_name_plural = "Тесты"

    def __str__(self):
        return self.name


class Question(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions', verbose_name="Тест")
    text = models.TextField(verbose_name="Текст вопроса")
    order = models.IntegerField(default=0, verbose_name="Порядок вопроса")
    
    class Meta:
        verbose_name = "Вопрос"
        verbose_name_plural = "Вопросы"
        ordering = ['order']

    def __str__(self):
        return f"{self.test.name} - Вопрос {self.order}"


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers', verbose_name="Вопрос")
    text = models.CharField(max_length=200, verbose_name="Текст ответа")
    value = models.IntegerField(verbose_name="Значение ответа")
    personality_trait = models.CharField(max_length=100, verbose_name="Черта личности")
    
    class Meta:
        verbose_name = "Ответ"
        verbose_name_plural = "Ответы"

    def __str__(self):
        return f"{self.question.text[:50]} - {self.text}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Пользователь")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Новые поля для динамического профиля
    history = models.JSONField(default=list, verbose_name="История тестов")
    dynamic_profile = models.JSONField(default=dict, verbose_name="Динамический профиль")

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"

    def __str__(self):
        return f"Профиль {self.user.username}"

    def update_dynamic_profile(self):
        """Обновляет динамический профиль на основе всех результатов тестов"""
        from .utils import analyze_user_patterns, generate_dynamic_personality_map
        
        # Получаем все результаты тестов пользователя
        test_results = TestResult.objects.filter(user=self.user).order_by('completed_at')
        
        if not test_results.exists():
            self.dynamic_profile = {
                'traits': {},
                'connections': [],
                'inconsistencies': [],
                'patterns': [],
                'overall_score': 0,
                'last_updated': None
            }
            self.save()
            return
        
        # Анализируем паттерны и генерируем динамическую карту
        patterns = analyze_user_patterns(test_results)
        dynamic_map = generate_dynamic_personality_map(test_results, patterns)
        
        self.dynamic_profile = dynamic_map
        self.save()


class TestResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_results', verbose_name="Пользователь")
    test = models.ForeignKey(Test, on_delete=models.CASCADE, verbose_name="Тест")
    answers = models.JSONField(default=dict, verbose_name="Ответы")
    personality_map = models.JSONField(default=dict, verbose_name="Карта личности")
    score = models.JSONField(default=dict, verbose_name="Баллы по чертам")
    completed_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата завершения")
    # Новые поля для метаданных
    response_time = models.JSONField(default=dict, verbose_name="Время ответов")
    confidence_levels = models.JSONField(default=dict, verbose_name="Уровни уверенности")
    metadata = models.JSONField(default=dict, verbose_name="Дополнительные метаданные")

    class Meta:
        verbose_name = "Результат теста"
        verbose_name_plural = "Результаты тестов"
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} - {self.test.name} - {self.completed_at.strftime('%d.%m.%Y')}"

    def get_personality_traits(self):
        """Возвращает черты личности с их значениями"""
        if isinstance(self.personality_map, str):
            return json.loads(self.personality_map)
        return self.personality_map or {}

    def get_trait_score(self, trait):
        """Возвращает балл для конкретной черты личности"""
        scores = self.score if isinstance(self.score, dict) else {}
        return scores.get(trait, 0)

    def save(self, *args, **kwargs):
        """Переопределяем save для автоматического обновления профиля"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Обновляем динамический профиль пользователя
        if is_new:
            self.user.profile.update_dynamic_profile()
