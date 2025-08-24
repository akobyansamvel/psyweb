from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile


class Command(BaseCommand):
    help = 'Создает профили пользователей для пользователей без профилей'

    def handle(self, *args, **options):
        users_without_profiles = User.objects.filter(profile__isnull=True)
        
        if not users_without_profiles.exists():
            self.stdout.write(
                self.style.SUCCESS('Все пользователи уже имеют профили')
            )
            return
        
        created_count = 0
        for user in users_without_profiles:
            UserProfile.objects.create(user=user)
            created_count += 1
            self.stdout.write(f'Создан профиль для пользователя: {user.username}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Успешно создано {created_count} профилей пользователей')
        )
