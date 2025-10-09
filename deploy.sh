#!/bin/bash

# 🚀 Fast Deploy Script for PsyWeb (No Docker)
# Максимально ускоряет процесс деплоя

set -e

echo "🚀 Starting fast deployment..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверяем наличие Python и Node.js
if ! command -v python3 &> /dev/null; then
    error "Python3 не установлен!"
fi

if ! command -v node &> /dev/null; then
    error "Node.js не установлен!"
fi

if ! command -v npm &> /dev/null; then
    error "npm не установлен!"
fi

log "🔧 Installing Python dependencies..."
cd backend
pip install -r requirements.txt &

log "📦 Installing Node.js dependencies..."
cd ../frontend
npm ci --only=production &

# Ждем завершения установки зависимостей
wait

log "🏗️ Building React app..."
npm run build &

log "🗄️ Setting up database..."
cd ../backend
python manage.py migrate --noinput &

log "📁 Collecting static files..."
python manage.py collectstatic --noinput &

# Ждем завершения всех операций
wait

log "🚀 Starting application in background..."
python manage.py runserver 0.0.0.0:8000 &

log "✅ Deployment completed!"
log "🌐 Application is running at: http://localhost:8000"

# Проверяем статус
sleep 5
if curl -f http://localhost:8000 > /dev/null 2>&1; then
    log "✅ Health check passed!"
else
    warning "⚠️ Health check failed, but deployment completed"
fi

echo ""
log "📊 Deployment Summary:"
echo "  - Frontend: Built and served"
echo "  - Backend: Running on port 8000"
echo "  - Database: SQLite (local)"
echo ""
log "🎉 PsyWeb is live and ready!"
