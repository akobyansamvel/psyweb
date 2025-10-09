# 🔧 Исправление проблем с Dropbear SSH

## ❌ Проблема: "Connection closed by *** port ***"

Это происходит когда сервер использует Dropbear SSH вместо OpenSSH.

### 🛠️ Решения:

#### 1. Проверьте формат SSH ключа
Dropbear поддерживает только определенные форматы ключей:

```bash
# Проверьте формат ключа
ssh-keygen -l -f ~/.ssh/id_rsa.pub

# Если нужно, конвертируйте ключ в формат Dropbear
dropbearconvert openssh dropbear ~/.ssh/id_rsa ~/.ssh/id_rsa_dropbear
```

#### 2. Альтернативный метод - используйте пароль
Если ключи не работают, можно использовать аутентификацию по паролю:

**Добавьте в GitHub Secrets:**
- `SERVER_PASSWORD` - пароль пользователя

**Обновите workflow:**
```yaml
- name: 🔑 Setup SSH with Password
  if: github.ref == 'refs/heads/main'
  run: |
    mkdir -p ~/.ssh
    echo "Host $SERVER_HOST" >> ~/.ssh/config
    echo "  Port $SERVER_PORT" >> ~/.ssh/config
    echo "  User $SERVER_USER" >> ~/.ssh/config
    echo "  StrictHostKeyChecking no" >> ~/.ssh/config
    echo "  PreferredAuthentications password" >> ~/.ssh/config
    echo "  PubkeyAuthentication no" >> ~/.ssh/config
    echo "  PasswordAuthentication yes" >> ~/.ssh/config
    
    # Установите sshpass для автоматического ввода пароля
    sudo apt-get update
    sudo apt-get install -y sshpass
    
    # Тест подключения с паролем
    sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=15 $SERVER_HOST "echo 'SSH connection successful'"
```

#### 3. Используйте rsync вместо scp
```yaml
# Вместо scp используйте rsync
rsync -avz -e "ssh -o ConnectTimeout=30" psyweb-deploy.tar.gz $SERVER_HOST:/tmp/
```

#### 4. Проверьте настройки Dropbear на сервере
```bash
# Проверьте конфигурацию Dropbear
cat /etc/default/dropbear

# Убедитесь что включены нужные опции:
DROPBEAR_EXTRA_ARGS="-s -g -I 300"
```

#### 5. Создайте новый ключ специально для Dropbear
```bash
# На локальной машине
ssh-keygen -t rsa -b 2048 -f ~/.ssh/dropbear_key -N ""

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/dropbear_key.pub user@server

# Используйте этот ключ в GitHub Secrets
```

### 🧪 Тестирование подключения:

```bash
# Тест с verbose режимом
ssh -vvv -p PORT USER@HOST

# Тест с различными методами аутентификации
ssh -o PreferredAuthentications=publickey USER@HOST
ssh -o PreferredAuthentications=password USER@HOST
```

### 📝 Рекомендуемое решение:

1. **Попробуйте парольную аутентификацию** (самый простой способ)
2. **Используйте rsync** вместо scp
3. **Увеличьте таймауты** для медленных соединений
4. **Проверьте логи** на сервере: `/var/log/auth.log`
