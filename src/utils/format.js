export const formatMoney = (n) => {
  const value = Number.isFinite(n) ? n : 0;
  if (Math.abs(value) < 0.005) return "—";
  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
};

export const formatPct = (n) => `${(n * 100).toFixed(1)}%`;

export const sum = (values) => values.reduce((a, b) => a + (Number(b) || 0), 0);
