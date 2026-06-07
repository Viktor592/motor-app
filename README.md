<div align="center">

# ⚡ МОТОР
### AI-экосистема для автосервиса

[![CI](https://github.com/Viktor592/motor-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Viktor592/motor-app/actions/workflows/ci.yml)
[![20/20 итераций](https://img.shields.io/badge/итераций-20%2F20%20✅-brightgreen)](https://github.com/Viktor592/motor-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**МОТОР** — полноценная система управления автосервисом с AI-ассистентами,  
онлайн-записью, складом, финансами и мобильным приложением для мастеров.

[🚀 Демо](https://demo.motor-app.ru) · [📖 HANDOFF](HANDOFF.md) · [📱 EAS Build](mobile/EAS_BUILD_GUIDE.md)

</div>

---

## 🎯 Что умеет МОТОР

| Модуль | Описание |
|--------|----------|
| 📋 **Заказы** | Заказ-наряды, статусы, PDF, подпись клиента |
| 🤖 **AI-агенты** | Приёмщик → Диагност → Оценщик (Groq / Ollama) |
| 🎙️ **AI-диагностика v2** | Голосовой ввод, фото → диагноз, история по VIN |
| 📅 **Онлайн-запись** | Виджет для сайта, слоты, конвертация в заказ |
| 📦 **Склад** | Остатки, резервы, Exist.ru / Autodoc, авто-заказ |
| 💰 **Финансы** | Кассовые смены, P&L, бюджет vs факт |
| 📊 **Аналитика** | KPI, рейтинг мастеров, топ услуги, динамика |
| 🎁 **Лояльность** | Баллы, реферальная программа, ТО-напоминания |
| 🔗 **Интеграции** | 1С:Предприятие, Оптим Гараж |
| 📱 **Мобилка** | React Native / Expo для мастеров |
| 🌐 **PWA** | Офлайн-режим, установка, push-уведомления |
| ☁️ **SaaS** | Мультитенантность, тарифы, ЮКасса |
| 🚀 **CI/CD** | GitHub Actions, Docker, Nginx SSL, Grafana |
| 🎨 **Полировка** | Тёмная/светлая тема, i18n (ru/kk/uk), onboarding-тур |

---

## 🗺️ Дорожная карта — все 20 итераций выполнены

| # | Итерация | Статус |
|---|----------|--------|
| 1 | Инициализация монорепо (backend / web / mobile) | ✅ |
| 2 | Auth: JWT + OTP (email / Telegram / console) | ✅ |
| 3 | Заказ-наряды: CRUD, статусы, PDF | ✅ |
| 4 | AI-агенты: Приёмщик → Диагност → Оценщик | ✅ |
| 5 | Онлайн-запись: слоты, виджет для сайта | ✅ |
| 6 | AI-чат, Socket.IO real-time | ✅ |
| 7 | СБП QR оплата (бесплатно) | ✅ |
| 8 | Telegram-бот (Telegraf) | ✅ |
| 9 | Аналитика: P&L, экспорт PDF/Excel | ✅ |
| 10 | Склад и запчасти (Exist.ru / Autodoc, авто-заказ) | ✅ |
| 11 | Финансы: кассовые смены, P&L, бюджет vs факт | ✅ |
| 12 | Мобильный мастер + Push + Онлайн-запись | ✅ |
| 13 | Расширенная аналитика: KPI, рейтинг, динамика | ✅ |
| 14 | AI-диагностика v2: голос, фото, VIN-история | ✅ |
| 15 | Лояльность: баллы, рефералы, ТО-напоминания | ✅ |
| 16 | Интеграции: 1С:Предприятие, Оптим Гараж | ✅ |
| 17 | CI/CD: GitHub Actions, Docker, Nginx SSL, Grafana | ✅ |
| 18 | Мультитенантность SaaS: тенанты, тарифы, ЮКасса | ✅ |
| 19 | PWA + EAS Build: офлайн, установка, APK/IPA | ✅ |
| 20 | Финальная полировка: тема, i18n, onboarding-тур | ✅ |
| 21 | ЭДО, МЧД, авто-отчётность ФНС/СФР, Атол 54-ФЗ, AI-налоги | ✅ |

---

## 🆓 Стек (всё бесплатно)

- **AI:** Groq API (30 req/min) + Ollama (локально, безлимит)
- **Push:** Expo Push (мобилка) + Web Push VAPID (браузер)
- **Оплата:** СБП QR — 0% до 1 млн/мес
- **Уведомления:** Telegram Bot
- **БД:** PostgreSQL + Prisma
- **Деплой:** Docker Compose + Let's Encrypt SSL
- **Мониторинг:** Grafana + Prometheus (self-hosted)

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/Viktor592/motor-app
cd motor-app

# Backend
cp backend/.env.example backend/.env
# Заполнить: GROQ_API_KEY, DATABASE_URL, JWT секреты

cd backend && npm install
npx prisma migrate deploy && npx prisma db seed
npm run dev   # :3000

# Web
cd ../web && npm install
npm run dev   # :5173

# Mobile
cd ../mobile && npm install
npx expo start
```

---

## 🏭 Production деплой

```bash
# Первый запуск на сервере (Ubuntu 22+)
./scripts/deploy.sh setup

# Обновление
./scripts/deploy.sh update
```

---

## 📱 Сборка APK / IPA

```bash
cd mobile
npm install -g eas-cli && eas login
eas build --platform android --profile preview    # APK
eas build --platform android --profile production # Google Play
eas build --platform ios     --profile production # App Store
```

Подробнее: [`mobile/EAS_BUILD_GUIDE.md`](mobile/EAS_BUILD_GUIDE.md)

---

## 💰 Тарифы (SaaS)

| Тариф | Цена | Мастера | Заказов/мес |
|-------|------|---------|-------------|
| Trial | 0 ₽ (14 дней) | 1 | 50 |
| Старт | 990 ₽/мес | 1 | 200 |
| Профи | 2990 ₽/мес | 5 | 1000 |
| Бизнес | 4990 ₽/мес | ∞ | ∞ |

---

## 👤 Автор

**Илья У.**  
GitHub: [Viktor592](https://github.com/Viktor592)

---

<div align="center">
Сделано с ❤️ для российских автосервисов
</div>
