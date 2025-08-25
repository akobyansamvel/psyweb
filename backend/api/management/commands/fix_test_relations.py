from django.core.management.base import BaseCommand
from api.models import Test, Question, Answer, PsyToolkitTest

class Command(BaseCommand):
    help = 'Исправление связей между тестами, вопросами и ответами'

    def handle(self, *args, **options):
        self.stdout.write('Исправление связей в базе данных...')
        
        # Словарь соответствий тестов и вопросов
        test_questions_map = {
            'Big Five Personality Test': [
                'Я легко знакомлюсь с новыми людьми',
                'Я предпочитаю работать в одиночестве',
                'Я люблю пробовать новые вещи',
                'Я всегда выполняю свои обещания',
                'Я часто беспокоюсь о будущем'
            ],
            'MBTI Personality Assessment': [
                'В компании я обычно:',
                'При принятии решений я больше полагаюсь на:',
                'Я предпочитаю планировать заранее:'
            ],
            'Raven\'s Progressive Matrices': [
                'Какая фигура должна быть на месте знака вопроса?',
                'Продолжите последовательность: 2, 4, 8, 16, ?',
                'Если все розы - цветы, а некоторые цветы быстро увядают, то:'
            ],
            'Beck Depression Inventory': [
                'Как часто вы чувствуете грусть?',
                'Как вы оцениваете свой сон?',
                'Как вы оцениваете свой аппетит?'
            ]
        }
        
        fixed_count = 0
        
        for test_name, question_texts in test_questions_map.items():
            try:
                # Находим тест
                test = Test.objects.filter(name__icontains=test_name[:20]).first()
                if not test:
                    self.stdout.write(f'❌ Тест не найден: {test_name}')
                    continue
                
                self.stdout.write(f'🔧 Исправляем тест: {test.name}')
                
                # Находим и связываем вопросы
                for i, question_text in enumerate(question_texts):
                    # Ищем вопрос по тексту
                    question = Question.objects.filter(text__icontains=question_text[:30]).first()
                    if question:
                        # Связываем вопрос с тестом
                        question.test = test
                        question.order = i + 1
                        question.save()
                        
                        # Связываем ответы с вопросом
                        answers = Answer.objects.filter(text__icontains=question_text[:20])
                        for answer in answers:
                            answer.question = question
                            answer.save()
                        
                        self.stdout.write(f'  ✓ Вопрос связан: {question.text[:50]}...')
                        fixed_count += 1
                    else:
                        self.stdout.write(f'  ❌ Вопрос не найден: {question_text[:50]}...')
                
            except Exception as e:
                self.stdout.write(f'❌ Ошибка при исправлении теста {test_name}: {e}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Связи исправлены! Обработано: {fixed_count}')
        )
