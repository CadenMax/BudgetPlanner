#!/bin/sh
set -eu

attempt=0
max_attempts=45
health_url="http://${API_HOST}:${API_PORT}/api/health"

until wget -q -T 2 -O /dev/null "$health_url"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "API did not become healthy at ${health_url}; refusing to start Nginx" >&2
    exit 1
  fi
  echo "Waiting for API health check (${attempt}/${max_attempts})..."
  sleep 3
done

envsubst '$PORT $API_HOST $API_PORT' \
  < /etc/nginx/budgetelite.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'