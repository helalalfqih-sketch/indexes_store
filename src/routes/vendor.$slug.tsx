import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Store, Star, ShieldCheck, MapPin, Phone, Mail, Loader2, Package } from 'lucide-react';
import { getVendorBySlug, type VendorDetails } from '@/lib/services/vendor.service';

export const Route = createFileRoute('/vendor/$slug')({
  component: VendorPublicStorefrontPage,
});

function VendorPublicStorefrontPage() {
  const { slug } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadVendorStorefront() {
      setLoading(true);
      const vendorData = await getVendorBySlug(supabase, slug);
      if (!vendorData) {
        setVendor(null);
        setLoading(false);
        return;
      }
      setVendor(vendorData);

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      setProducts(prodData ?? []);
      setLoading(false);
    }

    loadVendorStorefront();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center dir-rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">جاري تحميل صفحة التاجر...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-950 text-white dir-rtl flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">متجر التاجر غير موجود</h2>
          <p className="text-slate-400 text-sm">تأكد من صحة الرابط أو العودة للرئيسية.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl font-sans pb-16">
      {/* Banner */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative overflow-hidden">
        {vendor.banner_url && (
          <img src={vendor.banner_url} alt={vendor.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 space-y-8">
        {/* Vendor Header Info */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20 border-2 border-slate-800">
            {vendor.name.charAt(0)}
          </div>

          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{vendor.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>تاجر موثق في اندكس ستور</span>
              </span>
            </div>

            <p className="text-slate-400 text-sm max-w-2xl">{vendor.description ?? 'متجر رسمي معتمد لتقديم أجود المنتجات بأفضل الأسعار.'}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{vendor.rating ?? 5.0} (تقييم ممتاز)</span>
              </div>
              <div>• {products.length} منتج منشور</div>
            </div>
          </div>
        </div>

        {/* Vendor Product Showcase */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <span>منتجات المعرض ({products.length})</span>
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              لا توجد منتجات معروضة حالياً لهذا التاجر.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <a
                  key={p.id}
                  href={`/product/${p.slug ?? p.id}`}
                  className="bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-4 backdrop-blur-xl transition-all hover:scale-[1.02] group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 mb-4 border border-slate-800">
                    <img
                      src={p.images?.[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">{p.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/60">
                    <span className="text-emerald-400 font-black text-sm">{Number(p.price).toLocaleString()} YER</span>
                    <span className="text-[10px] text-slate-400">عرض التفاصيل ←</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
