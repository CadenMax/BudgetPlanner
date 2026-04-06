import { taxTables, whmTable } from "../data/taxTables";
import { formatMoney, formatPct } from "../utils/format";
import { Select } from "../components/ui";

export default function LookupTables({ model }) {
  const table = taxTables[model.taxProfile];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

      {/* Left column */}
      <div className="flex flex-col gap-5">
        {/* Selector */}
        <div className="glass rounded-2xl p-6 fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white-500 mb-4">Select Table</h2>
          <Select
            label="Tax Table"
            value={model.taxProfile}
            onChange={model.setTaxProfile}
            options={Object.keys(taxTables)}
          />
          <div className="mt-4 rounded-xl px-4 py-3 text-xs text-indigo-300/70 leading-relaxed" style={{
            background: "rgba(129,140,248,0.05)",
            border: "1px solid rgba(129,140,248,0.15)"
          }}>
            NAT1005-style: floor income → find last matching row → apply rate/base formula.
          </div>
        </div>

        {/* Active table */}
        <div className="glass rounded-2xl overflow-hidden fade-up fade-up-1">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm">{model.taxProfile}</h3>
              <p className="text-xs text-white-600 mt-0.5">{table.length} rows</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{
              background: "rgba(129,140,248,0.1)",
              border: "1px solid rgba(129,140,248,0.2)",
              color: "#818cf8"
            }}>Active</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Threshold", "Rate", "Base"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-white-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-2.5 mono text-white-400">{formatMoney(row.threshold)}</td>
                    <td className="px-5 py-2.5 mono font-bold text-indigo-400">{formatPct(row.rate)}</td>
                    <td className="px-5 py-2.5 mono text-white-400">{formatMoney(row.base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right column — WHM table + all tables overview */}
      <div className="flex flex-col gap-5">
        {/* WHM table */}
        <div className="glass rounded-2xl overflow-hidden fade-up fade-up-2">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-bold text-orange-400 text-sm">WHM Reference Table</h3>
            <p className="text-xs text-white-600 mt-0.5">Working Holiday Maker annual brackets</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["From", "To", "Rate"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-white-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whmTable.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-2.5 mono text-white-400">{formatMoney(row.min)}</td>
                    <td className="px-5 py-2.5 mono text-white-400">{formatMoney(row.max)}</td>
                    <td className="px-5 py-2.5 mono font-bold text-orange-400">{formatPct(row.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All available tables list */}
        <div className="glass rounded-2xl p-5 fade-up fade-up-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white-500 mb-3">All Available Tables</h3>
          <div className="flex flex-col gap-1">
            {Object.entries(taxTables).map(([name, rows]) => (
              <button
                key={name}
                onClick={() => model.setTaxProfile(name)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all btn-glow"
                style={{
                  background: model.taxProfile === name ? "rgba(129,140,248,0.1)" : "transparent",
                  border: `1px solid ${model.taxProfile === name ? "rgba(129,140,248,0.2)" : "transparent"}`,
                }}
              >
                <span className={`text-sm ${model.taxProfile === name ? "text-indigo-400 font-semibold" : "text-white-500 hover:text-white-300"}`}>
                  {name}
                </span>
                <span className="text-xs text-white-700 mono">{rows.length}r</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
