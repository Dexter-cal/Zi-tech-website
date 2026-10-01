@echo off
echo Starting Zitech Limited Platform...
IF NOT EXIST node_modules (
    echo Installing dependencies...
    call npm install
)
call node server/index.js
