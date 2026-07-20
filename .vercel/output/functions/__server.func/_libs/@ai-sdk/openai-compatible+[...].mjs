import { $ as union, B as array, F as EventSourceParserStream, G as literal, I as _enum, J as number, K as looseObject, N as WORKFLOW_DESERIALIZE, P as WORKFLOW_SERIALIZE, Q as string, V as boolean, X as record, Y as object, ct as ZodFirstPartyTypeKind, nt as toJSONSchema, tt as safeParseAsync, z as any } from "./gateway+[...].mjs";
//#region node_modules/@ai-sdk/openai-compatible/node_modules/@ai-sdk/provider/dist/index.js
var marker$1 = "vercel.ai.error";
var symbol$1 = Symbol.for(marker$1);
var _a$1, _b$1;
var AISDKError = class _AISDKError extends (_b$1 = Error, _a$1 = symbol$1, _b$1) {
	/**
	* Creates an AI SDK Error.
	*
	* @param {Object} params - The parameters for creating the error.
	* @param {string} params.name - The name of the error.
	* @param {string} params.message - The error message.
	* @param {unknown} [params.cause] - The underlying cause of the error.
	*/
	constructor({ name: name15, message, cause }) {
		super(message);
		this[_a$1] = true;
		this.name = name15;
		this.cause = cause;
	}
	/**
	* Checks if the given error is an AI SDK Error.
	* @param {unknown} error - The error to check.
	* @returns {boolean} True if the error is an AI SDK Error, false otherwise.
	*/
	static isInstance(error) {
		return _AISDKError.hasMarker(error, marker$1);
	}
	static hasMarker(error, marker16) {
		const markerSymbol = Symbol.for(marker16);
		return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
	}
};
var name$1 = "AI_APICallError";
var marker2 = `vercel.ai.error.${name$1}`;
var symbol2 = Symbol.for(marker2);
var _a2, _b2;
var APICallError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name: name$1,
			message,
			cause
		});
		this[_a2] = true;
		this.url = url;
		this.requestBodyValues = requestBodyValues;
		this.statusCode = statusCode;
		this.responseHeaders = responseHeaders;
		this.responseBody = responseBody;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2);
	}
};
var name2 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2}`;
var symbol3 = Symbol.for(marker3);
var _a3, _b3;
var EmptyResponseBodyError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
	constructor({ message = "Empty response body" } = {}) {
		super({
			name: name2,
			message
		});
		this[_a3] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
function getErrorMessage(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.toString();
	return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4, _b4;
var InvalidArgumentError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
	constructor({ message, cause, argument }) {
		super({
			name: name3,
			message,
			cause
		});
		this[_a4] = true;
		this.argument = argument;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
var name4 = "AI_InvalidPromptError";
var marker5 = `vercel.ai.error.${name4}`;
var symbol5 = Symbol.for(marker5);
var _a5, _b5;
var InvalidPromptError = class extends (_b5 = AISDKError, _a5 = symbol5, _b5) {
	constructor({ prompt, message, cause }) {
		super({
			name: name4,
			message: `Invalid prompt: ${message}`,
			cause
		});
		this[_a5] = true;
		this.prompt = prompt;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5);
	}
};
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6, _b6;
var InvalidResponseDataError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
	constructor({ data, message = `Invalid response data: ${JSON.stringify(data)}.` }) {
		super({
			name: name5,
			message
		});
		this[_a6] = true;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7, _b7;
var JSONParseError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
	constructor({ text, cause }) {
		super({
			name: name6,
			message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a7] = true;
		this.text = text;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
var name12 = "AI_TooManyEmbeddingValuesForCallError";
var marker13 = `vercel.ai.error.${name12}`;
var symbol13 = Symbol.for(marker13);
var _a13, _b13;
var TooManyEmbeddingValuesForCallError = class extends (_b13 = AISDKError, _a13 = symbol13, _b13) {
	constructor(options) {
		super({
			name: name12,
			message: `Too many values for a single embedding call. The ${options.provider} model "${options.modelId}" can only embed up to ${options.maxEmbeddingsPerCall} values per call, but ${options.values.length} values were provided.`
		});
		this[_a13] = true;
		this.provider = options.provider;
		this.modelId = options.modelId;
		this.maxEmbeddingsPerCall = options.maxEmbeddingsPerCall;
		this.values = options.values;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker13);
	}
};
var name13 = "AI_TypeValidationError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14, _b14;
var TypeValidationError = class _TypeValidationError extends (_b14 = AISDKError, _a14 = symbol14, _b14) {
	constructor({ value, cause, context }) {
		let contextPrefix = "Type validation failed";
		if (context == null ? void 0 : context.field) contextPrefix += ` for ${context.field}`;
		if ((context == null ? void 0 : context.entityName) || (context == null ? void 0 : context.entityId)) {
			contextPrefix += " (";
			const parts = [];
			if (context.entityName) parts.push(context.entityName);
			if (context.entityId) parts.push(`id: "${context.entityId}"`);
			contextPrefix += parts.join(", ");
			contextPrefix += ")";
		}
		super({
			name: name13,
			message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a14] = true;
		this.value = value;
		this.context = context;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
	/**
	* Wraps an error into a TypeValidationError.
	* If the cause is already a TypeValidationError with the same value and context, it returns the cause.
	* Otherwise, it creates a new TypeValidationError.
	*
	* @param {Object} params - The parameters for wrapping the error.
	* @param {unknown} params.value - The value that failed validation.
	* @param {unknown} params.cause - The original error or cause of the validation failure.
	* @param {TypeValidationContext} params.context - Optional context about what is being validated.
	* @returns {TypeValidationError} A TypeValidationError instance.
	*/
	static wrap({ value, cause, context }) {
		var _a16, _b16, _c;
		if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a16 = cause.context) == null ? void 0 : _a16.field) === (context == null ? void 0 : context.field) && ((_b16 = cause.context) == null ? void 0 : _b16.entityName) === (context == null ? void 0 : context.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context == null ? void 0 : context.entityId)) return cause;
		return new _TypeValidationError({
			value,
			cause,
			context
		});
	}
};
var name14 = "AI_UnsupportedFunctionalityError";
var marker15 = `vercel.ai.error.${name14}`;
var symbol15 = Symbol.for(marker15);
var _a15, _b15;
var UnsupportedFunctionalityError = class extends (_b15 = AISDKError, _a15 = symbol15, _b15) {
	constructor({ functionality, message = `'${functionality}' functionality not supported.` }) {
		super({
			name: name14,
			message
		});
		this[_a15] = true;
		this.functionality = functionality;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker15);
	}
};
//#endregion
//#region node_modules/@ai-sdk/openai-compatible/node_modules/@ai-sdk/provider-utils/dist/index.js
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => ({
		...combinedHeaders,
		...currentHeaders != null ? currentHeaders : {}
	}), {});
}
var { btoa, atob } = globalThis;
function convertBase64ToUint8Array(base64String) {
	const latin1string = atob(base64String.replace(/-/g, "+").replace(/_/g, "/"));
	return Uint8Array.from(latin1string, (byte) => byte.codePointAt(0));
}
function convertUint8ArrayToBase64(array) {
	let latin1string = "";
	for (let i = 0; i < array.length; i++) latin1string += String.fromCodePoint(array[i]);
	return btoa(latin1string);
}
function convertToBase64(value) {
	return value instanceof Uint8Array ? convertUint8ArrayToBase64(value) : value;
}
function convertToFormData(input, options = {}) {
	const { useArrayBrackets = true } = options;
	const formData = new FormData();
	for (const [key, value] of Object.entries(input)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			if (value.length === 1) {
				formData.append(key, value[0]);
				continue;
			}
			const arrayKey = useArrayBrackets ? `${key}[]` : key;
			for (const item of value) formData.append(arrayKey, item);
			continue;
		}
		formData.append(key, value);
	}
	return formData;
}
var imageMediaTypeSignatures = [
	{
		mediaType: "image/gif",
		bytesPrefix: [
			71,
			73,
			70
		]
	},
	{
		mediaType: "image/png",
		bytesPrefix: [
			137,
			80,
			78,
			71
		]
	},
	{
		mediaType: "image/jpeg",
		bytesPrefix: [255, 216]
	},
	{
		mediaType: "image/webp",
		bytesPrefix: [
			82,
			73,
			70,
			70,
			null,
			null,
			null,
			null,
			87,
			69,
			66,
			80
		]
	},
	{
		mediaType: "image/bmp",
		bytesPrefix: [66, 77]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			73,
			73,
			42,
			0
		]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			77,
			77,
			0,
			42
		]
	},
	{
		mediaType: "image/avif",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			97,
			118,
			105,
			102
		]
	},
	{
		mediaType: "image/heic",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			104,
			101,
			105,
			99
		]
	}
];
var documentMediaTypeSignatures = [{
	mediaType: "application/pdf",
	bytesPrefix: [
		37,
		80,
		68,
		70
	]
}];
var audioMediaTypeSignatures = [
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 251]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 250]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 243]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 242]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 227]
	},
	{
		mediaType: "audio/mpeg",
		bytesPrefix: [255, 226]
	},
	{
		mediaType: "audio/wav",
		bytesPrefix: [
			82,
			73,
			70,
			70,
			null,
			null,
			null,
			null,
			87,
			65,
			86,
			69
		]
	},
	{
		mediaType: "audio/ogg",
		bytesPrefix: [
			79,
			103,
			103,
			83
		]
	},
	{
		mediaType: "audio/flac",
		bytesPrefix: [
			102,
			76,
			97,
			67
		]
	},
	{
		mediaType: "audio/aac",
		bytesPrefix: [
			64,
			21,
			0,
			0
		]
	},
	{
		mediaType: "audio/mp4",
		bytesPrefix: [
			102,
			116,
			121,
			112
		]
	},
	{
		mediaType: "audio/webm",
		bytesPrefix: [
			26,
			69,
			223,
			163
		]
	}
];
var videoMediaTypeSignatures = [
	{
		mediaType: "video/mp4",
		bytesPrefix: [
			0,
			0,
			0,
			null,
			102,
			116,
			121,
			112
		]
	},
	{
		mediaType: "video/webm",
		bytesPrefix: [
			26,
			69,
			223,
			163
		]
	},
	{
		mediaType: "video/quicktime",
		bytesPrefix: [
			0,
			0,
			0,
			20,
			102,
			116,
			121,
			112,
			113,
			116
		]
	},
	{
		mediaType: "video/x-msvideo",
		bytesPrefix: [
			82,
			73,
			70,
			70
		]
	}
];
var stripID3 = (data) => {
	const bytes = typeof data === "string" ? convertBase64ToUint8Array(data) : data;
	const id3Size = (bytes[6] & 127) << 21 | (bytes[7] & 127) << 14 | (bytes[8] & 127) << 7 | bytes[9] & 127;
	return bytes.slice(id3Size + 10);
};
function stripID3TagsIfPresent(data) {
	return typeof data === "string" && data.startsWith("SUQz") || typeof data !== "string" && data.length > 10 && data[0] === 73 && data[1] === 68 && data[2] === 51 ? stripID3(data) : data;
}
function detectMediaTypeBySignatures({ data, signatures }) {
	const processedData = stripID3TagsIfPresent(data);
	const bytes = typeof processedData === "string" ? convertBase64ToUint8Array(processedData.substring(0, Math.min(processedData.length, 24))) : processedData;
	for (const signature of signatures) if (bytes.length >= signature.bytesPrefix.length && signature.bytesPrefix.every((byte, index) => byte === null || bytes[index] === byte)) return signature.mediaType;
}
var topLevelSignatureTables = {
	image: imageMediaTypeSignatures,
	audio: audioMediaTypeSignatures,
	video: videoMediaTypeSignatures,
	application: documentMediaTypeSignatures
};
function detectMediaType({ data, topLevelType }) {
	if (topLevelType === void 0) return detectMediaTypeBySignatures({
		data,
		signatures: [
			...imageMediaTypeSignatures,
			...documentMediaTypeSignatures,
			...audioMediaTypeSignatures,
			...videoMediaTypeSignatures
		]
	});
	const signatures = topLevelSignatureTables[topLevelType];
	if (signatures === void 0) return;
	return detectMediaTypeBySignatures({
		data,
		signatures
	});
}
function getTopLevelMediaType(mediaType) {
	const slashIndex = mediaType.indexOf("/");
	return slashIndex === -1 ? mediaType : mediaType.substring(0, slashIndex);
}
function isFullMediaType(mediaType) {
	const slashIndex = mediaType.indexOf("/");
	if (slashIndex === -1) return false;
	const subtype = mediaType.substring(slashIndex + 1);
	return subtype.length > 0 && subtype !== "*";
}
async function cancelResponseBody(response) {
	var _a2;
	try {
		await ((_a2 = response.body) == null ? void 0 : _a2.cancel());
	} catch (e) {}
}
var name = "AI_DownloadError";
var marker = `vercel.ai.error.${name}`;
var symbol = Symbol.for(marker);
var _a, _b;
var DownloadError = class extends (_b = AISDKError, _a = symbol, _b) {
	constructor({ url, statusCode, statusText, cause, message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}` }) {
		super({
			name,
			message,
			cause
		});
		this[_a] = true;
		this.url = url;
		this.statusCode = statusCode;
		this.statusText = statusText;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker);
	}
};
function isBrowserRuntime(globalThisAny = globalThis) {
	return globalThisAny.window != null;
}
function validateDownloadUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch (e) {
		throw new DownloadError({
			url,
			message: `Invalid URL: ${url}`
		});
	}
	if (parsed.protocol === "data:") return;
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new DownloadError({
		url,
		message: `URL scheme must be http, https, or data, got ${parsed.protocol}`
	});
	const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
	if (!hostname) throw new DownloadError({
		url,
		message: `URL must have a hostname`
	});
	if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".localhost")) throw new DownloadError({
		url,
		message: `URL with hostname ${hostname} is not allowed`
	});
	if (hostname.startsWith("[") && hostname.endsWith("]")) {
		if (isPrivateIPv6(hostname.slice(1, -1))) throw new DownloadError({
			url,
			message: `URL with IPv6 address ${hostname} is not allowed`
		});
		return;
	}
	if (isIPv4(hostname)) {
		if (isPrivateIPv4(hostname)) throw new DownloadError({
			url,
			message: `URL with IP address ${hostname} is not allowed`
		});
		return;
	}
}
function isIPv4(hostname) {
	const parts = hostname.split(".");
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		const num = Number(part);
		return Number.isInteger(num) && num >= 0 && num <= 255 && String(num) === part;
	});
}
function isPrivateIPv4(ip) {
	const [a, b, c] = ip.split(".").map(Number);
	if (a === 0) return true;
	if (a === 10) return true;
	if (a === 100 && b >= 64 && b <= 127) return true;
	if (a === 127) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 0 && c === 0) return true;
	if (a === 192 && b === 168) return true;
	if (a === 198 && (b === 18 || b === 19)) return true;
	if (a >= 240) return true;
	return false;
}
function parseIPv6(ip) {
	let address = ip.toLowerCase();
	const zoneIndex = address.indexOf("%");
	if (zoneIndex !== -1) address = address.slice(0, zoneIndex);
	const halves = address.split("::");
	if (halves.length > 2) return null;
	const toGroups = (segment) => {
		if (segment === "") return [];
		const groups = [];
		const parts = segment.split(":");
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (part.includes(".")) {
				if (i !== parts.length - 1 || !isIPv4(part)) return null;
				const [a, b, c, d] = part.split(".").map(Number);
				groups.push(a << 8 | b, c << 8 | d);
				continue;
			}
			if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
			groups.push(parseInt(part, 16));
		}
		return groups;
	};
	const head = toGroups(halves[0]);
	if (head === null) return null;
	if (halves.length === 2) {
		const tail = toGroups(halves[1]);
		if (tail === null) return null;
		const fill = 8 - head.length - tail.length;
		if (fill < 0) return null;
		return [
			...head,
			...new Array(fill).fill(0),
			...tail
		];
	}
	return head.length === 8 ? head : null;
}
function isPrivateIPv6(ip) {
	const groups = parseIPv6(ip);
	if (groups === null) return true;
	const topZero = (count) => groups.slice(0, count).every((group) => group === 0);
	if (topZero(7) && (groups[7] === 0 || groups[7] === 1)) return true;
	if ((groups[0] & 65024) === 64512) return true;
	if ((groups[0] & 65472) === 65152) return true;
	if ((groups[0] & 65472) === 65216) return true;
	if ((groups[0] & 65280) === 65280) return true;
	if (topZero(6) || topZero(5) && groups[5] === 65535 || topZero(4) && groups[4] === 65535 && groups[5] === 0 || groups[0] === 100 && groups[1] === 65435 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0 || groups[0] === 100 && groups[1] === 65435 && groups[2] === 1) return isPrivateIPv4(`${groups[6] >> 8 & 255}.${groups[6] & 255}.${groups[7] >> 8 & 255}.${groups[7] & 255}`);
	return false;
}
var MAX_DOWNLOAD_REDIRECTS = 10;
async function fetchWithValidatedRedirects({ url, headers, abortSignal, maxRedirects = MAX_DOWNLOAD_REDIRECTS }) {
	const baseInit = { signal: abortSignal };
	if (headers !== void 0) baseInit.headers = headers;
	let currentUrl = url;
	for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
		validateDownloadUrl(currentUrl);
		const response = await fetch(currentUrl, {
			...baseInit,
			redirect: "manual"
		});
		if (response.type === "opaqueredirect") {
			if (!isBrowserRuntime()) throw new DownloadError({
				url,
				message: `Redirect from ${currentUrl} could not be validated and was blocked`
			});
			return await fetch(currentUrl, {
				...baseInit,
				redirect: "follow"
			});
		}
		const location = response.headers.get("location");
		if (response.status >= 300 && response.status < 400 && location) {
			await cancelResponseBody(response);
			currentUrl = new URL(location, currentUrl).toString();
			continue;
		}
		return response;
	}
	throw new DownloadError({
		url,
		message: `Too many redirects (max ${maxRedirects})`
	});
}
var DEFAULT_MAX_DOWNLOAD_SIZE = 2 * 1024 * 1024 * 1024;
async function readResponseWithSizeLimit({ response, url, maxBytes = DEFAULT_MAX_DOWNLOAD_SIZE }) {
	const contentLength = response.headers.get("content-length");
	if (contentLength != null) {
		const length = parseInt(contentLength, 10);
		if (!isNaN(length) && length > maxBytes) {
			await cancelResponseBody(response);
			throw new DownloadError({
				url,
				message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes (Content-Length: ${length}).`
			});
		}
	}
	const body = response.body;
	if (body == null) return /* @__PURE__ */ new Uint8Array(0);
	const reader = body.getReader();
	const chunks = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.length;
			if (totalBytes > maxBytes) throw new DownloadError({
				url,
				message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes.`
			});
			chunks.push(value);
		}
	} finally {
		try {
			await reader.cancel();
		} finally {
			reader.releaseLock();
		}
	}
	const result = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}
async function downloadBlob(url, options) {
	var _a2, _b2;
	try {
		const response = await fetchWithValidatedRedirects({
			url,
			abortSignal: options == null ? void 0 : options.abortSignal
		});
		if (!response.ok) {
			await cancelResponseBody(response);
			throw new DownloadError({
				url,
				statusCode: response.status,
				statusText: response.statusText
			});
		}
		const data = await readResponseWithSizeLimit({
			response,
			url,
			maxBytes: (_a2 = options == null ? void 0 : options.maxBytes) != null ? _a2 : DEFAULT_MAX_DOWNLOAD_SIZE
		});
		const contentType = (_b2 = response.headers.get("content-type")) != null ? _b2 : void 0;
		return new Blob([data], contentType ? { type: contentType } : void 0);
	} catch (error) {
		if (DownloadError.isInstance(error)) throw error;
		throw new DownloadError({
			url,
			cause: error
		});
	}
}
function extractResponseHeaders(response) {
	return Object.fromEntries([...response.headers]);
}
var createIdGenerator = ({ prefix, size = 16, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", separator = "-" } = {}) => {
	const generator = () => {
		const alphabetLength = alphabet.length;
		const chars = new Array(size);
		for (let i = 0; i < size; i++) chars[i] = alphabet[Math.random() * alphabetLength | 0];
		return chars.join("");
	};
	if (prefix == null) return generator;
	if (alphabet.includes(separator)) throw new InvalidArgumentError({
		argument: "separator",
		message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
	});
	return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function isAbortError(error) {
	return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || error.name === "TimeoutError");
}
var FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
var BUN_ERROR_CODES = [
	"ConnectionRefused",
	"ConnectionClosed",
	"FailedToOpenSocket",
	"ECONNRESET",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"EPIPE"
];
function isBunNetworkError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	if (typeof code === "string" && BUN_ERROR_CODES.includes(code)) return true;
	return false;
}
function handleFetchError({ error, url, requestBodyValues }) {
	if (isAbortError(error)) return error;
	if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
		const cause = error.cause;
		if (cause != null) return new APICallError({
			message: `Cannot connect to API: ${cause.message}`,
			cause,
			url,
			requestBodyValues,
			isRetryable: true
		});
	}
	if (isBunNetworkError(error)) return new APICallError({
		message: `Cannot connect to API: ${error.message}`,
		cause: error,
		url,
		requestBodyValues,
		isRetryable: true
	});
	return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
	var _a2, _b2, _c;
	if (globalThisAny.window) return `runtime/browser`;
	if ((_a2 = globalThisAny.navigator) == null ? void 0 : _a2.userAgent) return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
	if ((_c = (_b2 = globalThisAny.process) == null ? void 0 : _b2.versions) == null ? void 0 : _c.node) return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
	if (globalThisAny.EdgeRuntime) return `runtime/vercel-edge`;
	return "runtime/unknown";
}
function normalizeHeaders(headers) {
	if (headers == null) return {};
	const normalized = {};
	if (headers instanceof Headers) headers.forEach((value, key) => {
		normalized[key.toLowerCase()] = value;
	});
	else {
		if (!Array.isArray(headers)) headers = Object.entries(headers);
		for (const [key, value] of headers) if (value != null) normalized[key.toLowerCase()] = value;
	}
	return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
	const normalizedHeaders = new Headers(normalizeHeaders(headers));
	const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
	normalizedHeaders.set("user-agent", [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" "));
	return Object.fromEntries(normalizedHeaders.entries());
}
var VERSION$1 = "5.0.7";
function isCustomReasoning(reasoning) {
	return reasoning !== void 0 && reasoning !== "provider-default";
}
var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
function _parse(text) {
	const obj = JSON.parse(text);
	if (obj === null || typeof obj !== "object") return obj;
	if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) return obj;
	return filter(obj);
}
function filter(obj) {
	let next = [obj];
	while (next.length) {
		const nodes = next;
		next = [];
		for (const node of nodes) {
			if (Object.prototype.hasOwnProperty.call(node, "__proto__")) throw new SyntaxError("Object contains forbidden prototype property");
			if (Object.prototype.hasOwnProperty.call(node, "constructor") && node.constructor !== null && typeof node.constructor === "object" && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) throw new SyntaxError("Object contains forbidden prototype property");
			for (const key in node) {
				const value = node[key];
				if (value && typeof value === "object") next.push(value);
			}
		}
	}
	return obj;
}
function secureJsonParse(text) {
	const { stackTraceLimit } = Error;
	try {
		Error.stackTraceLimit = 0;
	} catch (e) {
		return _parse(text);
	}
	try {
		return _parse(text);
	} finally {
		Error.stackTraceLimit = stackTraceLimit;
	}
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
	if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
		jsonSchema2.additionalProperties = false;
		const { properties } = jsonSchema2;
		if (properties != null) for (const key of Object.keys(properties)) properties[key] = visit(properties[key]);
	}
	if (jsonSchema2.items != null) jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
	if (jsonSchema2.anyOf != null) jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
	if (jsonSchema2.allOf != null) jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
	if (jsonSchema2.oneOf != null) jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
	const { definitions } = jsonSchema2;
	if (definitions != null) for (const key of Object.keys(definitions)) definitions[key] = visit(definitions[key]);
	return jsonSchema2;
}
function visit(def) {
	if (typeof def === "boolean") return def;
	return addAdditionalPropertiesToJsonSchema(def);
}
var ignoreOverride = /* @__PURE__ */ Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: true,
	rejectedAdditionalProperties: false,
	definitionPath: "definitions",
	strictUnions: false,
	definitions: {},
	errorMessages: false,
	patternStrategy: "escape",
	applyRegexFlags: false,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
	...defaultOptions,
	name: options
} : {
	...defaultOptions,
	...options
};
function parseAnyDef() {
	return {};
}
function parseArrayDef(def, refs) {
	var _a2, _b2, _c;
	const res = { type: "array" };
	if (((_a2 = def.type) == null ? void 0 : _a2._def) && ((_c = (_b2 = def.type) == null ? void 0 : _b2._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) res.items = parseDef(def.type._def, {
		...refs,
		currentPath: [...refs.currentPath, "items"]
	});
	if (def.minLength) res.minItems = def.minLength.value;
	if (def.maxLength) res.maxItems = def.maxLength.value;
	if (def.exactLength) {
		res.minItems = def.exactLength.value;
		res.maxItems = def.exactLength.value;
	}
	return res;
}
function parseBigintDef(def) {
	const res = {
		type: "integer",
		format: "int64"
	};
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf":
			res.multipleOf = check.value;
			break;
	}
	return res;
}
function parseBooleanDef() {
	return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
	return parseDef(_def.type._def, refs);
}
var parseCatchDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
	const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
	if (Array.isArray(strategy)) return { anyOf: strategy.map((item) => parseDateDef(def, refs, item)) };
	switch (strategy) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return integerDateParser(def);
	}
}
var integerDateParser = (def) => {
	const res = {
		type: "integer",
		format: "unix-time"
	};
	for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minimum = check.value;
			break;
		case "max":
			res.maximum = check.value;
			break;
	}
	return res;
};
function parseDefaultDef(_def, refs) {
	return {
		...parseDef(_def.innerType._def, refs),
		default: _def.defaultValue()
	};
}
function parseEffectsDef(_def, refs) {
	return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
	return {
		type: "string",
		enum: Array.from(def.values)
	};
}
var isJsonSchema7AllOfType = (type) => {
	if ("type" in type && type.type === "string") return false;
	return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
	const allOf = [parseDef(def.left._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	}), parseDef(def.right._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"1"
		]
	})].filter((x) => !!x);
	const mergedAllOf = [];
	allOf.forEach((schema) => {
		if (isJsonSchema7AllOfType(schema)) mergedAllOf.push(...schema.allOf);
		else {
			let nestedSchema = schema;
			if ("additionalProperties" in schema && schema.additionalProperties === false) {
				const { additionalProperties: _additionalProperties, ...rest } = schema;
				nestedSchema = rest;
			}
			mergedAllOf.push(nestedSchema);
		}
	});
	return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
	const parsedType = typeof def.value;
	if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") return { type: Array.isArray(def.value) ? "array" : "object" };
	return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		const: def.value
	};
}
var emojiRegex = void 0;
var zodPatterns = {
	/**
	* `c` was changed to `[cC]` to replicate /i flag
	*/
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	/**
	* `a-z` was added to replicate /i flag
	*/
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	/**
	* Constructed a valid Unicode RegExp
	*
	* Lazily instantiate since this type of regex isn't supported
	* in all envs (e.g. React Native).
	*
	* See:
	* https://github.com/colinhacks/zod/issues/2433
	* Fix in Zod:
	* https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
	*/
	emoji: () => {
		if (emojiRegex === void 0) emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
		return emojiRegex;
	},
	/**
	* Unused
	*/
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	/**
	* Unused
	*/
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	/**
	* Unused
	*/
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
	const res = { type: "string" };
	if (def.checks) for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			break;
		case "max":
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "email":
			switch (refs.emailStrategy) {
				case "format:email":
					addFormat(res, "email", check.message, refs);
					break;
				case "format:idn-email":
					addFormat(res, "idn-email", check.message, refs);
					break;
				case "pattern:zod":
					addPattern(res, zodPatterns.email, check.message, refs);
					break;
			}
			break;
		case "url":
			addFormat(res, "uri", check.message, refs);
			break;
		case "uuid":
			addFormat(res, "uuid", check.message, refs);
			break;
		case "regex":
			addPattern(res, check.regex, check.message, refs);
			break;
		case "cuid":
			addPattern(res, zodPatterns.cuid, check.message, refs);
			break;
		case "cuid2":
			addPattern(res, zodPatterns.cuid2, check.message, refs);
			break;
		case "startsWith":
			addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
			break;
		case "endsWith":
			addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
			break;
		case "datetime":
			addFormat(res, "date-time", check.message, refs);
			break;
		case "date":
			addFormat(res, "date", check.message, refs);
			break;
		case "time":
			addFormat(res, "time", check.message, refs);
			break;
		case "duration":
			addFormat(res, "duration", check.message, refs);
			break;
		case "length":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "includes":
			addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
			break;
		case "ip":
			if (check.version !== "v6") addFormat(res, "ipv4", check.message, refs);
			if (check.version !== "v4") addFormat(res, "ipv6", check.message, refs);
			break;
		case "base64url":
			addPattern(res, zodPatterns.base64url, check.message, refs);
			break;
		case "jwt":
			addPattern(res, zodPatterns.jwt, check.message, refs);
			break;
		case "cidr":
			if (check.version !== "v6") addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
			if (check.version !== "v4") addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
			break;
		case "emoji":
			addPattern(res, zodPatterns.emoji(), check.message, refs);
			break;
		case "ulid":
			addPattern(res, zodPatterns.ulid, check.message, refs);
			break;
		case "base64":
			switch (refs.base64Strategy) {
				case "format:binary":
					addFormat(res, "binary", check.message, refs);
					break;
				case "contentEncoding:base64":
					res.contentEncoding = "base64";
					break;
				case "pattern:zod":
					addPattern(res, zodPatterns.base64, check.message, refs);
					break;
			}
			break;
		case "nanoid": addPattern(res, zodPatterns.nanoid, check.message, refs);
		case "toLowerCase":
		case "toUpperCase":
		case "trim": break;
		default:
	}
	return res;
}
function escapeLiteralCheckValue(literal, refs) {
	return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
	let result = "";
	for (let i = 0; i < source.length; i++) {
		if (!ALPHA_NUMERIC.has(source[i])) result += "\\";
		result += source[i];
	}
	return result;
}
function addFormat(schema, value, message, refs) {
	var _a2;
	if (schema.format || ((_a2 = schema.anyOf) == null ? void 0 : _a2.some((x) => x.format))) {
		if (!schema.anyOf) schema.anyOf = [];
		if (schema.format) {
			schema.anyOf.push({ format: schema.format });
			delete schema.format;
		}
		schema.anyOf.push({
			format: value,
			...message && refs.errorMessages && { errorMessage: { format: message } }
		});
	} else schema.format = value;
}
function addPattern(schema, regex, message, refs) {
	var _a2;
	if (schema.pattern || ((_a2 = schema.allOf) == null ? void 0 : _a2.some((x) => x.pattern))) {
		if (!schema.allOf) schema.allOf = [];
		if (schema.pattern) {
			schema.allOf.push({ pattern: schema.pattern });
			delete schema.pattern;
		}
		schema.allOf.push({
			pattern: stringifyRegExpWithFlags(regex, refs),
			...message && refs.errorMessages && { errorMessage: { pattern: message } }
		});
	} else schema.pattern = stringifyRegExpWithFlags(regex, refs);
}
function stringifyRegExpWithFlags(regex, refs) {
	var _a2;
	if (!refs.applyRegexFlags || !regex.flags) return regex.source;
	const flags = {
		i: regex.flags.includes("i"),
		m: regex.flags.includes("m"),
		s: regex.flags.includes("s")
	};
	const source = flags.i ? regex.source.toLowerCase() : regex.source;
	let pattern = "";
	let isEscaped = false;
	let inCharGroup = false;
	let inCharRange = false;
	for (let i = 0; i < source.length; i++) {
		if (isEscaped) {
			pattern += source[i];
			isEscaped = false;
			continue;
		}
		if (flags.i) {
			if (inCharGroup) {
				if (source[i].match(/[a-z]/)) {
					if (inCharRange) {
						pattern += source[i];
						pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
						inCharRange = false;
					} else if (source[i + 1] === "-" && ((_a2 = source[i + 2]) == null ? void 0 : _a2.match(/[a-z]/))) {
						pattern += source[i];
						inCharRange = true;
					} else pattern += `${source[i]}${source[i].toUpperCase()}`;
					continue;
				}
			} else if (source[i].match(/[a-z]/)) {
				pattern += `[${source[i]}${source[i].toUpperCase()}]`;
				continue;
			}
		}
		if (flags.m) {
			if (source[i] === "^") {
				pattern += `(^|(?<=[\r
]))`;
				continue;
			} else if (source[i] === "$") {
				pattern += `($|(?=[\r
]))`;
				continue;
			}
		}
		if (flags.s && source[i] === ".") {
			pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
			continue;
		}
		pattern += source[i];
		if (source[i] === "\\") isEscaped = true;
		else if (inCharGroup && source[i] === "]") inCharGroup = false;
		else if (!inCharGroup && source[i] === "[") inCharGroup = true;
	}
	try {
		new RegExp(pattern);
	} catch (e) {
		console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
		return regex.source;
	}
	return pattern;
}
function parseRecordDef(def, refs) {
	var _a2, _b2, _c, _d, _e, _f;
	const schema = {
		type: "object",
		additionalProperties: (_a2 = parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalProperties"]
		})) != null ? _a2 : refs.allowedAdditionalProperties
	};
	if (((_b2 = def.keyType) == null ? void 0 : _b2._def.typeName) === ZodFirstPartyTypeKind.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
		const { type: _type, ...keyType } = parseStringDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	} else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) return {
		...schema,
		propertyNames: { enum: def.keyType._def.values }
	};
	else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
		const { type: _type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	}
	return schema;
}
function parseMapDef(def, refs) {
	if (refs.mapStrategy === "record") return parseRecordDef(def, refs);
	return {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [parseDef(def.keyType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"0"
				]
			}) || parseAnyDef(), parseDef(def.valueType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"1"
				]
			}) || parseAnyDef()],
			minItems: 2,
			maxItems: 2
		}
	};
}
function parseNativeEnumDef(def) {
	const object = def.values;
	const actualValues = Object.keys(def.values).filter((key) => {
		return typeof object[object[key]] !== "number";
	}).map((key) => object[key]);
	const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
	return {
		type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: actualValues
	};
}
function parseNeverDef() {
	return { not: parseAnyDef() };
}
function parseNullDef() {
	return { type: "null" };
}
var primitiveMappings = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function parseUnionDef(def, refs) {
	const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
	if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
		const types = options.reduce((types2, x) => {
			const type = primitiveMappings[x._def.typeName];
			return type && !types2.includes(type) ? [...types2, type] : types2;
		}, []);
		return { type: types.length > 1 ? types : types[0] };
	} else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
		const types = options.reduce((acc, x) => {
			const type = typeof x._def.value;
			switch (type) {
				case "string":
				case "number":
				case "boolean": return [...acc, type];
				case "bigint": return [...acc, "integer"];
				case "object": if (x._def.value === null) return [...acc, "null"];
				default: return acc;
			}
		}, []);
		if (types.length === options.length) {
			const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
			return {
				type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
				enum: options.reduce((acc, x) => {
					return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
				}, [])
			};
		}
	} else if (options.every((x) => x._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x2) => !acc.includes(x2))], [])
	};
	return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
	const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			`${i}`
		]
	})).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
	return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
	const base = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"0"
		]
	});
	return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
	const res = { type: "number" };
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "int":
			res.type = "integer";
			break;
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf":
			res.multipleOf = check.value;
			break;
	}
	return res;
}
function parseObjectDef(def, refs) {
	const result = {
		type: "object",
		properties: {}
	};
	const required = [];
	const shape = def.shape();
	for (const propName in shape) {
		let propDef = shape[propName];
		if (propDef === void 0 || propDef._def === void 0) continue;
		const propOptional = safeIsOptional(propDef);
		const parsedDef = parseDef(propDef._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"properties",
				propName
			],
			propertyPath: [
				...refs.currentPath,
				"properties",
				propName
			]
		});
		if (parsedDef === void 0) continue;
		result.properties[propName] = parsedDef;
		if (!propOptional) required.push(propName);
	}
	if (required.length) result.required = required;
	const additionalProperties = decideAdditionalProperties(def, refs);
	if (additionalProperties !== void 0) result.additionalProperties = additionalProperties;
	return result;
}
function decideAdditionalProperties(def, refs) {
	if (def.catchall._def.typeName !== "ZodNever") return parseDef(def.catchall._def, {
		...refs,
		currentPath: [...refs.currentPath, "additionalProperties"]
	});
	switch (def.unknownKeys) {
		case "passthrough": return refs.allowedAdditionalProperties;
		case "strict": return refs.rejectedAdditionalProperties;
		case "strip": return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
	}
}
function safeIsOptional(schema) {
	try {
		return schema.isOptional();
	} catch (e) {
		return true;
	}
}
var parseOptionalDef = (def, refs) => {
	var _a2;
	if (refs.currentPath.toString() === ((_a2 = refs.propertyPath) == null ? void 0 : _a2.toString())) return parseDef(def.innerType._def, refs);
	const innerSchema = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"1"
		]
	});
	return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
};
var parsePipelineDef = (def, refs) => {
	if (refs.pipeStrategy === "input") return parseDef(def.in._def, refs);
	else if (refs.pipeStrategy === "output") return parseDef(def.out._def, refs);
	const inputSchema = parseDef(def.in._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	});
	return { allOf: [inputSchema, parseDef(def.out._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			inputSchema ? "1" : "0"
		]
	})].filter((schema) => schema !== void 0) };
};
function parsePromiseDef(def, refs) {
	return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
	const schema = {
		type: "array",
		uniqueItems: true,
		items: parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "items"]
		})
	};
	if (def.minSize) schema.minItems = def.minSize.value;
	if (def.maxSize) schema.maxItems = def.maxSize.value;
	return schema;
}
function parseTupleDef(def, refs) {
	if (def.rest) return {
		type: "array",
		minItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
		additionalItems: parseDef(def.rest._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalItems"]
		})
	};
	else return {
		type: "array",
		minItems: def.items.length,
		maxItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
	};
}
function parseUndefinedDef() {
	return { not: parseAnyDef() };
}
function parseUnknownDef() {
	return parseAnyDef();
}
var parseReadonlyDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
var selectParser = (def, typeName, refs) => {
	switch (typeName) {
		case ZodFirstPartyTypeKind.ZodString: return parseStringDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNumber: return parseNumberDef(def);
		case ZodFirstPartyTypeKind.ZodObject: return parseObjectDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBigInt: return parseBigintDef(def);
		case ZodFirstPartyTypeKind.ZodBoolean: return parseBooleanDef();
		case ZodFirstPartyTypeKind.ZodDate: return parseDateDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUndefined: return parseUndefinedDef();
		case ZodFirstPartyTypeKind.ZodNull: return parseNullDef();
		case ZodFirstPartyTypeKind.ZodArray: return parseArrayDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUnion:
		case ZodFirstPartyTypeKind.ZodDiscriminatedUnion: return parseUnionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodIntersection: return parseIntersectionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodTuple: return parseTupleDef(def, refs);
		case ZodFirstPartyTypeKind.ZodRecord: return parseRecordDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLiteral: return parseLiteralDef(def);
		case ZodFirstPartyTypeKind.ZodEnum: return parseEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNativeEnum: return parseNativeEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNullable: return parseNullableDef(def, refs);
		case ZodFirstPartyTypeKind.ZodOptional: return parseOptionalDef(def, refs);
		case ZodFirstPartyTypeKind.ZodMap: return parseMapDef(def, refs);
		case ZodFirstPartyTypeKind.ZodSet: return parseSetDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLazy: return () => def.getter()._def;
		case ZodFirstPartyTypeKind.ZodPromise: return parsePromiseDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNaN:
		case ZodFirstPartyTypeKind.ZodNever: return parseNeverDef();
		case ZodFirstPartyTypeKind.ZodEffects: return parseEffectsDef(def, refs);
		case ZodFirstPartyTypeKind.ZodAny: return parseAnyDef();
		case ZodFirstPartyTypeKind.ZodUnknown: return parseUnknownDef();
		case ZodFirstPartyTypeKind.ZodDefault: return parseDefaultDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBranded: return parseBrandedDef(def, refs);
		case ZodFirstPartyTypeKind.ZodReadonly: return parseReadonlyDef(def, refs);
		case ZodFirstPartyTypeKind.ZodCatch: return parseCatchDef(def, refs);
		case ZodFirstPartyTypeKind.ZodPipeline: return parsePipelineDef(def, refs);
		case ZodFirstPartyTypeKind.ZodFunction:
		case ZodFirstPartyTypeKind.ZodVoid:
		case ZodFirstPartyTypeKind.ZodSymbol: return;
		default: return /* @__PURE__ */ ((_) => void 0)(typeName);
	}
};
var getRelativePath = (pathA, pathB) => {
	let i = 0;
	for (; i < pathA.length && i < pathB.length; i++) if (pathA[i] !== pathB[i]) break;
	return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseDef(def, refs, forceResolution = false) {
	var _a2;
	const seenItem = refs.seen.get(def);
	if (refs.override) {
		const overrideResult = (_a2 = refs.override) == null ? void 0 : _a2.call(refs, def, refs, seenItem, forceResolution);
		if (overrideResult !== ignoreOverride) return overrideResult;
	}
	if (seenItem && !forceResolution) {
		const seenSchema = get$ref(seenItem, refs);
		if (seenSchema !== void 0) return seenSchema;
	}
	const newItem = {
		def,
		path: refs.currentPath,
		jsonSchema: void 0
	};
	refs.seen.set(def, newItem);
	const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
	const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
	if (jsonSchema2) addMeta(def, refs, jsonSchema2);
	if (refs.postProcess) {
		const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
		newItem.jsonSchema = jsonSchema2;
		return postProcessResult;
	}
	newItem.jsonSchema = jsonSchema2;
	return jsonSchema2;
}
var get$ref = (item, refs) => {
	switch (refs.$refStrategy) {
		case "root": return { $ref: item.path.join("/") };
		case "relative": return { $ref: getRelativePath(refs.currentPath, item.path) };
		case "none":
		case "seen":
			if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
				console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
				return parseAnyDef();
			}
			return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
	}
};
var addMeta = (def, refs, jsonSchema2) => {
	if (def.description) jsonSchema2.description = def.description;
	return jsonSchema2;
};
var getRefs = (options) => {
	const _options = getDefaultOptions(options);
	const currentPath = _options.name !== void 0 ? [
		..._options.basePath,
		_options.definitionPath,
		_options.name
	] : _options.basePath;
	return {
		..._options,
		currentPath,
		propertyPath: void 0,
		seen: new Map(Object.entries(_options.definitions).map(([name2, def]) => [def._def, {
			def: def._def,
			path: [
				..._options.basePath,
				_options.definitionPath,
				name2
			],
			jsonSchema: void 0
		}]))
	};
};
var zod3ToJsonSchema = (schema, options) => {
	var _a2;
	const refs = getRefs(options);
	let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name3, schema2]) => {
		var _a3;
		return {
			...acc,
			[name3]: (_a3 = parseDef(schema2._def, {
				...refs,
				currentPath: [
					...refs.basePath,
					refs.definitionPath,
					name3
				]
			}, true)) != null ? _a3 : parseAnyDef()
		};
	}, {}) : void 0;
	const name2 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
	const main = (_a2 = parseDef(schema._def, name2 === void 0 ? refs : {
		...refs,
		currentPath: [
			...refs.basePath,
			refs.definitionPath,
			name2
		]
	}, false)) != null ? _a2 : parseAnyDef();
	const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
	if (title !== void 0) main.title = title;
	const combined = name2 === void 0 ? definitions ? {
		...main,
		[refs.definitionPath]: definitions
	} : main : {
		$ref: [
			...refs.$refStrategy === "relative" ? [] : refs.basePath,
			refs.definitionPath,
			name2
		].join("/"),
		[refs.definitionPath]: {
			...definitions,
			[name2]: main
		}
	};
	combined.$schema = "http://json-schema.org/draft-07/schema#";
	return combined;
};
var schemaSymbol = /* @__PURE__ */ Symbol.for("vercel.ai.schema");
function jsonSchema(jsonSchema2, { validate } = {}) {
	return {
		[schemaSymbol]: true,
		_type: void 0,
		get jsonSchema() {
			if (typeof jsonSchema2 === "function") jsonSchema2 = jsonSchema2();
			return jsonSchema2;
		},
		validate
	};
}
function isSchema(value) {
	return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
	return schema == null ? jsonSchema({
		type: "object",
		properties: {},
		additionalProperties: false
	}) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(standardSchema2["~standard"].jsonSchema.input({ target: "draft-07" })), { validate: async (value) => {
		const result = await standardSchema2["~standard"].validate(value);
		return "value" in result ? {
			success: true,
			value: result.value
		} : {
			success: false,
			error: new TypeValidationError({
				value,
				cause: result.issues
			})
		};
	} });
}
function zod3Schema(zodSchema2, options) {
	var _a2;
	const useReferences = (_a2 = options == null ? void 0 : options.useReferences) != null ? _a2 : false;
	return jsonSchema(() => zod3ToJsonSchema(zodSchema2, { $refStrategy: useReferences ? "root" : "none" }), { validate: async (value) => {
		const result = await zodSchema2.safeParseAsync(value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function zod4Schema(zodSchema2, options) {
	var _a2;
	const useReferences = (_a2 = options == null ? void 0 : options.useReferences) != null ? _a2 : false;
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(toJSONSchema(zodSchema2, {
		target: "draft-7",
		io: "input",
		reused: useReferences ? "ref" : "inline"
	})), { validate: async (value) => {
		const result = await safeParseAsync(zodSchema2, value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function isZod4Schema(zodSchema2) {
	return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
	if (isZod4Schema(zodSchema2)) return zod4Schema(zodSchema2, options);
	else return zod3Schema(zodSchema2, options);
}
async function validateTypes({ value, schema, context }) {
	const result = await safeValidateTypes({
		value,
		schema,
		context
	});
	if (!result.success) throw TypeValidationError.wrap({
		value,
		cause: result.error,
		context
	});
	return result.value;
}
async function safeValidateTypes({ value, schema, context }) {
	const actualSchema = asSchema(schema);
	try {
		if (actualSchema.validate == null) return {
			success: true,
			value,
			rawValue: value
		};
		const result = await actualSchema.validate(value);
		if (result.success) return {
			success: true,
			value: result.value,
			rawValue: value
		};
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: result.error,
				context
			}),
			rawValue: value
		};
	} catch (error) {
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: error,
				context
			}),
			rawValue: value
		};
	}
}
async function parseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return value;
		return await validateTypes({
			value,
			schema
		});
	} catch (error) {
		if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) throw error;
		throw new JSONParseError({
			text,
			cause: error
		});
	}
}
async function safeParseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return {
			success: true,
			value,
			rawValue: value
		};
		return await safeValidateTypes({
			value,
			schema
		});
	} catch (error) {
		return {
			success: false,
			error: JSONParseError.isInstance(error) ? error : new JSONParseError({
				text,
				cause: error
			}),
			rawValue: void 0
		};
	}
}
function parseJsonEventStream({ stream, schema }) {
	return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new TransformStream({ async transform({ data }, controller) {
		if (data === "[DONE]") return;
		controller.enqueue(await safeParseJSON({
			text: data,
			schema
		}));
	} }));
}
async function parseProviderOptions({ provider, providerOptions, schema }) {
	if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) return;
	const parsedProviderOptions = await safeValidateTypes({
		value: providerOptions[provider],
		schema
	});
	if (!parsedProviderOptions.success) throw new InvalidArgumentError({
		argument: "providerOptions",
		message: `invalid ${provider} provider options`,
		cause: parsedProviderOptions.error
	});
	return parsedProviderOptions.value;
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({ url, headers, body, failedResponseHandler, successfulResponseHandler, abortSignal, fetch: fetch2 }) => await postToApi({
	url,
	headers: {
		"Content-Type": "application/json",
		...headers
	},
	body: {
		content: JSON.stringify(body),
		values: body
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch: fetch2
});
var postFormDataToApi = async ({ url, headers, formData, failedResponseHandler, successfulResponseHandler, abortSignal, fetch: fetch2 }) => await postToApi({
	url,
	headers,
	body: {
		content: formData,
		values: Object.fromEntries(formData.entries())
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch: fetch2
});
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch2() }) => {
	try {
		const response = await fetch2(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION$1}`, getRuntimeEnvironmentUserAgent()),
			body: body.content,
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: body.values
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: body.values
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: body.values
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: body.values
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: body.values
		});
	}
};
function resolveFullMediaType({ part }) {
	if (isFullMediaType(part.mediaType)) return part.mediaType;
	if (part.data.type === "data") {
		const detected = detectMediaType({
			data: part.data.data,
			topLevelType: getTopLevelMediaType(part.mediaType)
		});
		if (detected) return detected;
		throw new UnsupportedFunctionalityError({ functionality: `file of media type "${part.mediaType}" must specify subtype since it could not be auto-detected` });
	}
	throw new UnsupportedFunctionalityError({ functionality: `file of media type "${part.mediaType}" must specify subtype since it is not passed as inline bytes` });
}
var textDecoder = new TextDecoder();
async function readResponseBodyAsText({ response, url }) {
	return textDecoder.decode(await readResponseWithSizeLimit({
		response,
		url
	}));
}
var createJsonErrorResponseHandler = ({ errorSchema, errorToMessage, isRetryable }) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await readResponseBodyAsText({
		response,
		url
	});
	const responseHeaders = extractResponseHeaders(response);
	if (responseBody.trim() === "") return {
		responseHeaders,
		value: new APICallError({
			message: response.statusText,
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody,
			isRetryable: isRetryable == null ? void 0 : isRetryable(response)
		})
	};
	try {
		const parsedError = await parseJSON({
			text: responseBody,
			schema: errorSchema
		});
		return {
			responseHeaders,
			value: new APICallError({
				message: errorToMessage(parsedError),
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				data: parsedError,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
			})
		};
	} catch (e) {
		return {
			responseHeaders,
			value: new APICallError({
				message: response.statusText,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response)
			})
		};
	}
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (response.body == null) throw new EmptyResponseBodyError({});
	return {
		responseHeaders,
		value: parseJsonEventStream({
			stream: response.body,
			schema: chunkSchema
		})
	};
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await readResponseBodyAsText({
		response,
		url
	});
	const parsedResult = await safeParseJSON({
		text: responseBody,
		schema: responseSchema
	});
	const responseHeaders = extractResponseHeaders(response);
	if (!parsedResult.success) throw new APICallError({
		message: "Invalid JSON response",
		cause: parsedResult.error,
		statusCode: response.status,
		responseHeaders,
		responseBody,
		url,
		requestBodyValues
	});
	return {
		responseHeaders,
		value: parsedResult.value,
		rawValue: parsedResult.rawValue
	};
};
function isJSONSerializable(value) {
	if (value === null || value === void 0) return true;
	const type = typeof value;
	if (type === "string" || type === "number" || type === "boolean") return true;
	if (type === "function" || type === "symbol" || type === "bigint") return false;
	if (Array.isArray(value)) return value.every(isJSONSerializable);
	if (Object.getPrototypeOf(value) === Object.prototype) return Object.values(value).every(isJSONSerializable);
	return false;
}
function serializeModelOptions(options) {
	const serializableConfig = {};
	for (const [key, value] of Object.entries(options.config)) if (key === "headers") {
		const resolvedHeaders = resolveSync(value);
		if (isJSONSerializable(resolvedHeaders)) serializableConfig[key] = resolvedHeaders;
	} else if (isJSONSerializable(value)) serializableConfig[key] = value;
	return {
		modelId: options.modelId,
		config: serializableConfig
	};
}
function resolveSync(value) {
	let next = value;
	if (typeof value === "function") next = value();
	if (next instanceof Promise) throw new Error("Promise returned from resolveSync");
	return next;
}
var StreamingToolCallTracker = class {
	constructor(controller, options = {}) {
		this.toolCalls = [];
		var _a2, _b2;
		this.controller = controller;
		this._generateId = (_a2 = options.generateId) != null ? _a2 : generateId;
		this.typeValidation = (_b2 = options.typeValidation) != null ? _b2 : "none";
		this.extractMetadata = options.extractMetadata;
		this.buildToolCallProviderMetadata = options.buildToolCallProviderMetadata;
	}
	/**
	* Process a tool call delta from a streaming response chunk.
	* Emits tool-input-start, tool-input-delta, tool-input-end, and tool-call
	* events as appropriate.
	*/
	processDelta(toolCallDelta) {
		var _a2;
		const index = (_a2 = toolCallDelta.index) != null ? _a2 : this.toolCalls.length;
		if (this.toolCalls[index] == null) this.processNewToolCall(index, toolCallDelta);
		else this.processExistingToolCall(index, toolCallDelta);
	}
	/**
	* Finalize any unfinished tool calls. Should be called during the stream's
	* flush handler to ensure all tool calls are properly completed.
	*/
	flush() {
		for (const toolCall of this.toolCalls) if (!toolCall.hasFinished) this.finishToolCall(toolCall);
	}
	processNewToolCall(index, toolCallDelta) {
		var _a2, _b2, _c;
		if (this.typeValidation === "required") {
			if (toolCallDelta.type !== "function") throw new InvalidResponseDataError({
				data: toolCallDelta,
				message: `Expected 'function' type.`
			});
		} else if (this.typeValidation === "if-present") {
			if (toolCallDelta.type != null && toolCallDelta.type !== "function") throw new InvalidResponseDataError({
				data: toolCallDelta,
				message: `Expected 'function' type.`
			});
		}
		if (toolCallDelta.id == null) throw new InvalidResponseDataError({
			data: toolCallDelta,
			message: `Expected 'id' to be a string.`
		});
		if (((_a2 = toolCallDelta.function) == null ? void 0 : _a2.name) == null) throw new InvalidResponseDataError({
			data: toolCallDelta,
			message: `Expected 'function.name' to be a string.`
		});
		this.controller.enqueue({
			type: "tool-input-start",
			id: toolCallDelta.id,
			toolName: toolCallDelta.function.name
		});
		const metadata = (_b2 = this.extractMetadata) == null ? void 0 : _b2.call(this, toolCallDelta);
		this.toolCalls[index] = {
			id: toolCallDelta.id,
			type: "function",
			function: {
				name: toolCallDelta.function.name,
				arguments: (_c = toolCallDelta.function.arguments) != null ? _c : ""
			},
			hasFinished: false,
			metadata
		};
		const toolCall = this.toolCalls[index];
		if (toolCall.function.arguments.length > 0) this.controller.enqueue({
			type: "tool-input-delta",
			id: toolCall.id,
			delta: toolCall.function.arguments
		});
	}
	processExistingToolCall(index, toolCallDelta) {
		var _a2;
		const toolCall = this.toolCalls[index];
		if (toolCall.hasFinished) return;
		if (((_a2 = toolCallDelta.function) == null ? void 0 : _a2.arguments) != null) {
			toolCall.function.arguments += toolCallDelta.function.arguments;
			this.controller.enqueue({
				type: "tool-input-delta",
				id: toolCall.id,
				delta: toolCallDelta.function.arguments
			});
		}
	}
	finishToolCall(toolCall) {
		var _a2, _b2;
		this.controller.enqueue({
			type: "tool-input-end",
			id: toolCall.id
		});
		const providerMetadata = (_a2 = this.buildToolCallProviderMetadata) == null ? void 0 : _a2.call(this, toolCall.metadata);
		this.controller.enqueue({
			type: "tool-call",
			toolCallId: (_b2 = toolCall.id) != null ? _b2 : this._generateId(),
			toolName: toolCall.function.name,
			input: toolCall.function.arguments,
			...providerMetadata ? { providerMetadata } : {}
		});
		toolCall.hasFinished = true;
	}
};
new TextDecoder();
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}
//#endregion
//#region node_modules/@ai-sdk/openai-compatible/dist/index.js
function toCamelCase(str) {
	return str.replace(/[_-]([a-z])/g, (g) => g[1].toUpperCase());
}
function resolveProviderOptionsKey(rawName, providerOptions) {
	const camelName = toCamelCase(rawName);
	if (camelName !== rawName && (providerOptions == null ? void 0 : providerOptions[camelName]) != null) return camelName;
	return rawName;
}
function warnIfDeprecatedProviderOptionsKey({ rawName, providerOptions, warnings }) {
	const camelName = toCamelCase(rawName);
	if (camelName !== rawName && (providerOptions == null ? void 0 : providerOptions[rawName]) != null) warnings.push({
		type: "deprecated",
		setting: `providerOptions key '${rawName}'`,
		message: `Use '${camelName}' instead.`
	});
}
var defaultOpenAICompatibleErrorStructure = {
	errorSchema: object({ error: object({
		message: string(),
		type: string().nullish(),
		param: any().nullish(),
		code: union([string(), number()]).nullish()
	}) }),
	errorToMessage: (data) => data.error.message
};
function convertOpenAICompatibleChatUsage(usage) {
	var _a, _b, _c, _d, _e, _f;
	if (usage == null) return {
		inputTokens: {
			total: void 0,
			noCache: void 0,
			cacheRead: void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: void 0,
			text: void 0,
			reasoning: void 0
		},
		raw: void 0
	};
	const promptTokens = (_a = usage.prompt_tokens) != null ? _a : 0;
	const completionTokens = (_b = usage.completion_tokens) != null ? _b : 0;
	const cacheReadTokens = (_d = (_c = usage.prompt_tokens_details) == null ? void 0 : _c.cached_tokens) != null ? _d : 0;
	const reasoningTokens = (_f = (_e = usage.completion_tokens_details) == null ? void 0 : _e.reasoning_tokens) != null ? _f : 0;
	return {
		inputTokens: {
			total: promptTokens,
			noCache: promptTokens - cacheReadTokens,
			cacheRead: cacheReadTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: completionTokens,
			text: completionTokens - reasoningTokens,
			reasoning: reasoningTokens
		},
		raw: usage
	};
}
function getOpenAIMetadata(message) {
	var _a, _b;
	return (_b = (_a = message == null ? void 0 : message.providerOptions) == null ? void 0 : _a.openaiCompatible) != null ? _b : {};
}
function getAudioFormat(mediaType) {
	switch (mediaType) {
		case "audio/wav": return "wav";
		case "audio/mp3":
		case "audio/mpeg": return "mp3";
		default: return null;
	}
}
function convertToOpenAICompatibleChatMessages(prompt) {
	var _a, _b, _c;
	const messages = [];
	for (const { role, content, ...message } of prompt) {
		const metadata = getOpenAIMetadata({ ...message });
		switch (role) {
			case "system":
				messages.push({
					role: "system",
					content,
					...metadata
				});
				break;
			case "user":
				if (content.length === 1 && content[0].type === "text") {
					messages.push({
						role: "user",
						content: content[0].text,
						...getOpenAIMetadata(content[0])
					});
					break;
				}
				messages.push({
					role: "user",
					content: content.map((part) => {
						var _a2;
						const partMetadata = getOpenAIMetadata(part);
						switch (part.type) {
							case "text": return {
								type: "text",
								text: part.text,
								...partMetadata
							};
							case "file": switch (part.data.type) {
								case "reference": throw new UnsupportedFunctionalityError({ functionality: "file parts with provider references" });
								case "text": throw new UnsupportedFunctionalityError({ functionality: "text file parts" });
								case "url":
								case "data": {
									const topLevel = getTopLevelMediaType(part.mediaType);
									if (topLevel === "image") return {
										type: "image_url",
										image_url: { url: part.data.type === "url" ? part.data.url.toString() : `data:${resolveFullMediaType({ part })};base64,${convertToBase64(part.data.data)}` },
										...partMetadata
									};
									if (topLevel === "audio") {
										if (part.data.type === "url") throw new UnsupportedFunctionalityError({ functionality: "audio file parts with URLs" });
										const fullMediaType = resolveFullMediaType({ part });
										const format = getAudioFormat(fullMediaType);
										if (format === null) throw new UnsupportedFunctionalityError({ functionality: `audio media type ${fullMediaType}` });
										return {
											type: "input_audio",
											input_audio: {
												data: convertToBase64(part.data.data),
												format
											},
											...partMetadata
										};
									}
									if (topLevel === "application") {
										if (part.data.type === "url") throw new UnsupportedFunctionalityError({ functionality: "PDF file parts with URLs" });
										const fullMediaType = resolveFullMediaType({ part });
										if (fullMediaType !== "application/pdf") throw new UnsupportedFunctionalityError({ functionality: `file part media type ${fullMediaType}` });
										return {
											type: "file",
											file: {
												filename: (_a2 = part.filename) != null ? _a2 : "document.pdf",
												file_data: `data:application/pdf;base64,${convertToBase64(part.data.data)}`
											},
											...partMetadata
										};
									}
									if (topLevel === "text") return {
										type: "text",
										text: part.data.type === "url" ? part.data.url.toString() : typeof part.data.data === "string" ? new TextDecoder().decode(convertBase64ToUint8Array(part.data.data)) : new TextDecoder().decode(part.data.data),
										...partMetadata
									};
									throw new UnsupportedFunctionalityError({ functionality: `file part media type ${part.mediaType}` });
								}
							}
						}
					}),
					...metadata
				});
				break;
			case "assistant": {
				let text = "";
				let reasoning = "";
				const toolCalls = [];
				for (const part of content) {
					const partMetadata = getOpenAIMetadata(part);
					switch (part.type) {
						case "text":
							text += part.text;
							break;
						case "reasoning":
							reasoning += part.text;
							break;
						case "tool-call": {
							const thoughtSignature = (_b = (_a = part.providerOptions) == null ? void 0 : _a.google) == null ? void 0 : _b.thoughtSignature;
							toolCalls.push({
								id: part.toolCallId,
								type: "function",
								function: {
									name: part.toolName,
									arguments: JSON.stringify(part.input)
								},
								...partMetadata,
								...thoughtSignature ? { extra_content: { google: { thought_signature: String(thoughtSignature) } } } : {}
							});
							break;
						}
					}
				}
				messages.push({
					role: "assistant",
					content: toolCalls.length > 0 ? text || null : text,
					...reasoning.length > 0 ? { reasoning_content: reasoning } : {},
					tool_calls: toolCalls.length > 0 ? toolCalls : void 0,
					...metadata
				});
				break;
			}
			case "tool":
				for (const toolResponse of content) {
					if (toolResponse.type === "tool-approval-response") continue;
					const output = toolResponse.output;
					let contentValue;
					switch (output.type) {
						case "text":
						case "error-text":
							contentValue = output.value;
							break;
						case "execution-denied":
							contentValue = (_c = output.reason) != null ? _c : "Tool call execution denied.";
							break;
						case "content":
						case "json":
						case "error-json":
							contentValue = JSON.stringify(output.value);
							break;
					}
					const toolResponseMetadata = getOpenAIMetadata(toolResponse);
					messages.push({
						role: "tool",
						tool_call_id: toolResponse.toolCallId,
						content: contentValue,
						...toolResponseMetadata
					});
				}
				break;
			default: throw new Error(`Unsupported role: ${role}`);
		}
	}
	return messages;
}
function getResponseMetadata({ id, model, created }) {
	return {
		id: id != null ? id : void 0,
		modelId: model != null ? model : void 0,
		timestamp: created != null ? /* @__PURE__ */ new Date(created * 1e3) : void 0
	};
}
function mapOpenAICompatibleFinishReason(finishReason) {
	switch (finishReason) {
		case "stop": return "stop";
		case "length": return "length";
		case "content_filter": return "content-filter";
		case "function_call":
		case "tool_calls": return "tool-calls";
		default: return "other";
	}
}
var openaiCompatibleLanguageModelChatOptions = object({
	/**
	* A unique identifier representing your end-user, which can help the provider to
	* monitor and detect abuse.
	*/
	user: string().optional(),
	/**
	* Reasoning effort for reasoning models. Defaults to `medium`.
	*/
	reasoningEffort: string().optional(),
	/**
	* Controls the verbosity of the generated text. Defaults to `medium`.
	*/
	textVerbosity: string().optional(),
	/**
	* Whether to use strict JSON schema validation.
	* When true, the model uses constrained decoding to guarantee schema compliance.
	* Only used when the provider supports structured outputs and a schema is provided.
	*
	* @default true
	*/
	strictJsonSchema: boolean().optional()
});
function prepareTools({ tools, toolChoice }) {
	tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
	const toolWarnings = [];
	if (tools == null) return {
		tools: void 0,
		toolChoice: void 0,
		toolWarnings
	};
	const openaiCompatTools = [];
	for (const tool of tools) if (tool.type === "provider") toolWarnings.push({
		type: "unsupported",
		feature: `provider-defined tool ${tool.id}`
	});
	else openaiCompatTools.push({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema,
			...tool.strict != null ? { strict: tool.strict } : {}
		}
	});
	if (toolChoice == null) return {
		tools: openaiCompatTools,
		toolChoice: void 0,
		toolWarnings
	};
	const type = toolChoice.type;
	switch (type) {
		case "auto":
		case "none":
		case "required": return {
			tools: openaiCompatTools,
			toolChoice: type,
			toolWarnings
		};
		case "tool": return {
			tools: openaiCompatTools,
			toolChoice: {
				type: "function",
				function: { name: toolChoice.toolName }
			},
			toolWarnings
		};
		default: throw new UnsupportedFunctionalityError({ functionality: `tool choice type: ${type}` });
	}
}
var OpenAICompatibleChatLanguageModel = class _OpenAICompatibleChatLanguageModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		var _a, _b;
		this.modelId = modelId;
		this.config = config;
		const errorStructure = (_a = config.errorStructure) != null ? _a : defaultOpenAICompatibleErrorStructure;
		this.chunkSchema = createOpenAICompatibleChatChunkSchema(errorStructure.errorSchema);
		this.failedResponseHandler = createJsonErrorResponseHandler(errorStructure);
		this.supportsStructuredOutputs = (_b = config.supportsStructuredOutputs) != null ? _b : false;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _OpenAICompatibleChatLanguageModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	get providerOptionsName() {
		return this.config.provider.split(".")[0].trim();
	}
	get supportedUrls() {
		var _a, _b, _c;
		return (_c = (_b = (_a = this.config).supportedUrls) == null ? void 0 : _b.call(_a)) != null ? _c : {};
	}
	transformRequestBody(args) {
		var _a, _b, _c;
		return (_c = (_b = (_a = this.config).transformRequestBody) == null ? void 0 : _b.call(_a, args)) != null ? _c : args;
	}
	convertUsage(usage) {
		var _a, _b, _c;
		return (_c = (_b = (_a = this.config).convertUsage) == null ? void 0 : _b.call(_a, usage)) != null ? _c : convertOpenAICompatibleChatUsage(usage);
	}
	async getArgs({ prompt, maxOutputTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, reasoning, providerOptions, stopSequences, responseFormat, seed, toolChoice, tools }) {
		var _a, _b, _c, _d, _e, _f;
		const warnings = [];
		const deprecatedOptions = await parseProviderOptions({
			provider: "openai-compatible",
			providerOptions,
			schema: openaiCompatibleLanguageModelChatOptions
		});
		if (deprecatedOptions != null) warnings.push({
			type: "deprecated",
			setting: "providerOptions key 'openai-compatible'",
			message: "Use 'openaiCompatible' instead."
		});
		warnIfDeprecatedProviderOptionsKey({
			rawName: this.providerOptionsName,
			providerOptions,
			warnings
		});
		const compatibleOptions = Object.assign(deprecatedOptions != null ? deprecatedOptions : {}, (_a = await parseProviderOptions({
			provider: "openaiCompatible",
			providerOptions,
			schema: openaiCompatibleLanguageModelChatOptions
		})) != null ? _a : {}, (_b = await parseProviderOptions({
			provider: this.providerOptionsName,
			providerOptions,
			schema: openaiCompatibleLanguageModelChatOptions
		})) != null ? _b : {}, (_c = await parseProviderOptions({
			provider: toCamelCase(this.providerOptionsName),
			providerOptions,
			schema: openaiCompatibleLanguageModelChatOptions
		})) != null ? _c : {});
		const strictJsonSchema = (_d = compatibleOptions == null ? void 0 : compatibleOptions.strictJsonSchema) != null ? _d : true;
		if (topK != null) warnings.push({
			type: "unsupported",
			feature: "topK"
		});
		if ((responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && !this.supportsStructuredOutputs) warnings.push({
			type: "unsupported",
			feature: "responseFormat",
			details: "JSON response format schema is only supported with structuredOutputs"
		});
		const { tools: openaiTools, toolChoice: openaiToolChoice, toolWarnings } = prepareTools({
			tools,
			toolChoice
		});
		return {
			metadataKey: resolveProviderOptionsKey(this.providerOptionsName, providerOptions),
			args: {
				model: this.modelId,
				user: compatibleOptions.user,
				max_tokens: maxOutputTokens,
				temperature,
				top_p: topP,
				frequency_penalty: frequencyPenalty,
				presence_penalty: presencePenalty,
				response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? this.supportsStructuredOutputs === true && responseFormat.schema != null ? {
					type: "json_schema",
					json_schema: {
						schema: responseFormat.schema,
						strict: strictJsonSchema,
						name: (_e = responseFormat.name) != null ? _e : "response",
						description: responseFormat.description
					}
				} : { type: "json_object" } : void 0,
				stop: stopSequences,
				seed,
				...Object.fromEntries(Object.entries({
					...providerOptions == null ? void 0 : providerOptions[this.providerOptionsName],
					...providerOptions == null ? void 0 : providerOptions[toCamelCase(this.providerOptionsName)]
				}).filter(([key]) => !Object.keys(openaiCompatibleLanguageModelChatOptions.shape).includes(key))),
				reasoning_effort: (_f = compatibleOptions.reasoningEffort) != null ? _f : isCustomReasoning(reasoning) && reasoning !== "none" ? reasoning : void 0,
				verbosity: compatibleOptions.textVerbosity,
				messages: convertToOpenAICompatibleChatMessages(prompt),
				tools: openaiTools,
				tool_choice: openaiToolChoice
			},
			warnings: [...warnings, ...toolWarnings]
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
		const { args, warnings, metadataKey } = await this.getArgs({ ...options });
		const transformedBody = this.transformRequestBody(args);
		const body = JSON.stringify(transformedBody);
		const { responseHeaders, value: responseBody, rawValue: rawResponse } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_b = (_a = this.config).headers) == null ? void 0 : _b.call(_a), options.headers),
			body: transformedBody,
			failedResponseHandler: this.failedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(OpenAICompatibleChatResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const choice = responseBody.choices[0];
		const content = [];
		const text = choice.message.content;
		if (text != null && text.length > 0) content.push({
			type: "text",
			text
		});
		const reasoning = (_c = choice.message.reasoning_content) != null ? _c : choice.message.reasoning;
		if (reasoning != null && reasoning.length > 0) content.push({
			type: "reasoning",
			text: reasoning
		});
		if (choice.message.tool_calls != null) for (const toolCall of choice.message.tool_calls) {
			const thoughtSignature = (_e = (_d = toolCall.extra_content) == null ? void 0 : _d.google) == null ? void 0 : _e.thought_signature;
			content.push({
				type: "tool-call",
				toolCallId: (_f = toolCall.id) != null ? _f : generateId(),
				toolName: toolCall.function.name,
				input: toolCall.function.arguments,
				...thoughtSignature ? { providerMetadata: { [metadataKey]: { thoughtSignature } } } : {}
			});
		}
		const providerMetadata = {
			[metadataKey]: {},
			...await ((_h = (_g = this.config.metadataExtractor) == null ? void 0 : _g.extractMetadata) == null ? void 0 : _h.call(_g, { parsedBody: rawResponse }))
		};
		const completionTokenDetails = (_i = responseBody.usage) == null ? void 0 : _i.completion_tokens_details;
		if ((completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens) != null) providerMetadata[metadataKey].acceptedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens;
		if ((completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens) != null) providerMetadata[metadataKey].rejectedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens;
		return {
			content,
			finishReason: {
				unified: mapOpenAICompatibleFinishReason(choice.finish_reason),
				raw: (_j = choice.finish_reason) != null ? _j : void 0
			},
			usage: this.convertUsage(responseBody.usage),
			providerMetadata,
			request: { body },
			response: {
				...getResponseMetadata(responseBody),
				headers: responseHeaders,
				body: rawResponse
			},
			warnings
		};
	}
	async doStream(options) {
		var _a, _b, _c;
		const { args, warnings, metadataKey } = await this.getArgs({ ...options });
		const body = this.transformRequestBody({
			...args,
			stream: true,
			stream_options: this.config.includeUsage ? { include_usage: true } : void 0
		});
		const metadataExtractor = (_a = this.config.metadataExtractor) == null ? void 0 : _a.createStreamExtractor();
		const { responseHeaders, value: response } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_c = (_b = this.config).headers) == null ? void 0 : _c.call(_b), options.headers),
			body,
			failedResponseHandler: this.failedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(this.chunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const providerOptionsName = metadataKey;
		let toolCallTracker;
		const pendingToolCalls = /* @__PURE__ */ new Map();
		const forwardedToolCallIndices = /* @__PURE__ */ new Set();
		const processToolCallDelta = (toolCallDelta) => {
			var _a2, _b2, _c2, _d, _e;
			const index = toolCallDelta.index;
			if (index == null || forwardedToolCallIndices.has(index)) {
				toolCallTracker.processDelta(toolCallDelta);
				return;
			}
			let pending = pendingToolCalls.get(index);
			if (pending == null) {
				pending = {
					id: (_a2 = toolCallDelta.id) != null ? _a2 : null,
					bufferedArguments: "",
					extraContent: (_b2 = toolCallDelta.extra_content) != null ? _b2 : null
				};
				pendingToolCalls.set(index, pending);
			} else {
				if (pending.id == null && toolCallDelta.id != null) pending.id = toolCallDelta.id;
				if (pending.extraContent == null && toolCallDelta.extra_content != null) pending.extraContent = toolCallDelta.extra_content;
			}
			const argumentsDelta = (_c2 = toolCallDelta.function) == null ? void 0 : _c2.arguments;
			if (argumentsDelta != null) pending.bufferedArguments += argumentsDelta;
			const name = (_d = toolCallDelta.function) == null ? void 0 : _d.name;
			if (name != null) {
				const forwardDelta = {
					index,
					id: pending.id,
					function: {
						name,
						arguments: pending.bufferedArguments
					},
					extra_content: (_e = pending.extraContent) != null ? _e : void 0
				};
				toolCallTracker.processDelta(forwardDelta);
				pendingToolCalls.delete(index);
				forwardedToolCallIndices.add(index);
			}
		};
		let finishReason = {
			unified: "other",
			raw: void 0
		};
		let usage = void 0;
		let isFirstChunk = true;
		let isActiveReasoning = false;
		let isActiveText = false;
		const convertUsage = (usage2) => this.convertUsage(usage2);
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					toolCallTracker = new StreamingToolCallTracker(controller, {
						generateId,
						extractMetadata: (delta) => {
							var _a2, _b2;
							const thoughtSignature = (_b2 = (_a2 = delta.extra_content) == null ? void 0 : _a2.google) == null ? void 0 : _b2.thought_signature;
							return thoughtSignature ? { [providerOptionsName]: { thoughtSignature } } : void 0;
						},
						buildToolCallProviderMetadata: (metadata) => metadata
					});
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a2, _b2;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					metadataExtractor?.processChunk(chunk.rawValue);
					if ("error" in chunk.value) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: chunk.value.error.message
						});
						return;
					}
					const value = chunk.value;
					if (isFirstChunk) {
						isFirstChunk = false;
						controller.enqueue({
							type: "response-metadata",
							...getResponseMetadata(value)
						});
					}
					if (value.usage != null) usage = value.usage;
					const choice = value.choices[0];
					if ((choice == null ? void 0 : choice.finish_reason) != null) finishReason = {
						unified: mapOpenAICompatibleFinishReason(choice.finish_reason),
						raw: (_a2 = choice.finish_reason) != null ? _a2 : void 0
					};
					if ((choice == null ? void 0 : choice.delta) == null) return;
					const delta = choice.delta;
					const reasoningContent = (_b2 = delta.reasoning_content) != null ? _b2 : delta.reasoning;
					if (reasoningContent) {
						if (!isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-start",
								id: "reasoning-0"
							});
							isActiveReasoning = true;
						}
						controller.enqueue({
							type: "reasoning-delta",
							id: "reasoning-0",
							delta: reasoningContent
						});
					}
					if (delta.content) {
						if (isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-end",
								id: "reasoning-0"
							});
							isActiveReasoning = false;
						}
						if (!isActiveText) {
							controller.enqueue({
								type: "text-start",
								id: "txt-0"
							});
							isActiveText = true;
						}
						controller.enqueue({
							type: "text-delta",
							id: "txt-0",
							delta: delta.content
						});
					}
					if (delta.tool_calls != null) {
						if (isActiveReasoning) {
							controller.enqueue({
								type: "reasoning-end",
								id: "reasoning-0"
							});
							isActiveReasoning = false;
						}
						for (const toolCallDelta of delta.tool_calls) processToolCallDelta(toolCallDelta);
					}
				},
				flush(controller) {
					var _a2, _b2, _c2, _d;
					if (isActiveReasoning) controller.enqueue({
						type: "reasoning-end",
						id: "reasoning-0"
					});
					if (isActiveText) controller.enqueue({
						type: "text-end",
						id: "txt-0"
					});
					for (const [index, pending] of pendingToolCalls) toolCallTracker.processDelta({
						index,
						id: pending.id,
						function: { arguments: pending.bufferedArguments }
					});
					pendingToolCalls.clear();
					toolCallTracker.flush();
					const providerMetadata = {
						[providerOptionsName]: {},
						...metadataExtractor == null ? void 0 : metadataExtractor.buildMetadata()
					};
					if (((_a2 = usage == null ? void 0 : usage.completion_tokens_details) == null ? void 0 : _a2.accepted_prediction_tokens) != null) providerMetadata[providerOptionsName].acceptedPredictionTokens = (_b2 = usage == null ? void 0 : usage.completion_tokens_details) == null ? void 0 : _b2.accepted_prediction_tokens;
					if (((_c2 = usage == null ? void 0 : usage.completion_tokens_details) == null ? void 0 : _c2.rejected_prediction_tokens) != null) providerMetadata[providerOptionsName].rejectedPredictionTokens = (_d = usage == null ? void 0 : usage.completion_tokens_details) == null ? void 0 : _d.rejected_prediction_tokens;
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: convertUsage(usage),
						providerMetadata
					});
				}
			})),
			request: { body },
			response: { headers: responseHeaders }
		};
	}
};
var openaiCompatibleTokenUsageSchema = looseObject({
	prompt_tokens: number().nullish(),
	completion_tokens: number().nullish(),
	total_tokens: number().nullish(),
	prompt_tokens_details: object({ cached_tokens: number().nullish() }).nullish(),
	completion_tokens_details: object({
		reasoning_tokens: number().nullish(),
		accepted_prediction_tokens: number().nullish(),
		rejected_prediction_tokens: number().nullish()
	}).nullish()
}).nullish();
var OpenAICompatibleChatResponseSchema = looseObject({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		message: object({
			role: literal("assistant").nullish(),
			content: string().nullish(),
			reasoning_content: string().nullish(),
			reasoning: string().nullish(),
			tool_calls: array(object({
				id: string().nullish(),
				function: object({
					name: string(),
					arguments: string()
				}),
				extra_content: object({ google: object({ thought_signature: string().nullish() }).nullish() }).nullish()
			})).nullish()
		}),
		finish_reason: string().nullish()
	})),
	usage: openaiCompatibleTokenUsageSchema
});
var chunkBaseSchema = looseObject({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		delta: object({
			role: _enum(["assistant", ""]).nullish(),
			content: string().nullish(),
			reasoning_content: string().nullish(),
			reasoning: string().nullish(),
			tool_calls: array(object({
				index: number().nullish(),
				id: string().nullish(),
				function: object({
					name: string().nullish(),
					arguments: string().nullish()
				}),
				extra_content: object({ google: object({ thought_signature: string().nullish() }).nullish() }).nullish()
			})).nullish()
		}).nullish(),
		finish_reason: string().nullish()
	})),
	usage: openaiCompatibleTokenUsageSchema
});
var createOpenAICompatibleChatChunkSchema = (errorSchema) => union([chunkBaseSchema, errorSchema]);
function convertOpenAICompatibleCompletionUsage(usage) {
	var _a, _b;
	if (usage == null) return {
		inputTokens: {
			total: void 0,
			noCache: void 0,
			cacheRead: void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: void 0,
			text: void 0,
			reasoning: void 0
		},
		raw: void 0
	};
	const promptTokens = (_a = usage.prompt_tokens) != null ? _a : 0;
	const completionTokens = (_b = usage.completion_tokens) != null ? _b : 0;
	return {
		inputTokens: {
			total: promptTokens,
			noCache: promptTokens,
			cacheRead: void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: completionTokens,
			text: completionTokens,
			reasoning: void 0
		},
		raw: usage
	};
}
function convertToOpenAICompatibleCompletionPrompt({ prompt, user = "user", assistant = "assistant" }) {
	let text = "";
	if (prompt[0].role === "system") {
		text += `${prompt[0].content}

`;
		prompt = prompt.slice(1);
	}
	for (const { role, content } of prompt) switch (role) {
		case "system": throw new InvalidPromptError({
			message: "Unexpected system message in prompt: ${content}",
			prompt
		});
		case "user": {
			const userMessage = content.map((part) => {
				switch (part.type) {
					case "text": return part.text;
				}
			}).filter(Boolean).join("");
			text += `${user}:
${userMessage}

`;
			break;
		}
		case "assistant": {
			const assistantMessage = content.map((part) => {
				switch (part.type) {
					case "text": return part.text;
					case "tool-call": throw new UnsupportedFunctionalityError({ functionality: "tool-call messages" });
				}
			}).join("");
			text += `${assistant}:
${assistantMessage}

`;
			break;
		}
		case "tool": throw new UnsupportedFunctionalityError({ functionality: "tool messages" });
		default: throw new Error(`Unsupported role: ${role}`);
	}
	text += `${assistant}:
`;
	return {
		prompt: text,
		stopSequences: [`
${user}:`]
	};
}
function getResponseMetadata2({ id, model, created }) {
	return {
		id: id != null ? id : void 0,
		modelId: model != null ? model : void 0,
		timestamp: created != null ? /* @__PURE__ */ new Date(created * 1e3) : void 0
	};
}
function mapOpenAICompatibleFinishReason2(finishReason) {
	switch (finishReason) {
		case "stop": return "stop";
		case "length": return "length";
		case "content_filter": return "content-filter";
		case "function_call":
		case "tool_calls": return "tool-calls";
		default: return "other";
	}
}
var openaiCompatibleLanguageModelCompletionOptions = object({
	/**
	* Echo back the prompt in addition to the completion.
	*/
	echo: boolean().optional(),
	/**
	* Modify the likelihood of specified tokens appearing in the completion.
	*
	* Accepts a JSON object that maps tokens (specified by their token ID in
	* the GPT tokenizer) to an associated bias value from -100 to 100.
	*/
	logitBias: record(string(), number()).optional(),
	/**
	* The suffix that comes after a completion of inserted text.
	*/
	suffix: string().optional(),
	/**
	* A unique identifier representing your end-user, which can help providers to
	* monitor and detect abuse.
	*/
	user: string().optional()
});
var OpenAICompatibleCompletionLanguageModel = class _OpenAICompatibleCompletionLanguageModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		var _a;
		this.modelId = modelId;
		this.config = config;
		const errorStructure = (_a = config.errorStructure) != null ? _a : defaultOpenAICompatibleErrorStructure;
		this.chunkSchema = createOpenAICompatibleCompletionChunkSchema(errorStructure.errorSchema);
		this.failedResponseHandler = createJsonErrorResponseHandler(errorStructure);
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _OpenAICompatibleCompletionLanguageModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	get providerOptionsName() {
		return this.config.provider.split(".")[0].trim();
	}
	get supportedUrls() {
		var _a, _b, _c;
		return (_c = (_b = (_a = this.config).supportedUrls) == null ? void 0 : _b.call(_a)) != null ? _c : {};
	}
	async getArgs({ prompt, maxOutputTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, stopSequences: userStopSequences, responseFormat, seed, providerOptions, tools, toolChoice }) {
		var _a, _b;
		const warnings = [];
		warnIfDeprecatedProviderOptionsKey({
			rawName: this.providerOptionsName,
			providerOptions,
			warnings
		});
		const completionOptions = Object.assign((_a = await parseProviderOptions({
			provider: this.providerOptionsName,
			providerOptions,
			schema: openaiCompatibleLanguageModelCompletionOptions
		})) != null ? _a : {}, (_b = await parseProviderOptions({
			provider: toCamelCase(this.providerOptionsName),
			providerOptions,
			schema: openaiCompatibleLanguageModelCompletionOptions
		})) != null ? _b : {});
		if (topK != null) warnings.push({
			type: "unsupported",
			feature: "topK"
		});
		if (tools == null ? void 0 : tools.length) warnings.push({
			type: "unsupported",
			feature: "tools"
		});
		if (toolChoice != null) warnings.push({
			type: "unsupported",
			feature: "toolChoice"
		});
		if (responseFormat != null && responseFormat.type !== "text") warnings.push({
			type: "unsupported",
			feature: "responseFormat",
			details: "JSON response format is not supported."
		});
		const { prompt: completionPrompt, stopSequences } = convertToOpenAICompatibleCompletionPrompt({ prompt });
		const stop = [...stopSequences != null ? stopSequences : [], ...userStopSequences != null ? userStopSequences : []];
		return {
			args: {
				model: this.modelId,
				echo: completionOptions.echo,
				logit_bias: completionOptions.logitBias,
				suffix: completionOptions.suffix,
				user: completionOptions.user,
				max_tokens: maxOutputTokens,
				temperature,
				top_p: topP,
				frequency_penalty: frequencyPenalty,
				presence_penalty: presencePenalty,
				seed,
				...providerOptions == null ? void 0 : providerOptions[this.providerOptionsName],
				...providerOptions == null ? void 0 : providerOptions[toCamelCase(this.providerOptionsName)],
				prompt: completionPrompt,
				stop: stop.length > 0 ? stop : void 0
			},
			warnings
		};
	}
	async doGenerate(options) {
		var _a, _b;
		const { args, warnings } = await this.getArgs(options);
		const { responseHeaders, value: response, rawValue: rawResponse } = await postJsonToApi({
			url: this.config.url({
				path: "/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_b = (_a = this.config).headers) == null ? void 0 : _b.call(_a), options.headers),
			body: args,
			failedResponseHandler: this.failedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(openaiCompatibleCompletionResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const choice = response.choices[0];
		const content = [];
		if (choice.text != null && choice.text.length > 0) content.push({
			type: "text",
			text: choice.text
		});
		return {
			content,
			usage: convertOpenAICompatibleCompletionUsage(response.usage),
			finishReason: {
				unified: mapOpenAICompatibleFinishReason2(choice.finish_reason),
				raw: choice.finish_reason
			},
			request: { body: args },
			response: {
				...getResponseMetadata2(response),
				headers: responseHeaders,
				body: rawResponse
			},
			warnings
		};
	}
	async doStream(options) {
		var _a, _b;
		const { args, warnings } = await this.getArgs(options);
		const body = {
			...args,
			stream: true,
			stream_options: this.config.includeUsage ? { include_usage: true } : void 0
		};
		const { responseHeaders, value: response } = await postJsonToApi({
			url: this.config.url({
				path: "/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders((_b = (_a = this.config).headers) == null ? void 0 : _b.call(_a), options.headers),
			body,
			failedResponseHandler: this.failedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(this.chunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let finishReason = {
			unified: "other",
			raw: void 0
		};
		let usage = void 0;
		let isFirstChunk = true;
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a2;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const value = chunk.value;
					if ("error" in value) {
						finishReason = {
							unified: "error",
							raw: void 0
						};
						controller.enqueue({
							type: "error",
							error: value.error
						});
						return;
					}
					if (isFirstChunk) {
						isFirstChunk = false;
						controller.enqueue({
							type: "response-metadata",
							...getResponseMetadata2(value)
						});
						controller.enqueue({
							type: "text-start",
							id: "0"
						});
					}
					if (value.usage != null) usage = value.usage;
					const choice = value.choices[0];
					if ((choice == null ? void 0 : choice.finish_reason) != null) finishReason = {
						unified: mapOpenAICompatibleFinishReason2(choice.finish_reason),
						raw: (_a2 = choice.finish_reason) != null ? _a2 : void 0
					};
					if ((choice == null ? void 0 : choice.text) != null) controller.enqueue({
						type: "text-delta",
						id: "0",
						delta: choice.text
					});
				},
				flush(controller) {
					if (!isFirstChunk) controller.enqueue({
						type: "text-end",
						id: "0"
					});
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: convertOpenAICompatibleCompletionUsage(usage)
					});
				}
			})),
			request: { body },
			response: { headers: responseHeaders }
		};
	}
};
var usageSchema = object({
	prompt_tokens: number(),
	completion_tokens: number(),
	total_tokens: number()
});
var openaiCompatibleCompletionResponseSchema = object({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		text: string(),
		finish_reason: string()
	})),
	usage: usageSchema.nullish()
});
var createOpenAICompatibleCompletionChunkSchema = (errorSchema) => union([object({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		text: string(),
		finish_reason: string().nullish(),
		index: number()
	})),
	usage: usageSchema.nullish()
}), errorSchema]);
var openaiCompatibleEmbeddingModelOptions = object({
	/**
	* The number of dimensions the resulting output embeddings should have.
	* Only supported in text-embedding-3 and later models.
	*/
	dimensions: number().optional(),
	/**
	* A unique identifier representing your end-user, which can help providers to
	* monitor and detect abuse.
	*/
	user: string().optional()
});
var OpenAICompatibleEmbeddingModel = class _OpenAICompatibleEmbeddingModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		this.modelId = modelId;
		this.config = config;
	}
	get provider() {
		return this.config.provider;
	}
	get maxEmbeddingsPerCall() {
		var _a;
		return (_a = this.config.maxEmbeddingsPerCall) != null ? _a : 2048;
	}
	get supportsParallelCalls() {
		var _a;
		return (_a = this.config.supportsParallelCalls) != null ? _a : true;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _OpenAICompatibleEmbeddingModel(options.modelId, options.config);
	}
	get providerOptionsName() {
		return this.config.provider.split(".")[0].trim();
	}
	async doEmbed({ values, headers, abortSignal, providerOptions }) {
		var _a, _b, _c, _d, _e;
		const warnings = [];
		const deprecatedOptions = await parseProviderOptions({
			provider: "openai-compatible",
			providerOptions,
			schema: openaiCompatibleEmbeddingModelOptions
		});
		if (deprecatedOptions != null) warnings.push({
			type: "deprecated",
			setting: "providerOptions key 'openai-compatible'",
			message: "Use 'openaiCompatible' instead."
		});
		warnIfDeprecatedProviderOptionsKey({
			rawName: this.providerOptionsName,
			providerOptions,
			warnings
		});
		const compatibleOptions = Object.assign(deprecatedOptions != null ? deprecatedOptions : {}, (_a = await parseProviderOptions({
			provider: "openaiCompatible",
			providerOptions,
			schema: openaiCompatibleEmbeddingModelOptions
		})) != null ? _a : {}, (_b = await parseProviderOptions({
			provider: this.providerOptionsName,
			providerOptions,
			schema: openaiCompatibleEmbeddingModelOptions
		})) != null ? _b : {});
		if (values.length > this.maxEmbeddingsPerCall) throw new TooManyEmbeddingValuesForCallError({
			provider: this.provider,
			modelId: this.modelId,
			maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
			values
		});
		const { responseHeaders, value: response, rawValue } = await postJsonToApi({
			url: this.config.url({
				path: "/embeddings",
				modelId: this.modelId
			}),
			headers: combineHeaders((_d = (_c = this.config).headers) == null ? void 0 : _d.call(_c), headers),
			body: {
				model: this.modelId,
				input: values,
				encoding_format: "float",
				dimensions: compatibleOptions.dimensions,
				user: compatibleOptions.user
			},
			failedResponseHandler: createJsonErrorResponseHandler((_e = this.config.errorStructure) != null ? _e : defaultOpenAICompatibleErrorStructure),
			successfulResponseHandler: createJsonResponseHandler(openaiTextEmbeddingResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			warnings,
			embeddings: response.data.map((item) => item.embedding),
			usage: response.usage ? { tokens: response.usage.prompt_tokens } : void 0,
			providerMetadata: response.providerMetadata,
			response: {
				headers: responseHeaders,
				body: rawValue
			}
		};
	}
};
var openaiTextEmbeddingResponseSchema = object({
	data: array(object({ embedding: array(number()) })),
	usage: object({ prompt_tokens: number() }).nullish(),
	providerMetadata: record(string(), record(string(), any())).optional()
});
var OpenAICompatibleImageModel = class _OpenAICompatibleImageModel {
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
		this.maxImagesPerCall = 10;
	}
	get provider() {
		return this.config.provider;
	}
	/**
	* The provider options key used to extract provider-specific options.
	*/
	get providerOptionsKey() {
		return this.config.provider.split(".")[0].trim();
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _OpenAICompatibleImageModel(options.modelId, options.config);
	}
	getArgs(providerOptions, warnings) {
		warnIfDeprecatedProviderOptionsKey({
			rawName: this.providerOptionsKey,
			providerOptions,
			warnings
		});
		return {
			...providerOptions[this.providerOptionsKey],
			...providerOptions[toCamelCase(this.providerOptionsKey)]
		};
	}
	async doGenerate({ prompt, n, size, aspectRatio, seed, providerOptions, headers, abortSignal, files, mask }) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i;
		const warnings = [];
		if (aspectRatio != null) warnings.push({
			type: "unsupported",
			feature: "aspectRatio",
			details: "This model does not support aspect ratio. Use `size` instead."
		});
		if (seed != null) warnings.push({
			type: "unsupported",
			feature: "seed"
		});
		const currentDate = (_c = (_b = (_a = this.config._internal) == null ? void 0 : _a.currentDate) == null ? void 0 : _b.call(_a)) != null ? _c : /* @__PURE__ */ new Date();
		const args = this.getArgs(providerOptions, warnings);
		if (files != null && files.length > 0) {
			const { value: response2, responseHeaders: responseHeaders2 } = await postFormDataToApi({
				url: this.config.url({
					path: "/images/edits",
					modelId: this.modelId
				}),
				headers: combineHeaders((_e = (_d = this.config).headers) == null ? void 0 : _e.call(_d), headers),
				formData: convertToFormData({
					model: this.modelId,
					prompt,
					image: await Promise.all(files.map((file) => fileToBlob(file))),
					mask: mask != null ? await fileToBlob(mask) : void 0,
					n,
					size,
					...args
				}),
				failedResponseHandler: createJsonErrorResponseHandler((_f = this.config.errorStructure) != null ? _f : defaultOpenAICompatibleErrorStructure),
				successfulResponseHandler: createJsonResponseHandler(openaiCompatibleImageResponseSchema),
				abortSignal,
				fetch: this.config.fetch
			});
			return {
				images: response2.data.map((item) => item.b64_json),
				warnings,
				response: {
					timestamp: currentDate,
					modelId: this.modelId,
					headers: responseHeaders2
				}
			};
		}
		const { value: response, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/images/generations",
				modelId: this.modelId
			}),
			headers: combineHeaders((_h = (_g = this.config).headers) == null ? void 0 : _h.call(_g), headers),
			body: {
				model: this.modelId,
				prompt,
				n,
				size,
				...args,
				response_format: "b64_json"
			},
			failedResponseHandler: createJsonErrorResponseHandler((_i = this.config.errorStructure) != null ? _i : defaultOpenAICompatibleErrorStructure),
			successfulResponseHandler: createJsonResponseHandler(openaiCompatibleImageResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			images: response.data.map((item) => item.b64_json),
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			}
		};
	}
};
var openaiCompatibleImageResponseSchema = object({ data: array(object({ b64_json: string() })) });
async function fileToBlob(file) {
	if (file.type === "url") return downloadBlob(file.url);
	const data = file.data instanceof Uint8Array ? file.data : convertBase64ToUint8Array(file.data);
	return new Blob([data], { type: file.mediaType });
}
var VERSION = "3.0.7";
function createOpenAICompatible(options) {
	const baseURL = withoutTrailingSlash(options.baseURL);
	const providerName = options.name;
	const headers = {
		...options.apiKey && { Authorization: `Bearer ${options.apiKey}` },
		...options.headers
	};
	const getHeaders = () => withUserAgentSuffix(headers, `ai-sdk/openai-compatible/${VERSION}`);
	const getCommonModelConfig = (modelType) => ({
		provider: `${providerName}.${modelType}`,
		url: ({ path }) => {
			const url = new URL(`${baseURL}${path}`);
			if (options.queryParams) url.search = new URLSearchParams(options.queryParams).toString();
			return url.toString();
		},
		headers: getHeaders,
		fetch: options.fetch
	});
	const createLanguageModel = (modelId) => createChatModel(modelId);
	const createChatModel = (modelId) => new OpenAICompatibleChatLanguageModel(modelId, {
		...getCommonModelConfig("chat"),
		includeUsage: options.includeUsage,
		supportsStructuredOutputs: options.supportsStructuredOutputs,
		supportedUrls: options.supportedUrls,
		transformRequestBody: options.transformRequestBody,
		metadataExtractor: options.metadataExtractor,
		convertUsage: options.convertUsage
	});
	const createCompletionModel = (modelId) => new OpenAICompatibleCompletionLanguageModel(modelId, {
		...getCommonModelConfig("completion"),
		includeUsage: options.includeUsage
	});
	const createEmbeddingModel = (modelId) => new OpenAICompatibleEmbeddingModel(modelId, { ...getCommonModelConfig("embedding") });
	const createImageModel = (modelId) => new OpenAICompatibleImageModel(modelId, getCommonModelConfig("image"));
	const provider = (modelId) => createLanguageModel(modelId);
	provider.specificationVersion = "v4";
	provider.languageModel = createLanguageModel;
	provider.chatModel = createChatModel;
	provider.completionModel = createCompletionModel;
	provider.embeddingModel = createEmbeddingModel;
	provider.textEmbeddingModel = createEmbeddingModel;
	provider.imageModel = createImageModel;
	return provider;
}
//#endregion
export { createOpenAICompatible as t };
