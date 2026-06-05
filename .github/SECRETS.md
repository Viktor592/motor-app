# GitHub Actions Secrets

Добавить в Settings → Secrets and variables → Actions:

## Обязательные для CD

| Secret | Описание |
|--------|----------|
| `DOCKER_USER` | Логин Docker Hub |
| `DOCKER_TOKEN` | Docker Hub Access Token |
| `SSH_HOST` | IP сервера |
| `SSH_USER` | Пользователь SSH (обычно `root` или `ubuntu`) |
| `SSH_KEY` | Приватный SSH ключ (содержимое `~/.ssh/id_rsa`) |
| `SSH_PORT` | Порт SSH (по умолчанию 22) |
| `DOMAIN` | Домен: `motor-app.ru` |

## Для Telegram-уведомлений

| Secret | Описание |
|--------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | ID чата/канала для уведомлений |

## Для бэкапов

| Secret | Описание |
|--------|----------|
| `S3_BUCKET` | Имя S3-бакета |
| `S3_ENDPOINT` | URL S3 (Selectel/Yandex) |

## Как добавить SSH ключ

```bash
# На своём компьютере создать ключ
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/motor_deploy

# Скопировать публичный ключ на сервер
ssh-copy-id -i ~/.ssh/motor_deploy.pub user@your-server

# Содержимое приватного ключа добавить как секрет SSH_KEY
cat ~/.ssh/motor_deploy
```
