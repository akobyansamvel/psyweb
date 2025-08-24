from django.contrib import admin
from .models import Test, Question, Answer, UserProfile, TestResult


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('test', 'text', 'order')
    list_filter = ('test', 'order')
    search_fields = ('text',)
    ordering = ('test', 'order')


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'text', 'value', 'personality_trait')
    list_filter = ('personality_trait', 'value')
    search_fields = ('text', 'personality_trait')
    ordering = ('question', 'id')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    ordering = ('-created_at',)


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'test', 'completed_at', 'overall_score')
    list_filter = ('test', 'completed_at')
    search_fields = ('user__username', 'test__name')
    ordering = ('-completed_at',)
    readonly_fields = ('personality_map', 'score')
    
    def overall_score(self, obj):
        if obj.personality_map and isinstance(obj.personality_map, dict):
            return obj.personality_map.get('overall_score', 0)
        return 0
    overall_score.short_description = 'Общий балл'
