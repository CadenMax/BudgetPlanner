import { useRef } from "react";
import { MetricCard, Field, SectionTable, AccountSummary } from "../components/ui";


export default function Dashboard({ model }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const payload = model.exportBudgetData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-elite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const ok = model.importBudgetData(parsed);
      if (!ok) {
        alert("That file does not look like a valid Budget Elite backup.");
      }
    } catch {
      alert("That file could not be read. Please choose a valid JSON backup.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-8">

      {/* Inputs + income summary — side by side */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Inputs */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5 fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Income Inputs</h2>
          <Field label="Hours worked / week" value={model.hoursWorked} onChange={model.setHoursWorked} step="0.5" />
          <Field label="Hourly rate" value={model.hourlyRate} onChange={model.setHourlyRate} />
          <Field label="Non-taxable income" value={model.nonTaxableIncome} onChange={model.setNonTaxableIncome} />

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Leftover destination</span>
            <select
              className="input-dark"
              value={model.leftoverDestination}
              onChange={(e) => model.setLeftoverDestination(e.target.value)}
            >
              <option value="None">None</option>
              {model.leftoverAccountOptions.map((account) => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/50">Freeloader feature</div>
              <div className="text-xs text-white/40">Enable/disable freeloader logic globally</div>
            </div>
            <button
              type="button"
              onClick={() => model.setFreeloaderEnabled(!model.freeloaderEnabled)}
              className="freeloader-toggle"
              style={{
                background: model.freeloaderEnabled ? "rgba(16, 185, 129, 0.9)" : "rgba(255,255,255,0.08)",
              }}
              aria-label="Toggle freeloader feature"
            >
              <span
                className="freeloader-toggle-knob"
                style={{
                  transform: model.freeloaderEnabled ? "translateX(18px)" : "translateX(2px)",
                }}
              />
            </button>
          </label>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Backup & restore</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="btn-glow rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-glow rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300"
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Income summary grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 fade-up">Income Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Gross income" value={model.grossIncome} hint="Hours × rate + non-taxable" color="indigo" delay="fade-up-1" />
            <MetricCard label="PAYG withheld" value={model.payg} hint={model.taxProfile} color="orange" delay="fade-up-2" />
          </div>
          <MetricCard label="Net pay" value={model.netPay} hint="Take-home after tax" color="green" delay="fade-up-3" />

          {/* 50/30/20 visual split */}
          <div className="glass rounded-2xl p-4 fade-up fade-up-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">50 / 30 / 20 Split</div>
            <div className="flex rounded-lg overflow-hidden h-3 gap-0.5">
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: "50%" }} title="Needs 50%" />
              <div className="bg-indigo-500 transition-all duration-700" style={{ width: "30%" }} title="Wants 30%" />
              <div className="bg-orange-500 transition-all duration-700" style={{ width: "20%" }} title="Savings 20%" />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-500">Needs 50%</span>
              <span className="text-indigo-400">Wants 30%</span>
              <span className="text-orange-400">Savings 20%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budgets remaining — 3 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 fade-up">Budget Allocations</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Needs budget"   value={model.needsBudget}   hint="50% of net pay" color="green" delay="fade-up-1" />
          <MetricCard label="Wants budget"   value={model.wantsBudget}   hint="30% of net pay" color="indigo" delay="fade-up-2" />
          <MetricCard label="Savings budget" value={model.savingsBudget} hint="20% of net pay" color="orange" delay="fade-up-3" />
        </div>
      </div>

      {/* Remaining — 3 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 fade-up">Remaining After Expenses</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Needs remaining"   value={model.needsRemaining}   color="green"  delay="fade-up-1" />
          <MetricCard label="Wants remaining"   value={model.wantsRemaining}   color="indigo" delay="fade-up-2" />
          <MetricCard label="Savings remaining" value={model.savingsRemaining} color="orange" delay="fade-up-3" />
        </div>
      </div>

      {/* Freed capital — 2 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 fade-up">Freed Capital</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label={model.leftoverDestination === "None" ? "Remainder unallocated" : `Remainder to ${model.leftoverDestination}`}
            value={model.remainderToInvestments}
            hint="Total freed remaining after expenses"
            color="green"
            delay="fade-up-1"
          />
          {model.freeloaderEnabled && (
            <MetricCard
              label="Freeloader money"
              value={model.freeloaderMoney}
              hint="Sum of freeloader-tagged items"
              color="indigo"
              delay="fade-up-2"
            />
          )}
        </div>
      </div>

      {/* Section tables */}
      <div className="grid gap-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 fade-up">Budget Breakdown</h2>
        {model.budgetSections.map((section) => (
          <SectionTable
            key={section.title}
            section={section}
            onUpdateItem={model.updateItem}
            onRemoveItem={model.removeItem}
            onAddItem={model.addItem}
            freeloaderEnabled={model.freeloaderEnabled}
          />
        ))}
      </div>

      {/* Account summary */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4 fade-up">Account Summary</h2>
        <AccountSummary accountTotals={model.accountTotals} leftoverDestination={model.leftoverDestination} />
      </div>
    </div>
  );
}