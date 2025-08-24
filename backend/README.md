# MindJourney Backend

Django REST API для психологического сайта MindJourney.

## Установка и запуск

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Выполните миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

5. Загрузите демо данные:
```bash
python manage.py loaddata api/fixtures/demo_data.json
```

6. Запустите сервер:
```bash
python manage.py runserver
```

## API Endpoints

### Тесты
- `GET /api/tests/` - список всех тестов
- `GET /api/tests/{id}/` - детали конкретного теста
- `POST /api/tests/{id}/submit/` - отправка ответов на тест

### Результаты
- `GET /api/results/{id}/` - просмотр результата теста
- `GET /api/users/history/` - история результатов пользователя

### Аутентификация
- `POST /api/auth/register/` - регистрация
- `POST /api/auth/login/` - авторизация
- `GET /api/users/profile/` - профиль пользователя

## Демо данные

В проекте уже есть готовый тест личности с 8 вопросами и 24 вариантами ответов, покрывающими основные черты личности:

- Экстраверсия/Интроверсия
- Открытость
- Добросовестность
- Доброжелательность
- Нейротизм
- Креативность
- Лидерство
- Эмпатия
- Адаптивность

## Админ панель

Доступна по адресу `/admin/` после создания суперпользователя.
