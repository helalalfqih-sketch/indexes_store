export const STORE_CONTACT = "771370740";
export const CURRENCY = "ر.ي";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
  categoryId: string;
  badge?: string;
  videoPlaybackId?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const categories: Category[] = [
  { id: "kitchen", name: "🍳 المطبخ", icon: "Utensils", color: "from-orange-400 to-amber-600" },
  { id: "storage_organization", name: "🧺 التنظيم والتخزين", icon: "Archive", color: "from-yellow-500 to-amber-700" },
  { id: "beauty_care", name: "🧴 الجمال والعناية", icon: "Sparkles", color: "from-pink-400 to-fuchsia-600" },
  { id: "health_massage", name: "💆 الصحة والمساج", icon: "Activity", color: "from-red-400 to-rose-600" },
  { id: "tools_hardware", name: "🛠️ العدد والأدوات", icon: "Wrench", color: "from-slate-500 to-slate-700" },
  { id: "automotive", name: "🚗 السيارات", icon: "Car", color: "from-blue-500 to-indigo-600" },
  { id: "sports_fitness", name: "🏃 الرياضة واللياقة", icon: "Flame", color: "from-emerald-400 to-teal-600" },
  { id: "camping_outdoor", name: "🏕️ الرحلات والخارجية", icon: "Compass", color: "from-lime-500 to-green-700" },
  { id: "kids_toys", name: "👶 الأطفال والألعاب", icon: "Baby", color: "from-cyan-400 to-sky-600" },
  { id: "electronics", name: "🔌 الإلكترونيات", icon: "Smartphone", color: "from-purple-500 to-violet-700" },
  { id: "home_decor", name: "🏠 المنزل والديكور", icon: "Home", color: "from-yellow-600 to-amber-800" },
  { id: "lighting_energy", name: "💡 الإضاءة والطاقة", icon: "Zap", color: "from-yellow-400 to-amber-500" },
  { id: "pets", name: "🐾 الحيوانات الأليفة", icon: "Dog", color: "from-orange-500 to-orange-700" },
  { id: "general_miscellaneous", name: "🛍️ متنوعات", icon: "ShoppingBag", color: "from-pink-500 to-rose-600" },
];

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

export const products: Product[] = [
  {
    id: "p1",
    slug: "iphone-15-pro-max",
    name: "آيفون 15 برو ماكس 256 جيجابايت",
    description: "شاشة Super Retina XDR مقاس 6.7 بوصة، تصميم تيتانيوم قوي وخفيف، كاميرا رئيسية 48 ميجابكسل، منفذ USB-C.",
    price: 820000,
    oldPrice: 940000,
    stock: 34,
    image: img("photo-1510557880182-3d4d3cba35a5"),
    rating: 4.9,
    reviews: 128,
    categoryId: "electronics",
    badge: "الأكثر طلباً 🔥",
    videoPlaybackId: "rR8P8mSaKDzz02TsftugTUdI00cQPJX00oy",
  },
  {
    id: "p2",
    slug: "smart-robot-vacuum",
    name: "مكنسة روبوت ذكية لتنظيف المنازل",
    description: "تنظيف ذكي بالكامل، تتبع الخريطة بالليزر LiDAR، شفط فائق القوة للأتربة والسجاد، مسح رطب وجاف.",
    price: 245000,
    oldPrice: 280000,
    stock: 12,
    image: img("photo-1581092921461-eab62e97a780"),
    rating: 4.8,
    reviews: 96,
    categoryId: "home_decor",
    badge: "شحن مجاني 🚀",
  },
  {
    id: "p3",
    slug: "portable-blender",
    name: "خلاط الفواكه والبروتين المحمول",
    description: "خلاط عصائر لاسلكي قابل للشحن عبر USB، شفرات حادة، تصميم رياضي مناسب للجيم والرحلات.",
    price: 14500,
    oldPrice: 19000,
    stock: 45,
    image: img("photo-1578849278619-e73505e9610f"),
    rating: 4.6,
    reviews: 54,
    categoryId: "kitchen",
    badge: "عرض محدود",
  },
  {
    id: "p4",
    slug: "car-air-compressor",
    name: "منفاخ إطارات السيارة الكهربائي الذكي",
    description: "شاشة عرض رقمية مدمجة، إيقاف تلقائي ذكي عند الوصول للضغط المحدد، كشاف طوارئ مدمج.",
    price: 29500,
    oldPrice: 38000,
    stock: 20,
    image: img("photo-1486006920555-c77dce18193b"),
    rating: 4.7,
    reviews: 71,
    categoryId: "automotive",
    badge: "الأكثر مبيعاً",
    videoPlaybackId: "rR8P8mSaKDzz02TsftugTUdI00cQPJX00oy",
  },
  {
    id: "p5",
    slug: "multilayer-shoe-rack",
    name: "خزانة أحذية قماشية متعددة الطبقات",
    description: "هيكل متين مقاوم للصدأ، غطاء قماشي واقٍ من الغبار، تتسع لما يصل إلى 27 زوجاً من الأحذية.",
    price: 11200,
    stock: 18,
    image: img("photo-1595425970377-c9703cf48b6d"),
    rating: 4.3,
    reviews: 32,
    categoryId: "storage_organization",
    badge: "توفير المساحة",
  },
  {
    id: "p6",
    slug: "massage-gun-pro",
    name: "جهاز مساج وتدليك العضلات الاحترافي",
    description: "6 مستويات سرعة، 4 رؤوس تدليك مخصصة لراحة العضلات العميقة وتخفيف التوتر بعد التمرين.",
    price: 21000,
    oldPrice: 27000,
    stock: 27,
    image: img("photo-1540575467063-178a50c2df87"),
    rating: 4.8,
    reviews: 44,
    categoryId: "health_massage",
    badge: "صحة وعافية",
  },
  {
    id: "p7",
    slug: "sony-wh-1000xm5",
    name: "سماعات سوني WH-1000XM5 اللاسلكية",
    description: "أفضل عزل للضوضاء في العالم، صوت استثنائي عالي الدقة، ميكروفونات متطورة للمكالمات الواضحة.",
    price: 260000,
    oldPrice: 320000,
    stock: 60,
    image: img("photo-1505740420928-5e560c06d30e"),
    rating: 4.9,
    reviews: 89,
    categoryId: "electronics",
    badge: "خصم 20%",
    videoPlaybackId: "rR8P8mSaKDzz02TsftugTUdI00cQPJX00oy",
  },
  {
    id: "p8",
    slug: "electric-screwdriver-set",
    name: "طقم مفك براغي كهربائي 47 في 1",
    description: "مفك لاسلكي قابل للشحن مع مجموعة واسعة من الرؤوس المغناطيسية، كشاف LED مدمج لأعمال الصيانة الدقيقة.",
    price: 18500,
    stock: 9,
    image: img("photo-1581092160607-ee22621dd758"),
    rating: 4.7,
    reviews: 38,
    categoryId: "tools_hardware",
    badge: "جديد",
  },
];

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const getProductsByCategory = (id: string) =>
  products.filter((p) => p.categoryId === id);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n) + " " + CURRENCY;
