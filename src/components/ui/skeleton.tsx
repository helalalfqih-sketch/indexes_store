import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/55 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2.2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent motion-reduce:before:animate-none",
        className,
      )}
      {...props}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="bg-muted/35 p-2 sm:p-3">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-1 flex items-center gap-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="mt-auto h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:flex-row md:p-8">
      <div className="w-full rounded-3xl border border-border/70 bg-muted/30 p-3 md:w-1/2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
      <div className="flex w-full flex-col gap-4 py-4 md:w-1/2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <Skeleton className="mt-auto h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, ProductDetailSkeleton };
