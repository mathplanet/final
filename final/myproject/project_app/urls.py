# project_app/urls.py
from django.urls import path
from .views import (
    register,
    login,
    create_project,
    list_projects,
    list_project_ai_images,
    update_project_status,
    refine_project_image,
    ProjectStatsView,
    PendingUserListView,
    PendingUserApproveView,
    PendingUserRejectView,
    PendingUserDeleteView,
    AdminUserListView,
    AdminUserDeleteView,
)

urlpatterns = [
    # ✅ 회원가입 & 로그인
    path('register/', register, name='register'),
    path('login/', login, name='login'),

    # ✅ 프로젝트 관련
    path('projects/create/', create_project, name='project-create'),
    path('projects/<str:user_id>/', list_projects, name='project-list'),
    path('projects/<str:project_id>/update/', update_project_status, name='project-update'),
    path('projects/<str:project_id>/ai-images/', list_project_ai_images, name='project-ai-images'),
    path('projects/<str:project_id>/ai-images/<int:image_id>/refine/', refine_project_image, name='project-ai-image-refine'),

    # ✅ 통계
    path('projects/<str:user_id>/stats/', ProjectStatsView.as_view(), name='project-stats'),

    # ✅ 관리자 - 가입 승인
    path('admin/pending-users/', PendingUserListView.as_view(), name='admin-pending-users'),
    path('admin/pending-users/<int:pending_id>/approve/', PendingUserApproveView.as_view(), name='admin-pending-approve'),
    path('admin/pending-users/<int:pending_id>/reject/', PendingUserRejectView.as_view(), name='admin-pending-reject'),
    path('admin/pending-users/<int:pending_id>/', PendingUserDeleteView.as_view(), name='admin-pending-delete'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<str:user_id>/', AdminUserDeleteView.as_view(), name='admin-user-delete'),
]
