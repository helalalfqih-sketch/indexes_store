import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Suspense,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles as SparklesIcon,
  ShoppingCart,
  Heart,
  Share2,
  Compass,
  Shuffle,
  Eye,
  ChevronLeft,
  Check,
  Play,
  Grid,
  HelpCircle,
  ShieldCheck,
  Layers,
  Info,
  Scale,
  ArrowRight,
  RotateCcw,
  Sparkle,
  CheckCircle2,
  Gift,
  Zap,
  DollarSign,
  Package,
} from "lucide-react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";
import { useLiteMode } from "@/lib/liteMode";

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">&#1604;&#1575; &#1578;&#1578;&#1608;&#1601;&#1585; &#1589;&#1608;&#1585;&#1577;</text></svg>';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

// Error boundary for 3D Canvas context loss / failure
interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("ProductUniverse WebGL fallback triggered:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ProductUniverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProductDetails: (product: Product) => void;
  onOpenStory?: (product: Product) => void;
  onOpenCart?: () => void;
}

// Smart Touch-Aware OrbitControls for Universe Canvas
const UniverseSmartOrbitControls: React.FC<React.ComponentProps<typeof OrbitControls>> = (
  props,
) => {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    canvas.style.touchAction = "pan-y";

    let touchStartX = 0;
    let touchStartY = 0;
    let isVerticalScroll = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isVerticalScroll = false;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isVerticalScroll) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

        if (deltaY > deltaX && deltaY > 5) {
          isVerticalScroll = true;
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
        }
      }
    };

    const handleTouchEnd = () => {
      isVerticalScroll = false;
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [gl]);

  return <OrbitControls ref={controlsRef} {...props} />;
};

// Analytics Event Logger
const logUniverseEvent = (eventName: string, details?: Record<string, unknown>) => {
  console.log(`[ProductUniverse Analytics] ${eventName}`, details || {});
};

// Intent Portal Choice Types
type IntentType = "all" | "utility" | "gift" | "problem" | "fun" | "budget";

interface IntentOption {
  id: IntentType;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "utility",
    title: "أريد شيئاً مفيداً يومياً",
    desc: "منتجات تمنحك سهولة وكفاءة في روتينك",
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  {
    id: "gift",
    title: "أبحث عن هدية مميزة",
    desc: "خيارات راقية تناسب الإهداء والمناسبات",
    icon: <Gift className="w-4 h-4 text-pink-400" />,
  },
  {
    id: "problem",
    title: "أريد حل مشكلة مزعجة",
    desc: "أدوات وحلول ذكية للتحديات اليومية",
    icon: <HelpCircle className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: "fun",
    title: "أبحث عن شيء ممتع",
    desc: "إلكترونيات واكسسوارات ترفيهية مبتكرة",
    icon: <SparklesIcon className="w-4 h-4 text-purple-400" />,
  },
  {
    id: "budget",
    title: "لدي ميزانية محددة",
    desc: "أفضل القيمة مقابل السعر وضمن ميزانيتك",
    icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
  },
];

// 3D Universe Particle Planet Component
const UniversePlanet: React.FC<{
  isHoveredOrFocused: boolean;
  activeCategory: string;
  activeIntent: IntentType;
}> = ({ isHoveredOrFocused, activeCategory, activeIntent }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Dynamic color based on category/intent
  const ringColor = useMemo(() => {
    if (activeIntent === "utility") return "#f59e0b";
    if (activeIntent === "gift") return "#ec4899";
    if (activeIntent === "problem") return "#00f0ff";
    if (activeIntent === "fun") return "#a855f7";
    if (activeIntent === "budget") return "#10b981";

    switch (activeCategory) {
      case "offers":
        return "#f59e0b";
      case "cards":
        return "#ec4899";
      case "electronics":
        return "#00f0ff";
      default:
        return "#8b5cf6";
    }
  }, [activeCategory, activeIntent]);

  // Particle positions & colors (Fibonacci sphere distribution)
  const { positions, colors } = useMemo(() => {
    const count = 3200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const phi = (1 + Math.sqrt(5)) / 2;
    const radius = 2.4;

    const cyan = new THREE.Color("#00f0ff");
    const magenta = new THREE.Color("#ff007f");
    const violet = new THREE.Color("#8b5cf6");
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;

      const jitter = (Math.random() - 0.5) * 0.15;
      const r = radius + jitter;

      pos[i * 3] = r * radiusAtY * Math.cos(theta);
      pos[i * 3 + 1] = r * y;
      pos[i * 3 + 2] = r * radiusAtY * Math.sin(theta);

      const t = (y + 1) / 2;
      if (t > 0.5) {
        tempColor.copy(cyan).lerp(magenta, (t - 0.5) * 2);
      } else {
        tempColor.copy(magenta).lerp(violet, t * 2);
      }

      col[i * 3] = tempColor.r;
      col[i * 3 + 1] = tempColor.g;
      col[i * 3 + 2] = tempColor.b;
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    const speed = isHoveredOrFocused ? 0.05 : 0.18;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * speed;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * (speed * 1.2);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * (speed * 0.9);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Primary Equatorial Ring */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.2, 0.008, 16, 100]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary Orbital Ring */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[3.05, 0.006, 16, 100]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Orbiting 3D Product Node
interface OrbitProductNodeProps {
  product: Product;
  index: number;
  total: number;
  isFocused: boolean;
  isFavorite: boolean;
  isCompared: boolean;
  currency: Currency;
  onSelect: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
}

const OrbitProductNode: React.FC<OrbitProductNodeProps> = ({
  product,
  index,
  total,
  isFocused,
  isFavorite,
  isCompared,
  onSelect,
  onToggleFavorite,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() => {
    const radius = isFocused ? 0 : 3.4;
    const angle = (index / Math.max(total, 1)) * Math.PI * 2;
    const elevation = Math.sin(index * 1.5) * 1.2;

    const x = radius * Math.cos(angle);
    const y = elevation;
    const z = radius * Math.sin(angle);
    return [x, y, z] as [number, number, number];
  }, [index, total, isFocused]);

  return (
    <group ref={groupRef} position={position}>
      <Html center distanceFactor={8} zIndexRange={[100, 0]} style={{ pointerEvents: "auto" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`relative cursor-pointer select-none transition-all duration-300 group flex flex-col items-center ${
            isFocused ? "scale-125 z-50" : "hover:scale-115"
          }`}
        >
          {/* Glass Card Container */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 p-1.5 rounded-2xl backdrop-blur-xl border flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
              isFocused
                ? "bg-[#2F6BFF]/40 border-[#2F6BFF] shadow-[0_0_30px_rgba(47,107,255,0.9)]"
                : hovered
                  ? "bg-[#0d091f]/90 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                  : "bg-[#090617]/80 border-white/15 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            }`}
          >
            <img
              src={product.image || FALLBACK_IMAGE}
              alt={product.name}
              onError={handleImageError}
              className="w-full h-full object-contain pointer-events-none transition-transform group-hover:scale-105"
            />

            {/* Favorite Star Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product);
              }}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-black text-amber-400 transition-transform cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart
                className={`w-3 h-3 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-400"}`}
              />
            </button>

            {/* Compared Badge */}
            {isCompared && (
              <span className="absolute top-1 left-1 bg-cyan-500 text-black p-0.5 rounded-full">
                <Scale className="w-2.5 h-2.5" />
              </span>
            )}

            {/* Discount Badge */}
            {product.originalPriceYER && product.originalPriceYER > product.priceYER && (
              <span className="absolute bottom-0.5 left-0.5 text-[8px] font-black bg-rose-600 text-white px-1 rounded">
                خصم
              </span>
            )}
          </div>

          {/* Label below node */}
          <div className="mt-1 px-1.5 py-0.5 rounded-full bg-[#070512]/90 border border-white/10 text-[9px] font-bold text-white max-w-[90px] truncate text-center shadow-md">
            {product.name}
          </div>
        </div>
      </Html>
    </group>
  );
};

export const ProductUniverseModal: React.FC<ProductUniverseModalProps> = ({
  isOpen,
  onClose,
  products = [],
  currency = "YER",
  favorites = [],
  onToggleFavorite,
  onAddToCart,
  onSelectProductDetails,
  onOpenStory,
  onOpenCart,
}) => {
  const { isActive: isLiteMode } = useLiteMode();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeIntent, setActiveIntent] = useState<IntentType>("all");
  const [showIntentPortal, setShowIntentPortal] = useState<boolean>(true);
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  const [showIntroSequence, setShowIntroSequence] = useState<boolean>(true);
  const [is2DMirror, setIs2DMirror] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<{ msg: string; canUndo?: boolean } | null>(null);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourIndex, setTourIndex] = useState<number>(0);

  // Expanded Product Views State
  const [activeTabModal, setActiveTabModal] = useState<
    "demo" | "why" | "confidence" | "preview" | null
  >(null);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Filter products by active category & intent
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by Intent
    if (activeIntent === "utility") {
      result = products.filter((p) => p.category === "electronics" || p.inStock);
    } else if (activeIntent === "gift") {
      result = products.filter(
        (p) => p.category === "watches" || (p.originalPriceYER && p.originalPriceYER > p.priceYER),
      );
    } else if (activeIntent === "problem") {
      result = products.filter((p) => p.category === "electronics" || p.category === "cards");
    } else if (activeIntent === "fun") {
      result = products.filter((p) => p.category === "electronics" || p.category === "watches");
    } else if (activeIntent === "budget") {
      result = [...products].sort((a, b) => a.priceYER - b.priceYER);
    }

    // Filter by Category
    if (activeCategory === "offers") {
      result = result.filter((p) => p.originalPriceYER && p.originalPriceYER > p.priceYER);
    } else if (activeCategory === "favorites") {
      result = result.filter((p) => favorites.includes(p.id));
    } else if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    return result.length > 0 ? result : products;
  }, [products, activeCategory, activeIntent, favorites]);

  // Handle modal opening
  useEffect(() => {
    if (isOpen) {
      logUniverseEvent("product_universe_opened", { totalProducts: products.length });
      document.body.style.overflow = "hidden";
      setShowIntroSequence(true);
      setShowIntentPortal(true);
      const timer = setTimeout(() => setShowIntroSequence(false), 1400);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      setFocusedProduct(null);
      setIsTourActive(false);
      setActiveTabModal(null);
    }
  }, [isOpen, products.length]);

  const handleSelectProduct = (product: Product) => {
    setFocusedProduct(product);
    setQuantity(1);
    setActiveTabModal(null);
    logUniverseEvent("universe_product_focused", {
      productId: product.id,
      productName: product.name,
    });

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* Vibration may be unavailable on this device. */
      }
    }
  };

  const handleAddToCartWithFly = () => {
    if (!focusedProduct) return;
    onAddToCart(focusedProduct, quantity);
    setLastAddedProduct(focusedProduct);
    logUniverseEvent("universe_add_to_cart", { productId: focusedProduct.id, quantity });

    setToastMsg({ msg: `تمت إضافة ${focusedProduct.name} إلى السلة 🛒`, canUndo: true });
    setTimeout(() => setToastMsg(null), 4000);

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([15, 30, 15]);
      } catch {
        /* Vibration may be unavailable on this device. */
      }
    }
  };

  const handleToggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        setToastMsg({ msg: "يمكنك مقارنة 3 منتجات كحد أقصى" });
        setTimeout(() => setToastMsg(null), 2500);
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleSurpriseMe = () => {
    if (filteredProducts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredProducts.length);
    const randomProduct = filteredProducts[randomIndex];
    handleSelectProduct(randomProduct);
    logUniverseEvent("universe_surprise_used", { productId: randomProduct.id });
  };

  const handleStartTour = () => {
    if (filteredProducts.length === 0) return;
    setIsTourActive(true);
    setTourIndex(0);
    handleSelectProduct(filteredProducts[0]);
    logUniverseEvent("universe_guided_tour_started");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] bg-[#03010b] text-white flex flex-col justify-between overflow-hidden dir-rtl select-none font-sans">
        {/* Intent Portal Dialog Modal */}
        <AnimatePresence>
          {showIntentPortal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <div className="bg-[#0e0a26] border border-purple-500/30 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-[0_0_50px_rgba(139,92,246,0.3)] text-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3 text-purple-300">
                  <SparklesIcon className="w-6 h-6 animate-pulse" />
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mb-1">
                  دعنا نفتح لك العالم المناسب ✨
                </h3>
                <p className="text-xs text-gray-300 mb-4">ما الذي سيجعل يومك أفضل اليوم؟</p>

                <div className="space-y-2 text-right">
                  {INTENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveIntent(opt.id);
                        setShowIntentPortal(false);
                        logUniverseEvent("universe_intent_selected", { intent: opt.id });
                      }}
                      className="w-full bg-[#161138] hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group"
                    >
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">
                        {opt.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-purple-300">
                          {opt.title}
                        </div>
                        <div className="text-[10px] text-gray-400">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400">
                    سنستخدم اختيارك لترتيب المنتجات المناسبة فقط
                  </span>
                  <button
                    onClick={() => {
                      setShowIntentPortal(false);
                      logUniverseEvent("universe_intent_skipped");
                    }}
                    className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                  >
                    تخطي والاستكشاف بحرية
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Controls Bar */}
        <div className="relative z-30 px-4 py-2.5 bg-gradient-to-b from-[#060315]/90 to-transparent flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2F6BFF]/20 border border-[#2F6BFF]/40 flex items-center justify-center text-[#2F6BFF]">
              <Compass className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>عالم منتجات إندكس</span>
                {activeIntent !== "all" && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    مسار مخصص
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-gray-400">استكشاف سينمائي تفاعلي للمنتجات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Compare Constellation Badge */}
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>مقارنة ({compareList.length})</span>
              </button>
            )}

            {/* Change Intent Button */}
            <button
              onClick={() => setShowIntentPortal(true)}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">تغيير الهدف</span>
            </button>

            {/* Toggle 2D Accessible Mirror Mode */}
            <button
              onClick={() => setIs2DMirror(!is2DMirror)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>{is2DMirror ? "عرض 3D" : "عرض مبسّط"}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                logUniverseEvent("product_universe_exited");
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center border border-gray-700 transition-colors cursor-pointer"
              aria-label="إغلاق عالم المنتجات"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 3D Stage / 2D Mirror Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* Toast Notification inside Universe */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[190] bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/40"
              >
                <Check className="w-4 h-4" />
                <span>{toastMsg.msg}</span>
                {toastMsg.canUndo && (
                  <button
                    onClick={() => {
                      setToastMsg(null);
                      logUniverseEvent("universe_add_to_cart_undone");
                    }}
                    className="underline text-amber-200 mr-2 cursor-pointer font-bold"
                  >
                    تراجع
                  </button>
                )}
                {onOpenCart && (
                  <button
                    onClick={onOpenCart}
                    className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full mr-1 cursor-pointer"
                  >
                    السلة
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2D Accessible Mirror View */}
          {is2DMirror || isLiteMode ? (
            <div className="w-full h-full overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#03010b]">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500/50 transition-all cursor-pointer"
                >
                  <img
                    src={prod.image || FALLBACK_IMAGE}
                    alt={prod.name}
                    onError={handleImageError}
                    className="w-full h-20 object-contain mb-2"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">
                      {formatPrice(prod.priceYER, currency)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, 1);
                      setToastMsg({ msg: `تمت إضافة ${prod.name} للسلة` });
                      setTimeout(() => setToastMsg(null), 2500);
                    }}
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>أضف للسلة</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* 3D WebGL Canvas Scene */
            <div className="w-full h-full relative z-10 bg-[#03010b]">
              <WebGLErrorBoundary
                fallback={
                  <div className="w-full h-full overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#03010b]">
                    {filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        <img
                          src={prod.image || FALLBACK_IMAGE}
                          alt={prod.name}
                          onError={handleImageError}
                          className="w-full h-20 object-contain mb-2"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                          <p className="text-xs font-black text-emerald-400 mt-0.5">
                            {formatPrice(prod.priceYER, currency)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(prod, 1);
                            setToastMsg({ msg: `تمت إضافة ${prod.name} للسلة` });
                            setTimeout(() => setToastMsg(null), 2500);
                          }}
                          className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>أضف للسلة</span>
                        </button>
                      </div>
                    ))}
                  </div>
                }
              >
                <Canvas
                  camera={{ position: [0, 0, 8], fov: 45 }}
                  dpr={[1, 1.5]}
                  gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: "high-performance",
                    failIfMajorPerformanceCaveat: false,
                  }}
                  style={{ width: "100%", height: "100%", background: "transparent" }}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#00f0ff" />
                    <pointLight position={[-10, -10, -10]} intensity={2} color="#ff007f" />

                    <Stars radius={60} depth={40} count={800} factor={3} fade speed={1} />
                    <Sparkles count={50} scale={10} size={2} color="#00f0ff" />

                    <UniversePlanet
                      isHoveredOrFocused={Boolean(focusedProduct)}
                      activeCategory={activeCategory}
                      activeIntent={activeIntent}
                    />

                    {filteredProducts.slice(0, 16).map((prod, idx) => (
                      <OrbitProductNode
                        key={prod.id}
                        product={prod}
                        index={idx}
                        total={Math.min(filteredProducts.length, 16)}
                        isFocused={focusedProduct?.id === prod.id}
                        isFavorite={favorites.includes(prod.id)}
                        isCompared={compareList.some((p) => p.id === prod.id)}
                        currency={currency}
                        onSelect={handleSelectProduct}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}

                    <UniverseSmartOrbitControls
                      autoRotate={!focusedProduct}
                      autoRotateSpeed={0.4}
                      enableZoom={true}
                      enablePan={false}
                      maxDistance={12}
                      minDistance={4}
                    />
                  </Suspense>
                </Canvas>
              </WebGLErrorBoundary>
            </div>
          )}

          {/* Compact Focused Product Showcase Stage Card */}
          <AnimatePresence>
            {focusedProduct && (
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="absolute bottom-14 sm:bottom-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] z-[160] bg-[#0c0822]/95 border border-purple-500/40 rounded-3xl p-3.5 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
              >
                {/* Header & 3-Second Value Reveal */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-800 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <img
                      src={focusedProduct.image}
                      alt={focusedProduct.name}
                      className="w-12 h-12 object-contain bg-black/40 rounded-xl p-1 border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-white truncate">
                        {focusedProduct.name}
                      </h3>
                      {/* 3-Second Value Statement */}
                      <p className="text-[10px] text-purple-300 line-clamp-1 mt-0.5">
                        {focusedProduct.category === "watches"
                          ? "ساعة أنيقة وعالية الجودة للاستخدام اليومي"
                          : focusedProduct.category === "electronics"
                            ? "حل تقني مبتكر يمنحك الراحة والكفاءة"
                            : "بطاقات وخدمات رقمية فورية بأعلى أمان"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-emerald-400">
                          {formatPrice(focusedProduct.priceYER, currency)}
                        </span>
                        {focusedProduct.originalPriceYER && (
                          <span className="text-[10px] text-gray-500 line-through">
                            {formatPrice(focusedProduct.originalPriceYER, currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setFocusedProduct(null)}
                    className="p-1 rounded-full hover:bg-gray-800 text-gray-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Actions Row */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-black/40 border border-gray-700 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-1.5 text-xs font-bold text-white">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCartWithFly}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>أضف إلى السلة</span>
                    </button>
                  </div>

                  {/* Ethical Exploration Action Chips */}
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] pt-1">
                    <button
                      onClick={() => setActiveTabModal("demo")}
                      className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-purple-500/30 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-purple-400" />
                      <span>أرني فائدته</span>
                    </button>

                    <button
                      onClick={() => setActiveTabModal("why")}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      <span>لماذا ظهر؟</span>
                    </button>

                    <button
                      onClick={() => setActiveTabModal("confidence")}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-cyan-500/30 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>قبل أن تشتري</span>
                    </button>

                    <button
                      onClick={() => handleToggleCompare(focusedProduct)}
                      className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border cursor-pointer ${
                        compareList.some((p) => p.id === focusedProduct.id)
                          ? "bg-cyan-500 text-black border-cyan-400"
                          : "bg-gray-800/80 hover:bg-gray-700 text-gray-200 border-gray-700"
                      }`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>
                        {compareList.some((p) => p.id === focusedProduct.id) ? "مقارَن" : "قارن"}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Modal Drawers for "Show Me", "Why It Fits", "Confidence" */}
          <AnimatePresence>
            {activeTabModal && focusedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
              >
                <div className="bg-[#0e0a26] border border-purple-500/40 rounded-3xl p-5 max-w-sm w-full relative text-right">
                  <button
                    onClick={() => setActiveTabModal(null)}
                    className="absolute top-4 left-4 p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* TAB 1: SHOW ME DEMO */}
                  {activeTabModal === "demo" && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-purple-300 font-bold text-xs">
                        <Play className="w-4 h-4 text-purple-400" />
                        <span>عرض الفائدة والتجربة الميدانية</span>
                      </div>
                      <img
                        src={focusedProduct.image}
                        alt=""
                        className="w-full h-36 object-contain bg-black/40 rounded-2xl p-2 mb-3 border border-white/10"
                      />
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>مصمم بجودة متينة لتلبية الاستخدام اليومي المكثف</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>سهل الاستخدام ويوفر القيمة العالية مقابل السعر</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WHY IT FITS */}
                  {activeTabModal === "why" && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-amber-300 font-bold text-xs">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>شفافية التوصية — لماذا ظهر لك؟</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>
                            يتوافق مع هدف الاستكشاف الذي اخترته (
                            {activeIntent === "all" ? "حر" : activeIntent})
                          </span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>ضمن الفئة التي اخترتها</span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>تحقق من توفر المنتج وتفاصيل تسليمه قبل الطلب</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONFIDENCE BEFORE PURCHASE */}
                  {activeTabModal === "confidence" && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-cyan-300 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>قبل أن تشتري — معلومات الثقة</span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                          <span className="font-bold text-white block mb-0.5">
                            📦 محتويات العبوة:
                          </span>
                          <span>اطلب من خدمة العملاء تأكيد محتويات العبوة</span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                          <span className="font-bold text-white block mb-0.5">
                            🛡️ الضمان والاستبدال:
                          </span>
                          <span>اطلب شروط الضمان والاستبدال الخاصة بالمنتج</span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                          <span className="font-bold text-white block mb-0.5">🚚 التوصيل:</span>
                          <span>تُحدد تفاصيل التوصيل عند تأكيد الطلب</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTabModal(null)}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    حسناً، فهمت
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Constellation Modal */}
          <AnimatePresence>
            {showCompareModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
              >
                <div className="bg-[#0e0a26] border border-cyan-500/40 rounded-3xl p-5 max-w-2xl w-full text-right relative shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm sm:text-base font-black text-white">
                        مقارنة المنتجات ({compareList.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowCompareModal(false)}
                      className="p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {compareList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      لم تقم بإضافة أي منتج للمقارنة بعد.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {compareList.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col justify-between"
                        >
                          <div>
                            <img
                              src={prod.image}
                              alt=""
                              className="w-full h-24 object-contain mb-2"
                            />
                            <h4 className="text-xs font-bold text-white line-clamp-1">
                              {prod.name}
                            </h4>
                            <p className="text-xs font-black text-emerald-400 mt-1">
                              {formatPrice(prod.priceYER, currency)}
                            </p>
                            <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] space-y-1 text-gray-300">
                              <div>التوفر: {prod.inStock ? "متوفر" : "غير متوفر"}</div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <button
                              onClick={() => {
                                onAddToCart(prod, 1);
                                setToastMsg({ msg: `تمت إضافة ${prod.name} للسلة` });
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>أضف للسلة</span>
                            </button>
                            <button
                              onClick={() => handleToggleCompare(prod)}
                              className="w-full text-rose-400 hover:text-rose-300 text-[10px] py-1 cursor-pointer"
                            >
                              إزالة من المقارنة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Interactive Discovery Control Dock */}
        <div className="relative z-30 px-3 py-2 bg-[#080518]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: "all", label: "الكل" },
              { id: "offers", label: "🔥 العروض" },
              { id: "favorites", label: "⭐ المفضلة" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#2F6BFF] text-white shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Discovery Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Surprise Me Button */}
            <button
              onClick={handleSurpriseMe}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="اختيار منتج عشوائي"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>فاجئني 🎲</span>
            </button>

            {/* Guided Tour Toggle */}
            <button
              onClick={isTourActive ? () => setIsTourActive(false) : handleStartTour}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>{isTourActive ? "إيقاف الجولة" : "خذني في جولة ✨"}</span>
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
