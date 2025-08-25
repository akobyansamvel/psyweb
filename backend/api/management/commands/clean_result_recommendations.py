from django.core.management.base import BaseCommand
from api.models import TestResult


class Command(BaseCommand):
    help = 'Removes generic recommendations and fallback descriptions from saved TestResult.personality_map'

    def handle(self, *args, **options):
        updated = 0
        total = 0
        for result in TestResult.objects.all():
            total += 1
            pm = result.personality_map or {}
            traits = pm.get('traits') or {}
            changed = False
            for trait_name, data in traits.items():
                # Clear recommendations
                if isinstance(data, dict) and data.get('recommendations'):
                    data['recommendations'] = ''
                    changed = True

                # Replace fallback-style descriptions like "Черта личности: X" with just name
                desc = data.get('description') if isinstance(data, dict) else None
                if isinstance(desc, str) and desc.startswith('Черта личности: '):
                    data['description'] = trait_name
                    changed = True

            if changed:
                result.personality_map = pm
                result.save(update_fields=['personality_map'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Processed {total} results, updated {updated}'))



