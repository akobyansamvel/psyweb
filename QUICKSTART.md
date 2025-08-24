# 🚀 Быстрый запуск MindJourney

## ⚡ Один клик - проект запущен!

### Автоматический запуск (рекомендуется)

```bash
# Запуск всего проекта одной командой
python start_project.py
```

Этот скрипт автоматически:
- ✅ Проверит зависимости
- ✅ Настроит виртуальное окружение
- ✅ Установит все пакеты
- ✅ Выполнит миграции
- ✅ Загрузит демо данные
- ✅ Запустит backend и frontend

### Ручной запуск

Если автоматический запуск не работает:

#### 1. Backend (Django)
```bash
cd backend

# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate
# Активация (Linux/Mac)
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Миграции
python manage.py makemigrations
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Загрузка демо данных
python manage.py loaddata api/fixtures/demo_data.json

# Запуск сервера
python manage.py runserver
```

#### 2. Frontend (React)
```bash
cd frontend

# Установка зависимостей
npm install

# Запуск приложения
npm start
```

## 🌐 Доступные адреса

После запуска:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin панель**: http://localhost:8000/admin

## 📱 Демо аккаунт

После загрузки демо данных вы можете:
1. Зарегистрировать новый аккаунт
2. Или использовать созданный суперпользователя для входа в admin

## 🧪 Тестирование

1. Откройте http://localhost:3000
2. Зарегистрируйтесь или войдите
3. Выберите тест "Тест личности MindJourney"
4. Ответьте на 8 вопросов
5. Получите интерактивную карту личности!

## 🆘 Решение проблем

### Backend не запускается
```bash
# Проверьте Python версию (должна быть 3.8+)
python --version

# Переустановите зависимости
pip install -r requirements.txt --force-reinstall
```

### Frontend не запускается
```bash
# Очистите npm кэш
npm cache clean --force

# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

### База данных
```bash
# Сброс базы данных
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py loaddata api/fixtures/demo_data.json
```

## 🔧 Полезные команды

```bash
# Установка только backend зависимостей
npm run install:backend

# Установка только frontend зависимостей
npm run install:frontend

# Создание миграций
npm run makemigrations

# Применение миграций
npm run migrate

# Создание суперпользователя
npm run createsuperuser

# Загрузка демо данных
npm run loaddata

# Сборка frontend для продакшена
npm run build
```

## 📋 Требования

- **Python**: 3.8+
- **Node.js**: 16+
- **npm**: 8+
- **RAM**: минимум 2GB
- **Диск**: минимум 500MB свободного места

## 🎯 Что дальше?

После успешного запуска:

1. **Изучите код** - начните с `backend/api/models.py` и `frontend/src/App.js`
2. **Добавьте новые тесты** - через admin панель Django
3. **Кастомизируйте дизайн** - измените стили в `frontend/src/`
4. **Расширьте функционал** - добавьте новые черты личности

---

**Удачи в изучении MindJourney! 🚀**
