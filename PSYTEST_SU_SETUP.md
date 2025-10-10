# Настройка для домена psytest.su

## 🌐 Конфигурация домена

### ✅ Что уже настроено:

1. **Django Backend (порт 8000):**
   - `ALLOWED_HOSTS` включает `psytest.su` и `www.psytest.su`
   - CORS настроен для домена `psytest.su`
   - API доступен по адресу: `https://psytest.su:8000`

2. **React Frontend (порт 3000):**
   - `REACT_APP_API_URL` настроен на `https://psytest.su:8000/api`
   - Axios настроен с базовым URL для домена
   - Все API запросы идут через `psytest.su`

3. **Docker контейнеры:**
   - Backend: `psyweb-backend` на порту 8000
   - Frontend: `psyweb-frontend` на порту 3000

## 🚀 Команды для запуска:

```bash
# Остановить контейнеры
docker-compose down

# Запустить с новой конфигурацией
docker-compose up --build

# Скопировать базу данных (если нужно)
docker cp backend/db.sqlite3 psyweb-backend:/app/db.sqlite3
```

## 🌍 Доступ к приложению:

- **Frontend**: https://psytest.su:3000
- **Backend API**: https://psytest.su:8000
- **Django Admin**: https://psytest.su:8000/admin

## 🔧 Настройка Nginx (если нужно):

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name psytest.su www.psytest.su;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Django Admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Переменные окружения:

### Frontend:
- `REACT_APP_API_URL=https://psytest.su:8000/api`

### Backend:
- `ALLOWED_HOSTS=psytest.su,www.psytest.su`
- `CORS_ALLOWED_ORIGINS=https://psytest.su,https://www.psytest.su`

## ✅ Проверка работы:

1. Откройте https://psytest.su:3000
2. Проверьте, что API запросы идут на https://psytest.su:8000/api
3. Проверьте админку: https://psytest.su:8000/admin

Все готово для работы с доменом `psytest.su`! 🎉
