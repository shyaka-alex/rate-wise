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

> Note: on the shared course servers port 80 is already used by another project, so Nginx for Rate Wise listens on **8080**. On a dedicated server you can keep `listen 80` instead and remove the default site.

### 1. Install Node.js, git and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
node -v && npm -v
```

### 2. Clone and install

```bash
git clone https://github.com/shyaka-alex/rate-wise.git
cd rate-wise
npm install
```

### 3. Configure secrets

```bash
cp .env.example .env
nano .env   # set API_KEY and PORT=3000
chmod 600 .env
```

Never commit `.env`. Keep the key only on the servers (and in the assignment comment section as required). I copied the `.env` from Web01 to Web02 with `scp` so the key was never typed or printed again.

### 4. Run with PM2

```bash
pm2 start server.js --name rate-wise
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

The `startup` line makes PM2 restart the app after a reboot. Useful PM2 commands:

```bash
pm2 status
pm2 logs rate-wise
pm2 restart rate-wise
```

### 5. Configure Nginx (port 8080)

```bash
sudo apt-get install -y nginx
sudo cp deploy/nginx-webserver.conf /etc/nginx/sites-available/rate-wise
sudo sed -i '/listen \[::\]:80 default_server;/d; s/listen 80 default_server;/listen 8080;/' /etc/nginx/sites-available/rate-wise
sudo ln -sf /etc/nginx/sites-available/rate-wise /etc/nginx/sites-enabled/rate-wise
sudo nginx -t
sudo service nginx reload
```

Verify on each web server:

```bash
curl -s http://127.0.0.1:8080/health
```

The answer contains the name of the server, for example `{"status":"ok","server":"7406-web-02"}`.

---

## Load balancer setup (Lb01)

```
Browser --> Lb01 (HAProxy, port 8080, round robin + /health checks)
              |--> Web01: Nginx :8080 --> Node.js app :3000 (PM2)
              |--> Web02: Nginx :8080 --> Node.js app :3000 (PM2)
```

### 1. Install HAProxy

```bash
sudo apt-get update
sudo apt-get install -y haproxy
```

### 2. Add the Rate Wise frontend and backend

Append this to `/etc/haproxy/haproxy.cfg`:

```
frontend ratewise
    bind *:8080
    default_backend ratewise-backend

backend ratewise-backend
    balance roundrobin
    option httpchk GET /health
    server 7406-web-01 18.130.189.158:8080 check
    server 7406-web-02 13.135.103.225:8080 check
```

Validate and reload:

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo service haproxy reload
```

HAProxy uses the `roundrobin` algorithm and the `/health` endpoint to stop sending requests to a server that is down.

### 3. Test traffic distribution

From your laptop:

```bash
for i in 1 2 3 4 5 6 7 8; do
  curl -s http://18.170.51.74:8080/health; echo
done
```

You should see `7406-web-01` and `7406-web-02` alternating. Also open `http://18.170.51.74:8080` in a browser and reload: the footer "Served by ..." changes between the two servers.

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

1. **Challenge:** Pushing the project from the wrong folder and with the wrong GitHub account.
   **Solution:** I fixed the remote and the active account, and checked that `.env` is excluded from git before every push.

2. **Challenge:** The first version of the weekly chart used data that was not real.
   **Solution:** I replaced it with the real top rates returned by the API.

3. **Challenge:** The "Converting..." spinner never stopped in some cases.
   **Solution:** I fixed the loading state so it always clears when the request finishes.

4. **Challenge:** Keeping the API key secret.
   **Solution:** The backend reads the key from `.env`, which is never committed. I copied it between servers with `scp` instead of typing it again.

5. **Challenge:** Proving that the load balancer really splits traffic between Web01 and Web02.
   **Solution:** `/health` returns the name of the server and the footer shows "Served by ...". A `curl` loop through HAProxy alternates between the two servers.

6. **Challenge:** Port 80 was already used by another course project on the same servers.
   **Solution:** I moved Rate Wise to Nginx port 8080 and gave Lb01 a second listener on port 8080, so both projects work at the same time.

7. **Challenge:** Keeping the app running after a crash or a reboot.
   **Solution:** PM2 with a systemd startup script restarts it automatically.

---

## Links

- **Demo video:** ADD_YOUTUBE_LINK_HERE
- **Live site (via load balancer):** http://18.170.51.74:8080
- **GitHub repository:** https://github.com/shyaka-alex/rate-wise

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
