import { Currency } from './types';

export function formatPrice(priceYER?: number | string | null, currency: Currency = 'YER'): string {
  const numericPrice = typeof priceYER === 'number' ? priceYER : Number(priceYER) || 0;
  
  if (currency === 'SAR') {
    // Approx 1 SAR ≈ 140 YER
    const priceSAR = Math.round(numericPrice / 140);
    return `${(priceSAR || 0).toLocaleString('ar-YE')} ريال سعودي`;
  } else if (currency === 'USD') {
    // Approx 1 USD ≈ 530 YER
    const priceUSD = ((numericPrice || 0) / 530).toFixed(1);
    return `$${priceUSD}`;
  }
  
  // Default YER
  return `${(numericPrice || 0).toLocaleString('ar-YE')} ريال`;
}
