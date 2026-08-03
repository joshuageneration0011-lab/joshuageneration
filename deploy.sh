#!/bin/bash

# Navigate to project root
cd /var/www/joshuageneration

# Pull latest changes from GitHub
echo "Pulling latest changes from Git..."
git fetch origin main
git reset --hard origin/main

# Build Frontend
echo "Building frontend..."
npm install
npm run build

# Install server dependencies, sync database, and restart backend process
echo "Setting up backend..."
cd server
npm install
node sync_database.js
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

# Copy Nginx config and reload Nginx
echo "Reloading Nginx..."
cp /var/www/joshuageneration/nginx.conf /etc/nginx/sites-available/joshuageneration
nginx -t && systemctl reload nginx

echo "Deployment complete!"
