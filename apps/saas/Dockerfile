FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_CLIENT_WEB_URL
ARG VITE_STAFF_WEB_URL
ARG VITE_ADMIN_URL
ENV VITE_CLIENT_WEB_URL=$VITE_CLIENT_WEB_URL
ENV VITE_STAFF_WEB_URL=$VITE_STAFF_WEB_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
