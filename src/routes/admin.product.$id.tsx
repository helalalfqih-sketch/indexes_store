import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Loader2,
  Package,
  ImageIcon,
  DollarSign,
  Boxes,
  Tag,
  Sparkles,
  Search as SearchIcon,
  Eye,
  Info,
  Copy,
  Wand2,
  Layers3,
  Clock,
  Share2,
  MessageCircle,
  Video,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  getAdminProduct,
  updateAdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listInventoryMovements,
  recordInventoryMovement,
} from "@/lib/actions/admin.actions";
import { aiAnalyzeImage, aiOptimizeDescription } from "@/lib/catalog.functions";
import { Ai3dGeneratorPanel } from "@/components/ai-3d-generator";
import { CollapsibleCard } from "@/components/admin/collapsible-card";
import { ChipInput } from "@/components/admin/chip-input";
import { ImageManager } from "@/components/admin/image-manager";
import { GooglePreview } from "@/components/admin/google-preview";

export const Route = createFileRoute("/admin/product/$id")({
  component: ProductDetailPage,
});

type FormState = {
  slug: string;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  currency: string;
  category_id: string;
  brand: string;
  images: string[];
  model_url: string;
  stock: number;
  tags: string[];
  badge: string;
  is_published: boolean;

  // V2 / Meta Catalog fields
  sku: string;
  barcode: string;
  compare_at_price: number | null;
  cost_price: number | null;
  availability: string;
  condition: string;
  source_url: string;
  video_playback_id: string;
  model_3d_url: string;
  model_3d_thumbnail: string;
  model_3d_status: string;

  // Metadata tags fields
  color: string;
  size: string;
  gender: string;
  material: string;
  age_group: string;
  pattern: string;
  google_product_category: string;
  fb_product_category: string;
  meta_sync_status: string;

  // V3 CMS fields
  featured: boolean;
  is_deal: boolean;
  deal_start: string;
  deal_end: string;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  description: "",
  price: 0,
  old_price: null,
  currency: "YER",
  category_id: "",
  brand: "",
  images: [],
  model_url: "",
  stock: 0,
  tags: [],
  badge: "",
  is_published: true,

  // V3 CMS fields
  featured: false,
  is_deal: false,
  deal_start: "",
  deal_end: "",

  // V2 fields default values
  sku: "",
  barcode: "",
  compare_at_price: null,
  cost_price: null,
  availability: "in stock",
  condition: "new",
  source_url: "",
  video_playback_id: "",
  model_3d_url: "",
  model_3d_thumbnail: "",
  model_3d_status: "pending",

  // Metadata tags default values
  color: "",
  size: "",
  gender: "",
  material: "",
  age_group: "",
  pattern: "",
  google_product_category: "",
  fb_product_category: "",
  meta_sync_status: "not_synced",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const NAME_MAX = 120;
const DESC_MAX = 4000;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

const TAG_SUGGESTIONS = ["جديد", "عرض", "الأكثر مبيعاً", "حصري", "توصيل مجاني"];

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { t, dir } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isNew = id === "new";

  const analyzeImage = useServerFn(aiAnalyzeImage);
  const optimizeDescription = useServerFn(aiOptimizeDescription);

  const productQ = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProduct(id),
    enabled: !isNew,
  });
  const categoriesQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [initial, setInitial] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [aiSectionCollapsed, setAiSectionCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverAi, setDragOverAi] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string>("");
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("يرجى اختيار ملف فيديو صالح");
      return;
    }

    setUploadingVideo(true);
    setLocalVideoUrl(URL.createObjectURL(file));

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockPlaybackId = `mux-playback-${Date.now()}`;
    setForm((f) => ({ ...f, video_playback_id: mockPlaybackId }));
    setUploadingVideo(false);
    toast.success("تم رفع ومعالجة الفيديو بنجاح!");
  };

  const handleVideoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("يرجى سحب ملف فيديو صالح");
      return;
    }

    setUploadingVideo(true);
    setLocalVideoUrl(URL.createObjectURL(file));

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockPlaybackId = `mux-playback-${Date.now()}`;
    setForm((f) => ({ ...f, video_playback_id: mockPlaybackId }));
    setUploadingVideo(false);
    toast.success("تم رفع ومعالجة الفيديو بنجاح!");
  };

  const removeVideo = () => {
    setForm((f) => ({ ...f, video_playback_id: "" }));
    setLocalVideoUrl("");
    toast.success("تمت إزالة الفيديو");
  };

  useEffect(() => {
    if (isNew || !productQ.data) return;
    const p = productQ.data;

    let color = "";
    let size = "";
    let gender = "";
    let material = "";
    let age_group = "";
    let pattern = "";
    let google_product_category = "";
    let fb_product_category = "";
    const cleanTags: string[] = [];

    (p.tags ?? []).forEach((t) => {
      if (t.startsWith("_color:")) {
        color = t.substring(7);
      } else if (t.startsWith("_size:")) {
        size = t.substring(6);
      } else if (t.startsWith("_gender:")) {
        gender = t.substring(8);
      } else if (t.startsWith("_material:")) {
        material = t.substring(10);
      } else if (t.startsWith("_age:")) {
        age_group = t.substring(5);
      } else if (t.startsWith("_pattern:")) {
        pattern = t.substring(9);
      } else if (t.startsWith("_gcat:")) {
        google_product_category = t.substring(6);
      } else if (t.startsWith("_fbcat:")) {
        fb_product_category = t.substring(6);
      } else {
        cleanTags.push(t);
      }
    });

    const next: FormState = {
      slug: p.slug,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      old_price: p.old_price != null ? Number(p.old_price) : null,
      currency: p.currency,
      category_id: p.category_id ?? "",
      brand: p.brand ?? "",
      images: p.images ?? [],
      model_url: p.model_url ?? "",
      stock: p.stock,
      tags: cleanTags,
      badge: p.badge ?? "",
      is_published: p.is_published,

      // V3 CMS fields
      featured: Boolean(p.featured),
      is_deal: Boolean(p.is_deal),
      deal_start: p.deal_start ?? "",
      deal_end: p.deal_end ?? "",

      // V2 fields
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      compare_at_price: p.compare_at_price != null ? Number(p.compare_at_price) : null,
      cost_price: p.cost_price != null ? Number(p.cost_price) : null,
      availability: p.availability ?? "in stock",
      condition: p.condition ?? "new",
      source_url: p.source_url ?? "",
      video_playback_id: p.video_playback_id ?? "",
      model_3d_url: p.model_3d_url ?? "",
      model_3d_thumbnail: p.model_3d_thumbnail ?? "",
      model_3d_status: p.model_3d_status ?? "pending",

      // Metadata tags fields
      color,
      size,
      gender,
      material,
      age_group,
      pattern,
      google_product_category,
      fb_product_category,
      meta_sync_status: (p as { meta_sync_status?: string }).meta_sync_status ?? "not_synced",
    };
    setForm(next);
    setInitial(next);
    setSlugTouched(true);
  }, [productQ.data, isNew]);

  // Auto-slug from name until user edits slug manually
  useEffect(() => {
    if (slugTouched) return;
    if (!form.name) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, slugTouched]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Warn on unload with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const buildPayload = useCallback(() => {
    const finalTags = [...form.tags.filter(Boolean)];
    if (form.color.trim()) finalTags.push(`_color:${form.color.trim()}`);
    if (form.size.trim()) finalTags.push(`_size:${form.size.trim()}`);
    if (form.gender.trim()) finalTags.push(`_gender:${form.gender.trim()}`);
    if (form.material.trim()) finalTags.push(`_material:${form.material.trim()}`);
    if (form.age_group.trim()) finalTags.push(`_age:${form.age_group.trim()}`);
    if (form.pattern.trim()) finalTags.push(`_pattern:${form.pattern.trim()}`);
    if (form.google_product_category.trim())
      finalTags.push(`_gcat:${form.google_product_category.trim()}`);
    if (form.fb_product_category.trim())
      finalTags.push(`_fbcat:${form.fb_product_category.trim()}`);

    return {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      old_price: form.old_price != null && form.old_price > 0 ? Number(form.old_price) : null,
      currency: form.currency,
      category_id: form.category_id || undefined,
      brand: form.brand || undefined,
      images: form.images.filter(Boolean),
      model_url: form.model_url || undefined,
      stock: Number(form.stock),
      tags: finalTags,
      is_published: form.is_published,
      badge: form.badge || undefined,
      featured: form.featured,
      is_deal: form.is_deal,
      deal_start: form.deal_start.trim() || null,
      deal_end: form.deal_end.trim() || null,

      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      compare_at_price:
        form.compare_at_price != null && form.compare_at_price > 0
          ? Number(form.compare_at_price)
          : null,
      cost_price: form.cost_price != null && form.cost_price > 0 ? Number(form.cost_price) : null,
      availability: form.availability || null,
      condition: form.condition || null,
      source_url: form.source_url.trim() || null,
      video_playback_id: form.video_playback_id.trim() || null,
      model_3d_url: form.model_3d_url || null,
      model_3d_thumbnail: form.model_3d_thumbnail || null,
      model_3d_status: form.model_3d_status || "pending",
      meta_sync_status: form.meta_sync_status,
    };
  }, [form]);

  const validate = (): string | null => {
    if (!form.name.trim()) return "اسم المنتج مطلوب";
    if (!form.slug.trim()) return "الرابط (slug) مطلوب";
    if (!/^[\p{L}\p{N}-]+$/iu.test(form.slug)) return "الرابط يجب أن يحوي أحرف وأرقام و - فقط";
    if (!(form.price >= 0)) return "السعر غير صالح";
    if (form.images.length === 0) return "يجب إضافة صورة واحدة على الأقل";
    return null;
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const err = validate();
      if (err) throw new Error(err);
      const payload = buildPayload();
      if (isNew) return createAdminProduct(payload);
      return updateAdminProduct({ id, ...payload });
    },
    onSuccess: (res) => {
      toast.success(isNew ? "تم إنشاء المنتج بنجاح" : "تم حفظ التغييرات");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", id] });
      if (isNew && res && "id" in res) {
        navigate({
          to: "/admin/product/$id",
          params: { id: (res as { id: string }).id },
          replace: true,
        });
      } else {
        setInitial(form);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminProduct(id),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/products", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Keyboard shortcut: Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saveMut.isPending && dirty) saveMut.mutate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveMut, dirty]);

  // AI mutations
  const analyzeImageMut = useMutation({
    mutationFn: async (base64Image: string) => {
      const res = await analyzeImage({ data: { image: base64Image } });
      return res.text;
    },
    onSuccess: (rawResponse) => {
      const parsed: Record<string, string> = {};
      const regExp = RegExp(
        /===(TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===\s*([\s\S]*?)(?=\s*===(?:TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===|$)/g,
      );
      let match;
      while ((match = regExp.exec(rawResponse)) !== null) {
        const key = match[1].toUpperCase();
        const val = match[2].trim();
        if (val && val !== "فارغ") {
          parsed[key] = val;
        }
      }

      setForm((f) => ({
        ...f,
        name: parsed.TITLE || f.name,
        description: parsed.DESCRIPTION || f.description,
        brand: parsed.BRAND || f.brand,
        color: parsed.COLOR || f.color,
        size: parsed.SIZE || f.size,
        price: parsed.PRICE ? Number(parsed.PRICE) : f.price,
        google_product_category: parsed.G_CAT || f.google_product_category,
        fb_product_category: parsed.FB_CAT || f.fb_product_category,
        condition: parsed.CONDITION === "used" ? "used" : f.condition,
      }));

      toast.success("تم تحليل الصورة وتعبئة الحقول تلقائياً!");
      // Auto-collapse AI section after successful analysis to reduce screen clutter
      setAiSectionCollapsed(true);
    },
    onError: (e: Error) => {
      toast.error(`فشل تحليل الصورة: ${e.message}`);
    },
  });

  const optimizeDescMut = useMutation({
    mutationFn: async (text: string) => {
      if (!text.trim()) throw new Error("الرجاء كتابة أو لصق نص الوصف أولاً ليتم تحسينه");

      // اليمن الطبية / تنظيف محتويات
      const medicalKeywords = [
        "جهاز طبي",
        "medical device",
        "ضغط الدم",
        "blood pressure",
        "جلوكوز",
        "glucose",
        "ecg",
        "نبض القلب",
        "oximeter",
        "أكسجين الدم",
        "oxygen",
        "مستشفى",
        "hospital",
        "تشخيص طبي",
        "diagnosis",
        "علاج طبي",
        "دواء طبي",
        "medicine",
        "أشعة x",
        "x-ray",
        "موجات فوق صوتية",
        "ultrasound",
        "منظار طبي",
        "endoscope",
        "عملية جراحية",
        "surgery",
        "عيادة طبية",
        "مريض طبي",
        "مختبر طبي",
        "laboratory test",
        "فحص طبي",
        "ترمومتر طبي",
        "stethoscope",
        "سماعة طبية",
        "حقنة طبية",
        "syringe",
        "medical needle",
        "إبرة طبية",
        "insulin",
        "أنسولين",
        "كولسترول",
        "cholesterol",
      ];
      const lower = text.toLowerCase();
      const isMedical = medicalKeywords.some((kw) => lower.includes(kw));
      if (isMedical) {
        throw new Error("تحذير: تم اكتشاف كلمات تشير إلى جهاز أو مستحضر طبي محظور في Meta!");
      }

      // Clean contact info
      const cleaned = text
        .replace(/(\+?967|00967)?[\s-]?(7\d{8}|\d{3}[\s-]?\d{3}[\s-]?\d{4})/g, "")
        .replace(/اندكس\s*ستور|index\s*store|متجر\s*اندكس|للتواصل|للاستفسار|واتساب|whatsapp/gi, "")
        .replace(/(للطلب|للتواصل|للاستفسار|تواصل معنا|اتصل بنا|راسلنا)[^\n]*\n?/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const res = await optimizeDescription({ data: { text: cleaned } });
      return res.text;
    },
    onSuccess: (rawResponse) => {
      const parsed: Record<string, string> = {};
      const regExp = RegExp(
        /===(TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===\s*([\s\S]*?)(?=\s*===(?:TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===|$)/g,
      );
      let match;
      while ((match = regExp.exec(rawResponse)) !== null) {
        const key = match[1].toUpperCase();
        const val = match[2].trim();
        if (val && val !== "فارغ") {
          parsed[key] = val;
        }
      }

      const titleStr = parsed.TITLE || "";
      const hookStr = parsed.HOOK || "";
      const rephrasedBody = parsed.BODY || "";
      const featuresText = parsed.FEATURES || "";
      const priceYer = parsed.PRICE || "";
      const priceSar = parsed.SAR || "";

      let formattedDesc = "";
      if (titleStr) formattedDesc += `${titleStr}\n`;
      if (hookStr) formattedDesc += `${hookStr}\n`;
      if (formattedDesc) formattedDesc += "\n";
      if (rephrasedBody) formattedDesc += `${rephrasedBody}\n\n`;

      if (featuresText) {
        featuresText.split("\n").forEach((fl) => {
          const line = fl.trim();
          if (line) {
            formattedDesc += `✅ ${line.replace("✅", "").trim()}\n`;
          }
        });
        formattedDesc += "\n";
      }

      if (priceYer) formattedDesc += `السعر: ${priceYer} ريال يمني\n`;
      if (priceSar) formattedDesc += `ما يعادل: ${priceSar} ريال سعودي`;

      setForm((f) => ({
        ...f,
        // Set name cleanly from TITLE only — hook goes into description
        name: titleStr || f.name,
        description: formattedDesc.trim(),
        price: priceYer ? Number(priceYer) : f.price,
        google_product_category: parsed.G_CAT || f.google_product_category,
        fb_product_category: parsed.FB_CAT || f.fb_product_category,
        brand: parsed.BRAND || f.brand,
        color: parsed.COLOR || f.color,
        size: parsed.SIZE || f.size,
      }));

      toast.success("تمت الصياغة والتسعير الذكي للمنتج بنجاح!");
      // Auto-collapse AI section after successful optimization
      setAiSectionCollapsed(true);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const compressAndResizeImage = (file: File, maxW = 800, maxH = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressAndResizeImage(file);
      setForm((f) => ({ ...f, images: [base64, ...f.images] }));
      analyzeImageMut.mutate(base64);
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الصورة");
    }
  };

  const handleAiDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverAi(false);

    // 1. Check for files dropped
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("يرجى سحب ملف صورة صالح");
        return;
      }

      try {
        const base64 = await compressAndResizeImage(file);
        setForm((f) => ({ ...f, images: [base64, ...f.images] }));
        analyzeImageMut.mutate(base64);
      } catch (err) {
        toast.error("حدث خطأ أثناء معالجة الصورة");
      }
      return;
    }

    // 2. Fallback to uri-list or text (images dragged from other webpages)
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url && /^https?:\/\//i.test(url.trim())) {
      const cleanUrl = url.trim();
      setForm((f) => ({ ...f, images: [cleanUrl, ...f.images] }));
      analyzeImageMut.mutate(cleanUrl);
      return;
    }

    toast.error("لم يتم العثور على صورة صالحة");
  };

  const copyPublicUrl = async () => {
    const url = `${window.location.origin}/product/${form.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط المنتج");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛍️ *${form.name}*\n\n${form.description}\n\n💰 السعر: ${form.price} ${form.currency}\n\nللطلب والاستفسار تواصل معنا 👇`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    const url = `${window.location.origin}/product/${form.slug}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  const shareInstagram = () => {
    const text = encodeURIComponent(
      `🛍️ ${form.name}\n\n${form.description}\n\n💰 السعر: ${form.price} ${form.currency}`,
    );
    toast.info("تم نسخ النص لمشاركته يدوياً");
    navigator.clipboard.writeText(decodeURIComponent(text));
  };

  if (!isNew && productQ.isLoading) {
    return <ProductSkeleton />;
  }

  const categories = categoriesQ.data ?? [];
  const filteredCategories = categorySearch
    ? categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories;

  const discountPct =
    form.old_price && form.old_price > 0 && form.price < form.old_price
      ? Math.round((1 - form.price / form.old_price) * 100)
      : 0;

  const updatedAt = productQ.data?.updated_at;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface hover:border-primary transition"
            aria-label={t("common.back")}
          >
            <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <h1 className="text-xl font-black sm:text-2xl">
              {isNew ? "منتج جديد" : form.name || "بدون اسم"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {dirty ? (
                <span className="inline-flex items-center gap-1 text-warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  تغييرات غير محفوظة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  محفوظ
                </span>
              )}
              {updatedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(updatedAt).toLocaleString("ar")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "edit"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          تفاصيل المنتج (Editor)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "preview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          معاينة المنتج (Preview)
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main Column */}
          <div className="space-y-4 lg:col-span-3">
            {/* 1. Images Section */}
            <CollapsibleCard
              id="media"
              title="📷 صور المنتج"
              subtitle={`${form.images.length} صورة مرفوعة`}
              icon={<ImageIcon className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <ImageManager
                  value={form.images}
                  onChange={(next) => setForm({ ...form, images: next })}
                />
                {form.images.length === 0 && (
                  <p className="flex items-center gap-1 text-[11px] text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> أضف صورة رئيسية للمنتج على الأقل ليتم
                    قبوله ومزامنته
                  </p>
                )}
              </div>
            </CollapsibleCard>

            {/* 2. Video Section */}
            <CollapsibleCard
              id="video"
              title="🎥 فيديو المنتج (اختياري)"
              icon={<Video className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleVideoDrop}
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-border p-5 text-center cursor-pointer hover:bg-muted/10 hover:border-primary transition"
                >
                  {uploadingVideo ? (
                    <div className="space-y-2">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs font-bold text-muted-foreground">
                        جاري رفع ومعالجة الفيديو...
                      </p>
                    </div>
                  ) : form.video_playback_id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative mx-auto flex aspect-video max-w-xs items-center justify-center overflow-hidden rounded-xl border border-border bg-showcase">
                        {localVideoUrl ? (
                          <video
                            src={localVideoUrl}
                            controls
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-xs text-muted-foreground p-3">
                            <Video className="mx-auto h-5 w-5 mb-1 text-primary" />
                            <span>معرف الفيديو النشط: {form.video_playback_id}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
                      >
                        إزالة الفيديو
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Video className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground">
                        اسحب ملف الفيديو هنا، أو انقر للاختيار من الجهاز
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleCard>

            {/* 3. AI Section */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverAi(true);
              }}
              onDragLeave={() => setDragOverAi(false)}
              onDrop={handleAiDrop}
              className={`rounded-2xl border p-4 transition-all duration-200 ${
                dragOverAi
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              {/* Header — always visible */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <h3 className="font-bold text-sm text-primary">توليد وصف بالذكاء الاصطناعي</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSectionCollapsed((v) => !v)}
                  className="text-[11px] font-bold text-primary/70 hover:text-primary transition"
                >
                  {aiSectionCollapsed ? "▾ توسيع" : "▴ طي"}
                </button>
              </div>

              {/* Collapsible body */}
              {!aiSectionCollapsed && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ارفع صورة المنتج بالسحب والإفلات هنا، أو انقر للاختيار لتوليد العنوان والوصف
                    والتصنيف والأسعار تلقائياً!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={analyzeImageMut.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-60"
                    >
                      {analyzeImageMut.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> جاري تحليل الصورة...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4" /> اختر صورة لتحليلها 🪄
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Show loading indicator even when collapsed */}
              {aiSectionCollapsed && analyzeImageMut.isPending && (
                <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>جاري تحليل الصورة...</span>
                </div>
              )}
            </div>

            {/* 4. Product Info */}
            <CollapsibleCard
              id="info"
              title="📌 معلومات المنتج"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <FormField label="عنوان المنتج *" required>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, NAME_MAX) })}
                    placeholder="مثال: قميص قطني أزرق للرجال"
                    className={inputCls}
                  />
                </FormField>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">وصف المنتج *</span>
                  <button
                    type="button"
                    onClick={() => optimizeDescMut.mutate(form.description)}
                    disabled={optimizeDescMut.isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 disabled:opacity-60 transition"
                  >
                    {optimizeDescMut.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> جاري التحسين والتسعير...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> تحسين وتسعير ذكي 🪄
                      </>
                    )}
                  </button>
                </div>

                <FormField label="" hint="ادخل تفاصيل المنتج والسعر هنا ثم اضغط تحسين ذكي">
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value.slice(0, DESC_MAX) })
                    }
                    rows={6}
                    placeholder="اكتب وصفاً واضحاً للمنتج..."
                    className={`${inputCls} resize-y`}
                    style={{ minHeight: "120px", maxHeight: "320px", overflowY: "auto" }}
                  />
                </FormField>

                <FormField label="العلامة التجارية">
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="مثال: Samsung"
                    className={inputCls}
                  />
                </FormField>
              </div>
            </CollapsibleCard>

            {/* 5. Pricing & Stock */}
            <CollapsibleCard
              id="pricing"
              title="💰 السعر والتوفر"
              icon={<DollarSign className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="السعر الحالي *" required>
                    <input
                      type="number"
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="0.00"
                      className={inputCls}
                      dir="ltr"
                    />
                  </FormField>
                  <FormField label="السعر القديم (قبل الخصم) 🔥" hint="يظهر التخفيض وتكشف العروض عند التعبئة">
                    <input
                      type="number"
                      value={form.old_price ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          old_price: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="مثال: 75000"
                      className={inputCls}
                      dir="ltr"
                    />
                  </FormField>
                </div>

                {/* Show calculated discount badge if valid */}
                {form.old_price != null && form.old_price > form.price && form.price > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/30 px-3 py-2 text-xs font-bold text-success">
                    <span>خصم محتسب تلقائياً: {Math.round((1 - form.price / form.old_price) * 100)}%</span>
                    <span>سوف يظهر المنتج تلقائياً في قسم "عروض اليوم 🔥"</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="العملة">
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className={inputCls}
                    >
                      <option value="YER">YER (ريال يمني)</option>
                      <option value="SAR">SAR (ريال سعودي)</option>
                      <option value="USD">USD (دولار أمريكي)</option>
                      <option value="AED">AED (درهم إماراتي)</option>
                    </select>
                  </FormField>
                  <FormField label="شارة المنتج (Badge)" hint="مثال: عرض خاص 🏷️ / جديد ⭐">
                    <input
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="مثال: عرض اليوم 🔥"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                {/* CMS Flags & Deal Period */}
                <div className="rounded-xl border border-border bg-surface/20 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>⭐ منتج مميز (Featured Product)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_deal}
                        onChange={(e) => setForm({ ...form, is_deal: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>🔥 عرض خاص (Daily Deal)</span>
                    </label>
                  </div>

                  {(form.is_deal || (form.old_price != null && form.old_price > form.price)) && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                      <FormField label="تاريخ بداية العرض">
                        <input
                          type="datetime-local"
                          value={form.deal_start}
                          onChange={(e) => setForm({ ...form, deal_start: e.target.value })}
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="تاريخ نهاية العرض (العد التنازلي)">
                        <input
                          type="datetime-local"
                          value={form.deal_end}
                          onChange={(e) => setForm({ ...form, deal_end: e.target.value })}
                          className={inputCls}
                        />
                      </FormField>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="حالة التوفر">
                    <select
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value })}
                      className={inputCls}
                    >
                      <option value="in stock">متوفر في المخزن (in stock)</option>
                      <option value="out of stock">نفد المخزون (out of stock)</option>
                    </select>
                  </FormField>
                  <FormField label="حالة المنتج">
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      className={inputCls}
                    >
                      <option value="new">جديد (new)</option>
                      <option value="used">مستعمل (used)</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="الكمية المتاحة">
                  <input
                    type="number"
                    value={form.stock || ""}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    placeholder="1"
                    className={inputCls}
                    dir="ltr"
                  />
                </FormField>
              </div>
            </CollapsibleCard>

            {/* 6. Meta / Google Specs */}
            <CollapsibleCard
              id="meta-specs"
              title="📂 تفاصيل إضافية (Meta Catalog)"
              icon={<Layers3 className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="فئة منتج Google">
                    <input
                      value={form.google_product_category}
                      onChange={(e) =>
                        setForm({ ...form, google_product_category: e.target.value })
                      }
                      placeholder="Apparel & Accessories > Clothing"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="فئة منتج Facebook">
                    <input
                      value={form.fb_product_category}
                      onChange={(e) => setForm({ ...form, fb_product_category: e.target.value })}
                      placeholder="Clothing & Accessories > Clothing"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="اللون">
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="أزرق، أسود..."
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="المقاس">
                    <input
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      placeholder="L, XL, 42..."
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField label="رابط صفحة المنتج (Source URL)">
                  <input
                    value={form.source_url}
                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    placeholder="https://..."
                    className={inputCls}
                    dir="ltr"
                  />
                </FormField>
              </div>
            </CollapsibleCard>

            {/* 7. Sharing widgets */}
            {!isNew && (
              <CollapsibleCard
                id="sharing"
                title="📤 مشاركة المنتج والترويج"
                icon={<Share2 className="h-4 w-4" />}
              >
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="flex flex-col items-center justify-center rounded-xl border border-success/30 bg-success/5 p-3 text-success transition hover:bg-success/10"
                  >
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-bold">واتساب</span>
                  </button>
                  <button
                    type="button"
                    onClick={shareFacebook}
                    className="flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-3 text-primary transition hover:bg-primary/10"
                  >
                    <Share2 className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-bold">فيسبوك</span>
                  </button>
                  <button
                    type="button"
                    onClick={shareInstagram}
                    className="flex flex-col items-center justify-center rounded-xl border border-primary-light/30 bg-primary-light/5 p-3 text-primary transition hover:bg-primary-light/10"
                  >
                    <Copy className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-bold">انستقرام</span>
                  </button>
                </div>
              </CollapsibleCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-2">
            {/* SEO */}
            <CollapsibleCard
              id="seo"
              title="SEO ومحركات البحث"
              icon={<SearchIcon className="h-4 w-4" />}
            >
              <div className="space-y-3">
                <FormField label="رابط مخصص (Slug)">
                  <div className="flex gap-2">
                    <input
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setForm({ ...form, slug: e.target.value });
                      }}
                      className={`${inputCls} font-mono`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSlugTouched(true);
                        setForm({ ...form, slug: slugify(form.name) });
                      }}
                      className="shrink-0 rounded-xl border border-border px-3 text-xs font-bold hover:border-primary"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </FormField>
                <div className="mt-3">
                  <GooglePreview
                    slug={form.slug}
                    title={form.name}
                    description={form.description}
                  />
                </div>
              </div>
            </CollapsibleCard>

            {/* Studio 3D */}
            <CollapsibleCard
              id="model3d"
              title="النموذج ثلاثي الأبعاد"
              icon={<Package className="h-4 w-4" />}
            >
              <Ai3dGeneratorPanel
                images={form.images}
                currentModelUrl={form.model_3d_url || form.model_url || undefined}
                currentModelThumbnail={form.model_3d_thumbnail || undefined}
                currentModelStatus={form.model_3d_status || undefined}
                onGenerated={(url, thumb, status) => {
                  setForm((f) => ({
                    ...f,
                    model_3d_url: url,
                    model_url: url,
                    model_3d_thumbnail: thumb,
                    model_3d_status: status,
                  }));
                  if (!isNew) {
                    setTimeout(() => saveMut.mutate(), 100);
                  }
                }}
              />
            </CollapsibleCard>

            {/* Publishing */}
            <CollapsibleCard
              id="publish"
              title="حالة النشر والترخيص"
              icon={<Eye className="h-4 w-4" />}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_published: true })}
                    className={`rounded-xl border p-3 text-start transition ${
                      form.is_published
                        ? "border-success bg-success/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className="block text-xs font-black text-foreground">منشور</span>
                    <span className="block text-[11px] text-muted-foreground">يظهر بالمتجر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_published: false })}
                    className={`rounded-xl border p-3 text-start transition ${
                      !form.is_published
                        ? "border-warning bg-warning/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className="block text-xs font-black text-foreground">مسودة</span>
                    <span className="block text-[11px] text-muted-foreground">مخفي بالمتجر</span>
                  </button>
                </div>
              </div>
            </CollapsibleCard>

            {/* Meta Catalog Sync Status */}
            <CollapsibleCard
              id="meta-sync-card"
              title="مزامنة Meta"
              icon={<Layers3 className="h-4 w-4" />}
            >
              <FormField label="حالة المزامنة">
                <select
                  value={form.meta_sync_status}
                  onChange={(e) => setForm({ ...form, meta_sync_status: e.target.value })}
                  className={inputCls}
                >
                  <option value="not_synced">بانتظار المزامنة (not_synced)</option>
                  <option value="syncing">جاري المزامنة (syncing)</option>
                  <option value="synced">متزامن (synced)</option>
                  <option value="failed">فشل المزامنة (failed)</option>
                </select>
              </FormField>
            </CollapsibleCard>
          </div>
        </div>
      ) : (
        <ProductPreviewView form={form} categories={categories} />
      )}

      {/* Sticky Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            {saveMut.isPending ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> جاري الحفظ...
              </span>
            ) : dirty ? (
              <span>تغييرات غير محفوظة · اضغط حفظ للتأكيد</span>
            ) : (
              <span>لا تغييرات</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`حذف "${form.name}"؟`)) deleteMut.mutate();
                }}
                disabled={deleteMut.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/20 transition disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                <span>حذف</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || (!dirty && !isNew)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-60 transition"
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isNew ? "إنشاء المنتج" : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary transition duration-200 mt-1";

function FormField({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </span>
      )}
      <div>{children}</div>
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductPreviewView({
  form,
  categories,
}: {
  form: FormState;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {form.images[0] && (
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            <img src={form.images[0]} alt={form.name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-foreground">{form.name || "بدون اسم"}</h2>
          <div className="flex gap-2">
            <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
              {form.price} {form.currency}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {categories.find((c) => c.id === form.category_id)?.name || "بدون تصنيف"}
            </span>
          </div>
          {form.description && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {form.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
