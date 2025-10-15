# PsyWeb Docker Setup

Этот проект настроен для работы в Docker контейнерах.

## Структура

- **Frontend**: React приложение на порту 3000
- **Backend**: Django API на порту 8000

## Быстрый запуск

### 1. Сборка и запуск всех сервисов

```bash
docker-compose up --build
```

### 2. Запуск в фоновом режиме

```bash
docker-compose up -d --build
```

### 3. Остановка сервисовee

```bash
docker-compose down
```

## Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## Полезные команды

### Просмотр логов
```bash
# Все сервисы
docker-compose logs

# Только backend
docker-compose logs backend

# Только frontend
docker-compose logs frontend
```

### Выполнение команд в контейнерах
```bash
# Django команды в backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Shell в backend
docker-compose exec backend bash

# Shell в frontend
docker-compose exec frontend sh
```

### Пересборка без кэша
```bash
docker-compose build --no-cache
docker-compose up
```

## Разработка

Для разработки с hot-reload:

1. Запустите только backend в Docker:
```bash
docker-compose up backend
```

2. Запустите frontend локально:
```bash
cd frontend
npm start
```

## Переменные окружения

Создайте файл `.env` в корне проекта для настройки переменных окружения:

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

## Volumes

- `backend_static`: Статические файлы Django
- `backend_media`: Медиа файлы Django
- Локальные папки монтируются для разработки

## Troubleshooting

### Проблема с Docker Desktop
Если получаете ошибку `unable to get image` или `The system cannot find the file specified`:

1. **Убедитесь, что Docker Desktop запущен:**
   - Откройте Docker Desktop
   - Дождитесь полной загрузки (статус "Engine running")
   - В трее должен быть зеленый значок Docker

2. **Перезапустите Docker Desktop:**
   - Закройте Docker Desktop
   - Запустите заново
   - Дождитесь загрузки

3. **Проверьте статус Docker:**
   ```bash
   docker --version
   docker-compose --version
   ```

4. **Если проблема persists, выполните:**
   ```bash
   # Очистите Docker кэш
   docker system prune -a
   
   # Перезапустите Docker Desktop
   # Затем попробуйте снова
   docker-compose up --build
   ```

### Проблемы с портами
Если порты 3000 или 8000 заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Frontend на порту 3001
  - "8001:8000"  # Backend на порту 8001
```

### Очистка Docker
```bash
# Удалить все контейнеры и volumes
docker-compose down -v

# Удалить все образы проекта
docker-compose down --rmi all

# Полная очистка Docker
docker system prune -a
```

### Альтернативный запуск (если Docker Desktop не работает)
```bash
# Запуск только backend в Docker
docker-compose up backend

# Frontend запустить локально
cd frontend
npm install
npm start
```
