import { useRef, useState, type DragEvent } from "react";
import { Star, Trash2, ArrowUp, ArrowDown, Link as LinkIcon, ImagePlus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

const isProbablyUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export function ImageManager({ value, onChange }: Props) {
  const [urlDraft, setUrlDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addUrl = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!isProbablyUrl(v)) {
      toast.error("رابط صورة غير صالح");
      return;
    }
    if (value.includes(v)) {
      toast.info("الصورة موجودة بالفعل");
      return;
    }
    onChange([...value, v]);
    setUrlDraft("");
  };

  const addFromPaste = (text: string) => {
    text
      .split(/[\n\s,]+/)
      .map((s) => s.trim())
      .filter(isProbablyUrl)
      .forEach((u) => !value.includes(u) && onChange([...value, u]));
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const setFeatured = (i: number) => move(i, 0);

  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDrop = (e: DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    move(dragIndex, i);
    setDragIndex(null);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("يرجى اختيار ملفات صور فقط");
      return;
    }
    
    const loaders = imageFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(file);
      });
    });
    
    try {
      const base64Urls = await Promise.all(loaders);
      const uniqueNewUrls = base64Urls.filter(u => !value.includes(u));
      if (uniqueNewUrls.length > 0) {
        onChange([...value, ...uniqueNewUrls]);
        toast.success(`تمت إضافة ${uniqueNewUrls.length} صورة من الجهاز`);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء قراءة الصور");
    }
    e.target.value = "";
  };

  const onFileDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // 1. Check for files
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        toast.error("يرجى سحب ملفات صور فقط");
        return;
      }
      
      const loaders = imageFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("فشل قراءة الملف"));
          reader.readAsDataURL(file);
        });
      });
      
      try {
        const base64Urls = await Promise.all(loaders);
        const uniqueNewUrls = base64Urls.filter(u => !value.includes(u));
        if (uniqueNewUrls.length > 0) {
          onChange([...value, ...uniqueNewUrls]);
          toast.success(`تمت إضافة ${uniqueNewUrls.length} صورة من الجهاز`);
        }
      } catch (err) {
        toast.error("حدث خطأ أثناء قراءة الصور");
      }
      return;
    }

    // 2. Fallback to text lists (links dragged from other web pages)
    const items = e.dataTransfer?.items;
    if (!items) return;
    const urls: string[] = [];
    for (const item of items) {
      if (item.kind === "string" && item.type === "text/uri-list") {
        await new Promise<void>((res) =>
          item.getAsString((s) => {
            if (isProbablyUrl(s) && !value.includes(s)) urls.push(s);
            res();
          }),
        );
      }
      if (item.kind === "string" && item.type === "text/plain") {
        await new Promise<void>((res) =>
          item.getAsString((s) => {
            s.split(/[\n\s,]+/).forEach((u) => {
              if (isProbablyUrl(u) && !value.includes(u)) urls.push(u);
            });
            res();
          }),
        );
      }
    }
    if (urls.length) {
      onChange([...value, ...urls]);
      toast.success(`تمت إضافة ${urls.length} صورة`);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl border-2 border-dashed border-border p-4 text-center cursor-pointer hover:bg-muted/10 hover:border-primary transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          اسحب الصور هنا، أو انقر للاختيار من الجهاز
        </p>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-center text-xs text-muted-foreground">
          لا توجد صور بعد. أضف روابط للصور لعرضها في المتجر.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, i) => (
            <li
              key={`${src}-${i}`}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              className={`group relative overflow-hidden rounded-xl border border-border bg-surface ${
                dragIndex === i ? "opacity-50" : ""
              }`}
            >
              <div className="aspect-square bg-muted">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
              </div>
              {i === 0 && (
                <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-warning/90 px-2 py-0.5 text-[10px] font-black text-warning-foreground">
                  <Star className="h-3 w-3" /> رئيسية
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white disabled:opacity-30"
                    aria-label="تحريك للأعلى"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === value.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white disabled:opacity-30"
                    aria-label="تحريك للأسفل"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => setFeatured(i)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white"
                      aria-label="تعيين كصورة رئيسية"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="grid h-7 w-7 place-items-center rounded-md bg-destructive/90 text-destructive-foreground"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {value.length} صورة · الصورة الأولى هي الصورة الرئيسية
        </p>
      )}
    </div>
  );
}
