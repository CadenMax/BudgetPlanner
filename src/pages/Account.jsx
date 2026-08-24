import { useState } from "react";

const inputClass = "input-dark w-full";

export default function Account({ model }) {
  const [username, setUsername] = useState(model.user.username || "");
  const [email, setEmail] = useState(model.user.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await model.updateAccount({ username, email, ...(password ? { password } : {}) });
      setPassword("");
      setMessage("Account details updated.");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div><h2 className="text-2xl font-bold text-white">Your account</h2><p className="mt-1 text-sm text-white/40">Update your sign-in details.</p></div>
      <form onSubmit={submit} className="glass flex flex-col gap-4 rounded-2xl p-6">
        <label className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-widest text-white/50">Username</span><input className={inputClass} pattern="[A-Za-z0-9_]{3,30}" minLength={3} maxLength={30} required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-widest text-white/50">Email</span><input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-widest text-white/50">New password</span><input className={inputClass} type="password" minLength={8} placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="self-start rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Save account details</button>
      </form>
    </div>
  );
}
