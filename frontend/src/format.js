const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
export const money = (n) => currency.format(n);