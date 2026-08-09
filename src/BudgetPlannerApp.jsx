import { useState } from "react";
import { useBudgetModel } from "./hooks/useBudgetModel";
import Dashboard from "./pages/Dashboard";
import TaxCalculator from "./pages/TaxCalculator";
import LookupTables from "./pages/LookupTables";
import { formatMoney } from "./utils/format";
import {
  LayoutDashboard,
  Calculator,
  BookSearch
} from "lucide-react";

const tabs = [
  { key: "dashboard", label: "Dashboard",       icon: <LayoutDashboard size={18} /> },
  { key: "tax",       label: "Tax Calculator",  icon: <Calculator size={18} /> },
  { key: "tables",    label: "Lookup Tables",   icon: <BookSearch size={18} /> },
];

export default function BudgetPlannerApp() {
  const model = useBudgetModel();
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app-bg min-h-screen">
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8 pb-0">

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{
                background: "linear-gradient(135deg, #f0f0f8 0%, #6ee7b7 50%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Budget Elite
              </h1>
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
          <nav className="flex flex-wrap gap-1.5 pb-1 sm:flex-nowrap sm:overflow-visible">
            {tabs.map(({ key, label, icon }) => (
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
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        {tab === "dashboard" && <Dashboard model={model} />}
        {tab === "tax"       && <TaxCalculator model={model} />}
        {tab === "tables"    && <LookupTables model={model} />}
      </main>
    </div>
  );
}
