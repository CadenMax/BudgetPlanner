import { useMemo, useState } from "react";
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

export function useBudgetModel() {
  const [hoursWorked, setHoursWorked] = useState(29);
  const [hourlyRate, setHourlyRate] = useState(33.36);
  const [extraIncome, setExtraIncome] = useState(0);
  const [taxProfile, setTaxProfile] = useState("Standard - tax-free threshold");
  const [biggerPurchase, setBiggerPurchase] = useState(0);

  const [inputs, setInputs] = useState(() => {
    const initial = {};
    for (const section of Object.values(budgetDefs)) {
      for (const item of section) initial[item.id] = item.value;
    }
    return initial;
  });

  const grossIncome = useMemo(
    () => hoursWorked * hourlyRate + extraIncome,
    [hoursWorked, hourlyRate, extraIncome]
  );
  const payg = useMemo(
    () => lookupWithholding(grossIncome, taxTables[taxProfile]),
    [grossIncome, taxProfile]
  );
  const netPay = useMemo(() => grossIncome - payg, [grossIncome, payg]);

  const needsBudget = netPay * 0.5;
  const wantsBudget = netPay * 0.3;
  const savingsBudget = netPay * 0.2;

  const resolved = useMemo(() => {
    const result = { needs: {}, wants: {}, savings: {} };
    for (const item of budgetDefs.needs) {
      result.needs[item.id] = item.mode === "fixed" ? inputs[item.id] : needsBudget * inputs[item.id];
    }
    for (const item of budgetDefs.wants) {
      result.wants[item.id] = item.mode === "fixed" ? inputs[item.id] : wantsBudget * inputs[item.id];
    }
    for (const item of budgetDefs.savings) {
      result.savings[item.id] = item.mode === "fixed" ? inputs[item.id] : savingsBudget * inputs[item.id];
    }
    return result;
  }, [inputs, needsBudget, wantsBudget, savingsBudget]);

  const needsTotal = sum(Object.values(resolved.needs));
  const wantsTotal = sum(Object.values(resolved.wants));
  const savingsTotal = sum(Object.values(resolved.savings));

  const needsRemaining = needsBudget - needsTotal;
  const wantsRemaining = wantsBudget - wantsTotal;
  const savingsRemaining = savingsBudget - savingsTotal;

  const freedBills =
    resolved.needs.rent +
    resolved.needs.electricity +
    resolved.needs.internet +
    resolved.needs.phone +
    resolved.needs.rego;
  const freeloaderMoney = needsRemaining + freedBills;
  const totalFreed = freedBills + wantsRemaining + freeloaderMoney + savingsRemaining;
  const remainderToInvestments = totalFreed - biggerPurchase;

  const budgetSections = [
    {
      title: "Needs",
      color: "emerald",
      total: needsBudget,
      spent: needsTotal,
      remaining: needsRemaining,
      items: budgetDefs.needs.map((item) => ({ ...item, computed: resolved.needs[item.id] })),
    },
    {
      title: "Wants",
      color: "violet",
      total: wantsBudget,
      spent: wantsTotal,
      remaining: wantsRemaining,
      items: budgetDefs.wants.map((item) => ({ ...item, computed: resolved.wants[item.id] })),
    },
    {
      title: "Savings",
      color: "amber",
      total: savingsBudget,
      spent: savingsTotal,
      remaining: savingsRemaining,
      items: budgetDefs.savings.map((item) => ({ ...item, computed: resolved.savings[item.id] })),
    },
  ];

  return {
    hoursWorked, setHoursWorked,
    hourlyRate, setHourlyRate,
    extraIncome, setExtraIncome,
    taxProfile, setTaxProfile,
    biggerPurchase, setBiggerPurchase,
    grossIncome, payg, netPay,
    budgetSections,
    needsBudget, wantsBudget, savingsBudget,
    needsRemaining, wantsRemaining, savingsRemaining,
    freeloaderMoney, totalFreed, remainderToInvestments,
    inputs, setInputs,
  };
}
