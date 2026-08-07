import { Currency } from "./types";

export function formatPrice(priceYER: number, currency: Currency = "YER"): string {
  if (currency === "SAR") {
    const priceSAR = Math.round(priceYER / 140);
    return `${priceSAR.toLocaleString("ar-YE")} ريال سعودي`;
  } else if (currency === "USD") {
    const priceUSD = (priceYER / 530).toFixed(1);
    return `$${priceUSD}`;
  }

  return `${priceYER.toLocaleString("ar-YE")} ريال`;
}
