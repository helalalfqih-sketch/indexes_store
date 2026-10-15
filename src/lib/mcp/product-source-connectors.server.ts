/* eslint-disable prettier/prettier */
export const PRODUCT_SOURCE_IDS = [
  "aliexpress",
  "alibaba_com",
  "1688",
  "cjdropshipping",
  "temu",
  "shein",
  "tiktok_shop",
  "dsers",
] as const;

export type ProductSourceId = (typeof PRODUCT_SOURCE_IDS)[number];

type ProductSourceConnector = {
  id: ProductSourceId;
  name: string;
  official_entrypoint: string;
  integration_target: "official_api" | "official_remote_mcp";
  account_model: string;
  auth_model: string;
  implementation_state:
    | "ready_for_user_oauth"
    | "blocked_pending_developer_approval"
    | "blocked_pending_api_entitlement"
    | "blocked_pending_secure_backend";
  observed_connection: "not_verified";
  uploaded_image_search: string;
  media_access: string;
  next_proof: string;
  constraints: string[];
  indexes_write_policy: "disabled_without_explicit_confirmation";
  technical_write_filter: "connector_not_active" | "not_enforced";
};

const PRODUCT_SOURCE_CONNECTORS: Record<ProductSourceId, ProductSourceConnector> = {
  aliexpress: {
    id: "aliexpress",
    name: "AliExpress",
    official_entrypoint: "https://openservice.aliexpress.com/",
    integration_target: "official_api",
    account_model: "Approved DS/AliExpress ISV application; seller authorization is a separate path.",
    auth_model: "Server-side app key and request signature after entitlement approval.",
    implementation_state: "blocked_pending_api_entitlement",
    observed_connection: "not_verified",
    uploaded_image_search:
      "A published legacy DS contract exists, but current entitlement for a new application is not verified.",
    media_access:
      "The published contract documents product images and an optional product video URL; no live call has verified them.",
    next_proof:
      "Verify that the application dashboard grants the exact image-search API, then run one signed read-only image query.",
    constraints: [
      "Do not request buyer passwords, cookies, or access tokens in chat.",
      "Do not claim seller OAuth grants DS image-search entitlement.",
    ],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  alibaba_com: {
    id: "alibaba_com",
    name: "Alibaba.com",
    official_entrypoint: "https://openapi.alibaba.com/doc/doc.htm",
    integration_target: "official_api",
    account_model: "Approved GGS developer application plus an authorized supplier or seller account.",
    auth_model: "Official application review, permission groups, and seller/supplier access token.",
    implementation_state: "blocked_pending_developer_approval",
    observed_connection: "not_verified",
    uploaded_image_search:
      "The documented recommendation endpoint uses an existing item ID, not an uploaded image.",
    media_access: "Authorized search and product detail responses may include images, SKU images, and optional video metadata.",
    next_proof: "Complete GGS approval, authorize a test seller/supplier, then run read-only search and detail calls.",
    constraints: ["Use Indexes Store Vision/Lens for an external image before an Alibaba item ID is known."],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  "1688": {
    id: "1688",
    name: "1688",
    official_entrypoint: "https://open.1688.com/",
    integration_target: "official_api",
    account_model: "Approved developer/ISV application and an eligible seller or distribution account.",
    auth_model: "App key, signed requests, and access token where the API is marked needAuth.",
    implementation_state: "blocked_pending_developer_approval",
    observed_connection: "not_verified",
    uploaded_image_search: "No current public API for arbitrary uploaded-image marketplace search was verified.",
    media_access: "Authorized owned-product data documents images and main/detail video fields.",
    next_proof: "Prefer the official DSers 1688 flow first; evaluate direct 1688 access after application approval.",
    constraints: ["Owned seller media is not proof of access to the public marketplace catalog."],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  cjdropshipping: {
    id: "cjdropshipping",
    name: "CJdropshipping",
    official_entrypoint: "https://developers.cjdropshipping.com/en/api/api2/mcp.html",
    integration_target: "official_remote_mcp",
    account_model: "CJ account; image search requires the account level documented by CJ.",
    auth_model:
      "CJ MCP token embedded in the official remote-MCP URL, or CJ access/refresh tokens for the official API; credentials must remain server-side.",
    implementation_state: "blocked_pending_secure_backend",
    observed_connection: "not_verified",
    uploaded_image_search: "Official queryProductsByImage is documented for eligible CJ accounts.",
    media_access: "Official product and video APIs expose media plus video status/rights metadata where available.",
    next_proof: "Configure the credential outside chat, verify identity read-only, then test image search and video rights metadata.",
    constraints: [
      "Never embed a CJ token in a distributable plugin package.",
      "A media URL does not grant commercial reuse rights.",
    ],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  temu: {
    id: "temu",
    name: "Temu",
    official_entrypoint: "https://partner.temu.com/",
    integration_target: "official_api",
    account_model: "Eligible local or cross-border seller plus an approved Partner/ISV application.",
    auth_model: "Temu seller/partner authorization after application approval.",
    implementation_state: "blocked_pending_developer_approval",
    observed_connection: "not_verified",
    uploaded_image_search: "Consumer-app visual search is not a documented public seller API.",
    media_access: "Authorized seller-catalog images may be available; public marketplace video access is not proven.",
    next_proof: "Approve the partner application, authorize a test seller, then list seller goods read-only.",
    constraints: ["Do not represent a consumer Temu login as seller API authorization."],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  shein: {
    id: "shein",
    name: "SHEIN",
    official_entrypoint: "https://open.sheincorp.com/documents/apidoc/1000001",
    integration_target: "official_api",
    account_model: "Seller self-developed application or approved ISV with main-account consent.",
    auth_model: "Official temporary token exchange, signed requests, and required network allowlisting.",
    implementation_state: "blocked_pending_developer_approval",
    observed_connection: "not_verified",
    uploaded_image_search: "Consumer visual search is not a documented public seller product-search API.",
    media_access: "Authorized SPU data may include images and productVideoList.",
    next_proof: "Approve the seller/ISV application, then read store info, product list, and one SPU detail.",
    constraints: ["Media access does not imply permission for commercial reuse."],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  tiktok_shop: {
    id: "tiktok_shop",
    name: "TikTok Shop",
    official_entrypoint: "https://partner.tiktokshop.com/docv2/api-document",
    integration_target: "official_api",
    account_model: "TikTok Shop seller plus approved Partner Center or custom application.",
    auth_model: "Seller authorization, access token, app key, request signature, and shop cipher.",
    implementation_state: "blocked_pending_developer_approval",
    observed_connection: "not_verified",
    uploaded_image_search: "No public free-form visual marketplace-search API was verified.",
    media_access: "Authorized seller product details may include the seller's product images and video metadata.",
    next_proof: "Approve the application, authorize a test shop, then read authorized shops and one product.",
    constraints: ["This connector is separate from the existing TikTok social-account integration."],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "connector_not_active",
  },
  dsers: {
    id: "dsers",
    name: "DSers",
    official_entrypoint: "https://ai.dsers.com/mcp",
    integration_target: "official_remote_mcp",
    account_model: "Eligible DSers account and plan with the required connected store or supplier.",
    auth_model: "OAuth 2.1 Authorization Code with PKCE on the official DSers authorization screen.",
    implementation_state: "ready_for_user_oauth",
    observed_connection: "not_verified",
    uploaded_image_search: "The official MCP documents supplier-product search by keyword or image.",
    media_access:
      "The exact image and video fields require proof from the live tool schema and one authorized product-detail response.",
    next_proof: "User completes OAuth on screen, then run profile, filters, image search, and one product detail read-only.",
    constraints: [
      "The official remote MCP exposes write tools after OAuth.",
      "The direct connection has no technical read-only allowlist; the client must require exact confirmation before every write.",
    ],
    indexes_write_policy: "disabled_without_explicit_confirmation",
    technical_write_filter: "not_enforced",
  },
};

const PRODUCT_SOURCE_POLICY = {
  default_access: "read_only",
  chat_secrets_allowed: false,
  buyer_password_or_cookie_automation: false,
  writes_enabled: false,
  writes_require_explicit_confirmation: true,
} as const;

export function listProductSourceConnectors() {
  return {
    policy: PRODUCT_SOURCE_POLICY,
    connectors: PRODUCT_SOURCE_IDS.map((id) => PRODUCT_SOURCE_CONNECTORS[id]),
  };
}

export function inspectProductSourceConnector(id: ProductSourceId) {
  return {
    policy: PRODUCT_SOURCE_POLICY,
    connector: PRODUCT_SOURCE_CONNECTORS[id],
  };
}
