# ⚡ МОТОР — AI-экосистема автосервиса
> Проект завершён. Все 20 итераций выполнены. Последнее обновление: Итерация 20.

---

## 📦 Проект

| | |
|---|---|
| **Название** | МОТОР — AI-экосистема для автосервиса |
| **GitHub** | https://github.com/Viktor592/motor-app |
| **Ветка** | `main` |
| **Статус** | ✅ Все 20 итераций завершены |
| **Владелец** | Viktor592 |
| **Автор** | Илья У. |

---

## 🗺️ Дорожная карта — все итерации выполнены

| # | Итерация | Статус |
|---|---|---|
| 1 | Инициализация монорепо (backend / web / mobile) | ✅ |
| 2 | Auth: JWT + OTP (email / Telegram / console) | ✅ |
| 3 | Заказ-наряды: CRUD, статусы, PDF | ✅ |
| 4 | AI-агенты: Приёмщик → Диагност → Оценщик (Groq/Ollama) | ✅ |
| 5 | Онлайн-запись: слоты, виджет для сайта | ✅ |
| 6 | AI-чат, Socket.IO real-time | ✅ |
| 7 | СБП QR оплата (бесплатно) | ✅ |
| 8 | Telegram-бот (Telegraf) | ✅ |
| 9 | Аналитика: P&L владельца + аналитика мастера, экспорт PDF/Excel | ✅ |
| 10 | Склад и запчасти (Exist.ru / Autodoc, авто-заказ) | ✅ |
| 11 | Финансы: кассовые смены, P&L, бюджет vs факт | ✅ |
| 12 | Мобильный мастер + Push-уведомления + Онлайн-запись | ✅ |
| 13 | Расширенная аналитика: KPI, рейтинг мастеров, динамика | ✅ |
| 14 | AI-диагностика v2: голос, фото, подбор аналогов, история VIN | ✅ |
| 15 | Лояльность: баллы, рефералы, ТО-напоминания | ✅ |
| 16 | Интеграции: 1С:Предприятие, Оптим Гараж | ✅ |
| 17 | CI/CD: GitHub Actions, Docker, Nginx SSL, Grafana + Prometheus | ✅ |
| 18 | Мультитенантность SaaS: тенанты, тарифы, ЮКасса | ✅ |
| 19 | PWA + EAS Build: офлайн, установка, APK/IPA | ✅ |
| 20 | Финальная полировка: тема, i18n, onboarding-тур | ✅ |
| 21 | ЭДО, МЧД, КУДиР, авто-отчётность в ФНС/СФР, Атол 54-ФЗ, AI-налоговый агент | ✅ |

---

## 📁 Полная структура файлов

```
motor-app/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           ← typecheck + lint + tests + docker build
│   │   ├── cd.yml           ← авто-деплой при push в main
│   │   ├── backup.yml       ← ночной бэкап БД в S3 (02:00)
│   │   └── eas-build.yml    ← сборка APK/IPA через EAS
│   └── SECRETS.md           ← инструкция по настройке секретов
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    ← все модели (20+ моделей)
│   │   └── migrations/      ← 13 миграций
│   └── src/
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── errorHandler.ts
│       │   └── tenant.ts    ← резолв тенанта по поддомену
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── orders.ts
│       │   ├── booking.ts
│       │   ├── chat.ts
│       │   ├── pipeline.ts
│       │   ├── payment.ts
│       │   ├── admin.ts
│       │   ├── analytics.ts ← расширен в ит.13
│       │   ├── settings.ts
│       │   ├── export.ts
│       │   ├── parts.ts
│       │   ├── users.ts
│       │   ├── warehouse.ts ← ит.10
│       │   ├── finance.ts   ← ит.11
│       │   ├── diag.ts      ← ит.14: голос/фото/VIN
│       │   ├── loyalty.ts   ← ит.15: баллы/рефералы/ТО
│       │   ├── integration.ts ← ит.16: 1С/Оптим Гараж
│       │   └── saas.ts      ← ит.18: тенанты/биллинг
│       └── services/
│           ├── aiProvider.ts
│           ├── notifications.ts
│           ├── push.ts       ← ит.12: Expo Push шаблоны
│           ├── suppliers.ts  ← ит.10: Exist/Autodoc API
│           ├── onec.ts       ← ит.16: 1С HTTP-сервис
│           ├── optimgarage.ts← ит.16: Оптим Гараж API
│           ├── metrics.ts    ← ит.17: Prometheus метрики
│           ├── telegram.ts
│           ├── payment.ts
│           ├── pdfExport.ts
│           └── scheduler.ts
│
├── web/src/
│   ├── components/
│   │   ├── PWABanner.tsx         ← ит.19: установка/офлайн/обновление
│   │   └── OnboardingTour.tsx    ← ит.20: 7-шаговый тур
│   ├── hooks/
│   │   └── usePWA.ts             ← ит.19
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── OrdersPage.tsx / OrderDetailPage.tsx
│   │   ├── BookingsPage.tsx      ← ит.12
│   │   ├── WarehousePage.tsx     ← ит.10
│   │   ├── FinancePage.tsx       ← ит.11
│   │   ├── ReportPage.tsx        ← ит.13
│   │   ├── IntegrationPage.tsx   ← ит.16
│   │   ├── PlansPage.tsx         ← ит.18
│   │   ├── OnboardingNewPage.tsx ← ит.18: регистрация SaaS
│   │   └── SettingsPage.tsx      ← ит.20: тема + i18n
│   ├── services/
│   │   ├── api.ts
│   │   ├── i18n.ts               ← ит.20: ru/kk/uk
│   │   └── theme.ts              ← ит.20: dark/light/system
│   └── public/
│       ├── manifest.webmanifest  ← ит.19: PWA манифест
│       ├── sw.js                 ← ит.19: Service Worker
│       ├── offline.html          ← ит.19
│       └── booking-widget.html   ← ит.12: виджет для сайта
│
├── mobile/
│   ├── app.json                  ← ит.19: Expo config
│   ├── eas.json                  ← ит.19: build profiles
│   ├── EAS_BUILD_GUIDE.md        ← инструкция сборки
│   └── src/screens/
│       ├── auth/
│       ├── client/
│       ├── exec/
│       ├── master/
│       │   ├── MasterHomeScreen.tsx   ← ит.12
│       │   └── MasterOrderScreen.tsx  ← ит.12
│       └── shared/
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/datasources/
│
├── nginx/nginx.prod.conf          ← ит.17: SSL + gzip + rate limit
├── docker-compose.yml             ← dev
├── docker-compose.prod.yml        ← ит.17: prod с Redis/Certbot/Grafana
├── .env.production.example        ← все переменные с описаниями
├── scripts/deploy.sh              ← ит.17: setup/update/backup
└── HANDOFF.md                     ← этот файл
```

---

## 🆓 Стек (всё бесплатно)

| Компонент | Сервис | Лимит |
|---|---|---|
| AI-агенты | Groq API | 30 req/min |
| AI резерв | Ollama (локально) | безлимит |
| AI Vision | OpenRouter (GPT-4o mini) | pay-as-you-go |
| OTP | Gmail SMTP / Telegram Bot | бесплатно |
| Push мобилка | Expo Push Notifications | бесплатно |
| Push браузер | Web Push VAPID (W3C) | бесплатно |
| Уведомления | Telegram Bot | бесплатно |
| Оплата | СБП QR | 0% до 1 млн/мес |
| Биллинг SaaS | ЮКасса | от 2.8% |
| БД | PostgreSQL self-hosted | — |
| Кэш | Redis | self-hosted |
| Хостинг | VPS / Railway / Render | от 0 ₽ |
| SSL | Let's Encrypt | бесплатно |
| Мониторинг | Grafana + Prometheus | self-hosted |
| EAS Build | Expo | 30 сборок/мес |

---

## 🔑 Переменные окружения

Полный список с описаниями: `.env.production.example`

```env
DATABASE_URL=postgresql://motor:password@localhost:5432/motor_db
JWT_ACCESS_SECRET=минимум_32_символа
JWT_REFRESH_SECRET=другие_32_символа
AI_PROVIDER=auto            # auto | groq | ollama
GROQ_API_KEY=gsk_...
TELEGRAM_BOT_TOKEN=123:ABC...
SBP_PHONE=+79001234567
VAPID_PUBLIC_KEY=BK...
VAPID_PRIVATE_KEY=...
```

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/Viktor592/motor-app
cd motor-app

# Backend
cp backend/.env.example backend/.env
cd backend && npm install
npx prisma migrate deploy && npx prisma db seed
npm run dev          # :3000

# Web
cd ../web && npm install
npm run dev          # :5173

# Mobile
cd ../mobile && npm install
npx expo start
```

---

## 🏭 Production деплой

```bash
# На сервере (Ubuntu 22+)
curl -fsSL https://raw.githubusercontent.com/Viktor592/motor-app/main/scripts/deploy.sh | bash -s setup
```

Или вручную:
```bash
git clone https://github.com/Viktor592/motor-app /opt/motor-app
cd /opt/motor-app
cp .env.production.example .env && nano .env
./scripts/deploy.sh setup    # первый запуск + SSL
./scripts/deploy.sh update   # обновление
./scripts/deploy.sh backup   # ручной бэкап
```

---

## 📱 Сборка APK/IPA

```bash
cd mobile
npm install -g eas-cli && eas login
eas build --platform android --profile preview    # APK (тест)
eas build --platform android --profile production # AAB (Google Play)
eas build --platform ios     --profile production # IPA (App Store)
```

Подробнее: `mobile/EAS_BUILD_GUIDE.md`

---

## 💰 Монетизация

| Тариф | Цена | Мастера | Заказов/мес |
|---|---|---|---|
| Trial | 0 ₽ (14 дней) | 1 | 50 |
| Старт | 990 ₽/мес | 1 | 200 |
| Профи | 2990 ₽/мес | 5 | 1000 |
| Бизнес | 4990 ₽/мес | ∞ | ∞ |

**ROI для клиента:** AI экономит приёмщику 2+ ч/день → окупается за 2 дня

---

## 🏆 Гранты

| Программа | Сумма | Срок |
|---|---|---|
| Фонд Бортника (УМНИК) | до 500 тыс ₽ | ноябрь |
| Сколково | до 5 млн ₽ | постоянно |
| Региональные МСП | до 300 тыс ₽ | постоянно |
| Тинькофф / Сбер акселератор | инвестиции + менторство | конкурс |

---

## 👤 Авторство

**Автор:** Илья У.  
**GitHub:** https://github.com/Viktor592/motor-app  
**Стек:** Node.js · TypeScript · React · React Native · PostgreSQL · Prisma · Docker  
**Период разработки:** 20 итераций, ~12 000 строк кода

---

*HANDOFF обновлён после итерации 20. Все работы завершены. ✅*
