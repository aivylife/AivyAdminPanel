#!/bin/bash

# Обновляем образы
docker-compose pull

# Останавливаем старые контейнеры
docker-compose down

# Запускаем новые контейнеры
docker-compose up -d

# Очищаем неиспользуемые образы
docker image prune -f 