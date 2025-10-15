# 🔐 GitHub Secrets Checklist

Проверьте, что в вашем GitHub репозитории настроены следующие секреты:

## Обязательные секреты:

### 1. `SERVER_HOST`
- **Значение**: `194.58.114.58`
- **Описание**: IP адрес вашего сервера

### 2. `SERVER_USER`
- **Значение**: ваш SSH пользователь (например: `root`, `ubuntu`, `deploy`)
- **Описание**: Пользователь для SSH подключения к серверу

### 3. `SSH_PRIVATE_KEY`
- **Значение**: содержимое вашего приватного SSH ключа
- **Описание**: Приватный ключ для SSH подключения к серверу
- **Формат**: 
```
-----BEGIN OPENSSH PRIVATE KEY-----
ваш_приватный_ключ_здесь
-----END OPENSSH PRIVATE KEY-----
```

## Как добавить секреты в GitHub:

1. Перейдите в ваш репозиторий на GitHub
2. Нажмите на вкладку **Settings**
3. В левом меню выберите **Secrets and variables** → **Actions**
4. Нажмите **New repository secret**
5. Добавьте каждый секрет с соответствующим именем и значением

## Проверка SSH ключа:

Убедитесь, что ваш публичный ключ добавлен на сервер:

```bash
# На вашем локальном компьютере
cat ~/.ssh/id_rsa.pub

# Скопируйте вывод и добавьте в ~/.ssh/authorized_keys на сервере
ssh-copy-id -i ~/.ssh/id_rsa.pub user@194.58.114.58
```

## Проверка подключения:

```bash
# Тест SSH подключения
ssh -i ~/.ssh/id_rsa user@194.58.114.58 "echo 'SSH connection successful'"
```

## Проверка Docker на сервере:

```bash
# SSH на сервер и проверьте Docker
ssh user@194.58.114.58 "docker --version && docker-compose --version"
```

## Проверка GitHub Container Registry:

Убедитесь, что ваш GitHub токен имеет права на пакеты:
- `read:packages` - для скачивания образов
- `write:packages` - для загрузки образов (автоматически в GitHub Actions)

## Тестирование workflow:

После настройки всех секретов:
1. Сделайте коммит в ветку `main`
2. Проверьте вкладку **Actions** в GitHub
3. Следите за выполнением workflow

## Возможные проблемы:

### Если SSH не работает:
- Проверьте, что порт 22 открыт на сервере
- Убедитесь, что SSH сервис запущен: `sudo systemctl status ssh`
- Проверьте права на файл ключа: `chmod 600 ~/.ssh/id_rsa`

### Если Docker образы не скачиваются:
- Проверьте, что образы существуют: https://github.com/akobyansamvel/psyweb/pkgs/container/psyweb-backend
- Убедитесь, что токен имеет права на пакеты
- Проверьте, что образы публичные или у токена есть доступ

### Если контейнеры не запускаются:
- Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
- Убедитесь, что порты не заняты: `netstat -tulpn | grep :80`
- Проверьте, что Docker Compose установлен: `docker-compose --version`
