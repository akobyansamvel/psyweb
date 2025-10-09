@echo off
echo 🚀 Начинаем сборку и запуск приложения...
echo.

echo 📦 Устанавливаем зависимости frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ Не удалось установить зависимости frontend
    pause
    exit /b 1
)

echo.
echo 🔨 Собираем React приложение...
call npm run build
if errorlevel 1 (
    echo ❌ Не удалось собрать React приложение
    pause
    exit /b 1
)

echo.
echo 📦 Устанавливаем зависимости backend...
cd ..\backend
call pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Не удалось установить зависимости backend
    pause
    exit /b 1
)

echo.
echo 🗄️ Применяем миграции...
call python manage.py migrate
if errorlevel 1 (
    echo ❌ Не удалось применить миграции
    pause
    exit /b 1
)

echo.
echo 📁 Собираем статические файлы...
call python manage.py collectstatic --noinput
if errorlevel 1 (
    echo ❌ Не удалось собрать статические файлы
    pause
    exit /b 1
)

echo.
echo 🎉 Приложение готово к запуску!
echo.
echo 🌐 Запускаем Django сервер...
echo 📱 React приложение будет доступно по адресу: http://localhost:8000
echo 🔌 API будет доступен по адресу: http://localhost:8000/api/
echo ⚙️ Админ панель: http://localhost:8000/admin/
echo.
echo Для остановки сервера нажмите Ctrl+C
echo.

call python manage.py runserver 0.0.0.0:8000
pause



