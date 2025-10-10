# 🔐 Решение проблемы с правами доступа GitHub Container Registry

## ❌ Проблема:
```
ERROR: failed to push ghcr.io/akobyansamvel/psyweb-backend:latest: 
denied: installation not allowed to Create organization package
```

## ✅ Решения:

### Вариант 1: Использовать личный репозиторий (рекомендуется)

1. **Переместите репозиторий в личный аккаунт:**
   - Settings → General → Transfer ownership
   - Выберите свой личный аккаунт

2. **Или создайте новый репозиторий в личном аккаунте:**
   - Создайте новый репозиторий `psyweb` в своем личном аккаунте
   - Скопируйте туда код

### Вариант 2: Настроить права доступа в организации

1. **В организации akobyansamvel:**
   - Settings → Actions → General
   - В разделе "Workflow permissions" выберите "Read and write permissions"
   - Включите "Allow GitHub Actions to create and approve pull requests"

2. **Настройте Package permissions:**
   - Settings → Packages
   - Создайте новый пакет или настройте права для существующего

### Вариант 3: Использовать Docker Hub (альтернатива)

Обновите GitHub Actions для использования Docker Hub:

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: your-dockerhub-username/psyweb

# В шаге логина:
- name: 🔑 Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

## 🚀 Рекомендуемое решение:

### 1. Переместите репозиторий в личный аккаунт:
- Settings → General → Transfer ownership
- Выберите свой личный аккаунт

### 2. Обновите GitHub Secrets:
```
SERVER_HOST=psytest.su
SERVER_PORT=22
SERVER_USER=root
SERVER_PASSWORD=your-password
```

### 3. Сделайте новый commit:
```bash
git add .
git commit -m "Fix GitHub Container Registry permissions"
git push origin main
```

## 🔍 Проверка прав доступа:

1. **Проверьте, что у вас есть права на создание пакетов:**
   - Перейдите в Settings → Packages
   - Попробуйте создать новый пакет

2. **Проверьте настройки Actions:**
   - Settings → Actions → General
   - Workflow permissions должны быть "Read and write"

## ✅ После исправления:

GitHub Actions будет успешно:
- Собирать Docker образы
- Push в GitHub Container Registry
- Деплоить на сервер psytest.su

Попробуйте сначала переместить репозиторий в личный аккаунт - это самое простое решение! 🎯
