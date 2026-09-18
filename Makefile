.PHONY: dev-backend dev-saas dev-client-web dev-staff-web dev-admin dev-all \
	up down restart logs logs-all \
	db-migrate db-generate db-seed db-studio db-reset \
	install build build-backend build-web \
	build-saas build-client-web build-staff-web build-admin \
	clean mobile-client mobile-staff android-client android-staff ios-client ios-staff

# ── Разработка ──────────────────────────────────────────
dev-backend:
	cd backend && npm run dev

dev-saas:
	cd apps/saas && npm run dev

dev-client-web:
	cd apps/client-web && npm run dev

dev-staff-web:
	cd apps/staff-web && npm run dev

dev-admin:
	cd apps/admin && npm run dev

dev-all:
	@echo "Запуск всего стека в разработке..."
	$(MAKE) -j4 dev-backend dev-client-web dev-staff-web dev-admin

# ── Docker ──────────────────────────────────────────────
up:
	docker compose up -d --build
	@echo "\n✅ Стек запущен:"
	@echo "   SaaS:    http://localhost:80"
	@echo "   Client:  http://localhost:3001"
	@echo "   Staff:   http://localhost:3002"
	@echo "   Admin:   http://localhost:3003"
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
	cd apps/saas && npm install
	cd apps/client-web && npm install
	cd apps/staff-web && npm install
	cd apps/admin && npm install
	cd apps/client-mobile && npm install
	cd apps/staff-mobile && npm install

# ── Сборка ─────────────────────────────────────────────
build-backend:
	cd backend && npm run build

build-saas:
	cd apps/saas && npm run build

build-client-web:
	cd apps/client-web && npm run build

build-staff-web:
	cd apps/staff-web && npm run build

build-admin:
	cd apps/admin && npm run build

build-web:
	$(MAKE) build-saas build-client-web build-staff-web build-admin

build:
	$(MAKE) build-backend build-web

# ── Очистка ─────────────────────────────────────────────
clean:
	docker compose down -v
	rm -rf backend/dist apps/*/dist

# ── Мобильное (Expo) ────────────────────────────────────
mobile-client:
	cd apps/client-mobile && npm start

mobile-staff:
	cd apps/staff-mobile && npm start

android-client:
	cd apps/client-mobile && npm run android

android-staff:
	cd apps/staff-mobile && npm run android

ios-client:
	cd apps/client-mobile && npm run ios

ios-staff:
	cd apps/staff-mobile && npm run ios
