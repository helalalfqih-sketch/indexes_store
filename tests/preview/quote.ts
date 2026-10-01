export async function getCheckoutQuote({
  data,
}: {
  data: { items: Array<{ productRef: { id: string }; quantity: number }>; couponCode: string };
}) {
  if (data.couponCode && !["INDEXES10", "INDEXES20"].includes(data.couponCode))
    throw new Error("Sandbox invalid coupon");
  const items = data.items.map((line, index) => ({
    id: line.productRef.id,
    name: index ? "سخان مياه — عينة اختبار" : "لوحة مفاتيح — عينة اختبار",
    unitPrice: index ? 21900 : 14900,
    quantity: line.quantity,
    stock: 5,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = Math.round(
    subtotal * (data.couponCode === "INDEXES20" ? 0.2 : data.couponCode === "INDEXES10" ? 0.1 : 0),
  );
  const shipping = subtotal - discount >= 30000 ? 0 : 3000;
  return {
    items,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    currency: "YER",
    couponCode: data.couponCode,
    freeShippingThreshold: 30000,
  };
}
export async function submitOrder(input: Parameters<typeof getCheckoutQuote>[0]["data"]) {
  const sandbox = window as typeof window & { sandboxOrderCount?: number };
  sandbox.sandboxOrderCount = (sandbox.sandboxOrderCount ?? 0) + 1;
  await new Promise((resolve) => setTimeout(resolve, 100));
  const quote = await getCheckoutQuote({ data: input });
  return {
    orderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    total: quote.total,
    currency: "YER",
    itemsCount: quote.items.length,
    quote,
  };
}
