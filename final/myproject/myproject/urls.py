from django.urls import path, include

urlpatterns = [
    path('api/', include('project_app.urls')),  # ✅ 우리 실제 앱
]
