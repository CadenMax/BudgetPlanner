import express from "express";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "budget.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_owner INTEGER NOT NULL DEFAULT 0,
    disabled INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    last_login TEXT,
    budget_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
for (const statement of [
  "ALTER TABLE users ADD COLUMN username TEXT COLLATE NOCASE",
  "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE users ADD COLUMN last_login TEXT",
]) {
  try { db.exec(statement); } catch (error) {
    if (!String(error.message).includes("duplicate column name")) throw error;
  }
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username IS NOT NULL");

const bootstrapEmail = String(process.env.ADMIN_EMAIL || "admin@budgetelite.local").trim().toLowerCase();
const bootstrapPassword = String(process.env.ADMIN_PASSWORD || "ChangeMe123!");
const bootstrapUsername = String(process.env.ADMIN_USERNAME || "admin").trim();
const existingBootstrap = db.prepare("SELECT id FROM users WHERE email = ?").get(bootstrapEmail);
if (!existingBootstrap) {
  db.prepare("INSERT INTO users (username, email, password_hash, is_admin, is_owner, email_verified) VALUES (?, ?, ?, 1, 1, 1)")
    .run(bootstrapUsername, bootstrapEmail, bcrypt.hashSync(bootstrapPassword, 12));
  console.warn(`Bootstrap admin created: ${bootstrapEmail} (change the default password immediately)`);
} else {
  db.prepare("UPDATE users SET is_admin = 1, is_owner = 1, email_verified = 1, username = COALESCE(username, ?) WHERE id = ?")
    .run(bootstrapUsername, existingBootstrap.id);
}

const app = express();
app.use(express.json({ limit: "256kb" }));
app.disable("x-powered-by");

const SESSION_DAYS = 30;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("base64url");
const cookieOptions = `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;

function setSession(res, userId) {
  const token = newToken();
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, Date.now() + SESSION_DAYS * 86400000);
  res.setHeader("Set-Cookie", `bp_session=${token}; ${cookieOptions}`);
}

function audit(actorId, targetId, action, details = "") {
  db.prepare("INSERT INTO audit_logs (actor_id, target_id, action, details) VALUES (?, ?, ?, ?)")
    .run(actorId, targetId, action, details);
}

function sessionUser(req) {
  const token = req.headers.cookie?.match(/(?:^|; )bp_session=([^;]+)/)?.[1];
  if (!token) return null;
  const row = db.prepare(`
    SELECT users.id, users.username, users.email, users.is_admin AS isAdmin, users.is_owner AS isOwner,
      users.email_verified AS emailVerified,
      users.disabled, users.last_login AS lastLogin FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.disabled = 0
  `).get(hashToken(token), Date.now());
  return row || null;
}

function requireUser(req, res, next) {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  req.user = user;
  next();
}

function validBudget(value) {
  return value && typeof value === "object" && value.sections && typeof value.sections === "object";
}

function validUsername(value) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(value);
}

function requireAdmin(req, res, next) {
  requireUser(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Administrator access required" });
    next();
  });
}

function requireOwner(req, res, next) {
  requireAdmin(req, res, () => {
    if (!req.user.isOwner) return res.status(403).json({ error: "Owner administrator access required" });
    next();
  });
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: Boolean(user.isAdmin ?? user.is_admin),
    isOwner: Boolean(user.isOwner ?? user.is_owner),
    emailVerified: Boolean(user.emailVerified ?? user.email_verified ?? true),
    disabled: Boolean(user.disabled),
    lastLogin: user.lastLogin ?? user.last_login ?? null,
  };
}

async function sendVerificationEmail(userId, email) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) {
    throw new Error("Set RESEND_API_KEY, RESEND_FROM_EMAIL, and APP_URL to enable email verification");
  }

  const token = newToken();
  const tokenHash = hashToken(token);
  const verificationUrl = new URL("/api/auth/verify-email", `${appUrl.replace(/\/+$/, "")}/`);
  verificationUrl.searchParams.set("token", token);
  db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(userId);
  db.prepare("INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(tokenHash, userId, Date.now() + 24 * 60 * 60 * 1000, Date.now());

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Verify your Budget Elite email",
        html: `<p>Verify your email address for Budget Elite:</p><p><a href="${verificationUrl.toString()}">Verify email address</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
        text: `Verify your Budget Elite email address: ${verificationUrl.toString()}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      const errorName = responseBody.name || responseBody.statusCode || "Resend error";
      const errorMessage = responseBody.message || "No error details returned";
      throw new Error(`${errorName} (HTTP ${response.status}): ${errorMessage}`);
    }
  } catch (error) {
    db.prepare("DELETE FROM email_verification_tokens WHERE token_hash = ?").run(tokenHash);
    throw error;
  }
}

async function trySendVerificationEmail(userId, email) {
  try {
    await sendVerificationEmail(userId, email);
    return true;
  } catch (error) {
    console.error(`Verification email delivery failed for user ${userId}: ${error.message}`);
    return false;
  }
}

function verificationResultUrl(result) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return null;
  const url = new URL(appUrl);
  url.searchParams.set("email_verification", result);
  return url.toString();
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/verify-email", (req, res) => {
  const resultUrl = (result) => verificationResultUrl(result);
  if (!resultUrl("invalid")) return res.status(503).send("Email verification is not configured.");

  const token = String(req.query?.token || "");
  if (token.length < 32 || token.length > 128) return res.redirect(303, resultUrl("invalid"));
  const row = db.prepare("SELECT user_id AS userId FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ?")
    .get(hashToken(token), Date.now());
  if (!row) return res.redirect(303, resultUrl("invalid"));

  db.transaction(() => {
    db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(row.userId);
    db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(row.userId);
    audit(null, row.userId, "email.verified");
  })();
  res.redirect(303, resultUrl("success"));
});

app.post("/api/auth/verification/resend", requireUser, async (req, res) => {
  if (req.user.emailVerified) return res.json({ sent: false, verified: true });
  const lastToken = db.prepare("SELECT created_at AS createdAt FROM email_verification_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(req.user.id);
  if (lastToken && Date.now() - lastToken.createdAt < 60000) {
    return res.status(429).json({ error: "Please wait a minute before requesting another verification email" });
  }

  if (!(await trySendVerificationEmail(req.user.id, req.user.email))) {
    return res.status(503).json({ error: "Could not send the verification email. Check the email service configuration and try again." });
  }
  res.json({ sent: true });
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!validUsername(username)) return res.status(400).json({ error: "Username must be 3-30 letters, numbers, or underscores" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  try {
    const result = db.prepare("INSERT INTO users (username, email, password_hash, budget_json, email_verified) VALUES (?, ?, ?, ?, 0)")
      .run(username, email, bcrypt.hashSync(password, 12), validBudget(req.body?.budget) ? JSON.stringify(req.body.budget) : null);
    setSession(res, result.lastInsertRowid);
    const verificationEmailSent = await trySendVerificationEmail(result.lastInsertRowid, email);
    res.status(201).json({
      user: publicUser({ id: result.lastInsertRowid, username, email, isAdmin: 0, isOwner: 0, emailVerified: 0 }),
      verificationEmailSent,
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return res.status(409).json({ error: "That username or email is already in use" });
    throw error;
  }
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = db.prepare("SELECT id, username, email, password_hash, is_admin AS isAdmin, is_owner AS isOwner, email_verified AS emailVerified, disabled FROM users WHERE email = ? OR username = ?").get(email, email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email or password is incorrect" });
  }
  if (user.disabled) return res.status(403).json({ error: "This account is disabled" });
  db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
  setSession(res, user.id);
  audit(user.id, user.id, "login");
  res.json({ user: publicUser({ ...user, lastLogin: new Date().toISOString() }) });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.cookie?.match(/(?:^|; )bp_session=([^;]+)/)?.[1];
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  res.setHeader("Set-Cookie", "bp_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
  res.status(204).end();
});

app.get("/api/auth/me", (req, res) => {
  const user = sessionUser(req);
  res.json({ user });
});

app.patch("/api/auth/account", requireUser, async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password === undefined ? null : String(req.body.password);
  if (!validUsername(username)) return res.status(400).json({ error: "Username must be 3-30 letters, numbers, or underscores" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password !== null && password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  const emailChanged = email !== req.user.email;
  const emailVerified = emailChanged ? 0 : Number(req.user.emailVerified);
  try {
    if (password === null) {
      db.prepare("UPDATE users SET username = ?, email = ?, email_verified = ? WHERE id = ?")
        .run(username, email, emailVerified, req.user.id);
    } else {
      db.prepare("UPDATE users SET username = ?, email = ?, email_verified = ?, password_hash = ? WHERE id = ?")
        .run(username, email, emailVerified, bcrypt.hashSync(password, 12), req.user.id);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return res.status(409).json({ error: "That username or email is already in use" });
    throw error;
  }
  if (emailChanged) db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(req.user.id);
  audit(req.user.id, req.user.id, "account.updated", "username/email/password");
  const verificationEmailSent = emailChanged ? await trySendVerificationEmail(req.user.id, email) : undefined;
  res.json({
    user: publicUser({ ...req.user, username, email, emailVerified }),
    ...(emailChanged ? { verificationEmailSent } : {}),
  });
});

app.get("/api/budget", requireUser, (req, res) => {
  const row = db.prepare("SELECT budget_json FROM users WHERE id = ?").get(req.user.id);
  res.json({ budget: row?.budget_json ? JSON.parse(row.budget_json) : null });
});

app.get("/api/admin/users", requireAdmin, (_req, res) => {
  const users = db.prepare("SELECT id, username, email, email_verified AS emailVerified, is_admin AS isAdmin, is_owner AS isOwner, disabled, last_login AS lastLogin, created_at FROM users ORDER BY id").all()
    .map(publicUser);
  res.json({ users });
});

app.get("/api/admin/audit", requireAdmin, (_req, res) => {
  const logs = db.prepare(`
    SELECT audit_logs.id, audit_logs.action, audit_logs.details, audit_logs.created_at AS createdAt,
      actor.username AS actorUsername, actor.email AS actorEmail,
      target.username AS targetUsername, target.email AS targetEmail
    FROM audit_logs
    LEFT JOIN users actor ON actor.id = audit_logs.actor_id
    LEFT JOIN users target ON target.id = audit_logs.target_id
    ORDER BY audit_logs.id DESC LIMIT 200
  `).all();
  res.json({ logs });
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!validUsername(username)) return res.status(400).json({ error: "Username must be 3-30 letters, numbers, or underscores" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  try {
    const result = db.prepare("INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)")
      .run(username, email, bcrypt.hashSync(password, 12));
    audit(req.user.id, result.lastInsertRowid, "admin.created", username);
    const verificationEmailSent = await trySendVerificationEmail(result.lastInsertRowid, email);
    res.status(201).json({
      user: publicUser({ id: result.lastInsertRowid, username, email, isAdmin: 1, isOwner: 0, emailVerified: 0 }),
      verificationEmailSent,
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return res.status(409).json({ error: "That username or email is already in use" });
    throw error;
  }
});

app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT id, username, email, email_verified AS emailVerified, is_admin AS isAdmin, is_owner AS isOwner, disabled FROM users WHERE id = ?").get(id);
  const isAdmin = req.body?.isAdmin === undefined ? Boolean(target?.isAdmin) : Boolean(req.body.isAdmin);
  const isOwner = req.body?.isOwner === undefined ? Boolean(target?.isOwner) : Boolean(req.body.isOwner);
  const disabled = req.body?.disabled === undefined ? Boolean(target?.disabled) : Boolean(req.body.disabled);
  const username = req.body?.username === undefined ? null : String(req.body.username).trim();
  const email = req.body?.email === undefined ? null : String(req.body.email).trim().toLowerCase();
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user id" });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.isAdmin && !req.user.isOwner) return res.status(403).json({ error: "Only the owner admin can manage other admins" });
  if (id === req.user.id && !isAdmin) return res.status(400).json({ error: "You cannot remove your own administrator access" });
  if (id === req.user.id && disabled) return res.status(400).json({ error: "You cannot disable your own account" });
  if (isOwner && !isAdmin) return res.status(400).json({ error: "An owner must remain an administrator" });
  if (isOwner && !req.user.isOwner) return res.status(403).json({ error: "Only the owner admin can promote an owner admin" });
  if (target.isOwner && !isOwner && db.prepare("SELECT COUNT(*) AS count FROM users WHERE is_owner = 1").get().count <= 1) {
    return res.status(400).json({ error: "You cannot remove the last owner admin" });
  }
  if (target.isAdmin && !isAdmin && db.prepare("SELECT COUNT(*) AS count FROM users WHERE is_admin = 1 AND disabled = 0").get().count <= 1) {
    return res.status(400).json({ error: "You cannot remove the last active admin" });
  }
  if (username !== null && !validUsername(username)) return res.status(400).json({ error: "Username must be 3-30 letters, numbers, or underscores" });
  if (email !== null && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  const nextUsername = username ?? target.username;
  const nextEmail = email ?? target.email;
  const emailChanged = nextEmail !== target.email;
  try {
    const result = db.prepare("UPDATE users SET is_admin = ?, is_owner = ?, disabled = ?, username = ?, email = ?, email_verified = ? WHERE id = ?")
      .run(isAdmin ? 1 : 0, isOwner ? 1 : 0, disabled ? 1 : 0, nextUsername, nextEmail, emailChanged ? 0 : Number(target.emailVerified), id);
    if (!result.changes) return res.status(404).json({ error: "User not found" });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return res.status(409).json({ error: "That username or email is already in use" });
    throw error;
  }
  if (emailChanged) {
    db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(id);
    await trySendVerificationEmail(id, nextEmail);
  }
  audit(req.user.id, id, "admin.user.updated", JSON.stringify({ isAdmin, isOwner, disabled, username, email }));
  res.status(204).end();
});

app.post("/api/admin/users/:id/password", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT is_admin AS isAdmin FROM users WHERE id = ?").get(id);
  const password = String(req.body?.password || "");
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.isAdmin && !req.user.isOwner) return res.status(403).json({ error: "Only the owner admin can manage other admins" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  audit(req.user.id, id, "admin.password.reset");
  res.status(204).end();
});

app.get("/api/admin/users/:id/budget", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT username, email, is_admin AS isAdmin, budget_json FROM users WHERE id = ?").get(id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.isAdmin && !req.user.isOwner && id !== req.user.id) return res.status(403).json({ error: "Only the owner admin can view other admin budgets" });
  audit(req.user.id, id, "admin.budget.exported");
  res.json({ user: { username: target.username, email: target.email }, budget: target.budget_json ? JSON.parse(target.budget_json) : null });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT is_admin AS isAdmin, is_owner AS isOwner FROM users WHERE id = ?").get(id);
  if (id === req.user.id) return res.status(400).json({ error: "You cannot delete your own account" });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.isAdmin && !req.user.isOwner) return res.status(403).json({ error: "Only the owner admin can manage other admins" });
  if (target.isAdmin && db.prepare("SELECT COUNT(*) AS count FROM users WHERE is_admin = 1 AND disabled = 0").get().count <= 1) return res.status(400).json({ error: "You cannot delete the last active admin" });
  audit(req.user.id, id, "admin.user.deleted", JSON.stringify({ username: target.username, email: target.email }));
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.status(204).end();
});

app.put("/api/budget", requireUser, (req, res) => {
  if (!validBudget(req.body?.budget)) return res.status(400).json({ error: "Invalid budget data" });
  db.prepare("UPDATE users SET budget_json = ? WHERE id = ?").run(JSON.stringify(req.body.budget), req.user.id);
  res.status(204).end();
});

app.post("/api/budget/captures", requireUser, (req, res) => {
  const capture = req.body?.capture;
  if (!capture || typeof capture !== "object") return res.status(400).json({ error: "Invalid capture data" });

  const row = db.prepare("SELECT budget_json FROM users WHERE id = ?").get(req.user.id);
  const budget = row?.budget_json ? JSON.parse(row.budget_json) : null;
  if (!validBudget(budget)) return res.status(400).json({ error: "Create a budget before capturing it" });

  const captures = Array.isArray(budget.captures) ? budget.captures : [];
  const nextBudget = { ...budget, captures: [...captures, capture].slice(-200) };
  db.prepare("UPDATE users SET budget_json = ? WHERE id = ?").run(JSON.stringify(nextBudget), req.user.id);
  res.status(201).json({ captures: nextBudget.captures });
});

app.delete("/api/budget/captures/:id", requireUser, (req, res) => {
  const row = db.prepare("SELECT budget_json FROM users WHERE id = ?").get(req.user.id);
  const budget = row?.budget_json ? JSON.parse(row.budget_json) : null;
  if (!validBudget(budget)) return res.status(400).json({ error: "No budget data found" });

  const captures = Array.isArray(budget.captures) ? budget.captures : [];
  const nextCaptures = captures.filter((capture) => capture.id !== req.params.id);
  if (nextCaptures.length === captures.length) return res.status(404).json({ error: "Capture not found" });

  const nextBudget = { ...budget, captures: nextCaptures };
  db.prepare("UPDATE users SET budget_json = ? WHERE id = ?").run(JSON.stringify(nextBudget), req.user.id);
  res.json({ captures: nextCaptures });
});

app.use((error, _req, res, next) => {
  void next;
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Budget API listening on port ${port}`));
