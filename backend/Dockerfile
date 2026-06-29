FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Если migrate не проходит — пушим схему напрямую
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss && node dist/index.js"]

EXPOSE 3000
