#!/bin/bash
# ══════════════════════════════════════════════════════
# МОТОР — Скрипт деплоя на сервер
# Использование:
#   Первый запуск: ./scripts/deploy.sh setup
#   Обновление:    ./scripts/deploy.sh update
# ══════════════════════════════════════════════════════
set -e

REPO="https://github.com/Viktor592/motor-app"
APP_DIR="/opt/motor-app"
COMPOSE="docker compose -f docker-compose.prod.yml"

# Цвета
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
step() { echo -e "\n${YELLOW}==> $1${NC}"; }

# ── Первичная настройка сервера ───────────────────────────────
setup() {
  step "Обновление системы"
  apt-get update -qq && apt-get upgrade -y -qq

  step "Установка Docker"
  if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    ok "Docker установлен"
  else
    ok "Docker уже установлен: $(docker --version)"
  fi

  step "Установка docker compose plugin"
  apt-get install -y docker-compose-plugin -qq

  step "Клонирование репозитория"
  if [ ! -d "$APP_DIR" ]; then
    git clone "$REPO" "$APP_DIR"
    ok "Репозиторий клонирован в $APP_DIR"
  else
    warn "Директория $APP_DIR уже существует, пропускаю клонирование"
  fi

  step "Создание .env из примера"
  if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
    warn "Создан .env файл. ЗАПОЛНИ ЕГО ПЕРЕД ПРОДОЛЖЕНИЕМ!"
    warn "nano $APP_DIR/.env"
    exit 0
  else
    ok ".env уже существует"
  fi

  step "Получение SSL-сертификата"
  cd "$APP_DIR"
  # Сначала запускаем nginx без SSL для ACME challenge
  $COMPOSE up -d nginx
  sleep 3
  $COMPOSE --profile certbot run --rm certbot
  ok "SSL-сертификат получен"

  step "Первый запуск"
  $COMPOSE pull
  $COMPOSE up -d
  sleep 10

  step "Применение миграций"
  $COMPOSE run --rm backend npx prisma migrate deploy
  $COMPOSE run --rm backend npx prisma db seed || true

  ok "Первичная настройка завершена!"
  echo ""
  echo "Сервис доступен: https://$(grep DOMAIN $APP_DIR/.env | cut -d= -f2)"
}

# ── Обновление ────────────────────────────────────────────────
update() {
  step "Переход в директорию проекта"
  cd "$APP_DIR" || err "Директория $APP_DIR не найдена. Запусти сначала: ./scripts/deploy.sh setup"

  step "Получение последних изменений"
  git pull origin main

  step "Скачивание новых образов"
  $COMPOSE pull backend web

  step "Применение миграций"
  $COMPOSE run --rm backend npx prisma migrate deploy

  step "Перезапуск сервисов"
  $COMPOSE up -d --no-deps backend web nginx

  step "Очистка старых образов"
  docker image prune -f

  step "Health check"
  sleep 8
  if curl -sf http://localhost/health > /dev/null; then
    ok "Сервис работает ✅"
  else
    err "Health check не прошёл!"
  fi

  ok "Обновление завершено!"
}

# ── Статус ────────────────────────────────────────────────────
status() {
  cd "$APP_DIR"
  $COMPOSE ps
}

# ── Логи ──────────────────────────────────────────────────────
logs() {
  cd "$APP_DIR"
  $COMPOSE logs -f --tail=100 "${2:-backend}"
}

# ── Бэкап вручную ─────────────────────────────────────────────
backup() {
  step "Создание резервной копии БД"
  DATE=$(date +%Y-%m-%d_%H-%M)
  FILE="/tmp/motor_backup_${DATE}.sql.gz"
  docker exec motor_postgres pg_dump -U motor motor_db | gzip > "$FILE"
  ok "Бэкап создан: $FILE ($(du -sh $FILE | cut -f1))"
}

# ── Роутер команд ─────────────────────────────────────────────
case "${1:-help}" in
  setup)  setup  ;;
  update) update ;;
  status) status ;;
  logs)   logs   ;;
  backup) backup ;;
  *)
    echo "Использование: $0 {setup|update|status|logs|backup}"
    echo ""
    echo "  setup   — первичная настройка сервера"
    echo "  update  — обновление до последней версии"
    echo "  status  — статус контейнеров"
    echo "  logs    — логи (по умолчанию: backend)"
    echo "  backup  — ручной бэкап БД"
    ;;
esac
