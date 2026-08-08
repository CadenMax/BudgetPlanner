import { useMemo, useState, useEffect } from "react";
import { taxTables, taxYears, defaultTaxYear } from "../data/taxTables";
import { budgetDefs } from "../data/budgetDefs";
import { sum } from "../utils/format";

function lookupWithholding(income, table) {
  const taxable = Math.trunc(Number(income) || 0);
  if (taxable <= 0) return 0;

  let row = table[0];
  for (const candidate of table) {
    if (taxable >= candidate.threshold) row = candidate;
  }

  const withholding = Math.round((taxable + 0.99) * row.rate - row.base);
  return Object.is(withholding, -0) ? 0 : withholding;
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
  const [hoursWorked,              setHoursWorkedRaw]              = useState(() => loadFromStorage("bp_hoursWorked",              0));
  const [hourlyRate,               setHourlyRateRaw]               = useState(() => loadFromStorage("bp_hourlyRate",               0));
  const [extraIncome,              setExtraIncomeRaw]              = useState(() => loadFromStorage("bp_extraIncome",              0));
  const [taxYear,                  setTaxYearRaw]                  = useState(() => loadFromStorage("bp_taxYear",                  defaultTaxYear));
  const [taxProfile,               setTaxProfileRaw]               = useState(() => loadFromStorage("bp_taxProfile",               "Standard - tax-free threshold"));
  const [biggerPurchase,           setBiggerPurchaseRaw]           = useState(() => loadFromStorage("bp_biggerPurchase",           0));
  const [leftoverDestination,      setLeftoverDestinationRaw]      = useState(() => loadFromStorage("bp_leftoverDestination",      "None"));
  const [freeloaderEnabled,        setFreeloaderEnabledRaw]        = useState(() => loadFromStorage("bp_freeloaderEnabled",        true));
  const [sections,                 setSectionsRaw]                 = useState(() => loadFromStorage("bp_sections",                 defaultSections));

  const availableTaxProfiles = useMemo(
    () => Object.keys(taxTables[taxYear] ?? taxTables[defaultTaxYear] ?? {}),
    [taxYear]
  );

  const resolvedTaxProfile = availableTaxProfiles.includes(taxProfile)
    ? taxProfile
    : availableTaxProfiles[0] ?? "Standard - tax-free threshold";

  // Persist wrappers
  const persist = (key, setter) => (val) => { setter(val); saveToStorage(key, val); };
  const setHoursWorked          = persist("bp_hoursWorked",          setHoursWorkedRaw);
  const setHourlyRate           = persist("bp_hourlyRate",           setHourlyRateRaw);
  const setExtraIncome          = persist("bp_extraIncome",          setExtraIncomeRaw);
  const setTaxProfile           = persist("bp_taxProfile",           setTaxProfileRaw);
  const setBiggerPurchase       = persist("bp_biggerPurchase",       setBiggerPurchaseRaw);
  const setLeftoverDestination  = persist("bp_leftoverDestination",  setLeftoverDestinationRaw);
  const setFreeloaderEnabled    = persist("bp_freeloaderEnabled",    setFreeloaderEnabledRaw);

  const setTaxYear = (nextYear) => {
    const safeYear = taxTables[nextYear] ? nextYear : defaultTaxYear;
    const nextProfiles = Object.keys(taxTables[safeYear] ?? {});
    const nextProfile = nextProfiles.includes(taxProfile) ? taxProfile : nextProfiles[0] ?? "Standard - tax-free threshold";
    setTaxYearRaw(safeYear);
    setTaxProfileRaw(nextProfile);
    saveToStorage("bp_taxYear", safeYear);
    saveToStorage("bp_taxProfile", nextProfile);
  };

  const setSections = (next) => {
    const val = typeof next === "function" ? next(sections) : next;
    setSectionsRaw(val);
    saveToStorage("bp_sections", val);
  };

  const exportBudgetData = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    hoursWorked,
    hourlyRate,
    extraIncome,
    taxYear,
    taxProfile: resolvedTaxProfile,
    biggerPurchase,
    leftoverDestination: normalizedLeftoverDestination,
    freeloaderEnabled,
    sections,
  });

  const importBudgetData = (payload) => {
    if (!payload || typeof payload !== "object") return false;

    const nextSections = payload.sections && typeof payload.sections === "object"
      ? payload.sections
      : defaultSections;

    const nextTaxYear = payload.taxYear && taxTables[payload.taxYear] ? payload.taxYear : taxYear;
    const nextProfiles = Object.keys(taxTables[nextTaxYear] ?? {});
    const nextProfile = payload.taxProfile && nextProfiles.includes(payload.taxProfile)
      ? payload.taxProfile
      : nextProfiles[0] ?? "Standard - tax-free threshold";

    const nextDestination = payload.leftoverDestination && payload.leftoverDestination !== "None"
      ? payload.leftoverDestination
      : "None";

    const nextValues = {
      hoursWorked: Number(payload.hoursWorked ?? hoursWorked) || 0,
      hourlyRate: Number(payload.hourlyRate ?? hourlyRate) || 0,
      extraIncome: Number(payload.extraIncome ?? extraIncome) || 0,
      biggerPurchase: Number(payload.biggerPurchase ?? biggerPurchase) || 0,
      freeloaderEnabled: Boolean(payload.freeloaderEnabled ?? freeloaderEnabled),
      taxYear: nextTaxYear,
      taxProfile: nextProfile,
      leftoverDestination: nextDestination,
      sections: nextSections,
    };

    setHoursWorkedRaw(nextValues.hoursWorked);
    setHourlyRateRaw(nextValues.hourlyRate);
    setExtraIncomeRaw(nextValues.extraIncome);
    setBiggerPurchaseRaw(nextValues.biggerPurchase);
    setFreeloaderEnabledRaw(nextValues.freeloaderEnabled);
    setTaxYearRaw(nextValues.taxYear);
    setTaxProfileRaw(nextValues.taxProfile);
    setLeftoverDestinationRaw(nextValues.leftoverDestination);
    setSectionsRaw(nextValues.sections);

    saveToStorage("bp_hoursWorked", nextValues.hoursWorked);
    saveToStorage("bp_hourlyRate", nextValues.hourlyRate);
    saveToStorage("bp_extraIncome", nextValues.extraIncome);
    saveToStorage("bp_biggerPurchase", nextValues.biggerPurchase);
    saveToStorage("bp_freeloaderEnabled", nextValues.freeloaderEnabled);
    saveToStorage("bp_taxYear", nextValues.taxYear);
    saveToStorage("bp_taxProfile", nextValues.taxProfile);
    saveToStorage("bp_leftoverDestination", nextValues.leftoverDestination);
    saveToStorage("bp_sections", nextValues.sections);

    return true;
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
    () => lookupWithholding(grossIncome, taxTables[taxYear]?.[resolvedTaxProfile] ?? taxTables[defaultTaxYear][resolvedTaxProfile] ?? []),
    [grossIncome, taxYear, resolvedTaxProfile]
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

  const leftoverAccountOptions = useMemo(() => {
    const names = new Set();
    for (const [key, items] of Object.entries(sections)) {
      for (const item of items) {
        const trimmed = String(item.account || "").trim();
        if (trimmed && trimmed !== "None") names.add(trimmed);
      }
    }
    return [...names];
  }, [sections]);

  const normalizedLeftoverDestination =
    leftoverDestination &&
    leftoverDestination !== "None" &&
    leftoverAccountOptions.includes(leftoverDestination)
      ? leftoverDestination
      : "None";

  // Dynamic freeloader: sum of computed values for items with isFreeloader=true
  const freedBills = useMemo(() => {
    if (!freeloaderEnabled) return 0;

    let total = 0;
    for (const [key, items] of Object.entries(sections)) {
      for (const item of items) {
        if (item.isFreeloader) total += resolved[key][item.id] ?? 0;
      }
    }
    return total;
  }, [sections, resolved, freeloaderEnabled]);

  const freeloaderMoney = freeloaderEnabled ? freedBills : 0;

  // Total leftover = everything unspent across all three buckets
  const totalLeftover          = needsRemaining + wantsRemaining + savingsRemaining;
  // Bigger purchase carves out of that leftover first; remainder goes to the selected account
  const remainderToInvestments = totalLeftover - biggerPurchase;
  // Keep totalFreed as an alias for anything referencing it
  const totalFreed             = totalLeftover;

  // --- Account totals: sum computed values grouped by account name ---
  // Leftover money can be routed to a chosen account, or left unallocated.
  const accountTotals = useMemo(() => {
    const totals = {};
    for (const [key, items] of Object.entries(sections)) {
      for (const item of items) {
        if (freeloaderEnabled && item.isFreeloader) continue;

        const account = String(item.account || "").trim();
        if (!account) continue;

        const computed = resolved[key]?.[item.id] ?? 0;
        totals[account] = (totals[account] ?? 0) + computed;
      }
    }

    if (remainderToInvestments > 0 && normalizedLeftoverDestination !== "None") {
      totals[normalizedLeftoverDestination] = (totals[normalizedLeftoverDestination] ?? 0) + remainderToInvestments;
    }

    // Bigger purchase shown as its own line
    if (biggerPurchase > 0) {
      totals["Bigger Purchase"] = (totals["Bigger Purchase"] ?? 0) + biggerPurchase;
    }
    return Object.entries(totals)
      .map(([account, total]) => ({ account, total }))
      .sort((a, b) => b.total - a.total);
  }, [sections, resolved, remainderToInvestments, biggerPurchase, normalizedLeftoverDestination, freeloaderEnabled]);

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
    taxYear, setTaxYear,
    taxProfile: resolvedTaxProfile,
    taxProfiles: availableTaxProfiles,
    setTaxProfile,
    biggerPurchase, setBiggerPurchase,
    leftoverDestination: normalizedLeftoverDestination,
    setLeftoverDestination,
    leftoverAccountOptions,
    freeloaderEnabled,
    setFreeloaderEnabled,
    exportBudgetData,
    importBudgetData,
    grossIncome, payg, netPay,
    budgetSections,
    needsBudget, wantsBudget, savingsBudget,
    needsRemaining, wantsRemaining, savingsRemaining,
    freeloaderMoney, totalFreed, remainderToInvestments,
    addItem, removeItem, updateItem, setItemValue,
    accountTotals,
  };
}