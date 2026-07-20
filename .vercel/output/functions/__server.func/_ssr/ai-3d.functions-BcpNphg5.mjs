import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { lt as arrayType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-3d.functions-BcpNphg5.js
var generate3DModel_createServerFn_handler = createServerRpc({
	id: "7d965ea1ab81962acd97e4b9c7c1e236cbd8e82ea61b689a356ddbecc45cdb34",
	name: "generate3DModel",
	filename: "src/lib/ai-3d.functions.ts"
}, (opts) => generate3DModel.__executeServer(opts));
var generate3DModel = createServerFn({ method: "POST" }).inputValidator((raw) => objectType({ images: arrayType(stringType()).min(1) }).parse(raw)).handler(generate3DModel_createServerFn_handler, async ({ data: { images } }) => {
	const imageUrl = images[0];
	const projectId = process.env.VERTEX_PROJECT_ID || "smartcontentcreator-d49f2";
	const region = process.env.VERTEX_REGION || "us-central1";
	const endpointId = process.env.VERTEX_ENDPOINT_ID;
	let token = process.env.VERTEX_OAUTH_TOKEN || "";
	if (!token) try {
		const metadataRes = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", { headers: { "Metadata-Flavor": "Google" } });
		if (metadataRes.ok) token = (await metadataRes.json()).access_token;
	} catch (e) {
		console.warn("Could not retrieve GCP metadata token:", e);
	}
	if (!endpointId || !token) {
		console.warn("Vertex AI Endpoint ID or OAuth token is not configured. Falling back to mock 3D model.");
		await new Promise((r) => setTimeout(r, 3e3));
		return { modelUrl: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb" };
	}
	let base64Image = "";
	if (imageUrl.startsWith("data:image/")) base64Image = imageUrl.split(",")[1];
	else {
		const buffer = await (await fetch(imageUrl)).arrayBuffer();
		base64Image = Buffer.from(buffer).toString("base64");
	}
	const endpointUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/endpoints/${endpointId}:rawPredict`;
	const apiRes = await fetch(endpointUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			image_base64: base64Image,
			output_format: "glb",
			texture: "pbr"
		})
	});
	if (!apiRes.ok) {
		const errText = await apiRes.text();
		throw new Error(`Vertex AI endpoint returned error: ${apiRes.status} ${errText}`);
	}
	const resData = await apiRes.json();
	if (resData.file_base64) return { modelUrl: `data:model/gltf-binary;base64,${resData.file_base64}` };
	else throw new Error(resData.error || "Vertex AI response did not contain 3D mesh");
});
//#endregion
export { generate3DModel_createServerFn_handler };
