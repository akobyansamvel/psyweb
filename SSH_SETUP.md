# 🔐 Настройка SSH для GitHub Actions

## ✅ SSH подключение настроено в GitHub Actions:

GitHub Actions использует SSH для подключения к серверу через:
- `sshpass` - для аутентификации по паролю
- `scp` - для передачи файлов
- `ssh` - для выполнения команд

## 🔑 GitHub Secrets (обязательно):

В **Settings → Secrets and variables → Actions** добавьте:

```
SERVER_HOST=psytest.su
SERVER_PORT=22
SERVER_USER=root
SERVER_PASSWORD=your-secure-password
```

## 🖥️ Требования к серверу:

### 1. SSH сервер должен быть настроен:
```bash
# Проверить статус SSH
sudo systemctl status ssh

# Если не установлен:
sudo apt update
sudo apt install openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 2. Разрешить парольную аутентификацию:
```bash
# Редактировать конфиг SSH
sudo nano /etc/ssh/sshd_config

# Убедиться что есть:
PasswordAuthentication yes
PubkeyAuthentication yes
PermitRootLogin yes  # или PermitRootLogin prohibit-password

# Перезапустить SSH
sudo systemctl restart ssh
```

### 3. Установить Docker на сервере:
```bash
# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo apt install docker-compose-plugin

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
```

### 4. Открыть порты в файрволе:
```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS
sudo ufw allow 3000 # Frontend
sudo ufw allow 8000 # Backend

# Или iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
```

## 🧪 Тестирование SSH подключения:

### С локального компьютера:
```bash
# Тест подключения
ssh root@psytest.su

# Тест с паролем (как в GitHub Actions)
sshpass -p "your-password" ssh root@psytest.su "echo 'SSH connection successful'"

# Тест передачи файлов
sshpass -p "your-password" scp test.txt root@psytest.su:/tmp/
```

## 🔧 Что происходит при деплое:

1. **GitHub Actions подключается по SSH:**
   ```bash
   sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST
   ```

2. **Передает файлы через SCP:**
   ```bash
   sshpass -p "$SERVER_PASSWORD" scp file.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/
   ```

3. **Выполняет команды на сервере:**
   ```bash
   sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
   # команды деплоя
   EOF
   ```

## 🚨 Возможные проблемы:

### 1. SSH не подключается:
```bash
# Проверить статус SSH
sudo systemctl status ssh

# Проверить логи
sudo journalctl -u ssh

# Проверить конфиг
sudo sshd -T | grep password
```

### 2. Пароль не принимается:
```bash
# Проверить пользователя
id root

# Проверить права
sudo chmod 600 /etc/ssh/sshd_config
```

### 3. Порты заблокированы:
```bash
# Проверить открытые порты
sudo netstat -tlnp | grep :22

# Проверить файрвол
sudo ufw status
```

## ✅ Готово к деплою!

После настройки SSH и GitHub Secrets можно делать push в main ветку для автоматического деплоя! 🚀
