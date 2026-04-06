import React from "react";
import { formatMoney } from "../utils/format";

const colorConfig = {
  green: { card: "card-green", glow: "text-emerald-400", badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" },
  indigo: { card: "card-indigo", glow: "text-indigo-400", badge: "bg-indigo-400/10 text-indigo-400 border border-indigo-400/20" },
  orange: { card: "card-orange", glow: "text-orange-400", badge: "bg-orange-400/10 text-orange-400 border border-orange-400/20" },
  rose: { card: "card-rose", glow: "text-rose-400", badge: "bg-rose-400/10 text-rose-400 border border-rose-400/20" },
};

export function MetricCard({ label, value, hint, color = "green", icon, delay = "" }) {
  const c = colorConfig[color] || colorConfig.green;
  const isNumber = typeof value === "number";
  const safeValue = isNumber ? Number(value.toFixed(2)) : value;
  const isZero = isNumber && Math.abs(safeValue) < 0.005;
  const negative = isNumber && safeValue < 0 && !isZero;
  return (
    <div className={`glass ${c.card} rounded-2xl p-5 flex flex-col gap-2 fade-up ${delay}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
        {icon && <span className="text-xl opacity-70">{icon}</span>}
      </div>
      <div className={`mono text-2xl font-bold tracking-tight ${negative ? "text-rose-400" : c.glow}`}>
        {isNumber
          ? isZero
            ? "$0.00"
            : formatMoney(safeValue)
          : value}
      </div>
      {hint && <div className="text-xs text-white/40 truncate">{hint}</div>}
    </div>
  );
}

// Shared focus-select input logic
function NumericInput({ value, onChange, className = "" }) {
  const [localValue, setLocalValue] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setLocalValue(String(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? localValue : String(value)}
      onFocus={(e) => { setFocused(true); e.target.select(); }}
      onChange={(e) => {
        setLocalValue(e.target.value);
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseFloat(localValue);
        const final = isNaN(parsed) ? 0 : parsed;
        onChange(final);
        setLocalValue(String(final));
      }}
      className={`input-dark ${className}`}
    />
  );
}

export function Field({ label, value, onChange, type = "number", prefix }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm mono">{prefix}</span>
        )}
        <NumericInput value={value} onChange={onChange} className={prefix ? "pl-7" : ""} />
      </div>
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-dark">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

// ── Add-item inline form ────────────────────────────────────────────────────
function AddItemForm({ sectionKey, onAdd, onCancel, accentColor }) {
  const [label, setLabel] = React.useState("");
  const [mode, setMode] = React.useState("fixed");
  const [value, setValue] = React.useState(0);
  const [account, setAccount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isFreeloader, setIsFreeloader] = React.useState(false);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({
      id: `custom_${Date.now()}`,
      label: label.trim(),
      mode,
      value: Number(value),
      account: account.trim() || "Float",
      note: note.trim(),
      isFreeloader,
    });
  };

  const inputCls = "input-dark w-full";

  return (
    <tr>
      <td colSpan={6} className="px-5 py-4">
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accentColor}33` }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">New Item</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="text-xs text-white/30 mb-1">Label *</div>
              <input className={inputCls} placeholder="e.g. Netflix" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Account</div>
              <input className={inputCls} placeholder="Float" value={account} onChange={(e) => setAccount(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Note</div>
              <input className={inputCls} placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-end">
            <div>
              <div className="text-xs text-white/30 mb-1">Type</div>
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                {["fixed", "pctOfCategory"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${mode === m ? "text-white" : "text-white/30 hover:text-white/60"}`}
                    style={{ background: mode === m ? accentColor + "33" : "transparent" }}
                  >
                    {m === "fixed" ? "$ Fixed" : "% of budget"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">{mode === "fixed" ? "Amount ($)" : "Percentage (e.g. 0.1 = 10%)"}</div>
              <NumericInput value={value} onChange={setValue} />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={isFreeloader} onChange={setIsFreeloader} accentColor={accentColor} />
              <span className="text-xs text-white/50">Freeloader item</span>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button onClick={onCancel} className="px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!label.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-30"
                style={{ background: accentColor + "22", border: `1px solid ${accentColor}44`, color: accentColor }}
              >
                Add item
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, accentColor }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
      style={{
        background: checked ? accentColor + "33" : "rgba(255,255,255,0.05)",
        border: `1px solid ${checked ? accentColor : "rgba(255,255,255,0.15)"}`,
        boxShadow: checked ? `0 0 6px ${accentColor}55` : "none",
      }}
    >
      {checked && <span style={{ color: accentColor, fontSize: 11, lineHeight: 1 }}>✓</span>}
    </button>
  );
}

// ── Section Table ────────────────────────────────────────────────────────────
export function SectionTable({ section, onUpdateItem, onRemoveItem, onAddItem }) {
  const c = colorConfig[section.color] || colorConfig.green;
  const pct = section.total > 0 ? Math.min(100, (section.spent / section.total) * 100) : 0;
  const over = section.spent > section.total;
  const accentColor = section.color === "green" ? "#6ee7b7" : section.color === "indigo" ? "#818cf8" : "#fb923c";
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleAdd = (newItem) => {
    onAddItem(section.sectionKey, newItem);
    setShowAddForm(false);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div>
          <h3 className={`text-base font-bold ${c.glow}`}>{section.title}</h3>
          <p className="text-xs text-white/40 mt-0.5 mono">
            Budget {formatMoney(section.total)} · Spent {formatMoney(section.spent)} · Left {formatMoney(section.remaining)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-xs text-white/40 uppercase tracking-widest">Used</div>
            <div className={`mono text-sm font-bold ${over ? "text-rose-400" : c.glow}`}>{pct.toFixed(0)}%</div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${over ? "bg-rose-400/10 text-rose-400 border border-rose-400/20" : c.badge}`}>
            {over ? "⚠ Over" : "On track"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-0.5 transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? "#f87171" : `linear-gradient(90deg, ${accentColor}, transparent)` }} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Item", "Type", "Value", "Calculated", "Account", "Freeloader", "Notes"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-white/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">

                {/* Label */}
                <td className="px-5 py-3 font-medium text-white/80 min-w-[140px]">
                  <input
                    className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 outline-none w-full text-white/80 transition-colors"
                    value={item.label}
                    onChange={(e) => onUpdateItem(section.sectionKey, item.id, { label: e.target.value })}
                  />
                </td>

                {/* Mode toggle */}
                <td className="px-5 py-3">
                  <div className="flex rounded-lg overflow-hidden border border-white/10 w-fit">
                    {["fixed", "pctOfCategory"].map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          // Convert value sensibly when switching modes
                          const newValue = m === "pctOfCategory"
                            ? Math.min(1, parseFloat((item.value / (section.total || 1)).toFixed(3)))
                            : parseFloat((item.computed || 0).toFixed(2));
                          onUpdateItem(section.sectionKey, item.id, { mode: m, value: newValue });
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold transition-colors ${item.mode === m ? "text-white" : "text-white/30 hover:text-white/60"}`}
                        style={{ background: item.mode === m ? accentColor + "33" : "transparent" }}
                        title={m === "fixed" ? "Fixed dollar amount" : "Percentage of budget"}
                      >
                        {m === "fixed" ? "$" : "%"}
                      </button>
                    ))}
                  </div>
                </td>

                {/* Value input */}
                <td className="px-5 py-3">
                  <NumericInput
                    value={item.value}
                    onChange={(val) => onUpdateItem(section.sectionKey, item.id, { value: val })}
                    className="w-24 text-left"
                  />
                </td>

                {/* Calculated */}
                <td className={`px-5 py-3 mono font-bold ${c.glow}`}>{formatMoney(item.computed)}</td>

                {/* Account */}
                <td className="px-5 py-3">
                  <input
                    className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 outline-none text-xs w-24 transition-colors"
                    value={item.account}
                    onChange={(e) => onUpdateItem(section.sectionKey, item.id, { account: e.target.value })}
                  />
                </td>

                {/* Freeloader checkbox */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!item.isFreeloader}
                      onChange={(val) => onUpdateItem(section.sectionKey, item.id, { isFreeloader: val })}
                      accentColor={accentColor}
                    />
                  </div>
                </td>

                <td className="px-5 py-3 font-medium text-white-80 min-w-[140px]">
                  {item.note !== undefined && (
                    <input
                      className="mt-1 text-xs bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 outline-none w-full transition-colors"
                      value={item.note}
                      placeholder="Add note..."
                      onChange={(e) =>
                        onUpdateItem(section.sectionKey, item.id, { note: e.target.value })
                      }
                    />
                  )}                  
                </td>

                {/* Remove */}
                <td className="px-5 py-3">
                  <button
                    onClick={() => onRemoveItem(section.sectionKey, item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-rose-400 text-lg leading-none"
                    title="Remove item"
                  >×</button>
                </td>
              </tr>
            ))}

            {/* Add form or add button */}
            {showAddForm
              ? <AddItemForm sectionKey={section.sectionKey} onAdd={handleAdd} onCancel={() => setShowAddForm(false)} accentColor={accentColor} />
              : (
                <tr>
                  <td colSpan={7} className="px-5 py-3">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 text-xs font-semibold transition-colors hover:text-white/70"
                      style={{ color: accentColor + "99" }}
                    >
                      <span className="text-base leading-none">+</span> Add item
                    </button>
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
