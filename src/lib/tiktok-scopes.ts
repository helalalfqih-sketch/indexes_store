export const TIKTOK_SCOPE_DETAILS = [
  {
    scope: "user.info.basic",
    label: "الملف الأساسي",
    description: "الاسم والصورة والمعرّف الأساسي للحساب.",
  },
  {
    scope: "user.info.profile",
    label: "تفاصيل الملف الشخصي",
    description: "نبذة الحساب ورابط الملف وبيانات الملف الموسعة.",
  },
  {
    scope: "user.info.stats",
    label: "إحصاءات الحساب",
    description: "أعداد المتابعين والمتابَعين والإعجابات والفيديوهات.",
  },
  {
    scope: "video.list",
    label: "قراءة الفيديوهات",
    description: "عرض فيديوهات الحساب والبحث داخلها.",
  },
  {
    scope: "video.upload",
    label: "رفع مسودة",
    description: "رفع فيديو إلى صندوق وارد TikTok كمسودة.",
  },
  {
    scope: "video.publish",
    label: "النشر المباشر",
    description: "نشر فيديو مباشرة بعد التأكيد الصريح.",
  },
] as const;

export function summarizeTikTokScopes(scopes: string[]) {
  const grantedScopes = new Set(scopes);
  const knownScopes = new Set<string>(TIKTOK_SCOPE_DETAILS.map(({ scope }) => scope));
  return {
    permissions: TIKTOK_SCOPE_DETAILS.map((permission) => ({
      ...permission,
      granted: grantedScopes.has(permission.scope),
    })),
    grantedCount: TIKTOK_SCOPE_DETAILS.filter(({ scope }) => grantedScopes.has(scope)).length,
    unknownScopes: [...grantedScopes].filter((scope) => !knownScopes.has(scope)).sort(),
  };
}
