import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-showcase-muted/20 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-surface/50 shadow-card backdrop-blur-md border border-white/5">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8">
      <Skeleton className="aspect-square w-full md:w-1/2 rounded-3xl" />
      <div className="flex w-full md:w-1/2 flex-col gap-4 py-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-24 w-full" />
        <Skeleton className="h-12 w-full rounded-xl mt-auto" />
      </div>
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, ProductDetailSkeleton };
