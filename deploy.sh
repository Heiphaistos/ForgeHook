#!/bin/bash
set -e

cd /opt/forgehook

git pull origin main

docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d

echo "[$(date -Iseconds)] [INFO] ForgeHook deployed successfully" >> .logs/deploy.log
echo "ForgeHook deployed OK"
