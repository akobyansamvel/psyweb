# MindJourney - Интерактивный психологический сайт
# Автоматический запуск проекта (TypeScript + Django)

Write-Host @"

🧠 MindJourney - Интерактивный психологический сайт
====================================================
🚀 Автоматический запуск проекта (TypeScript + Django)

"@ -ForegroundColor Cyan

# Проверка зависимостей
Write-Host "🔍 Проверка зависимостей..." -ForegroundColor Yellow

# Проверка Python
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Python не найден" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Python не найден" -ForegroundColor Red
    exit 1
}

# Проверка Node.js
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js не найден" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js не найден" -ForegroundColor Red
    exit 1
}

# Проверка npm
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm не найден" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ npm не найден" -ForegroundColor Red
    exit 1
}

# Проверка TypeScript
try {
    $tsVersion = npx tsc --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript: $tsVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️ TypeScript не найден (будет установлен автоматически)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ TypeScript не найден (будет установлен автоматически)" -ForegroundColor Yellow
}

Write-Host "✅ Все зависимости найдены" -ForegroundColor Green

# Настройка Backend
Write-Host "`n🐍 Настройка Django Backend..." -ForegroundColor Yellow

if (-not (Test-Path "backend")) {
    Write-Host "❌ Папка backend не найдена" -ForegroundColor Red
    exit 1
}

Set-Location backend

# Создание виртуального окружения
if (-not (Test-Path "venv")) {
    Write-Host "📦 Создание виртуального окружения..." -ForegroundColor Yellow
    python -m venv venv
}

# Активация виртуального окружения
Write-Host "📦 Установка Python зависимостей..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка установки зависимостей" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Миграции
Write-Host "🗄️ Выполнение миграций..." -ForegroundColor Yellow
python manage.py makemigrations
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Ошибка создания миграций (возможно, уже существуют)" -ForegroundColor Yellow
}

python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка выполнения миграций" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Загрузка демо данных
if (Test-Path "api/fixtures/demo_data.json") {
    Write-Host "📊 Загрузка демо данных..." -ForegroundColor Yellow
    python manage.py loaddata api/fixtures/demo_data.json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Ошибка загрузки демо данных (возможно, уже загружены)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Файл демо данных не найден" -ForegroundColor Yellow
}

Write-Host "✅ Backend настроен" -ForegroundColor Green
Set-Location ..

# Настройка Frontend
Write-Host "`n⚛️ Настройка React Frontend (TypeScript)..." -ForegroundColor Yellow

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Папка frontend не найдена" -ForegroundColor Red
    exit 1
}

Set-Location frontend

# Установка зависимостей
Write-Host "📦 Установка Node.js зависимостей..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка установки зависимостей" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Проверка TypeScript конфигурации
Write-Host "🔧 Проверка TypeScript конфигурации..." -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Обнаружены ошибки TypeScript (проверьте код)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ TypeScript конфигурация корректна" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Файл tsconfig.json не найден" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Frontend настроен" -ForegroundColor Green
Set-Location ..

# Запуск сервисов
Write-Host "`n🚀 Запуск сервисов..." -ForegroundColor Yellow

# Запуск backend в фоне
Write-Host "🐍 Запуск Django сервера..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    & ".\venv\Scripts\Activate.ps1"
    python manage.py runserver
}

Write-Host "✅ Django сервер запущен" -ForegroundColor Green

# Ждем запуска backend
Write-Host "⏳ Ожидание запуска backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Запуск frontend в фоне
Write-Host "⚛️ Запуск React приложения..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm start
}

Write-Host "✅ React приложение запущено" -ForegroundColor Green

Write-Host @"

🎉 Проект запущен!

📱 Frontend: http://localhost:3000
🐍 Backend: http://localhost:8000
🔐 Admin: http://localhost:8000/admin
📊 API: http://localhost:8000/api/

💡 Особенности проекта:
• TypeScript для типобезопасности
• Динамические профили личности
• Интерактивные карты D3.js
• JWT аутентификация
• Анализ паттернов и несоответствий

Для остановки нажмите Ctrl+C

"@ -ForegroundColor Green

try {
    # Ждем завершения процессов
    Wait-Job -Job $backendJob, $frontendJob
} catch {
    Write-Host "`n🛑 Остановка сервисов..." -ForegroundColor Yellow
    try {
        Stop-Job -Job $backendJob, $frontendJob
        Remove-Job -Job $backendJob, $frontendJob
        Write-Host "✅ Сервисы остановлены" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Ошибка при остановке сервисов" -ForegroundColor Yellow
    }
}
