from django.core.management.base import BaseCommand
from api.models import Test, Question, Answer


class Command(BaseCommand):
    help = 'Быстрое наполнение БД: создаёт 20 полноценных тестов (часть с изображениями)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Очистить существующие тесты перед созданием')

    def handle(self, *args, **options):
        if options['force']:
            self.stdout.write('Очистка демо-контента (без удаления пользовательской истории)...')
            # Удаляем ТОЛЬКО демо-тесты (source='demo') и только если по ним нет результатов
            demo_tests = Test.objects.filter(source='demo')
            removed, skipped = 0, 0
            for t in demo_tests:
                has_results = t.testresult_set.exists()
                if has_results:
                    skipped += 1
                    continue
                # Удаляем связанные сущности в правильном порядке
                Answer.objects.filter(question__test=t).delete()
                Question.objects.filter(test=t).delete()
                t.delete()
                removed += 1
            self.stdout.write(f'Удалено демо-тестов: {removed}; пропущено (есть результаты): {skipped}')

        self.stdout.write('Создание тестов...')

        tests_spec = [
            ('IPIP Big Five (50)', 'Личностный опросник Big Five (краткая форма)', 50, 'personality'),
            ('PHQ-9', 'Шкала здоровья пациента PHQ-9', 9, 'clinical'),
            ('GAD-7', 'Шкала генерализованного тревожного расстройства', 7, 'clinical'),
            ('Rosenberg Self-Esteem', 'Шкала самооценки Розенберга', 10, 'personality'),
            ('PSS-10', 'Шкала воспринимаемого стресса', 10, 'clinical'),
            ('Satisfaction With Life (SWLS)', 'Шкала удовлетворенности жизнью', 5, 'personality'),
            ('MBTI Short (30)', 'Опросник предпочтений (сокр.)', 30, 'personality'),
            ('Cognitive Reasoning (12)', 'Логико-аналитические задачи', 12, 'cognitive'),
            ('Working Memory (10)', 'Оперативная память (простые серии)', 10, 'cognitive'),
            ('Emotional Intelligence (16)', 'Эмоциональный интеллект (опросник)', 16, 'personality'),
            ('Resilience (10)', 'Психологическая устойчивость', 10, 'personality'),
            ('Mindfulness (15)', 'Осознанность (опросник)', 15, 'personality'),
            ('Sleep Quality (10)', 'Качество сна (опросник)', 10, 'clinical'),
            ('Motivation (12)', 'Учебная/рабочая мотивация', 12, 'personality'),
            ('Attentional Control (14)', 'Контроль внимания', 14, 'cognitive'),
            ('Social Anxiety (12)', 'Социальная тревожность', 12, 'clinical'),
            ('Impulsivity (15)', 'Импульсивность (опросник)', 15, 'personality'),
            ('Visual Pattern Recognition', 'Тест на распознавание визуальных паттернов', 6, 'cognitive'),
            ('Verbal Reasoning (18)', 'Вербальное рассуждение', 18, 'cognitive'),
            ('Learning Strategies (20)', 'Стратегии обучения (опросник)', 20, 'personality'),
        ]

        total_questions = 0

        for name, desc, count, ttype in tests_spec:
            test = Test.objects.create(
                name=name,
                description=desc,
                test_type=ttype,
                source='demo',
                estimated_duration=max(5, int(count / 3)),
            )
            self.stdout.write(f'Создаю тест: {name} ({count} вопросов)')

            for i in range(1, count + 1):
                q_text = f'Вопрос {i}. '
                if ttype == 'cognitive' and name == 'Cognitive Reasoning (12)':
                    q_text += 'Выберите правильный вариант.'
                else:
                    q_text += 'Оцените утверждение.'

                question = Question.objects.create(
                    test=test,
                    text=q_text,
                    order=i,
                )

                # Для визуального теста прикрепляем изображения к первым 6 вопросам
                if name == 'Visual Pattern Recognition':
                    question.image_url = f'https://via.placeholder.com/600x300/4A90E2/FFFFFF?text=Pattern+{i}'
                    question.image_alt = 'Геометрический паттерн'
                    question.save()

                # Лайкерт по умолчанию
                answers = [
                    ('Совершенно не согласен', 1),
                    ('Скорее не согласен', 2),
                    ('Нейтрально', 3),
                    ('Скорее согласен', 4),
                    ('Полностью согласен', 5),
                ]

                # Для некоторых когнитивных делаем выбор с правильным ответом
                if ttype == 'cognitive' and name in ('Cognitive Reasoning (12)', 'Verbal Reasoning (18)'):
                    answers = [
                        ('Вариант A', 0),
                        ('Вариант B', 0),
                        ('Вариант C', 5),
                    ]

                for a_text, value in answers:
                    Answer.objects.create(
                        question=question,
                        text=a_text,
                        value=value,
                        personality_trait=f'{ttype}_trait',
                        is_correct=True if (ttype == 'cognitive' and value == 5) else False,
                    )

                total_questions += 1

        self.stdout.write(self.style.SUCCESS(f'Создано {len(tests_spec)} тестов, всего вопросов: {total_questions}'))


