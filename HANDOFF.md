# ⚡ МОТОР — AI-экосистема автосервиса
> Все 21 итерация выполнена. Последнее обновление: Итерация 21.

---

## 📦 Проект

| | |
|---|---|
| **Название** | МОТОР — AI-экосистема для автосервиса |
| **GitHub** | https://github.com/Viktor592/motor-app |
| **Ветка** | `main` |
| **Итераций** | 21 из 21 ✅ |
| **Автор** | Илья У. |

---

## 🗺️ Дорожная карта — все итерации выполнены ✅

| # | Итерация | Статус |
|---|----------|--------|
| 1  | Инициализация монорепо (backend / web / mobile) | ✅ |
| 2  | Auth: JWT + OTP (email / Telegram / console) | ✅ |
| 3  | Заказ-наряды: CRUD, статусы, PDF | ✅ |
| 4  | AI-агенты: Приёмщик → Диагност → Оценщик (Groq/Ollama) | ✅ |
| 5  | Онлайн-запись: слоты, виджет для сайта | ✅ |
| 6  | AI-чат, Socket.IO real-time | ✅ |
| 7  | СБП QR оплата (бесплатно) | ✅ |
| 8  | Telegram-бот (Telegraf) | ✅ |
| 9  | Аналитика: P&L, экспорт PDF/Excel | ✅ |
| 10 | Склад и запчасти (Exist.ru / Autodoc, авто-заказ) | ✅ |
| 11 | Финансы: кассовые смены, P&L, бюджет vs факт | ✅ |
| 12 | Мобильный мастер + Push-уведомления + Онлайн-запись | ✅ |
| 13 | Расширенная аналитика: KPI, рейтинг мастеров, динамика | ✅ |
| 14 | AI-диагностика v2: голос, фото, VIN-история, Снабженец | ✅ |
| 15 | Лояльность: баллы, рефералы, ТО-напоминания | ✅ |
| 16 | Интеграции: 1С:Предприятие, Оптим Гараж | ✅ |
| 17 | CI/CD: GitHub Actions, Docker, Nginx SSL, Grafana | ✅ |
| 18 | Мультитенантность SaaS: тенанты, тарифы, ЮКасса | ✅ |
| 19 | PWA + EAS Build: офлайн, установка, APK/IPA | ✅ |
| 20 | Финальная полировка: тема, i18n, onboarding-тур | ✅ |
| 21 | ЭДО, МЧД, КУДиР, авто-отчётность ФНС/СФР, Атол 54-ФЗ, AI-налоги | ✅ |

---

## 💰 Тарифы

| Тариф | Цена | Мастера | Заказов/мес | Что включено |
|-------|------|---------|-------------|--------------|
| 🎁 Trial | 0 ₽ (14 дней) | 1 | 50 | Базовые функции |
| 🚀 Старт | **25 000 ₽/мес** | 2 | 300 | AI-приёмщик, аналитика, PWA |
| ⚡ Профи | **35 000 ₽/мес** | 5 | 1000 | Все AI-агенты, склад, финансы, лояльность |
| 🏆 Бизнес | **45 000 ₽/мес** | 15 | 5000 | ЭДО, касса 54-ФЗ, 1С, Оптим Гараж |
| 💎 Корпорат | **55 000 ₽/мес** | ∞ | ∞ | White-label, API, SLA 99.9%, выделенный менеджер |

---

## 📁 Структура файлов

```
motor-app/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           ← typecheck + lint + tests + docker
│   │   ├── cd.yml           ← авто-деплой при push в main
│   │   ├── backup.yml       ← ночной бэкап БД в S3
│   │   └── eas-build.yml    ← сборка APK/IPA
│   └── SECRETS.md
│
├── backend/src/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── tenant.ts        ← SaaS: резолв тенанта
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   ├── booking.ts
│   │   ├── chat.ts / pipeline.ts / payment.ts
│   │   ├── admin.ts / analytics.ts / settings.ts
│   │   ├── export.ts / parts.ts / users.ts
│   │   ├── warehouse.ts     ← ит.10: склад
│   │   ├── finance.ts       ← ит.11: финансы
│   │   ├── diag.ts          ← ит.14: AI-диагностика
│   │   ├── loyalty.ts       ← ит.15: лояльность
│   │   ├── integration.ts   ← ит.16: 1С/Оптим Гараж
│   │   ├── saas.ts          ← ит.18: тенанты/биллинг
│   │   └── edo.ts           ← ит.21: ЭДО/ФНС/Атол
│   └── services/
│       ├── aiProvider.ts / notifications.ts / push.ts
│       ├── telegram.ts / payment.ts / scheduler.ts
│       ├── pdfExport.ts / metrics.ts
│       ├── suppliers.ts     ← ит.10: Exist/Autodoc
│       ├── onec.ts          ← ит.16: 1С
│       ├── optimgarage.ts   ← ит.16: Оптим Гараж
│       ├── diadoc.ts        ← ит.21: Диадок ЭДО
│       ├── atol.ts          ← ит.21: Атол 54-ФЗ
│       ├── docGenerator.ts  ← ит.21: счета/акты HTML
│       ├── mchd.ts          ← ит.21: МЧД
│       ├── autoReporting.ts ← ит.21: авто-отчётность
│       └── taxService.ts    ← ит.21: AI-налоговый агент
│
├── web/src/
│   ├── pages/
│   │   ├── HomePage / OrdersPage / BookingsPage
│   │   ├── WarehousePage    ← ит.10
│   │   ├── FinancePage      ← ит.11
│   │   ├── ReportPage       ← ит.13
│   │   ├── IntegrationPage  ← ит.16
│   │   ├── PlansPage        ← ит.18
│   │   ├── OnboardingNewPage← ит.18
│   │   ├── SettingsPage     ← ит.20: тема + i18n
│   │   └── EdoPage          ← ит.21: ЭДО/ФНС
│   ├── services/
│   │   ├── i18n.ts          ← ит.20: ru/kk/uk
│   │   └── theme.ts         ← ит.20: dark/light
│   └── public/
│       ├── manifest.webmanifest ← PWA
│       ├── sw.js                ← Service Worker
│       └── booking-widget.html  ← виджет записи
│
├── mobile/
│   ├── app.json / eas.json
│   ├── EAS_BUILD_GUIDE.md
│   └── src/screens/
│       └── master/
│           ├── MasterHomeScreen.tsx
│           └── MasterOrderScreen.tsx
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/datasources/
│
├── nginx/nginx.prod.conf
├── docker-compose.prod.yml
├── .env.production.example
├── scripts/deploy.sh
└── HANDOFF.md
```

---

## 🔑 Переменные окружения

Полный список: `.env.production.example`

```env
# Основные
DATABASE_URL=postgresql://motor:pass@localhost:5432/motor_db
JWT_ACCESS_SECRET=минимум_32_символа
JWT_REFRESH_SECRET=другие_32_символа

# AI
AI_PROVIDER=auto
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=    # для Vision (фото-диагностика)

# Уведомления
TELEGRAM_BOT_TOKEN=123:ABC...
VAPID_PUBLIC_KEY=BK...
VAPID_PRIVATE_KEY=...

# Оплата
SBP_PHONE=+79001234567
YUKASSA_SHOP_ID=...
YUKASSA_SECRET_KEY=...

# ЭДО и отчётность
KONTUR_API_KEY=        # Контур.Экстерн
ATOL_LOGIN=            # Атол Онлайн (54-ФЗ)
ATOL_PASSWORD=
ATOL_GROUP=
ATOL_INN=
ATOL_TAX_SYSTEM=usn_income
```

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/Viktor592/motor-app && cd motor-app
cp backend/.env.example backend/.env  # заполнить
cd backend && npm install && npx prisma migrate deploy && npm run dev
cd ../web && npm install && npm run dev
cd ../mobile && npm install && npx expo start
```

---

## 🏭 Production

```bash
./scripts/deploy.sh setup    # первый запуск + SSL
./scripts/deploy.sh update   # обновление
```

---

## 🏛️ Авто-отчётность в ФНС (МЧД)

1. `/edo` → Настройки → заполнить реквизиты + выбрать режим налогообложения
2. `/edo` → МЧД → создать + зарегистрировать через Диадок
3. Добавить `KONTUR_API_KEY` в `.env`
4. Scheduler сам следит за дедлайнами и отправляет отчёты

---

## 👤 Автор

**Илья У.**  
GitHub: https://github.com/Viktor592/motor-app

---

*Все 21 итерация завершена. ✅*
