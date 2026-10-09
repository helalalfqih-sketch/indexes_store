export interface BrandOption {
  id: string;
  name: string;
  label: string;
  keywords: string[];
  /** Exact catalog vendor values accepted by Shopify/Supabase server filters. */
  vendors: string[];
}

export const STORE_BRANDS: BrandOption[] = [
  {
    id: "indexes",
    name: "إندكس",
    label: "إندكس INDEXES",
    keywords: ["إندكس", "indexes", "vip"],
    vendors: ["Indexes", "INDEXES", "إندكس"],
  },
  {
    id: "anker",
    name: "أنكر",
    label: "أنكر Anker",
    keywords: ["anker", "أنكر", "eufy", "soundcore"],
    vendors: ["Anker", "ANKER", "أنكر", "Eufy", "Soundcore"],
  },
  {
    id: "apple",
    name: "أبل",
    label: "أبل Apple",
    keywords: ["apple", "أبل", "آيفون", "ايفون", "airpods", "ipad"],
    vendors: ["Apple", "APPLE", "أبل"],
  },
  {
    id: "samsung",
    name: "سامسونج",
    label: "سامسونج Samsung",
    keywords: ["samsung", "سامسونج", "galaxy"],
    vendors: ["Samsung", "SAMSUNG", "سامسونج"],
  },
  {
    id: "xiaomi",
    name: "شاومي",
    label: "شاومي Xiaomi",
    keywords: ["xiaomi", "شاومي", "redmi", "poco"],
    vendors: ["Xiaomi", "XIAOMI", "شاومي", "Redmi", "Poco"],
  },
  {
    id: "hoco",
    name: "هوكو",
    label: "هوكو Hoco",
    keywords: ["hoco", "هوكو"],
    vendors: ["Hoco", "HOCO", "هوكو"],
  },
  {
    id: "baseus",
    name: "بيسوس",
    label: "بيسوس Baseus",
    keywords: ["baseus", "بيسوس"],
    vendors: ["Baseus", "BASEUS", "بيسوس"],
  },
  {
    id: "joyroom",
    name: "جويروم",
    label: "جويروم Joyroom",
    keywords: ["joyroom", "جويروم"],
    vendors: ["Joyroom", "JOYROOM", "جويروم"],
  },
  {
    id: "sony",
    name: "سوني",
    label: "سوني Sony",
    keywords: ["sony", "سوني"],
    vendors: ["Sony", "SONY", "سوني"],
  },
  {
    id: "denx",
    name: "دنيكس",
    label: "دنيكس Denx",
    keywords: ["denx", "دنيكس"],
    vendors: ["Denx", "DENX", "دنيكس"],
  },
];

export function resolveBrandVendorValues(brandIds: string[]): string[] {
  return [
    ...new Set(
      brandIds.flatMap((brandId) => {
        const option = STORE_BRANDS.find((brand) => brand.id === brandId);
        return option?.vendors ?? [brandId];
      }),
    ),
  ].sort((left, right) => left.localeCompare(right, "ar"));
}

export interface RatingOption {
  id: string;
  label: string;
  minRating: number;
  stars: number;
}

export const RATING_OPTIONS: RatingOption[] = [
  { id: "5.0", label: "5.0 نجوم (أعلى تقييم)", minRating: 4.9, stars: 5 },
  { id: "4.8", label: "4.8+ نجوم (ممتاز جداً)", minRating: 4.8, stars: 4.8 },
  { id: "4.5", label: "4.5+ نجوم (ممتاز)", minRating: 4.5, stars: 4.5 },
  { id: "4.0", label: "4.0+ نجوم (جيد جداً)", minRating: 4.0, stars: 4 },
];
