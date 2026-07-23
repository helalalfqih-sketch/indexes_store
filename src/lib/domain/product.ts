export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category_id: string | null;
  brand: string | null;
  images: string[];
  model_url: string | null;
  stock: number;
  reserved_stock: number;
  rating: number;
  reviews_count: number;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  video_playback_id: string | null;
  
  // Backwards compatibility fields
  old_price?: number | null;
  badge?: string | null;

  // V2 fields
  sku?: string | null;
  barcode?: string | null;
  compare_at_price?: number | null;
  cost_price?: number | null;
  model_3d_url?: string | null;
  model_3d_thumbnail?: string | null;
  model_3d_status?: string | null;
  availability?: string | null;
  condition?: string | null;
  source_url?: string | null;
  meta_sync_status?: string | null;
  /** Manufacturer Part Number */
  mpn?: string | null;
  /** Explicit GTIN-8 (overrides barcode-length detection) */
  gtin8?: string | null;
  /** Explicit GTIN-12 / UPC (overrides barcode-length detection) */
  gtin12?: string | null;
  /** Explicit GTIN-13 / EAN (overrides barcode-length detection) */
  gtin13?: string | null;
  /** Explicit GTIN-14 (overrides barcode-length detection) */
  gtin14?: string | null;

  // V3 CMS fields
  featured?: boolean | null;
  is_deal?: boolean | null;
  deal_start?: string | null;
  deal_end?: string | null;
};

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort: number;
};
