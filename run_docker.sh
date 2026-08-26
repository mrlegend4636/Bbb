#!/bin/sh
# Build and run the bot container with enforced resource limits (150 MiB RAM, 0.25 CPU)
# The container will run the process with --max-old-space-size=150 and LIGHT_MODE=1

set -e

IMAGE_NAME=mrlegend4636/bbb:latest

echo "Building image ${IMAGE_NAME}..."
docker build -t "${IMAGE_NAME}" .

echo "Running container with limits: --memory=150m --cpus=0.25"
docker run --rm \
  --name bbb-bot \
  --memory=150m \
  --cpus=0.25 \
  -e LIGHT_MODE=1 \
  -p 5000:5000 \
  "${IMAGE_NAME}"
