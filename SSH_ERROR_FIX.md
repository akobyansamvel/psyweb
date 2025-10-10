# 🔧 Исправление SSH ошибки в GitHub Actions

## ✅ Что работает:
- ✅ Docker образы собраны и запушены в GitHub Container Registry
- ✅ Файлы деплоя созданы
- ✅ Архив создан

## ❌ Проблема:
```
Error: Process completed with exit code 6
```
Это ошибка SSH подключения.

## 🔍 Возможные причины:

### 1. **Неправильные GitHub Secrets:**
Проверьте в **Settings → Secrets and variables → Actions**:

```
SERVER_HOST=psytest.su
SERVER_PORT=22
SERVER_USER=root
SERVER_PASSWORD=your-actual-password
```

### 2. **SSH сервер не настроен:**
На сервере выполните:
```bash
# Проверить статус SSH
sudo systemctl status ssh

# Если не запущен:
sudo systemctl start ssh
sudo systemctl enable ssh

# Проверить конфиг
sudo nano /etc/ssh/sshd_config
# Убедиться что есть:
PasswordAuthentication yes
PermitRootLogin yes
```

### 3. **Файрвол блокирует SSH:**
```bash
# Проверить файрвол
sudo ufw status

# Если SSH заблокирован:
sudo ufw allow 22
sudo ufw allow ssh
```

### 4. **Пароль неправильный:**
Проверьте пароль в GitHub Secrets - он должен быть точным.

## 🧪 Тестирование SSH:

### С локального компьютера:
```bash
# Тест подключения
ssh root@psytest.su

# Тест с паролем
sshpass -p "your-password" ssh root@psytest.su "echo 'SSH works'"
```

### Проверка портов:
```bash
# Проверить что порт 22 открыт
telnet psytest.su 22

# Или
nc -zv psytest.su 22
```

## 🔧 Быстрое исправление:

### 1. **Проверьте GitHub Secrets:**
- Перейдите в Settings → Secrets and variables → Actions
- Убедитесь что все секреты заполнены правильно

### 2. **Проверьте SSH на сервере:**
```bash
# На сервере psytest.su
sudo systemctl status ssh
sudo systemctl restart ssh
```

### 3. **Проверьте файрвол:**
```bash
sudo ufw allow 22
sudo ufw reload
```

## 🚀 После исправления:

Сделайте новый push:
```bash
git commit --allow-empty -m "Retry deployment after SSH fix"
git push origin main
```

## 📝 Альтернативное решение:

Если SSH все еще не работает, можно использовать другой подход:

1. **Создать SSH ключи** вместо пароля
2. **Использовать другой порт** SSH
3. **Проверить DNS** - возможно `psytest.su` не резолвится

Попробуйте сначала проверить SSH подключение с локального компьютера! 🔍
