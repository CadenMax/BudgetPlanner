import { formatMoney } from "../utils/format";

const colorConfig = {
  green:  { card: "card-green",  glow: "text-emerald-400", bar: "bg-emerald-400", badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" },
  indigo: { card: "card-indigo", glow: "text-indigo-400",  bar: "bg-indigo-400",  badge: "bg-indigo-400/10 text-indigo-400 border border-indigo-400/20"   },
  orange: { card: "card-orange", glow: "text-orange-400",  bar: "bg-orange-400",  badge: "bg-orange-400/10 text-orange-400 border border-orange-400/20"   },
  rose:   { card: "card-rose",   glow: "text-rose-400",    bar: "bg-rose-400",    badge: "bg-rose-400/10 text-rose-400 border border-rose-400/20"         },
};

export function MetricCard({ label, value, hint, color = "green", icon, delay = "" }) {
  const c = colorConfig[color] || colorConfig.green;
  const negative = typeof value === "number" && value < 0;
  return (
    <div className={`glass ${c.card} rounded-2xl p-5 flex flex-col gap-2 fade-up ${delay}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
        {icon && <span className="text-xl opacity-70">{icon}</span>}
      </div>
      <div className={`mono text-2xl font-bold tracking-tight ${negative ? "text-rose-400" : c.glow}`}>
        {typeof value === "number" ? formatMoney(value) : value}
      </div>
      {hint && <div className="text-xs text-gray-600 truncate">{hint}</div>}
    </div>
  );
}

export function Field({ label, value, onChange, step = "0.01", type = "number", prefix }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm mono">{prefix}</span>
        )}
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          className={`input-dark ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-dark">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

export function SectionTable({ section, inputs, setInputs }) {
  const c = colorConfig[section.color] || colorConfig.green;
  const pct = section.total > 0 ? Math.min(100, (section.spent / section.total) * 100) : 0;
  const over = section.spent > section.total;
  const accentColor = section.color === "green" ? "#6ee7b7" : section.color === "indigo" ? "#818cf8" : "#fb923c";

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div>
          <h3 className={`text-base font-bold ${c.glow}`}>{section.title}</h3>
          <p className="text-xs text-gray-600 mt-0.5 mono">
            Budget {formatMoney(section.total)} · Spent {formatMoney(section.spent)} · Left {formatMoney(section.remaining)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-600 uppercase tracking-widest">Used</div>
            <div className={`mono text-sm font-bold ${over ? "text-rose-400" : c.glow}`}>{pct.toFixed(0)}%</div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${over ? "bg-rose-400/10 text-rose-400 border border-rose-400/20" : c.badge}`}>
            {over ? "⚠ Over" : "On track"}
          </span>
        </div>
      </div>
      <div className="h-0.5 bg-white/5">
        <div
          className="h-0.5 transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? "#f87171" : `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Item", "Input", "Calculated", "Account", "Note"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => {
              const editable = item.mode === "fixed" || item.mode === "pctOfCategory";
              return (
                <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-300">{item.label}</td>
                  <td className="px-5 py-3">
                    {editable ? (
                      <input
                        type="number"
                        step="0.01"
                        value={inputs[item.id]}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                        className="input-dark w-28 text-right"
                      />
                    ) : (
                      <span className="text-gray-700 text-xs">auto</span>
                    )}
                  </td>
                  <td className={`px-5 py-3 mono font-bold ${c.glow}`}>{formatMoney(item.computed)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-gray-400">{item.account}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600 max-w-xs">{item.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
