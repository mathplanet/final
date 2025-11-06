#!/bin/bash
# ============================================
# Django 서버 백그라운드 실행 스크립트 (안정 버전)
# ============================================

cd /home/ubuntu/deploy/final/myproject

# ✅ .env 파일 로드 (이 줄 추가)
set -a
source .env
set +a


source /home/ubuntu/deploy/final/myproject/venv/bin/activate

# 이미 실행 중인지 확인
RUNNING=$(ps aux | grep "manage.py runserver" | grep -v grep)

if [ -n "$RUNNING" ]; then
    echo "⚠️ Django 서버가 이미 실행 중입니다."
    exit 0
fi

# nohup으로 백그라운드 실행 (가상환경 전용)
nohup /home/ubuntu/deploy/final/myproject/venv/bin/python manage.py runserver 0.0.0.0:8000 --noreload > backend.log 2>&1 &
disown

echo "✅ Django 서버가 백그라운드에서 실행 중입니다."
echo "로그 파일: /home/ubuntu/deploy/final/myproject/backend.log"
