import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/order-completion")({
  head: () => ({
    meta: [
      { title: "سلة التسوق — اندكس ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/cart" });
  },
  component: () => null,
});
