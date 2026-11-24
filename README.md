# Rate Wise

**Rate Wise** is a currency converter and exchange-rate explorer. It helps travelers, students paying tuition abroad, people sending or receiving remittances, and online shoppers quickly convert amounts and browse live rates with search, sort, filter, and favorites.

The app uses [ExchangeRate-API](https://www.exchangerate-api.com/) on the server only—API keys never reach the browser. It is designed to run on two application servers (Web01 / Web02) behind a load balancer (Lb01).

---

## Features

- **Currency converter** — convert any amount between supported currencies, with searchable from/to dropdowns and a swap control
- **Live rates table** — browse rates for a chosen base currency
- **Search** — filter the table by currency code or name as you type
- **Sort** — click column headers to sort by code (A–Z / Z–A) or rate (low–high / high–low)
- **Region filter** — Africa, Europe, Asia, Americas, Middle East, Oceania
- **Favorites** — star currencies; toggle “Show favorites only” (saved in `localStorage`)
- **Popular quick-picks** — USD, EUR, GBP, RWF, KES, UGX, NGN, ZAR, JPY, CNY
- **Error handling** — clear in-UI messages with “Try again” (no alert popups)
- **Caching** — codes cached 24h, rates cached 1h on the server
- **Load-balancer friendly** — `/health` plus `X-Served-By` response header
- **Light / dark mode** — follows `prefers-color-scheme`
- **Accessible UI** — labels, keyboard-friendly controls, skip link

---

## Screenshots

<!-- Add your screenshots after running the app -->

| Converter | Rates explorer |
|-----------|----------------|
| ![Converter screenshot](docs/screenshots/converter.png) | ![Rates screenshot](docs/screenshots/rates.png) |

*(Replace the placeholder images above with real screenshots before submission.)*

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, dotenv |
| Frontend | HTML, CSS, vanilla JavaScript |
| External API | ExchangeRate-API v6 |
| Process manager | PM2 |
| Web servers | Nginx (Web01 / Web02) |
| Load balancer | HAProxy (Lb01) |

---

## Running locally

### Prerequisites

- Node.js 18+ (includes global `fetch`)
- npm
- An ExchangeRate-API key ([sign up](https://www.exchangerate-api.com/))

### Steps

```bash
# 1. Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd rate-wise

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env and set:
#   API_KEY=your_actual_key
#   PORT=3000

# 4. Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Quick smoke tests

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/api/codes | head
curl -s "http://localhost:3000/api/convert?from=USD&to=EUR&amount=100"
curl -sI http://localhost:3000/health | grep -i x-served-by
```

---

## Deployment (Web01 & Web02)

Repeat these steps on **both** Web01 and Web02 so both serve the same app.

### 1. Install Node.js

```bash
# Example for Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v
```

### 2. Clone and install

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd rate-wise
npm install --production
```

### 3. Configure secrets

```bash
cp .env.example .env
nano .env   # set API_KEY and PORT=3000
```

Never commit `.env`. Keep the key only on the servers (and in the assignment comment section as required).

### 4. Run with PM2

```bash
sudo npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
# Run the command PM2 prints so the process restarts on reboot
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs rate-wise
pm2 restart rate-wise
```

### 5. Configure Nginx

```bash
sudo apt-get install -y nginx
sudo cp deploy/nginx-webserver.conf /etc/nginx/sites-available/rate-wise
sudo ln -sf /etc/nginx/sites-available/rate-wise /etc/nginx/sites-enabled/rate-wise
# Disable the default site if it conflicts:
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Verify on each web server:

```bash
curl -s http://127.0.0.1/health
curl -sI http://127.0.0.1/health | grep -i x-served-by
```

---

## Load balancer setup (Lb01)

### 1. Install HAProxy

```bash
sudo apt-get update
sudo apt-get install -y haproxy
```

### 2. Apply config

1. Copy `deploy/haproxy.cfg` to `/etc/haproxy/haproxy.cfg` (or merge carefully with the existing file).
2. Replace `WEB01_IP` and `WEB02_IP` with the real IPs of Web01 and Web02.
3. Validate and restart:

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
sudo systemctl enable haproxy
```

### 3. Test traffic distribution

From your laptop (or Lb01):

```bash
# Replace LB01_IP with the load balancer address
for i in 1 2 3 4 5 6 7 8; do
  curl -sI http://LB01_IP/health | grep -i x-served-by
done
```

You should see hostnames alternating between Web01 and Web02 (round-robin). Also open the LB URL in a browser and confirm the footer “Served by …” updates across refreshes / requests.

---

## API documentation & credit

This project uses **ExchangeRate-API** (v6).

- Docs: [https://www.exchangerate-api.com/docs](https://www.exchangerate-api.com/docs)
- Endpoints used (via our backend only):
  - `/v6/{API_KEY}/codes`
  - `/v6/{API_KEY}/latest/{base}`
  - `/v6/{API_KEY}/pair/{from}/{to}/{amount}`

**Credit:** Exchange rates provided by [ExchangeRate-API](https://www.exchangerate-api.com/). Thank you to the ExchangeRate-API team for the service and documentation.

### Our backend routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/codes` | Supported `[code, name]` pairs |
| `GET` | `/api/rates/:base` | Latest rates for a base currency |
| `GET` | `/api/convert?from=&to=&amount=` | Convert an amount |
| `GET` | `/health` | Health check + hostname |

All successful responses may include `"cached": true|false`. Every response includes the `X-Served-By` header.

---

## Error handling & security

### Error handling

- Invalid currency codes / amounts → **400** with a clear JSON `error` message
- Upstream API issues (`invalid-key`, `quota-reached`, `unsupported-code`, etc.) → mapped to **400 / 502 / 503**
- Network failures and timeouts (~8s via `AbortController`) → **502 / 504**
- Frontend shows inline errors with a **Try again** button (no `alert()`)

### Security

- API key lives only in `.env` on the server; never sent to the frontend
- `.env` is listed in `.gitignore`
- Input validation for currency codes (`^[A-Z]{3}$`) and amount bounds
- Frontend inserts API data with `textContent` only (XSS-safe)
- Nginx terminates public HTTP and proxies to localhost Node

---

## Caching approach

| Resource | TTL | Purpose |
|----------|-----|---------|
| Currency codes | 24 hours | Rarely change; cuts startup / dropdown load |
| Rates per base | 1 hour | Speeds up repeated explorer views; reduces quota use |

Cache is in-memory (per server process). Responses include `"cached": true` when served from cache.

---

## Challenges faced

<!-- Fill these in with your own experience before submission -->

1. **Challenge:** _[e.g. keeping the API key out of the browser while still supporting convert + rates]_  
   **Solution:** _[...]_

2. **Challenge:** _[e.g. proving load balancing between Web01 and Web02]_  
   **Solution:** _[...]_

3. **Challenge:** _[e.g. handling API quota / timeouts gracefully]_  
   **Solution:** _[...]_

---

## Links

- **Demo video:** _[YouTube / Vimeo URL]_
- **Live site (via load balancer):** _[http://LB01_IP or domain]_
- **GitHub repository:** _[https://github.com/YOUR_USERNAME/rate-wise]_

---

## Credits

- [ExchangeRate-API](https://www.exchangerate-api.com/) — exchange rate data
- [Express](https://expressjs.com/) — Node.js web framework
- [dotenv](https://github.com/motdotla/dotenv) — environment configuration
- [PM2](https://pm2.keymetrics.io/) — process management
- [Nginx](https://nginx.org/) — reverse proxy on web servers
- [HAProxy](https://www.haproxy.org/) — load balancing
- African Leadership University — assignment brief and server access (Web01, Web02, Lb01)

---

## License

MIT — for educational use.
