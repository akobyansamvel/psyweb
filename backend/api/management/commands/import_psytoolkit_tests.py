from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from api.psy_toolkit_service import psy_toolkit_service
from api.models import PsyToolkitTest
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Импорт тестов из PsyToolkit'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-id',
            type=str,
            help='ID конкретного теста для импорта'
        )
        parser.add_argument(
            '--category',
            type=str,
            help='Категория тестов для синхронизации'
        )
        parser.add_argument(
            '--categories',
            nargs='+',
            help='Список категорий для синхронизации'
        )
        parser.add_argument(
            '--sync-only',
            action='store_true',
            help='Только синхронизация без импорта'
        )
        parser.add_argument(
            '--import-all',
            action='store_true',
            help='Импорт всех доступных тестов'
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Имя пользователя для привязки импорта'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Максимальное количество тестов для обработки'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Переимпортировать уже импортированные тесты заново'
        )

    def handle(self, *args, **options):
        try:
            # Определяем пользователя
            user = None
            if options['user']:
                try:
                    user = User.objects.get(username=options['user'])
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'Пользователь {options["user"]} не найден')
                    )
                    return

            # Импорт конкретного теста
            if options['test_id']:
                self.stdout.write(f'Импорт теста {options["test_id"]}...')
                imported_test = psy_toolkit_service.import_test(options['test_id'], user=user, force=options['force'])
                
                if imported_test:
                    self.stdout.write(
                        self.style.SUCCESS(f'Тест "{imported_test.name}" успешно импортирован')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Не удалось импортировать тест {options["test_id"]}')
                    )
                return

            # Синхронизация категорий
            if options['category'] or options['categories']:
                categories = options['categories'] or [options['category']]
                self.stdout.write(f'Синхронизация категорий: {", ".join(categories)}')
                
                synced_count = psy_toolkit_service.sync_available_tests(categories)
                self.stdout.write(
                    self.style.SUCCESS(f'Синхронизировано {synced_count} тестов')
                )

                if not options['sync_only']:
                    # Импорт синхронизированных тестов
                    self.import_synced_tests(user, options['limit'], options['force'])

            # Импорт всех доступных тестов
            elif options['import_all']:
                self.stdout.write('Импорт всех доступных тестов...')
                self.import_synced_tests(user, options['limit'], options['force'])

            # По умолчанию - синхронизация основных категорий
            else:
                self.stdout.write('Синхронизация основных категорий...')
                default_categories = ['personality', 'cognitive', 'clinical', 'neuropsychological']
                synced_count = psy_toolkit_service.sync_available_tests(default_categories)
                self.stdout.write(
                    self.style.SUCCESS(f'Синхронизировано {synced_count} тестов')
                )

        except Exception as e:
            logger.error(f'Ошибка при выполнении команды: {e}')
            raise CommandError(f'Ошибка: {e}')

    def import_synced_tests(self, user, limit, force=False):
        """Импорт синхронизированных тестов"""
        # Если force, берём все, иначе только неимпортированные
        qs = PsyToolkitTest.objects.all() if force else PsyToolkitTest.objects.filter(is_imported=False)
        available_tests = qs[:limit]
        
        if not available_tests.exists():
            self.stdout.write('Нет доступных тестов для импорта')
            return

        self.stdout.write(f'Найдено {available_tests.count()} тестов для импорта')
        
        imported_count = 0
        for psy_test in available_tests:
            try:
                self.stdout.write(f'Импорт теста "{psy_test.name}"...')
                imported_test = psy_toolkit_service.import_test(psy_test.psy_toolkit_id, user=user, force=force)
                
                if imported_test:
                    imported_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Импортирован: {imported_test.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'✗ Не удалось импортировать: {psy_test.name}')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Ошибка при импорте {psy_test.name}: {e}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Импорт завершен. Успешно импортировано {imported_count} тестов')
        )
