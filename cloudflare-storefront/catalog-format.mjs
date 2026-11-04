export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export const safeURL = (value) => {
  try {
    const url = new URL(typeof value === "string" ? value : value?.url || value?.src);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};
export const money = (amount, currency = "YER") => {
  try {
    return new Intl.NumberFormat("ar-YE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${Number(amount).toLocaleString("ar-YE")} ${currency}`;
  }
};
