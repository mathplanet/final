from rest_framework import serializers
from .models import User, Project, CustomizeReq, PendingUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'name', 'user_permission_code']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'


class CustomizeReqSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizeReq
        fields = '__all__'


class PendingUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingUser
        fields = [
            'id',
            'user_id',
            'name',
            'email',
            'role',
            'status',
            'registered_at',
            'approved_at',
            'approved_by',
            'rejected_reason',
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'name', 'user_permission_code', 'create_day', 'update_day']
