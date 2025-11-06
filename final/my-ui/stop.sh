#!/bin/bash
# ============================================
# React 개발 서버 중지 스크립트
# ============================================

PID=$(ps aux | grep "react-scripts start" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "⚠️  React 서버가 실행 중이지 않습니다."
else
    kill -9 $PID
    echo "🛑 React 서버(PID: $PID)를 종료했습니다."
fi


pkill -f "react-scripts start"