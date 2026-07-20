import { P as notFound, m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as fetchProductBySlug } from "./product.actions-BIwQALk-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product._slug-BNxmjCor.js
var $$splitComponentImporter = () => import("./product._slug-DuR-lE3m.mjs");
var $$splitErrorComponentImporter = () => import("./product._slug-X_34Zled.mjs");
var $$splitNotFoundComponentImporter = () => import("./product._slug-BzW3Jv68.mjs");
var Route = createFileRoute("/product/$slug")({
	loader: async ({ params }) => {
		const product = await fetchProductBySlug(params.slug);
		if (!product) throw notFound();
		return { product };
	},
	head: ({ loaderData }) => ({ meta: loaderData ? [
		{ title: `${loaderData.product.name} — اندكس ستور` },
		{
			name: "description",
			content: loaderData.product.description
		},
		{
			property: "og:title",
			content: loaderData.product.name
		},
		{
			property: "og:description",
			content: loaderData.product.description
		},
		{
			property: "og:image",
			content: loaderData.product.image
		}
	] : [{ title: "المنتج غير موجود — اندكس ستور" }, {
		name: "robots",
		content: "noindex"
	}] }),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
