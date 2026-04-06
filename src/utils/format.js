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

export const formatPct = (n) => `${(n * 100).toFixed(1)}%`;

export const sum = (values) =>
  values.reduce((a, b) => a + (Number(b) || 0), 0);