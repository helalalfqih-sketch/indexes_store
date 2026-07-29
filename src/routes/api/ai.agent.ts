/**
 * Indexes AI Engineering Agent — Streaming API Endpoint
 *
 * POST /api/ai/agent
 *
 * Thin route handler that delegates all logic to the Agent Engine.
 * Provides SSE streaming with Activity Events, Project Context, Tool Calling,
 * and dynamic AI Provider resolution (Vertex AI / Gemini).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { resolveActiveAIProvider } from "@/lib/ai-provider.server";
import { runAgentEngine } from "@/services/ai-agent/agent.engine";

const InputSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(10000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .max(50)
    .default([]),
  projectMemory: z.string().default(""),
  agentRole: z.enum(["owner", "admin", "developer", "viewer"]).default("owner"),
  providerId: z.string().optional(),
  tenantId: z.string().default("default"),
});

export const Route = createFileRoute("/api/ai/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: z.infer<typeof InputSchema>;
        try {
          payload = InputSchema.parse(await request.json());
        } catch (e) {
          return Response.json(
            { error: "بيانات الطلب غير صالحة", detail: String(e) },
            { status: 400 },
          );
        }

        if (payload.agentRole === "viewer") {
          return Response.json(
            { error: "ليس لديك صلاحية إرسال رسائل. تواصل مع المسؤول." },
            { status: 403 },
          );
        }

        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller) {
            const sendEvent = (data: object) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
              // Status 1: Receiving request
              sendEvent({
                type: "status",
                status: "receiving_request",
                label: "جاري استقبال طلبك...",
                timestamp: Date.now(),
              });

              // Resolve Active AI Provider
              const resolved = await resolveActiveAIProvider({
                providerId: payload.providerId,
              });

              if (!resolved || !resolved.model) {
                sendEvent({
                  type: "error",
                  error: "لم يتم العثور على مزود AI مفعل. تحقق من إعدادات مزودي AI.",
                  detail: "No active AI provider found",
                });
                controller.close();
                return;
              }

              console.log("[AI_AGENT_RESOLVED]", {
                provider: resolved.provider,
                modelName: resolved.modelName,
                source: resolved.source,
              });

              sendEvent({
                type: "status",
                status: "provider_ready",
                label: `🤖 المزود: ${resolved.provider} / ${resolved.modelName}`,
                provider: resolved.provider,
                model: resolved.modelName,
                timestamp: Date.now(),
              });

              // Delegate to Agent Engine
              await runAgentEngine({
                sessionId: payload.sessionId,
                tenantId: payload.tenantId,
                message: payload.message,
                history: payload.history,
                projectMemory: payload.projectMemory,
                agentRole: payload.agentRole,
                resolved,
                sendEvent,
              });

              controller.close();
            } catch (err: any) {
              console.error("[AI_AGENT_STREAM_ERROR]", err);
              const errMsg = err?.message || String(err);
              const userFriendlyErr = /rate|quota|429/i.test(errMsg)
                ? "تم تجاوز حد الطلبات مؤقتاً، حاول مرة أخرى بعد قليل."
                : "حدث خطأ في معالجة الطلب. يرجى المحاولة مجدداً.";

              sendEvent({
                type: "error",
                error: userFriendlyErr,
                detail: errMsg,
              });
              controller.close();
            }
          },
        });

        return new Response(customStream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
