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

                    # Собираем расширенные определения результатов: results/types/scoring/graph/categories
                    extra_defs = {}
                    for key in ['results', 'types', 'scoring', 'graph', 'categories']:
                        if t.get(key) is not None:
                            extra_defs[key] = t.get(key)

                    test_obj, created = Test.objects.get_or_create(
                        name=name,
                        defaults={
                            'description': description,
                            'test_type': test_type,
                            'estimated_duration': duration,
                            'source': 'import_json',
                            'image_url': image_url,
                            'is_active': True,
                            'result_definitions': extra_defs
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
                        # обновляем расширенные определения
                        extra_defs = {}
                        for key in ['results', 'types', 'scoring', 'graph', 'categories']:
                            if t.get(key) is not None:
                                extra_defs[key] = t.get(key)
                        test_obj.result_definitions = extra_defs
                        test_obj.is_active = True
                        test_obj.save()

                    questions = t.get('questions') or []
                    for idx, q in enumerate(questions, start=1):
                        q_text = q.get('question_text') or q.get('text') or f'Вопрос {idx}'
                        q_dimension = q.get('dimension') or None
                        q_img = q.get('image_url') or None
                        question = Question.objects.create(
                            test=test_obj,
                            text=q_text,
                            order=idx,
                            dimension=q_dimension,
                            image_url=q_img,
                        )

                        answers = q.get('answers') or []
                        # если answers отсутствуют, попробуем options/variants (двухвариантные ответы)
                        if not answers:
                            options = q.get('options') or q.get('variants') or []
                            if options:
                                mapped = []
                                for opt in options:
                                    t_opt = opt.get('text') or opt.get('answer_text') or ''
                                    s_opt = opt.get('score')
                                    trait_override = opt.get('personality_trait') or q.get('trait')
                                    try:
                                        val = int(s_opt)
                                        mapped.append({ 'answer_text': t_opt, 'score': val, 'personality_trait': trait_override })
                                    except Exception:
                                        # если score не число (буква), считаем value=1, а букву используем как trait
                                        mapped.append({ 'answer_text': t_opt, 'score': 1, 'personality_trait': str(s_opt) if s_opt is not None else trait_override })
                                answers = mapped
                        # если всё ещё пусто — дефолтная шкала (4 варианта)
                        if not answers:
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
                            # Позволяем задавать черту на уровне вопроса или ответа
                            trait_override = a.get('personality_trait') or q.get('trait')
                            trait_value = trait_override if trait_override else self._infer_trait(test_type)
                            Answer.objects.create(
                                question=question,
                                text=a_text,
                                value=value,
                                personality_trait=trait_value,
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
        """Возвращает более конкретный ключ черты вместо общего general_trait."""
        # Попытаемся извлечь название теста из self.current_test, если доступно
        test_name = ''
        try:
            test_name = (getattr(self, 'current_test', None) or {}).get('name', '') or ''
        except Exception:
            test_name = ''

        name_l = (test_name or '').lower()

        # Клинические
        if any(k in name_l for k in ['phq', 'depress', 'beck', 'bdi']):
            return 'depression'
        if any(k in name_l for k in ['gad', 'anxiet']):
            return 'anxiety'
        # Стресс
        if any(k in name_l for k in ['pss', 'stress']):
            return 'stress'
        # Самооценка
        if 'rosenberg' in name_l or 'self-esteem' in name_l or 'self esteem' in name_l:
            return 'self_esteem'
        # Удовлетворенность жизнью
        if 'satisfaction with life' in name_l or 'swls' in name_l:
            return 'life_satisfaction'
        # Большая пятёрка и т.п.
        if test_type == 'personality':
            return 'big5'
        if test_type == 'cognitive':
            return 'cognitive'
        if test_type == 'clinical':
            return 'clinical'
        return 'general'


