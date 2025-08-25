from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from typing import Any, Dict, List
import json
import os

from api.models import Test, Question, Answer


class Command(BaseCommand):
    help = 'Импорт тестов из JSON файла в пользовательском формате.'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, required=True, help='Путь к JSON файлу')
        parser.add_argument('--force', action='store_true', help='Перезаписывать тесты с тем же именем')

    def handle(self, *args, **options):
        file_path: str = options['file']
        force: bool = options['force']

        if not os.path.exists(file_path):
            raise CommandError(f'Файл не найден: {file_path}')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            raise CommandError(f'Ошибка чтения JSON: {e}')

        tests_input: List[Dict[str, Any]] = []
        if isinstance(data, dict) and 'psychological_tests' in data and isinstance(data['psychological_tests'], list):
            tests_input = data['psychological_tests']
        elif isinstance(data, list):
            tests_input = data
        elif isinstance(data, dict):
            tests_input = [data]
        else:
            raise CommandError('Неверный формат JSON. Ожидается объект с ключом psychological_tests или массив тестов.')

        imported = 0
        skipped = 0

        for t in tests_input:
            name = t.get('test_name') or t.get('name')
            description = t.get('description') or ''
            image_url = t.get('image_url') or None
            test_type = self._infer_test_type(t)
            duration = int(t.get('estimated_duration') or t.get('number_of_questions') or 10)
            duration = max(5, min(120, duration))

            if not name:
                self.stdout.write(self.style.WARNING('Пропуск теста без названия'))
                skipped += 1
                continue

            try:
                with transaction.atomic():
                    if force:
                        Test.objects.filter(name=name).delete()

                    test_obj, created = Test.objects.get_or_create(
                        name=name,
                        defaults={
                            'description': description,
                            'test_type': test_type,
                            'estimated_duration': duration,
                            'source': 'import_json',
                            'image_url': image_url,
                            'is_active': True,
                        }
                    )

                    if not created and not force:
                        self.stdout.write(self.style.WARNING(f'Пропуск (уже существует): {name}'))
                        skipped += 1
                        continue

                    if not created and force:
                        # если перезаписываем, очистим вопросы/ответы
                        Answer.objects.filter(question__test=test_obj).delete()
                        Question.objects.filter(test=test_obj).delete()
                        test_obj.description = description
                        test_obj.test_type = test_type
                        test_obj.estimated_duration = duration
                        test_obj.image_url = image_url
                        test_obj.source = 'import_json'
                        test_obj.is_active = True
                        test_obj.save()

                    questions = t.get('questions') or []
                    for idx, q in enumerate(questions, start=1):
                        q_text = q.get('question_text') or q.get('text') or f'Вопрос {idx}'
                        q_img = q.get('image_url') or None
                        question = Question.objects.create(
                            test=test_obj,
                            text=q_text,
                            order=idx,
                            image_url=q_img,
                        )

                        answers = q.get('answers') or []
                        if not answers:
                            # добавим дефолтную шкалу Лайкерта
                            answers = [
                                { 'answer_text': 'Никогда', 'score': 0 },
                                { 'answer_text': 'Редко', 'score': 1 },
                                { 'answer_text': 'Иногда', 'score': 2 },
                                { 'answer_text': 'Часто', 'score': 3 },
                            ]
                        for a in answers:
                            a_text = a.get('answer_text') or a.get('text') or ''
                            a_val = a.get('score') if a.get('score') is not None else a.get('value')
                            try:
                                value = int(a_val) if a_val is not None else 0
                            except Exception:
                                value = 0
                            Answer.objects.create(
                                question=question,
                                text=a_text,
                                value=value,
                                personality_trait=self._infer_trait(test_type),
                                is_correct=bool(a.get('is_correct', False))
                            )

                    imported += 1
                    self.stdout.write(self.style.SUCCESS(f'Импортирован: {name} (вопросов: {len(questions)})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка при импорте "{name}": {e}'))
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f'Готово. Импортировано: {imported}, пропущено: {skipped}'))

    def _infer_test_type(self, t: Dict[str, Any]) -> str:
        name = (t.get('test_name') or t.get('name') or '').lower()
        if any(k in name for k in ['phq', 'gad', 'depress', 'anxiet', 'beck', 'bdi', 'clinical']):
            return 'clinical'
        if any(k in name for k in ['memory', 'cognitive', 'reason', 'attention', 'verbal']):
            return 'cognitive'
        if any(k in name for k in ['personality', 'big five', 'ipip', 'mbti', 'hexaco']):
            return 'personality'
        return 'general'

    def _infer_trait(self, test_type: str) -> str:
        if test_type == 'clinical':
            return 'clinical_trait'
        if test_type == 'cognitive':
            return 'cognitive_trait'
        if test_type == 'personality':
            return 'personality_trait'
        return 'general_trait'


