#!/usr/bin/env python3
"""
Скрипт для автоматического запуска проекта MindJourney
"""

import os
import sys
import subprocess
import time
import platform

def print_banner():
    """Выводит баннер проекта"""
    print("""
🧠 MindJourney - Интерактивный психологический сайт
====================================================
🚀 Автоматический запуск проекта (TypeScript + Django)
""")

def check_requirements():
    """Проверяет наличие необходимых зависимостей"""
    print("🔍 Проверка зависимостей...")
    
    # Проверка Python
    if sys.version_info < (3, 8):
        print("❌ Требуется Python 3.8+")
        return False
    print(f"✅ Python: {sys.version.split()[0]}")
    
    # Проверка Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Node.js не найден")
            return False
        print(f"✅ Node.js: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Node.js не найден")
        return False
    
    # Проверка npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ npm не найден")
            return False
        print(f"✅ npm: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ npm не найден")
        return False
    
    # Проверка TypeScript
    try:
        result = subprocess.run(['npx', 'tsc', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("⚠️ TypeScript не найден (будет установлен автоматически)")
        else:
            print(f"✅ TypeScript: {result.stdout.strip()}")
    except FileNotFoundError:
        print("⚠️ TypeScript не найден (будет установлен автоматически)")
    
    print("✅ Все зависимости найдены")
    return True

def setup_backend():
    """Настраивает и запускает backend"""
    print("\n🐍 Настройка Django Backend...")
    
    if not os.path.exists('backend'):
        print("❌ Папка backend не найдена")
        return False
    
    os.chdir('backend')
    
    # Создание виртуального окружения
    if not os.path.exists('venv'):
        print("📦 Создание виртуального окружения...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'])
    
    # Активация виртуального окружения
    if platform.system() == "Windows":
        activate_script = os.path.join('venv', 'Scripts', 'activate.bat')
        pip_path = os.path.join('venv', 'Scripts', 'pip.exe')
        python_path = os.path.join('venv', 'Scripts', 'python.exe')
    else:
        activate_script = os.path.join('venv', 'bin', 'activate')
        pip_path = os.path.join('venv', 'bin', 'pip')
        python_path = os.path.join('venv', 'bin', 'python')
    
    # Установка зависимостей
    print("📦 Установка Python зависимостей...")
    result = subprocess.run([pip_path, 'install', '-r', 'requirements.txt'])
    if result.returncode != 0:
        print("❌ Ошибка установки зависимостей")
        os.chdir('..')
        return False
    
    # Миграции
    print("🗄️ Выполнение миграций...")
    result = subprocess.run([python_path, 'manage.py', 'makemigrations'])
    if result.returncode != 0:
        print("⚠️ Ошибка создания миграций (возможно, уже существуют)")
    
    result = subprocess.run([python_path, 'manage.py', 'migrate'])
    if result.returncode != 0:
        print("❌ Ошибка выполнения миграций")
        os.chdir('..')
        return False
    
    # Загрузка демо данных (если файл существует)
    demo_data_path = 'api/fixtures/demo_data.json'
    if os.path.exists(demo_data_path):
        print("📊 Загрузка демо данных...")
        result = subprocess.run([python_path, 'manage.py', 'loaddata', demo_data_path])
        if result.returncode != 0:
            print("⚠️ Ошибка загрузки демо данных (возможно, уже загружены)")
    else:
        print("⚠️ Файл демо данных не найден")
    
    print("✅ Backend настроен")
    os.chdir('..')
    return True

def setup_frontend():
    """Настраивает и запускает frontend"""
    print("\n⚛️ Настройка React Frontend (TypeScript)...")
    
    if not os.path.exists('frontend'):
        print("❌ Папка frontend не найдена")
        return False
    
    os.chdir('frontend')
    
    # Установка зависимостей
    print("📦 Установка Node.js зависимостей...")
    result = subprocess.run(['npm', 'install'])
    if result.returncode != 0:
        print("❌ Ошибка установки зависимостей")
        os.chdir('..')
        return False
    
    # Проверка TypeScript конфигурации
    print("🔧 Проверка TypeScript конфигурации...")
    if os.path.exists('tsconfig.json'):
        result = subprocess.run(['npx', 'tsc', '--noEmit'])
        if result.returncode != 0:
            print("⚠️ Обнаружены ошибки TypeScript (проверьте код)")
        else:
            print("✅ TypeScript конфигурация корректна")
    else:
        print("❌ Файл tsconfig.json не найден")
        os.chdir('..')
        return False
    
    print("✅ Frontend настроен")
    os.chdir('..')
    return True

def start_services():
    """Запускает backend и frontend"""
    print("\n🚀 Запуск сервисов...")
    
    # Запуск backend в фоне
    print("🐍 Запуск Django сервера...")
    if platform.system() == "Windows":
        backend_cmd = ['cmd', '/c', 'cd backend && venv\\Scripts\\activate && python manage.py runserver']
    else:
        backend_cmd = ['bash', '-c', 'cd backend && source venv/bin/activate && python manage.py runserver']
    
    try:
        backend_process = subprocess.Popen(backend_cmd)
        print("✅ Django сервер запущен")
    except Exception as e:
        print(f"❌ Ошибка запуска Django сервера: {e}")
        return
    
    # Ждем запуска backend
    print("⏳ Ожидание запуска backend...")
    time.sleep(5)
    
    # Запуск frontend в фоне
    print("⚛️ Запуск React приложения...")
    try:
        frontend_process = subprocess.Popen(['npm', 'start'], cwd='frontend')
        print("✅ React приложение запущено")
    except Exception as e:
        print(f"❌ Ошибка запуска React приложения: {e}")
        backend_process.terminate()
        return
    
    print("""
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
""")
    
    try:
        # Ждем завершения процессов
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Остановка сервисов...")
        try:
            backend_process.terminate()
            frontend_process.terminate()
            print("✅ Сервисы остановлены")
        except:
            print("⚠️ Ошибка при остановке сервисов")

def main():
    """Основная функция"""
    print_banner()
    
    if not check_requirements():
        print("❌ Не удалось проверить зависимости")
        return
    
    if not setup_backend():
        print("❌ Не удалось настроить backend")
        return
    
    if not setup_frontend():
        print("❌ Не удалось настроить frontend")
        return
    
    start_services()

if __name__ == "__main__":
    main()
