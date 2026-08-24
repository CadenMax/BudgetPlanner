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
Seemlessly works whether you get paid weekly, fortnightly, or monthly schedules. Just enter your hours worked, hourly rate and divy up your acounts to reflect when money comes out.

### Freeloader Money
Budget for money you receive but do not actually spend (for example, parental help with rent, gifts, or reimbursements). See what your lifestyle would cost without that help while keeping your personal spending accurate. This feature is toggleable making it easily hidden if you do not wish to use.

### Account Tracking
Split your budget across multiple bank accounts. Know exactly which account gets how much. No more guesswork at transfer time.

### Non-Taxable Income
Somestimes you may receive some money that isn't taxed, or already has taxed applied to it. In this scenario, you would want that number to be added to whatever your original income would be. You can also use this feature to directly add in your income from your payslip.

### Backup & Restore
Budget data is stored on the server per account. The JSON export/import tools remain available as an additional backup option.

### Accounts and server storage
The Docker setup includes a Node API and SQLite database. Create an account in the app, then sign in from any device using the same address. The browser stores only an HTTP-only session cookie; budget values are stored in the database volume.

### User accounts
Registration requires a unique username, email address, and password of at least eight characters. Usernames may contain letters, numbers, and underscores and preserve their capitalization. Email addresses and usernames are matched case-insensitively for uniqueness.

Users can update their own username, email, and password from the **Account** tab. Signing out clears the in-memory budget state. Budget data is never stored in localStorage or sessionStorage.

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
