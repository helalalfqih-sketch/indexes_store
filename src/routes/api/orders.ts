import { createFileRoute } from "@tanstack/react-router";
import { createOrder } from "@/lib/order.functions";

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const result = await createOrder({ data: body });
          return Response.json(result, { status: 200 });
        } catch (err: any) {
          console.error("[API_ORDERS_ERROR]", err);
          return Response.json(
            { error: err?.message || "حدث خطأ أثناء معالجة الطلب" },
            { status: err?.status || 400 },
          );
        }
      },
    },
  },
});
