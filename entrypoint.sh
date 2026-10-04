#!/bin/sh
set -e

# Start the sidecar log receiver in the background
python3 /app/server.py &

# Wait for the sidecar to be ready
for i in $(seq 1 30); do
  if python3 -c "
import http.client
try:
    c = http.client.HTTPConnection('127.0.0.1', ${SIDECAR_PORT:-3001})
    c.request('GET', '/')
    c.getresponse()
except Exception:
    exit(1)
" 2>/dev/null; then
    break
  fi
  sleep 1
done

exec nginx -g 'daemon off;'
