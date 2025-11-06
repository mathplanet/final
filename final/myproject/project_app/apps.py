from django.apps import AppConfig
from django.core.files.storage import default_storage


class ProjectAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'project_app'

    def ready(self):
        from django.conf import settings
        print("Storage backend (on startup):", default_storage.__class__.__name__)
