#!/bin/bash
# Bot CPU limiter - restricts bot to 10% CPU usage
# Install cpulimit first: apt-get install cpulimit

echo "Starting Minecraft AFK Bot with 10% CPU limit..."
cpulimit -l 10 -- node --max-old-space-size=80 index.js
