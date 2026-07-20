import { createFileRoute } from "@tanstack/react-router";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createVertex } from "@ai-sdk/google-vertex";

const InputSchema = z.object({
  hint: z.string().default(""),
  language: z.enum(["ar", "en"]).default("ar"),
  images: z.array(z.string()).max(6).default([]), // data URLs or https
});

const OutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  slug: z.string(),
  tags: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
  priceEstimate: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string(),
  }),
});

export const Route = createFileRoute("/api/ai/analyze-product")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const lovableKey = process.env.LOVABLE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let payload: z.infer<typeof InputSchema>;
        try {
          payload = InputSchema.parse(await request.json());
        } catch (e) {
          return Response.json({ error: "Invalid input", detail: String(e) }, { status: 400 });
        }

        let model;
        if (lovableKey) {
          const gateway = createLovableGateway(lovableKey);
          model = gateway("google/gemini-3-flash-preview");
        } else if (geminiKey) {
          const gateway = createOpenAICompatible({
            name: "gemini",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            headers: {
              Authorization: `Bearer ${geminiKey}`,
            },
          });
          model = gateway("gemini-1.5-flash");
        } else {
          // استخدام Google Vertex AI تلقائياً (خاصة في بيئة Firebase المستضافة)
          const vertex = createVertex({
            location: process.env.VERTEX_LOCATION || "us-central1",
            project: process.env.VERTEX_PROJECT_ID,
          });
          model = vertex("gemini-1.5-flash");
        }

        const lang = payload.language;
        const systemMsg =
          lang === "ar"
            ? "أنت مساعد ذكي لإنشاء بطاقات منتجات لمتجر يمني اسمه اندكس ستور. اكتب بالعربية الفصحى المبسطة. اقترح تصنيفاً واحداً من: المطبخ، التنظيم والتخزين، الجمال والعناية، الصحة والمساج، العدد والأدوات، السيارات، الرياضة واللياقة، الرحلات والخارجية، الأطفال والألعاب، الإلكترونيات، المنزل والديكور، الإضاءة والطاقة، الحيوانات الأليفة، متنوعات. أنشئ slug إنجليزي قصير (kebab-case). السعر بالريال اليمني (YER)."
            : "You are an AI assistant that creates rich product listings for a modern ecommerce store. Suggest a category, short kebab-case slug, and price range in USD.";

        const userContent: any[] = [
          {
            type: "text",
            text:
              (lang === "ar"
                ? "حلّل المنتج التالي وأنشئ بيانات كاملة له. تلميح المستخدم:\n"
                : "Analyze the following product and generate full metadata. User hint:\n") +
              (payload.hint || (lang === "ar" ? "(لا يوجد)" : "(none)")),
          },
          ...payload.images.map((src) => {
            if (src.startsWith("data:image/")) {
              const matches = src.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                return {
                  type: "image",
                  image: Buffer.from(base64Data, "base64"),
                  mimeType,
                };
              }
            }
            try {
              return {
                type: "image",
                image: new URL(src),
              };
            } catch {
              return {
                type: "text",
                text: `[رابط صورة: ${src}]`,
              };
            }
          }),
        ];

        try {
          const { output } = await generateText({
            model,
            system: systemMsg,
            output: Output.object({ schema: OutputSchema }),
            messages: [
              { role: "user", content: userContent },
            ],
          });
          return Response.json(output);
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return Response.json(
              { error: "AI response did not match schema", raw: (error as any).text },
              { status: 502 },
            );
          }
          const message = error instanceof Error ? error.message : String(error);
          const status = /rate|429/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
