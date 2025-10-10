# 🚀 Настройка GitHub Actions для Docker Deploy

## ✅ Что готово:

1. **Docker контейнеры настроены:**
   - ✅ Backend на порту 8000
   - ✅ Frontend на порту 3000
   - ✅ Все запросы через `psytest.su`

2. **GitHub Actions создан:**
   - ✅ `.github/workflows/docker-deploy.yml`
   - ✅ Сборка и push Docker образов в GitHub Container Registry
   - ✅ Автоматический деплой на сервер

3. **Production конфигурация:**
   - ✅ `docker-compose.prod.yml`
   - ✅ `nginx.conf` для домена `psytest.su`

## 🔑 Настройка GitHub Secrets:

Перейдите в **Settings → Secrets and variables → Actions** и добавьте:

### Обязательные секреты:
```
SERVER_HOST=your-server-ip-or-domain
SERVER_PORT=22
SERVER_USER=your-username
SERVER_PASSWORD=your-password
```

### Пример:
```
SERVER_HOST=psytest.su
SERVER_PORT=22
SERVER_USER=root
SERVER_PASSWORD=your-secure-password
```

## 🐳 Что происходит при деплое:

1. **Сборка образов:**
   - Backend: `ghcr.io/samvel/psyweb-backend:latest`
   - Frontend: `ghcr.io/samvel/psyweb-frontend:latest`

2. **Push в GitHub Container Registry:**
   - Образы сохраняются в `ghcr.io`
   - Доступны для скачивания на сервере

3. **Деплой на сервер:**
   - Остановка старых контейнеров
   - Скачивание новых образов
   - Запуск с production конфигурацией

## 🌐 Результат:

После успешного деплоя приложение будет доступно:
- **Frontend**: https://psytest.su
- **Backend API**: https://psytest.su/api
- **Django Admin**: https://psytest.su/admin

## 🚀 Как запустить деплой:

1. **Настройте GitHub Secrets** (см. выше)
2. **Сделайте commit и push:**
   ```bash
   git add .
   git commit -m "Add Docker deployment configuration"
   git push origin main
   ```

3. **Проверьте GitHub Actions:**
   - Перейдите в **Actions** в вашем репозитории
   - Убедитесь, что workflow запустился
   - Следите за логами выполнения

## 🔧 Требования к серверу:

- **Docker** и **Docker Compose** установлены
- **SSH доступ** с паролем
- **Порты 80, 443, 3000, 8000** открыты
- **Домен psytest.su** настроен на сервер

## 📝 Проверка после деплоя:

```bash
# Проверить статус контейнеров
docker ps

# Проверить логи
docker-compose -f docker-compose.prod.yml logs

# Проверить доступность
curl https://psytest.su
curl https://psytest.su/api/tests/
```

## ✅ Готово к деплою!

Все настроено для автоматического деплоя через GitHub Actions. Просто настройте секреты и сделайте push! 🎉
