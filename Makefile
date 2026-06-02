.PHONY: dev build seed up down logs clean

# ── Разработка ──────────────────────────────────────────
dev-backend:
	cd backend && npm run dev

dev-web:
	cd web && npm run dev

dev-all:
	@echo "Запуск всего стека в разработке..."
	$(MAKE) -j3 dev-backend dev-web

# ── Docker ──────────────────────────────────────────────
up:
	docker compose up -d --build
	@echo "\n✅ Стек запущен:"
	@echo "   Web:     http://localhost:5173"
	@echo "   API:     http://localhost:3000"
	@echo "   Health:  http://localhost:3000/health\n"

down:
	docker compose down

restart:
	docker compose restart backend

logs:
	docker compose logs -f backend

logs-all:
	docker compose logs -f

# ── База данных ─────────────────────────────────────────
db-migrate:
	cd backend && npx prisma migrate dev

db-generate:
	cd backend && npx prisma generate

db-seed:
	cd backend && npm run db:seed

db-studio:
	cd backend && npx prisma studio

db-reset:
	cd backend && npx prisma migrate reset --force && npm run db:seed

# ── Установка зависимостей ──────────────────────────────
install:
	cd backend && npm install
	cd web && npm install
	cd mobile && npm install

# ── Сборка ─────────────────────────────────────────────
build-backend:
	cd backend && npm run build

build-web:
	cd web && npm run build

build:
	$(MAKE) build-backend build-web

# ── Очистка ─────────────────────────────────────────────
clean:
	docker compose down -v
	rm -rf backend/dist web/dist

# ── Мобильное ───────────────────────────────────────────
android:
	cd mobile && npx react-native run-android

ios:
	cd mobile && npx react-native run-ios

mobile-start:
	cd mobile && npx react-native start --reset-cache
