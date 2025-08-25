import requests
import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from .models import Test, Question, Answer, PsyToolkitTest, PsyToolkitImportLog

logger = logging.getLogger(__name__)


class PsyToolkitService:
    """Сервис для работы с PsyToolkit API"""
    
    def __init__(self):
        self.base_url = "https://www.psytoolkit.org/api"
        self.session = requests.Session()
        # Можно добавить API ключ если потребуется
        # self.session.headers.update({'Authorization': f'Bearer {settings.PSYTOOLKIT_API_KEY}'})
    
    def search_tests(self, query: str = "", category: str = "", limit: int = 20) -> List[Dict]:
        """
        Поиск тестов в PsyToolkit
        
        Args:
            query: Поисковый запрос
            category: Категория тестов
            limit: Количество результатов
            
        Returns:
            Список найденных тестов
        """
        try:
            params = {
                'q': query,
                'category': category,
                'limit': limit,
                'format': 'json'
            }
            
            response = self.session.get(f"{self.base_url}/tests", params=params)
            response.raise_for_status()
            
            return response.json().get('tests', [])
            
        except requests.RequestException as e:
            logger.error(f"Ошибка при поиске тестов в PsyToolkit: {e}")
            return []
    
    def get_test_details(self, test_id: str) -> Optional[Dict]:
        """
        Получение детальной информации о тесте
        
        Args:
            test_id: ID теста в PsyToolkit
            
        Returns:
            Детальная информация о тесте или None
        """
        try:
            response = self.session.get(f"{self.base_url}/tests/{test_id}")
            response.raise_for_status()
            
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Ошибка при получении деталей теста {test_id}: {e}")
            return None
    
    def download_test_data(self, test_id: str) -> Optional[Dict]:
        """
        Загрузка данных теста для импорта
        
        Args:
            test_id: ID теста в PsyToolkit
            
        Returns:
            Данные теста или None
        """
        try:
            # Получаем детальную информацию о тесте
            test_details = self.get_test_details(test_id)
            if not test_details:
                return None
            
            # Загружаем полные данные теста
            response = self.session.get(f"{self.base_url}/tests/{test_id}/data")
            response.raise_for_status()
            
            test_data = response.json()
            test_data['metadata'] = test_details
            
            return test_data
            
        except requests.RequestException as e:
            logger.error(f"Ошибка при загрузке данных теста {test_id}: {e}")
            return None
    
    def import_test(self, test_id: str, user=None, force: bool = False) -> Optional[Test]:
        """
        Импорт теста из PsyToolkit в локальную базу данных
        
        Args:
            test_id: ID теста в PsyToolkit
            user: Пользователь, который импортирует тест
            
        Returns:
            Импортированный тест или None
        """
        try:
            # Проверяем, не импортирован ли уже этот тест
            existing_psy_test = PsyToolkitTest.objects.filter(psy_toolkit_id=test_id).first()
            if existing_psy_test and existing_psy_test.is_imported and not force:
                logger.warning(f"Тест {test_id} уже импортирован")
                return existing_psy_test.imported_test
            
            # Загружаем данные теста
            test_data = self.download_test_data(test_id)
            if not test_data:
                return None
            
            # Создаем или обновляем запись PsyToolkitTest
            psy_test, created = PsyToolkitTest.objects.get_or_create(
                psy_toolkit_id=test_id,
                defaults={
                    'name': test_data.get('metadata', {}).get('name', f'Test {test_id}'),
                    'description': test_data.get('metadata', {}).get('description', ''),
                    'author': test_data.get('metadata', {}).get('author', ''),
                    'category': test_data.get('metadata', {}).get('category', ''),
                    'tags': test_data.get('metadata', {}).get('tags', []),
                    'raw_data': test_data
                }
            )
            
            if not created:
                psy_test.raw_data = test_data
                psy_test.save()
            
            # Создаем или переиспользуем локальный тест
            test = None
            if existing_psy_test and existing_psy_test.is_imported and force and existing_psy_test.imported_test:
                # Очищаем существующий тест и переиспользуем запись
                test = existing_psy_test.imported_test
                # удаляем вопросы/ответы
                for q in test.questions.all():
                    q.answers.all().delete()
                test.questions.all().delete()
                # обновляем основные поля
                test.name = psy_test.name
                test.description = psy_test.description
                test.source = 'psytoolkit'
                test.psy_toolkit_id = test_id
                test.psy_toolkit_data = test_data
                test.test_type = self._determine_test_type(test_data)
                test.estimated_duration = self._estimate_duration(test_data)
                test.difficulty_level = self._determine_difficulty(test_data)
                test.is_active = True
                test.save()
            else:
                test = Test.objects.create(
                    name=psy_test.name,
                    description=psy_test.description,
                    source='psytoolkit',
                    psy_toolkit_id=test_id,
                    psy_toolkit_data=test_data,
                    test_type=self._determine_test_type(test_data),
                    estimated_duration=self._estimate_duration(test_data),
                    difficulty_level=self._determine_difficulty(test_data)
                )
            
            # Импортируем вопросы и ответы
            self._import_questions_and_answers(test, test_data)
            
            # Обновляем PsyToolkitTest
            psy_test.is_imported = True
            psy_test.imported_test = test
            psy_test.save()
            
            # Создаем лог импорта
            PsyToolkitImportLog.objects.create(
                psy_toolkit_test=psy_test,
                imported_test=test,
                status='success',
                details={'imported_questions': test.questions.count()},
                imported_by=user
            )
            
            logger.info(f"Успешно импортирован тест {test_id} как {test.name}")
            return test
            
        except Exception as e:
            logger.error(f"Ошибка при импорте теста {test_id}: {e}")
            
            # Создаем лог ошибки
            if 'psy_test' in locals():
                PsyToolkitImportLog.objects.create(
                    psy_toolkit_test=psy_test,
                    imported_test=None,
                    status='error',
                    details={'error': str(e)},
                    imported_by=user
                )
            
            return None
    
    def _determine_test_type(self, test_data: Dict) -> str:
        """Определяет тип теста на основе данных"""
        metadata = test_data.get('metadata', {})
        tags = metadata.get('tags', [])
        
        # Анализируем теги и метаданные для определения типа
        if any(tag.lower() in ['personality', 'big5', 'mbti'] for tag in tags):
            return 'personality'
        elif any(tag.lower() in ['cognitive', 'intelligence', 'iq'] for tag in tags):
            return 'cognitive'
        elif any(tag.lower() in ['clinical', 'mental_health', 'depression', 'anxiety'] for tag in tags):
            return 'clinical'
        elif any(tag.lower() in ['attention', 'memory', 'perception'] for tag in tags):
            return 'neuropsychological'
        else:
            return 'general'
    
    def _estimate_duration(self, test_data: Dict) -> int:
        """Оценивает длительность теста в минутах"""
        questions = test_data.get('questions', [])
        # Примерная оценка: 30 секунд на вопрос
        estimated_minutes = max(5, len(questions) // 2)
        return min(estimated_minutes, 120)  # Максимум 2 часа
    
    def _determine_difficulty(self, test_data: Dict) -> str:
        """Определяет уровень сложности теста"""
        metadata = test_data.get('metadata', {})
        tags = metadata.get('tags', [])
        
        if any(tag.lower() in ['expert', 'advanced', 'professional'] for tag in tags):
            return 'hard'
        elif any(tag.lower() in ['beginner', 'simple', 'basic'] for tag in tags):
            return 'easy'
        else:
            return 'medium'
    
    def _import_questions_and_answers(self, test: Test, test_data: Dict):
        """Импортирует вопросы и ответы из данных PsyToolkit"""
        questions_data = test_data.get('questions', [])
        
        for order, question_data in enumerate(questions_data, 1):
            # Создаем вопрос
            # Пытаемся извлечь текст вопроса из альтернативных ключей
            q_text = question_data.get('text') or \
                     question_data.get('statement') or \
                     question_data.get('prompt') or \
                     question_data.get('question_text') or \
                     f'Вопрос {order}'

            question = Question.objects.create(
                test=test,
                text=q_text,
                order=order,
                question_type=self._map_question_type(question_data.get('type', 'multiple_choice')),
                psy_toolkit_data=question_data,
                required=question_data.get('required', True)
            )
            
            # Создаем ответы
            answers_data = question_data.get('answers', [])
            for answer_data in answers_data:
                Answer.objects.create(
                    question=question,
                    text=answer_data.get('text', ''),
                    value=answer_data.get('value', 0),
                    personality_trait=answer_data.get('trait', ''),
                    psy_toolkit_data=answer_data,
                    is_correct=answer_data.get('correct', False)
                )
    
    def _map_question_type(self, psy_type: str) -> str:
        """Маппинг типов вопросов PsyToolkit в локальные типы"""
        type_mapping = {
            'multiple_choice': 'multiple_choice',
            'single_choice': 'single_choice',
            'text': 'text',
            'number': 'number',
            'slider': 'slider',
            'likert': 'likert_scale'
        }
        return type_mapping.get(psy_type, 'multiple_choice')
    
    def sync_available_tests(self, categories: List[str] = None) -> int:
        """
        Синхронизирует список доступных тестов из PsyToolkit
        
        Args:
            categories: Список категорий для синхронизации
            
        Returns:
            Количество синхронизированных тестов
        """
        if not categories:
            categories = ['personality', 'cognitive', 'clinical', 'neuropsychological']
        
        total_synced = 0
        
        for category in categories:
            try:
                tests = self.search_tests(category=category, limit=50)
                
                for test_data in tests:
                    test_id = test_data.get('id')
                    if not test_id:
                        continue
                    
                    # Создаем или обновляем запись PsyToolkitTest
                    psy_test, created = PsyToolkitTest.objects.get_or_create(
                        psy_toolkit_id=test_id,
                        defaults={
                            'name': test_data.get('name', f'Test {test_id}'),
                            'description': test_data.get('description', ''),
                            'author': test_data.get('author', ''),
                            'category': category,
                            'tags': test_data.get('tags', []),
                            'raw_data': test_data
                        }
                    )
                    
                    if not created:
                        # Обновляем существующую запись
                        psy_test.name = test_data.get('name', psy_test.name)
                        psy_test.description = test_data.get('description', psy_test.description)
                        psy_test.author = test_data.get('author', psy_test.author)
                        psy_test.category = category
                        psy_test.tags = test_data.get('tags', [])
                        psy_test.raw_data = test_data
                        psy_test.save()
                    
                    total_synced += 1
                
            except Exception as e:
                logger.error(f"Ошибка при синхронизации категории {category}: {e}")
        
        return total_synced


# Создаем экземпляр сервиса для использования
psy_toolkit_service = PsyToolkitService()
