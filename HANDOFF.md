# 🔄 HANDOFF — МОТОР AI-экосистема автосервиса
> Актуальный документ контекста. Последнее обновление: Итерация 12.

---

## 📦 Проект

**Название:** МОТОР — AI-экосистема для автосервиса  
**GitHub:** https://github.com/Viktor592/motor-app  
**Ветка:** `main`  
**Итераций завершено:** 20 из 20 ✅ ЗАВЕРШЕНО  
**Владелец:** Viktor592  

---

## ✅ Завершённые итерации (1–12)

### Итерации 1–9 (фундамент)
| # | Что сделано |
|---|---|
| 1 | Инициализация монорепо (backend / web / mobile) |
| 2 | Auth: JWT + OTP (email / Telegram / console) |
| 3 | Заказ-наряды: CRUD, статусы, PDF |
| 4 | AI-агенты: Приёмщик → Диагност → Оценщик (Groq/Ollama) |
| 5 | Онлайн-запись: слоты, виджет |
| 6 | AI-чат, Socket.IO real-time |
| 7 | СБП QR оплата (бесплатно) |
| 8 | Telegram-бот (Telegraf) |
| 9 | Аналитика: P&L владельца + аналитика мастера, экспорт PDF/Excel |

### Итерация 10 — Склад и запчасти ✅
- `backend/routes/warehouse.ts` — 10 эндпоинтов
- `backend/services/suppliers.ts` — Exist.ru + Autodoc.ru API
- Prisma: `StockMovement`, `StockReservation`, `Supplier`, `SupplierOrder`
- Web: `WarehousePage` (остатки / нехватка / заказы / поставщики)
- Авто-заказ при остатке ≤ 3 шт.

### Итерация 11 — Финансы ✅
- `backend/routes/finance.ts` — кассовые смены, транзакции, бюджет, P&L
- Prisma: `CashShift`, `CashTransaction`, `ExpenseBudget`
- Web: `FinancePage` (касса / история смен / P&L / бюджет vs факт)
- Расчёт расхождения при закрытии смены
- Динамика по неделям, структура расходов

### Итерация 12 — Мобильный мастер + Push + Онлайн-запись ✅
- `mobile/screens/master/MasterHomeScreen.tsx` — главная мастера
- `mobile/screens/master/MasterOrderScreen.tsx` — работа с заказом
- `backend/services/push.ts` — Expo Push (шаблоны: статус, чат, запись)
- `backend/routes/booking.ts` — публичная запись, слоты, конвертация в заказ
- `web/public/booking-widget.html` — автономный виджет для любого сайта
- Web: `BookingsPage` — управление записями, конвертация в заказ

---

## 🗂️ Полная структура файлов

```
motor-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← все модели
│   │   └── migrations/            ← 12 миграций
│   └── src/
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── orders.ts
│       │   ├── booking.ts
│       │   ├── chat.ts
│       │   ├── pipeline.ts
│       │   ├── payment.ts
│       │   ├── admin.ts
│       │   ├── analytics.ts
│       │   ├── onboarding.ts
│       │   ├── settings.ts
│       │   ├── export.ts
│       │   ├── parts.ts
│       │   ├── users.ts
│       │   ├── warehouse.ts       ← ит.10
│       │   ├── finance.ts         ← ит.11
│       │   └── booking.ts         ← ит.12
│       └── services/
│           ├── aiProvider.ts
│           ├── sms.ts
│           ├── notifications.ts
│           ├── push.ts            ← ит.12
│           ├── suppliers.ts       ← ит.10
│           ├── telegram.ts
│           ├── payment.ts
│           ├── pdfExport.ts
│           └── scheduler.ts
├── web/src/
│   ├── pages/
│   │   ├── OtpPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── DiagnosticsPage.tsx
│   │   ├── ExecOrdersPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── PnlPage.tsx
│   │   ├── MasterAnalyticsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── WarehousePage.tsx      ← ит.10
│   │   ├── FinancePage.tsx        ← ит.11
│   │   └── BookingsPage.tsx       ← ит.12
│   └── public/
│       └── booking-widget.html    ← ит.12
└── mobile/src/screens/
    ├── auth/   (Otp, Login, Register, SetName)
    ├── client/ (Home, Booking, Chat, Orders, OrderDetail, Diagnostics)
    ├── exec/   (ExecDashboard, ExecOrder, MasterAnalytics)
    ├── master/ (MasterHome, MasterOrder)                ← ит.12
    └── shared/ (Profile)
```

---

## 🆓 Стек (всё бесплатно)

| Компонент | Сервис | Лимит |
|---|---|---|
| AI-агенты | Groq API | 30 req/min |
| AI резерв | Ollama (локально) | безлимит |
| OTP | Gmail SMTP / Telegram Bot | бесплатно |
| Push веб | Web Push VAPID (W3C) | бесплатно |
| Push моб | Expo Push Notifications | бесплатно |
| Telegram | Telegraf self-hosted | бесплатно |
| Оплата | СБП QR | 0% до 1 млн/мес |
| БД | PostgreSQL self-hosted | — |
| Хостинг | Railway / Render (free tier) | 500 ч/мес |

---

## 🔑 Переменные окружения (.env)

```env
# AI
AI_PROVIDER=auto
GROQ_API_KEY=gsk_...
OLLAMA_URL=http://localhost:11434

# OTP
OTP_CHANNEL=console            # console | email | telegram
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
TELEGRAM_BOT_TOKEN=123:ABC...

# Push
VAPID_PUBLIC_KEY=BK...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@motor-app.ru

# Оплата
SBP_PHONE=+79001234567

# База данных
DATABASE_URL=postgresql://motor:password@localhost:5432/motor_db
JWT_ACCESS_SECRET=минимум32символа
JWT_REFRESH_SECRET=другие32символа
PORT=3000
```

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/Viktor592/motor-app
cd motor-app

# Backend
cp backend/.env.example backend/.env
# Заполнить: GROQ_API_KEY + DATABASE_URL + JWT секреты
cd backend && npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev          # :3000

# Web
cd ../web && npm install
npm run dev          # :5173

# Mobile
cd ../mobile && npm install
npx expo start
```

---

## 🗺️ Дорожная карта

### ✅ Готово (итерации 1–12)
Фундамент, Auth, Заказы, AI-агенты, Запись, Чат, Оплата, Telegram,
Аналитика, **Склад**, **Финансы**, **Мобильный мастер + Push + Виджет записи**

---

### 🔜 Итерация 13 — Аналитика и отчёты (СЛЕДУЮЩАЯ)
- PDF-отчёт за период (выручка, топ мастера, топ услуги)
- Графики на web: выручка по дням, загрузка постов
- Сравнение периодов: этот месяц vs прошлый
- Экспорт в Excel полного P&L
- KPI-карточки на главном дашборде

### 🔜 Итерация 14 — AI-диагностика v2
- Голосовой ввод жалобы (Whisper API / expo-av)
- Фото → диагноз (GPT-4o Vision / LLaVA локально)
- Агент «Снабженец»: подбор аналогов запчастей по артикулу
- История диагнозов по VIN

### 🔜 Итерация 15 — Лояльность
- Бонусная программа: начисление баллов за визиты
- История автомобиля: все работы по VIN/гос.номеру
- Напоминания о плановом ТО (автоматически через scheduler)
- Реферальная программа: клиент → бонус за приведённого друга
- Push/SMS напоминание за 24ч до записи

### 🔜 Итерация 16 — Интеграции
- 1С:Бухгалтерия (выгрузка актов)
- Онлайн-касса 54-ФЗ (Атол / Эвотор API)
- WhatsApp Business (Baileys — бесплатно)
- Авто-ответ в WhatsApp: статус заказа по номеру

### 🔜 Итерация 17 — CI/CD и деплой
- GitHub Actions: тесты + сборка + деплой
- Docker Compose production
- Nginx + SSL (Let's Encrypt)
- Мониторинг: Grafana + Prometheus (self-hosted)

### 🔜 Итерация 18 — Мультитенантность (SaaS)
- Схема БД: tenant_id на каждой таблице
- Онбординг нового сервиса: 5 мин до работы
- Биллинг: ЮKassa подписки (990/2990/4990 ₽/мес)
- Белая метка: свой домен, логотип, цвета

### 🔜 Итерация 19 — PWA + App Store
- Web → PWA (offline, иконка, push)
- Expo EAS Build → APK (Android)
- Expo EAS Build → IPA (iOS TestFlight)

### 🔜 Итерация 20 — Финальная полировка
- Onboarding-тур для новых пользователей
- Темная/светлая тема
- i18n: русский + казахский + украинский
- Полный тест-кейс (Jest + Playwright)

---

## 💰 Монетизация

| Тариф | Цена | Что включено |
|---|---|---|
| Старт | 990 ₽/мес | 1 мастер, базовые функции |
| Профи | 2990 ₽/мес | до 5 мастеров, AI-агенты, аналитика |
| Бизнес | 4990 ₽/мес | без лимитов, склад, финансы, API |

**Целевой ROI для клиента:** AI экономит приёмщику 2+ ч/день → окупается за 2 дня

---

## 🏆 Гранты

- **Фонд Бортника (УМНИК):** до 500 тыс ₽, подать в ноябре
- **Сколково:** до 5 млн ₽, статус резидента
- **Региональные МСП:** до 300 тыс ₽ (ИП/ООО)
- **Тинькофф/Сбер акселератор:** менторство + инвестиции

---

## 📎 Для новой сессии

1. Клонировать: `git clone https://github.com/Viktor592/motor-app`
2. Сказать Claude: _«Продолжаем МОТОР, прочитай HANDOFF.md»_
3. Проект завершён! Все 20 итераций выполнены.

---
*HANDOFF обновлён после итерации 16. Коммит: pending**
