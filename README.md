# Mango Operator UI

Web management console for Mango Cloud and OpenWiFi network administration.

## Development

```bash
npm install
npm run dev
```

The development server runs by default on `http://localhost:5173`.

## Production Build

```bash
npm run build
```

Build outputs will be emitted to `./dist/`.

## Running with Docker

### 1. Build the Docker Image

```bash
docker build -t mango-operator-ui .
```

### 2. SSL Termination & Certificate Mounting

Following OpenWiFi architecture (`owprov-ui`, `owgw-ui`), SSL certificates are treated as deployment secrets and are mounted at runtime rather than baked into the container image.

Nginx terminates HTTPS on port **8445** and expects the following certificate files:
- `/etc/nginx/restapi-cert.pem` (SSL Certificate)
- `/etc/nginx/restapi-key.pem` (SSL Private Key)

#### Production / Docker Compose Deployment (OpenWiFi Standard)

Mount the cluster certificates from your OpenWiFi deployment:

```yaml
services:
  operator-ui:
    image: mango-operator-ui
    ports:
      - "8445:8445"
    environment:
      - VITE_UCENTRALSEC_URL=https://openwifi.wlan.local:16001
      - VITE_MANGO_MDU_URL=https://openwifi.wlan.local:16010
    volumes:
      - ./certs/restapi-cert.pem:/etc/nginx/restapi-cert.pem:ro
      - ./certs/restapi-key.pem:/etc/nginx/restapi-key.pem:ro
```

#### Standalone `docker run` with Custom Certificates

```bash
docker run -d \
  -p 8445:8445 \
  -v /path/to/certs/restapi-cert.pem:/etc/nginx/restapi-cert.pem:ro \
  -v /path/to/certs/restapi-key.pem:/etc/nginx/restapi-key.pem:ro \
  -e VITE_UCENTRALSEC_URL=https://openwifi.wlan.local:16001 \
  -e VITE_MANGO_MDU_URL=https://openwifi.wlan.local:16010 \
  mango-operator-ui
```

#### Standalone `docker run` without Mounted Certificates (Fallback)

If run standalone without mounted certificates, `/docker-entrypoint.d/30-generate-certs.sh` automatically generates a fallback self-signed SSL certificate so Nginx starts cleanly for local testing:

```bash
docker run -d -p 8445:8445 mango-operator-ui
```
