#!/bin/bash

APP_NAME="dp-monitor"

echo "🛑 Stopping application '$APP_NAME'..."

pm2 delete $APP_NAME 2>/dev/null || true

echo "✅ PM2 process stopped."