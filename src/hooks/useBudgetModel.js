import { useMemo, useState, useEffect } from "react";
import { taxTables } from "../data/taxTables";
import { budgetDefs } from "../data/budgetDefs";
import { sum } from "../utils/format";

function lookupWithholding(income, table) {
  const taxable = Math.trunc(Number(income) || 0);
  let row = table[0];
  for (const candidate of table) {
    if (taxable >= candidate.threshold) row = candidate;
  }
  return Math.round((taxable + 0.99) * row.rate - row.base);
}

// Default items with isFreeloader flag added
const defaultSections = {
  needs: budgetDefs.needs.map((item) => ({
    ...item,
    isFreeloader: ["rent", "electricity", "internet", "phone", "rego"].includes(item.id),
  })),
  wants: budgetDefs.wants.map((item) => ({ ...item, isFreeloader: false })),
  savings: budgetDefs.savings.map((item) => ({ ...item, isFreeloader: false })),
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useBudgetModel() {
  const [hoursWorked,    setHoursWorkedRaw]    = useState(() => loadFromStorage("bp_hoursWorked",    29));
  const [hourlyRate,     setHourlyRateRaw]      = useState(() => loadFromStorage("bp_hourlyRate",     33.36));
  const [extraIncome,    setExtraIncomeRaw]     = useState(() => loadFromStorage("bp_extraIncome",    0));
  const [taxProfile,     setTaxProfileRaw]      = useState(() => loadFromStorage("bp_taxProfile",     "Standard - tax-free threshold"));
  const [biggerPurchase, setBiggerPurchaseRaw]  = useState(() => loadFromStorage("bp_biggerPurchase", 0));
  const [sections,       setSectionsRaw]        = useState(() => loadFromStorage("bp_sections",       defaultSections));

  // Persist wrappers
  const persist = (key, setter) => (val) => { setter(val); saveToStorage(key, val); };
  const setHoursWorked    = persist("bp_hoursWorked",    setHoursWorkedRaw);
  const setHourlyRate     = persist("bp_hourlyRate",     setHourlyRateRaw);
  const setExtraIncome    = persist("bp_extraIncome",    setExtraIncomeRaw);
  const setTaxProfile     = persist("bp_taxProfile",     setTaxProfileRaw);
  const setBiggerPurchase = persist("bp_biggerPurchase", setBiggerPurchaseRaw);

  const setSections = (next) => {
    const val = typeof next === "function" ? next(sections) : next;
    setSectionsRaw(val);
    saveToStorage("bp_sections", val);
  };

  // --- Section/item mutations ---
  const addItem = (sectionKey, newItem) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], newItem],
    }));
  };

  const removeItem = (sectionKey, id) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((item) => item.id !== id),
    }));
  };

  const updateItem = (sectionKey, id, changes) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((item) =>
        item.id === id ? { ...item, ...changes } : item
      ),
    }));
  };

  // Also store input values on the items themselves
  const setItemValue = (sectionKey, id, value) => {
    updateItem(sectionKey, id, { value });
  };

  // --- Calculations ---
  const grossIncome = useMemo(
    () => hoursWorked * hourlyRate + extraIncome,
    [hoursWorked, hourlyRate, extraIncome]
  );
  const payg = useMemo(
    () => lookupWithholding(grossIncome, taxTables[taxProfile]),
    [grossIncome, taxProfile]
  );
  const netPay = useMemo(() => grossIncome - payg, [grossIncome, payg]);

  const needsBudget   = netPay * 0.5;
  const wantsBudget   = netPay * 0.3;
  const savingsBudget = netPay * 0.2;

  const categoryBudget = { needs: needsBudget, wants: wantsBudget, savings: savingsBudget };

  const resolved = useMemo(() => {
    const result = { needs: {}, wants: {}, savings: {} };
    for (const [key, items] of Object.entries(sections)) {
      const budget = categoryBudget[key] ?? 0;
      for (const item of items) {
        result[key][item.id] = item.mode === "fixed" ? item.value : budget * item.value;
      }
    }
    return result;
  }, [sections, needsBudget, wantsBudget, savingsBudget]);

  const needsTotal    = sum(Object.values(resolved.needs));
  const wantsTotal    = sum(Object.values(resolved.wants));
  const savingsTotal  = sum(Object.values(resolved.savings));

  const needsRemaining   = needsBudget   - needsTotal;
  const wantsRemaining   = wantsBudget   - wantsTotal;
  const savingsRemaining = savingsBudget - savingsTotal;

  // Dynamic freeloader: sum of computed values for items with isFreeloader=true
  const freedBills = useMemo(() => {
    let total = 0;
    for (const [key, items] of Object.entries(sections)) {
      for (const item of items) {
        if (item.isFreeloader) total += resolved[key][item.id] ?? 0;
      }
    }
    return total;
  }, [sections, resolved]);

  const freeloaderMoney       = needsRemaining + freedBills;
  const totalFreed            = freedBills + wantsRemaining + freeloaderMoney + savingsRemaining;
  const remainderToInvestments = totalFreed - biggerPurchase;

  const sectionMeta = [
    { key: "needs",   title: "Needs",   color: "green",  total: needsBudget,   spent: needsTotal,   remaining: needsRemaining   },
    { key: "wants",   title: "Wants",   color: "indigo", total: wantsBudget,   spent: wantsTotal,   remaining: wantsRemaining   },
    { key: "savings", title: "Savings", color: "orange", total: savingsBudget, spent: savingsTotal, remaining: savingsRemaining },
  ];

  const budgetSections = sectionMeta.map(({ key, ...meta }) => ({
    ...meta,
    sectionKey: key,
    items: (sections[key] || []).map((item) => ({
      ...item,
      computed: resolved[key]?.[item.id] ?? 0,
    })),
  }));

  return {
    hoursWorked, setHoursWorked,
    hourlyRate,  setHourlyRate,
    extraIncome, setExtraIncome,
    taxProfile,  setTaxProfile,
    biggerPurchase, setBiggerPurchase,
    grossIncome, payg, netPay,
    budgetSections,
    needsBudget, wantsBudget, savingsBudget,
    needsRemaining, wantsRemaining, savingsRemaining,
    freeloaderMoney, totalFreed, remainderToInvestments,
    addItem, removeItem, updateItem, setItemValue,
  };
}
