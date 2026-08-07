import React, { useState } from "react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface ProductDetailModalProps {
  product: Product | null;
  currency: Currency;
  isFavorite: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onToggleFavorite: (product: Product) => void;
  onAddToCompare?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  isFavorite,
  onClose,
  onAddToCart,
  onToggleFavorite,
  onAddToCompare,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product?.image || "");
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product?.colors?.[0]);
  const [addedToast, setAddedToast] = useState(false);

  if (!product) return null;

  const galleryImages = [
    product.image,
    ...(product.gallery ? product.gallery.filter((img) => img !== product.image) : []),
  ];

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const directWhatsappText = encodeURIComponent(
    `السلام عليكم، أود شراء المنتج التالي من متجر إندكس:\n` +
      `📦 *${product.name}*\n` +
      `💰 السعر: ${formatPrice(product.priceYER, currency)}\n` +
      `الكمية: ${quantity}` +
      (selectedColor ? `\nاللون المختار: ${selectedColor}` : ""),
  );

  const directWhatsappUrl = `https://wa.me/967771370740?text=${directWhatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#100B1A] border border-gray-800 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl p-6 sm:p-8 text-right dir-rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-5 left-5 text-gray-400 hover:text-white bg-[#18112B] w-10 h-10 rounded-full flex items-center justify-center border border-gray-800 transition-colors z-20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        {/* Wishlist Button */}
        <button
          onClick={() => onToggleFavorite(product)}
          aria-label="المفضلة"
          className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center border transition-all z-20 cursor-pointer ${
            isFavorite
              ? "bg-rose-500/20 text-rose-500 border-rose-500/40"
              : "bg-[#18112B] text-gray-400 hover:text-white border-gray-800"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6">
          {/* Gallery View */}
          <div className="flex flex-col items-center">
            <div className="w-full h-64 sm:h-72 bg-[#18112B] rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-gray-800/60">
              <img
                src={selectedImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-all duration-300"
              />
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto w-full pb-2 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 bg-[#18112B] flex-shrink-0 cursor-pointer transition-all ${
                      selectedImage === img
                        ? "border-[#7B3FFF] scale-105 shadow-md shadow-purple-500/20"
                        : "border-gray-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              {product.discountBadge && (
                <span className="inline-block bg-[#7B3FFF] text-white text-xs font-bold px-3 py-1 rounded-lg mb-2">
                  {product.discountBadge}
                </span>
              )}

              <a
                href={`/product/${product.slug || product.id}`}
                className="text-2xl font-bold text-white mb-1 hover:text-[#7B3FFF] transition-colors block"
              >
                {product.name}
              </a>
              <p className="text-gray-300 text-sm mb-3">{product.subtitle}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400">{"★".repeat(Math.floor(product.rating))}</div>
                <span className="text-white font-bold text-sm">{product.rating}</span>
                <span className="text-gray-500 text-xs">({product.reviewsCount} تقييم)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5 pb-4 border-b border-gray-800/60">
                <span className="text-white font-extrabold text-3xl">
                  {formatPrice(product.priceYER * quantity, currency)}
                </span>
                {product.originalPriceYER > product.priceYER && (
                  <span className="text-gray-500 line-through text-lg">
                    {formatPrice(product.originalPriceYER * quantity, currency)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{product.description}</p>

              {/* Color Selection if available */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <label className="block text-gray-300 text-xs font-bold mb-2">
                    اللون المختار:
                  </label>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                          selectedColor === color
                            ? "border-[#7B3FFF] scale-110 shadow-md"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Picker */}
              <div className="flex items-center justify-between mb-6 bg-[#18112B] p-3 rounded-2xl border border-gray-800">
                <span className="text-gray-300 text-sm font-semibold">الكمية:</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-[#120D22] border border-gray-800 text-white font-bold flex items-center justify-center hover:bg-[#7B3FFF] hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-white font-bold text-lg min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-xl bg-[#120D22] border border-gray-800 text-white font-bold flex items-center justify-center hover:bg-[#7B3FFF] hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Specs Table if present */}
              {product.specs && (
                <div className="mb-6 bg-[#18112B] p-4 rounded-2xl border border-gray-800 text-xs">
                  <h4 className="font-bold text-white mb-2 text-sm">المواصفات الرئيسية:</h4>
                  <div className="grid grid-cols-2 gap-2 text-gray-300">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-gray-500 font-medium">{key}</span>
                        <span className="font-bold text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#7B3FFF] hover:bg-[#682BDD] text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-base cursor-pointer"
              >
                <span>أضف للسلة الآن</span>
                <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={directWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-md"
                >
                  <span>طلب واتساب</span>
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </a>

                {onAddToCompare && (
                  <button
                    onClick={() => {
                      onAddToCompare(product);
                      onClose();
                    }}
                    className="bg-[#12151a] hover:bg-[#181c22] text-white font-bold py-3 rounded-2xl border border-white/10 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                  >
                    <span>مقارنة المنتج</span>
                    <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
                  </button>
                )}
              </div>
            </div>

            {addedToast && (
              <div className="mt-3 bg-green-500/20 border border-green-500 text-green-300 text-xs text-center py-2 rounded-xl animate-fadeIn">
                ✓ تم إضافة المنتج إلى سلة التسوق بنجاح!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
