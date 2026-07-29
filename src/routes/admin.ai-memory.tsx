import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Trash2, Search, Sparkles } from "lucide-react";
import { getProjectMemory } from "@/lib/ai-agent.functions";

export const Route = createFileRoute("/admin/ai-memory")({
  head: () => ({
    meta: [
      { title: "إدارة ذاكرة الذكاء الاصطناعي — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAIMemoryPage,
});

function AdminAIMemoryPage() {
  const getMemoryServerFn = useServerFn(getProjectMemory);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: memoryEntries = [] } = useQuery({
    queryKey: ["ai-project-memory-list"],
    queryFn: () => getMemoryServerFn(),
  });

  const filteredEntries = memoryEntries.filter(
    (m: any) =>
      m.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(m.value)?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Brain className="h-7 w-7 text-violet-500" />
          إدارة ذاكرة وقواعد الذكاء الاصطناعي (AI Project Memory UI)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          عرض، بحث، وإدارة القواعد والذكريات طويلة المدى المحفوظة في قاعدة البيانات لاستخدام الـ AI
          Agent.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث في ذاكرة وقواعد المشروع..."
          className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-border bg-surface text-xs text-muted-foreground">
            لا توجد ذكريات محفوظة حالياً مطابقة للبحث.
          </div>
        ) : (
          filteredEntries.map((entry: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-border bg-surface shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-black text-foreground">{entry.key}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-400">
                  {entry.category || "General"}
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-background border border-border/60 text-[11px] font-mono text-zinc-300 overflow-x-auto dir-ltr">
                {typeof entry.value === "object"
                  ? JSON.stringify(entry.value, null, 2)
                  : String(entry.value)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
