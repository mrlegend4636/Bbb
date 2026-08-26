Docker run instructions

Quick command (enforces ~150MiB RAM and 25% of one CPU):

docker run --rm \
  --name bbb-bot \
  --memory=150m \
  --cpus=0.25 \
  -e LIGHT_MODE=1 \
  -p 5000:5000 \
  mrlegend4636/bbb:latest

Notes:
- The container starts node with --max-old-space-size=150 (V8 heap cap).
- LIGHT_MODE=1 reduces optional bot activity (intervals/modules) — ensure your code checks this env var.
- Adjust port mapping and image name as needed.
