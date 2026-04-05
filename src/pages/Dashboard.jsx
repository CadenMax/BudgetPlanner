import { MetricCard, Field, SectionTable } from "../components/ui";

export default function Dashboard({ model }) {
  return (
    <div className="grid gap-8">

      {/* Inputs + income summary — side by side */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Inputs */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5 fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Income Inputs</h2>
          <Field label="Hours worked / week" value={model.hoursWorked} onChange={model.setHoursWorked} step="0.5" />
          <Field label="Hourly rate" value={model.hourlyRate} onChange={model.setHourlyRate} prefix="$" />
          <Field label="Extra income" value={model.extraIncome} onChange={model.setExtraIncome} prefix="$" />
          <Field label="Bigger purchase" value={model.biggerPurchase} onChange={model.setBiggerPurchase} prefix="$" />
        </div>

        {/* Income summary grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 fade-up">Income Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Gross income" value={model.grossIncome} hint="Hours × rate + extra" color="indigo" icon="💰" delay="fade-up-1" />
            <MetricCard label="PAYG withheld" value={model.payg} hint={model.taxProfile} color="orange" icon="🏛️" delay="fade-up-2" />
          </div>
          <MetricCard label="Net pay" value={model.netPay} hint="Take-home after tax" color="green" icon="✅" delay="fade-up-3" />

          {/* 50/30/20 visual split */}
          <div className="glass rounded-2xl p-4 fade-up fade-up-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">50 / 30 / 20 Split</div>
            <div className="flex rounded-lg overflow-hidden h-3 gap-0.5">
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: "50%" }} title="Needs 50%" />
              <div className="bg-indigo-500 transition-all duration-700" style={{ width: "30%" }} title="Wants 30%" />
              <div className="bg-orange-500 transition-all duration-700" style={{ width: "20%" }} title="Savings 20%" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span className="text-emerald-500">Needs 50%</span>
              <span className="text-indigo-400">Wants 30%</span>
              <span className="text-orange-400">Savings 20%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budgets remaining — 3 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4 fade-up">Budget Allocations</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Needs budget" value={model.needsBudget} hint="50% of net pay" color="green" icon="🏠" delay="fade-up-1" />
          <MetricCard label="Wants budget" value={model.wantsBudget} hint="30% of net pay" color="indigo" icon="🎮" delay="fade-up-2" />
          <MetricCard label="Savings budget" value={model.savingsBudget} hint="20% of net pay" color="orange" icon="💎" delay="fade-up-3" />
        </div>
      </div>

      {/* Remaining — 3 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-0 mb-4 fade-up">Remaining After Expenses</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Needs remaining" value={model.needsRemainingFormatted} color="green" delay="fade-up-1" />
          <MetricCard label="Wants remaining" value={model.wantsRemainingFormatted} color="indigo" delay="fade-up-2" />
          <MetricCard label="Savings remaining" value={model.savingsRemainingFormatted} color="orange" delay="fade-up-3" />
        </div>
      </div>

      {/* Freed capital — 2 col */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4 fade-up">Freed Capital</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Freeloader money" value={model.freeloaderMoney} hint="Freed-up needs logic" color="indigo" icon="🚀" delay="fade-up-1" />
          <MetricCard label="Remainder to investments" value={model.remainderToInvestments} hint="Total freed minus bigger purchase" color="green" icon="📈" delay="fade-up-2" />
        </div>
      </div>

      {/* Section tables */}
      <div className="grid gap-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 fade-up">Budget Breakdown</h2>
        {model.budgetSections.map((section, i) => (
          <SectionTable key={section.title} section={section} inputs={model.inputs} setInputs={model.setInputs} />
        ))}
      </div>
    </div>
  );
}
