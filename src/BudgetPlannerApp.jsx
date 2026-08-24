import { useState } from "react";
import { useBudgetModel } from "./hooks/useBudgetModel";
import Dashboard from "./pages/Dashboard";
import TaxCalculator from "./pages/TaxCalculator";
import LookupTables from "./pages/LookupTables";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import AuthScreen from "./pages/AuthScreen";
import { formatMoney } from "./utils/format";
import {
  LayoutDashboard,
  Calculator,
  BookSearch,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const tabs = [
  { key: "dashboard", label: "Dashboard",       icon: <LayoutDashboard size={18} /> },
  { key: "tax",       label: "Tax Calculator",  icon: <Calculator size={18} /> },
  { key: "tables",    label: "Lookup Tables",   icon: <BookSearch size={18} /> },
];

export default function BudgetPlannerApp() {
  const model = useBudgetModel();
  const [tab, setTab] = useState("dashboard");
  const visibleTabs = model.user?.isAdmin
    ? [...tabs, { key: "account", label: "Account", icon: <UserRound size={18} /> }, { key: "admin", label: "Admin", icon: <ShieldCheck size={18} /> }]
    : [...tabs, { key: "account", label: "Account", icon: <UserRound size={18} /> }];

  if (model.authLoading) {
    return <div className="app-bg flex min-h-screen items-center justify-center text-sm text-white/50">Loading your budget...</div>;
  }

  if (!model.user) return <AuthScreen model={model} />;

  return (
    <div className="app-bg min-h-screen">
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8 pb-0">

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{
                background: "linear-gradient(135deg, #f0f0f8 0%, #6ee7b7 50%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Budget Elite
              </h1>
              <div className="glass-bright flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-emerald-300/80">
                <UserRound size={14} />
                <span className="max-w-[180px] truncate">{model.user.username}</span>
              </div>
              <button
                type="button"
                onClick={model.logout}
                className="btn-glow rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs font-semibold text-rose-300/80 hover:border-rose-400/40 hover:text-rose-200"
              >
                Sign out
              </button>
            </div>

            {/* Live stats pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Gross", value: model.grossIncome, color: "#818cf8" },
                { label: "PAYG",  value: model.payg,        color: "#fb923c" },
                { label: "Net",   value: model.netPay,      color: "#6ee7b7" },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-bright rounded-xl px-4 py-2.5 text-center min-w-[100px] btn-glow" style={{ borderColor: `${color}22` }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: `${color}99` }}>{label}</div>
                  <div className="mono text-sm font-bold" style={{ color }}>
                    {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <nav className="desktop-tabs hidden flex-wrap gap-1.5 pb-1 sm:flex sm:flex-nowrap sm:overflow-visible">
            {visibleTabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`btn-glow flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-semibold rounded-t-xl transition-all sm:flex-none sm:justify-start sm:px-4 sm:text-sm md:px-5 ${
                  tab === key
                    ? "tab-active"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
                style={tab === key ? { borderBottom: "2px solid #6ee7b7" } : { borderBottom: "2px solid transparent" }}
              >
                <span className="shrink-0 text-base">{icon}</span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
          <label className="mobile-nav">
            <span className="sr-only">Navigate to</span>
            <select className="input-dark" value={tab} onChange={(event) => setTab(event.target.value)}>
              {visibleTabs.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        {tab === "dashboard" && <Dashboard model={model} />}
        {tab === "tax"       && <TaxCalculator model={model} />}
        {tab === "tables"    && <LookupTables model={model} />}
        {tab === "account"   && <Account model={model} />}
        {tab === "admin"     && model.user?.isAdmin && <Admin model={model} />}
      </main>
    </div>
  );
}
