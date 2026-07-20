import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

const STORAGE_PREFIX = "admin-product-card:";

export function CollapsibleCard({
  id,
  title,
  subtitle,
  icon,
  right,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_PREFIX + id);
      if (v === "0") setOpen(false);
      else if (v === "1") setOpen(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + id, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open, id, ready]);

  return (
    <section className="rounded-2xl glass overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`card-body-${id}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
        >
          {icon ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">{title}</span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      {open && (
        <div id={`card-body-${id}`} className="border-t border-border/60 px-5 py-4">
          {children}
        </div>
      )}
    </section>
  );
}
