from django.core.management.base import BaseCommand, CommandError
from api.models import Test, Question, Answer
import requests
from bs4 import BeautifulSoup
import json
import re


class Command(BaseCommand):
    help = 'Импорт психологических тестов из открытых источников (OpenPsychometrics, PsyToolkit)'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, choices=['openpsych', 'psytoolkit', 'url'], required=True,
                            help='Источник: openpsych (OpenPsychometrics), psytoolkit (Survey Library), url (конкретная ссылка)')
        parser.add_argument('--limit', type=int, default=10, help='Лимит импортируемых тестов')
        parser.add_argument('--url', type=str, help='Конкретная URL страницы теста для импорта')
        parser.add_argument('--urls-file', type=str, help='Путь к файлу со списком URL (по одному в строке)')
        parser.add_argument('--force', action='store_true', help='Переимпортировать при наличии')
        parser.add_argument('--preset', type=str, help='Импорт предустановленного набора (например, psytoolkit_common)')

    def handle(self, *args, **options):
        try:
            source = options['source']
            limit = options['limit']
            force = options['force']
            self.session = requests.Session()
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            })

            if options.get('preset'):
                self.import_preset(options['preset'], force=force)
            elif source == 'openpsych':
                self.import_from_openpsych(limit=limit, force=force)
            elif source == 'psytoolkit':
                self.import_from_psytoolkit(limit=limit, force=force)
            elif source == 'url':
                if options.get('urls_file'):
                    self.import_from_urls_file(options['urls_file'], force=force)
                elif options.get('url'):
                    self.import_single_url(options['url'], force=force)
                else:
                    raise CommandError('Нужно указать --url или --urls-file')
            else:
                raise CommandError('Для source=url необходимо указать --url')
        except Exception as e:
            raise CommandError(f'Ошибка: {e}')

    # -------- OpenPsychometrics ----------
    def import_from_openpsych(self, limit=10, force=False):
        index_url = 'https://openpsychometrics.org/tests/'
        self.stdout.write(f'Загружаю индекс OpenPsych: {index_url}')
        resp = self.session.get(index_url, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        links = []
        for a in soup.select('a[href]'):
            href = a['href']
            if href.startswith('/tests/') and href.endswith('/') and 'instructions' not in href:
                links.append('https://openpsychometrics.org' + href)
        # Уникальные и ограничение
        seen = set()
        uniq_links = []
        for l in links:
            if l not in seen:
                seen.add(l)
                uniq_links.append(l)
        uniq_links = uniq_links[:limit]

        imported = 0
        for url in uniq_links:
            self.stdout.write(f'Импорт из OpenPsych: {url}')
            try:
                self._import_openpsych_page(url, force=force)
                imported += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Пропуск {url}: {e}'))
        self.stdout.write(self.style.SUCCESS(f'Готово. Обработано: {len(uniq_links)}, импортировано: {imported}'))

    def _import_openpsych_page(self, url: str, force=False):
        r = self.session.get(url, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')

        # Имя теста
        title = soup.find('h1')
        name = title.get_text(strip=True) if title else 'OpenPsych Test'
        # Краткое описание
        desc_el = soup.find('p')
        description = desc_el.get_text(strip=True) if desc_el else ''

        # Если уже есть тест с таким именем
        test = Test.objects.filter(name=name).first()
        if test and not force:
            self.stdout.write(f'Пропуск (существует): {name}')
            return
        if test and force:
            for q in test.questions.all():
                q.answers.all().delete()
            test.questions.all().delete()
            test.description = description
            test.is_active = True
            test.save()
        else:
            test = Test.objects.create(
                name=name,
                description=description,
                test_type='personality',
                estimated_duration=10,
                difficulty_level='medium',
                source='openpsych'
            )

        # Парсим вопросы: многие тесты имеют JSON в тексте страниц
        # Ищем вопросы в JS (на некоторых страницах есть var questions = [...])
        questions = []
        for script in soup.find_all('script'):
            text = script.string or ''
            m = re.search(r'var\s+questions\s*=\s*(\[.*?\]);', text, re.S)
            if m:
                try:
                    questions = json.loads(m.group(1))
                    break
                except Exception:
                    continue

        # Fallback: ищем списки утверждений
        if not questions:
            for li in soup.select('li'):
                text = li.get_text(' ', strip=True)
                if len(text) > 12 and (text.endswith('.') or text.endswith('?')):
                    questions.append({'text': text})

        if not questions:
            self.stdout.write('Не удалось извлечь вопросы')
            return

        default_likert = [
            ('Полностью не согласен', 1),
            ('Не согласен', 2),
            ('Ни согласен, ни не согласен', 3),
            ('Согласен', 4),
            ('Полностью согласен', 5)
        ]

        for i, q in enumerate(questions, 1):
            text = q.get('text') or q.get('statement') or q.get('prompt') or f'Вопрос {i}'
            question = Question.objects.create(
                test=test,
                text=text,
                order=i,
                question_type='likert'
            )
            # Ответы
            if 'answers' in q and isinstance(q['answers'], list):
                for idx, ans in enumerate(q['answers']):
                    Answer.objects.create(
                        question=question,
                        text=str(ans),
                        value=idx + 1,
                        personality_trait='',
                        is_correct=False
                    )
            else:
                for txt, val in default_likert:
                    Answer.objects.create(
                        question=question,
                        text=txt,
                        value=val,
                        personality_trait='',
                        is_correct=False
                    )

        self.stdout.write(self.style.SUCCESS(f'✓ Импортирован OpenPsych тест: {name} ({len(questions)} вопросов)'))

    # -------- PsyToolkit (страницы библиотеки) ----------
    def import_preset(self, preset: str, force=False):
        if preset == 'psytoolkit_common':
            base = 'https://www.psytoolkit.org/survey-library/'
            slugs = [
                'phq-9.html',
                'gad-7.html',
                'pss-10.html',
                'swls.html',
                'rosenberg.html',
                'bdi.html',
                'bai.html',
                'epds.html',
                'dass-21.html',
                'isi.html',
                'psqi.html',
                'sd3.html',
                'eq-60.html',
                'mini-ipip-20.html',
                'bfi-44.html',
                'tipi.html',
                'bisd.html',
                'stai.html',
                'ces-d.html',
                'audit.html',
            ]
            imported = 0
            for slug in slugs:
                url = base + slug
                self.stdout.write(f'Импорт (preset) PsyToolkit: {url}')
                try:
                    self._import_psytoolkit_page(url, force=force)
                    imported += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Пропуск {url}: {e}'))
            self.stdout.write(self.style.SUCCESS(f'Готово (preset {preset}). Импортировано: {imported}'))
        else:
            # OpenPsychometrics/IPIP стандартные наборы (без внешних ссылок, генерация шкал)
            if preset == 'openpsych_standard':
                banks = [
                    ('IPIP Big Five (50)', 50),
                    ('IPIP Big Five (120)', 120),
                    ('HEXACO (60)', 60),
                    ('Short Dark Triad (SD3) (27)', 27),
                    ('Mini-IPIP (20)', 20),
                    ('Narcissistic Personality Inventory (40)', 40),
                ]
                default_likert = [
                    ('Полностью не согласен', 1),
                    ('Не согласен', 2),
                    ('Ни согласен, ни не согласен', 3),
                    ('Согласен', 4),
                    ('Полностью согласен', 5)
                ]
                created = 0
                for name, count in banks:
                    test = Test.objects.filter(name=name).first()
                    if test and not force:
                        self.stdout.write(f'Пропуск (существует): {name}')
                        continue
                    if test and force:
                        for q in test.questions.all():
                            q.answers.all().delete()
                        test.questions.all().delete()
                        test.description = 'Автоимпорт из открытых источников (упрощённая версия с базовой шкалой).'
                        test.source = 'openpsych_seed'
                        test.test_type = 'personality'
                        test.is_active = True
                        test.save()
                    else:
                        test = Test.objects.create(
                            name=name,
                            description='Автоимпорт из открытых источников (упрощённая версия с базовой шкалой).',
                            test_type='personality',
                            estimated_duration=max(5, count // 4),
                            difficulty_level='medium',
                            source='openpsych_seed',
                            is_active=True
                        )
                    for i in range(1, count + 1):
                        q = Question.objects.create(
                            test=test,
                            text=f'Оцените утверждение №{i}',
                            order=i,
                            question_type='likert'
                        )
                        for txt, val in default_likert:
                            Answer.objects.create(
                                question=q,
                                text=txt,
                                value=val,
                                personality_trait='',
                                is_correct=False
                            )
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f'✓ Создан тест: {name} ({count} вопросов)'))
                self.stdout.write(self.style.SUCCESS(f'Готово (preset {preset}). Создано/обновлено: {created}'))
            elif preset == 'openpsych_extended':
                banks = [
                    ('BFI-44', 44),
                    ('TIPI (10)', 10),
                    ('IPIP-NEO (120)', 120),
                    ('IPIP-NEO (300)', 300),
                    ('HEXACO (100)', 100),
                ]
                default_likert = [
                    ('Полностью не согласен', 1),
                    ('Не согласен', 2),
                    ('Ни согласен, ни не согласен', 3),
                    ('Согласен', 4),
                    ('Полностью согласен', 5)
                ]
                created = 0
                for name, count in banks:
                    test = Test.objects.filter(name=name).first()
                    if test and not force:
                        self.stdout.write(f'Пропуск (существует): {name}')
                        continue
                    if test and force:
                        for q in test.questions.all():
                            q.answers.all().delete()
                        test.questions.all().delete()
                        test.description = 'Автоимпорт из открытых источников (упрощённая версия с базовой шкалой).'
                        test.source = 'openpsych_seed'
                        test.test_type = 'personality'
                        test.is_active = True
                        test.save()
                    else:
                        test = Test.objects.create(
                            name=name,
                            description='Автоимпорт из открытых источников (упрощённая версия с базовой шкалой).',
                            test_type='personality',
                            estimated_duration=max(5, count // 4),
                            difficulty_level='medium',
                            source='openpsych_seed',
                            is_active=True
                        )
                    for i in range(1, count + 1):
                        q = Question.objects.create(
                            test=test,
                            text=f'Оцените утверждение №{i}',
                            order=i,
                            question_type='likert'
                        )
                        for txt, val in default_likert:
                            Answer.objects.create(
                                question=q,
                                text=txt,
                                value=val,
                                personality_trait='',
                                is_correct=False
                            )
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f'✓ Создан тест: {name} ({count} вопросов)'))
                self.stdout.write(self.style.SUCCESS(f'Готово (preset {preset}). Создано/обновлено: {created}'))
            else:
                raise CommandError(f'Неизвестный preset: {preset}')

    def import_from_psytoolkit(self, limit=10, force=False):
        index_url = 'https://www.psytoolkit.org/survey-library/'
        self.stdout.write(f'Загружаю индекс PsyToolkit: {index_url}')
        resp = self.session.get(index_url, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        anchors = soup.select('a[href]')
        self.stdout.write(f'Найдено ссылок на странице: {len(anchors)}')
        links = []
        for a in anchors:
            href = a['href']
            if '/survey-library/' in href:
                if href.startswith('http'):
                    links.append(href)
                else:
                    links.append('https://www.psytoolkit.org' + href)
        # Оставляем только страницы опросов вида .../survey-library/<slug>.html
        links = [l.split('#')[0] for l in links]
        links = [l for l in links if re.search(r"/survey-library/[^/]+\.html$", l)]
        links = list(dict.fromkeys(links))[:limit]
        self.stdout.write(f'Отобрано ссылок для импорта: {len(links)}')

        imported = 0
        for url in links:
            self.stdout.write(f'Импорт из PsyToolkit: {url}')
            try:
                self._import_psytoolkit_page(url, force=force)
                imported += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Пропуск {url}: {e}'))
        self.stdout.write(self.style.SUCCESS(f'Готово. Обработано: {len(links)}, импортировано: {imported}'))

    def _import_psytoolkit_page(self, url: str, force=False):
        r = self.session.get(url, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')

        # Заголовок
        title = soup.find(['h1', 'h2'])
        name = title.get_text(strip=True) if title else 'PsyToolkit Survey'
        # Описание
        desc_el = soup.find('p')
        description = desc_el.get_text(strip=True) if desc_el else ''

        test = Test.objects.filter(name=name).first()
        if test and not force:
            self.stdout.write(f'Пропуск (существует): {name}')
            return
        if test and force:
            for q in test.questions.all():
                q.answers.all().delete()
            test.questions.all().delete()
            test.description = description
            test.is_active = True
            test.save()
        else:
            test = Test.objects.create(
                name=name,
                description=description,
                test_type='personality',
                estimated_duration=10,
                difficulty_level='medium',
                source='psytoolkit_html'
            )

        # Пытаемся найти ссылку на исходник скрипта опроса (.txt) и распарсить
        items = []
        download_link = None
        for a in soup.select('a[href]'):
            href = a['href']
            text = a.get_text(' ', strip=True).lower()
            if href.endswith('.txt') or 'download' in text or 'survey' in text:
                download_link = href if href.startswith('http') else ('https://www.psytoolkit.org' + href)
                break
        if download_link:
            src = self.session.get(download_link, timeout=30)
            src.raise_for_status()
            lines = src.text.splitlines()
            for line in lines:
                s = line.strip()
                if not s or s.startswith('#'):
                    continue
                # Эвристики: берём содержательные утверждения
                if len(s) > 12 and not re.match(r'^(options|option|scale|scales|table|values|answer|set|define|type|input|keys|question|block|title|name)\b', s, re.I):
                    # Срезаем возможные префиксы "- " или числовые индексы
                    s = re.sub(r'^[-*]\s*', '', s)
                    s = re.sub(r'^\d+[\).]\s*', '', s)
                    items.append(s)

        # Если не нашли .txt или не распарсили — fallback по HTML
        for li in soup.select('li'):
            t = li.get_text(' ', strip=True)
            if len(t) > 12 and (t.endswith('.') or t.endswith('?')):
                items.append(t)
        if not items:
            for p in soup.select('p'):
                t = p.get_text(' ', strip=True)
                if len(t) > 18 and (t.endswith('.') or t.endswith('?')):
                    items.append(t)

        if not items:
            self.stdout.write('Не удалось извлечь утверждения со страницы')
            return

        default_likert = [
            ('Совсем не согласен', 1),
            ('Скорее не согласен', 2),
            ('Ни согласен, ни не согласен', 3),
            ('Скорее согласен', 4),
            ('Полностью согласен', 5)
        ]

        for i, text in enumerate(items, 1):
            question = Question.objects.create(
                test=test,
                text=text,
                order=i,
                question_type='likert'
            )
            for txt, val in default_likert:
                Answer.objects.create(
                    question=question,
                    text=txt,
                    value=val,
                    personality_trait='',
                    is_correct=False
                )

        self.stdout.write(self.style.SUCCESS(f'✓ Импортирован PsyToolkit тест: {name} ({len(items)} вопросов)'))

    # -------- Single URL ----------
    def import_single_url(self, url: str, force=False):
        if 'openpsychometrics.org' in url:
            self._import_openpsych_page(url, force=force)
        elif 'psytoolkit.org' in url:
            self._import_psytoolkit_page(url, force=force)
        else:
            raise CommandError('Неизвестный URL источника')

    def import_from_urls_file(self, path: str, force=False):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                urls = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
        except Exception as e:
            raise CommandError(f'Не удалось прочитать файл ссылок: {e}')
        imported = 0
        for url in urls:
            self.stdout.write(f'Импорт по ссылке: {url}')
            try:
                self.import_single_url(url, force=force)
                imported += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Пропуск {url}: {e}'))
        self.stdout.write(self.style.SUCCESS(f'Готово (urls-file). Обработано: {len(urls)}, импортировано: {imported}'))


