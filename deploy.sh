#!/bin/bash

echo "🚀 Starting Sales Order Furniture Deployment..."

cd /www/wwwroot/Sales_Order_Furniture_Server || exit 1

echo "🧹 Cleaning local changes..."
git reset --hard
git clean -fd

echo "⬇️ Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
rm -rf node_modules
npm install --production

echo "🔁 Restarting PM2 service..."
pm2 restart sales_order_furniture

echo "✅ Sales Order Furniture Deployment completed successfully!"
