# 🔄 ПЕРЕДАЧА КОНТЕКСТА — МОТОР AI-экосистема
> Документ для продолжения разработки в новой сессии Claude

---

## 📦 Проект

**Название:** МОТОР — AI-экосистема автосервиса  
**GitHub:** https://github.com/Viktor592/motor-app (приватный ✅ запушен)
**Последний коммит:** `e3f4e76`  
**Архив:** motor-app-v7.zip (последняя версия)  
**Итерация:** 9 из 14 завершена

---

## 🗂️ Что уже сделано (итерации 1–9)

### Backend (Node.js + Express + TypeScript + Prisma)
**Routes:**
- `auth.ts` — JWT + OTP (email/telegram/console)
- `orders.ts` — заказ-наряды, смена статусов
- `booking.ts` — онлайн-запись, слоты
- `chat.ts` — AI-чат с агентом «Приёмщик»
- `pipeline.ts` — AI-цепочка: Приёмщик→Диагност→Оценщик
- `payment.ts` — СБП QR оплата (бесплатно)
- `admin.ts` — статистика, наценки, пользователи
- `analytics.ts` — P&L владельца + аналитика мастера
- `onboarding.ts` — визард первого запуска
- `settings.ts` — настройки сервиса, посты, часы
- `export.ts` — PDF заказа + Excel клиентов/заказов
- `parts.ts` — запчасти, правила ценообразования
- `users.ts` — профиль, автомобили CRUD

**Services:**
- `aiProvider.ts` — Groq→Ollama→OpenRouter→Anthropic (авто)
- `sms.ts` — OTP: Gmail/Telegram/console (бесплатно)
- `notifications.ts` — Web Push VAPID + Expo Push (без Firebase)
- `telegram.ts` — Telegraf бот: /start, /orders, /status
- `payment.ts` — СБП QR через qrserver.com
- `pdfExport.ts` — PDFKit генерация заказ-наряда
- `scheduler.ts` — ежедневный отчёт в 21:00

**Agents:**
- `receptionist.ts` — парсит жалобу → JSON
- `diagnostician.ts` — гипотезы + OEM детали
- `estimator.ts` — смета с наценками по категориям

### Web (React 18 + Vite + TypeScript)
**Pages (15+):**
- `OtpPage` — вход по SMS/email коду
- `LoginPage` / `RegisterPage` — пароль (персонал)
- `HomePage` — дашборд клиента
- `BookingPage` — запись к специалисту
- `OrdersPage` — список с поиском и фильтрами
- `OrderDetailPage` — детали + PDF скачать
- `ChatPage` — AI-чат с агентом
- `DiagnosticsPage` — пайплайн live + оплата СБП
- `ExecOrdersPage` — канбан для персонала
- `AdminPage` — статистика, наценки, пользователи
- `PnlPage` — P&L дашборд владельца
- `MasterAnalyticsPage` — аналитика мастера
- `ProfilePage` — профиль + автомобили
- `SettingsPage` — настройки сервиса, экспорт
- `OnboardingPage` — 5-шаговый визард
- `DiagnosticsPage` — AI pipeline + оплата

**Layouts:**
- `AppLayout` — сайдбар, роль-зависимая навигация
- `AuthLayout` — страницы входа

### Mobile (React Native 0.74 CLI)
**Screens:**
- Auth: `OtpScreen`, `LoginScreen`, `RegisterScreen`, `SetNameScreen`
- Client: `HomeScreen`, `BookingScreen`, `ChatScreen`, `OrdersListScreen`, `OrderDetailScreen`, `DiagnosticsScreen`
- Exec: `ExecDashboardScreen`, `ExecOrderScreen`, `MasterAnalyticsScreen`
- Shared: `ProfileScreen`

**Hooks:** `usePushToken`, `useSocketEvents`

---

## 🆓 Стек (всё бесплатно)

| Компонент | Сервис |
|---|---|
| AI-агенты | Groq API (30 req/min) / Ollama (локально) |
| OTP | Gmail SMTP / Telegram Bot |
| Push веб | Web Push VAPID (стандарт W3C) |
| Push моб | Expo Push Notifications |
| Telegram | Telegraf (self-hosted) |
| Оплата | СБП QR (0% до 1 млн/мес) |
| БД | PostgreSQL self-hosted |

---

## 🔑 Переменные окружения (.env)

```env
# AI (выбрать один)
AI_PROVIDER=auto
GROQ_API_KEY=gsk_...          # console.groq.com — бесплатно
OLLAMA_URL=http://localhost:11434

# OTP
OTP_CHANNEL=console           # console | email | telegram
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
TELEGRAM_BOT_TOKEN=123:ABC...

# Push
VAPID_PUBLIC_KEY=BK...
VAPID_PRIVATE_KEY=...

# Оплата СБП
SBP_PHONE=+79001234567

# БД
DATABASE_URL=postgresql://motor:password@localhost:5432/motor_db
JWT_ACCESS_SECRET=32+символа
JWT_REFRESH_SECRET=другие32+символа
```

---

## 🚀 Быстрый старт

```bash
# Распаковать motor-app-v7.zip
unzip motor-app-v7.zip && cd motor-app

# Настроить
cp backend/.env.example backend/.env
# Заполнить .env минимум: GROQ_API_KEY + JWT секреты

# Запустить
make up           # Docker: Postgres + Redis + API + Web
make db-migrate
make db-seed

# http://localhost:5173
# Логин: +79001234567 / test1234
```

---

## 📋 GitHub — статус

**Репозиторий:** ✅ https://github.com/Viktor592/motor-app  
**Статус:** ✅ Репо создан и запушен

**Что есть на GitHub:**
- 4 коммита в `main`
- 7 Issues с дорожной картой (итерации 10-14 + CI/CD + PWA)
- 4 Milestones (v1.0 → v2.0)
- Labels: backend, mobile, web, ai, integration, devops
- Topics: react-native, nodejs, ai, auto-service, groq-api, telegram-bot

**Для продолжения в новой сессии:**
```bash
git clone https://github.com/Viktor592/motor-app
cd motor-app
# Или просто использовать motor-app-final.zip
```

---

## 🗺️ Следующие итерации

### Итерация 10 — Склад и запчасти
- Учёт остатков на складе
- Резервирование деталей под заказ
- Интеграция с поставщиками (REST API Exist, Autodoc)
- Авто-заказ при нехватке

### Итерация 11 — Финансы
- Кассовая смена (открыть/закрыть)
- Учёт наличных и безнала
- Расходы: зарплата, аренда, запчасти
- Полный P&L с расходами

### Итерация 12 — Лояльность
- Бонусная программа (баллы)
- История автомобиля
- Напоминания о плановом ТО
- Реферальная программа

### Итерация 13 — Интеграции
- 1С:Бухгалтерия
- Онлайн-касса 54-ФЗ
- WhatsApp Business (Baileys)

### Итерация 14 — AI расширение
- Агент «Снабженец»
- Компьютерное зрение (фото → диагноз)
- Голосовой ввод жалобы

---

## 💬 Контекст разговора

**Владелец:** Viktor592 (GitHub)  
**Цель:** Коммерческий SaaS для автосервисов  
**Монетизация:** Подписка 3–5 тыс ₽/мес  
**Гранты:** Фонд Бортника, Сколково, региональные МСП  
**Ключевая идея:** AI экономит приёмщику 2+ часа в день — легко обосновать цену

---

## 📎 Файлы для передачи новой сессии

1. **`motor-app-v7.zip`** — весь код проекта
2. **Этот файл** — контекст и состояние

---

*Сессия завершена. Следующая начинается с итерации 10.*
