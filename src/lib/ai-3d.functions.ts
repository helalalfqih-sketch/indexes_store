import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generate3DModel = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        images: z.array(z.string()).min(1),
      })
      .parse(raw),
  )
  .handler(async ({ data: { images } }) => {
    const imageUrl = images[0];
    const projectId = process.env.VERTEX_PROJECT_ID || "smartcontentcreator-d49f2";
    const region = process.env.VERTEX_REGION || "us-central1";
    const endpointId = process.env.VERTEX_ENDPOINT_ID;

    let token = process.env.VERTEX_OAUTH_TOKEN || "";
    if (!token) {
      try {
        const metadataRes = await fetch(
          "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
          { headers: { "Metadata-Flavor": "Google" } }
        );
        if (metadataRes.ok) {
          const data = (await metadataRes.json()) as { access_token: string };
          token = data.access_token;
        }
      } catch (e) {
        console.warn("Could not retrieve GCP metadata token:", e);
      }
    }

    // إذا لم يتم توفير معرف نقطة الاتصال (Endpoint ID) أو التوكن محلياً، نتراجع للنموذج التجريبي NeilArmstrong.glb لتسهيل التطوير المحلي وعدم عرقلة الواجهة.
    if (!endpointId || !token) {
      console.warn("Vertex AI Endpoint ID or OAuth token is not configured. Falling back to mock 3D model.");
      // محاكاة تأخير زمني لعملية المعالجة
      await new Promise((r) => setTimeout(r, 3000));
      return {
        modelUrl: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb"
      };
    }

    // تجهيز الصورة بتنسيق base64
    let base64Image = "";
    if (imageUrl.startsWith("data:image/")) {
      base64Image = imageUrl.split(",")[1];
    } else {
      const imageRes = await fetch(imageUrl);
      const buffer = await imageRes.arrayBuffer();
      base64Image = Buffer.from(buffer).toString("base64");
    }

    const endpointUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/endpoints/${endpointId}:rawPredict`;

    const apiRes = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: base64Image,
        output_format: "glb",
        texture: "pbr",
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Vertex AI endpoint returned error: ${apiRes.status} ${errText}`);
    }

    const resData = (await apiRes.json()) as { file_base64?: string; error?: string };
    if (resData.file_base64) {
      // إرجاع الملف بصيغة Data URL ليتم تحميله مباشرة بواسطة model-viewer أو Three.js دون الحاجة لتخزين سحابي وسيط
      return {
        modelUrl: `data:model/gltf-binary;base64,${resData.file_base64}`,
      };
    } else {
      throw new Error(resData.error || "Vertex AI response did not contain 3D mesh");
    }
  });
