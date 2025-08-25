from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from .models import Test, Question, Answer, TestResult, UserProfile, PsyToolkitTest, PsyToolkitImportLog
from .psy_toolkit_service import psy_toolkit_service
from .serializers import (
    TestSerializer, TestListSerializer, TestSubmissionSerializer,
    TestResultSerializer, UserSerializer, RegisterSerializer,
    LoginSerializer, UserProfileSerializer, DynamicProfileSerializer,
    PsyToolkitTestSerializer
)
import json
import logging

logger = logging.getLogger(__name__)


class TestListView(generics.ListAPIView):
    """Список всех доступных тестов"""
    queryset = Test.objects.filter(is_active=True)
    serializer_class = TestListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


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
                'recommendations': ''
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
        return descriptions.get(trait, trait)
    
    def get_trait_recommendations(self, trait, score):
        """Временно отключено: возвращаем пустые рекомендации"""
        return ''


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


class PsyToolkitViewSet(generics.ListCreateAPIView):
    """ViewSet для работы с PsyToolkit тестами"""
    serializer_class = PsyToolkitTestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PsyToolkitTest.objects.all()
        
        # Фильтрация по категории
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Фильтрация по статусу импорта
        is_imported = self.request.query_params.get('is_imported', None)
        if is_imported is not None:
            queryset = queryset.filter(is_imported=is_imported.lower() == 'true')
        
        # Поиск по названию или описанию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(tags__contains=[search])
            )
        
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """Переопределяем list для возврата правильного формата"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({
                'message': 'Тест PsyToolkit успешно создан',
                'test': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_psytoolkit_tests(request):
    """Поиск тестов в PsyToolkit (локальная база)"""
    try:
        query = request.GET.get('q', '')
        category = request.GET.get('category', '')
        limit = int(request.GET.get('limit', 20))
        
        # Ищем в локальной базе PsyToolkit тестов
        queryset = PsyToolkitTest.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query) |
                Q(tags__contains=[query])
            )
        
        if category:
            queryset = queryset.filter(category=category)
        
        # Ограничиваем количество результатов
        tests = queryset[:limit]
        
        # Сериализуем результаты
        serializer = PsyToolkitTestSerializer(tests, many=True)
        
        return Response({
            'success': True,
            'tests': serializer.data,
            'count': len(serializer.data)
        })
        
    except Exception as e:
        logger.error(f"Ошибка при поиске тестов PsyToolkit: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_psytoolkit_test_details(request, test_id):
    """Получение детальной информации о тесте PsyToolkit"""
    try:
        test_details = psy_toolkit_service.get_test_details(test_id)
        
        if not test_details:
            return Response({
                'success': False,
                'error': 'Тест не найден'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'test': test_details
        })
        
    except Exception as e:
        logger.error(f"Ошибка при получении деталей теста {test_id}: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def import_psytoolkit_test(request):
    """Импорт теста из PsyToolkit"""
    try:
        test_id = request.data.get('test_id')
        if not test_id:
            return Response({
                'success': False,
                'error': 'Не указан ID теста'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Импортируем тест
        imported_test = psy_toolkit_service.import_test(test_id, user=request.user)
        
        if not imported_test:
            return Response({
                'success': False,
                'error': 'Не удалось импортировать тест'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Сериализуем результат
        test_serializer = TestSerializer(imported_test)
        
        return Response({
            'success': True,
            'message': f'Тест "{imported_test.name}" успешно импортирован',
            'test': test_serializer.data
        })
        
    except Exception as e:
        logger.error(f"Ошибка при импорте теста: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_psytoolkit_tests(request):
    """Синхронизация доступных тестов из PsyToolkit"""
    try:
        categories = request.data.get('categories', [])
        if not categories:
            categories = ['personality', 'cognitive', 'clinical', 'neuropsychological']
        
        # Синхронизируем тесты
        synced_count = psy_toolkit_service.sync_available_tests(categories)
        
        return Response({
            'success': True,
            'message': f'Синхронизировано {synced_count} тестов',
            'synced_count': synced_count
        })
        
    except Exception as e:
        logger.error(f"Ошибка при синхронизации тестов: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_psytoolkit_import_logs(request):
    """Получение логов импорта PsyToolkit тестов"""
    try:
        logs = PsyToolkitImportLog.objects.all().order_by('-import_date')
        
        # Фильтрация по статусу
        status_filter = request.GET.get('status', None)
        if status_filter:
            logs = logs.filter(status=status_filter)
        
        # Пагинация
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        logs_data = []
        for log in logs[start:end]:
            logs_data.append({
                'id': log.id,
                'psy_toolkit_test': {
                    'id': log.psy_toolkit_test.id,
                    'name': log.psy_toolkit_test.name,
                    'psy_toolkit_id': log.psy_toolkit_test.psy_toolkit_id
                },
                'imported_test': {
                    'id': log.imported_test.id,
                    'name': log.imported_test.name
                } if log.imported_test else None,
                'import_date': log.import_date,
                'status': log.status,
                'details': log.details,
                'imported_by': log.imported_by.username if log.imported_by else None
            })
        
        return Response({
            'success': True,
            'logs': logs_data,
            'total_count': logs.count(),
            'page': page,
            'page_size': page_size
        })
        
    except Exception as e:
        logger.error(f"Ошибка при получении логов импорта: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_available_psytoolkit_categories(request):
    """Получение доступных категорий PsyToolkit тестов"""
    try:
        categories = [
            {'id': 'personality', 'name': 'Личностные тесты', 'description': 'Тесты для оценки черт личности'},
            {'id': 'cognitive', 'name': 'Когнитивные тесты', 'description': 'Тесты интеллекта и когнитивных способностей'},
            {'id': 'clinical', 'name': 'Клинические тесты', 'description': 'Тесты для клинической диагностики'},
            {'id': 'neuropsychological', 'name': 'Нейропсихологические тесты', 'description': 'Тесты внимания, памяти, восприятия'},
            {'id': 'social', 'name': 'Социальные тесты', 'description': 'Тесты социальных навыков и отношений'},
            {'id': 'educational', 'name': 'Образовательные тесты', 'description': 'Тесты для образовательных целей'},
            {'id': 'workplace', 'name': 'Рабочие тесты', 'description': 'Тесты для оценки профессиональных качеств'}
        ]
        
        return Response({
            'success': True,
            'categories': categories
        })
        
    except Exception as e:
        logger.error(f"Ошибка при получении категорий: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_psytoolkit_test_statistics(request):
    """Получение статистики по PsyToolkit тестам"""
    try:
        total_tests = PsyToolkitTest.objects.count()
        imported_tests = PsyToolkitTest.objects.filter(is_imported=True).count()
        available_tests = total_tests - imported_tests
        
        # Статистика по категориям
        category_stats = {}
        for test in PsyToolkitTest.objects.all():
            category = test.category
            if category not in category_stats:
                category_stats[category] = {'total': 0, 'imported': 0}
            category_stats[category]['total'] += 1
            if test.is_imported:
                category_stats[category]['imported'] += 1
        
        # Последние импорты
        recent_imports = PsyToolkitImportLog.objects.filter(
            status='success'
        ).order_by('-import_date')[:5]
        
        recent_imports_data = []
        for log in recent_imports:
            recent_imports_data.append({
                'test_name': log.psy_toolkit_test.name,
                'import_date': log.import_date,
                'imported_by': log.imported_by.username if log.imported_by else 'Система'
            })
        
        return Response({
            'success': True,
            'statistics': {
                'total_tests': total_tests,
                'imported_tests': imported_tests,
                'available_tests': available_tests,
                'import_rate': round((imported_tests / total_tests * 100) if total_tests > 0 else 0, 2),
                'category_stats': category_stats,
                'recent_imports': recent_imports_data
            }
        })
        
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
