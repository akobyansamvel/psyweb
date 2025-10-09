#!/usr/bin/env python3
"""
Скрипт для сборки React приложения и запуска Django сервера
"""
import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Выполняет команду в терминале"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка выполнения команды: {command}")
        print(f"Ошибка: {e.stderr}")
        return False

def main():
    # Пути к директориям
    frontend_dir = Path("frontend")
    backend_dir = Path("backend")
    
    print("🚀 Начинаем сборку и запуск приложения...")
    
    # Проверяем, что мы в корневой директории проекта
    if not frontend_dir.exists() or not backend_dir.exists():
        print("❌ Ошибка: скрипт должен запускаться из корневой директории проекта")
        sys.exit(1)
    
    # 1. Устанавливаем зависимости frontend
    print("\n📦 Устанавливаем зависимости frontend...")
    if not run_command("npm install", cwd=frontend_dir):
        print("❌ Не удалось установить зависимости frontend")
        sys.exit(1)
    
    # 2. Собираем React приложение
    print("\n🔨 Собираем React приложение...")
    if not run_command("npm run build", cwd=frontend_dir):
        print("❌ Не удалось собрать React приложение")
        sys.exit(1)
    
    # 3. Устанавливаем зависимости backend
    print("\n📦 Устанавливаем зависимости backend...")
    if not run_command("pip install -r requirements.txt", cwd=backend_dir):
        print("❌ Не удалось установить зависимости backend")
        sys.exit(1)
    
    # 4. Применяем миграции
    print("\n🗄️ Применяем миграции...")
    if not run_command("python manage.py migrate", cwd=backend_dir):
        print("❌ Не удалось применить миграции")
        sys.exit(1)
    
    # 5. Собираем статические файлы
    print("\n📁 Собираем статические файлы...")
    if not run_command("python manage.py collectstatic --noinput", cwd=backend_dir):
        print("❌ Не удалось собрать статические файлы")
        sys.exit(1)
    
    print("\n🎉 Приложение готово к запуску!")
    print("\n🌐 Запускаем Django сервер...")
    print("📱 React приложение будет доступно по адресу: http://localhost:8000")
    print("🔌 API будет доступен по адресу: http://localhost:8000/api/")
    print("⚙️ Админ панель: http://localhost:8000/admin/")
    print("\nДля остановки сервера нажмите Ctrl+C")
    
    # 6. Запускаем Django сервер
    run_command("python manage.py runserver 0.0.0.0:8000", cwd=backend_dir)

if __name__ == "__main__":
    main()



