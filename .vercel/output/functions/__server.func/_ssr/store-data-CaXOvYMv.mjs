//#region node_modules/.nitro/vite/services/ssr/assets/store-data-CaXOvYMv.js
var STORE_CONTACT = "771370740";
var CURRENCY = "ر.ي";
var categories = [
	{
		id: "kitchen",
		name: "🍳 المطبخ",
		icon: "Utensils",
		color: "from-orange-400 to-amber-600"
	},
	{
		id: "storage_organization",
		name: "🧺 التنظيم والتخزين",
		icon: "Archive",
		color: "from-yellow-500 to-amber-700"
	},
	{
		id: "beauty_care",
		name: "🧴 الجمال والعناية",
		icon: "Sparkles",
		color: "from-pink-400 to-fuchsia-600"
	},
	{
		id: "health_massage",
		name: "💆 الصحة والمساج",
		icon: "Activity",
		color: "from-red-400 to-rose-600"
	},
	{
		id: "tools_hardware",
		name: "🛠️ العدد والأدوات",
		icon: "Wrench",
		color: "from-slate-500 to-slate-700"
	},
	{
		id: "automotive",
		name: "🚗 السيارات",
		icon: "Car",
		color: "from-blue-500 to-indigo-600"
	},
	{
		id: "sports_fitness",
		name: "🏃 الرياضة واللياقة",
		icon: "Flame",
		color: "from-emerald-400 to-teal-600"
	},
	{
		id: "camping_outdoor",
		name: "🏕️ الرحلات والخارجية",
		icon: "Compass",
		color: "from-lime-500 to-green-700"
	},
	{
		id: "kids_toys",
		name: "👶 الأطفال والألعاب",
		icon: "Baby",
		color: "from-cyan-400 to-sky-600"
	},
	{
		id: "electronics",
		name: "🔌 الإلكترونيات",
		icon: "Smartphone",
		color: "from-purple-500 to-violet-700"
	},
	{
		id: "home_decor",
		name: "🏠 المنزل والديكور",
		icon: "Home",
		color: "from-yellow-600 to-amber-800"
	},
	{
		id: "lighting_energy",
		name: "💡 الإضاءة والطاقة",
		icon: "Zap",
		color: "from-yellow-400 to-amber-500"
	},
	{
		id: "pets",
		name: "🐾 الحيوانات الأليفة",
		icon: "Dog",
		color: "from-orange-500 to-orange-700"
	},
	{
		id: "general_miscellaneous",
		name: "🛍️ متنوعات",
		icon: "ShoppingBag",
		color: "from-pink-500 to-rose-600"
	}
];
var img = (seed) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;
var products = [
	{
		id: "p1",
		slug: "wireless-earbuds-pro",
		name: "سماعات لاسلكية Pro",
		description: "سماعات بلوتوث بجودة صوت عالية، عزل ضوضاء، بطارية تدوم 24 ساعة.",
		price: 12500,
		oldPrice: 16e3,
		stock: 34,
		image: img("photo-1590658268037-6bf12165a8df"),
		rating: 4.7,
		reviews: 128,
		categoryId: "electronics",
		badge: "الأكثر مبيعاً",
		videoPlaybackId: "rR8P8mSaKDzz02TsftugTUdI00cQPJX00oy"
	},
	{
		id: "p2",
		slug: "smart-watch-x",
		name: "ساعة ذكية X-Series",
		description: "ساعة ذكية بشاشة AMOLED، تتبع اللياقة، مقاومة للماء.",
		price: 18900,
		oldPrice: 24e3,
		stock: 12,
		image: img("photo-1523275335684-37898b6baf30"),
		rating: 4.6,
		reviews: 96,
		categoryId: "electronics",
		badge: "خصم 21%",
		videoPlaybackId: "rR8P8mSaKDzz02TsftugTUdI00cQPJX00oy"
	},
	{
		id: "p3",
		slug: "car-vacuum",
		name: "مكنسة سيارة محمولة",
		description: "شفط قوي 120 واط، خفيفة، سهلة الاستخدام لتنظيف السيارة.",
		price: 6800,
		stock: 45,
		image: img("photo-1607853202273-797f1c22a38e"),
		rating: 4.4,
		reviews: 54,
		categoryId: "automotive"
	},
	{
		id: "p4",
		slug: "kitchen-blender",
		name: "خلاط كهربائي احترافي",
		description: "خلاط 1000 واط بشفرات فولاذية، مناسب للعصير والطحن.",
		price: 9500,
		oldPrice: 11500,
		stock: 20,
		image: img("photo-1570222094114-d054a817e56b"),
		rating: 4.5,
		reviews: 71,
		categoryId: "kitchen",
		badge: "عرض اليوم"
	},
	{
		id: "p5",
		slug: "mens-jacket",
		name: "جاكيت رجالي شتوي",
		description: "جاكيت أنيق مقاوم للبرد، متوفر بمقاسات متعددة.",
		price: 14200,
		stock: 18,
		image: img("photo-1551028719-00167b16eac5"),
		rating: 4.3,
		reviews: 32,
		categoryId: "general_miscellaneous"
	},
	{
		id: "p6",
		slug: "kids-toy-car",
		name: "سيارة أطفال بريموت",
		description: "سيارة قابلة للشحن مع جهاز تحكم عن بعد وأضواء.",
		price: 8700,
		stock: 27,
		image: img("photo-1558877385-8c1c72237c2c"),
		rating: 4.8,
		reviews: 44,
		categoryId: "kids_toys",
		badge: "جديد"
	},
	{
		id: "p7",
		slug: "beauty-serum",
		name: "سيروم مرطب للبشرة",
		description: "سيروم فيتامين C لتفتيح البشرة وترطيبها.",
		price: 4500,
		oldPrice: 6e3,
		stock: 60,
		image: img("photo-1556228578-8c89e6adf883"),
		rating: 4.6,
		reviews: 89,
		categoryId: "beauty_care",
		badge: "خصم"
	},
	{
		id: "p8",
		slug: "power-drill",
		name: "مثقاب كهربائي 18V",
		description: "مثقاب قوي مع بطارية قابلة للشحن ومجموعة رؤوس.",
		price: 22e3,
		stock: 9,
		image: img("photo-1504148455328-c376907d081c"),
		rating: 4.7,
		reviews: 38,
		categoryId: "tools_hardware"
	}
];
var formatPrice = (n) => new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n) + " ر.ي";
//#endregion
export { products as a, formatPrice as i, STORE_CONTACT as n, categories as r, CURRENCY as t };
