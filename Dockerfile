# Этап сборки
FROM node:22-alpine AS build-stage

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Vite автоматически загрузит .env.production или .env.development в зависимости от BUILD_MODE
ARG BUILD_MODE=development

RUN npm run build:${BUILD_MODE}

# Этап production
FROM nginx:alpine-slim AS production-stage

# Копируем собранные файлы из этапа сборки
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"] 