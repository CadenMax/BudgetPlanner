export const formatMoney = (n) => {
  const value = Number.isFinite(n) ? n : 0;
  const rounded = Number(value.toFixed(2));

  if (Math.abs(rounded) < 0.005) return "$0.00";

  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));

  return rounded < 0 ? `-${formatted}` : formatted;
};

// Logic to aggregate totals by account
const getAccountTotals = (budgetItems) => {
  const totals = {};

  budgetItems.forEach((item) => {
    // We only care about items that have a numerical value/cost
    // Assuming 'item.value' is where the cost is stored
    const amount = item.value || 0;
    const accountName = item.account || "Uncategorized";

    if (amount > 0) {
      if (!totals[accountName]) {
        totals[accountName] = 0;
      }
      totals[accountName] += amount;
    }
  });

  // Convert to array for easier mapping in JSX
  return Object.entries(totals).map(([account, total]) => ({
    account,
    total,
  })).sort((a, b) => b.total - a.total); // Sort highest to lowest
};

export const formatPct = (n) => `${(n * 100).toFixed(1)}%`;

export const sum = (values) =>
  values.reduce((a, b) => a + (Number(b) || 0), 0);