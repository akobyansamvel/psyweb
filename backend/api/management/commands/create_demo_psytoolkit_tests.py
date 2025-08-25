from django.core.management.base import BaseCommand
from api.models import PsyToolkitTest, Test, Question, Answer
from django.utils import timezone


class Command(BaseCommand):
    help = 'Создание демонстрационных тестов PsyToolkit в основной базе с вопросами и ответами'

    def handle(self, *args, **options):
        self.stdout.write('Создание полноценных демонстрационных тестов...')
        
        # Список демо-тестов с вопросами и ответами
        demo_tests = [
            {
                'name': 'Big Five Personality Test',
                'description': 'Комплексный тест для оценки пяти основных черт личности: экстраверсия, доброжелательность, добросовестность, нейротизм и открытость опыту.',
                'psy_toolkit_id': 'big5_personality_001',
                'author': 'Dr. John Smith',
                'category': 'personality',
                'tags': ['big5', 'personality', 'traits', 'psychology'],
                'estimated_duration': 15,
                'difficulty_level': 'medium',
                'questions': [
                    {
                        'text': 'Я легко знакомлюсь с новыми людьми',
                        'type': 'likert',
                        'personality_trait': 'Экстраверсия',
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 1},
                            {'text': 'Не согласен', 'value': 2},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 4},
                            {'text': 'Полностью согласен', 'value': 5}
                        ]
                    },
                    {
                        'text': 'Я предпочитаю работать в одиночестве',
                        'type': 'likert',
                        'personality_trait': 'Интроверсия',
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 5},
                            {'text': 'Не согласен', 'value': 4},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 2},
                            {'text': 'Полностью согласен', 'value': 1}
                        ]
                    },
                    {
                        'text': 'Я люблю пробовать новые вещи',
                        'type': 'likert',
                        'personality_trait': 'Открытость',
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 1},
                            {'text': 'Не согласен', 'value': 2},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 4},
                            {'text': 'Полностью согласен', 'value': 5}
                        ]
                    }
                ]
            },
            {
                'name': 'MBTI Personality Assessment',
                'description': 'Тест Майерс-Бриггс для определения типа личности на основе четырех дихотомий.',
                'psy_toolkit_id': 'mbti_assessment_002',
                'author': 'Dr. Sarah Johnson',
                'category': 'personality',
                'tags': ['mbti', 'personality', 'type', 'assessment'],
                'estimated_duration': 20,
                'difficulty_level': 'medium',
                'questions': [
                    {
                        'text': 'В компании я обычно:',
                        'type': 'choice',
                        'personality_trait': 'Экстраверсия-Интроверсия',
                        'answers': [
                            {'text': 'Разговариваю со многими людьми', 'value': 5},
                            {'text': 'Разговариваю с несколькими знакомыми', 'value': 3},
                            {'text': 'Слушаю и наблюдаю', 'value': 1}
                        ]
                    },
                    {
                        'text': 'При принятии решений я больше полагаюсь на:',
                        'type': 'choice',
                        'personality_trait': 'Мышление-Чувство',
                        'answers': [
                            {'text': 'Логику и факты', 'value': 5},
                            {'text': 'Чувства и ценности', 'value': 1}
                        ]
                    }
                ]
            },
            {
                'name': 'Raven\'s Progressive Matrices',
                'description': 'Тест прогрессивных матриц Равена для оценки невербального интеллекта.',
                'psy_toolkit_id': 'raven_matrices_003',
                'author': 'Dr. Michael Brown',
                'category': 'cognitive',
                'tags': ['intelligence', 'cognitive', 'logic', 'matrices'],
                'estimated_duration': 30,
                'difficulty_level': 'hard',
                'questions': [
                    {
                        'text': 'Какая фигура должна быть на месте знака вопроса?',
                        'type': 'choice',
                        'personality_trait': 'Логическое мышление',
                        'answers': [
                            {'text': 'Круг', 'value': 5, 'is_correct': True},
                            {'text': 'Квадрат', 'value': 0, 'is_correct': False},
                            {'text': 'Треугольник', 'value': 0, 'is_correct': False}
                        ]
                    },
                    {
                        'text': 'Продолжите последовательность: 2, 4, 8, 16, ?',
                        'type': 'choice',
                        'personality_trait': 'Математическое мышление',
                        'answers': [
                            {'text': '24', 'value': 0, 'is_correct': False},
                            {'text': '32', 'value': 5, 'is_correct': True},
                            {'text': '30', 'value': 0, 'is_correct': False}
                        ]
                    }
                ]
            },
            {
                'name': 'Beck Depression Inventory',
                'description': 'Опросник депрессии Бека для оценки тяжести депрессивных симптомов.',
                'psy_toolkit_id': 'beck_depression_004',
                'author': 'Dr. Emily Davis',
                'category': 'clinical',
                'tags': ['depression', 'clinical', 'mental_health', 'assessment'],
                'estimated_duration': 15,
                'difficulty_level': 'easy',
                'questions': [
                    {
                        'text': 'Как часто вы чувствуете грусть?',
                        'type': 'likert',
                        'personality_trait': 'Эмоциональное состояние',
                        'answers': [
                            {'text': 'Никогда', 'value': 0},
                            {'text': 'Редко', 'value': 1},
                            {'text': 'Иногда', 'value': 2},
                            {'text': 'Часто', 'value': 3},
                            {'text': 'Постоянно', 'value': 4}
                        ]
                    },
                    {
                        'text': 'Как вы оцениваете свой сон?',
                        'type': 'likert',
                        'personality_trait': 'Качество сна',
                        'answers': [
                            {'text': 'Отлично', 'value': 0},
                            {'text': 'Хорошо', 'value': 1},
                            {'text': 'Удовлетворительно', 'value': 2},
                            {'text': 'Плохо', 'value': 3},
                            {'text': 'Очень плохо', 'value': 4}
                        ]
                    }
                ]
            }
        ]
        
        created_count = 0
        for test_data in demo_tests:
            try:
                # Проверяем, не существует ли уже тест с таким psy_toolkit_id
                if not PsyToolkitTest.objects.filter(psy_toolkit_id=test_data['psy_toolkit_id']).exists():
                    # Создаем основной тест
                    main_test = Test.objects.create(
                        name=test_data['name'],
                        description=test_data['description'],
                        test_type='personality' if 'personality' in test_data['category'] else 'cognitive',
                        estimated_duration=test_data['estimated_duration'],
                        difficulty_level=test_data['difficulty_level'],
                        is_active=True,
                        source='psytoolkit'
                    )
                    
                    # Создаем вопросы и ответы
                    for question_data in test_data['questions']:
                        question = Question.objects.create(
                            test=main_test,
                            text=question_data['text'],
                            question_type=question_data['type'],
                            personality_trait=question_data['personality_trait']
                        )
                        
                        # Создаем ответы
                        for answer_data in question_data['answers']:
                            Answer.objects.create(
                                question=question,
                                text=answer_data['text'],
                                value=answer_data['value'],
                                is_correct=answer_data.get('is_correct', None)
                            )
                    
                    # Создаем запись в PsyToolkitTest
                    PsyToolkitTest.objects.create(
                        name=test_data['name'],
                        description=test_data['description'],
                        psy_toolkit_id=test_data['psy_toolkit_id'],
                        author=test_data['author'],
                        category=test_data['category'],
                        tags=test_data['tags'],
                        is_imported=True,
                        imported_test=main_test,
                        raw_data={
                            'metadata': {
                                'name': test_data['name'],
                                'description': test_data['description'],
                                'author': test_data['author'],
                                'category': test_data['category'],
                                'tags': test_data['tags'],
                                'estimated_duration': test_data['estimated_duration'],
                                'difficulty_level': test_data['difficulty_level'],
                                'question_count': len(test_data['questions'])
                            }
                        }
                    )
                    
                    created_count += 1
                    self.stdout.write(f'✓ Создан полноценный тест: {test_data["name"]} с {len(test_data["questions"])} вопросами')
                else:
                    self.stdout.write(f'⚠ Тест уже существует: {test_data["name"]}')
                    
            except Exception as e:
                self.stdout.write(f'❌ Ошибка при создании теста {test_data["name"]}: {e}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Полноценные демонстрационные тесты созданы! Создано: {created_count}')
        )
