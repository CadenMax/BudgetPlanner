import { useMemo, useState, useEffect } from "react";
import { taxTables, defaultTaxYear } from "../data/taxTables";
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

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body;
}

export function useBudgetModel() {
  const [hoursWorked, setHoursWorkedRaw] = useState(0);
  const [hourlyRate, setHourlyRateRaw] = useState(0);
  const [nonTaxableIncome, setNonTaxableIncomeRaw] = useState(0);
  const [taxYear, setTaxYearRaw] = useState(defaultTaxYear);
  const [taxProfile, setTaxProfileRaw] = useState("Standard - tax-free threshold");
  const [leftoverDestination, setLeftoverDestinationRaw] = useState("None");
  const [freeloaderEnabled, setFreeloaderEnabledRaw] = useState(true);
  const [sections, setSectionsRaw] = useState(defaultSections);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [budgetReady, setBudgetReady] = useState(false);

  const resetBudget = () => {
    setHoursWorkedRaw(0);
    setHourlyRateRaw(0);
    setNonTaxableIncomeRaw(0);
    setTaxYearRaw(defaultTaxYear);
    setTaxProfileRaw("Standard - tax-free threshold");
    setLeftoverDestinationRaw("None");
    setFreeloaderEnabledRaw(true);
    setSectionsRaw(defaultSections);
  };

  const availableTaxProfiles = useMemo(
    () => Object.keys(taxTables[taxYear] ?? taxTables[defaultTaxYear] ?? {}),
    [taxYear]
  );

  const resolvedTaxProfile = availableTaxProfiles.includes(taxProfile)
    ? taxProfile
    : availableTaxProfiles[0] ?? "Standard - tax-free threshold";

  // Persist wrappers
  const persist = (setter) => (val) => setter(val);
  const setHoursWorked = persist(setHoursWorkedRaw);
  const setHourlyRate = persist(setHourlyRateRaw);
  const setNonTaxableIncome = persist(setNonTaxableIncomeRaw);
  const setExtraIncome = setNonTaxableIncome;
  const setTaxProfile = persist(setTaxProfileRaw);
  const setLeftoverDestination = persist(setLeftoverDestinationRaw);
  const setFreeloaderEnabled = persist(setFreeloaderEnabledRaw);

  const setTaxYear = (nextYear) => {
    const safeYear = taxTables[nextYear] ? nextYear : defaultTaxYear;
    const nextProfiles = Object.keys(taxTables[safeYear] ?? {});
    const nextProfile = nextProfiles.includes(taxProfile) ? taxProfile : nextProfiles[0] ?? "Standard - tax-free threshold";
    setTaxYearRaw(safeYear);
    setTaxProfileRaw(nextProfile);
  };

  const setSections = (next) => {
    const val = typeof next === "function" ? next(sections) : next;
    setSectionsRaw(val);
  };

  const applyBudget = (budget) => {
    setHoursWorkedRaw(Number(budget.hoursWorked) || 0);
    setHourlyRateRaw(Number(budget.hourlyRate) || 0);
    setNonTaxableIncomeRaw(Number(budget.nonTaxableIncome ?? budget.extraIncome) || 0);
    setTaxYearRaw(taxTables[budget.taxYear] ? budget.taxYear : defaultTaxYear);
    setTaxProfileRaw(budget.taxProfile || "Standard - tax-free threshold");
    setLeftoverDestinationRaw(budget.leftoverDestination || "None");
    setFreeloaderEnabledRaw(Boolean(budget.freeloaderEnabled ?? true));
    setSectionsRaw(budget.sections || defaultSections);
  };

  const register = async (username, email, password) => {
    setAuthError("");
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    resetBudget();
    setUser(response.user);
    setBudgetReady(true);
  };

  const login = async (email, password) => {
    setAuthError("");
    const response = await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    resetBudget();
    setUser(response.user);
    const responseBudget = await apiRequest("/api/budget");
    if (responseBudget.budget) applyBudget(responseBudget.budget);
    setBudgetReady(true);
  };

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    resetBudget();
    setUser(null);
    setBudgetReady(false);
  };

  const updateAccount = async (details) => {
    const response = await apiRequest("/api/auth/account", {
      method: "PATCH",
      body: JSON.stringify(details),
    });
    setUser(response.user);
  };

  useEffect(() => {
    let cancelled = false;
    apiRequest("/api/auth/me")
      .then(async ({ user: currentUser }) => {
        if (cancelled) return;
        setUser(currentUser);
        if (currentUser) {
          const { budget } = await apiRequest("/api/budget");
          if (budget) applyBudget(budget);
          setBudgetReady(true);
        }
        setAuthLoading(false);
      })
      .catch((error) => { if (!cancelled) { setAuthError(error.message); setAuthLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user || !budgetReady) return undefined;
    const timer = setTimeout(() => {
      apiRequest("/api/budget", { method: "PUT", body: JSON.stringify({ budget: {
        version: 1, hoursWorked, hourlyRate, nonTaxableIncome, extraIncome: nonTaxableIncome,
        taxYear, taxProfile: resolvedTaxProfile, leftoverDestination,
        freeloaderEnabled, sections,
      } }) })
        .catch((error) => setAuthError(error.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [user, budgetReady, hoursWorked, hourlyRate, nonTaxableIncome, taxYear, resolvedTaxProfile, leftoverDestination, freeloaderEnabled, sections]);

  const exportBudgetData = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    hoursWorked,
    hourlyRate,
    nonTaxableIncome,
    extraIncome: nonTaxableIncome,
    taxYear,
    taxProfile: resolvedTaxProfile,
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

    const nextNonTaxableIncome = Number(payload.nonTaxableIncome ?? payload.extraIncome ?? nonTaxableIncome) || 0;

    const nextValues = {
      hoursWorked: Number(payload.hoursWorked ?? hoursWorked) || 0,
      hourlyRate: Number(payload.hourlyRate ?? hourlyRate) || 0,
      nonTaxableIncome: nextNonTaxableIncome,
      freeloaderEnabled: Boolean(payload.freeloaderEnabled ?? freeloaderEnabled),
      taxYear: nextTaxYear,
      taxProfile: nextProfile,
      leftoverDestination: nextDestination,
      sections: nextSections,
    };

    setHoursWorkedRaw(nextValues.hoursWorked);
    setHourlyRateRaw(nextValues.hourlyRate);
    setNonTaxableIncomeRaw(nextValues.nonTaxableIncome);
    setFreeloaderEnabledRaw(nextValues.freeloaderEnabled);
    setTaxYearRaw(nextValues.taxYear);
    setTaxProfileRaw(nextValues.taxProfile);
    setLeftoverDestinationRaw(nextValues.leftoverDestination);
    setSectionsRaw(nextValues.sections);

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
  const taxableIncome = useMemo(
    () => hoursWorked * hourlyRate,
    [hoursWorked, hourlyRate]
  );
  const grossIncome = useMemo(
    () => taxableIncome + nonTaxableIncome,
    [taxableIncome, nonTaxableIncome]
  );
  const payg = useMemo(
    () => lookupWithholding(taxableIncome, taxTables[taxYear]?.[resolvedTaxProfile] ?? taxTables[defaultTaxYear][resolvedTaxProfile] ?? []),
    [taxableIncome, taxYear, resolvedTaxProfile]
  );
  const netPay = useMemo(() => taxableIncome - payg + nonTaxableIncome, [taxableIncome, payg, nonTaxableIncome]);

  const needsBudget = netPay * 0.5;
  const wantsBudget = netPay * 0.3;
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

  const needsTotal = sum(Object.values(resolved.needs));
  const wantsTotal = sum(Object.values(resolved.wants));
  const savingsTotal = sum(Object.values(resolved.savings));

  const needsRemaining = needsBudget - needsTotal;
  const wantsRemaining = wantsBudget - wantsTotal;
  const savingsRemaining = savingsBudget - savingsTotal;

  const leftoverAccountOptions = useMemo(() => {
    const names = new Set();
    for (const items of Object.values(sections)) {
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

  // Keep ordinary leftover separate from freeloader money for the dashboard cards.
  const totalLeftover = needsRemaining + wantsRemaining + savingsRemaining;
  const remainderToInvestments = totalLeftover;
  // Freeloader items are excluded from account totals, so include them when routing money.
  const routedRemainder = totalLeftover + freedBills;
  // Keep totalFreed as an alias for anything referencing it
  const totalFreed = totalLeftover;

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

    if (routedRemainder > 0 && normalizedLeftoverDestination !== "None") {
      totals[normalizedLeftoverDestination] = (totals[normalizedLeftoverDestination] ?? 0) + routedRemainder;
    }

    return Object.entries(totals)
      .map(([account, total]) => ({ account, total }))
      .sort((a, b) => b.total - a.total);
  }, [sections, resolved, routedRemainder, normalizedLeftoverDestination, freeloaderEnabled]);

  const sectionMeta = [
    { key: "needs", title: "Needs", color: "green", total: needsBudget, spent: needsTotal, remaining: needsRemaining },
    { key: "wants", title: "Wants", color: "indigo", total: wantsBudget, spent: wantsTotal, remaining: wantsRemaining },
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
    user, authLoading, authError, setAuthError, register, login, logout, updateAccount,
    hoursWorked, setHoursWorked,
    hourlyRate, setHourlyRate,
    nonTaxableIncome, setNonTaxableIncome,
    extraIncome: nonTaxableIncome,
    setExtraIncome,
    taxYear, setTaxYear,
    taxProfile: resolvedTaxProfile,
    taxProfiles: availableTaxProfiles,
    setTaxProfile,
    leftoverDestination: normalizedLeftoverDestination,
    setLeftoverDestination,
    leftoverAccountOptions,
    freeloaderEnabled,
    setFreeloaderEnabled,
    exportBudgetData,
    importBudgetData,
    taxableIncome, grossIncome, payg, netPay,
    budgetSections,
    needsBudget, wantsBudget, savingsBudget,
    needsRemaining, wantsRemaining, savingsRemaining,
    freeloaderMoney, totalFreed, remainderToInvestments,
    addItem, removeItem, updateItem, setItemValue,
    accountTotals,
  };
}