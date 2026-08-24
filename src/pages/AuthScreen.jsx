import { useState } from "react";

export default function AuthScreen({ model }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await (mode === "login" ? model.login(email, password) : model.register(username, email, password));
    } catch (error) {
      model.setAuthError?.(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <div className="glass w-full rounded-2xl p-6">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-emerald-300">Budget Elite</h1>
        <p className="mb-6 text-sm text-white/50">{mode === "login" ? "Sign in to access your budget." : "Create an account for your budget."}</p>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {mode === "register" && <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Username</span>
            <input className="input-dark" type="text" autoComplete="username" pattern="[A-Za-z0-9_]{3,30}" minLength={3} maxLength={30} required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>}
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Email</span>
            <input className="input-dark" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Password</span>
            <input className="input-dark" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {model.authError && <p className="text-sm text-rose-300">{model.authError}</p>}
          <button className="btn-glow rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300" disabled={busy}>
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button className="mt-5 text-sm text-white/50 hover:text-white/80" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); model.setAuthError?.(""); }}>
          {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
