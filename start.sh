#!/usr/bin/env bash
echo "Starting Zitech Limited Platform..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
node server/index.js
