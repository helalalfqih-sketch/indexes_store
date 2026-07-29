import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Brain,
  Key,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Power,
  Globe,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAIProvidersFn,
  saveAIProviderFn,
  deleteAIProviderFn,
  toggleAIProviderFn,
  testAIConnectionFn,
  type AIProviderConfig,
  type AIProviderType,
} from "@/lib/ai-provider.server";

export const Route = createFileRoute("/admin/ai-settings")({
  component: AISettingsPage,
});

function AISettingsPage() {
  const queryClient = useQueryClient();
  const fetchProviders = useServerFn(listAIProvidersFn);
  const saveProvider = useServerFn(saveAIProviderFn);
  const deleteProvider = useServerFn(deleteAIProviderFn);
  const toggleProvider = useServerFn(toggleAIProviderFn);
  const testConnection = useServerFn(testAIConnectionFn);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => fetchProviders(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<AIProviderConfig> | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; time: string; message?: string }>
  >({});

  const saveMutation = useMutation({
    mutationFn: (data: any) => saveProvider({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("تم حفظ إعدادات المزود بنجاح ✨");
      setIsModalOpen(false);
      setEditingProvider(null);
    },
    onError: (err: any) => toast.error(err.message || "حدث خطأ أثناء الحفظ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProvider({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("تم حذف المزود");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; enabled: boolean }) => toggleProvider({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("تم تغيير حالة المزود");
    },
  });

  const handleTestConnection = async (config: AIProviderConfig) => {
    setIsTesting(config.id);
    try {
      const res = await testConnection({
        data: {
          id: config.id,
          provider: config.provider,
          model: config.model,
          base_url: config.base_url,
        },
      });
      const nowTime = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      if (res.success) {
        setTestResults((prev) => ({
          ...prev,
          [config.id]: { success: true, time: nowTime, message: res.message },
        }));
        toast.success(res.message);
      } else {
        setTestResults((prev) => ({
          ...prev,
          [config.id]: { success: false, time: nowTime, message: res.error },
        }));
        toast.error(`فشل الاتصال: ${res.error}`);
      }
    } catch (err: any) {
      const nowTime = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTestResults((prev) => ({
        ...prev,
        [config.id]: { success: false, time: nowTime, message: err.message },
      }));
      toast.error(err.message);
    } finally {
      setIsTesting(null);
    }
  };

  const handleOpenEdit = (p?: AIProviderConfig) => {
    if (p) {
      setEditingProvider({ ...p });
    } else {
      setEditingProvider({
        provider: "gemini",
        model: "gemini-2.5-flash",
        priority: 100,
        enabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const getCapabilities = (provider: string) => {
    switch (provider) {
      case "gemini":
      case "vertex":
        return ["Text", "Vision", "Image"];
      case "openrouter":
      case "openai":
      case "lovable":
      default:
        return ["Text", "Vision"];
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "gemini":
        return <Globe className="h-5 w-5 text-blue-500" />;
      case "lovable":
        return <Brain className="h-5 w-5 text-purple-500" />;
      case "openai":
        return <Settings2 className="h-5 w-5 text-emerald-500" />;
      case "vertex":
        return <ShieldCheck className="h-5 w-5 text-blue-600" />;
      case "openrouter":
        return <Zap className="h-5 w-5 text-amber-500" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            إدارة مزودي الذكاء الاصطناعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة مفاتيح API، اختبار الاتصال، وتحديد أولويات مزودي نماذج AI للمتجر
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> إضافة مزود جديد
        </button>
      </div>

      {/* Providers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : providers.length === 0 ? (
          <div className="col-span-full py-12 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center px-4 bg-surface/50">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold">لا يوجد مزودي ذكاء اصطناعي مضافين</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              لم تقم بإضافة أي مفتاح API حتى الآن. أضف Google Gemini أو OpenAI للبدء بتمكين المساعد
              الذكي.
            </p>
          </div>
        ) : (
          providers.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border bg-surface p-5 transition-all ${
                p.enabled
                  ? "border-primary/20 shadow-sm"
                  : "border-border opacity-70 grayscale-[30%]"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${p.enabled ? "bg-primary/10" : "bg-accent"}`}>
                    {getProviderIcon(p.provider)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base capitalize tracking-wide flex items-center gap-2">
                      {p.provider}
                      {p.priority ===
                        Math.min(...providers.filter((x) => x.enabled).map((x) => x.priority)) &&
                        p.enabled && (
                          <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                            الأساسي
                          </span>
                        )}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.model}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: p.id, enabled: !p.enabled })}
                  className={`p-1.5 rounded-lg transition ${
                    p.enabled
                      ? "text-success bg-success/10 hover:bg-success/20"
                      : "text-muted-foreground bg-accent hover:bg-accent/80"
                  }`}
                  title={p.enabled ? "تعطيل" : "تفعيل"}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border">
                  <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> حالة الاتصال:
                  </span>
                  <span className="font-bold text-[11px]">
                    {testResults[p.id] ? (
                      testResults[p.id].success ? (
                        <span className="text-emerald-500 font-bold">🟢 متصل</span>
                      ) : (
                        <span className="text-rose-500 font-bold">🔴 غير متصل</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">⚪ لم يتم الاختبار</span>
                    )}
                  </span>
                </div>

                {testResults[p.id] && (
                  <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-accent/40 rounded-lg text-muted-foreground">
                    <span>آخر اختبار:</span>
                    <span className="font-mono text-[10px] font-bold">
                      {testResults[p.id].time}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border">
                  <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> المفتاح:
                  </span>
                  <span className="font-mono text-[11px] tracking-wider font-semibold">
                    {p.api_key || "غير متوفر"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border">
                  <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5" /> الأولوية:
                  </span>
                  <span className="font-black bg-accent px-2 py-0.5 rounded text-[11px]">
                    {p.priority}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-bold">القدرات:</span>
                  <div className="flex flex-wrap gap-1">
                    {getCapabilities(p.provider).map((cap) => (
                      <span
                        key={cap}
                        className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-4">
                <button
                  onClick={() => handleTestConnection(p)}
                  disabled={isTesting === p.id || !p.enabled}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 text-primary py-2 text-xs font-bold hover:bg-primary/20 transition disabled:opacity-50"
                >
                  {isTesting === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  فحص الاتصال
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-bold hover:bg-accent transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذا المزود؟")) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    className="flex items-center justify-center px-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive py-2 hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-surface border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-black text-lg flex items-center gap-2">
                {editingProvider.id ? "تعديل مزود الذكاء الاصطناعي" : "إضافة مزود جديد"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:bg-accent p-1.5 rounded-lg transition"
              >
                <Trash2 className="h-5 w-5 opacity-0 absolute" /> {/* placeholder spacer */}✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(editingProvider);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  المزود (Provider)
                </label>
                <select
                  value={editingProvider.provider}
                  onChange={(e) =>
                    setEditingProvider({
                      ...editingProvider,
                      provider: e.target.value as AIProviderType,
                    })
                  }
                  className="w-full rounded-xl border bg-background p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                  required
                >
                  <option value="gemini">Google Gemini (Direct)</option>
                  <option value="vertex">Google Vertex AI</option>
                  <option value="lovable">Lovable Gateway</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1 flex justify-between">
                  <span>مفتاح الربط (API Key)</span>
                  {editingProvider.id && (
                    <span className="text-[10px] text-primary">اتركه فارغاً لعدم تغييره</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={editingProvider.id ? "••••••••••••" : "AIzaSy..."}
                  value={editingProvider.api_key || ""}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, api_key: e.target.value })
                  }
                  className="w-full rounded-xl border bg-background p-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  اسم النموذج (Model Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="gemini-2.5-flash / google/gemini-2.5-flash / gpt-4o-mini"
                  value={editingProvider.model || ""}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, model: e.target.value })
                  }
                  className="w-full rounded-xl border bg-background p-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    الأولوية (Priority)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProvider.priority || 100}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        priority: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full rounded-xl border bg-background p-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    الرقم الأقل يعني أولوية أعلى (مثال: 1)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    الرابط المخصص (Base URL)
                  </label>
                  <input
                    type="url"
                    placeholder="اختياري"
                    value={editingProvider.base_url || ""}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, base_url: e.target.value })
                    }
                    className="w-full rounded-xl border bg-background p-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 text-[10px]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t mt-4">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl shadow-brand hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "حفظ المزود"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border font-bold hover:bg-accent transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
