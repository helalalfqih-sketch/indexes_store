export type Currency = "YER" | "SAR" | "USD";

export interface Product {
  id: string;
  slug?: string;
  name: string;
  subtitle: string;
  description: string;
  priceYER: number;
  originalPriceYER: number;
  discountBadge?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  gallery?: string[];
  category: string;
  inStock: boolean;
  isBestOffer?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  specs?: Record<string, string>;
  colors?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface OrderStatus {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  governorate: string;
  address: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalPriceYER: number;
  status: "received" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  statusLabel: string;
  date: string;
  paymentMethod: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "offer" | "order" | "system";
  link?: string;
}

export type ActiveTab = "home" | "search" | "cart" | "whatsapp" | "account" | "orders" | "wishlist";

export type SortOption = "default" | "price-high" | "price-low" | "best-selling" | "newest";
