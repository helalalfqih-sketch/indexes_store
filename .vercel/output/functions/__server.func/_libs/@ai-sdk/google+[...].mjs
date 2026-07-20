import { $ as union, B as array, F as EventSourceParserStream, G as literal, I as _enum, J as number, K as looseObject, N as WORKFLOW_DESERIALIZE, P as WORKFLOW_SERIALIZE, Q as string, V as boolean, X as record, Y as object, ct as ZodFirstPartyTypeKind, et as unknown, nt as toJSONSchema, tt as safeParseAsync } from "./gateway+[...].mjs";
//#region node_modules/@ai-sdk/google/node_modules/@ai-sdk/provider/dist/index.js
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
var name11 = "AI_NoSuchProviderReferenceError";
var marker12 = `vercel.ai.error.${name11}`;
var symbol12 = Symbol.for(marker12);
var _a12, _b12;
var NoSuchProviderReferenceError = class extends (_b12 = AISDKError, _a12 = symbol12, _b12) {
	constructor({ provider, reference, message = `No provider reference found for provider '${provider}'. Available providers: ${Object.keys(reference).join(", ")}` }) {
		super({
			name: name11,
			message
		});
		this[_a12] = true;
		this.provider = provider;
		this.reference = reference;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker12);
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
//#region node_modules/@ai-sdk/google/node_modules/@ai-sdk/provider-utils/dist/index.js
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
async function delay(delayInMs, options) {
	if (delayInMs == null) return Promise.resolve();
	const signal = options == null ? void 0 : options.abortSignal;
	return new Promise((resolve2, reject) => {
		if (signal == null ? void 0 : signal.aborted) {
			reject(createAbortError());
			return;
		}
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve2();
		}, delayInMs);
		const cleanup = () => {
			clearTimeout(timeoutId);
			signal?.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			cleanup();
			reject(createAbortError());
		};
		signal?.addEventListener("abort", onAbort);
	});
}
function createAbortError() {
	return new DOMException("Delay was aborted", "AbortError");
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
var VERSION = "5.0.7";
var getOriginalFetch$1 = () => globalThis.fetch;
var getFromApi = async ({ url, headers = {}, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch$1() }) => {
	try {
		const response = await fetch2(url, {
			method: "GET",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION}`, getRuntimeEnvironmentUserAgent()),
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: {}
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: {}
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: {}
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
				requestBodyValues: {}
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: {}
		});
	}
};
function isCustomReasoning(reasoning) {
	return reasoning !== void 0 && reasoning !== "provider-default";
}
function mapReasoningToProviderEffort({ reasoning, effortMap, warnings }) {
	const mapped = effortMap[reasoning];
	if (mapped == null) {
		warnings.push({
			type: "unsupported",
			feature: "reasoning",
			details: `reasoning "${reasoning}" is not supported by this model.`
		});
		return;
	}
	if (mapped !== reasoning) warnings.push({
		type: "compatibility",
		feature: "reasoning",
		details: `reasoning "${reasoning}" is not directly supported by this model. mapped to effort "${mapped}".`
	});
	return mapped;
}
var DEFAULT_REASONING_BUDGET_PERCENTAGES = {
	minimal: .02,
	low: .1,
	medium: .3,
	high: .6,
	xhigh: .9
};
function mapReasoningToProviderBudget({ reasoning, maxOutputTokens, maxReasoningBudget, minReasoningBudget = 1024, budgetPercentages = DEFAULT_REASONING_BUDGET_PERCENTAGES, warnings }) {
	const pct = budgetPercentages[reasoning];
	if (pct == null) {
		warnings.push({
			type: "unsupported",
			feature: "reasoning",
			details: `reasoning "${reasoning}" is not supported by this model.`
		});
		return;
	}
	return Math.min(maxReasoningBudget, Math.max(minReasoningBudget, Math.round(maxOutputTokens * pct)));
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
function lazySchema(createSchema) {
	let schema;
	return () => {
		if (schema == null) schema = createSchema();
		return schema;
	};
}
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
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch2() }) => {
	try {
		const response = await fetch2(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION}`, getRuntimeEnvironmentUserAgent()),
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
function tool(tool2) {
	return tool2;
}
function createProviderExecutedToolFactory({ id, inputSchema, outputSchema, supportsDeferredResults }) {
	return ({ onInputStart, onInputDelta, onInputAvailable, ...args }) => tool({
		type: "provider",
		isProviderExecuted: true,
		id,
		args,
		inputSchema,
		outputSchema,
		onInputStart,
		onInputDelta,
		onInputAvailable,
		supportsDeferredResults
	});
}
async function resolve(value) {
	if (typeof value === "function") value = value();
	return Promise.resolve(value);
}
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
function resolveProviderReference({ reference, provider }) {
	const id = reference[provider];
	if (id != null) return id;
	throw new NoSuchProviderReferenceError({
		provider,
		reference
	});
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
new TextDecoder();
//#endregion
//#region node_modules/@ai-sdk/google/dist/internal/index.js
function convertGoogleUsage(usage) {
	var _a, _b, _c, _d;
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
	const promptTokens = (_a = usage.promptTokenCount) != null ? _a : 0;
	const candidatesTokens = (_b = usage.candidatesTokenCount) != null ? _b : 0;
	const cachedContentTokens = (_c = usage.cachedContentTokenCount) != null ? _c : 0;
	const thoughtsTokens = (_d = usage.thoughtsTokenCount) != null ? _d : 0;
	return {
		inputTokens: {
			total: promptTokens,
			noCache: promptTokens - cachedContentTokens,
			cacheRead: cachedContentTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: candidatesTokens + thoughtsTokens,
			text: candidatesTokens,
			reasoning: thoughtsTokens
		},
		raw: usage
	};
}
function convertJSONSchemaToOpenAPISchema(jsonSchema, isRoot = true) {
	if (jsonSchema == null) return;
	if (isEmptyObjectSchema(jsonSchema)) {
		if (isRoot) return;
		if (typeof jsonSchema === "object" && jsonSchema.description) return {
			type: "object",
			description: jsonSchema.description
		};
		return { type: "object" };
	}
	if (typeof jsonSchema === "boolean") return {
		type: "boolean",
		properties: {}
	};
	const { type, description, required, properties, items, allOf, anyOf, oneOf, format, const: constValue, minLength, enum: enumValues } = jsonSchema;
	const result = {};
	if (description) result.description = description;
	if (required) result.required = required;
	if (format) result.format = format;
	if (constValue !== void 0) result.enum = [constValue];
	if (type) if (Array.isArray(type)) {
		const hasNull = type.includes("null");
		const nonNullTypes = type.filter((t) => t !== "null");
		if (nonNullTypes.length === 0) result.type = "null";
		else {
			result.anyOf = nonNullTypes.map((t) => ({ type: t }));
			if (hasNull) result.nullable = true;
		}
	} else result.type = type;
	if (enumValues !== void 0) result.enum = enumValues;
	if (properties != null) result.properties = Object.entries(properties).reduce((acc, [key, value]) => {
		acc[key] = convertJSONSchemaToOpenAPISchema(value, false);
		return acc;
	}, {});
	if (items) result.items = Array.isArray(items) ? items.map((item) => convertJSONSchemaToOpenAPISchema(item, false)) : convertJSONSchemaToOpenAPISchema(items, false);
	if (allOf) result.allOf = allOf.map((item) => convertJSONSchemaToOpenAPISchema(item, false));
	if (anyOf) if (anyOf.some((schema) => typeof schema === "object" && (schema == null ? void 0 : schema.type) === "null")) {
		const nonNullSchemas = anyOf.filter((schema) => !(typeof schema === "object" && (schema == null ? void 0 : schema.type) === "null"));
		if (nonNullSchemas.length === 1) {
			const converted = convertJSONSchemaToOpenAPISchema(nonNullSchemas[0], false);
			if (typeof converted === "object") {
				result.nullable = true;
				Object.assign(result, converted);
			}
		} else {
			result.anyOf = nonNullSchemas.map((item) => convertJSONSchemaToOpenAPISchema(item, false));
			result.nullable = true;
		}
	} else result.anyOf = anyOf.map((item) => convertJSONSchemaToOpenAPISchema(item, false));
	if (oneOf) result.oneOf = oneOf.map((item) => convertJSONSchemaToOpenAPISchema(item, false));
	if (minLength !== void 0) result.minLength = minLength;
	return result;
}
function isEmptyObjectSchema(jsonSchema) {
	return jsonSchema != null && typeof jsonSchema === "object" && jsonSchema.type === "object" && (jsonSchema.properties == null || Object.keys(jsonSchema.properties).length === 0) && !jsonSchema.additionalProperties;
}
var SKIP_THOUGHT_SIGNATURE_VALIDATOR = "skip_thought_signature_validator";
var dataUrlRegex = /^data:([^;,]+);base64,(.+)$/s;
function parseBase64DataUrl(value) {
	const match = dataUrlRegex.exec(value);
	if (match == null) return;
	return {
		mediaType: match[1],
		data: match[2]
	};
}
function convertUrlToolResultPart(url) {
	const parsedDataUrl = parseBase64DataUrl(url);
	if (parsedDataUrl == null) return;
	return { inlineData: {
		mimeType: parsedDataUrl.mediaType,
		data: parsedDataUrl.data
	} };
}
function appendToolResultParts(parts, toolName, outputValue, toolCallId) {
	const functionResponseParts = [];
	const responseTextParts = [];
	for (const contentPart of outputValue) switch (contentPart.type) {
		case "text":
			responseTextParts.push(contentPart.text);
			break;
		case "file":
			if (contentPart.data.type === "data") functionResponseParts.push({ inlineData: {
				mimeType: resolveFullMediaType({ part: contentPart }),
				data: convertToBase64(contentPart.data.data)
			} });
			else if (contentPart.data.type === "url") {
				const functionResponsePart = convertUrlToolResultPart(contentPart.data.url.toString());
				if (functionResponsePart != null) functionResponseParts.push(functionResponsePart);
				else responseTextParts.push(JSON.stringify(contentPart));
			} else responseTextParts.push(JSON.stringify(contentPart));
			break;
		default:
			responseTextParts.push(JSON.stringify(contentPart));
			break;
	}
	parts.push({ functionResponse: {
		...toolCallId != null ? { id: toolCallId } : {},
		name: toolName,
		response: {
			name: toolName,
			content: responseTextParts.length > 0 ? responseTextParts.join("\n") : "Tool executed successfully."
		},
		...functionResponseParts.length > 0 ? { parts: functionResponseParts } : {}
	} });
}
function appendLegacyToolResultParts(parts, toolName, outputValue, toolCallId) {
	for (const contentPart of outputValue) switch (contentPart.type) {
		case "text":
			parts.push({ functionResponse: {
				...toolCallId != null ? { id: toolCallId } : {},
				name: toolName,
				response: {
					name: toolName,
					content: contentPart.text
				}
			} });
			break;
		case "file":
			if (contentPart.data.type === "data") {
				const topLevelMediaType = getTopLevelMediaType(contentPart.mediaType);
				parts.push({ inlineData: {
					mimeType: resolveFullMediaType({ part: contentPart }),
					data: convertToBase64(contentPart.data.data)
				} }, { text: `Tool executed successfully and returned this ${topLevelMediaType === "image" ? "image" : "file"} as a response` });
			} else parts.push({ text: JSON.stringify(contentPart) });
			break;
		default:
			parts.push({ text: JSON.stringify(contentPart) });
			break;
	}
}
function convertToGoogleMessages(prompt, options) {
	var _a, _b, _c, _d, _e;
	const systemInstructionParts = [];
	const contents = [];
	let systemMessagesAllowed = true;
	const isGemmaModel = (_a = options == null ? void 0 : options.isGemmaModel) != null ? _a : false;
	const isGemini3Model2 = (_b = options == null ? void 0 : options.isGemini3Model) != null ? _b : false;
	const onWarning = options == null ? void 0 : options.onWarning;
	const providerOptionsNames = (_c = options == null ? void 0 : options.providerOptionsNames) != null ? _c : ["google"];
	const isVertexLike = !providerOptionsNames.includes("google");
	const supportsFunctionResponseParts = (_d = options == null ? void 0 : options.supportsFunctionResponseParts) != null ? _d : true;
	let sentinelInjected = false;
	const missingSignatureToolNames = [];
	const injectSkipSignature = (toolName) => {
		missingSignatureToolNames.push(toolName);
		sentinelInjected = true;
		return SKIP_THOUGHT_SIGNATURE_VALIDATOR;
	};
	const readProviderOpts = (part) => {
		var _a2, _b2, _c2, _d2, _e2;
		for (const name of providerOptionsNames) {
			const v = (_a2 = part.providerOptions) == null ? void 0 : _a2[name];
			if (v != null) return v;
		}
		if (isVertexLike) return (_b2 = part.providerOptions) == null ? void 0 : _b2.google;
		return (_e2 = (_c2 = part.providerOptions) == null ? void 0 : _c2.googleVertex) != null ? _e2 : (_d2 = part.providerOptions) == null ? void 0 : _d2.vertex;
	};
	for (const { role, content } of prompt) switch (role) {
		case "system":
			if (!systemMessagesAllowed) throw new UnsupportedFunctionalityError({ functionality: "system messages are only supported at the beginning of the conversation" });
			systemInstructionParts.push({ text: content });
			break;
		case "user": {
			systemMessagesAllowed = false;
			const parts = [];
			for (const part of content) switch (part.type) {
				case "text":
					parts.push({ text: part.text });
					break;
				case "file":
					switch (part.data.type) {
						case "url":
							parts.push({ fileData: {
								mimeType: resolveFullMediaType({ part }),
								fileUri: part.data.url.toString()
							} });
							break;
						case "reference":
							if (isVertexLike) throw new UnsupportedFunctionalityError({ functionality: "file parts with provider references" });
							parts.push({ fileData: {
								mimeType: resolveFullMediaType({ part }),
								fileUri: resolveProviderReference({
									reference: part.data.reference,
									provider: "google"
								})
							} });
							break;
						case "text":
							parts.push({ inlineData: {
								mimeType: isFullMediaType(part.mediaType) ? part.mediaType : "text/plain",
								data: convertToBase64(new TextEncoder().encode(part.data.text))
							} });
							break;
						case "data":
							parts.push({ inlineData: {
								mimeType: resolveFullMediaType({ part }),
								data: convertToBase64(part.data.data)
							} });
							break;
					}
					break;
			}
			contents.push({
				role: "user",
				parts
			});
			break;
		}
		case "assistant":
			systemMessagesAllowed = false;
			contents.push({
				role: "model",
				parts: content.map((part) => {
					const providerOpts = readProviderOpts(part);
					const thoughtSignature = (providerOpts == null ? void 0 : providerOpts.thoughtSignature) != null ? String(providerOpts.thoughtSignature) : void 0;
					switch (part.type) {
						case "text": return part.text.length === 0 ? void 0 : {
							text: part.text,
							thoughtSignature
						};
						case "reasoning": return part.text.length === 0 ? void 0 : {
							text: part.text,
							thought: true,
							thoughtSignature
						};
						case "reasoning-file":
							switch (part.data.type) {
								case "url": throw new UnsupportedFunctionalityError({ functionality: "File data URLs in assistant messages are not supported" });
								case "data": return {
									inlineData: {
										mimeType: part.mediaType,
										data: convertToBase64(part.data.data)
									},
									thought: true,
									thoughtSignature
								};
							}
							break;
						case "file":
							switch (part.data.type) {
								case "url": throw new UnsupportedFunctionalityError({ functionality: "File data URLs in assistant messages are not supported" });
								case "reference":
									if (isVertexLike) throw new UnsupportedFunctionalityError({ functionality: "file parts with provider references" });
									return {
										fileData: {
											mimeType: part.mediaType,
											fileUri: resolveProviderReference({
												reference: part.data.reference,
												provider: "google"
											})
										},
										...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
										thoughtSignature
									};
								case "text": return {
									inlineData: {
										mimeType: isFullMediaType(part.mediaType) ? part.mediaType : "text/plain",
										data: convertToBase64(new TextEncoder().encode(part.data.text))
									},
									...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
									thoughtSignature
								};
								case "data": return {
									inlineData: {
										mimeType: part.mediaType,
										data: convertToBase64(part.data.data)
									},
									...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
									thoughtSignature
								};
							}
							break;
						case "tool-call": {
							const serverToolCallId = (providerOpts == null ? void 0 : providerOpts.serverToolCallId) != null ? String(providerOpts.serverToolCallId) : void 0;
							const serverToolType = (providerOpts == null ? void 0 : providerOpts.serverToolType) != null ? String(providerOpts.serverToolType) : void 0;
							const effectiveThoughtSignature = thoughtSignature != null ? thoughtSignature : isGemini3Model2 ? injectSkipSignature(part.toolName) : void 0;
							if (serverToolCallId && serverToolType) return {
								toolCall: {
									toolType: serverToolType,
									args: typeof part.input === "string" ? secureJsonParse(part.input) : part.input,
									id: serverToolCallId
								},
								thoughtSignature: effectiveThoughtSignature
							};
							return {
								functionCall: {
									...part.toolCallId != null ? { id: part.toolCallId } : {},
									name: part.toolName,
									args: part.input
								},
								thoughtSignature: effectiveThoughtSignature
							};
						}
						case "tool-result": {
							const serverToolCallId = (providerOpts == null ? void 0 : providerOpts.serverToolCallId) != null ? String(providerOpts.serverToolCallId) : void 0;
							const serverToolType = (providerOpts == null ? void 0 : providerOpts.serverToolType) != null ? String(providerOpts.serverToolType) : void 0;
							if (serverToolCallId && serverToolType) return {
								toolResponse: {
									toolType: serverToolType,
									response: part.output.type === "json" ? part.output.value : {},
									id: serverToolCallId
								},
								thoughtSignature
							};
							return;
						}
					}
				}).filter((part) => part !== void 0)
			});
			break;
		case "tool": {
			systemMessagesAllowed = false;
			const parts = [];
			for (const part of content) {
				if (part.type === "tool-approval-response") continue;
				const partProviderOpts = readProviderOpts(part);
				const serverToolCallId = (partProviderOpts == null ? void 0 : partProviderOpts.serverToolCallId) != null ? String(partProviderOpts.serverToolCallId) : void 0;
				const serverToolType = (partProviderOpts == null ? void 0 : partProviderOpts.serverToolType) != null ? String(partProviderOpts.serverToolType) : void 0;
				if (serverToolCallId && serverToolType) {
					const serverThoughtSignature = (partProviderOpts == null ? void 0 : partProviderOpts.thoughtSignature) != null ? String(partProviderOpts.thoughtSignature) : void 0;
					if (contents.length > 0) {
						const lastContent = contents[contents.length - 1];
						if (lastContent.role === "model") {
							lastContent.parts.push({
								toolResponse: {
									toolType: serverToolType,
									response: part.output.type === "json" ? part.output.value : {},
									id: serverToolCallId
								},
								thoughtSignature: serverThoughtSignature
							});
							continue;
						}
					}
				}
				const output = part.output;
				if (output.type === "content") if (supportsFunctionResponseParts) appendToolResultParts(parts, part.toolName, output.value, part.toolCallId);
				else appendLegacyToolResultParts(parts, part.toolName, output.value, part.toolCallId);
				else parts.push({ functionResponse: {
					...part.toolCallId != null ? { id: part.toolCallId } : {},
					name: part.toolName,
					response: {
						name: part.toolName,
						content: output.type === "execution-denied" ? (_e = output.reason) != null ? _e : "Tool call execution denied." : output.value
					}
				} });
			}
			contents.push({
				role: "user",
				parts
			});
			break;
		}
	}
	if (isGemmaModel && systemInstructionParts.length > 0 && contents.length > 0 && contents[0].role === "user") {
		const systemText = systemInstructionParts.map((part) => part.text).join("\n\n");
		contents[0].parts.unshift({ text: systemText + "\n\n" });
	}
	if (sentinelInjected && onWarning != null) {
		const uniqueToolNames = Array.from(new Set(missingSignatureToolNames));
		onWarning({
			type: "other",
			message: `Replayed ${missingSignatureToolNames.length} \`functionCall\` part(s) for a Gemini 3 model without a \`thoughtSignature\` (tools: ${uniqueToolNames.map((name) => `\`${name}\``).join(", ")}). Injected the documented \`skip_thought_signature_validator\` sentinel to keep the request from failing with HTTP 400. The likely cause is application code that drops \`providerOptions.google.thoughtSignature\` when persisting or serializing assistant tool-call messages. See https://ai.google.dev/gemini-api/docs/thought-signatures.`
		});
	}
	return {
		systemInstruction: systemInstructionParts.length > 0 && !isGemmaModel ? { parts: systemInstructionParts } : void 0,
		contents
	};
}
function getModelPath(modelId) {
	return modelId.includes("/") ? modelId : `models/${modelId}`;
}
var googleFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: lazySchema(() => zodSchema(object({ error: object({
		code: number().nullable(),
		message: string(),
		status: string()
	}) }))),
	errorToMessage: (data) => data.error.message
});
var googleLanguageModelOptions = lazySchema(() => zodSchema(object({
	responseModalities: array(_enum(["TEXT", "IMAGE"])).optional(),
	thinkingConfig: object({
		thinkingBudget: number().optional(),
		includeThoughts: boolean().optional(),
		thinkingLevel: _enum([
			"minimal",
			"low",
			"medium",
			"high"
		]).optional()
	}).optional(),
	/**
	* Optional.
	* The name of the cached content used as context to serve the prediction.
	* Format: cachedContents/{cachedContent}
	*/
	cachedContent: string().optional(),
	/**
	* Optional. Enable structured output. Default is true.
	*
	* This is useful when the JSON Schema contains elements that are
	* not supported by the OpenAPI schema version that
	* Google uses. You can use this to disable
	* structured outputs if you need to.
	*/
	structuredOutputs: boolean().optional(),
	/**
	* Optional. A list of unique safety settings for blocking unsafe content.
	*/
	safetySettings: array(object({
		category: _enum([
			"HARM_CATEGORY_UNSPECIFIED",
			"HARM_CATEGORY_HATE_SPEECH",
			"HARM_CATEGORY_DANGEROUS_CONTENT",
			"HARM_CATEGORY_HARASSMENT",
			"HARM_CATEGORY_SEXUALLY_EXPLICIT",
			"HARM_CATEGORY_CIVIC_INTEGRITY"
		]),
		threshold: _enum([
			"HARM_BLOCK_THRESHOLD_UNSPECIFIED",
			"BLOCK_LOW_AND_ABOVE",
			"BLOCK_MEDIUM_AND_ABOVE",
			"BLOCK_ONLY_HIGH",
			"BLOCK_NONE",
			"OFF"
		])
	})).optional(),
	threshold: _enum([
		"HARM_BLOCK_THRESHOLD_UNSPECIFIED",
		"BLOCK_LOW_AND_ABOVE",
		"BLOCK_MEDIUM_AND_ABOVE",
		"BLOCK_ONLY_HIGH",
		"BLOCK_NONE",
		"OFF"
	]).optional(),
	/**
	* Optional. Enables timestamp understanding for audio-only files.
	*
	* https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/audio-understanding
	*/
	audioTimestamp: boolean().optional(),
	/**
	* Optional. Defines labels used in billing reports. Available on Vertex AI only.
	*
	* https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls
	*/
	labels: record(string(), string()).optional(),
	/**
	* Optional. If specified, the media resolution specified will be used.
	*
	* https://ai.google.dev/api/generate-content#MediaResolution
	*/
	mediaResolution: _enum([
		"MEDIA_RESOLUTION_UNSPECIFIED",
		"MEDIA_RESOLUTION_LOW",
		"MEDIA_RESOLUTION_MEDIUM",
		"MEDIA_RESOLUTION_HIGH"
	]).optional(),
	/**
	* Optional. Configures the image generation aspect ratio for Gemini models.
	*
	* https://ai.google.dev/gemini-api/docs/image-generation#aspect_ratios
	*/
	imageConfig: object({
		aspectRatio: _enum([
			"1:1",
			"2:3",
			"3:2",
			"3:4",
			"4:3",
			"4:5",
			"5:4",
			"9:16",
			"16:9",
			"21:9",
			"1:8",
			"8:1",
			"1:4",
			"4:1"
		]).optional(),
		imageSize: _enum([
			"1K",
			"2K",
			"4K",
			"512"
		]).optional()
	}).optional(),
	/**
	* Optional. Configuration for grounding retrieval.
	* Used to provide location context for Google Maps and Google Search grounding.
	*
	* https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
	*/
	retrievalConfig: object({ latLng: object({
		latitude: number(),
		longitude: number()
	}).optional() }).optional(),
	/**
	* Optional. When set to true, function call arguments will be streamed
	* incrementally via partialArgs in streaming responses. Only supported
	* on the Vertex AI API (not the Gemini API) and only for Gemini 3+
	* models.
	*
	* @default false
	*
	* https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling#streaming-fc
	*/
	streamFunctionCallArguments: boolean().optional(),
	/**
	* Optional. The service tier to use for the request. Sent as the
	* `serviceTier` body field. Gemini API only.
	*/
	serviceTier: _enum([
		"standard",
		"flex",
		"priority"
	]).optional(),
	/**
	* Optional. Vertex AI only. Sent as the
	* `X-Vertex-AI-LLM-Shared-Request-Type` request header to select a
	* shared (PayGo) tier. With Provisioned Throughput allocated and
	* `requestType` unset, the request falls back to this tier only if
	* PT capacity is exhausted.
	*
	* https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo
	* https://docs.cloud.google.com/vertex-ai/generative-ai/docs/flex-paygo
	*/
	sharedRequestType: _enum([
		"priority",
		"flex",
		"standard"
	]).optional(),
	/**
	* Optional. Vertex AI only. Sent as the `X-Vertex-AI-LLM-Request-Type`
	* request header. Set to `'shared'` together with `sharedRequestType`
	* to bypass Provisioned Throughput entirely.
	*
	* https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo
	*/
	requestType: _enum(["shared"]).optional()
})));
function prepareTools({ tools, toolChoice, modelId, isVertexProvider = false }) {
	var _a, _b;
	tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
	const toolWarnings = [];
	const isLatest = [
		"gemini-flash-latest",
		"gemini-flash-lite-latest",
		"gemini-pro-latest"
	].some((id) => id === modelId);
	const isGemini2orNewer = modelId.includes("gemini-2") || modelId.includes("gemini-3") || modelId.includes("nano-banana") || isLatest;
	const isGemini3orNewer = modelId.includes("gemini-3");
	const supportsFileSearch = modelId.includes("gemini-2.5") || modelId.includes("gemini-3");
	if (tools == null) return {
		tools: void 0,
		toolConfig: void 0,
		toolWarnings
	};
	const hasFunctionTools = tools.some((tool) => tool.type === "function");
	const hasProviderTools = tools.some((tool) => tool.type === "provider");
	if (hasFunctionTools && hasProviderTools && !isGemini3orNewer) toolWarnings.push({
		type: "unsupported",
		feature: `combination of function and provider-defined tools`
	});
	if (hasProviderTools) {
		const googleTools2 = [];
		tools.filter((tool) => tool.type === "provider").forEach((tool) => {
			switch (tool.id) {
				case "google.google_search":
					if (isGemini2orNewer) googleTools2.push({ googleSearch: { ...tool.args } });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "Google Search requires Gemini 2.0 or newer."
					});
					break;
				case "google.enterprise_web_search":
					if (isGemini2orNewer) googleTools2.push({ enterpriseWebSearch: {} });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "Enterprise Web Search requires Gemini 2.0 or newer."
					});
					break;
				case "google.url_context":
					if (isGemini2orNewer) googleTools2.push({ urlContext: {} });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "The URL context tool is not supported with other Gemini models than Gemini 2."
					});
					break;
				case "google.code_execution":
					if (isGemini2orNewer) googleTools2.push({ codeExecution: {} });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "The code execution tool is not supported with other Gemini models than Gemini 2."
					});
					break;
				case "google.file_search":
					if (supportsFileSearch) googleTools2.push({ fileSearch: { ...tool.args } });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "The file search tool is only supported with Gemini 2.5 models and Gemini 3 models."
					});
					break;
				case "google.vertex_rag_store":
					if (isGemini2orNewer) googleTools2.push({ retrieval: { vertex_rag_store: {
						rag_resources: { rag_corpus: tool.args.ragCorpus },
						similarity_top_k: tool.args.topK
					} } });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "The RAG store tool is not supported with other Gemini models than Gemini 2."
					});
					break;
				case "google.google_maps":
					if (isGemini2orNewer) googleTools2.push({ googleMaps: {} });
					else toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: "The Google Maps grounding tool is not supported with Gemini models other than Gemini 2 or newer."
					});
					break;
				default:
					toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`
					});
					break;
			}
		});
		if (hasFunctionTools && isGemini3orNewer && googleTools2.length > 0) {
			const functionDeclarations2 = [];
			for (const tool of tools) if (tool.type === "function") functionDeclarations2.push({
				name: tool.name,
				description: (_a = tool.description) != null ? _a : "",
				parameters: convertJSONSchemaToOpenAPISchema(tool.inputSchema)
			});
			const combinedToolConfig = {
				functionCallingConfig: { mode: "VALIDATED" },
				...!isVertexProvider && { includeServerSideToolInvocations: true }
			};
			if (toolChoice != null) switch (toolChoice.type) {
				case "auto": break;
				case "none":
					combinedToolConfig.functionCallingConfig = { mode: "NONE" };
					break;
				case "required":
					combinedToolConfig.functionCallingConfig = { mode: "ANY" };
					break;
				case "tool":
					combinedToolConfig.functionCallingConfig = {
						mode: "ANY",
						allowedFunctionNames: [toolChoice.toolName]
					};
					break;
			}
			return {
				tools: [...googleTools2, { functionDeclarations: functionDeclarations2 }],
				toolConfig: combinedToolConfig,
				toolWarnings
			};
		}
		return {
			tools: googleTools2.length > 0 ? googleTools2 : void 0,
			toolConfig: void 0,
			toolWarnings
		};
	}
	const functionDeclarations = [];
	let hasStrictTools = false;
	for (const tool of tools) switch (tool.type) {
		case "function":
			functionDeclarations.push({
				name: tool.name,
				description: (_b = tool.description) != null ? _b : "",
				parameters: convertJSONSchemaToOpenAPISchema(tool.inputSchema)
			});
			if (tool.strict === true) hasStrictTools = true;
			break;
		default:
			toolWarnings.push({
				type: "unsupported",
				feature: `function tool ${tool.name}`
			});
			break;
	}
	if (toolChoice == null) return {
		tools: [{ functionDeclarations }],
		toolConfig: hasStrictTools ? { functionCallingConfig: { mode: "VALIDATED" } } : void 0,
		toolWarnings
	};
	const type = toolChoice.type;
	switch (type) {
		case "auto": return {
			tools: [{ functionDeclarations }],
			toolConfig: { functionCallingConfig: { mode: hasStrictTools ? "VALIDATED" : "AUTO" } },
			toolWarnings
		};
		case "none": return {
			tools: [{ functionDeclarations }],
			toolConfig: { functionCallingConfig: { mode: "NONE" } },
			toolWarnings
		};
		case "required": return {
			tools: [{ functionDeclarations }],
			toolConfig: { functionCallingConfig: { mode: hasStrictTools ? "VALIDATED" : "ANY" } },
			toolWarnings
		};
		case "tool": return {
			tools: [{ functionDeclarations }],
			toolConfig: { functionCallingConfig: {
				mode: hasStrictTools ? "VALIDATED" : "ANY",
				allowedFunctionNames: [toolChoice.toolName]
			} },
			toolWarnings
		};
		default: throw new UnsupportedFunctionalityError({ functionality: `tool choice type: ${type}` });
	}
}
var GoogleJSONAccumulator = class {
	constructor() {
		this.accumulatedArgs = {};
		this.jsonText = "";
		/**
		* Stack representing the currently "open" containers in the JSON output.
		* Entry 0 is always the root `{` object once the first value is written.
		*/
		this.pathStack = [];
		/**
		* Whether a string value is currently "open" (willContinue was true),
		* meaning the closing quote has not yet been emitted.
		*/
		this.stringOpen = false;
	}
	/**
	* Input: [{jsonPath:"$.brightness",numberValue:50}]
	* Output: { currentJSON:{brightness:50}, textDelta:'{"brightness":50' }
	*/
	processPartialArgs(partialArgs) {
		let delta = "";
		for (const arg of partialArgs) {
			const rawPath = arg.jsonPath.replace(/^\$\./, "");
			if (!rawPath) continue;
			const segments = parsePath(rawPath);
			const existingValue = getNestedValue(this.accumulatedArgs, segments);
			if (arg.stringValue != null && existingValue !== void 0) {
				const escaped = JSON.stringify(arg.stringValue).slice(1, -1);
				setNestedValue(this.accumulatedArgs, segments, existingValue + arg.stringValue);
				delta += escaped;
				continue;
			}
			const resolved = resolvePartialArgValue(arg);
			if (resolved == null) continue;
			setNestedValue(this.accumulatedArgs, segments, resolved.value);
			delta += this.emitNavigationTo(segments, arg, resolved.json);
		}
		this.jsonText += delta;
		return {
			currentJSON: this.accumulatedArgs,
			textDelta: delta
		};
	}
	/**
	* Input: jsonText='{"brightness":50', accumulatedArgs={brightness:50}
	* Output: { finalJSON:'{"brightness":50}', closingDelta:'}' }
	*/
	finalize() {
		const finalArgs = JSON.stringify(this.accumulatedArgs);
		return {
			finalJSON: finalArgs,
			closingDelta: finalArgs.slice(this.jsonText.length)
		};
	}
	/**
	* Input: pathStack=[] (first call) or pathStack=[root,...] (subsequent calls)
	* Output: '{' (first call) or '' (subsequent calls)
	*/
	ensureRoot() {
		if (this.pathStack.length === 0) {
			this.pathStack.push({
				segment: "",
				isArray: false,
				childCount: 0
			});
			return "{";
		}
		return "";
	}
	/**
	* Emits the JSON text fragment needed to navigate from the current open
	* path to the new leaf at `targetSegments`, then writes the value.
	*
	* Input: targetSegments=["recipe","name"], arg={jsonPath:"$.recipe.name",stringValue:"Lasagna"}, valueJson='"Lasagna"'
	* Output: '{"recipe":{"name":"Lasagna"'
	*/
	emitNavigationTo(targetSegments, arg, valueJson) {
		let fragment = "";
		if (this.stringOpen) {
			fragment += "\"";
			this.stringOpen = false;
		}
		fragment += this.ensureRoot();
		const targetContainerSegments = targetSegments.slice(0, -1);
		const leafSegment = targetSegments[targetSegments.length - 1];
		const commonDepth = this.findCommonStackDepth(targetContainerSegments);
		fragment += this.closeDownTo(commonDepth);
		fragment += this.openDownTo(targetContainerSegments, leafSegment);
		fragment += this.emitLeaf(leafSegment, arg, valueJson);
		return fragment;
	}
	/**
	* Returns the stack depth to preserve when navigating to a new target
	* container path. Always >= 1 (the root is never popped).
	*
	* Input: stack=[root,"recipe","ingredients",0], target=["recipe","ingredients",1]
	* Output: 3 (keep root+"recipe"+"ingredients")
	*/
	findCommonStackDepth(targetContainer) {
		const maxDepth = Math.min(this.pathStack.length - 1, targetContainer.length);
		let common = 0;
		for (let i = 0; i < maxDepth; i++) if (this.pathStack[i + 1].segment === targetContainer[i]) common++;
		else break;
		return common + 1;
	}
	/**
	* Closes containers from the current stack depth back down to `targetDepth`.
	*
	* Input: this.pathStack=[root,"recipe","ingredients",0], targetDepth=3
	* Output: '}'
	*/
	closeDownTo(targetDepth) {
		let fragment = "";
		while (this.pathStack.length > targetDepth) {
			const entry = this.pathStack.pop();
			fragment += entry.isArray ? "]" : "}";
		}
		return fragment;
	}
	/**
	* Opens containers from the current stack depth down to the full target
	* container path, emitting opening `{`, `[`, keys, and commas as needed.
	* `leafSegment` is used to determine if the innermost container is an array.
	*
	* Input: this.pathStack=[root], targetContainer=["recipe","ingredients"], leafSegment=0
	* Output: '"recipe":{"ingredients":['
	*/
	openDownTo(targetContainer, leafSegment) {
		let fragment = "";
		const startIdx = this.pathStack.length - 1;
		for (let i = startIdx; i < targetContainer.length; i++) {
			const pathSegment = targetContainer[i];
			const parentEntry = this.pathStack[this.pathStack.length - 1];
			if (parentEntry.childCount > 0) fragment += ",";
			parentEntry.childCount++;
			if (typeof pathSegment === "string") fragment += `${JSON.stringify(pathSegment)}:`;
			const isArray = typeof (i + 1 < targetContainer.length ? targetContainer[i + 1] : leafSegment) === "number";
			fragment += isArray ? "[" : "{";
			this.pathStack.push({
				segment: pathSegment,
				isArray,
				childCount: 0
			});
		}
		return fragment;
	}
	/**
	* Emits the comma, key, and value for a leaf entry in the current container.
	*
	* Input: leafSegment="name", arg={stringValue:"Lasagna"}, valueJson='"Lasagna"'
	* Output: '"name":"Lasagna"' (or ',"name":"Lasagna"' if container.childCount > 0)
	*/
	emitLeaf(leafSegment, arg, valueJson) {
		let fragment = "";
		const container = this.pathStack[this.pathStack.length - 1];
		if (container.childCount > 0) fragment += ",";
		container.childCount++;
		if (typeof leafSegment === "string") fragment += `${JSON.stringify(leafSegment)}:`;
		if (arg.stringValue != null && arg.willContinue) {
			fragment += valueJson.slice(0, -1);
			this.stringOpen = true;
		} else fragment += valueJson;
		return fragment;
	}
};
function parsePath(rawPath) {
	const segments = [];
	for (const part of rawPath.split(".")) {
		const bracketIdx = part.indexOf("[");
		if (bracketIdx === -1) segments.push(part);
		else {
			if (bracketIdx > 0) segments.push(part.slice(0, bracketIdx));
			for (const m of part.matchAll(/\[(\d+)\]/g)) segments.push(parseInt(m[1], 10));
		}
	}
	return segments;
}
var hasOwn = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
	return hasOwn.call(obj, key);
}
function defineOwnProperty(obj, key, value) {
	Object.defineProperty(obj, key, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
}
function getNestedValue(obj, segments) {
	let current = obj;
	for (const pathSegment of segments) {
		if (current == null || typeof current !== "object") return void 0;
		const currentRecord = current;
		if (!hasOwnProperty(currentRecord, pathSegment)) return void 0;
		current = currentRecord[pathSegment];
	}
	return current;
}
function setNestedValue(obj, segments, value) {
	let current = obj;
	for (let i = 0; i < segments.length - 1; i++) {
		const pathSegment = segments[i];
		const nextSeg = segments[i + 1];
		if (!hasOwnProperty(current, pathSegment) || current[pathSegment] == null) defineOwnProperty(current, pathSegment, typeof nextSeg === "number" ? [] : {});
		current = current[pathSegment];
	}
	defineOwnProperty(current, segments[segments.length - 1], value);
}
function resolvePartialArgValue(arg) {
	var _a, _b;
	const value = (_b = (_a = arg.stringValue) != null ? _a : arg.numberValue) != null ? _b : arg.boolValue;
	if (value != null) return {
		value,
		json: JSON.stringify(value)
	};
	if ("nullValue" in arg) return {
		value: null,
		json: "null"
	};
}
function mapGoogleFinishReason({ finishReason, hasToolCalls }) {
	switch (finishReason) {
		case "STOP": return hasToolCalls ? "tool-calls" : "stop";
		case "MAX_TOKENS": return "length";
		case "IMAGE_SAFETY":
		case "RECITATION":
		case "SAFETY":
		case "BLOCKLIST":
		case "PROHIBITED_CONTENT":
		case "SPII": return "content-filter";
		case "MALFORMED_FUNCTION_CALL": return "error";
		default: return "other";
	}
}
var configurableSafetySettingCategories = [
	"HARM_CATEGORY_HATE_SPEECH",
	"HARM_CATEGORY_DANGEROUS_CONTENT",
	"HARM_CATEGORY_HARASSMENT",
	"HARM_CATEGORY_SEXUALLY_EXPLICIT"
];
var GoogleLanguageModel = class _GoogleLanguageModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		var _a;
		this.modelId = modelId;
		this.config = config;
		this.generateId = (_a = config.generateId) != null ? _a : generateId;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GoogleLanguageModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	get supportedUrls() {
		var _a, _b, _c;
		return (_c = (_b = (_a = this.config).supportedUrls) == null ? void 0 : _b.call(_a)) != null ? _c : {};
	}
	async getArgs({ prompt, maxOutputTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, stopSequences, responseFormat, seed, tools, toolChoice, reasoning, providerOptions }, { isStreaming = false } = {}) {
		var _a, _b, _c;
		const warnings = [];
		const providerOptionsNames = this.config.provider.includes("vertex") ? ["googleVertex", "vertex"] : ["google"];
		let googleOptions;
		for (const name of providerOptionsNames) {
			googleOptions = await parseProviderOptions({
				provider: name,
				providerOptions,
				schema: googleLanguageModelOptions
			});
			if (googleOptions != null) break;
		}
		if (googleOptions == null && !providerOptionsNames.includes("google")) googleOptions = await parseProviderOptions({
			provider: "google",
			providerOptions,
			schema: googleLanguageModelOptions
		});
		const isVertexProvider = this.config.provider.startsWith("google.vertex.");
		if ((tools == null ? void 0 : tools.some((tool) => tool.type === "provider" && tool.id === "google.vertex_rag_store")) && !isVertexProvider) warnings.push({
			type: "other",
			message: `The 'vertex_rag_store' tool is only supported with the Google Vertex provider and might not be supported or could behave unexpectedly with the current Google provider (${this.config.provider}).`
		});
		if ((googleOptions == null ? void 0 : googleOptions.streamFunctionCallArguments) && !isVertexProvider) warnings.push({
			type: "other",
			message: `'streamFunctionCallArguments' is only supported on the Vertex AI API and will be ignored with the current Google provider (${this.config.provider}). See https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling#streaming-fc`
		});
		if ((googleOptions == null ? void 0 : googleOptions.serviceTier) && isVertexProvider) warnings.push({
			type: "other",
			message: "'serviceTier' is a Gemini API option and is not supported on Vertex AI. Use 'sharedRequestType' (and optionally 'requestType') instead. See https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo"
		});
		if (((googleOptions == null ? void 0 : googleOptions.sharedRequestType) || (googleOptions == null ? void 0 : googleOptions.requestType)) && !isVertexProvider) warnings.push({
			type: "other",
			message: `'sharedRequestType' and 'requestType' are Vertex AI options and are ignored with the current Google provider (${this.config.provider}).`
		});
		const vertexPaygoHeaders = isVertexProvider && ((googleOptions == null ? void 0 : googleOptions.sharedRequestType) || (googleOptions == null ? void 0 : googleOptions.requestType)) ? {
			...googleOptions.sharedRequestType && { "X-Vertex-AI-LLM-Shared-Request-Type": googleOptions.sharedRequestType },
			...googleOptions.requestType && { "X-Vertex-AI-LLM-Request-Type": googleOptions.requestType }
		} : void 0;
		const bodyServiceTier = isVertexProvider ? void 0 : googleOptions == null ? void 0 : googleOptions.serviceTier;
		const isGemmaModel = this.modelId.toLowerCase().startsWith("gemma-");
		const isGemini3Model2 = /^gemini-3[.-]/.test(this.modelId);
		const { contents, systemInstruction } = convertToGoogleMessages(prompt, {
			isGemmaModel,
			isGemini3Model: isGemini3Model2,
			onWarning: (warning) => warnings.push(warning),
			providerOptionsNames,
			supportsFunctionResponseParts: isGemini3Model2
		});
		const { tools: googleTools2, toolConfig: googleToolConfig, toolWarnings } = prepareTools({
			tools,
			toolChoice,
			modelId: this.modelId,
			isVertexProvider
		});
		const resolvedThinking = resolveThinkingConfig({
			reasoning,
			modelId: this.modelId,
			warnings
		});
		const thinkingConfig = (googleOptions == null ? void 0 : googleOptions.thinkingConfig) || resolvedThinking ? {
			...resolvedThinking,
			...googleOptions == null ? void 0 : googleOptions.thinkingConfig
		} : void 0;
		const streamFunctionCallArguments = isStreaming && isVertexProvider ? (_a = googleOptions == null ? void 0 : googleOptions.streamFunctionCallArguments) != null ? _a : false : void 0;
		const safetyThreshold = googleOptions == null ? void 0 : googleOptions.threshold;
		const safetySettings = (_b = googleOptions == null ? void 0 : googleOptions.safetySettings) != null ? _b : safetyThreshold != null ? configurableSafetySettingCategories.map((category) => ({
			category,
			threshold: safetyThreshold
		})) : void 0;
		const toolConfig = googleToolConfig || streamFunctionCallArguments || (googleOptions == null ? void 0 : googleOptions.retrievalConfig) ? {
			...googleToolConfig,
			...streamFunctionCallArguments && { functionCallingConfig: {
				...googleToolConfig == null ? void 0 : googleToolConfig.functionCallingConfig,
				streamFunctionCallArguments: true
			} },
			...(googleOptions == null ? void 0 : googleOptions.retrievalConfig) && { retrievalConfig: googleOptions.retrievalConfig }
		} : void 0;
		return {
			args: {
				generationConfig: {
					maxOutputTokens,
					temperature,
					topK,
					topP,
					frequencyPenalty,
					presencePenalty,
					stopSequences,
					seed,
					responseMimeType: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? "application/json" : void 0,
					responseSchema: (responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && ((_c = googleOptions == null ? void 0 : googleOptions.structuredOutputs) != null ? _c : true) ? convertJSONSchemaToOpenAPISchema(responseFormat.schema) : void 0,
					...(googleOptions == null ? void 0 : googleOptions.audioTimestamp) && { audioTimestamp: googleOptions.audioTimestamp },
					responseModalities: googleOptions == null ? void 0 : googleOptions.responseModalities,
					thinkingConfig,
					...(googleOptions == null ? void 0 : googleOptions.mediaResolution) && { mediaResolution: googleOptions.mediaResolution },
					...(googleOptions == null ? void 0 : googleOptions.imageConfig) && { imageConfig: googleOptions.imageConfig }
				},
				contents,
				systemInstruction: isGemmaModel ? void 0 : systemInstruction,
				safetySettings,
				tools: googleTools2,
				toolConfig,
				cachedContent: googleOptions == null ? void 0 : googleOptions.cachedContent,
				labels: googleOptions == null ? void 0 : googleOptions.labels,
				serviceTier: bodyServiceTier
			},
			warnings: [...warnings, ...toolWarnings],
			providerOptionsNames,
			extraHeaders: vertexPaygoHeaders
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
		const { args, warnings, providerOptionsNames, extraHeaders } = await this.getArgs(options);
		const wrapProviderMetadata = (payload) => Object.fromEntries(providerOptionsNames.map((name) => [name, payload]));
		const mergedHeaders = combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers, extraHeaders);
		const { responseHeaders, value: response, rawValue: rawResponse } = await postJsonToApi({
			url: `${this.config.baseURL}/${getModelPath(this.modelId)}:generateContent`,
			headers: mergedHeaders,
			body: args,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(responseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const candidate = response.candidates[0];
		const content = [];
		const parts = (_b = (_a = candidate.content) == null ? void 0 : _a.parts) != null ? _b : [];
		const usageMetadata = response.usageMetadata;
		let lastCodeExecutionToolCallId;
		let lastServerToolCallId;
		for (const part of parts) if ("executableCode" in part && ((_c = part.executableCode) == null ? void 0 : _c.code)) {
			const toolCallId = this.config.generateId();
			lastCodeExecutionToolCallId = toolCallId;
			content.push({
				type: "tool-call",
				toolCallId,
				toolName: "code_execution",
				input: JSON.stringify(part.executableCode),
				providerExecuted: true
			});
		} else if ("codeExecutionResult" in part && part.codeExecutionResult) {
			content.push({
				type: "tool-result",
				toolCallId: lastCodeExecutionToolCallId,
				toolName: "code_execution",
				result: {
					outcome: part.codeExecutionResult.outcome,
					output: (_d = part.codeExecutionResult.output) != null ? _d : ""
				}
			});
			lastCodeExecutionToolCallId = void 0;
		} else if ("text" in part && part.text != null) {
			const thoughtSignatureMetadata = part.thoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0;
			if (part.text.length === 0) {
				if (thoughtSignatureMetadata != null && content.length > 0) {
					const lastContent = content[content.length - 1];
					lastContent.providerMetadata = thoughtSignatureMetadata;
				}
			} else content.push({
				type: part.thought === true ? "reasoning" : "text",
				text: part.text,
				providerMetadata: thoughtSignatureMetadata
			});
		} else if ("functionCall" in part && part.functionCall.name != null) content.push({
			type: "tool-call",
			toolCallId: (_e = part.functionCall.id) != null ? _e : this.config.generateId(),
			toolName: part.functionCall.name,
			input: JSON.stringify((_f = part.functionCall.args) != null ? _f : {}),
			providerMetadata: part.thoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0
		});
		else if ("inlineData" in part) {
			const hasThought = part.thought === true;
			const hasThoughtSignature = !!part.thoughtSignature;
			content.push({
				type: hasThought ? "reasoning-file" : "file",
				data: {
					type: "data",
					data: part.inlineData.data
				},
				mediaType: part.inlineData.mimeType,
				providerMetadata: hasThoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0
			});
		} else if ("toolCall" in part && part.toolCall) {
			const toolCallId = (_g = part.toolCall.id) != null ? _g : this.config.generateId();
			lastServerToolCallId = toolCallId;
			content.push({
				type: "tool-call",
				toolCallId,
				toolName: `server:${part.toolCall.toolType}`,
				input: JSON.stringify((_h = part.toolCall.args) != null ? _h : {}),
				providerExecuted: true,
				dynamic: true,
				providerMetadata: part.thoughtSignature ? wrapProviderMetadata({
					thoughtSignature: part.thoughtSignature,
					serverToolCallId: toolCallId,
					serverToolType: part.toolCall.toolType
				}) : wrapProviderMetadata({
					serverToolCallId: toolCallId,
					serverToolType: part.toolCall.toolType
				})
			});
		} else if ("toolResponse" in part && part.toolResponse) {
			const responseToolCallId = (_i = lastServerToolCallId != null ? lastServerToolCallId : part.toolResponse.id) != null ? _i : this.config.generateId();
			content.push({
				type: "tool-result",
				toolCallId: responseToolCallId,
				toolName: `server:${part.toolResponse.toolType}`,
				result: (_j = part.toolResponse.response) != null ? _j : {},
				providerMetadata: part.thoughtSignature ? wrapProviderMetadata({
					thoughtSignature: part.thoughtSignature,
					serverToolCallId: responseToolCallId,
					serverToolType: part.toolResponse.toolType
				}) : wrapProviderMetadata({
					serverToolCallId: responseToolCallId,
					serverToolType: part.toolResponse.toolType
				})
			});
			lastServerToolCallId = void 0;
		}
		const sources = (_k = extractSources({
			groundingMetadata: candidate.groundingMetadata,
			generateId: this.config.generateId
		})) != null ? _k : [];
		for (const source of sources) content.push(source);
		return {
			content,
			finishReason: {
				unified: mapGoogleFinishReason({
					finishReason: candidate.finishReason,
					hasToolCalls: content.some((part) => part.type === "tool-call" && !part.providerExecuted)
				}),
				raw: (_l = candidate.finishReason) != null ? _l : void 0
			},
			usage: convertGoogleUsage(usageMetadata),
			warnings,
			providerMetadata: wrapProviderMetadata({
				promptFeedback: (_m = response.promptFeedback) != null ? _m : null,
				groundingMetadata: (_n = candidate.groundingMetadata) != null ? _n : null,
				urlContextMetadata: (_o = candidate.urlContextMetadata) != null ? _o : null,
				safetyRatings: (_p = candidate.safetyRatings) != null ? _p : null,
				usageMetadata: usageMetadata != null ? usageMetadata : null,
				finishMessage: (_q = candidate.finishMessage) != null ? _q : null,
				serviceTier: (_r = usageMetadata == null ? void 0 : usageMetadata.serviceTier) != null ? _r : null
			}),
			request: { body: args },
			response: {
				headers: responseHeaders,
				body: rawResponse
			}
		};
	}
	async doStream(options) {
		const { args, warnings, providerOptionsNames, extraHeaders } = await this.getArgs(options, { isStreaming: true });
		const wrapProviderMetadata = (payload) => Object.fromEntries(providerOptionsNames.map((name) => [name, payload]));
		const headers = combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers, extraHeaders);
		const { responseHeaders, value: response } = await postJsonToApi({
			url: `${this.config.baseURL}/${getModelPath(this.modelId)}:streamGenerateContent?alt=sse`,
			headers,
			body: args,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(chunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let finishReason = {
			unified: "other",
			raw: void 0
		};
		let usage = void 0;
		let providerMetadata = void 0;
		let lastGroundingMetadata = null;
		let lastUrlContextMetadata = null;
		const generateId2 = this.config.generateId;
		let hasToolCalls = false;
		let currentTextBlockId = null;
		let currentReasoningBlockId = null;
		let blockCounter = 0;
		const emittedSourceUrls = /* @__PURE__ */ new Set();
		let lastCodeExecutionToolCallId;
		let lastServerToolCallId;
		const activeStreamingToolCalls = [];
		const finishActiveStreamingToolCall = (controller) => {
			const active = activeStreamingToolCalls.pop();
			if (active == null) return;
			const { finalJSON, closingDelta } = active.accumulator.finalize();
			if (closingDelta.length > 0) controller.enqueue({
				type: "tool-input-delta",
				id: active.toolCallId,
				delta: closingDelta,
				providerMetadata: active.providerMetadata
			});
			controller.enqueue({
				type: "tool-input-end",
				id: active.toolCallId,
				providerMetadata: active.providerMetadata
			});
			controller.enqueue({
				type: "tool-call",
				toolCallId: active.toolCallId,
				toolName: active.toolName,
				input: finalJSON,
				providerMetadata: active.providerMetadata
			});
			hasToolCalls = true;
		};
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const value = chunk.value;
					const usageMetadata = value.usageMetadata;
					if (usageMetadata != null) usage = usageMetadata;
					const candidate = (_a = value.candidates) == null ? void 0 : _a[0];
					if (candidate == null) return;
					const content = candidate.content;
					if (candidate.groundingMetadata != null) lastGroundingMetadata = candidate.groundingMetadata;
					if (candidate.urlContextMetadata != null) lastUrlContextMetadata = candidate.urlContextMetadata;
					const sources = extractSources({
						groundingMetadata: candidate.groundingMetadata,
						generateId: generateId2
					});
					if (sources != null) {
						for (const source of sources) if (source.sourceType === "url" && !emittedSourceUrls.has(source.url)) {
							emittedSourceUrls.add(source.url);
							controller.enqueue(source);
						}
					}
					if (content != null) {
						const parts = (_b = content.parts) != null ? _b : [];
						for (const part of parts) if ("executableCode" in part && ((_c = part.executableCode) == null ? void 0 : _c.code)) {
							const toolCallId = generateId2();
							lastCodeExecutionToolCallId = toolCallId;
							controller.enqueue({
								type: "tool-call",
								toolCallId,
								toolName: "code_execution",
								input: JSON.stringify(part.executableCode),
								providerExecuted: true
							});
						} else if ("codeExecutionResult" in part && part.codeExecutionResult) {
							const toolCallId = lastCodeExecutionToolCallId;
							if (toolCallId) {
								controller.enqueue({
									type: "tool-result",
									toolCallId,
									toolName: "code_execution",
									result: {
										outcome: part.codeExecutionResult.outcome,
										output: (_d = part.codeExecutionResult.output) != null ? _d : ""
									}
								});
								lastCodeExecutionToolCallId = void 0;
							}
						} else if ("text" in part && part.text != null) {
							const thoughtSignatureMetadata = part.thoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0;
							if (part.text.length === 0) {
								if (thoughtSignatureMetadata != null && currentTextBlockId !== null) controller.enqueue({
									type: "text-delta",
									id: currentTextBlockId,
									delta: "",
									providerMetadata: thoughtSignatureMetadata
								});
							} else if (part.thought === true) {
								if (currentTextBlockId !== null) {
									controller.enqueue({
										type: "text-end",
										id: currentTextBlockId
									});
									currentTextBlockId = null;
								}
								if (currentReasoningBlockId === null) {
									currentReasoningBlockId = String(blockCounter++);
									controller.enqueue({
										type: "reasoning-start",
										id: currentReasoningBlockId,
										providerMetadata: thoughtSignatureMetadata
									});
								}
								controller.enqueue({
									type: "reasoning-delta",
									id: currentReasoningBlockId,
									delta: part.text,
									providerMetadata: thoughtSignatureMetadata
								});
							} else {
								if (currentReasoningBlockId !== null) {
									controller.enqueue({
										type: "reasoning-end",
										id: currentReasoningBlockId
									});
									currentReasoningBlockId = null;
								}
								if (currentTextBlockId === null) {
									currentTextBlockId = String(blockCounter++);
									controller.enqueue({
										type: "text-start",
										id: currentTextBlockId,
										providerMetadata: thoughtSignatureMetadata
									});
								}
								controller.enqueue({
									type: "text-delta",
									id: currentTextBlockId,
									delta: part.text,
									providerMetadata: thoughtSignatureMetadata
								});
							}
						} else if ("inlineData" in part) {
							if (currentTextBlockId !== null) {
								controller.enqueue({
									type: "text-end",
									id: currentTextBlockId
								});
								currentTextBlockId = null;
							}
							if (currentReasoningBlockId !== null) {
								controller.enqueue({
									type: "reasoning-end",
									id: currentReasoningBlockId
								});
								currentReasoningBlockId = null;
							}
							const hasThought = part.thought === true;
							const fileMeta = !!part.thoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0;
							controller.enqueue({
								type: hasThought ? "reasoning-file" : "file",
								mediaType: part.inlineData.mimeType,
								data: {
									type: "data",
									data: part.inlineData.data
								},
								providerMetadata: fileMeta
							});
						} else if ("toolCall" in part && part.toolCall) {
							const toolCallId = (_e = part.toolCall.id) != null ? _e : generateId2();
							lastServerToolCallId = toolCallId;
							const serverMeta = wrapProviderMetadata({
								...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
								serverToolCallId: toolCallId,
								serverToolType: part.toolCall.toolType
							});
							controller.enqueue({
								type: "tool-call",
								toolCallId,
								toolName: `server:${part.toolCall.toolType}`,
								input: JSON.stringify((_f = part.toolCall.args) != null ? _f : {}),
								providerExecuted: true,
								dynamic: true,
								providerMetadata: serverMeta
							});
						} else if ("toolResponse" in part && part.toolResponse) {
							const responseToolCallId = (_g = lastServerToolCallId != null ? lastServerToolCallId : part.toolResponse.id) != null ? _g : generateId2();
							const serverMeta = wrapProviderMetadata({
								...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
								serverToolCallId: responseToolCallId,
								serverToolType: part.toolResponse.toolType
							});
							controller.enqueue({
								type: "tool-result",
								toolCallId: responseToolCallId,
								toolName: `server:${part.toolResponse.toolType}`,
								result: (_h = part.toolResponse.response) != null ? _h : {},
								providerMetadata: serverMeta
							});
							lastServerToolCallId = void 0;
						}
						for (const part of parts) {
							if (!("functionCall" in part)) continue;
							const providerMeta = part.thoughtSignature ? wrapProviderMetadata({ thoughtSignature: part.thoughtSignature }) : void 0;
							const isStreamingChunk = part.functionCall.partialArgs != null || part.functionCall.name != null && part.functionCall.willContinue === true;
							const isTerminalChunk = part.functionCall.name == null && part.functionCall.args == null && part.functionCall.partialArgs == null && part.functionCall.willContinue == null;
							const isCompleteCall = part.functionCall.name != null && part.functionCall.args != null && part.functionCall.partialArgs == null;
							const isNoArgsCompleteCall = part.functionCall.name != null && part.functionCall.args == null && part.functionCall.partialArgs == null && part.functionCall.willContinue !== true;
							if (isStreamingChunk) {
								if (part.functionCall.name != null) {
									const toolCallId = (_i = part.functionCall.id) != null ? _i : generateId2();
									const accumulator = new GoogleJSONAccumulator();
									activeStreamingToolCalls.push({
										toolCallId,
										toolName: part.functionCall.name,
										accumulator,
										providerMetadata: providerMeta
									});
									controller.enqueue({
										type: "tool-input-start",
										id: toolCallId,
										toolName: part.functionCall.name,
										providerMetadata: providerMeta
									});
									if (part.functionCall.partialArgs != null) {
										const partialArgs = part.functionCall.partialArgs;
										const { textDelta } = accumulator.processPartialArgs(partialArgs);
										if (textDelta.length > 0) controller.enqueue({
											type: "tool-input-delta",
											id: toolCallId,
											delta: textDelta,
											providerMetadata: providerMeta
										});
										if (part.functionCall.willContinue !== true && partialArgs.every((arg) => arg.willContinue !== true)) finishActiveStreamingToolCall(controller);
									}
								} else if (part.functionCall.partialArgs != null && activeStreamingToolCalls.length > 0) {
									const active = activeStreamingToolCalls[activeStreamingToolCalls.length - 1];
									const partialArgs = part.functionCall.partialArgs;
									const { textDelta } = active.accumulator.processPartialArgs(partialArgs);
									if (textDelta.length > 0) controller.enqueue({
										type: "tool-input-delta",
										id: active.toolCallId,
										delta: textDelta,
										providerMetadata: providerMeta
									});
									if (part.functionCall.willContinue !== true && partialArgs.every((arg) => arg.willContinue !== true)) finishActiveStreamingToolCall(controller);
								}
							} else if (isTerminalChunk && activeStreamingToolCalls.length > 0) finishActiveStreamingToolCall(controller);
							else if (isCompleteCall) {
								const toolCallId = (_j = part.functionCall.id) != null ? _j : generateId2();
								const toolName = part.functionCall.name;
								const args2 = typeof part.functionCall.args === "string" ? part.functionCall.args : JSON.stringify((_k = part.functionCall.args) != null ? _k : {});
								controller.enqueue({
									type: "tool-input-start",
									id: toolCallId,
									toolName,
									providerMetadata: providerMeta
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: toolCallId,
									delta: args2,
									providerMetadata: providerMeta
								});
								controller.enqueue({
									type: "tool-input-end",
									id: toolCallId,
									providerMetadata: providerMeta
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId,
									toolName,
									input: args2,
									providerMetadata: providerMeta
								});
								hasToolCalls = true;
							} else if (isNoArgsCompleteCall) {
								const toolCallId = (_l = part.functionCall.id) != null ? _l : generateId2();
								const toolName = part.functionCall.name;
								controller.enqueue({
									type: "tool-input-start",
									id: toolCallId,
									toolName,
									providerMetadata: providerMeta
								});
								controller.enqueue({
									type: "tool-input-end",
									id: toolCallId,
									providerMetadata: providerMeta
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId,
									toolName,
									input: "{}",
									providerMetadata: providerMeta
								});
								hasToolCalls = true;
							}
						}
					}
					if (candidate.finishReason != null) {
						finishReason = {
							unified: mapGoogleFinishReason({
								finishReason: candidate.finishReason,
								hasToolCalls
							}),
							raw: candidate.finishReason
						};
						providerMetadata = wrapProviderMetadata({
							promptFeedback: (_m = value.promptFeedback) != null ? _m : null,
							groundingMetadata: lastGroundingMetadata,
							urlContextMetadata: lastUrlContextMetadata,
							safetyRatings: (_n = candidate.safetyRatings) != null ? _n : null,
							usageMetadata: usageMetadata != null ? usageMetadata : null,
							finishMessage: (_o = candidate.finishMessage) != null ? _o : null,
							serviceTier: (_p = usage == null ? void 0 : usage.serviceTier) != null ? _p : null
						});
					}
				},
				flush(controller) {
					if (currentTextBlockId !== null) controller.enqueue({
						type: "text-end",
						id: currentTextBlockId
					});
					if (currentReasoningBlockId !== null) controller.enqueue({
						type: "reasoning-end",
						id: currentReasoningBlockId
					});
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: convertGoogleUsage(usage),
						providerMetadata
					});
				}
			})),
			response: { headers: responseHeaders },
			request: { body: args }
		};
	}
};
function isGemini3Model(modelId) {
	return /gemini-3[\.\-]/i.test(modelId) || /gemini-3$/i.test(modelId);
}
function getMaxOutputTokensForGemini25Model() {
	return 65536;
}
function getMaxThinkingTokensForGemini25Model(modelId) {
	const id = modelId.toLowerCase();
	if (id.includes("2.5-pro") || id.includes("gemini-3-pro-image")) return 32768;
	return 24576;
}
function resolveThinkingConfig({ reasoning, modelId, warnings }) {
	if (!isCustomReasoning(reasoning)) return;
	if (isGemini3Model(modelId) && !modelId.includes("gemini-3-pro-image")) return resolveGemini3ThinkingConfig({
		reasoning,
		warnings
	});
	return resolveGemini25ThinkingConfig({
		reasoning,
		modelId,
		warnings
	});
}
function resolveGemini3ThinkingConfig({ reasoning, warnings }) {
	if (reasoning === "none") return { thinkingLevel: "minimal" };
	const thinkingLevel = mapReasoningToProviderEffort({
		reasoning,
		effortMap: {
			minimal: "minimal",
			low: "low",
			medium: "medium",
			high: "high",
			xhigh: "high"
		},
		warnings
	});
	if (thinkingLevel == null) return;
	return { thinkingLevel };
}
function resolveGemini25ThinkingConfig({ reasoning, modelId, warnings }) {
	if (reasoning === "none") return { thinkingBudget: 0 };
	const thinkingBudget = mapReasoningToProviderBudget({
		reasoning,
		maxOutputTokens: getMaxOutputTokensForGemini25Model(),
		maxReasoningBudget: getMaxThinkingTokensForGemini25Model(modelId),
		minReasoningBudget: 0,
		warnings
	});
	if (thinkingBudget == null) return;
	return { thinkingBudget };
}
function extractSources({ groundingMetadata, generateId: generateId2 }) {
	var _a, _b, _c, _d, _e, _f;
	if (!(groundingMetadata == null ? void 0 : groundingMetadata.groundingChunks)) return;
	const sources = [];
	for (const chunk of groundingMetadata.groundingChunks) if (chunk.web != null) sources.push({
		type: "source",
		sourceType: "url",
		id: generateId2(),
		url: chunk.web.uri,
		title: (_a = chunk.web.title) != null ? _a : void 0
	});
	else if (chunk.image != null) sources.push({
		type: "source",
		sourceType: "url",
		id: generateId2(),
		url: chunk.image.sourceUri,
		title: (_b = chunk.image.title) != null ? _b : void 0
	});
	else if (chunk.retrievedContext != null) {
		const uri = chunk.retrievedContext.uri;
		const fileSearchStore = chunk.retrievedContext.fileSearchStore;
		if (uri && (uri.startsWith("http://") || uri.startsWith("https://"))) sources.push({
			type: "source",
			sourceType: "url",
			id: generateId2(),
			url: uri,
			title: (_c = chunk.retrievedContext.title) != null ? _c : void 0
		});
		else if (uri) {
			const title = (_d = chunk.retrievedContext.title) != null ? _d : "Unknown Document";
			let mediaType = "application/octet-stream";
			let filename = void 0;
			if (uri.endsWith(".pdf")) {
				mediaType = "application/pdf";
				filename = uri.split("/").pop();
			} else if (uri.endsWith(".txt")) {
				mediaType = "text/plain";
				filename = uri.split("/").pop();
			} else if (uri.endsWith(".docx")) {
				mediaType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
				filename = uri.split("/").pop();
			} else if (uri.endsWith(".doc")) {
				mediaType = "application/msword";
				filename = uri.split("/").pop();
			} else if (uri.match(/\.(md|markdown)$/)) {
				mediaType = "text/markdown";
				filename = uri.split("/").pop();
			} else filename = uri.split("/").pop();
			sources.push({
				type: "source",
				sourceType: "document",
				id: generateId2(),
				mediaType,
				title,
				filename
			});
		} else if (fileSearchStore) {
			const title = (_e = chunk.retrievedContext.title) != null ? _e : "Unknown Document";
			sources.push({
				type: "source",
				sourceType: "document",
				id: generateId2(),
				mediaType: "application/octet-stream",
				title,
				filename: fileSearchStore.split("/").pop()
			});
		}
	} else if (chunk.maps != null) {
		if (chunk.maps.uri) sources.push({
			type: "source",
			sourceType: "url",
			id: generateId2(),
			url: chunk.maps.uri,
			title: (_f = chunk.maps.title) != null ? _f : void 0
		});
	}
	return sources.length > 0 ? sources : void 0;
}
var getGroundingMetadataSchema = () => object({
	webSearchQueries: array(string()).nullish(),
	imageSearchQueries: array(string()).nullish(),
	retrievalQueries: array(string()).nullish(),
	searchEntryPoint: object({ renderedContent: string() }).nullish(),
	groundingChunks: array(object({
		web: object({
			uri: string(),
			title: string().nullish()
		}).nullish(),
		image: object({
			sourceUri: string(),
			imageUri: string(),
			title: string().nullish(),
			domain: string().nullish()
		}).nullish(),
		retrievedContext: object({
			uri: string().nullish(),
			title: string().nullish(),
			text: string().nullish(),
			fileSearchStore: string().nullish()
		}).nullish(),
		maps: object({
			uri: string().nullish(),
			title: string().nullish(),
			text: string().nullish(),
			placeId: string().nullish()
		}).nullish()
	})).nullish(),
	groundingSupports: array(object({
		segment: object({
			startIndex: number().nullish(),
			endIndex: number().nullish(),
			text: string().nullish()
		}).nullish(),
		segment_text: string().nullish(),
		groundingChunkIndices: array(number()).nullish(),
		supportChunkIndices: array(number()).nullish(),
		confidenceScores: array(number()).nullish(),
		confidenceScore: array(number()).nullish()
	})).nullish(),
	retrievalMetadata: union([object({ webDynamicRetrievalScore: number() }), object({})]).nullish()
});
var partialArgSchema = object({
	jsonPath: string(),
	stringValue: string().nullish(),
	numberValue: number().nullish(),
	boolValue: boolean().nullish(),
	nullValue: unknown().nullish(),
	willContinue: boolean().nullish()
});
var getContentSchema = () => object({ parts: array(union([
	object({
		functionCall: object({
			id: string().nullish(),
			name: string().nullish(),
			args: unknown().nullish(),
			partialArgs: array(partialArgSchema).nullish(),
			willContinue: boolean().nullish()
		}),
		thoughtSignature: string().nullish()
	}),
	object({
		inlineData: object({
			mimeType: string(),
			data: string()
		}),
		thought: boolean().nullish(),
		thoughtSignature: string().nullish()
	}),
	object({
		toolCall: object({
			toolType: string(),
			args: unknown().nullish(),
			id: string()
		}),
		thoughtSignature: string().nullish()
	}),
	object({
		toolResponse: object({
			toolType: string(),
			response: unknown().nullish(),
			id: string()
		}),
		thoughtSignature: string().nullish()
	}),
	object({
		executableCode: object({
			language: string(),
			code: string()
		}).nullish(),
		codeExecutionResult: object({
			outcome: string(),
			output: string().nullish()
		}).nullish(),
		text: string().nullish(),
		thought: boolean().nullish(),
		thoughtSignature: string().nullish()
	})
])).nullish() });
var getSafetyRatingSchema = () => object({
	category: string().nullish(),
	probability: string().nullish(),
	probabilityScore: number().nullish(),
	severity: string().nullish(),
	severityScore: number().nullish(),
	blocked: boolean().nullish()
});
var tokenDetailsSchema = array(object({
	modality: string(),
	tokenCount: number()
})).nullish();
var usageSchema = object({
	cachedContentTokenCount: number().nullish(),
	thoughtsTokenCount: number().nullish(),
	promptTokenCount: number().nullish(),
	candidatesTokenCount: number().nullish(),
	totalTokenCount: number().nullish(),
	trafficType: string().nullish(),
	serviceTier: string().nullish(),
	promptTokensDetails: tokenDetailsSchema,
	candidatesTokensDetails: tokenDetailsSchema
});
var getUrlContextMetadataSchema = () => object({ urlMetadata: array(object({
	retrievedUrl: string(),
	urlRetrievalStatus: string()
})).nullish() });
var responseSchema = lazySchema(() => zodSchema(object({
	candidates: array(object({
		content: getContentSchema().nullish().or(object({}).strict()),
		finishReason: string().nullish(),
		finishMessage: string().nullish(),
		safetyRatings: array(getSafetyRatingSchema()).nullish(),
		groundingMetadata: getGroundingMetadataSchema().nullish(),
		urlContextMetadata: getUrlContextMetadataSchema().nullish()
	})),
	usageMetadata: usageSchema.nullish(),
	promptFeedback: object({
		blockReason: string().nullish(),
		safetyRatings: array(getSafetyRatingSchema()).nullish()
	}).nullish()
})));
var chunkSchema = lazySchema(() => zodSchema(object({
	candidates: array(object({
		content: getContentSchema().nullish(),
		finishReason: string().nullish(),
		finishMessage: string().nullish(),
		safetyRatings: array(getSafetyRatingSchema()).nullish(),
		groundingMetadata: getGroundingMetadataSchema().nullish(),
		urlContextMetadata: getUrlContextMetadataSchema().nullish()
	})).nullish(),
	usageMetadata: usageSchema.nullish(),
	promptFeedback: object({
		blockReason: string().nullish(),
		safetyRatings: array(getSafetyRatingSchema()).nullish()
	}).nullish()
})));
var googleSpeechResponseSchema = lazySchema(() => zodSchema(object({ candidates: array(object({ content: object({ parts: array(object({ inlineData: object({
	mimeType: string().nullish(),
	data: string().nullish()
}).nullish() })).nullish() }).nullish() })).nullish() })));
var voiceConfigSchema = object({ prebuiltVoiceConfig: object({ voiceName: string() }) });
var googleSpeechProviderOptionsSchema = lazySchema(() => zodSchema(object({ 
/**
* Multi-speaker configuration for dialogue audio. When provided, this
* overrides the top-level `voice`. The Gemini TTS API supports up to two
* speakers; each speaker name must match a name used in the input text.
*
* https://ai.google.dev/gemini-api/docs/speech-generation#multi-speaker
*/
multiSpeakerVoiceConfig: object({ speakerVoiceConfigs: array(object({
	speaker: string(),
	voiceConfig: voiceConfigSchema
})) }).optional() })));
var DEFAULT_VOICE = "Kore";
var DEFAULT_SAMPLE_RATE = 24e3;
var GoogleSpeechModel = class _GoogleSpeechModel {
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GoogleSpeechModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	async getArgs({ text, voice = DEFAULT_VOICE, outputFormat, instructions, speed, language, providerOptions }) {
		const warnings = [];
		const providerOptionsNames = this.config.provider.includes("vertex") ? ["googleVertex", "vertex"] : ["google"];
		let googleOptions;
		for (const name of providerOptionsNames) {
			googleOptions = await parseProviderOptions({
				provider: name,
				providerOptions,
				schema: googleSpeechProviderOptionsSchema
			});
			if (googleOptions != null) break;
		}
		if (googleOptions == null && !providerOptionsNames.includes("google")) googleOptions = await parseProviderOptions({
			provider: "google",
			providerOptions,
			schema: googleSpeechProviderOptionsSchema
		});
		const multiSpeakerVoiceConfig = googleOptions == null ? void 0 : googleOptions.multiSpeakerVoiceConfig;
		const speechConfig = multiSpeakerVoiceConfig ? { multiSpeakerVoiceConfig } : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } };
		let promptText = text;
		if (instructions != null) if (multiSpeakerVoiceConfig) warnings.push({
			type: "unsupported",
			feature: "instructions",
			details: "Google Gemini TTS ignores `instructions` when `multiSpeakerVoiceConfig` is set, because prepending them would break multi-speaker transcript parsing."
		});
		else promptText = `${instructions}: ${text}`;
		if (speed != null) warnings.push({
			type: "unsupported",
			feature: "speed",
			details: "Google Gemini TTS models do not support the `speed` option. It was ignored."
		});
		if (language != null) warnings.push({
			type: "unsupported",
			feature: "language",
			details: "Google Gemini TTS models do not support the `language` option. Language is detected automatically from the input text."
		});
		let resolvedOutputFormat = "wav";
		if (outputFormat === "pcm") resolvedOutputFormat = "pcm";
		else if (outputFormat != null && outputFormat !== "wav") warnings.push({
			type: "unsupported",
			feature: "outputFormat",
			details: `Unsupported output format: ${outputFormat}. Using wav instead.`
		});
		return {
			requestBody: {
				contents: [{
					role: "user",
					parts: [{ text: promptText }]
				}],
				generationConfig: {
					responseModalities: ["AUDIO"],
					speechConfig
				}
			},
			warnings,
			outputFormat: resolvedOutputFormat
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i;
		const currentDate = (_c = (_b = (_a = this.config._internal) == null ? void 0 : _a.currentDate) == null ? void 0 : _b.call(_a)) != null ? _c : /* @__PURE__ */ new Date();
		const { requestBody, warnings, outputFormat } = await this.getArgs(options);
		const { value: response, responseHeaders, rawValue: rawResponse } = await postJsonToApi({
			url: `${this.config.baseURL}/models/${this.modelId}:generateContent`,
			headers: combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers),
			body: requestBody,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleSpeechResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let base64Audio;
		let mimeType;
		for (const candidate of (_d = response.candidates) != null ? _d : []) {
			for (const part of (_f = (_e = candidate.content) == null ? void 0 : _e.parts) != null ? _f : []) if ((_g = part.inlineData) == null ? void 0 : _g.data) {
				base64Audio = part.inlineData.data;
				mimeType = (_h = part.inlineData.mimeType) != null ? _h : void 0;
				break;
			}
			if (base64Audio != null) break;
		}
		const sampleRate = (_i = parseSampleRate(mimeType)) != null ? _i : DEFAULT_SAMPLE_RATE;
		const pcm = base64Audio != null ? convertBase64ToUint8Array(base64Audio) : /* @__PURE__ */ new Uint8Array(0);
		const audio = outputFormat === "pcm" || pcm.length === 0 ? pcm : addWavHeader(pcm, sampleRate);
		if (outputFormat === "pcm" && pcm.length > 0) warnings.push({
			type: "unsupported",
			feature: "outputFormat",
			details: `Returning raw PCM audio (signed 16-bit little-endian, mono, ${sampleRate} Hz). These bytes have no container header and are not directly playable; see providerMetadata.google for the sample rate and mime type.`
		});
		return {
			audio,
			warnings,
			request: { body: JSON.stringify(requestBody) },
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders,
				body: rawResponse
			},
			providerMetadata: { google: {
				sampleRate,
				mimeType: mimeType != null ? mimeType : null
			} }
		};
	}
};
function parseSampleRate(mimeType) {
	if (mimeType == null) return;
	const match = /rate=(\d+)/.exec(mimeType);
	return match ? Number.parseInt(match[1], 10) : void 0;
}
function addWavHeader(pcm, sampleRate) {
	const numChannels = 1;
	const bitsPerSample = 16;
	const blockAlign = numChannels * bitsPerSample / 8;
	const byteRate = sampleRate * blockAlign;
	const dataSize = pcm.length;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	writeAscii(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeAscii(view, 8, "WAVE");
	writeAscii(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeAscii(view, 36, "data");
	view.setUint32(40, dataSize, true);
	const out = new Uint8Array(buffer);
	out.set(pcm, 44);
	return out;
}
function writeAscii(view, offset, text) {
	for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
var codeExecution = createProviderExecutedToolFactory({
	id: "google.code_execution",
	inputSchema: object({
		language: string().describe("The programming language of the code."),
		code: string().describe("The code to be executed.")
	}),
	outputSchema: object({
		outcome: string().describe("The outcome of the execution (e.g., \"OUTCOME_OK\")."),
		output: string().describe("The output from the code execution.")
	})
});
var enterpriseWebSearch = createProviderExecutedToolFactory({
	id: "google.enterprise_web_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: lazySchema(() => zodSchema(object({})))
});
looseObject({
	/** The names of the file_search_stores to retrieve from.
	*  Example: `fileSearchStores/my-file-search-store-123`
	*/
	fileSearchStoreNames: array(string()).describe("The names of the file_search_stores to retrieve from. Example: `fileSearchStores/my-file-search-store-123`"),
	/** The number of file search retrieval chunks to retrieve. */
	topK: number().int().positive().describe("The number of file search retrieval chunks to retrieve.").optional(),
	/** Metadata filter to apply to the file search retrieval documents.
	*  See https://google.aip.dev/160 for the syntax of the filter expression.
	*/
	metadataFilter: string().describe("Metadata filter to apply to the file search retrieval documents. See https://google.aip.dev/160 for the syntax of the filter expression.").optional()
});
var fileSearch = createProviderExecutedToolFactory({
	id: "google.file_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: lazySchema(() => zodSchema(object({})))
});
var googleMaps = createProviderExecutedToolFactory({
	id: "google.google_maps",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: lazySchema(() => zodSchema(object({})))
});
looseObject({
	searchTypes: object({
		webSearch: object({}).optional(),
		imageSearch: object({}).optional()
	}).optional(),
	timeRangeFilter: object({
		startTime: string(),
		endTime: string()
	}).optional()
});
var googleTools = {
	/**
	* Creates a Google search tool that gives Google direct access to real-time web content.
	* Must have name "google_search".
	*/
	googleSearch: createProviderExecutedToolFactory({
		id: "google.google_search",
		inputSchema: lazySchema(() => zodSchema(object({}))),
		outputSchema: lazySchema(() => zodSchema(object({})))
	}),
	/**
	* Creates an Enterprise Web Search tool for grounding responses using a compliance-focused web index.
	* Designed for highly-regulated industries (finance, healthcare, public sector).
	* Does not log customer data and supports VPC service controls.
	* Must have name "enterprise_web_search".
	*
	* @note Only available on Vertex AI. Requires Gemini 2.0 or newer.
	*
	* @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise
	*/
	enterpriseWebSearch,
	/**
	* Creates a Google Maps grounding tool that gives the model access to Google Maps data.
	* Must have name "google_maps".
	*
	* @see https://ai.google.dev/gemini-api/docs/maps-grounding
	* @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
	*/
	googleMaps,
	/**
	* Creates a URL context tool that gives Google direct access to real-time web content.
	* Must have name "url_context".
	*/
	urlContext: createProviderExecutedToolFactory({
		id: "google.url_context",
		inputSchema: lazySchema(() => zodSchema(object({}))),
		outputSchema: lazySchema(() => zodSchema(object({})))
	}),
	/**
	* Enables Retrieval Augmented Generation (RAG) via the Gemini File Search tool.
	* Must have name "file_search".
	*
	* @param fileSearchStoreNames - Fully-qualified File Search store resource names.
	* @param metadataFilter - Optional filter expression to restrict the files that can be retrieved.
	* @param topK - Optional result limit for the number of chunks returned from File Search.
	*
	* @see https://ai.google.dev/gemini-api/docs/file-search
	*/
	fileSearch,
	/**
	* A tool that enables the model to generate and run Python code.
	* Must have name "code_execution".
	*
	* @note Ensure the selected model supports Code Execution.
	* Multi-tool usage with the code execution tool is typically compatible with Gemini >=2 models.
	*
	* @see https://ai.google.dev/gemini-api/docs/code-execution (Google AI)
	* @see https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/code-execution-api (Vertex AI)
	*/
	codeExecution,
	/**
	* Creates a Vertex RAG Store tool that enables the model to perform RAG searches against a Vertex RAG Store.
	* Must have name "vertex_rag_store".
	*/
	vertexRagStore: createProviderExecutedToolFactory({
		id: "google.vertex_rag_store",
		inputSchema: lazySchema(() => zodSchema(object({}))),
		outputSchema: lazySchema(() => zodSchema(object({})))
	})
};
function convertGoogleInteractionsUsage(usage) {
	var _a, _b, _c, _d, _e, _f, _g, _h;
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
	const totalInput = (_a = usage.total_input_tokens) != null ? _a : 0;
	const totalOutput = (_b = usage.total_output_tokens) != null ? _b : 0;
	const totalThought = (_c = usage.total_thought_tokens) != null ? _c : 0;
	const totalCached = (_d = usage.total_cached_tokens) != null ? _d : 0;
	return {
		inputTokens: {
			total: (_e = usage.total_input_tokens) != null ? _e : void 0,
			noCache: usage.total_input_tokens == null ? void 0 : totalInput - totalCached,
			cacheRead: (_f = usage.total_cached_tokens) != null ? _f : void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.total_output_tokens == null && usage.total_thought_tokens == null ? void 0 : totalOutput + totalThought,
			text: (_g = usage.total_output_tokens) != null ? _g : void 0,
			reasoning: (_h = usage.total_thought_tokens) != null ? _h : void 0
		},
		raw: usage
	};
}
function getGoogleInteractionsOutputTokensByModality(usage) {
	const byModality = usage == null ? void 0 : usage.output_tokens_by_modality;
	if (byModality == null) return;
	const result = {};
	for (const entry of byModality) if ((entry == null ? void 0 : entry.modality) != null && entry.tokens != null) result[entry.modality] = entry.tokens;
	return Object.keys(result).length > 0 ? result : void 0;
}
var KNOWN_DOC_EXTENSIONS = {
	pdf: "application/pdf",
	txt: "text/plain",
	md: "text/markdown",
	markdown: "text/markdown",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};
function inferDocMediaType(uriOrName) {
	const lower = uriOrName.toLowerCase();
	for (const [ext, media] of Object.entries(KNOWN_DOC_EXTENSIONS)) if (lower.endsWith(`.${ext}`)) return media;
	return "application/octet-stream";
}
function basename(uriOrName) {
	const parts = uriOrName.split("/");
	const last = parts[parts.length - 1];
	return last && last.length > 0 ? last : void 0;
}
function annotationToSource({ annotation, generateId: generateId2 }) {
	var _a, _b, _c, _d, _e;
	switch (annotation.type) {
		case "url_citation": {
			const urlCitation = annotation;
			if (urlCitation.url == null || urlCitation.url.length === 0) return;
			return {
				type: "source",
				sourceType: "url",
				id: generateId2(),
				url: urlCitation.url,
				...urlCitation.title != null ? { title: urlCitation.title } : {}
			};
		}
		case "file_citation": {
			const fileCitation = annotation;
			const uri = (_b = (_a = fileCitation.url) != null ? _a : fileCitation.document_uri) != null ? _b : fileCitation.file_name;
			if (uri == null || uri.length === 0) return void 0;
			if (uri.startsWith("http://") || uri.startsWith("https://")) return {
				type: "source",
				sourceType: "url",
				id: generateId2(),
				url: uri,
				...fileCitation.file_name != null ? { title: fileCitation.file_name } : {}
			};
			const filename = (_c = fileCitation.file_name) != null ? _c : basename(uri);
			const mediaType = inferDocMediaType(uri);
			return {
				type: "source",
				sourceType: "document",
				id: generateId2(),
				mediaType,
				title: (_e = (_d = fileCitation.file_name) != null ? _d : filename) != null ? _e : uri,
				...filename != null ? { filename } : {}
			};
		}
		case "place_citation": {
			const placeCitation = annotation;
			if (placeCitation.url == null || placeCitation.url.length === 0) return;
			return {
				type: "source",
				sourceType: "url",
				id: generateId2(),
				url: placeCitation.url,
				...placeCitation.name != null ? { title: placeCitation.name } : {}
			};
		}
		default: return;
	}
}
function builtinToolResultToSources({ block, generateId: generateId2 }) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
	const sources = [];
	switch (block.type) {
		case "url_context_result": {
			const result = (_a = block.result) != null ? _a : [];
			for (const entry of result) {
				if ((entry == null ? void 0 : entry.url) == null || entry.url.length === 0) continue;
				if (entry.status != null && entry.status !== "success") continue;
				sources.push({
					type: "source",
					sourceType: "url",
					id: generateId2(),
					url: entry.url
				});
			}
			break;
		}
		case "google_search_result": {
			const result = (_b = block.result) != null ? _b : [];
			for (const entry of result) {
				const url = entry == null ? void 0 : entry.url;
				if (url == null || url.length === 0) continue;
				sources.push({
					type: "source",
					sourceType: "url",
					id: generateId2(),
					url,
					...entry.title != null ? { title: entry.title } : {}
				});
			}
			break;
		}
		case "google_maps_result": {
			const result = (_c = block.result) != null ? _c : [];
			for (const entry of result) for (const place of (_d = entry.places) != null ? _d : []) {
				if (place.url == null || place.url.length === 0) continue;
				sources.push({
					type: "source",
					sourceType: "url",
					id: generateId2(),
					url: place.url,
					...place.name != null ? { title: place.name } : {}
				});
			}
			break;
		}
		case "file_search_result": {
			const result = (_e = block.result) != null ? _e : [];
			for (const raw of result) {
				if (raw == null || typeof raw !== "object") continue;
				const entry = raw;
				const uri = (_g = (_f = entry.url) != null ? _f : entry.document_uri) != null ? _g : entry.file_name;
				if (uri == null || uri.length === 0) continue;
				if (uri.startsWith("http://") || uri.startsWith("https://")) {
					sources.push({
						type: "source",
						sourceType: "url",
						id: generateId2(),
						url: uri,
						...entry.title != null ? { title: entry.title } : {}
					});
					continue;
				}
				const filename = (_h = entry.file_name) != null ? _h : basename(uri);
				const mediaType = inferDocMediaType(uri);
				sources.push({
					type: "source",
					sourceType: "document",
					id: generateId2(),
					mediaType,
					title: (_k = (_j = (_i = entry.title) != null ? _i : entry.file_name) != null ? _j : filename) != null ? _k : uri,
					...filename != null ? { filename } : {}
				});
			}
			break;
		}
		default: break;
	}
	return sources;
}
function annotationsToSources({ annotations, generateId: generateId2 }) {
	var _a;
	if (annotations == null) return [];
	const seen = /* @__PURE__ */ new Set();
	const sources = [];
	for (const annotation of annotations) {
		const source = annotationToSource({
			annotation,
			generateId: generateId2
		});
		if (source == null) continue;
		const key = source.sourceType === "url" ? `url:${source.url}` : `doc:${(_a = source.filename) != null ? _a : source.title}`;
		if (seen.has(key)) continue;
		seen.add(key);
		sources.push(source);
	}
	return sources;
}
function mapGoogleInteractionsFinishReason({ status, hasFunctionCall }) {
	switch (status) {
		case "completed": return hasFunctionCall ? "tool-calls" : "stop";
		case "requires_action": return "tool-calls";
		case "failed": return "error";
		case "incomplete": return "length";
		case "cancelled": return "other";
		default: return "other";
	}
}
var BUILTIN_TOOL_CALL_TYPES = /* @__PURE__ */ new Set([
	"google_search_call",
	"code_execution_call",
	"url_context_call",
	"file_search_call",
	"google_maps_call",
	"mcp_server_tool_call"
]);
var BUILTIN_TOOL_RESULT_TYPES = /* @__PURE__ */ new Set([
	"google_search_result",
	"code_execution_result",
	"url_context_result",
	"file_search_result",
	"google_maps_result",
	"mcp_server_tool_result"
]);
function builtinToolNameFromCallType(type) {
	return type.replace(/_call$/, "");
}
function builtinToolNameFromResultType(type) {
	return type.replace(/_result$/, "");
}
function buildGoogleInteractionsStreamTransform({ warnings, generateId: generateId2, includeRawChunks, serviceTier: headerServiceTier }) {
	let interactionId;
	let usage;
	let serviceTier = headerServiceTier;
	let finishStatus;
	let hasFunctionCall = false;
	const openBlocks = /* @__PURE__ */ new Map();
	const emittedSourceKeys = /* @__PURE__ */ new Set();
	function sourceKey(source) {
		var _a;
		return source.sourceType === "url" ? `url:${source.url}` : `doc:${(_a = source.filename) != null ? _a : source.title}`;
	}
	return new TransformStream({
		start(controller) {
			controller.enqueue({
				type: "stream-start",
				warnings
			});
		},
		transform(chunk, controller) {
			var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
			if (includeRawChunks) controller.enqueue({
				type: "raw",
				rawValue: chunk.rawValue
			});
			if (!chunk.success) {
				finishStatus = "failed";
				controller.enqueue({
					type: "error",
					error: chunk.error
				});
				return;
			}
			const value = chunk.value;
			const eventType = value.event_type;
			switch (eventType) {
				case "interaction.created": {
					const interaction = value.interaction;
					interactionId = (interaction == null ? void 0 : interaction.id) != null && interaction.id.length > 0 ? interaction.id : void 0;
					const created = interaction == null ? void 0 : interaction.created;
					let timestamp;
					if (typeof created === "string") {
						const parsed = new Date(created);
						if (!Number.isNaN(parsed.getTime())) timestamp = parsed;
					}
					controller.enqueue({
						type: "response-metadata",
						...interactionId != null ? { id: interactionId } : {},
						modelId: interaction == null ? void 0 : interaction.model,
						...timestamp ? { timestamp } : {}
					});
					break;
				}
				case "step.start": {
					const event = value;
					const step = event.step;
					const index = event.index;
					const blockId = `${interactionId != null ? interactionId : "interaction"}:${index}`;
					const stepType = step == null ? void 0 : step.type;
					if (stepType === "model_output") {
						const initial = (_a = step == null ? void 0 : step.content) == null ? void 0 : _a[0];
						if ((initial == null ? void 0 : initial.type) === "text") {
							openBlocks.set(index, {
								kind: "text",
								id: blockId,
								emittedSourceKeys: /* @__PURE__ */ new Set()
							});
							controller.enqueue({
								type: "text-start",
								id: blockId
							});
							const initialSources = annotationsToSources({
								annotations: initial.annotations,
								generateId: generateId2
							});
							for (const source of initialSources) {
								const key = sourceKey(source);
								if (emittedSourceKeys.has(key)) continue;
								emittedSourceKeys.add(key);
								controller.enqueue(source);
							}
						} else if ((initial == null ? void 0 : initial.type) === "image") openBlocks.set(index, {
							kind: "image",
							id: blockId,
							...initial.data != null ? { data: initial.data } : {},
							...initial.mime_type != null ? { mimeType: initial.mime_type } : {},
							...initial.uri != null ? { uri: initial.uri } : {}
						});
						else openBlocks.set(index, {
							kind: "pending_model_output",
							id: blockId
						});
					} else if (stepType === "thought") {
						const signature = step == null ? void 0 : step.signature;
						openBlocks.set(index, {
							kind: "reasoning",
							id: blockId,
							...signature != null ? { signature } : {}
						});
						controller.enqueue({
							type: "reasoning-start",
							id: blockId
						});
						if (Array.isArray(step == null ? void 0 : step.summary)) {
							for (const item of step.summary) if ((item == null ? void 0 : item.type) === "text" && typeof item.text === "string") controller.enqueue({
								type: "reasoning-delta",
								id: blockId,
								delta: item.text
							});
						}
					} else if (stepType === "function_call") {
						const toolCallId = (_b = step == null ? void 0 : step.id) != null ? _b : blockId;
						const toolName = (_c = step == null ? void 0 : step.name) != null ? _c : "unknown";
						hasFunctionCall = true;
						const state = {
							kind: "function_call",
							id: blockId,
							toolCallId,
							toolName,
							argumentsAccum: "",
							...(step == null ? void 0 : step.signature) != null ? { signature: step.signature } : {}
						};
						openBlocks.set(index, state);
						controller.enqueue({
							type: "tool-input-start",
							id: toolCallId,
							toolName
						});
					} else if (stepType != null && BUILTIN_TOOL_CALL_TYPES.has(stepType)) {
						const toolName = stepType === "mcp_server_tool_call" ? (_d = step == null ? void 0 : step.name) != null ? _d : "mcp_server_tool" : builtinToolNameFromCallType(stepType);
						const state = {
							kind: "builtin_tool_call",
							id: blockId,
							blockType: stepType,
							toolCallId: (_e = step == null ? void 0 : step.id) != null ? _e : blockId,
							toolName,
							arguments: (_f = step == null ? void 0 : step.arguments) != null ? _f : {},
							callEmitted: false
						};
						openBlocks.set(index, state);
					} else if (stepType != null && BUILTIN_TOOL_RESULT_TYPES.has(stepType)) {
						const toolName = stepType === "mcp_server_tool_result" ? (_g = step == null ? void 0 : step.name) != null ? _g : "mcp_server_tool" : builtinToolNameFromResultType(stepType);
						const state = {
							kind: "builtin_tool_result",
							id: blockId,
							blockType: stepType,
							callId: (_h = step == null ? void 0 : step.call_id) != null ? _h : blockId,
							toolName,
							result: (_i = step == null ? void 0 : step.result) != null ? _i : null,
							...(step == null ? void 0 : step.is_error) != null ? { isError: step.is_error } : {},
							resultEmitted: false
						};
						openBlocks.set(index, state);
					} else openBlocks.set(index, {
						kind: "unknown",
						id: blockId
					});
					break;
				}
				case "step.delta": {
					const event = value;
					let open = openBlocks.get(event.index);
					if (open == null) break;
					const dtype = (_j = event.delta) == null ? void 0 : _j.type;
					if (open.kind === "pending_model_output") {
						if (dtype === "text" || dtype === "text_annotation" || dtype === "text_annotation_delta") {
							const promoted = {
								kind: "text",
								id: open.id,
								emittedSourceKeys: /* @__PURE__ */ new Set()
							};
							openBlocks.set(event.index, promoted);
							open = promoted;
							controller.enqueue({
								type: "text-start",
								id: promoted.id
							});
						}
					}
					if (dtype === "image" && (open.kind === "pending_model_output" || open.kind === "text" || open.kind === "image")) {
						const imageDelta = event.delta;
						const google = {};
						if (interactionId != null) google.interactionId = interactionId;
						const providerMetadata = Object.keys(google).length > 0 ? { google } : void 0;
						if ((imageDelta == null ? void 0 : imageDelta.data) != null && imageDelta.data.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_k = imageDelta.mime_type) != null ? _k : "image/png",
							data: {
								type: "data",
								data: imageDelta.data
							},
							...providerMetadata ? { providerMetadata } : {}
						});
						else if ((imageDelta == null ? void 0 : imageDelta.uri) != null && imageDelta.uri.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_l = imageDelta.mime_type) != null ? _l : "image/png",
							data: {
								type: "url",
								url: new URL(imageDelta.uri)
							},
							...providerMetadata ? { providerMetadata } : {}
						});
						if (open.kind === "image") {
							open.data = void 0;
							open.uri = void 0;
						}
						break;
					}
					if (dtype === "video" && (open.kind === "pending_model_output" || open.kind === "text")) {
						const videoDelta = event.delta;
						const google = {};
						if (interactionId != null) google.interactionId = interactionId;
						const providerMetadata = Object.keys(google).length > 0 ? { google } : void 0;
						if ((videoDelta == null ? void 0 : videoDelta.data) != null && videoDelta.data.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_m = videoDelta.mime_type) != null ? _m : "video/mp4",
							data: {
								type: "data",
								data: videoDelta.data
							},
							...providerMetadata ? { providerMetadata } : {}
						});
						else if ((videoDelta == null ? void 0 : videoDelta.uri) != null && videoDelta.uri.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_n = videoDelta.mime_type) != null ? _n : "video/mp4",
							data: {
								type: "url",
								url: new URL(videoDelta.uri)
							},
							...providerMetadata ? { providerMetadata } : {}
						});
						break;
					}
					const delta = event.delta;
					if (open.kind === "text" && (delta == null ? void 0 : delta.type) === "text") {
						const text = (_o = delta.text) != null ? _o : "";
						if (text.length > 0) controller.enqueue({
							type: "text-delta",
							id: open.id,
							delta: text
						});
					} else if (open.kind === "text" && ((delta == null ? void 0 : delta.type) === "text_annotation" || (delta == null ? void 0 : delta.type) === "text_annotation_delta")) {
						const sources = annotationsToSources({
							annotations: delta.annotations,
							generateId: generateId2
						});
						for (const source of sources) {
							const key = sourceKey(source);
							if (emittedSourceKeys.has(key)) continue;
							emittedSourceKeys.add(key);
							open.emittedSourceKeys.add(key);
							controller.enqueue(source);
						}
					} else if (open.kind === "image" && (delta == null ? void 0 : delta.type) === "image") {
						if (delta.data != null) open.data = delta.data;
						if (delta.mime_type != null) open.mimeType = delta.mime_type;
						if (delta.uri != null) open.uri = delta.uri;
					} else if (open.kind === "reasoning") {
						if ((delta == null ? void 0 : delta.type) === "thought_summary") {
							const item = delta.content;
							if ((item == null ? void 0 : item.type) === "text" && typeof item.text === "string") controller.enqueue({
								type: "reasoning-delta",
								id: open.id,
								delta: item.text
							});
						} else if ((delta == null ? void 0 : delta.type) === "thought_signature") {
							const signature = delta.signature;
							if (signature != null) open.signature = signature;
						}
					} else if (open.kind === "function_call" && (delta == null ? void 0 : delta.type) === "arguments_delta") {
						const slice = typeof delta.arguments === "string" ? delta.arguments : "";
						if (slice.length > 0) {
							open.argumentsAccum += slice;
							controller.enqueue({
								type: "tool-input-delta",
								id: open.toolCallId,
								delta: slice
							});
						}
						if (delta.id != null) open.toolCallId = delta.id;
						if (delta.signature != null) open.signature = delta.signature;
						hasFunctionCall = true;
					} else if (open.kind === "builtin_tool_call" && (delta == null ? void 0 : delta.type) === open.blockType) {
						if (delta.id != null) open.toolCallId = delta.id;
						if (delta.arguments != null && typeof delta.arguments === "object") open.arguments = delta.arguments;
						if (delta.name != null && open.blockType === "mcp_server_tool_call") open.toolName = delta.name;
					} else if (open.kind === "builtin_tool_result" && (delta == null ? void 0 : delta.type) === open.blockType) {
						if (delta.call_id != null) open.callId = delta.call_id;
						if (delta.result !== void 0) open.result = delta.result;
						if (delta.is_error != null) open.isError = delta.is_error;
						if (delta.name != null && open.blockType === "mcp_server_tool_result") open.toolName = delta.name;
					}
					break;
				}
				case "step.stop": {
					const event = value;
					const open = openBlocks.get(event.index);
					if (open == null) break;
					if (open.kind === "text") {
						const textProviderMetadata = interactionId != null ? { google: { interactionId } } : void 0;
						controller.enqueue({
							type: "text-end",
							id: open.id,
							...textProviderMetadata ? { providerMetadata: textProviderMetadata } : {}
						});
					} else if (open.kind === "reasoning") {
						const google = {};
						if (open.signature != null) google.signature = open.signature;
						if (interactionId != null) google.interactionId = interactionId;
						const providerMetadata = Object.keys(google).length > 0 ? { google } : void 0;
						controller.enqueue({
							type: "reasoning-end",
							id: open.id,
							...providerMetadata ? { providerMetadata } : {}
						});
					} else if (open.kind === "image") {
						const google = {};
						if (interactionId != null) google.interactionId = interactionId;
						const providerMetadata = Object.keys(google).length > 0 ? { google } : void 0;
						if (open.data != null && open.data.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_p = open.mimeType) != null ? _p : "image/png",
							data: {
								type: "data",
								data: open.data
							},
							...providerMetadata ? { providerMetadata } : {}
						});
						else if (open.uri != null && open.uri.length > 0) controller.enqueue({
							type: "file",
							mediaType: (_q = open.mimeType) != null ? _q : "image/png",
							data: {
								type: "url",
								url: new URL(open.uri)
							},
							...providerMetadata ? { providerMetadata } : {}
						});
					} else if (open.kind === "function_call") {
						const accumulated = open.argumentsAccum.length > 0 ? open.argumentsAccum : "{}";
						controller.enqueue({
							type: "tool-input-end",
							id: open.toolCallId
						});
						const google = {};
						if (open.signature != null) google.signature = open.signature;
						if (interactionId != null) google.interactionId = interactionId;
						const providerMetadata = Object.keys(google).length > 0 ? { google } : void 0;
						controller.enqueue({
							type: "tool-call",
							toolCallId: open.toolCallId,
							toolName: open.toolName,
							input: accumulated,
							...providerMetadata ? { providerMetadata } : {}
						});
					} else if (open.kind === "builtin_tool_call" && !open.callEmitted) {
						controller.enqueue({
							type: "tool-call",
							toolCallId: open.toolCallId,
							toolName: open.toolName,
							input: JSON.stringify((_r = open.arguments) != null ? _r : {}),
							providerExecuted: true
						});
						open.callEmitted = true;
					} else if (open.kind === "builtin_tool_result" && !open.resultEmitted) {
						controller.enqueue({
							type: "tool-result",
							toolCallId: open.callId,
							toolName: open.toolName,
							result: (_s = open.result) != null ? _s : null
						});
						open.resultEmitted = true;
						const sources = builtinToolResultToSources({
							block: {
								type: open.blockType,
								call_id: open.callId,
								result: open.result
							},
							generateId: generateId2
						});
						for (const source of sources) {
							const key = sourceKey(source);
							if (emittedSourceKeys.has(key)) continue;
							emittedSourceKeys.add(key);
							controller.enqueue(source);
						}
					}
					openBlocks.delete(event.index);
					break;
				}
				case "interaction.status_update":
				case "interaction.in_progress":
				case "interaction.requires_action": {
					const event = value;
					if (event.status != null) finishStatus = event.status;
					else if (eventType === "interaction.requires_action") finishStatus = "requires_action";
					else finishStatus = "in_progress";
					break;
				}
				case "interaction.completed": {
					const interaction = value.interaction;
					if ((interaction == null ? void 0 : interaction.id) != null && interaction.id.length > 0) interactionId = interaction.id;
					if ((interaction == null ? void 0 : interaction.status) != null) finishStatus = interaction.status;
					if ((interaction == null ? void 0 : interaction.usage) != null) usage = interaction.usage;
					if ((interaction == null ? void 0 : interaction.service_tier) != null) serviceTier = interaction.service_tier;
					break;
				}
				case "error": {
					const event = value;
					finishStatus = "failed";
					const errorPayload = (_t = event.error) != null ? _t : { message: "Unknown interaction error" };
					controller.enqueue({
						type: "error",
						error: errorPayload
					});
					break;
				}
				default: break;
			}
		},
		flush(controller) {
			const finishReason = {
				unified: mapGoogleInteractionsFinishReason({
					status: finishStatus,
					hasFunctionCall
				}),
				raw: finishStatus
			};
			const outputTokensByModality = getGoogleInteractionsOutputTokensByModality(usage);
			const providerMetadata = { google: {
				...interactionId != null ? { interactionId } : {},
				...serviceTier != null ? { serviceTier } : {},
				...outputTokensByModality != null ? { outputTokensByModality } : {}
			} };
			controller.enqueue({
				type: "finish",
				finishReason,
				usage: convertGoogleInteractionsUsage(usage),
				providerMetadata
			});
		}
	});
}
function convertToGoogleInteractionsInput({ prompt, previousInteractionId, store, mediaResolution }) {
	var _a, _b, _c, _d, _e, _f, _g;
	const warnings = [];
	const incoherentCombo = previousInteractionId != null && store === false;
	const shouldCompact = previousInteractionId != null && store !== false;
	if (incoherentCombo) warnings.push({
		type: "other",
		message: "google.interactions: providerOptions.google.previousInteractionId was set together with store: false. These are incoherent (the prior interaction cannot be referenced when nothing was stored on the server); the full history will be sent and previous_interaction_id will still be emitted."
	});
	const compactedPrompt = shouldCompact ? compactPromptForPreviousInteraction({
		prompt,
		previousInteractionId
	}) : prompt;
	const systemTexts = [];
	const steps = [];
	for (const message of compactedPrompt) switch (message.role) {
		case "system":
			systemTexts.push(message.content);
			break;
		case "user": {
			const content = [];
			for (const part of message.content) if (part.type === "text") content.push({
				type: "text",
				text: part.text
			});
			else if (part.type === "file") {
				const fileBlock = convertFilePartToContent({
					part,
					warnings,
					mediaResolution
				});
				if (fileBlock != null) content.push(fileBlock);
			}
			const merged = mergeAdjacentTextContent(content);
			if (merged.length > 0) steps.push({
				type: "user_input",
				content: merged
			});
			break;
		}
		case "assistant": {
			let pendingModelOutput = [];
			const flushModelOutput = () => {
				if (pendingModelOutput.length > 0) {
					steps.push({
						type: "model_output",
						content: pendingModelOutput
					});
					pendingModelOutput = [];
				}
			};
			for (const part of message.content) if (part.type === "text") pendingModelOutput.push({
				type: "text",
				text: part.text
			});
			else if (part.type === "reasoning") {
				flushModelOutput();
				const signature = (_b = (_a = part.providerOptions) == null ? void 0 : _a.google) == null ? void 0 : _b.signature;
				steps.push({
					type: "thought",
					...signature != null ? { signature } : {},
					summary: part.text.length > 0 ? [{
						type: "text",
						text: part.text
					}] : void 0
				});
			} else if (part.type === "file") {
				const fileBlock = convertFilePartToContent({
					part,
					warnings,
					mediaResolution
				});
				if (fileBlock != null) pendingModelOutput.push(fileBlock);
			} else if (part.type === "tool-call") {
				flushModelOutput();
				const signature = (_d = (_c = part.providerOptions) == null ? void 0 : _c.google) == null ? void 0 : _d.signature;
				const args = typeof part.input === "string" ? safeParseToolArgs(part.input) : (_e = part.input) != null ? _e : {};
				steps.push({
					type: "function_call",
					id: part.toolCallId,
					name: part.toolName,
					arguments: args,
					...signature != null ? { signature } : {}
				});
			} else warnings.push({
				type: "other",
				message: `google.interactions: unsupported assistant content part type "${part.type}"; part dropped.`
			});
			flushModelOutput();
			break;
		}
		case "tool": {
			const content = [];
			for (const part of message.content) {
				if (part.type !== "tool-result") {
					warnings.push({
						type: "other",
						message: `google.interactions: unsupported tool message part type "${part.type}"; part dropped.`
					});
					continue;
				}
				const block = convertToolResultPart({
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output: part.output,
					signature: (_g = (_f = part.providerOptions) == null ? void 0 : _f.google) == null ? void 0 : _g.signature,
					warnings
				});
				content.push(block);
			}
			if (content.length > 0) steps.push({
				type: "user_input",
				content
			});
			break;
		}
	}
	return {
		input: steps,
		systemInstruction: systemTexts.length > 0 ? systemTexts.join("\n\n") : void 0,
		warnings
	};
}
function convertFilePartToContent({ part, warnings, mediaResolution }) {
	if (part.data.type === "text") return {
		type: "text",
		text: part.data.text
	};
	const topLevel = getTopLevelMediaType(part.mediaType);
	let kind;
	switch (topLevel) {
		case "image":
			kind = "image";
			break;
		case "audio":
			kind = "audio";
			break;
		case "video":
			kind = "video";
			break;
		case "application":
			kind = "document";
			break;
		default: kind = void 0;
	}
	if (kind == null) {
		warnings.push({
			type: "other",
			message: `google.interactions: unsupported file media type "${part.mediaType}"; part dropped.`
		});
		return;
	}
	const resolutionField = mediaResolution != null && (kind === "image" || kind === "video") ? { resolution: mediaResolution } : {};
	switch (part.data.type) {
		case "data": {
			const mimeType = resolveFullMediaType({ part });
			return {
				type: kind,
				data: convertToBase64(part.data.data),
				mime_type: mimeType,
				...resolutionField
			};
		}
		case "url": return {
			type: kind,
			uri: part.data.url.toString(),
			...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {},
			...resolutionField
		};
		case "reference": {
			const uri = resolveProviderReference({
				reference: part.data.reference,
				provider: "google"
			});
			return {
				type: kind,
				uri,
				...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {},
				...resolutionField
			};
		}
	}
}
function compactPromptForPreviousInteraction({ prompt, previousInteractionId }) {
	const out = [];
	const droppedToolCallIds = /* @__PURE__ */ new Set();
	for (const message of prompt) {
		if (message.role === "assistant") {
			if (message.content.some((part) => {
				var _a, _b;
				return ((_b = (_a = part.providerOptions) == null ? void 0 : _a.google) == null ? void 0 : _b.interactionId) === previousInteractionId;
			})) {
				for (const part of message.content) if (part.type === "tool-call") droppedToolCallIds.add(part.toolCallId);
				continue;
			}
			out.push(message);
			continue;
		}
		if (message.role === "tool") {
			const remaining = message.content.filter((part) => {
				if (part.type !== "tool-result") return true;
				return !droppedToolCallIds.has(part.toolCallId);
			});
			if (remaining.length === 0) continue;
			out.push({
				...message,
				content: remaining
			});
			continue;
		}
		out.push(message);
	}
	return out;
}
function safeParseToolArgs(input) {
	try {
		const parsed = secureJsonParse(input);
		if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
		return { value: parsed };
	} catch (e) {
		return { value: input };
	}
}
function convertToolResultPart({ toolCallId, toolName, output, signature, warnings }) {
	var _a;
	const base = {
		type: "function_result",
		call_id: toolCallId,
		name: toolName,
		...signature != null ? { signature } : {}
	};
	switch (output.type) {
		case "text": return {
			...base,
			result: output.value
		};
		case "json": return {
			...base,
			result: JSON.stringify(output.value)
		};
		case "error-text": return {
			...base,
			is_error: true,
			result: output.value
		};
		case "error-json": return {
			...base,
			is_error: true,
			result: JSON.stringify(output.value)
		};
		case "execution-denied": return {
			...base,
			is_error: true,
			result: (_a = output.reason) != null ? _a : "Tool execution denied by user."
		};
		case "content": {
			const blocks = [];
			for (const item of output.value) if (item.type === "text") blocks.push({
				type: "text",
				text: item.text
			});
			else if (item.type === "file") {
				if (getTopLevelMediaType(item.mediaType) !== "image") {
					warnings.push({
						type: "other",
						message: `google.interactions: tool-result file with mediaType "${item.mediaType}" is not supported (Interactions \`function_result.result\` accepts only text and image content); part dropped.`
					});
					continue;
				}
				const imageBlock = filePartToImageBlock({
					part: item,
					warnings
				});
				if (imageBlock != null) blocks.push(imageBlock);
			} else warnings.push({
				type: "other",
				message: `google.interactions: tool-result content part type "${item.type}" is not supported; part dropped.`
			});
			return {
				...base,
				result: blocks
			};
		}
	}
}
function filePartToImageBlock({ part, warnings }) {
	switch (part.data.type) {
		case "data": {
			const mimeType = isFullMediaType(part.mediaType) ? part.mediaType : resolveFullMediaType({ part: {
				type: "file",
				mediaType: part.mediaType,
				data: part.data
			} });
			return {
				type: "image",
				data: convertToBase64(part.data.data),
				mime_type: mimeType
			};
		}
		case "url": return {
			type: "image",
			uri: part.data.url.toString(),
			...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {}
		};
		case "reference": return {
			type: "image",
			uri: resolveProviderReference({
				reference: part.data.reference,
				provider: "google"
			}),
			...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {}
		};
		case "text":
			warnings.push({
				type: "other",
				message: "google.interactions: tool-result image part with `data.type === \"text\"` is not representable as an image; part dropped."
			});
			return;
	}
}
function mergeAdjacentTextContent(content) {
	if (content.length < 2) return content;
	const result = [];
	for (const block of content) {
		const last = result[result.length - 1];
		if (block.type === "text" && last != null && last.type === "text" && last.annotations == null && block.annotations == null) {
			const merged = {
				type: "text",
				text: `${last.text}

${block.text}`
			};
			result[result.length - 1] = merged;
			continue;
		}
		result.push(block);
	}
	return result;
}
var tokenByModalitySchema = () => object({
	modality: string().nullish(),
	tokens: number().nullish()
}).loose();
var usageSchema2 = () => object({
	total_input_tokens: number().nullish(),
	total_output_tokens: number().nullish(),
	total_thought_tokens: number().nullish(),
	total_cached_tokens: number().nullish(),
	total_tool_use_tokens: number().nullish(),
	total_tokens: number().nullish(),
	input_tokens_by_modality: array(tokenByModalitySchema()).nullish(),
	output_tokens_by_modality: array(tokenByModalitySchema()).nullish(),
	cached_tokens_by_modality: array(tokenByModalitySchema()).nullish(),
	tool_use_tokens_by_modality: array(tokenByModalitySchema()).nullish(),
	grounding_tool_count: array(object({
		type: string().nullish(),
		count: number().nullish()
	}).loose()).nullish()
}).loose();
var interactionStatusSchema = () => _enum([
	"in_progress",
	"requires_action",
	"completed",
	"failed",
	"cancelled",
	"incomplete"
]);
var annotationSchema = () => {
	return union([
		object({
			type: literal("url_citation"),
			url: string().nullish(),
			title: string().nullish(),
			start_index: number().nullish(),
			end_index: number().nullish()
		}).loose(),
		object({
			type: literal("file_citation"),
			file_name: string().nullish(),
			document_uri: string().nullish(),
			url: string().nullish(),
			page_number: number().nullish(),
			media_id: string().nullish(),
			start_index: number().nullish(),
			end_index: number().nullish(),
			custom_metadata: record(string(), unknown()).nullish()
		}).loose(),
		object({
			type: literal("place_citation"),
			name: string().nullish(),
			url: string().nullish(),
			place_id: string().nullish(),
			start_index: number().nullish(),
			end_index: number().nullish()
		}).loose(),
		object({ type: string() }).loose()
	]);
};
var thoughtSummaryItemSchema = () => object({
	type: string(),
	text: string().nullish(),
	data: string().nullish(),
	mime_type: string().nullish()
}).loose();
var contentBlockSchema = () => {
	return union([
		object({
			type: literal("text"),
			text: string(),
			annotations: array(annotationSchema()).nullish()
		}).loose(),
		object({
			type: literal("image"),
			data: string().nullish(),
			mime_type: string().nullish(),
			resolution: _enum([
				"low",
				"medium",
				"high",
				"ultra_high"
			]).nullish(),
			uri: string().nullish()
		}).loose(),
		object({
			type: literal("video"),
			data: string().nullish(),
			mime_type: string().nullish(),
			uri: string().nullish()
		}).loose(),
		object({ type: string() }).loose()
	]);
};
var BUILTIN_TOOL_CALL_STEP_TYPES = [
	"google_search_call",
	"code_execution_call",
	"url_context_call",
	"file_search_call",
	"google_maps_call",
	"mcp_server_tool_call"
];
var BUILTIN_TOOL_RESULT_STEP_TYPES = [
	"google_search_result",
	"code_execution_result",
	"url_context_result",
	"file_search_result",
	"google_maps_result",
	"mcp_server_tool_result"
];
var stepSchema = () => {
	return union([
		object({
			type: literal("user_input"),
			content: array(contentBlockSchema()).nullish()
		}).loose(),
		object({
			type: literal("model_output"),
			content: array(contentBlockSchema()).nullish()
		}).loose(),
		object({
			type: literal("function_call"),
			id: string(),
			name: string(),
			arguments: record(string(), unknown()).nullish(),
			signature: string().nullish()
		}).loose(),
		object({
			type: literal("thought"),
			signature: string().nullish(),
			summary: array(thoughtSummaryItemSchema()).nullish()
		}).loose(),
		object({
			type: _enum(BUILTIN_TOOL_CALL_STEP_TYPES),
			id: string(),
			arguments: record(string(), unknown()).nullish(),
			name: string().nullish(),
			server_name: string().nullish(),
			search_type: string().nullish(),
			signature: string().nullish()
		}).loose(),
		object({
			type: _enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
			call_id: string(),
			result: unknown().nullish(),
			is_error: boolean().nullish(),
			name: string().nullish(),
			server_name: string().nullish(),
			signature: string().nullish()
		}).loose(),
		object({ type: string() }).loose()
	]);
};
var googleInteractionsResponseSchema = lazySchema(() => zodSchema(object({
	id: string().nullish(),
	created: string().nullish(),
	updated: string().nullish(),
	status: interactionStatusSchema(),
	model: string().nullish(),
	agent: string().nullish(),
	steps: array(stepSchema()).nullish(),
	usage: usageSchema2().nullish(),
	service_tier: string().nullish(),
	previous_interaction_id: string().nullish(),
	response_modalities: array(string()).nullish()
}).loose()));
var googleInteractionsEventSchema = lazySchema(() => zodSchema((() => {
	const status = interactionStatusSchema();
	const annotation = annotationSchema();
	const thoughtSummaryItem = thoughtSummaryItemSchema();
	const interactionCreatedEvent = object({
		event_type: literal("interaction.created"),
		event_id: string().nullish(),
		interaction: object({
			id: string().nullish(),
			created: string().nullish(),
			model: string().nullish(),
			agent: string().nullish(),
			status: status.nullish()
		}).loose()
	}).loose();
	const stepStartEvent = object({
		event_type: literal("step.start"),
		event_id: string().nullish(),
		index: number(),
		step: stepSchema()
	}).loose();
	const stepDeltaText = object({
		type: literal("text"),
		text: string()
	}).loose();
	const stepDeltaThoughtSummary = object({
		type: literal("thought_summary"),
		content: thoughtSummaryItem.nullish()
	}).loose();
	const stepDeltaThoughtSignature = object({
		type: literal("thought_signature"),
		signature: string().nullish()
	}).loose();
	const stepDeltaArgumentsDelta = object({
		type: literal("arguments_delta"),
		arguments: string().nullish(),
		id: string().nullish(),
		signature: string().nullish()
	}).loose();
	const stepDeltaTextAnnotation = object({
		type: _enum(["text_annotation_delta", "text_annotation"]),
		annotations: array(annotation).nullish()
	}).loose();
	const stepDeltaUnion = union([
		stepDeltaText,
		object({
			type: literal("image"),
			data: string().nullish(),
			mime_type: string().nullish(),
			resolution: _enum([
				"low",
				"medium",
				"high",
				"ultra_high"
			]).nullish(),
			uri: string().nullish()
		}).loose(),
		object({
			type: literal("video"),
			data: string().nullish(),
			mime_type: string().nullish(),
			uri: string().nullish()
		}).loose(),
		stepDeltaThoughtSummary,
		stepDeltaThoughtSignature,
		stepDeltaArgumentsDelta,
		stepDeltaTextAnnotation,
		object({
			type: _enum(BUILTIN_TOOL_CALL_STEP_TYPES),
			id: string().nullish(),
			arguments: record(string(), unknown()).nullish(),
			name: string().nullish(),
			server_name: string().nullish(),
			search_type: string().nullish(),
			signature: string().nullish()
		}).loose(),
		object({
			type: _enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
			call_id: string().nullish(),
			result: unknown().nullish(),
			is_error: boolean().nullish(),
			name: string().nullish(),
			server_name: string().nullish(),
			signature: string().nullish()
		}).loose(),
		object({ type: string() }).loose()
	]);
	return union([
		interactionCreatedEvent,
		stepStartEvent,
		object({
			event_type: literal("step.delta"),
			event_id: string().nullish(),
			index: number(),
			delta: stepDeltaUnion
		}).loose(),
		object({
			event_type: literal("step.stop"),
			event_id: string().nullish(),
			index: number()
		}).loose(),
		object({
			event_type: literal("interaction.status_update"),
			event_id: string().nullish(),
			interaction_id: string().nullish(),
			status: status.nullish()
		}).loose(),
		object({
			event_type: literal("interaction.in_progress"),
			event_id: string().nullish(),
			interaction_id: string().nullish(),
			status: status.nullish()
		}).loose(),
		object({
			event_type: literal("interaction.requires_action"),
			event_id: string().nullish(),
			interaction_id: string().nullish(),
			status: status.nullish()
		}).loose(),
		object({
			event_type: literal("interaction.completed"),
			event_id: string().nullish(),
			interaction: object({
				id: string().nullish(),
				status: status.nullish(),
				usage: usageSchema2().nullish(),
				service_tier: string().nullish()
			}).loose()
		}).loose(),
		object({
			event_type: literal("error"),
			event_id: string().nullish(),
			error: object({
				code: string().nullish(),
				message: string().nullish()
			}).loose().nullish()
		}).loose(),
		object({ event_type: string() }).loose()
	]);
})()));
var googleInteractionsLanguageModelOptions = lazySchema(() => zodSchema(object({
	previousInteractionId: string().nullish(),
	store: boolean().nullish(),
	agent: string().nullish(),
	agentConfig: union([object({ type: literal("dynamic") }).loose(), object({
		type: literal("deep-research"),
		thinkingSummaries: _enum(["auto", "none"]).nullish(),
		visualization: _enum(["off", "auto"]).nullish(),
		collaborativePlanning: boolean().nullish()
	})]).nullish(),
	thinkingLevel: _enum([
		"minimal",
		"low",
		"medium",
		"high"
	]).nullish(),
	thinkingSummaries: _enum(["auto", "none"]).nullish(),
	/**
	* Output-format entries that map directly to the API's `response_format`
	* array. Use this to request image, audio, or non-JSON text outputs
	* with full control over `mime_type`, `aspect_ratio`, and `image_size`.
	*
	* Entries are sent in order. The AI SDK call-level `responseFormat: {
	* type: 'json', schema }` still drives JSON-mode and adds a matching
	* text entry automatically; entries listed here are appended.
	*/
	responseFormat: array(union([
		object({
			type: literal("text"),
			mimeType: string().nullish(),
			schema: unknown().nullish()
		}).loose(),
		object({
			type: literal("image"),
			mimeType: string().nullish(),
			aspectRatio: _enum([
				"1:1",
				"2:3",
				"3:2",
				"3:4",
				"4:3",
				"4:5",
				"5:4",
				"9:16",
				"16:9",
				"21:9",
				"1:8",
				"8:1",
				"1:4",
				"4:1"
			]).nullish(),
			imageSize: _enum([
				"1K",
				"2K",
				"4K",
				"512"
			]).nullish()
		}).loose(),
		object({
			type: literal("audio"),
			mimeType: string().nullish()
		}).loose()
	])).nullish(),
	/**
	* @deprecated Use `responseFormat` with a `{ type: 'image', ... }`
	* entry instead. Retained for backwards compatibility; the SDK
	* translates it into a matching `response_format` image entry and
	* emits a warning when set.
	*/
	imageConfig: object({
		aspectRatio: _enum([
			"1:1",
			"2:3",
			"3:2",
			"3:4",
			"4:3",
			"4:5",
			"5:4",
			"9:16",
			"16:9",
			"21:9",
			"1:8",
			"8:1",
			"1:4",
			"4:1"
		]).nullish(),
		imageSize: _enum([
			"1K",
			"2K",
			"4K",
			"512"
		]).nullish()
	}).nullish(),
	mediaResolution: _enum([
		"low",
		"medium",
		"high",
		"ultra_high"
	]).nullish(),
	responseModalities: array(_enum([
		"text",
		"image",
		"audio",
		"video",
		"document"
	])).nullish(),
	serviceTier: _enum([
		"flex",
		"standard",
		"priority"
	]).nullish(),
	/**
	* Alternative to AI SDK `system` message. If both are set, the AI SDK
	* `system` message wins and a warning is emitted.
	*/
	systemInstruction: string().nullish(),
	/**
	* Per-block signature for round-tripping `thought.signature` and
	* `function_call.signature` blocks. Set by the SDK on output reasoning /
	* tool-call parts; passed back unchanged on input parts so the API
	* accepts the prior turn.
	*/
	signature: string().nullish(),
	/**
	* Set by the SDK on output assistant messages. The converter uses it to
	* decide which messages to drop when compacting under
	* `previousInteractionId`.
	*/
	interactionId: string().nullish(),
	/**
	* Maximum time, in milliseconds, to poll a background interaction (agent
	* call) before giving up. Defaults to 30 minutes. Long-running agents
	* such as deep research can take tens of minutes — increase if needed.
	*/
	pollingTimeoutMs: number().int().positive().nullish(),
	/**
	* Run the interaction in the background. Required for agents whose
	* server-side workflow cannot complete within a single request/response.
	* When `true`, the POST returns with a non-terminal status and the SDK
	* polls `GET /interactions/{id}` until the work completes. Some agents
	* reject `true`; see the agent's documentation for which mode it
	* requires.
	*/
	background: boolean().nullish(),
	/**
	* Environment configuration for the agent sandbox. Only applies to agent
	* calls (`google.interactions({ agent })`); ignored on model-id calls.
	*
	*   - `"remote"`: provision a fresh sandbox for this call.
	*   - any other string: an existing `environment_id` to reuse.
	*   - object: provision a fresh sandbox and optionally preload `sources`
	*     and/or constrain outbound traffic via `network`.
	*/
	environment: union([string(), object({
		type: literal("remote"),
		sources: array(union([
			object({
				type: literal("gcs"),
				source: string(),
				target: string().nullish()
			}),
			object({
				type: literal("repository"),
				source: string(),
				target: string().nullish()
			}),
			object({
				type: literal("inline"),
				content: string(),
				target: string()
			})
		])).nullish(),
		network: union([literal("disabled"), object({ allowlist: array(object({
			domain: string(),
			transform: array(record(string(), string())).nullish()
		})) })]).nullish()
	})]).nullish()
})));
function googleProviderMetadata({ signature, interactionId }) {
	const google = {};
	if (signature != null) google.signature = signature;
	if (interactionId != null) google.interactionId = interactionId;
	return Object.keys(google).length > 0 ? { providerMetadata: { google } } : {};
}
var BUILTIN_TOOL_CALL_TYPES2 = /* @__PURE__ */ new Set([
	"google_search_call",
	"code_execution_call",
	"url_context_call",
	"file_search_call",
	"google_maps_call",
	"mcp_server_tool_call"
]);
var BUILTIN_TOOL_RESULT_TYPES2 = /* @__PURE__ */ new Set([
	"google_search_result",
	"code_execution_result",
	"url_context_result",
	"file_search_result",
	"google_maps_result",
	"mcp_server_tool_result"
]);
function builtinToolNameFromCallType2(type) {
	return type.replace(/_call$/, "");
}
function builtinToolNameFromResultType2(type) {
	return type.replace(/_result$/, "");
}
function parseGoogleInteractionsOutputs({ steps, generateId: generateId2, interactionId }) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
	const content = [];
	let hasFunctionCall = false;
	if (steps == null) return {
		content,
		hasFunctionCall
	};
	for (const step of steps) {
		if (step == null || typeof step !== "object") continue;
		const type = step.type;
		if (typeof type !== "string") continue;
		switch (type) {
			case "user_input": break;
			case "model_output": {
				const blocks = (_a = step.content) != null ? _a : [];
				for (const block of blocks) {
					if (block == null || typeof block !== "object") continue;
					const blockType = block.type;
					if (blockType === "text") {
						const text = (_b = block.text) != null ? _b : "";
						const annotations = block.annotations;
						content.push({
							type: "text",
							text,
							...googleProviderMetadata({ interactionId })
						});
						const sources = annotationsToSources({
							annotations,
							generateId: generateId2
						});
						for (const source of sources) content.push(source);
					} else if (blockType === "image") {
						const image = block;
						if (image.data != null && image.data.length > 0) content.push({
							type: "file",
							mediaType: (_c = image.mime_type) != null ? _c : "image/png",
							data: {
								type: "data",
								data: image.data
							},
							...googleProviderMetadata({ interactionId })
						});
						else if (image.uri != null && image.uri.length > 0) content.push({
							type: "file",
							mediaType: (_d = image.mime_type) != null ? _d : "image/png",
							data: {
								type: "url",
								url: new URL(image.uri)
							},
							...googleProviderMetadata({ interactionId })
						});
					} else if (blockType === "video") {
						const video = block;
						if (video.data != null && video.data.length > 0) content.push({
							type: "file",
							mediaType: (_e = video.mime_type) != null ? _e : "video/mp4",
							data: {
								type: "data",
								data: video.data
							},
							...googleProviderMetadata({ interactionId })
						});
						else if (video.uri != null && video.uri.length > 0) content.push({
							type: "file",
							mediaType: (_f = video.mime_type) != null ? _f : "video/mp4",
							data: {
								type: "url",
								url: new URL(video.uri)
							},
							...googleProviderMetadata({ interactionId })
						});
					}
				}
				break;
			}
			case "thought": {
				const thought = step;
				const text = (Array.isArray(thought.summary) ? thought.summary : []).filter((item) => (item == null ? void 0 : item.type) === "text" && typeof item.text === "string").map((item) => item.text).join("\n");
				content.push({
					type: "reasoning",
					text,
					...googleProviderMetadata({
						signature: thought.signature,
						interactionId
					})
				});
				break;
			}
			case "function_call": {
				hasFunctionCall = true;
				const call = step;
				content.push({
					type: "tool-call",
					toolCallId: call.id,
					toolName: call.name,
					input: JSON.stringify((_g = call.arguments) != null ? _g : {}),
					...googleProviderMetadata({
						signature: call.signature,
						interactionId
					})
				});
				break;
			}
			default:
				if (BUILTIN_TOOL_CALL_TYPES2.has(type)) {
					const call = step;
					const toolName = type === "mcp_server_tool_call" ? (_h = call.name) != null ? _h : "mcp_server_tool" : builtinToolNameFromCallType2(type);
					const input = JSON.stringify((_i = call.arguments) != null ? _i : {});
					content.push({
						type: "tool-call",
						toolCallId: (_j = call.id) != null ? _j : generateId2(),
						toolName,
						input,
						providerExecuted: true
					});
				} else if (BUILTIN_TOOL_RESULT_TYPES2.has(type)) {
					const result = step;
					const toolName = type === "mcp_server_tool_result" ? (_k = result.name) != null ? _k : "mcp_server_tool" : builtinToolNameFromResultType2(type);
					content.push({
						type: "tool-result",
						toolCallId: (_l = result.call_id) != null ? _l : generateId2(),
						toolName,
						result: (_m = result.result) != null ? _m : null
					});
					const sources = builtinToolResultToSources({
						block: step,
						generateId: generateId2
					});
					for (const source of sources) content.push(source);
				}
				break;
		}
	}
	return {
		content,
		hasFunctionCall
	};
}
var getOriginalFetch = () => globalThis.fetch;
async function cancelGoogleInteraction({ baseURL, interactionId, headers, fetch = getOriginalFetch() }) {
	if (interactionId == null || interactionId.length === 0) return;
	const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}/cancel`;
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: withUserAgentSuffix(combineHeaders({ "Content-Type": "application/json" }, headers), getRuntimeEnvironmentUserAgent()),
			body: "{}"
		});
		try {
			await response.text();
		} catch (e) {}
	} catch (e) {}
}
var TERMINAL_STATUSES = /* @__PURE__ */ new Set([
	"completed",
	"failed",
	"cancelled",
	"incomplete"
]);
function isTerminalStatus(status) {
	return status != null && TERMINAL_STATUSES.has(status);
}
var DEFAULT_INITIAL_DELAY_MS = 1e3;
var DEFAULT_MAX_DELAY_MS = 1e4;
var DEFAULT_TIMEOUT_MS = 1800 * 1e3;
async function pollGoogleInteractionUntilTerminal({ baseURL, interactionId, headers, fetch, abortSignal, initialDelayMs = DEFAULT_INITIAL_DELAY_MS, maxDelayMs = DEFAULT_MAX_DELAY_MS, timeoutMs = DEFAULT_TIMEOUT_MS }) {
	if (interactionId == null || interactionId.length === 0) throw new Error("google.interactions: cannot poll a background interaction without an id. The POST response did not include an interaction id.");
	const startedAt = Date.now();
	let nextDelayMs = initialDelayMs;
	const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;
	const cancelOnServer = () => cancelGoogleInteraction({
		baseURL,
		interactionId,
		headers,
		fetch
	});
	try {
		while (true) {
			if (abortSignal == null ? void 0 : abortSignal.aborted) {
				await cancelOnServer();
				throw new DOMException("Polling was aborted", "AbortError");
			}
			if (Date.now() - startedAt > timeoutMs) throw new Error(`google.interactions: timed out polling interaction ${interactionId} after ${timeoutMs}ms.`);
			await delay(nextDelayMs, { abortSignal });
			const { value: response, rawValue: rawResponse, responseHeaders } = await getFromApi({
				url,
				headers,
				failedResponseHandler: googleFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(googleInteractionsResponseSchema),
				abortSignal,
				fetch
			});
			if (isTerminalStatus(response.status)) return {
				response,
				rawResponse,
				responseHeaders
			};
			nextDelayMs = Math.min(nextDelayMs * 2, maxDelayMs);
		}
	} catch (error) {
		if (isAbortError(error)) await cancelOnServer();
		throw error;
	}
}
function prepareGoogleInteractionsTools({ tools, toolChoice }) {
	var _a, _b, _c, _d;
	const toolWarnings = [];
	const normalized = (tools == null ? void 0 : tools.length) ? tools : void 0;
	if (normalized == null) return {
		tools: void 0,
		toolChoice: void 0,
		toolWarnings
	};
	const interactionsTools = [];
	for (const tool of normalized) {
		if (tool.type === "function") {
			interactionsTools.push({
				type: "function",
				name: tool.name,
				description: (_a = tool.description) != null ? _a : "",
				parameters: tool.inputSchema
			});
			continue;
		}
		if (tool.type === "provider") {
			const args = (_b = tool.args) != null ? _b : {};
			switch (tool.id) {
				case "google.google_search": {
					const searchTypesArg = args.searchTypes;
					let search_types;
					if (searchTypesArg != null && typeof searchTypesArg === "object") {
						const list = [];
						if (searchTypesArg.webSearch != null) list.push("web_search");
						if (searchTypesArg.imageSearch != null) list.push("image_search");
						if (list.length > 0) search_types = list;
					}
					interactionsTools.push({
						type: "google_search",
						...search_types != null ? { search_types } : {}
					});
					break;
				}
				case "google.code_execution":
					interactionsTools.push({ type: "code_execution" });
					break;
				case "google.url_context":
					interactionsTools.push({ type: "url_context" });
					break;
				case "google.file_search":
					interactionsTools.push({
						type: "file_search",
						...args.fileSearchStoreNames != null ? { file_search_store_names: args.fileSearchStoreNames } : {},
						...args.topK != null ? { top_k: args.topK } : {},
						...args.metadataFilter != null ? { metadata_filter: args.metadataFilter } : {}
					});
					break;
				case "google.google_maps":
					interactionsTools.push({
						type: "google_maps",
						...args.latitude != null ? { latitude: args.latitude } : {},
						...args.longitude != null ? { longitude: args.longitude } : {},
						...args.enableWidget != null ? { enable_widget: args.enableWidget } : {}
					});
					break;
				case "google.computer_use":
					interactionsTools.push({
						type: "computer_use",
						environment: (_c = args.environment) != null ? _c : "browser",
						...args.excludedPredefinedFunctions != null ? { excludedPredefinedFunctions: args.excludedPredefinedFunctions } : {}
					});
					break;
				case "google.mcp_server":
					interactionsTools.push({
						type: "mcp_server",
						...args.name != null ? { name: args.name } : {},
						...args.url != null ? { url: args.url } : {},
						...args.headers != null ? { headers: args.headers } : {},
						...args.allowedTools != null ? { allowed_tools: args.allowedTools } : {}
					});
					break;
				case "google.retrieval": {
					const vertexAiSearchConfig = (_d = args.vertexAiSearchConfig) != null ? _d : void 0;
					interactionsTools.push({
						type: "retrieval",
						...args.retrievalTypes != null ? { retrieval_types: args.retrievalTypes } : { retrieval_types: ["vertex_ai_search"] },
						...vertexAiSearchConfig != null ? { vertex_ai_search_config: vertexAiSearchConfig } : {}
					});
					break;
				}
				default:
					toolWarnings.push({
						type: "unsupported",
						feature: `provider-defined tool ${tool.id}`,
						details: `provider-defined tool ${tool.id} is not supported by google.interactions; tool dropped.`
					});
					break;
			}
			continue;
		}
		toolWarnings.push({
			type: "unsupported",
			feature: `tool of type ${tool.type}`,
			details: "Only function tools and google.* provider-defined tools are supported by google.interactions; tool dropped."
		});
	}
	const hasFunctionTool = interactionsTools.some((t) => t.type === "function");
	let mappedToolChoice;
	if (toolChoice != null && hasFunctionTool) switch (toolChoice.type) {
		case "auto":
			mappedToolChoice = "auto";
			break;
		case "required":
			mappedToolChoice = "any";
			break;
		case "none":
			mappedToolChoice = "none";
			break;
		case "tool":
			mappedToolChoice = { allowed_tools: {
				mode: "validated",
				tools: [toolChoice.toolName]
			} };
			break;
	}
	return {
		tools: interactionsTools.length > 0 ? interactionsTools : void 0,
		toolChoice: mappedToolChoice,
		toolWarnings
	};
}
var DEFAULT_MAX_RETRIES = 3;
var DEFAULT_RETRY_DELAY_MS = 500;
function streamGoogleInteractionEvents({ baseURL, interactionId, headers, fetch, abortSignal, maxRetries = DEFAULT_MAX_RETRIES, retryDelayMs = DEFAULT_RETRY_DELAY_MS }) {
	if (interactionId.length === 0) throw new Error("google.interactions: cannot stream a background interaction without an id.");
	const eventSourceHeaders = {
		...headers,
		accept: "text/event-stream"
	};
	let lastEventId;
	let complete = false;
	let attempt = 0;
	let receivedAnyEventThisAttempt = false;
	let currentReader;
	const internalAbort = new AbortController();
	const upstreamAbortHandler = () => internalAbort.abort();
	if (abortSignal != null) if (abortSignal.aborted) internalAbort.abort();
	else abortSignal.addEventListener("abort", upstreamAbortHandler, { once: true });
	const effectiveSignal = internalAbort.signal;
	function buildUrl() {
		const base = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;
		const params = new URLSearchParams({ stream: "true" });
		if (lastEventId != null) params.set("last_event_id", lastEventId);
		return `${base}?${params.toString()}`;
	}
	async function openReader() {
		const { value: stream } = await getFromApi({
			url: buildUrl(),
			headers: eventSourceHeaders,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(googleInteractionsEventSchema),
			abortSignal: effectiveSignal,
			fetch
		});
		return stream.getReader();
	}
	return new ReadableStream({
		async start(controller) {
			try {
				while (!complete && !effectiveSignal.aborted) {
					if (currentReader == null) try {
						currentReader = await openReader();
						receivedAnyEventThisAttempt = false;
					} catch (error) {
						if (isAbortError(error) || effectiveSignal.aborted) {
							controller.error(error);
							return;
						}
						attempt++;
						if (attempt >= maxRetries) {
							controller.error(error);
							return;
						}
						await delay(retryDelayMs * attempt, { abortSignal: effectiveSignal });
						continue;
					}
					try {
						const { done, value } = await currentReader.read();
						if (done) {
							currentReader = void 0;
							if (complete) break;
							if (!receivedAnyEventThisAttempt) {
								attempt++;
								if (attempt >= maxRetries) {
									controller.error(/* @__PURE__ */ new Error("google.interactions: SSE stream closed without producing any events."));
									return;
								}
								await delay(retryDelayMs * attempt, { abortSignal: effectiveSignal });
							} else attempt = 0;
							continue;
						}
						receivedAnyEventThisAttempt = true;
						if (value.success) {
							const streamEvent = value.value;
							if (typeof streamEvent.event_id === "string" && streamEvent.event_id.length > 0) lastEventId = streamEvent.event_id;
							if (streamEvent.event_type === "interaction.completed" || streamEvent.event_type === "error") complete = true;
						}
						controller.enqueue(value);
					} catch (error) {
						if (isAbortError(error) || effectiveSignal.aborted) {
							controller.error(error);
							return;
						}
						currentReader = void 0;
						attempt++;
						if (attempt >= maxRetries) {
							controller.error(error);
							return;
						}
						await delay(retryDelayMs * attempt, { abortSignal: effectiveSignal });
					}
				}
				controller.close();
			} catch (error) {
				controller.error(error);
			} finally {
				if (abortSignal != null) abortSignal.removeEventListener("abort", upstreamAbortHandler);
				currentReader?.cancel().catch(() => {});
				currentReader = void 0;
				if (effectiveSignal.aborted && !complete) await cancelGoogleInteraction({
					baseURL,
					interactionId,
					headers,
					fetch
				});
			}
		},
		cancel() {
			internalAbort.abort();
			currentReader?.cancel().catch(() => {});
			currentReader = void 0;
		}
	});
}
function synthesizeGoogleInteractionsAgentStream({ response, warnings, generateId: generateId2, includeRawChunks, headerServiceTier }) {
	return new ReadableStream({ start(controller) {
		var _a, _b, _c;
		controller.enqueue({
			type: "stream-start",
			warnings
		});
		const interactionId = typeof response.id === "string" && response.id.length > 0 ? response.id : void 0;
		let timestamp;
		const created = response.created;
		if (typeof created === "string") {
			const parsed = new Date(created);
			if (!Number.isNaN(parsed.getTime())) timestamp = parsed;
		}
		controller.enqueue({
			type: "response-metadata",
			...interactionId != null ? { id: interactionId } : {},
			modelId: (_a = response.model) != null ? _a : void 0,
			...timestamp ? { timestamp } : {}
		});
		if (includeRawChunks) controller.enqueue({
			type: "raw",
			rawValue: response
		});
		const { content, hasFunctionCall } = parseGoogleInteractionsOutputs({
			steps: (_b = response.steps) != null ? _b : null,
			generateId: generateId2,
			interactionId
		});
		let blockCounter = 0;
		const nextBlockId = () => `${interactionId != null ? interactionId : "agent"}:${blockCounter++}`;
		for (const part of content) switch (part.type) {
			case "text": {
				const id = nextBlockId();
				const providerMetadata2 = part.providerMetadata;
				controller.enqueue({
					type: "text-start",
					id
				});
				if (part.text.length > 0) controller.enqueue({
					type: "text-delta",
					id,
					delta: part.text
				});
				controller.enqueue({
					type: "text-end",
					id,
					...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
				});
				break;
			}
			case "reasoning": {
				const id = nextBlockId();
				const providerMetadata2 = part.providerMetadata;
				controller.enqueue({
					type: "reasoning-start",
					id
				});
				if (part.text.length > 0) controller.enqueue({
					type: "reasoning-delta",
					id,
					delta: part.text
				});
				controller.enqueue({
					type: "reasoning-end",
					id,
					...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
				});
				break;
			}
			case "tool-call": {
				const providerMetadata2 = part.providerMetadata;
				controller.enqueue({
					type: "tool-input-start",
					id: part.toolCallId,
					toolName: part.toolName,
					...part.providerExecuted ? { providerExecuted: part.providerExecuted } : {}
				});
				controller.enqueue({
					type: "tool-input-delta",
					id: part.toolCallId,
					delta: part.input
				});
				controller.enqueue({
					type: "tool-input-end",
					id: part.toolCallId
				});
				controller.enqueue({
					type: "tool-call",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: part.input,
					...part.providerExecuted ? { providerExecuted: part.providerExecuted } : {},
					...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
				});
				break;
			}
			case "tool-result":
				controller.enqueue({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					result: part.result
				});
				break;
			case "source":
			case "file":
				controller.enqueue(part);
				break;
			default: break;
		}
		const serviceTier = (_c = response.service_tier) != null ? _c : headerServiceTier;
		const finishReason = {
			unified: mapGoogleInteractionsFinishReason({
				status: response.status,
				hasFunctionCall
			}),
			raw: response.status
		};
		const providerMetadata = { google: {
			...interactionId != null ? { interactionId } : {},
			...serviceTier != null ? { serviceTier } : {}
		} };
		controller.enqueue({
			type: "finish",
			finishReason,
			usage: convertGoogleInteractionsUsage(response.usage),
			providerMetadata
		});
		controller.close();
	} });
}
var GoogleInteractionsLanguageModel = class _GoogleInteractionsLanguageModel {
	constructor(modelOrAgent, config) {
		this.specificationVersion = "v4";
		if (typeof modelOrAgent === "string") {
			this.modelId = modelOrAgent;
			this.agent = void 0;
		} else if ("managedAgent" in modelOrAgent) {
			this.modelId = modelOrAgent.managedAgent;
			this.agent = modelOrAgent.managedAgent;
		} else {
			this.modelId = modelOrAgent.agent;
			this.agent = modelOrAgent.agent;
		}
		this.config = config;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return {
			...serializeModelOptions({
				modelId: model.modelId,
				config: model.config
			}),
			agent: model.agent
		};
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GoogleInteractionsLanguageModel(options.agent != null ? { agent: options.agent } : options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	get supportedUrls() {
		if (this.config.supportedUrls) return this.config.supportedUrls();
		return {
			"image/*": [/^https?:\/\/.+/],
			"application/pdf": [/^https?:\/\/.+/],
			"audio/*": [/^https?:\/\/.+/],
			"video/*": [
				/^https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,
				/^https?:\/\/youtu\.be\/.+/,
				/^gs:\/\/.+/
			]
		};
	}
	async getArgs(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
		const warnings = [];
		const googleOptions = await parseProviderOptions({
			provider: "google",
			providerOptions: options.providerOptions,
			schema: googleInteractionsLanguageModelOptions
		});
		const isAgent = this.agent != null;
		const hasTools = options.tools != null && options.tools.length > 0;
		let toolsForBody;
		let toolChoiceForBody;
		if (hasTools && isAgent) warnings.push({
			type: "other",
			message: "google.interactions: tools are not supported when an agent is set; tools will be omitted from the request body."
		});
		else if (hasTools) {
			const prepared = prepareGoogleInteractionsTools({
				tools: options.tools,
				toolChoice: options.toolChoice
			});
			toolsForBody = prepared.tools;
			toolChoiceForBody = prepared.toolChoice;
			warnings.push(...prepared.toolWarnings);
		}
		const responseFormatEntries = [];
		if (((_a = options.responseFormat) == null ? void 0 : _a.type) === "json") if (isAgent) warnings.push({
			type: "other",
			message: "google.interactions: structured output (responseFormat) is not supported when an agent is set; responseFormat will be ignored."
		});
		else {
			const entry = {
				type: "text",
				mime_type: "application/json",
				...options.responseFormat.schema != null ? { schema: options.responseFormat.schema } : {}
			};
			responseFormatEntries.push(entry);
		}
		if ((googleOptions == null ? void 0 : googleOptions.responseFormat) != null) {
			for (const entry of googleOptions.responseFormat) if (entry.type === "text") responseFormatEntries.push(pruneUndefined({
				type: "text",
				mime_type: (_b = entry.mimeType) != null ? _b : void 0,
				schema: (_c = entry.schema) != null ? _c : void 0
			}));
			else if (entry.type === "image") responseFormatEntries.push(pruneUndefined({
				type: "image",
				mime_type: (_d = entry.mimeType) != null ? _d : void 0,
				aspect_ratio: (_e = entry.aspectRatio) != null ? _e : void 0,
				image_size: (_f = entry.imageSize) != null ? _f : void 0
			}));
			else if (entry.type === "audio") responseFormatEntries.push(pruneUndefined({
				type: "audio",
				mime_type: (_g = entry.mimeType) != null ? _g : void 0
			}));
		}
		const { input, systemInstruction: convertedSystemInstruction, warnings: convWarnings } = convertToGoogleInteractionsInput({
			prompt: options.prompt,
			previousInteractionId: (_h = googleOptions == null ? void 0 : googleOptions.previousInteractionId) != null ? _h : void 0,
			store: (_i = googleOptions == null ? void 0 : googleOptions.store) != null ? _i : void 0,
			mediaResolution: (_j = googleOptions == null ? void 0 : googleOptions.mediaResolution) != null ? _j : void 0
		});
		warnings.push(...convWarnings);
		let systemInstruction = convertedSystemInstruction;
		const optionSystemInstruction = (_k = googleOptions == null ? void 0 : googleOptions.systemInstruction) != null ? _k : void 0;
		if (systemInstruction != null && optionSystemInstruction != null) warnings.push({
			type: "other",
			message: "google.interactions: both AI SDK system message and providerOptions.google.systemInstruction were set; using the AI SDK system message."
		});
		else if (systemInstruction == null && optionSystemInstruction != null) systemInstruction = optionSystemInstruction;
		let generationConfig;
		if (isAgent) {
			const droppedFields = [];
			if (options.temperature != null) droppedFields.push("temperature");
			if (options.topP != null) droppedFields.push("topP");
			if (options.seed != null) droppedFields.push("seed");
			if (options.stopSequences != null && options.stopSequences.length > 0) droppedFields.push("stopSequences");
			if (options.maxOutputTokens != null) droppedFields.push("maxOutputTokens");
			if ((googleOptions == null ? void 0 : googleOptions.thinkingLevel) != null) droppedFields.push("thinkingLevel");
			if ((googleOptions == null ? void 0 : googleOptions.thinkingSummaries) != null) droppedFields.push("thinkingSummaries");
			if ((googleOptions == null ? void 0 : googleOptions.imageConfig) != null) droppedFields.push("imageConfig");
			if (droppedFields.length > 0) warnings.push({
				type: "other",
				message: `google.interactions: ${droppedFields.join(", ")} ${droppedFields.length === 1 ? "is" : "are"} not supported when an agent is set; use providerOptions.google.agentConfig instead. Dropped from the request body.`
			});
			generationConfig = void 0;
		} else {
			generationConfig = pruneUndefined({
				temperature: (_l = options.temperature) != null ? _l : void 0,
				top_p: (_m = options.topP) != null ? _m : void 0,
				seed: (_n = options.seed) != null ? _n : void 0,
				stop_sequences: options.stopSequences != null && options.stopSequences.length > 0 ? options.stopSequences : void 0,
				max_output_tokens: (_o = options.maxOutputTokens) != null ? _o : void 0,
				thinking_level: (_p = googleOptions == null ? void 0 : googleOptions.thinkingLevel) != null ? _p : void 0,
				thinking_summaries: (_q = googleOptions == null ? void 0 : googleOptions.thinkingSummaries) != null ? _q : void 0,
				tool_choice: toolChoiceForBody
			});
			if ((googleOptions == null ? void 0 : googleOptions.imageConfig) != null) {
				const alreadyHasImageEntry = responseFormatEntries.some((entry) => entry.type === "image");
				warnings.push({
					type: "other",
					message: alreadyHasImageEntry ? "google.interactions: providerOptions.google.imageConfig is deprecated and was ignored because providerOptions.google.responseFormat already supplies an image entry. Use responseFormat exclusively." : "google.interactions: providerOptions.google.imageConfig is deprecated. Use providerOptions.google.responseFormat with a { type: \"image\", ... } entry instead."
				});
				if (!alreadyHasImageEntry) responseFormatEntries.push({
					type: "image",
					mime_type: "image/png",
					...googleOptions.imageConfig.aspectRatio != null ? { aspect_ratio: googleOptions.imageConfig.aspectRatio } : {},
					...googleOptions.imageConfig.imageSize != null ? { image_size: googleOptions.imageConfig.imageSize } : {}
				});
			}
		}
		let agentConfig;
		if (isAgent && (googleOptions == null ? void 0 : googleOptions.agentConfig) != null) {
			const agentConfigOptions = googleOptions.agentConfig;
			if (agentConfigOptions.type === "deep-research") agentConfig = pruneUndefined({
				type: "deep-research",
				thinking_summaries: (_r = agentConfigOptions.thinkingSummaries) != null ? _r : void 0,
				visualization: (_s = agentConfigOptions.visualization) != null ? _s : void 0,
				collaborative_planning: (_t = agentConfigOptions.collaborativePlanning) != null ? _t : void 0
			});
			else if (agentConfigOptions.type === "dynamic") agentConfig = { type: "dynamic" };
		}
		let environment;
		if ((googleOptions == null ? void 0 : googleOptions.environment) != null) if (!isAgent) warnings.push({
			type: "other",
			message: "google.interactions: environment is only supported when an agent is set; environment will be omitted from the request body."
		});
		else if (typeof googleOptions.environment === "string") environment = googleOptions.environment;
		else {
			const environmentOptions = googleOptions.environment;
			const sources = (_u = environmentOptions.sources) == null ? void 0 : _u.map((source) => {
				var _a2;
				if (source.type === "inline") return {
					type: "inline",
					content: source.content,
					target: source.target
				};
				return pruneUndefined({
					type: source.type,
					source: source.source,
					target: (_a2 = source.target) != null ? _a2 : void 0
				});
			});
			let network;
			if (environmentOptions.network === "disabled") network = "disabled";
			else if (environmentOptions.network != null) network = { allowlist: environmentOptions.network.allowlist.map((entry) => {
				var _a2;
				return pruneUndefined({
					domain: entry.domain,
					transform: (_a2 = entry.transform) != null ? _a2 : void 0
				});
			}) };
			environment = pruneUndefined({
				type: "remote",
				sources: sources != null && sources.length > 0 ? sources : void 0,
				network
			});
		}
		return {
			args: pruneUndefined({
				...isAgent ? { agent: this.agent } : { model: this.modelId },
				input,
				system_instruction: systemInstruction,
				tools: toolsForBody,
				response_format: responseFormatEntries.length > 0 ? responseFormatEntries : void 0,
				response_modalities: (googleOptions == null ? void 0 : googleOptions.responseModalities) != null ? googleOptions.responseModalities : void 0,
				previous_interaction_id: (_v = googleOptions == null ? void 0 : googleOptions.previousInteractionId) != null ? _v : void 0,
				service_tier: (_w = googleOptions == null ? void 0 : googleOptions.serviceTier) != null ? _w : void 0,
				store: (_x = googleOptions == null ? void 0 : googleOptions.store) != null ? _x : void 0,
				generation_config: generationConfig != null && Object.keys(generationConfig).length > 0 ? generationConfig : void 0,
				agent_config: agentConfig,
				environment,
				background: (_y = googleOptions == null ? void 0 : googleOptions.background) != null ? _y : void 0
			}),
			warnings,
			isAgent,
			isBackground: (googleOptions == null ? void 0 : googleOptions.background) === true,
			pollingTimeoutMs: (_z = googleOptions == null ? void 0 : googleOptions.pollingTimeoutMs) != null ? _z : void 0
		};
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f;
		const { args, warnings, isAgent, pollingTimeoutMs } = await this.getArgs(options);
		const url = `${this.config.baseURL}/interactions`;
		const mergedHeaders = combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers);
		let { responseHeaders, value: response, rawValue: rawResponse } = await postJsonToApi({
			url,
			headers: mergedHeaders,
			body: args,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleInteractionsResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		if (isAgent && !isTerminalStatus(response.status)) {
			const polled = await pollGoogleInteractionUntilTerminal({
				baseURL: this.config.baseURL,
				interactionId: response.id,
				headers: mergedHeaders,
				fetch: this.config.fetch,
				abortSignal: options.abortSignal,
				timeoutMs: pollingTimeoutMs
			});
			response = polled.response;
			rawResponse = polled.rawResponse;
			responseHeaders = (_a = polled.responseHeaders) != null ? _a : responseHeaders;
		}
		const interactionId = typeof response.id === "string" && response.id.length > 0 ? response.id : void 0;
		const { content, hasFunctionCall } = parseGoogleInteractionsOutputs({
			steps: (_b = response.steps) != null ? _b : null,
			generateId: (_c = this.config.generateId) != null ? _c : generateId,
			interactionId
		});
		const finishReason = {
			unified: mapGoogleInteractionsFinishReason({
				status: response.status,
				hasFunctionCall
			}),
			raw: response.status
		};
		const serviceTier = (_e = (_d = response.service_tier) != null ? _d : responseHeaders == null ? void 0 : responseHeaders["x-gemini-service-tier"]) != null ? _e : void 0;
		const outputTokensByModality = getGoogleInteractionsOutputTokensByModality(response.usage);
		const providerMetadata = { google: {
			...interactionId != null ? { interactionId } : {},
			...serviceTier != null ? { serviceTier } : {},
			...outputTokensByModality != null ? { outputTokensByModality } : {}
		} };
		let timestamp;
		if (typeof response.created === "string") {
			const parsed = new Date(response.created);
			if (!Number.isNaN(parsed.getTime())) timestamp = parsed;
		}
		return {
			content,
			finishReason,
			usage: convertGoogleInteractionsUsage(response.usage),
			warnings,
			providerMetadata,
			request: { body: args },
			response: {
				headers: responseHeaders,
				body: rawResponse,
				...interactionId != null ? { id: interactionId } : {},
				...timestamp ? { timestamp } : {},
				modelId: (_f = response.model) != null ? _f : void 0
			}
		};
	}
	async doStream(options) {
		var _a;
		const { args, warnings, isBackground, pollingTimeoutMs } = await this.getArgs(options);
		const url = `${this.config.baseURL}/interactions`;
		const mergedHeaders = combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers);
		if (isBackground) return this.doStreamBackground({
			args,
			warnings,
			url,
			mergedHeaders,
			options,
			pollingTimeoutMs
		});
		const body = {
			...args,
			stream: true
		};
		const { responseHeaders, value: response } = await postJsonToApi({
			url,
			headers: mergedHeaders,
			body,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(googleInteractionsEventSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const headerServiceTier = responseHeaders == null ? void 0 : responseHeaders["x-gemini-service-tier"];
		const transform = buildGoogleInteractionsStreamTransform({
			warnings,
			generateId: (_a = this.config.generateId) != null ? _a : generateId,
			includeRawChunks: options.includeRawChunks,
			serviceTier: headerServiceTier
		});
		return {
			stream: response.pipeThrough(transform),
			request: { body },
			response: { headers: responseHeaders }
		};
	}
	async doStreamBackground({ args, warnings, url, mergedHeaders, options, pollingTimeoutMs }) {
		var _a, _b;
		const { responseHeaders: postHeaders, value: postResponse } = await postJsonToApi({
			url,
			headers: mergedHeaders,
			body: args,
			failedResponseHandler: googleFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleInteractionsResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const interactionId = postResponse.id;
		if (interactionId == null || interactionId.length === 0) throw new Error("google.interactions: background POST response did not include an interaction id; cannot stream the result.");
		const headerServiceTier = postHeaders == null ? void 0 : postHeaders["x-gemini-service-tier"];
		if (isTerminalStatus(postResponse.status)) return {
			stream: synthesizeGoogleInteractionsAgentStream({
				response: postResponse,
				warnings,
				generateId: (_a = this.config.generateId) != null ? _a : generateId,
				includeRawChunks: options.includeRawChunks,
				headerServiceTier
			}),
			request: { body: args },
			response: { headers: postHeaders }
		};
		const events = streamGoogleInteractionEvents({
			baseURL: this.config.baseURL,
			interactionId,
			headers: mergedHeaders,
			fetch: this.config.fetch,
			abortSignal: options.abortSignal
		});
		const transform = buildGoogleInteractionsStreamTransform({
			warnings,
			generateId: (_b = this.config.generateId) != null ? _b : generateId,
			includeRawChunks: options.includeRawChunks,
			serviceTier: headerServiceTier
		});
		return {
			stream: events.pipeThrough(transform),
			request: { body: args },
			response: { headers: postHeaders }
		};
	}
};
function pruneUndefined(obj) {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === void 0) continue;
		result[key] = value;
	}
	return result;
}
//#endregion
export { googleTools as i, GoogleLanguageModel as n, GoogleSpeechModel as r, GoogleInteractionsLanguageModel as t };
