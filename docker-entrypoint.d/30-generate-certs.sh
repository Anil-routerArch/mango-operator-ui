#!/bin/sh
set -e

# If certificates are not mounted by deployment, generate fallback self-signed certs
# so standalone `docker run` boots cleanly without requiring manual volume mounts.
if [ ! -f /etc/nginx/restapi-cert.pem ] || [ ! -f /etc/nginx/restapi-key.pem ]; then
  echo "No SSL certificate mounted at /etc/nginx/restapi-cert.pem and /etc/nginx/restapi-key.pem."
  echo "Generating fallback self-signed SSL certificate for standalone container..."
  mkdir -p /etc/nginx
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/restapi-key.pem \
    -out /etc/nginx/restapi-cert.pem \
    -subj "/C=US/ST=CA/L=Sunnyvale/O=OpenWiFi/CN=localhost" 2>/dev/null
  chmod 600 /etc/nginx/restapi-key.pem
  chmod 644 /etc/nginx/restapi-cert.pem
fi
