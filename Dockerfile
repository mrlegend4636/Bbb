# Minimal Dockerfile for the Minecraft AFK Bot

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

ENV NODE_ENV=production

# Expose health/dashboard port
EXPOSE 5000

# Limit V8 heap at container start as a safety cap
CMD ["node", "--max-old-space-size=150", "index.js"]
