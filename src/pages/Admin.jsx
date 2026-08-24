import { useEffect, useState } from "react";

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body;
}

const inputClass = "input-dark w-full";

export default function Admin({ model }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "" });

  const loadUsers = async () => setUsers((await request("/api/admin/users")).users);

  useEffect(() => {
    Promise.all([loadUsers(), request("/api/admin/audit").then((result) => setLogs(result.logs))])
      .catch((err) => setError(err.message));
  }, []);

  const createAdmin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await request("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ username: "", email: "", password: "" });
      setMessage("Administrator created.");
      await loadUsers();
      const result = await request("/api/admin/audit");
      setLogs(result.logs);
    } catch (err) { setError(err.message); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.username || user.email}?`)) return;
    setError("");
    try { await request(`/api/admin/users/${user.id}`, { method: "DELETE" }); await loadUsers(); }
    catch (err) { setError(err.message); }
  };

  const toggleAdmin = async (user) => {
    setError("");
    setMessage("");
    try {
      await request(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      setMessage(user.isAdmin ? `${user.username || user.email} is no longer an admin.` : `${user.username || user.email} is now an admin.`);
      await loadUsers();
      setLogs((await request("/api/admin/audit")).logs);
    } catch (err) { setError(err.message); }
  };

  const saveUser = async (user) => {
    setError("");
    try {
      await request(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ ...editForm, isAdmin: user.isAdmin, isOwner: user.isOwner }) });
      setEditingId(null);
      setMessage("Account details updated.");
      await loadUsers();
      setEditForm({ username: "", email: "" });
    } catch (err) { setError(err.message); }
  };

  const resetPassword = async (user) => {
    const password = window.prompt(`New password for ${user.username || user.email} (8+ characters):`);
    if (!password) return;
    try {
      await request(`/api/admin/users/${user.id}/password`, { method: "POST", body: JSON.stringify({ password }) });
      setMessage("Password reset and existing sessions revoked.");
    } catch (err) { setError(err.message); }
  };

  const exportBudget = async (user) => {
    try {
      const result = await request(`/api/admin/users/${user.id}/budget`);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
      link.download = `${user.username || "user"}-budget-backup.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) { setError(err.message); }
  };

  const visibleUsers = users.filter((user) => {
    const matchesQuery = `${user.username || ""} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "all" || (filter === "admins" && user.isAdmin) || (filter === "locked" && user.disabled));
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Administration</h2>
        <p className="mt-1 text-sm text-white/40">Manage administrator accounts and users.</p>
      </div>
      <section className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-base font-bold text-white/80">Create administrator</h3>
        <form onSubmit={createAdmin} className="grid gap-3 sm:grid-cols-4">
          <input className={inputClass} placeholder="Username" pattern="[A-Za-z0-9_]{3,30}" minLength={3} maxLength={30} required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className={inputClass} type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} type="password" placeholder="Temporary password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Create admin</button>
        </form>
        {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
      <section className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-3 border-b border-white/5 px-5 py-4">
          <h3 className="mr-auto text-base font-bold text-white/80">Accounts</h3>
          <input className="input-dark max-w-xs" placeholder="Search username or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input-dark w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="admins">Admins</option><option value="locked">Locked</option></select>
        </div>
        <div className="divide-y divide-white/5">
          {visibleUsers.map((user) => <div key={user.id} className="admin-user-row flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            {editingId === user.id ? <div className="admin-user-edit grid min-w-0 flex-1 gap-2 sm:grid-cols-2"><input className={inputClass} value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} /><input className={inputClass} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div> : <div className="admin-user-details min-w-0"><div className="font-semibold text-white/80">{user.username || "No username"} {user.isAdmin && <span className="ml-2 rounded bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">Admin</span>}</div><div className="break-all text-sm text-white/40">{user.email}</div></div>}
            <div className="admin-user-status w-full text-xs text-white/30 sm:w-auto">{user.disabled ? "Locked" : "Active"} · Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</div>
            <div className="admin-user-actions flex flex-wrap gap-2">
              <button onClick={() => exportBudget(user)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5">Export</button>
              <button onClick={() => resetPassword(user)} className="rounded-lg border border-orange-400/20 px-3 py-2 text-xs text-orange-300 hover:bg-orange-400/10">Reset password</button>
              <button onClick={() => request(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ disabled: !user.disabled, isAdmin: user.isAdmin, isOwner: user.isOwner }) }).then(loadUsers).catch((err) => setError(err.message))} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs text-yellow-300 hover:bg-yellow-400/10">{user.disabled ? "Unlock" : "Lock"}</button>
              {editingId === user.id ? <><button onClick={() => saveUser(user)} className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-emerald-300">Save</button><button onClick={() => setEditingId(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50">Cancel</button></> : <button onClick={() => { setEditingId(user.id); setEditForm({ username: user.username || "", email: user.email }); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5">Edit</button>}
              <button onClick={() => toggleAdmin(user)} className="rounded-lg border border-indigo-400/20 px-3 py-2 text-xs text-indigo-300 hover:bg-indigo-400/10">
                {user.isAdmin ? "Remove admin" : "Make admin"}
              </button>
              {model.user.isOwner && <button onClick={() => request(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ isAdmin: true, isOwner: !user.isOwner }) }).then(loadUsers).catch((err) => setError(err.message))} className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-400/10">{user.isOwner ? "Remove owner" : "Make owner"}</button>}
              <button onClick={() => deleteUser(user)} className="rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10">Delete</button>
            </div>
          </div>)}
        </div>
      </section>
      <section className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-white/5 px-5 py-4"><h3 className="text-base font-bold text-white/80">Recent activity</h3></div>
        <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
          {logs.map((log) => <div key={log.id} className="px-5 py-3 text-sm"><span className="text-white/70">{log.action}</span><span className="ml-2 text-white/40">{log.targetUsername || log.targetEmail || "account"}</span><div className="text-xs text-white/30">{log.createdAt} by {log.actorUsername || log.actorEmail || "system"}</div></div>)}
        </div>
      </section>
    </div>
  );
}
