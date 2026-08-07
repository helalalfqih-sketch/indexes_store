import React from "react";

// Product Card Skeleton Loader
export const ProductCardSkeleton: React.FC<{ variant?: "horizontal" | "grid" }> = ({
  variant = "grid",
}) => {
  const containerClasses =
    variant === "horizontal"
      ? "snap-start flex-shrink-0 w-full sm:w-[200px] bg-[#0c0824]/40 backdrop-blur-md border border-[#3b1e82]/30 rounded-[10px] min-[360px]:rounded-[12px] sm:rounded-[20px] p-1 sm:p-3 flex flex-col justify-between h-full animate-pulse"
      : "bg-[#0c0824]/40 backdrop-blur-md border border-[#3b1e82]/30 rounded-[10px] min-[360px]:rounded-[12px] sm:rounded-[20px] p-1 sm:p-3 flex flex-col justify-between w-full h-full animate-pulse";

  return (
    <div className={containerClasses}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="w-4 h-4 rounded-full bg-purple-950/60" />
        <div className="w-10 h-3 rounded-full bg-purple-900/40" />
      </div>

      {/* Product Image Frame Skeleton */}
      <div className="h-[50px] min-[360px]:h-[60px] sm:h-[125px] w-full bg-purple-950/40 rounded my-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-purple-900/30" />
      </div>

      {/* Text Info Skeletons */}
      <div className="text-center flex flex-col items-center my-1 space-y-1">
        <div className="h-2.5 sm:h-3.5 w-3/4 bg-purple-900/50 rounded-full" />
        <div className="h-2 sm:h-2.5 w-1/2 bg-purple-950/40 rounded-full" />

        {/* Rating Row Skeleton */}
        <div className="h-2 w-2/3 bg-purple-950/30 rounded-full my-1" />

        {/* Price Skeleton */}
        <div className="h-3 sm:h-4 w-2/3 bg-purple-900/60 rounded-full" />
      </div>

      {/* Button CTA Skeleton */}
      <div className="w-full h-5 sm:h-8 bg-purple-900/40 rounded min-[360px]:rounded-md sm:rounded-xl mt-1" />
    </div>
  );
};

// Hero Carousel Skeleton
export const HeroCarouselSkeleton: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 py-3">
      <div className="w-full rounded-[28px] sm:rounded-[36px] bg-[#0c0824]/80 border border-[#7b3fff]/20 p-4 sm:p-7 flex items-center justify-between min-h-[190px] sm:min-h-[250px] animate-pulse">
        <div className="space-y-3 w-1/2">
          <div className="w-24 h-5 rounded-full bg-purple-900/40" />
          <div className="w-32 h-10 rounded-xl bg-purple-900/60" />
          <div className="w-40 h-4 rounded-full bg-purple-950/50" />
          <div className="w-28 h-8 rounded-full bg-purple-900/50" />
        </div>
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-purple-900/30 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-purple-950/50" />
        </div>
      </div>
    </div>
  );
};

// Category Bar Skeleton
export const CategoryBarSkeleton: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-20 h-8 bg-[#0c0824]/80 border border-purple-900/30 rounded-full"
        />
      ))}
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} variant="grid" />
      ))}
    </div>
  );
};
