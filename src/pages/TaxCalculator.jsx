import { taxTables } from "../data/taxTables";
import { formatMoney, formatPct } from "../utils/format";
import { Field, Select } from "../components/ui";

export default function TaxCalculator({ model }) {
  const effectiveRate = model.grossIncome > 0 ? (model.payg / model.grossIncome) * 100 : 0;
  const takeHomeRate = model.grossIncome > 0 ? (model.netPay / model.grossIncome) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

      {/* Left — inputs + results */}
      <div className="flex flex-col gap-5">
        <div className="glass rounded-2xl p-6 flex flex-col gap-5 fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-widest ">Your Details</h2>
          <Field label="Weekly hours" value={model.hoursWorked} onChange={model.setHoursWorked} step="0.5" />
          <Field label="Hourly rate"  value={model.hourlyRate}  onChange={model.setHourlyRate} />
          <Field label="Extra income" value={model.extraIncome} onChange={model.setExtraIncome} />
          <Select
            label="Tax profile"
            value={model.taxProfile}
            onChange={model.setTaxProfile}
            options={Object.keys(taxTables)}
          />
        </div>

        {/* Dark result panel */}
        <div className="rounded-2xl overflow-hidden fade-up fade-up-1" style={{
          background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)",
          border: "1px solid rgba(110,231,183,0.15)",
          boxShadow: "0 0 40px rgba(110,231,183,0.05)"
        }}>
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="text-xs uppercase tracking-widest text-white-500 mb-1">Weekly Gross</div>
            <div className="mono text-4xl font-bold text-white-">{formatMoney(model.grossIncome)}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/5">
            <div className="px-6 py-4">
              <div className="text-xs uppercase tracking-widest text-white-500 mb-1">PAYG Withheld</div>
              <div className="mono text-2xl font-bold text-rose-400">{formatMoney(model.payg)}</div>
              <div className="mono text-xs text-rose-400/60 mt-0.5">{effectiveRate.toFixed(1)}% effective</div>
            </div>
            <div className="px-6 py-4">
              <div className="text-xs uppercase tracking-widest text-white-500 mb-1">Net Pay</div>
              <div className="mono text-2xl font-bold text-emerald-400">{formatMoney(model.netPay)}</div>
              <div className="mono text-xs text-emerald-400/60 mt-0.5">{takeHomeRate.toFixed(1)}% take-home</div>
            </div>
          </div>
          {/* Take-home bar */}
          <div className="px-6 pb-5">
            <div className="h-2 rounded-full bg-white/5 overflow-hidden mt-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${takeHomeRate}%`,
                  background: "linear-gradient(90deg, #6ee7b7, #34d399)",
                  boxShadow: "0 0 8px rgba(110,231,183,0.5)"
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white-600 mt-1.5">
              <span>Tax</span>
              <span>Take-home {takeHomeRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — info + annualised */}
      <div className="flex flex-col gap-5">
        {/* Method */}
        <div className="glass rounded-2xl p-6 fade-up fade-up-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white-500 mb-3">Calculation Method</h2>
          <p className="text-sm text-white-400 leading-relaxed mb-4">
            Uses the ATO NAT1005 weekly lookup: truncate income, find the last matching threshold row, then apply:
          </p>
          <div className="rounded-xl font-mono text-sm px-5 py-4 text-emerald-300" style={{
            background: "rgba(110,231,183,0.05)",
            border: "1px solid rgba(110,231,183,0.15)"
          }}>
            ROUND((income + 0.99) × rate − base, 0)
          </div>
        </div>

        {/* ATO note */}
        <div className="rounded-2xl p-5 fade-up fade-up-3" style={{
          background: "rgba(251,146,60,0.05)",
          border: "1px solid rgba(251,146,60,0.15)"
        }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">ATO Note</div>
          <p className="text-sm text-orange-200/60 leading-relaxed">
            Weekly tax table applies from 1 July 2025 and continues after the 24 September 2026 update.
          </p>
        </div>

        {/* Annualised */}
        <div className="glass rounded-2xl p-6 fade-up fade-up-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white-500 mb-4">Annualised Estimates</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Gross",  value: model.grossIncome * 52, color: "text-indigo-400" },
              { label: "PAYG",   value: model.payg * 52,        color: "text-rose-400"   },
              { label: "Net",    value: model.netPay * 52,      color: "text-emerald-400"},
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs text-white-600 uppercase tracking-widest">{label}</div>
                <div className={`mono text-sm font-bold mt-1 ${color}`}>
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value)}
                </div>
                <div className="text-xs text-white-700 mt-0.5">/ yr</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="glass rounded-2xl p-6 fade-up fade-up-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white-500 mb-4">Per Period Breakdown</h2>
          <div className="flex flex-col gap-2">
            {[
              { period: "Weekly",     factor: 1    },
              { period: "Fortnightly",factor: 2    },
              { period: "Monthly",    factor: 52/12},
              { period: "Annually",   factor: 52   },
            ].map(({ period, factor }) => (
              <div key={period} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white-500">{period}</span>
                <div className="flex gap-6 text-right">
                  <div>
                    <div className="text-xs text-white-700">Gross</div>
                    <div className="mono text-sm text-white-300">{formatMoney(model.grossIncome * factor)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white-700">Net</div>
                    <div className="mono text-sm text-emerald-400">{formatMoney(model.netPay * factor)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
