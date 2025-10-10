# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена
RUN npm run build

# Устанавливаем serve для обслуживания статических файлов
RUN npm install -g serve

# Открываем порт 3000
EXPOSE 3000

# Команда для запуска сервера
CMD ["serve", "-s", "build", "-l", "3000"]
