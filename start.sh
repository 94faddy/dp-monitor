#!/bin/bash

APP_NAME="dp-monitor"

echo "🛑 Stopping old PM2 processes if running..."
pm2 delete $APP_NAME 2>/dev/null

echo "🚀 Starting $APP_NAME..."
pm2 start npm --name "$APP_NAME" -- run start

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ System started with PM2!"

echo -e "\n📜 Opening logs for $APP_NAME...\n"
pm2 logs $APP_NAME