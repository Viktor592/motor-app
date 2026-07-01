# МОТОР — Платформа управления автосервисом

## Архитектура: 6 отдельных приложений

```
motor-app/
├── backend/              # Node.js + TypeScript + Prisma (PostgreSQL)
├── apps/
│   ├── saas/             # Web: Вход + Регистрация автосервиса
│   ├── client-web/       # Web: Клиент (запись, заказы, чат)
│   ├── staff-web/        # Web: Мастер/Исполнитель (канбан, аналитика)
│   ├── admin/            # Web: Администратор автосервиса (всё управление)
│   ├── client-mobile/    # iOS + Android: Клиент (Expo/React Native)
│   └── staff-mobile/     # iOS + Android: Мастер (Expo/React Native)
└── packages/shared/      # Общие типы, api-клиент, auth-утилиты
```

## Порты

| Приложение      | URL                   | Роль              |
|-----------------|-----------------------|-------------------|
| SaaS (вход)     | http://server:80      | Все               |
| Client Web      | http://server:3001    | CLIENT            |
| Staff Web       | http://server:3002    | MASTER / STAFF    |
| Admin           | http://server:3003    | ADMIN             |
| Backend API     | http://server:3000    | —                 |
| Client Mobile   | iOS / Android         | CLIENT            |
| Staff Mobile    | iOS / Android         | MASTER / STAFF    |

## Как работает авторизация

1. Пользователь открывает **:80** → SaaS (единая точка входа)
2. Вводит телефон + пароль
3. Backend возвращает JWT + роль
4. Автоматический редирект на нужное приложение по роли:
   - CLIENT  → :3001
   - ADMIN   → :3003
   - MASTER/STAFF → :3002
   - Мобильные — прямо внутри приложения
5. Каждое приложение проверяет роль при загрузке — чужой не попадёт

## Деплой

```bash
git pull
docker-compose up -d --build
```

## Мобильные приложения (Expo)

```bash
# Клиентское
cd apps/client-mobile
npm install
expo start

# Мастер
cd apps/staff-mobile
npm install
expo start
```

Сборка для сторов:
```bash
eas build --platform android
eas build --platform ios
```
