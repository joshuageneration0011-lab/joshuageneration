#!/bin/bash

# Navigate to project root
cd /var/www/joshuageneration

# Pull latest changes from GitHub
echo "Pulling latest changes from Git..."
git pull origin main

# Build Frontend
echo "Building frontend..."
npm install
npm run build

# Install server dependencies and restart backend process
echo "Restarting backend..."
cd server
npm install
pm2 restart joshuagen-backend --update-env

# Copy Nginx config and reload Nginx
echo "Reloading Nginx..."
cp /var/www/joshuageneration/nginx.conf /etc/nginx/sites-available/joshuageneration
nginx -t && systemctl reload nginx

echo "Deployment complete!"
