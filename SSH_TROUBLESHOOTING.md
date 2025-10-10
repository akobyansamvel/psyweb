# 🔧 Диагностика проблем с SSH подключением

## ❌ Ошибка: "Connection timed out" или "Connection closed"

### 🔍 Возможные причины:

1. **Неправильные настройки сервера**
   - Неверный IP адрес или домен
   - Неправильный порт SSH
   - Сервер недоступен.

2. **Проблемы с SSH ключами**
   - Неправильный приватный ключ
   - Публичный ключ не добавлен на сервер
   - Неправильные права доступа

3. **Проблемы с сетью**
   - Файрвол блокирует подключение
   - Сервер не отвечает на SSH порт

### 🛠️ Как исправить:

#### 1. Проверьте настройки GitHub Secrets:
```
SERVER_HOST - IP адрес или домен сервера (например: 192.168.1.100)
SERVER_PORT - SSH порт (обычно 22)
SERVER_USER - имя пользователя (например: root, ubuntu, deploy)
SSH_PRIVATE_KEY - содержимое приватного ключа (~/.ssh/id_rsa)
```

#### 2. Проверьте SSH подключение локально:
```bash
# Тест подключения
ssh -p YOUR_PORT YOUR_USER@YOUR_HOST "echo 'Connection successful'"

# Проверка ключей
ssh-keygen -l -f ~/.ssh/id_rsa.pub
```

#### 3. Настройте сервер:
```bash
# Установите SSH сервер
sudo apt update
sudo apt install openssh-server

# Запустите SSH сервер
sudo systemctl start ssh
sudo systemctl enable ssh

# Проверьте статус
sudo systemctl status ssh

# Откройте порт в файрволе
sudo ufw allow ssh
sudo ufw allow YOUR_CUSTOM_PORT
```

#### 4. Настройте SSH ключи на сервере:
```bash
# Создайте папку .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Добавьте публичный ключ
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Проверьте права
ls -la ~/.ssh/
```

#### 5. Проверьте конфигурацию SSH:
```bash
# Файл /etc/ssh/sshd_config
sudo nano /etc/ssh/sshd_config

# Убедитесь что включены:
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin yes  # или no, если не root

# Перезапустите SSH
sudo systemctl restart ssh
```

### 🧪 Тестирование:

1. **Проверьте доступность сервера:**
   ```bash
   ping YOUR_HOST
   telnet YOUR_HOST YOUR_PORT
   ```

2. **Проверьте SSH подключение:**
   ```bash
   ssh -v -p YOUR_PORT YOUR_USER@YOUR_HOST
   ```

3. **Проверьте ключи:**
   ```bash
   ssh-add -l  # список загруженных ключей
   ```

### 📝 Пример правильных настроек:

**GitHub Secrets:**
- `SERVER_HOST`: `192.168.1.100`
- `SERVER_PORT`: `22`
- `SERVER_USER`: `deploy`
- `SSH_PRIVATE_KEY`: содержимое файла `~/.ssh/id_rsa`

**На сервере:**
```bash
# Создайте пользователя deploy
sudo adduser deploy
sudo usermod -aG sudo deploy

# Настройте SSH ключи
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2E..." | sudo -u deploy tee /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

### 🚨 Если ничего не помогает:

1. Проверьте логи SSH на сервере:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

2. Попробуйте подключиться с паролем:
   ```bash
   ssh -o PreferredAuthentications=password YOUR_USER@YOUR_HOST
   ```

3. Проверьте файрвол:
   ```bash
   sudo ufw status
   sudo iptables -L
   ```
