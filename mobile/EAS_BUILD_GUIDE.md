# 📱 Сборка APK и IPA через EAS Build

## Что такое EAS Build
Expo Application Services — облачная сборка без XCode и Android Studio.
Бесплатный тариф: 30 сборок/месяц.

---

## 🚀 Быстрый старт (первый раз)

### 1. Установить EAS CLI
```bash
npm install -g eas-cli
eas login   # войти через expo.dev
```

### 2. Создать проект на expo.dev
```bash
cd mobile
eas init    # создаст projectId, вставит в app.json
```

### 3. Добавить секрет в GitHub
```
EXPO_TOKEN = ваш токен с expo.dev → Account Settings → Access Tokens
```

---

## 📦 Сборки

### APK для Android (тест, до 100 МБ)
```bash
cd mobile
eas build --platform android --profile preview
# Готово за ~5 минут → ссылка на скачивание APK
```

### AAB для Google Play (production)
```bash
eas build --platform android --profile production
# Загружает в Google Play Internal Testing
```

### IPA для iOS TestFlight
```bash
eas build --platform ios --profile preview
# Нужен Apple Developer аккаунт ($99/год)
```

### Обе платформы сразу
```bash
eas build --platform all --profile preview
```

---

## 🔄 OTA обновления (без пересборки)

Изменения в JS-коде можно деплоить без новой сборки:
```bash
cd mobile
eas update --channel production --message "Исправлен баг с оплатой"
# Пользователи получат обновление при следующем запуске
```

---

## 📋 Через GitHub Actions

В репозитории → Actions → **EAS Build & Submit**
- Выбрать профиль: `development` / `preview` / `production`
- Выбрать платформу: `android` / `ios` / `all`
- Запустить

---

## 🔑 Что нужно для production

### Android (Google Play)
1. Создать аккаунт разработчика Google Play ($25 единоразово)
2. Создать приложение в консоли
3. Скачать `google-play-key.json` (Service Account)
4. `eas submit --platform android`

### iOS (App Store)
1. Apple Developer Program ($99/год)
2. Bundle ID: `ru.motorapp.client`
3. Сертификаты хранятся в EAS автоматически
4. `eas submit --platform ios`

---

## 📊 Статус сборок
https://expo.dev/accounts/viktor592/projects/motor-app/builds
