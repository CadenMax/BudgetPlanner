import { useMemo, useState } from "react";
import { MetricCard } from "../components/ui";
import { formatMoney } from "../utils/format";
import { Download, Eye, Trash2 } from "lucide-react";

const dateLabel = (value) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const dateInputValue = (value) => {
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function captureCsvRows(capture) {
  const rows = [
    [dateLabel(capture.capturedAt), capture.id, "Capture", "Captured at", dateLabel(capture.capturedAt), "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Income", "Hours worked", capture.hoursWorked, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Income", "Hourly rate", capture.hourlyRate, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Income", "Gross income", capture.grossIncome, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Income", "PAYG withheld", capture.payg, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Income", "Net pay", capture.netPay, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Needs", "Budget", capture.needsBudget, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Needs", "Remaining", capture.needsRemaining, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Wants", "Budget", capture.wantsBudget, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Wants", "Remaining", capture.wantsRemaining, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Savings", "Budget", capture.savingsBudget, "", "", "", ""],
    [dateLabel(capture.capturedAt), capture.id, "Savings", "Remaining", capture.savingsRemaining, "", "", "", ""],
  ];

  for (const [sectionKey, items] of Object.entries(capture.budget?.sections || {})) {
    for (const item of items) {
      rows.push([
        dateLabel(capture.capturedAt),
        capture.id,
        sectionKey,
        item.label,
        item.value,
        item.mode,
        item.account,
        item.note,
        item.isFreeloader ? "Yes" : "No",
      ]);
    }
  }
  return rows;
}

function downloadCaptureCsv(captures) {
  const captureList = Array.isArray(captures) ? captures : [captures];
  const rows = [["Capture date", "Capture ID", "Section", "Field", "Value", "Mode", "Account", "Notes", "Freeloader"]];
  captureList.forEach((capture) => rows.push(...captureCsvRows(capture)));
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = captureList.length === 1
    ? `budget-capture-${dateInputValue(captureList[0].capturedAt)}.csv`
    : `budget-captures-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function History({ model, onOpenDashboard }) {
  const captures = Array.isArray(model.captures) ? model.captures : [];
  const [rangeFilter, setRangeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minNetPay, setMinNetPay] = useState("");
  const [maxNetPay, setMaxNetPay] = useState("");
  const [allocationFilter, setAllocationFilter] = useState("All");
  const [metric, setMetric] = useState("netPay");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const filteredCaptures = useMemo(() => {
    const latestCapture = Math.max(...captures.map((capture) => new Date(capture.capturedAt).getTime()), 0);
    const cutoff = rangeFilter === "All" ? 0 : latestCapture - Number(rangeFilter) * 86400000;
    return [...captures]
      .filter((capture) => {
        const captureDate = dateInputValue(capture.capturedAt);
        const remaining = Number(capture.needsRemaining || 0) + Number(capture.wantsRemaining || 0) + Number(capture.savingsRemaining || 0);
        const matchesDate = startDate || endDate
          ? (!startDate || captureDate >= startDate) && (!endDate || captureDate <= endDate)
          : new Date(capture.capturedAt).getTime() >= cutoff;
        const matchesNetPay = (minNetPay === "" || Number(capture.netPay) >= Number(minNetPay)) && (maxNetPay === "" || Number(capture.netPay) <= Number(maxNetPay));
        const matchesAllocation = allocationFilter === "All" || (allocationFilter === "Remaining" ? remaining >= 0 : remaining < 0);
        return matchesDate && matchesNetPay && matchesAllocation;
      })
      .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
  }, [captures, rangeFilter, startDate, endDate, minNetPay, maxNetPay, allocationFilter]);

  const averages = useMemo(() => {
    if (!filteredCaptures.length) return { netPay: 0, grossIncome: 0, needs: 0, wants: 0, savings: 0 };
    const total = filteredCaptures.reduce((sum, capture) => ({
      netPay: sum.netPay + capture.netPay,
      grossIncome: sum.grossIncome + capture.grossIncome,
      needs: sum.needs + capture.needsBudget,
      wants: sum.wants + capture.wantsBudget,
      savings: sum.savings + capture.savingsBudget,
    }), { netPay: 0, grossIncome: 0, needs: 0, wants: 0, savings: 0 });
    return Object.fromEntries(Object.entries(total).map(([key, value]) => [key, value / filteredCaptures.length]));
  }, [filteredCaptures]);

  const chartMax = Math.max(...filteredCaptures.map((capture) => Number(capture[metric]) || 0), 1);
  const splitTotal = averages.needs + averages.wants + averages.savings || 1;
  const selectedCaptures = filteredCaptures.filter((capture) => selectedIds.has(capture.id));
  const allFilteredSelected = filteredCaptures.length > 0 && filteredCaptures.every((capture) => selectedIds.has(capture.id));

  const toggleCaptureSelection = (captureId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(captureId)) next.delete(captureId);
      else next.add(captureId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredCaptures.forEach((capture) => next.delete(capture.id));
      else filteredCaptures.forEach((capture) => next.add(capture.id));
      return next;
    });
  };

  const handleDelete = async (capture) => {
    if (!window.confirm(`Delete the capture from ${dateLabel(capture.capturedAt)}? This cannot be undone.`)) return;
    try {
      await model.deleteCapture(capture.id);
    } catch (error) {
      model.setAuthError(error.message);
    }
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-2 fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white/90">Budget History</h2>
            <p className="text-sm text-white/40">Review captured pay periods and spot changes over time.</p>
          </div>
          <div className="text-xs text-white/40 mono">{captures.length} capture{captures.length === 1 ? "" : "s"} saved</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Quick range</span>
          <select className="input-dark" value={rangeFilter} onChange={(event) => setRangeFilter(event.target.value)}>
            <option value="All">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">From date</span>
          <input className="input-dark" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">To date</span>
          <input className="input-dark" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Trend metric</span>
          <select className="input-dark" value={metric} onChange={(event) => setMetric(event.target.value)}>
            <option value="netPay">Net pay</option>
            <option value="grossIncome">Gross income</option>
            <option value="needsRemaining">Needs remaining</option>
            <option value="wantsRemaining">Wants remaining</option>
            <option value="savingsRemaining">Savings remaining</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Minimum net pay</span>
          <input className="input-dark" type="number" min="0" step="0.01" placeholder="$0" value={minNetPay} onChange={(event) => setMinNetPay(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Maximum net pay</span>
          <input className="input-dark" type="number" min="0" step="0.01" placeholder="No limit" value={maxNetPay} onChange={(event) => setMaxNetPay(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Allocation result</span>
          <select className="input-dark" value={allocationFilter} onChange={(event) => setAllocationFilter(event.target.value)}>
            <option value="All">All results</option>
            <option value="Remaining">Has money remaining</option>
            <option value="Over">Over allocated</option>
          </select>
        </label>
      </div>

      {!filteredCaptures.length ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-white/40">No captures match these filters. Capture a period from the Dashboard to start building your history.</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Average net pay" value={averages.netPay} hint="Across filtered captures" color="green" />
            <MetricCard label="Average gross" value={averages.grossIncome} hint="Before PAYG" color="indigo" />
            <MetricCard label="Average needs" value={averages.needs} hint="50/30/20 allocation" color="orange" />
            <MetricCard label="Periods reviewed" value={filteredCaptures.length} hint="Matching captures" color="rose" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white/80">Period trend</h3>
                  <p className="text-xs text-white/40">{metric === "netPay" ? "Net pay" : metric === "grossIncome" ? "Gross income" : "Remaining allocation"} · Each bar is one capture</p>
                </div>
                <span className="mono text-xs text-emerald-300">{formatMoney(averages[metric] || 0)} avg</span>
              </div>
              <div className="relative h-56 pt-3 pb-8">
                {[0, 25, 50, 75, 100].map((level) => <div key={level} className="absolute left-0 right-0 border-t border-white/[0.06]" style={{ top: `${level}%` }} />)}
                <div className="absolute left-0 top-2 bottom-8 flex flex-col justify-between text-[10px] text-white/30 mono">
                  <span>{formatMoney(chartMax)}</span><span>{formatMoney(chartMax * 0.5)}</span><span>$0.00</span>
                </div>
                <div className="relative z-10 ml-12 flex h-full items-end gap-3 border-b border-white/10 px-2">
                {filteredCaptures.map((capture) => {
                  const value = Number(capture[metric]) || 0;
                  return <div key={capture.id} className="group relative flex h-full min-w-[2.25rem] flex-1 items-end" title={`${dateLabel(capture.capturedAt)}: ${formatMoney(value)}`}>
                    <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/50 mono">{formatMoney(value)}</span>
                    <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500/70 to-indigo-400/80 transition-all" style={{ height: `${Math.max(4, (Math.max(value, 0) / chartMax) * 100)}%` }} />
                    <span className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-[10px] text-white/35 whitespace-nowrap">{new Date(capture.capturedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                  </div>;
                })}
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-bold text-white/80">Average allocation</h3>
              <p className="text-xs text-white/40 mt-1 mb-6">Average budget split for filtered periods</p>
              <div className="flex rounded-lg overflow-hidden h-4 gap-0.5 mb-5">
                <div className="bg-emerald-400" style={{ width: `${(averages.needs / splitTotal) * 100}%` }} />
                <div className="bg-indigo-400" style={{ width: `${(averages.wants / splitTotal) * 100}%` }} />
                <div className="bg-orange-400" style={{ width: `${(averages.savings / splitTotal) * 100}%` }} />
              </div>
              <div className="grid gap-3 text-sm">
                {[['Needs', averages.needs, 'text-emerald-300'], ['Wants', averages.wants, 'text-indigo-300'], ['Savings', averages.savings, 'text-orange-300']].map(([label, value, color]) => <div key={label} className="flex justify-between"><span className={color}>{label}</span><span className="mono text-white/70">{formatMoney(value)}</span></div>)}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-bold text-white/80">Captured periods</h3>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                  Select all filtered
                </label>
                <button type="button" disabled={!selectedCaptures.length} onClick={() => downloadCaptureCsv(selectedCaptures)} className="btn-glow flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 disabled:opacity-40" title="Download selected captures as one CSV">
                  <Download size={14} /> Export {selectedCaptures.length || "selected"} CSV
                </button>
              </div>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {[...filteredCaptures].reverse().map((capture) => <div key={capture.id} className="grid gap-3 px-6 py-4 sm:grid-cols-[auto_1.2fr_repeat(4,1fr)_auto_auto_auto] sm:items-center">
                <input type="checkbox" checked={selectedIds.has(capture.id)} onChange={() => toggleCaptureSelection(capture.id)} aria-label={`Select capture from ${dateLabel(capture.capturedAt)}`} />
                <div><div className="text-sm font-semibold text-white/80">{dateLabel(capture.capturedAt)}</div><div className="text-xs text-white/35">Saved budget snapshot</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-white/30">Net pay</div><div className="mono text-sm text-emerald-300">{formatMoney(capture.netPay)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-white/30">PAYG</div><div className="mono text-sm text-orange-300">{formatMoney(capture.payg)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-white/30">Allocated</div><div className="mono text-sm text-indigo-300">{formatMoney(capture.totalAllocated)}</div></div>
                <div className="text-left sm:text-right text-xs text-white/40">{capture.hoursWorked} hrs at {formatMoney(capture.hourlyRate)}/hr</div>
                <button type="button" onClick={() => { if (model.restoreCapture(capture)) onOpenDashboard(); }} className="btn-glow flex items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300" title="Load this exact capture into the Dashboard"><Eye size={14} /> Re-view</button>
                <button type="button" onClick={() => downloadCaptureCsv(capture)} className="btn-glow flex items-center justify-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300" title="Download this capture as CSV"><Download size={14} /> CSV</button>
                <button type="button" onClick={() => handleDelete(capture)} className="btn-glow flex items-center justify-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300" title="Delete this capture"><Trash2 size={14} /> Delete</button>
              </div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
