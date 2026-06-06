<div align="center">

# ⚡ МОТОР
### AI-экосистема для автосервиса

[![CI](https://github.com/Viktor592/motor-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Viktor592/motor-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**МОТОР** — полноценная система управления автосервисом с AI-ассистентами, онлайн-записью, складом, финансами и мобильным приложением для мастеров.

[🚀 Демо](https://demo.motor-app.ru) · [📖 Документация](HANDOFF.md) · [📱 EAS Build](mobile/EAS_BUILD_GUIDE.md)

</div>

---

## 🎯 Что умеет МОТОР

| Модуль | Описание |
|--------|----------|
| 📋 **Заказы** | Заказ-наряды, статусы, PDF, подпись клиента |
| 🤖 **AI-агенты** | Приёмщик → Диагност → Оценщик (Groq/Ollama) |
| 📅 **Онлайн-запись** | Виджет для сайта, слоты, конвертация в заказ |
| 📦 **Склад** | Остатки, резервы, Exist.ru/Autodoc, авто-заказ |
| 💰 **Финансы** | Кассовые смены, P&L, бюджет, расходы |
| 📊 **Аналитика** | KPI, рейтинг мастеров, топ услуги, динамика |
| 🎁 **Лояльность** | Бонусные баллы, реферальная программа, ТО-напоминания |
| 🔗 **Интеграции** | 1С:Предприятие, Оптим Гараж |
| 📱 **Мобилка** | React Native для мастеров (MasterHome, MasterOrder) |
| 🌐 **PWA** | Офлайн, установка, push-уведомления |
| ☁️ **SaaS** | Мультитенантность, тарифы, ЮКасса |
| 🚀 **CI/CD** | GitHub Actions, Docker, Nginx SSL, Grafana |

## 🆓 Стек (всё бесплатно)

- **AI:** Groq API (30 req/min) + Ollama (локально)
- **Push:** Expo Push (мобилка) + Web Push VAPID (браузер)
- **Оплата:** СБП QR (0% до 1 млн/мес)
- **Уведомления:** Telegram Bot (Telegraf)
- **БД:** PostgreSQL + Prisma
- **Деплой:** Docker Compose + Let's Encrypt SSL

## 🚀 Быстрый старт

\`\`\`bash
git clone https://github.com/Viktor592/motor-app
cd motor-app

# Backend
cp backend/.env.example backend/.env
# Заполнить GROQ_API_KEY, DATABASE_URL, JWT секреты

cd backend && npm install
npx prisma migrate deploy && npx prisma db seed
npm run dev   # :3000

# Web
cd ../web && npm install
npm run dev   # :5173

# Mobile
cd ../mobile && npm install
npx expo start
\`\`\`

## 📦 Production деплой

\`\`\`bash
# Скопировать и заполнить .env
cp .env.production.example .env

# Первый запуск на сервере
./scripts/deploy.sh setup

# Обновление
./scripts/deploy.sh update
\`\`\`

## 📱 Сборка APK/IPA

\`\`\`bash
cd mobile
npm install -g eas-cli && eas login
eas build --platform android --profile preview
\`\`\`

Подробнее: [EAS_BUILD_GUIDE.md](mobile/EAS_BUILD_GUIDE.md)

## 💰 Тарифы (SaaS)

| Тариф | Цена | Мастера | Заказов/мес |
|-------|------|---------|-------------|
| Trial | 0 ₽ (14 дней) | 1 | 50 |
| Старт | 990 ₽/мес | 1 | 200 |
| Профи | 2990 ₽/мес | 5 | 1000 |
| Бизнес | 4990 ₽/мес | ∞ | ∞ |

---

<div align="center">
Сделано с ❤️ для российских автосервисов
</div>
