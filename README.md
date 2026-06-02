# МОТОР — AI-экосистема автосервиса

> Полноценная система управления автосервисом с AI-агентами, мобильным приложением и веб-версией.

---

## 📱 Приложения

| Платформа | Описание |
|---|---|
| **iOS / Android** | React Native CLI — запись, статусы, AI-чат, аналитика мастера |
| **Web** | React + Vite — полный функционал + Admin-панель + P&L |
| **Backend API** | Node.js + Express + PostgreSQL + Redis |

---

## 🤖 AI-агенты (все бесплатно)

| Агент | Функция |
|---|---|
| **Приёмщик** | Разбирает жалобу клиента → структурированный JSON |
| **Диагност** | Строит гипотезы + список OEM-деталей с вероятностями |
| **Оценщик** | Рассчитывает смету с наценками по категориям |

**AI-провайдеры** (авто-переключение): Groq → Ollama → OpenRouter → Anthropic

---

## ⚡ Ключевые функции

- 📅 **Онлайн-запись** к слесарю / электрику / диагносту
- 🔍 **AI-диагностика** с гипотезами и сметой в реальном времени
- 💬 **AI-чат** с агентом «Приёмщик»
- 📊 **P&L дашборд** владельца: выручка, маржа, воронка
- 📈 **Аналитика мастера**: топ работ, динамика, средний чек
- 📄 **PDF заказ-наряд** + **Excel экспорт** клиентской базы
- 🔔 **Push + Telegram** уведомления без Firebase
- 💳 **СБП QR** оплата (0% комиссия)
- ⚙️ **Admin-панель**: наценки, посты, пользователи, настройки
- 🧙 **Онбординг-визард** — готов к работе за 3 минуты

---

## 🚀 Быстрый старт

### С Docker (рекомендуется)

```bash
git clone https://github.com/Viktor592/motor-app
cd motor-app

# Настроить окружение
cp backend/.env.example backend/.env
# Заполнить: GROQ_API_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Запустить всё
make up           # Postgres + Redis + API + Web
make db-migrate   # Применить миграции  
make db-seed      # Заполнить тестовыми данными

# Открыть http://localhost:5173
```

### Тестовые аккаунты (пароль: test1234)

| Роль | Телефон |
|---|---|
| Клиент | +79001234567 |
| Мастер | +79111111111 |
| Приёмщик | +79333333333 |
| Администратор | +79444444444 |

### Для разработки (без Docker)

```bash
make install      # npm install во всех папках
make db-migrate
make db-seed
make dev-all      # Backend :3000 + Web :5173 параллельно
```

### Мобильное приложение

```bash
make android      # Android Studio + эмулятор
make ios          # Xcode (только macOS)
```

---

## 🆓 Бесплатные интеграции

| Функция | Сервис | Лимит |
|---|---|---|
| AI-агенты | Groq API | 30 req/min |
| AI локально | Ollama | Без лимитов |
| OTP | Gmail SMTP | 500/день |
| Уведомления | Telegram Bot | Без лимитов |
| Push (веб) | Web Push VAPID | Без лимитов |
| Push (моб) | Expo Push | Без лимитов |
| Оплата | СБП QR | 0% до 1 млн/мес |
| БД | PostgreSQL self-hosted | Без лимитов |

---

## 🛠️ Стек

```
Frontend Web:    React 18 · Vite · TypeScript · Redux Toolkit
Mobile:          React Native 0.74 CLI · Redux · Socket.IO
Backend:         Node.js · Express · TypeScript · Prisma
Database:        PostgreSQL 16 · Redis 7
AI:              Groq / Ollama / OpenRouter (бесплатно)
Infra:           Docker Compose · Nginx · VAPID
```

---

## 📁 Структура проекта

```
motor-app/
├── backend/
│   ├── src/
│   │   ├── agents/        # AI: receptionist, diagnostician, estimator
│   │   ├── routes/        # auth, orders, booking, chat, pipeline...
│   │   ├── services/      # aiProvider, payment, notifications, telegram
│   │   └── utils/         # prisma, seed, maskPhone
│   ├── prisma/schema.prisma
│   ├── Dockerfile
│   └── .env.example
├── mobile/
│   └── src/
│       ├── screens/       # auth, client, exec, shared
│       ├── store/slices/  # auth, orders, chat
│       ├── navigation/
│       ├── services/      # api, socket
│       └── hooks/         # usePushToken, useSocketEvents
├── web/
│   └── src/
│       ├── pages/         # 15+ страниц
│       ├── layouts/       # AppLayout, AuthLayout
│       ├── slices/        # auth, orders, chat
│       └── services/      # api, socket, webPush
├── docker-compose.yml
├── nginx.conf
├── Makefile
├── ROADMAP.md
└── README.md
```

---

## 📋 Команды Makefile

```bash
make up              # Запустить Docker стек
make down            # Остановить
make dev-all         # Разработка (backend + web)
make db-seed         # Тестовые данные
make db-studio       # Prisma Studio (GUI БД)
make android / ios   # Запуск мобильного
make logs            # Логи backend
```

---

## 🗺️ Дорожная карта

Полная дорожная карта с планами на итерации 10–14: [ROADMAP.md](./ROADMAP.md)

---

*Версия 1.0 · Итерация 9 · Все AI-сервисы бесплатные*
