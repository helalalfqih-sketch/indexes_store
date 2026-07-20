import { Search } from "lucide-react";

type Props = {
  slug: string;
  title: string;
  description: string;
  origin?: string;
};

export function GooglePreview({ slug, title, description, origin }: Props) {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://example.com");
  const url = `${base}/product/${slug || "product-slug"}`;
  const displayTitle = (title || "Product title").slice(0, 60);
  const displayDesc = (description || "Product description shown in search results.").slice(0, 160);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span className="truncate">{url}</span>
      </div>
      <p className="mt-1 truncate text-lg font-medium text-primary">{displayTitle}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{displayDesc}</p>
    </div>
  );
}
