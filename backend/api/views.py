from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Test, Question, Answer, TestResult, UserProfile
from .serializers import (
    TestSerializer, TestListSerializer, TestSubmissionSerializer,
    TestResultSerializer, UserSerializer, RegisterSerializer,
    LoginSerializer, UserProfileSerializer, DynamicProfileSerializer
)
import json


class TestListView(generics.ListAPIView):
    """Список всех доступных тестов"""
    queryset = Test.objects.filter(is_active=True)
    serializer_class = TestListSerializer
    permission_classes = [permissions.AllowAny]


class TestDetailView(generics.RetrieveAPIView):
    """Детали конкретного теста с вопросами"""
    queryset = Test.objects.filter(is_active=True)
    serializer_class = TestSerializer
    permission_classes = [permissions.AllowAny]


class TestSubmissionView(APIView):
    """Отправка ответов на тест и генерация карты личности"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, test_id):
        test = get_object_or_404(Test, id=test_id, is_active=True)
        serializer = TestSubmissionSerializer(data=request.data)
        
        if serializer.is_valid():
            answers = serializer.validated_data['answers']
            response_time = serializer.validated_data.get('response_time', {})
            confidence_levels = serializer.validated_data.get('confidence_levels', {})
            metadata = serializer.validated_data.get('metadata', {})
            
            # Проверяем, что все вопросы теста отвечены
            test_questions = test.questions.all()
            if len(answers) != test_questions.count():
                return Response(
                    {'error': 'Необходимо ответить на все вопросы теста'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Генерируем карту личности
            personality_map, scores = self.generate_personality_map(test, answers)
            
            # Сохраняем результат
            with transaction.atomic():
                test_result = TestResult.objects.create(
                    user=request.user,
                    test=test,
                    answers=answers,
                    personality_map=personality_map,
                    score=scores,
                    response_time=response_time,
                    confidence_levels=confidence_levels,
                    metadata=metadata
                )
            
            return Response({
                'message': 'Тест успешно завершен',
                'result_id': test_result.id,
                'personality_map': personality_map,
                'scores': scores
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def generate_personality_map(self, test, answers):
        """Генерирует карту личности на основе ответов"""
        # Получаем все ответы пользователя
        user_answers = []
        for question_id, answer_id in answers.items():
            try:
                answer = Answer.objects.get(id=answer_id)
                user_answers.append({
                    'question_id': question_id,
                    'answer_id': answer_id,
                    'personality_trait': answer.personality_trait,
                    'value': answer.value
                })
            except Answer.DoesNotExist:
                continue
        
        # Подсчитываем баллы по чертам личности
        trait_scores = {}
        for answer_data in user_answers:
            trait = answer_data['personality_trait']
            value = answer_data['value']
            trait_scores[trait] = trait_scores.get(trait, 0) + value
        
        # Нормализуем баллы (0-100)
        max_possible_score = len(user_answers) * 5  # Предполагаем максимальный балл за ответ = 5
        normalized_scores = {}
        for trait, score in trait_scores.items():
            normalized_scores[trait] = min(100, max(0, int((score / max_possible_score) * 100)))
        
        # Создаем карту личности
        personality_map = {
            'traits': {},
            'connections': [],
            'overall_score': sum(normalized_scores.values()) // len(normalized_scores) if normalized_scores else 0
        }
        
        # Добавляем черты личности
        for trait, score in normalized_scores.items():
            personality_map['traits'][trait] = {
                'score': score,
                'level': self.get_trait_level(score),
                'description': self.get_trait_description(trait, score),
                'recommendations': self.get_trait_recommendations(trait, score)
            }
        
        # Добавляем связи между чертами (простая логика)
        traits_list = list(normalized_scores.keys())
        for i, trait1 in enumerate(traits_list):
            for trait2 in traits_list[i+1:]:
                # Создаем связь если обе черты имеют высокие баллы
                if (normalized_scores[trait1] > 70 and normalized_scores[trait2] > 70):
                    personality_map['connections'].append({
                        'from': trait1,
                        'to': trait2,
                        'strength': min(normalized_scores[trait1], normalized_scores[trait2])
                    })
        
        return personality_map, normalized_scores
    
    def get_trait_level(self, score):
        """Определяет уровень черты личности по баллу"""
        if score >= 80:
            return "Очень высокий"
        elif score >= 60:
            return "Высокий"
        elif score >= 40:
            return "Средний"
        elif score >= 20:
            return "Низкий"
        else:
            return "Очень низкий"
    
    def get_trait_description(self, trait, score):
        """Возвращает описание черты личности"""
        descriptions = {
            'Экстраверсия': 'Способность получать энергию от внешнего мира и взаимодействия с людьми',
            'Интроверсия': 'Способность получать энергию от внутреннего мира и размышлений',
            'Открытость': 'Готовность к новому опыту и творческому мышлению',
            'Добросовестность': 'Самодисциплина, организованность и целеустремленность',
            'Доброжелательность': 'Сотрудничество, доверие и альтруизм',
            'Нейротизм': 'Эмоциональная стабильность и устойчивость к стрессу',
            'Креативность': 'Способность к нестандартному мышлению и творчеству',
            'Лидерство': 'Способность влиять на других и принимать решения',
            'Эмпатия': 'Способность понимать чувства и эмоции других людей',
            'Адаптивность': 'Гибкость в изменяющихся условиях'
        }
        return descriptions.get(trait, f'Черта личности: {trait}')
    
    def get_trait_recommendations(self, trait, score):
        """Возвращает рекомендации по развитию черты личности"""
        if score >= 80:
            return f"У вас отлично развита черта '{trait}'. Продолжайте развивать её и используйте для достижения целей."
        elif score >= 60:
            return f"Черта '{trait}' развита хорошо. Работайте над её укреплением для лучших результатов."
        elif score >= 40:
            return f"Черта '{trait}' развита на среднем уровне. Регулярная практика поможет улучшить её."
        elif score >= 20:
            return f"Черта '{trait}' требует развития. Начните с небольших шагов и постепенно увеличивайте нагрузку."
        else:
            return f"Черта '{trait}' нуждается в активном развитии. Рассмотрите возможность работы с коучем или психологом."


class TestResultView(generics.RetrieveAPIView):
    """Просмотр результата конкретного теста"""
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TestResult.objects.filter(user=self.request.user)


class UserHistoryView(generics.ListAPIView):
    """История результатов тестов пользователя"""
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TestResult.objects.filter(user=self.request.user).order_by('-completed_at')


class UserDynamicProfileView(APIView):
    """Динамический профиль пользователя с анализом паттернов"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Возвращает текущий динамический профиль пользователя"""
        try:
            profile = request.user.profile
            # Обновляем динамический профиль перед возвратом
            profile.update_dynamic_profile()
            
            serializer = DynamicProfileSerializer(profile.dynamic_profile)
            return Response({
                'message': 'Динамический профиль успешно получен',
                'profile': serializer.data
            })
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Профиль пользователя не найден'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Ошибка при получении профиля: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    """Регистрация нового пользователя"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Пользователь успешно зарегистрирован',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Авторизация пользователя"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Успешная авторизация',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            else:
                return Response({
                    'error': 'Неверные учетные данные'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Профиль пользователя"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile
