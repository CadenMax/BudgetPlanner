# Budget Elite

Open source budget calculator for Australians with variable income. Designed for casual workers, freelancers, or anyone whose pay does not arrive in predictable, equal chunks. However, other workers may find it useful as well.

Built around the 50/30/20 rule, but flexible enough to handle real life.

---

## ATO Tax Integration

Budget Elite automatically calculates PAYG withholding using the official ATO weekly tax tables. No more manual guessing or spreadsheet headaches.

**Reference:** [ATO Weekly tax tables](https://www.ato.gov.au/tax-rates-and-codes/tax-table-weekly)

---

## Key Features

### Custom Categories
Set up your own Wants, Needs, and Savings/Investments line by line. Each item can be a:
- Fixed dollar amount, or
- Percentage of your income (after tax)

### Flexible Pay Periods
Enter the income and hours that match the pay period you are budgeting. The app records the exact values you enter for each capture; there is no separate pay-period setting to maintain.

### Freeloader Money
Budget for money you receive but do not actually spend (for example, parental help with rent, gifts, or reimbursements). See what your lifestyle would cost without that help while keeping your personal spending accurate. This feature is toggleable making it easily hidden if you do not wish to use.

### Account Tracking
Split your budget across multiple bank accounts. Know exactly which account gets how much. No more guesswork at transfer time.

### Non-Taxable Income
Somestimes you may receive some money that isn't taxed, or already has taxed applied to it. In this scenario, you would want that number to be added to whatever your original income would be. You can also use this feature to directly add in your income from your payslip.

### Backup & Restore
Budget data is stored on the server per account. The JSON export/import tools remain available as an additional backup option.

### Budget history
Use **Capture this period** on the Dashboard whenever you want to record a pay period. Captures store the entered income, PAYG, allocation, and remaining amounts without changing the live budget. The **Budget History** tab filters captures by exact date range, net-pay range, allocation result, and chart metric, then shows average summaries, allocation splits, and income trends. Each capture can be downloaded as a CSV file, which opens directly in Excel and is widely supported by financial tools.

### Accounts and server storage
The Docker setup includes a Node API and SQLite database. Create an account in the app, then sign in from any device using the same address. The browser stores only an HTTP-only session cookie; budget values are stored in the database volume.

### User accounts
Registration requires a unique username, email address, and password of at least eight characters. Usernames may contain letters, numbers, and underscores and preserve their capitalization. Email addresses and usernames are matched case-insensitively for uniqueness.

Users can update their own username, email, and password from the **Account** tab. Signing out clears the in-memory budget state. Budget data is never stored in localStorage or sessionStorage.

### Email verification
New accounts receive a verification link by email and see a reminder at the top of the app until they verify. Users can request another link from that reminder. Verification links expire after 24 hours, and changing an account email requires verifying the new address. Existing accounts are treated as verified when the database is upgraded.

Configure these variables on the API service to send mail through Resend:

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Budget Elite <noreply@example.com>
APP_URL=https://your-frontend-domain.example
```

Use a sender address on a domain verified in Resend. `APP_URL` must be the public frontend origin so verification links return through the frontend's `/api` proxy. If delivery is not configured or Resend rejects a message, the account remains usable and the banner offers a retry.

### Administrator access
The default owner administrator is created when the API first initializes:

```text
Username: admin
Email: admin@budgetelite.local
Password: ChangeMe123!
```

Sign in at `http://localhost:3684`, then select the **Admin** tab. Change the default password immediately. Override the bootstrap credentials before deployment with Docker environment variables:

```yaml
services:
  api:
    environment:
      ADMIN_USERNAME: your-admin-name
      ADMIN_EMAIL: you@example.com
      ADMIN_PASSWORD: use-a-long-unique-password
```

Administrators can search and filter accounts, edit usernames and emails, reset passwords, lock accounts, export budgets, view login activity, and inspect the audit log. Regular administrators cannot manage other administrators. The owner administrator can promote or demote owner administrators. The API prevents deleting or disabling the last active administrator and prevents removing the last owner administrator.

### Mobile layout
On screens up to 640px wide, the desktop tab bar becomes a navigation dropdown. Budget breakdown rows and administrator account rows stack into mobile-friendly layouts. Very narrow screens also collapse account summary and lookup-table content to avoid horizontal scrolling.

## How to use if you get a fixed income
Some workers out there don't have casual jobs and actually receive a fixed income per year (I know, shocking right?) This tool can still be used by these lucky few, by changing what they spend, rather then what they receive. It is a handy tool to come back to each pay day to divy out your income properly, and then re-assess whenever you feel like you are putting money into the wrong places

---
## How to install and run with Docker

This app is designed to run as a simple website in a Docker container. Docker packages the app and all the files it needs so it can run the same way on your laptop, a home server, or a VPS.

If you are new to self-hosting, don't worry — the steps below are written for beginners.

### Quick start summary

If you want the shortest possible version, run:

```bash
git clone <repo-url>
cd BudgetPlanner
docker compose up --build -d
```

Then visit:

```text
http://localhost:3684
```

### What you need

Before you start, install these on your machine:

- Docker Desktop (Windows or Mac), or Docker Engine (Linux)
- A terminal / command prompt 

You do not need to install Node.js manually for this setup, because Docker handles that for you.

### Railway and Cloudflare deployment

Railway should run this project as two services:

1. Create an API service using `Dockerfile.server`.
2. Create a frontend service using `Dockerfile`. Keep both services in the same Railway project and environment so Railway private networking can resolve the API from the frontend.
3. Add a Railway volume mounted at `/app/data` to the API service so the SQLite database survives deployments.
4. In the frontend service variables, set `API_HOST` to a reference to the API service's `RAILWAY_PRIVATE_DOMAIN`, for example `${{api.RAILWAY_PRIVATE_DOMAIN}}` when the API service is named `api`. Use the exact Railway service name in the reference; do not guess or type a hostname from a different project or environment. Railway supplies the private domain, normally ending in `.railway.internal`.
5. In the frontend service's Public Networking settings, set the target port to match the frontend's `PORT` environment variable. Nginx listens on this port; a mismatch can make the Railway domain return a gateway error even when the container starts.
6. Set the frontend service's `API_PORT` to the port the API listens on. The API reads Railway's `PORT`; for example, if the API logs that it listens on `8080`, set frontend `API_PORT` to `8080` as well. This is separate from the frontend's Public Networking target port. The local Docker setup defaults to `3001`.
7. Set the API service health check path to `/api/health`. Railway supplies `PORT` automatically; the API already reads that variable.
8. Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` on the API service before the first deploy.
9. Deploy the API first and wait for its health check to pass, then deploy the frontend. Nginx resolves the API's private hostname when it starts, so redeploy the frontend after any API redeploy that changes the API's private IP.

If the frontend logs `host not found in upstream`, verify `API_HOST` resolves to the API service's `RAILWAY_PRIVATE_DOMAIN` and that both services are deployed in the same Railway project environment. Nginx cannot start while its configured upstream hostname is unresolvable. If Nginx starts but API requests fail, verify `API_PORT` matches the API's listening `PORT`.

Give the frontend service a Railway public domain first and confirm login, budget saving, captures, and history work. Then add your Cloudflare DNS record as a CNAME to that Railway domain and set Cloudflare SSL/TLS mode to **Full** or **Full (strict)**. Keep the API service private; the frontend proxies `/api` to it.

Do not use Cloudflare Pages for this application because the Node API and persistent SQLite storage need a running Railway service.

### 1. Download the project

Open a terminal and run:

```bash
git clone https://github.com/CadenMax/BudgetPlanner
```

### 2. Open the project folder

In your terminal, go into the folder you downloaded:

```bash
cd BudgetPlanner
```

### 3. Make sure Docker is running

Before you run the app, start Docker Desktop if you are on Windows or Mac.

On Linux, make sure Docker is installed and running:

```bash
sudo systemctl status docker
```

If Docker is not running, start it first.
```bash
sudo systemctl start docker   
```

### 4. Build and start the app

From inside the project folder, run:

```bash
docker compose up --build -d
```

What this does:

- builds the app container
- installs the dependencies inside the container
- creates the production website files
- starts the website in the background

The `-d` means "run in detached mode" so it keeps running in the background.

### 5. Open the app in a browser

Once the container is started, open this address in your browser:

```text
http://localhost:3684
```

If you are hosting this on a remote server, replace `localhost` with your server's IP address or domain name:

```text
http://your-server-ip:3684
```

### 6. Confirm it is working

You should see the Budget Planner app running in the browser.

If you do not see the page:

- make sure Docker is still running
- confirm the container started successfully
- check the logs with:

```bash
docker compose logs
```

### 7. Stop the app

When you want to shut it down, run:

```bash
docker compose down
```

This stops the container and removes the running app instance.

### 8. Start it again later

If you already built the container once, you can run it again with:

```bash
docker compose up -d
```

### 9. Update the app

If the project changes or you pull down a new version from GitHub, update it like this:

```bash
git pull
docker compose up --build -d
```

### 10. Important notes for self-hosting

- The app listens on port `3684` by default.
- Account and budget data is stored in the persistent `budgetelite-data` Docker volume.
- Do not delete that volume unless you have a separate database backup.
- If you want it to be available on the internet, you need to open that port in your firewall or router.
- If you want HTTPS (secure website access), you should place it behind a reverse proxy such as Nginx Proxy Manager or Caddy.
- Budget data is stored per account in SQLite. Existing browser localStorage data is not imported.
- Use HTTPS through a reverse proxy before exposing accounts to the internet.

### Common beginner troubleshooting

#### Docker says the port is already in use

Another app may already be using port `3684`.

You can either:

- stop the other app, or
- change the port in the `docker-compose.yml` file

For example, change:

```yaml
ports:
  - "3684:80"
```

to:

```yaml
ports:
  - "{YOUR_PORT}:80"
```

Then open:

```text
http://localhost:{YOUR_PORT}
```

#### The page loads but the styling looks broken

This usually means the app did not build correctly or the static files were not served properly. Rebuild it with:

```bash
docker compose down
docker compose up --build -d
```

#### The app does not start

Check the logs:

```bash
docker compose logs --tail=100
```

Look for errors related to Docker, the build, or configuration.


---

## Open Source

Budget Elite is 100% open source. Fork it, modify it, audit it. No hidden fees, no data sharing, no cloud lock in.

---

## AI Disclaimer
AI was used to help assist in the making of this project. However, the AI was ethically sourced and stored locally before being served on your plate.

---

## Contributing

Bug reports, feature ideas, and pull requests are welcome. Help build better budgeting tools for irregular income.
