from django.core.management.base import BaseCommand
from api.models import Test, Question, Answer, PsyToolkitTest

class Command(BaseCommand):
    help = 'Полное исправление всех связей между тестами, вопросами и ответами'

    def handle(self, *args, **options):
        self.stdout.write('Полное исправление всех связей в базе данных...')
        
        # Сначала удалим все существующие вопросы и ответы
        self.stdout.write('Удаление существующих вопросов и ответов...')
        Answer.objects.all().delete()
        Question.objects.all().delete()
        
        # Словарь соответствий тестов и вопросов с ответами
        test_data = {
            'Big Five Personality Test': {
                'questions': [
                    {
                        'text': 'Я легко знакомлюсь с новыми людьми',
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
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 1},
                            {'text': 'Не согласен', 'value': 2},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 4},
                            {'text': 'Полностью согласен', 'value': 5}
                        ]
                    },
                    {
                        'text': 'Я всегда выполняю свои обещания',
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 1},
                            {'text': 'Не согласен', 'value': 2},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 4},
                            {'text': 'Полностью согласен', 'value': 5}
                        ]
                    },
                    {
                        'text': 'Я часто беспокоюсь о будущем',
                        'answers': [
                            {'text': 'Полностью не согласен', 'value': 5},
                            {'text': 'Не согласен', 'value': 4},
                            {'text': 'Нейтрально', 'value': 3},
                            {'text': 'Согласен', 'value': 2},
                            {'text': 'Полностью согласен', 'value': 1}
                        ]
                    }
                ]
            },
            'MBTI Personality Assessment': {
                'questions': [
                    {
                        'text': 'В компании я обычно:',
                        'answers': [
                            {'text': 'Разговариваю со многими людьми', 'value': 5},
                            {'text': 'Разговариваю с несколькими знакомыми', 'value': 3},
                            {'text': 'Слушаю и наблюдаю', 'value': 1}
                        ]
                    },
                    {
                        'text': 'При принятии решений я больше полагаюсь на:',
                        'answers': [
                            {'text': 'Логику и факты', 'value': 5},
                            {'text': 'Чувства и ценности', 'value': 1}
                        ]
                    },
                    {
                        'text': 'Я предпочитаю планировать заранее:',
                        'answers': [
                            {'text': 'Да, я люблю структуру', 'value': 5},
                            {'text': 'Нет, я предпочитаю спонтанность', 'value': 1}
                        ]
                    }
                ]
            },
            'Raven\'s Progressive Matrices': {
                'questions': [
                    {
                        'text': 'Какая фигура должна быть на месте знака вопроса?',
                        'answers': [
                            {'text': 'Круг', 'value': 5, 'is_correct': True},
                            {'text': 'Квадрат', 'value': 0, 'is_correct': False},
                            {'text': 'Треугольник', 'value': 0, 'is_correct': False}
                        ]
                    },
                    {
                        'text': 'Продолжите последовательность: 2, 4, 8, 16, ?',
                        'answers': [
                            {'text': '24', 'value': 0, 'is_correct': False},
                            {'text': '32', 'value': 5, 'is_correct': True},
                            {'text': '30', 'value': 0, 'is_correct': False}
                        ]
                    },
                    {
                        'text': 'Если все розы - цветы, а некоторые цветы быстро увядают, то:',
                        'answers': [
                            {'text': 'Все розы быстро увядают', 'value': 0, 'is_correct': False},
                            {'text': 'Некоторые розы быстро увядают', 'value': 5, 'is_correct': True},
                            {'text': 'Ни одна роза не увядает быстро', 'value': 0, 'is_correct': False}
                        ]
                    }
                ]
            },
            'Beck Depression Inventory': {
                'questions': [
                    {
                        'text': 'Как часто вы чувствуете грусть?',
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
                        'answers': [
                            {'text': 'Отлично', 'value': 0},
                            {'text': 'Хорошо', 'value': 1},
                            {'text': 'Удовлетворительно', 'value': 2},
                            {'text': 'Плохо', 'value': 3},
                            {'text': 'Очень плохо', 'value': 4}
                        ]
                    },
                    {
                        'text': 'Как вы оцениваете свой аппетит?',
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
        }
        
        fixed_count = 0
        
        for test_name, test_info in test_data.items():
            try:
                # Находим тест
                test = Test.objects.filter(name__icontains=test_name[:20]).first()
                if not test:
                    self.stdout.write(f'❌ Тест не найден: {test_name}')
                    continue
                
                self.stdout.write(f'🔧 Исправляем тест: {test.name}')
                
                # Создаем новые вопросы и ответы для этого теста
                for i, question_data in enumerate(test_info['questions']):
                    # Создаем вопрос
                    question = Question.objects.create(
                        test=test,
                        text=question_data['text'],
                        order=i + 1,
                        question_type='likert' if len(question_data['answers']) > 3 else 'choice'
                    )
                    
                    # Создаем ответы
                    for answer_data in question_data['answers']:
                        Answer.objects.create(
                            question=question,
                            text=answer_data['text'],
                            value=answer_data['value'],
                            personality_trait='personality_trait',  # Заглушка
                            is_correct=answer_data.get('is_correct', False)
                        )
                    
                    self.stdout.write(f'  ✓ Создан вопрос: {question.text[:50]}...')
                    fixed_count += 1
                
            except Exception as e:
                self.stdout.write(f'❌ Ошибка при исправлении теста {test_name}: {e}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Все связи исправлены! Создано: {fixed_count} вопросов')
        )
