# PsyWeb - Психологическое тестирование

Веб-приложение для психологического тестирования с использованием Django (backend) и React (frontend).

## 🚀 Быстрый запуск

### Автоматический запуск (рекомендуется)

```bash
# Запустите скрипт из корневой директории проекта
python build_and_serve.py
```

Этот скрипт автоматически:
1. Установит все зависимости
2. Соберет React приложение
3. Настроит Django
4. Запустит сервер

### Ручной запуск

#### 1. Backend (Django)

```bash
cd backend

# Создайте виртуальное окружение (опционально)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установите зависимости
pip install -r requirements.txt

# Примените миграции
python manage.py migrate

# Соберите статические файлы
python manage.py collectstatic --noinput

# Запустите сервер
python manage.py runserver
```

#### 2. Frontend (React)

```bash
cd frontend

# Установите зависимости
npm install

# Соберите приложение
npm run build
```

## 🌐 Доступ к приложению

После запуска:

- **Главная страница**: http://localhost:8000
- **API**: http://localhost:8000/api/
- **Админ панель**: http://localhost:8000/admin/

## 📁 Структура проекта

```
psyweb/
├── backend/                 # Django backend
│   ├── api/                # API приложение
│   ├── mindjourney/        # Основные настройки Django
│   ├── manage.py           # Django management
│   └── requirements.txt    # Python зависимости
├── frontend/               # React frontend
│   ├── src/                # Исходный код React
│   ├── build/              # Собранное приложение
│   └── package.json        # Node.js зависимости
└── build_and_serve.py      # Скрипт автоматического запуска
```

## 🔧 Технологии

### Backend
- Django 4.2.7
- Django REST Framework
- JWT аутентификация
- SQLite (для разработки)
- WhiteNoise (для статических файлов)

### Frontend
- React 18
- TypeScript
- CSS модули

## 📝 Особенности

- Django обслуживает React приложение для всех не-API маршрутов
- WhiteNoise обеспечивает эффективную раздачу статических файлов
- CORS настроен для разработки
- JWT аутентификация для API

## 🚨 Важные замечания

1. **Для продакшена**: измените `SECRET_KEY` и `DEBUG = False`
2. **База данных**: для продакшена используйте PostgreSQL
3. **Статические файлы**: в продакшене используйте CDN или веб-сервер

## 🐛 Устранение неполадок

### Ошибка "Module not found"
```bash
# Переустановите зависимости
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### Ошибка миграций
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Проблемы со статическими файлами
```bash
cd backend
python manage.py collectstatic --clear --noinput
```
