#!/bin/bash
# ============================
# Django 서버 중지 스크립트
# ============================

PID=$(ps aux | grep "manage.py runserver" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "⚠️  Django 서버가 실행 중이지 않습니다."
else
    kill -9 $PID
    echo "🛑 Django 서버(PID: $PID)를 종료했습니다."
fi
