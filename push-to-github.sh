#!/bin/bash
# Скрипт для первого пуша на GitHub
# Запустить: bash push-to-github.sh YOUR_TOKEN

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo "Использование: bash push-to-github.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

REPO="motor-app"
USER="Viktor592"

echo "Создаём репозиторий $REPO..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO\",\"description\":\"МОТОР — AI-экосистема автосервиса\",\"private\":true}" \
  https://api.github.com/user/repos | python3 -c "
import sys,json
d=json.load(sys.stdin)
url=d.get('html_url','')
if url: print('Репозиторий создан:', url)
else: print('Статус:', d.get('message','OK - может уже существует'))
"

echo "Настраиваем remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$TOKEN@github.com/$USER/$REPO.git"

echo "Пушим..."
git push -u origin main

echo "Готово! https://github.com/$USER/$REPO"
