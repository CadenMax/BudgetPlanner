# Budget Elite Agent Guide

## Purpose

Budget Elite is a React and Vite budgeting application for Australian income calculations. It uses a Node/Express API, SQLite, and Docker for multi-user server-side storage.

AI agents should make small, focused changes, preserve existing behavior, and validate the affected slice before making unrelated edits.

## Repository Structure

```text
BudgetPlanner/
|-- .dockerignore              Docker build exclusions
|-- .gitignore                 Git exclusions, including generated data
|-- docker-compose.yml         Frontend and API services plus database volume
|-- Dockerfile                 Node build stage and Nginx frontend image
|-- Dockerfile.server          Node API image
|-- eslint.config.js           ESLint flat configuration
|-- index.html                 Vite HTML entry point
|-- nginx.conf                 Static hosting, SPA fallback, and /api proxy
|-- package.json               Scripts and dependencies
|-- package-lock.json          Locked npm dependency versions
|-- vite.config.js             Vite plugins and local /api proxy
|-- README.md                  User, deployment, and feature documentation
|-- AGENTS.md                  This guide
|-- public/
|   |-- favicon.svg             Application favicon
|   `-- icons.svg               Public icon assets
|-- server/
|   `-- index.js                Express API, SQLite schema, auth, sessions, admin routes
`-- src/
    |-- App.jsx                 Root React component wrapper
    |-- App.css                  Application-level styles
    |-- BudgetPlannerApp.jsx    Auth gate, header, navigation, and page routing
    |-- index.css                Global styles and responsive breakpoints
    |-- main.jsx                React DOM entry point
    |-- assets/
    |   |-- BE icon.af           Brand asset
    |   |-- hero.png             Image asset
    |   |-- react.svg            Vite starter asset
    |   `-- vite.svg             Vite starter asset
    |-- components/
    |   `-- ui.jsx               Shared fields, metric cards, tables, account summary
    |-- data/
    |   |-- budgetDefs.js        Default budget item definitions
    |   `-- taxTables.js         Tax years, profiles, and withholding tables
    |-- hooks/
    |   `-- useBudgetModel.js    Budget calculations, auth state, API hydration, persistence
    |-- pages/
    |   |-- Account.jsx          Signed-in user profile and password editing
    |   |-- Admin.jsx            Administrator account management interface
    |   |-- AuthScreen.jsx       Login and registration interface
    |   |-- Dashboard.jsx        Main income and budget dashboard
    |   |-- LookupTables.jsx     Tax table reference views
    |   `-- TaxCalculator.jsx    Tax calculation view
    `-- utils/
        `-- format.js           Currency, percentage, and budget formatting helpers
```

Generated or runtime-only directories are intentionally excluded from the structure above:

- `node_modules/`: npm-installed dependencies.
- `dist/`: Vite production output.
- `data/`: local SQLite data when the API runs outside Docker.
- Docker volume `budgetelite-data`: persistent production SQLite data.
- `.git/`: repository metadata.

## Data Flow

1. `main.jsx` mounts `App`.
2. `App.jsx` mounts `BudgetPlannerApp`.
3. `BudgetPlannerApp.jsx` calls `useBudgetModel`.
4. The hook checks `/api/auth/me` and shows `AuthScreen` until a session is available.
5. Authenticated users receive budget data from `/api/budget`.
6. Budget edits update hook state and are saved to `/api/budget` with a short debounce.
7. The hook calculates resolved item values, category remaining amounts, freeloader money, remainder routing, and account totals.
8. The shell selects `Dashboard`, `TaxCalculator`, `LookupTables`, `Account`, or the admin-only `Admin` page.

The browser must not become a second database. Do not add localStorage or sessionStorage persistence for user or budget data.

## Authentication And Authorization

- Passwords are hashed with `bcryptjs`; never store or log plaintext passwords.
- Sessions are opaque random tokens. Only their SHA-256 hashes are stored in SQLite.
- The session cookie is HTTP-only and same-site.
- Usernames allow letters, numbers, and underscores, preserve capitalization, and are unique case-insensitively.
- Admin checks must remain server-side. UI hiding is not authorization.
- `isAdmin` grants administrator access.
- `isOwner` identifies the original owner-level administrator.
- Regular admins cannot manage other admins.
- Owner admins can manage admins and promote other admins to owner status.
- Never allow deletion, disabling, or demotion of the last active admin or last owner admin.
- Never allow an administrator to lock or remove their own required access.

## API Boundaries

Public or authenticated routes are defined in `server/index.js`:

- `GET /api/health`: health check.
- `POST /api/auth/register`: create a user.
- `POST /api/auth/login`: start a session.
- `POST /api/auth/logout`: end the current session.
- `GET /api/auth/me`: inspect the current session.
- `PATCH /api/auth/account`: update the current user's profile or password.
- `GET /api/budget`: load the current user's budget.
- `PUT /api/budget`: save the current user's budget.
- `GET /api/admin/users`: list accounts.
- `GET /api/admin/audit`: list recent audit entries.
- `POST /api/admin/users`: create an administrator.
- `PATCH /api/admin/users/:id`: edit roles, lock state, username, or email.
- `POST /api/admin/users/:id/password`: reset a password.
- `GET /api/admin/users/:id/budget`: export a user's budget.
- `DELETE /api/admin/users/:id`: delete a user.

Keep API responses free of `password_hash`. Validate all identifiers and user input on the server.

## Docker And Storage

- `budgetelite` is the Nginx-served frontend on host port `3684`.
- `api` is the internal Node service on port `3001`.
- Nginx proxies `/api/` to `api:3001`.
- SQLite is stored at `/app/data/budget.sqlite` inside the `budgetelite-data` volume.
- The default bootstrap admin is configured in `server/index.js`.
- Prefer setting `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the API service environment before deployment.
- Do not delete `budgetelite-data` during routine rebuilds.
- Use HTTPS through a reverse proxy before exposing the service publicly.

## Development Commands

```bash
npm install
npm run dev
npm run server
npm run build
npm run lint
docker compose config
docker compose up -d --build
docker compose logs --tail=100
```

The Vite dev server proxies `/api` to `http://localhost:3001`. Run `npm run server` in a second terminal when developing the frontend outside Docker.

## Validation Rules

After a frontend edit:

1. Run `npm run build`.
2. Run diagnostics or `npm run lint` for touched files.
3. For deployment changes, run `docker compose config`.
4. For API changes, exercise the affected endpoint with an authenticated smoke test.
5. Check `docker compose ps` and `/api/health` after a container restart.

Full lint may contain older unrelated warnings or errors. Do not broaden a narrow task into unrelated cleanup unless requested.

## Editing Rules

- Preserve existing React and Tailwind conventions.
- Use `apply_patch` for manual edits.
- Keep changes minimal and avoid broad formatting churn.
- Use ASCII by default.
- Do not commit or create branches unless explicitly requested.
- Do not reset or revert user changes.
- Do not expose secrets in source, logs, documentation examples, or test output.
- Do not place database files in source control.
- Update `README.md` when user-visible behavior, deployment, or administration changes.
- For mobile UI changes, check widths at phone and narrow-phone breakpoints and prevent horizontal overflow.
