#!/bin/bash
# ============================================
# React 개발 서버 백그라운드 실행
# (VS Code 닫아도 종료되지 않음)
# ============================================

set -a;
source .env;
set +a

cd /home/ubuntu/deploy/final/my-ui

# nohup + disown으로 완전 분리 실행
nohup npm start > frontend.log 2>&1 &
disown

echo "✅ React 개발 서버가 백그라운드에서 실행 중입니다."
echo "로그: /home/ubuntu/deploy/final/my-ui/frontend.log"
