import { a as __toCommonJS, i as __require, n as __esmMin, o as __toESM, r as __exportAll, t as __commonJSMin } from "../../_runtime.mjs";
import { B as array, I as _enum, J as number, K as looseObject, N as WORKFLOW_DESERIALIZE, P as WORKFLOW_SERIALIZE, Q as string, V as boolean, Y as object, ct as ZodFirstPartyTypeKind, nt as toJSONSchema, tt as safeParseAsync } from "./gateway+[...].mjs";
import { i as googleTools, n as GoogleLanguageModel, r as GoogleSpeechModel, t as GoogleInteractionsLanguageModel } from "./google+[...].mjs";
//#region node_modules/@ai-sdk/google-vertex/node_modules/@ai-sdk/provider/dist/index.js
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
var name$3 = "AI_APICallError";
var marker2 = `vercel.ai.error.${name$3}`;
var symbol2 = Symbol.for(marker2);
var _a2, _b2;
var APICallError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name: name$3,
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
var name8 = "AI_LoadSettingError";
var marker9 = `vercel.ai.error.${name8}`;
var symbol9 = Symbol.for(marker9);
var _a9, _b9;
var LoadSettingError = class extends (_b9 = AISDKError, _a9 = symbol9, _b9) {
	constructor({ message }) {
		super({
			name: name8,
			message
		});
		this[_a9] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker9);
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
//#endregion
//#region node_modules/@ai-sdk/google-vertex/node_modules/@ai-sdk/provider-utils/dist/index.js
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => ({
		...combinedHeaders,
		...currentHeaders != null ? currentHeaders : {}
	}), {});
}
var { btoa, atob } = globalThis;
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
async function cancelResponseBody(response) {
	var _a2;
	try {
		await ((_a2 = response.body) == null ? void 0 : _a2.cancel());
	} catch (e) {}
}
var name$2 = "AI_DownloadError";
var marker = `vercel.ai.error.${name$2}`;
var symbol = Symbol.for(marker);
var _a, _b;
var DownloadError = class extends (_b = AISDKError, _a = symbol, _b) {
	constructor({ url, statusCode, statusText, cause, message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}` }) {
		super({
			name: name$2,
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
var VERSION$1 = "5.0.7";
function loadOptionalSetting({ settingValue, environmentVariableName }) {
	if (typeof settingValue === "string") return settingValue;
	if (settingValue != null || typeof process === "undefined") return;
	settingValue = process.env[environmentVariableName];
	if (settingValue == null || typeof settingValue !== "string") return;
	return settingValue;
}
function loadSetting({ settingValue, environmentVariableName, settingName, description }) {
	if (typeof settingValue === "string") return settingValue;
	if (settingValue != null) throw new LoadSettingError({ message: `${description} setting must be a string.` });
	if (typeof process === "undefined") throw new LoadSettingError({ message: `${description} setting is missing. Pass it using the '${settingName}' parameter. Environment variables are not supported in this environment.` });
	settingValue = process.env[environmentVariableName];
	if (settingValue == null) throw new LoadSettingError({ message: `${description} setting is missing. Pass it using the '${settingName}' parameter or the ${environmentVariableName} environment variable.` });
	if (typeof settingValue !== "string") throw new LoadSettingError({ message: `${description} setting must be a string. The value of the ${environmentVariableName} environment variable is not a string.` });
	return settingValue;
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
async function resolve(value) {
	if (typeof value === "function") value = value();
	return Promise.resolve(value);
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
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}
//#endregion
//#region node_modules/extend/index.js
var require_extend = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var hasOwn = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var defineProperty = Object.defineProperty;
	var gOPD = Object.getOwnPropertyDescriptor;
	var isArray = function isArray(arr) {
		if (typeof Array.isArray === "function") return Array.isArray(arr);
		return toStr.call(arr) === "[object Array]";
	};
	var isPlainObject = function isPlainObject(obj) {
		if (!obj || toStr.call(obj) !== "[object Object]") return false;
		var hasOwnConstructor = hasOwn.call(obj, "constructor");
		var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, "isPrototypeOf");
		if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) return false;
		var key;
		for (key in obj);
		return typeof key === "undefined" || hasOwn.call(obj, key);
	};
	var setProperty = function setProperty(target, options) {
		if (defineProperty && options.name === "__proto__") defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
		else target[options.name] = options.newValue;
	};
	var getProperty = function getProperty(obj, name) {
		if (name === "__proto__") {
			if (!hasOwn.call(obj, name)) return;
			else if (gOPD) return gOPD(obj, name).value;
		}
		return obj[name];
	};
	module.exports = function extend() {
		var options, name, src, copy, copyIsArray, clone;
		var target = arguments[0];
		var i = 1;
		var length = arguments.length;
		var deep = false;
		if (typeof target === "boolean") {
			deep = target;
			target = arguments[1] || {};
			i = 2;
		}
		if (target == null || typeof target !== "object" && typeof target !== "function") target = {};
		for (; i < length; ++i) {
			options = arguments[i];
			if (options != null) for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);
				if (target !== copy) {
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else clone = src && isPlainObject(src) ? src : {};
						setProperty(target, {
							name,
							newValue: extend(deep, clone, copy)
						});
					} else if (typeof copy !== "undefined") setProperty(target, {
						name,
						newValue: copy
					});
				}
			}
		}
		return target;
	};
}));
//#endregion
//#region node_modules/gaxios/package.json
var package_exports$1 = /* @__PURE__ */ __exportAll({
	author: () => author$1,
	default: () => package_default$1,
	dependencies: () => dependencies$1,
	description: () => description$1,
	devDependencies: () => devDependencies$1,
	engines: () => engines$1,
	exports: () => exports$1,
	files: () => files$1,
	homepage: () => homepage$1,
	keywords: () => keywords$1,
	license: () => license$1,
	main: () => main$1,
	name: () => name$1,
	repository: () => repository$1,
	scripts: () => scripts$1,
	types: () => types$1,
	version: () => version$1
});
var name$1, version$1, description$1, main$1, types$1, files$1, exports$1, scripts$1, repository$1, keywords$1, engines$1, author$1, license$1, devDependencies$1, dependencies$1, homepage$1, package_default$1;
var init_package$1 = __esmMin((() => {
	name$1 = "gaxios";
	version$1 = "7.2.0";
	description$1 = "A simple common HTTP client specifically for Google APIs and services.";
	main$1 = "build/cjs/src/index.js";
	types$1 = "build/cjs/src/index.d.ts";
	files$1 = ["build/"];
	exports$1 = { ".": {
		"import": {
			"types": "./build/esm/src/index.d.ts",
			"default": "./build/esm/src/index.js"
		},
		"require": {
			"types": "./build/cjs/src/index.d.ts",
			"default": "./build/cjs/src/index.js"
		}
	} };
	scripts$1 = {
		"lint": "gts check --no-inline-config",
		"test": "c8 mocha build/esm/test",
		"presystem-test": "npm run compile",
		"system-test": "mocha build/esm/system-test --timeout 80000",
		"compile": "tsc -b ./tsconfig.json ./tsconfig.cjs.json && node utils/enable-esm.mjs",
		"fix": "gts fix",
		"prepare": "npm run compile",
		"pretest": "npm run compile",
		"webpack": "webpack",
		"prebrowser-test": "npm run compile",
		"browser-test": "node build/browser-test/browser-test-runner.js",
		"docs": "jsdoc -c .jsdoc.js",
		"samples-test": "cd samples/ && npm link ../ && npm test && cd ../",
		"prelint": "cd samples; npm link ../; npm install",
		"clean": "gts clean"
	};
	repository$1 = {
		"type": "git",
		"directory": "core/packages/gaxios",
		"url": "https://github.com/googleapis/google-cloud-node.git"
	};
	keywords$1 = ["google"];
	engines$1 = { "node": ">=18" };
	author$1 = "Google, LLC";
	license$1 = "Apache-2.0";
	devDependencies$1 = {
		"@babel/plugin-proposal-private-methods": "^7.18.6",
		"@types/cors": "^2.8.6",
		"@types/express": "^5.0.0",
		"@types/extend": "^3.0.1",
		"@types/mocha": "^10.0.10",
		"@types/multiparty": "4.2.1",
		"@types/mv": "^2.1.0",
		"@types/ncp": "^2.0.8",
		"@types/node": "^24.0.0",
		"@types/sinon": "^21.0.0",
		"@types/tmp": "^0.2.6",
		"assert": "^2.0.0",
		"browserify": "^17.0.0",
		"c8": "^10.1.3",
		"cors": "^2.8.5",
		"express": "^5.0.0",
		"gts": "^6.0.2",
		"is-docker": "^3.0.0",
		"jsdoc": "^4.0.4",
		"jsdoc-fresh": "^5.0.0",
		"jsdoc-region-tag": "^4.0.0",
		"karma": "^6.0.0",
		"karma-chrome-launcher": "^3.0.0",
		"karma-coverage": "^2.0.0",
		"karma-firefox-launcher": "^2.0.0",
		"karma-mocha": "^2.0.0",
		"karma-remap-coverage": "^0.1.5",
		"karma-sourcemap-loader": "^0.4.0",
		"karma-webpack": "^5.0.1",
		"mocha": "^11.1.0",
		"multiparty": "^4.2.1",
		"mv": "^2.1.1",
		"ncp": "^2.0.0",
		"nock": "14.0.5",
		"null-loader": "^4.0.1",
		"pack-n-play": "^4.0.0",
		"puppeteer": "^24.0.0",
		"sinon": "21.0.3",
		"stream-browserify": "^3.0.0",
		"tmp": "0.2.6",
		"ts-loader": "^9.5.2",
		"typescript": "5.8.3",
		"undici-types": "^7.24.1",
		"webpack": "^5.97.1",
		"webpack-cli": "^6.0.1"
	};
	dependencies$1 = {
		"extend": "^3.0.2",
		"https-proxy-agent": "^7.0.1",
		"node-fetch": "^3.3.2"
	};
	homepage$1 = "https://github.com/googleapis/google-cloud-node/tree/main/core/packages/gaxios";
	package_default$1 = {
		name: name$1,
		version: version$1,
		description: description$1,
		main: main$1,
		types: types$1,
		files: files$1,
		exports: exports$1,
		scripts: scripts$1,
		repository: repository$1,
		keywords: keywords$1,
		engines: engines$1,
		author: author$1,
		license: license$1,
		devDependencies: devDependencies$1,
		dependencies: dependencies$1,
		homepage: homepage$1
	};
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/util.cjs
var require_util$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = { pkg: (init_package$1(), __toCommonJS(package_exports$1).default) };
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GaxiosError = exports.GAXIOS_ERROR_SYMBOL = void 0;
	exports.defaultErrorRedactor = defaultErrorRedactor;
	var extend_1 = __importDefault(require_extend());
	var pkg = __importDefault(require_util$1()).default.pkg;
	/**
	* Support `instanceof` operator for `GaxiosError`s in different versions of this library.
	*
	* @see {@link GaxiosError[Symbol.hasInstance]}
	*/
	exports.GAXIOS_ERROR_SYMBOL = Symbol.for(`${pkg.name}-gaxios-error`);
	exports.GaxiosError = class GaxiosError extends Error {
		config;
		response;
		/**
		* An error code.
		* Can be a system error code, DOMException error name, or any error's 'code' property where it is a `string`.
		*
		* It is only a `number` when the cause is sourced from an API-level error (AIP-193).
		*
		* @see {@link https://nodejs.org/api/errors.html#errorcode error.code}
		* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names DOMException#error_names}
		* @see {@link https://google.aip.dev/193#http11json-representation AIP-193}
		*
		* @example
		* 'ECONNRESET'
		*
		* @example
		* 'TimeoutError'
		*
		* @example
		* 500
		*/
		code;
		/**
		* An HTTP Status code.
		* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response/status Response#status}
		*
		* @example
		* 500
		*/
		status;
		/**
		* @deprecated use {@link GaxiosError.cause} instead.
		*
		* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause Error#cause}
		*
		* @privateRemarks
		*
		* We will want to remove this property later as the modern `cause` property is better suited
		* for displaying and relaying nested errors. Keeping this here makes the resulting
		* error log larger than it needs to be.
		*
		*/
		error;
		/**
		* Support `instanceof` operator for `GaxiosError` across builds/duplicated files.
		*
		* @see {@link GAXIOS_ERROR_SYMBOL}
		* @see {@link GaxiosError[Symbol.hasInstance]}
		* @see {@link https://github.com/microsoft/TypeScript/issues/13965#issuecomment-278570200}
		* @see {@link https://stackoverflow.com/questions/46618852/require-and-instanceof}
		* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/@@hasInstance#reverting_to_default_instanceof_behavior}
		*/
		[exports.GAXIOS_ERROR_SYMBOL] = pkg.version;
		/**
		* Support `instanceof` operator for `GaxiosError` across builds/duplicated files.
		*
		* @see {@link GAXIOS_ERROR_SYMBOL}
		* @see {@link GaxiosError[GAXIOS_ERROR_SYMBOL]}
		*/
		static [Symbol.hasInstance](instance) {
			if (instance && typeof instance === "object" && exports.GAXIOS_ERROR_SYMBOL in instance && instance[exports.GAXIOS_ERROR_SYMBOL] === pkg.version) return true;
			return Function.prototype[Symbol.hasInstance].call(GaxiosError, instance);
		}
		constructor(message, config, response, cause) {
			super(message, { cause });
			this.config = config;
			this.response = response;
			this.error = cause instanceof Error ? cause : void 0;
			this.config = (0, extend_1.default)(true, {}, config);
			if (this.response) this.response.config = (0, extend_1.default)(true, {}, this.response.config);
			if (this.response) {
				try {
					this.response.data = translateData(this.config.responseType, this.response?.bodyUsed ? this.response?.data : void 0);
				} catch {}
				this.status = this.response.status;
			}
			if (cause instanceof DOMException) this.code = cause.name;
			else if (cause && typeof cause === "object" && "code" in cause && (typeof cause.code === "string" || typeof cause.code === "number")) this.code = cause.code;
		}
		/**
		* An AIP-193 conforming error extractor.
		*
		* @see {@link https://google.aip.dev/193#http11json-representation AIP-193}
		*
		* @internal
		* @expiremental
		*
		* @param res the response object
		* @returns the extracted error information
		*/
		static extractAPIErrorFromResponse(res, defaultErrorMessage = "The request failed") {
			let message = defaultErrorMessage;
			if (typeof res.data === "string") message = res.data;
			if (res.data && typeof res.data === "object" && "error" in res.data && res.data.error && !res.ok) {
				if (typeof res.data.error === "string") return {
					message: res.data.error,
					code: res.status,
					status: res.statusText
				};
				if (typeof res.data.error === "object") {
					message = "message" in res.data.error && typeof res.data.error.message === "string" ? res.data.error.message : message;
					const status = "status" in res.data.error && typeof res.data.error.status === "string" ? res.data.error.status : res.statusText;
					const code = "code" in res.data.error && typeof res.data.error.code === "number" ? res.data.error.code : res.status;
					if ("errors" in res.data.error && Array.isArray(res.data.error.errors)) {
						const errorMessages = [];
						for (const e of res.data.error.errors) if (typeof e === "object" && "message" in e && typeof e.message === "string") errorMessages.push(e.message);
						return Object.assign({
							message: errorMessages.join("\n") || message,
							code,
							status
						}, res.data.error);
					}
					return Object.assign({
						message,
						code,
						status
					}, res.data.error);
				}
			}
			return {
				message,
				code: res.status,
				status: res.statusText
			};
		}
	};
	function translateData(responseType, data) {
		switch (responseType) {
			case "stream": return data;
			case "json": return JSON.parse(JSON.stringify(data));
			case "arraybuffer": return JSON.parse(Buffer.from(data).toString("utf8"));
			case "blob": return JSON.parse(data.text());
			default: return data;
		}
	}
	/**
	* An experimental error redactor.
	*
	* @param config Config to potentially redact properties of
	* @param response Config to potentially redact properties of
	*
	* @experimental
	*/
	function defaultErrorRedactor(data) {
		const REDACT = "<<REDACTED> - See `errorRedactor` option in `gaxios` for configuration>.";
		function redactHeaders(headers) {
			if (!headers) return;
			headers.forEach((_, key) => {
				if (/^authentication$/i.test(key) || /^authorization$/i.test(key) || /secret/i.test(key)) headers.set(key, REDACT);
			});
		}
		function redactString(obj, key) {
			if (typeof obj === "object" && obj !== null && typeof obj[key] === "string") {
				const text = obj[key];
				if (/grant_type=/i.test(text) || /assertion=/i.test(text) || /secret/i.test(text)) obj[key] = REDACT;
			}
		}
		function redactObject(obj) {
			if (!obj || typeof obj !== "object") return;
			else if (obj instanceof FormData || obj instanceof URLSearchParams || "forEach" in obj && "set" in obj) obj.forEach((_, key) => {
				if (["grant_type", "assertion"].includes(key) || /secret/.test(key)) obj.set(key, REDACT);
			});
			else {
				if ("grant_type" in obj) obj["grant_type"] = REDACT;
				if ("assertion" in obj) obj["assertion"] = REDACT;
				if ("client_secret" in obj) obj["client_secret"] = REDACT;
			}
		}
		if (data.config) {
			redactHeaders(data.config.headers);
			redactString(data.config, "data");
			redactObject(data.config.data);
			redactString(data.config, "body");
			redactObject(data.config.body);
			if (data.config.url.searchParams.has("token")) data.config.url.searchParams.set("token", REDACT);
			if (data.config.url.searchParams.has("client_secret")) data.config.url.searchParams.set("client_secret", REDACT);
		}
		if (data.response) {
			defaultErrorRedactor({ config: data.response.config });
			redactHeaders(data.response.headers);
			if (data.response.bodyUsed) {
				redactString(data.response, "data");
				redactObject(data.response.data);
			}
		}
		return data;
	}
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/retry.js
var require_retry = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getRetryConfig = getRetryConfig;
	async function getRetryConfig(err) {
		let config = getConfig(err);
		if (!err || !err.config || !config && !err.config.retry) return { shouldRetry: false };
		config = config || {};
		config.currentRetryAttempt = config.currentRetryAttempt || 0;
		config.retry = config.retry === void 0 || config.retry === null ? 3 : config.retry;
		config.httpMethodsToRetry = config.httpMethodsToRetry || [
			"GET",
			"HEAD",
			"PUT",
			"OPTIONS",
			"DELETE"
		];
		config.noResponseRetries = config.noResponseRetries === void 0 || config.noResponseRetries === null ? 2 : config.noResponseRetries;
		config.retryDelayMultiplier = config.retryDelayMultiplier ? config.retryDelayMultiplier : 2;
		config.timeOfFirstRequest = config.timeOfFirstRequest ? config.timeOfFirstRequest : Date.now();
		config.totalTimeout = config.totalTimeout ? config.totalTimeout : Number.MAX_SAFE_INTEGER;
		config.maxRetryDelay = config.maxRetryDelay ? config.maxRetryDelay : Number.MAX_SAFE_INTEGER;
		config.statusCodesToRetry = config.statusCodesToRetry || [
			[100, 199],
			[408, 408],
			[429, 429],
			[500, 599]
		];
		err.config.retryConfig = config;
		if (!await (config.shouldRetry || shouldRetryRequest)(err)) return {
			shouldRetry: false,
			config: err.config
		};
		const delay = getNextRetryDelay(config);
		err.config.retryConfig.currentRetryAttempt += 1;
		const backoff = config.retryBackoff ? config.retryBackoff(err, delay) : new Promise((resolve) => {
			setTimeout(resolve, delay);
		});
		if (config.onRetryAttempt) await config.onRetryAttempt(err);
		await backoff;
		return {
			shouldRetry: true,
			config: err.config
		};
	}
	/**
	* Determine based on config if we should retry the request.
	* @param err The GaxiosError passed to the interceptor.
	*/
	function shouldRetryRequest(err) {
		const config = getConfig(err);
		if (err.config.signal?.aborted && err.code !== "TimeoutError" || err.code === "AbortError") return false;
		if (!config || config.retry === 0) return false;
		if (!err.response && (config.currentRetryAttempt || 0) >= config.noResponseRetries) return false;
		if (!config.httpMethodsToRetry || !config.httpMethodsToRetry.includes(err.config.method?.toUpperCase() || "GET")) return false;
		if (err.response && err.response.status) {
			let isInRange = false;
			for (const [min, max] of config.statusCodesToRetry) {
				const status = err.response.status;
				if (status >= min && status <= max) {
					isInRange = true;
					break;
				}
			}
			if (!isInRange) return false;
		}
		config.currentRetryAttempt = config.currentRetryAttempt || 0;
		if (config.currentRetryAttempt >= config.retry) return false;
		return true;
	}
	/**
	* Acquire the raxConfig object from an GaxiosError if available.
	* @param err The Gaxios error with a config object.
	*/
	function getConfig(err) {
		if (err && err.config && err.config.retryConfig) return err.config.retryConfig;
	}
	/**
	* Gets the delay to wait before the next retry.
	*
	* @param {RetryConfig} config The current set of retry options
	* @returns {number} the amount of ms to wait before the next retry attempt.
	*/
	function getNextRetryDelay(config) {
		const calculatedDelay = (config.currentRetryAttempt ? 0 : config.retryDelay ?? 100) + (Math.pow(config.retryDelayMultiplier, config.currentRetryAttempt) - 1) / 2 * 1e3;
		const maxAllowableDelay = config.totalTimeout - (Date.now() - config.timeOfFirstRequest);
		return Math.min(calculatedDelay, maxAllowableDelay, config.maxRetryDelay);
	}
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/interceptor.js
var require_interceptor = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GaxiosInterceptorManager = void 0;
	/**
	* Class to manage collections of GaxiosInterceptors for both requests and responses.
	*/
	var GaxiosInterceptorManager = class extends Set {};
	exports.GaxiosInterceptorManager = GaxiosInterceptorManager;
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/gaxios.js
var require_gaxios = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	var _a;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Gaxios = void 0;
	var extend_1 = __importDefault(require_extend());
	var https_1 = __require("https");
	var common_js_1 = require_common();
	var retry_js_1 = require_retry();
	var stream_1 = __require("stream");
	var interceptor_js_1 = require_interceptor();
	var randomUUID = async () => globalThis.crypto?.randomUUID() || (await import("crypto")).randomUUID();
	var HTTP_STATUS_NO_CONTENT = 204;
	var Gaxios = class {
		agentCache = /* @__PURE__ */ new Map();
		/**
		* Default HTTP options that will be used for every HTTP request.
		*/
		defaults;
		/**
		* Interceptors
		*/
		interceptors;
		/**
		* The Gaxios class is responsible for making HTTP requests.
		* @param defaults The default set of options to be used for this instance.
		*/
		constructor(defaults) {
			this.defaults = defaults || {};
			this.interceptors = {
				request: new interceptor_js_1.GaxiosInterceptorManager(),
				response: new interceptor_js_1.GaxiosInterceptorManager()
			};
		}
		/**
		* A {@link fetch `fetch`} compliant API for {@link Gaxios}.
		*
		* @remarks
		*
		* This is useful as a drop-in replacement for `fetch` API usage.
		*
		* @example
		*
		* ```ts
		* const gaxios = new Gaxios();
		* const myFetch: typeof fetch = (...args) => gaxios.fetch(...args);
		* await myFetch('https://example.com');
		* ```
		*
		* @param args `fetch` API or `Gaxios#request` parameters
		* @returns the {@link Response} with Gaxios-added properties
		*/
		fetch(...args) {
			const input = args[0];
			const init = args[1];
			let url = void 0;
			const headers = new Headers();
			if (typeof input === "string") url = new URL(input);
			else if (input instanceof URL) url = input;
			else if (input && input.url) url = new URL(input.url);
			if (input && typeof input === "object" && "headers" in input) _a.mergeHeaders(headers, input.headers);
			if (init) _a.mergeHeaders(headers, new Headers(init.headers));
			if (typeof input === "object" && !(input instanceof URL)) return this.request({
				...init,
				...input,
				headers,
				url
			});
			else return this.request({
				...init,
				headers,
				url
			});
		}
		/**
		* Perform an HTTP request with the given options.
		* @param opts Set of HTTP options that will be used for this HTTP request.
		*/
		async request(opts = {}) {
			let prepared = await this.#prepareRequest(opts);
			prepared = await this.#applyRequestInterceptors(prepared);
			return this.#applyResponseInterceptors(this._request(prepared));
		}
		async _defaultAdapter(config) {
			const fetchImpl = config.fetchImplementation || this.defaults.fetchImplementation || await _a.#getFetch();
			const preparedOpts = { ...config };
			delete preparedOpts.data;
			const res = await fetchImpl(config.url, preparedOpts);
			const data = await this.getResponseData(config, res);
			if (!Object.getOwnPropertyDescriptor(res, "data")?.configurable) Object.defineProperties(res, { data: {
				configurable: true,
				writable: true,
				enumerable: true,
				value: data
			} });
			return Object.assign(res, {
				config,
				data
			});
		}
		/**
		* Internal, retryable version of the `request` method.
		* @param opts Set of HTTP options that will be used for this HTTP request.
		*/
		async _request(opts) {
			try {
				let translatedResponse;
				if (opts.adapter) translatedResponse = await opts.adapter(opts, this._defaultAdapter.bind(this));
				else translatedResponse = await this._defaultAdapter(opts);
				if (!opts.validateStatus(translatedResponse.status)) {
					if (opts.responseType === "stream") {
						const response = [];
						for await (const chunk of translatedResponse.data) response.push(chunk);
						translatedResponse.data = Buffer.concat(response.map((c) => typeof c === "string" ? Buffer.from(c) : c)).toString("utf8");
					}
					const errorInfo = common_js_1.GaxiosError.extractAPIErrorFromResponse(translatedResponse, `Request failed with status code ${translatedResponse.status}`);
					throw new common_js_1.GaxiosError(errorInfo?.message, opts, translatedResponse, errorInfo);
				}
				return translatedResponse;
			} catch (e) {
				let err;
				if (e instanceof common_js_1.GaxiosError) err = e;
				else if (e instanceof Error) err = new common_js_1.GaxiosError(e.message, opts, void 0, e);
				else err = new common_js_1.GaxiosError("Unexpected Gaxios Error", opts, void 0, e);
				const { shouldRetry, config } = await (0, retry_js_1.getRetryConfig)(err);
				if (shouldRetry && config) {
					err.config.retryConfig.currentRetryAttempt = config.retryConfig.currentRetryAttempt;
					opts.retryConfig = err.config?.retryConfig;
					this.#appendTimeoutToSignal(opts);
					return this._request(opts);
				}
				if (opts.errorRedactor) opts.errorRedactor(err);
				throw err;
			}
		}
		async getResponseData(opts, res) {
			if (res.status === HTTP_STATUS_NO_CONTENT) return "";
			if (opts.maxContentLength && res.headers.has("content-length") && opts.maxContentLength < Number.parseInt(res.headers?.get("content-length") || "")) throw new common_js_1.GaxiosError("Response's `Content-Length` is over the limit.", opts, Object.assign(res, { config: opts }));
			switch (opts.responseType) {
				case "stream": return res.body;
				case "json": {
					const data = await res.text();
					try {
						return JSON.parse(data);
					} catch {
						return data;
					}
				}
				case "arraybuffer": return res.arrayBuffer();
				case "blob": return res.blob();
				case "text": return res.text();
				default: return this.getResponseDataFromContentType(res);
			}
		}
		#urlMayUseProxy(url, noProxy = []) {
			const candidate = new URL(url);
			const noProxyList = [...noProxy];
			const noProxyEnvList = (process.env.NO_PROXY ?? process.env.no_proxy)?.split(",") || [];
			for (const rule of noProxyEnvList) noProxyList.push(rule.trim());
			for (const rule of noProxyList) if (rule instanceof RegExp) {
				if (rule.test(candidate.toString())) return false;
			} else if (rule instanceof URL) {
				if (rule.origin === candidate.origin) return false;
			} else if (rule.startsWith("*.") || rule.startsWith(".")) {
				const cleanedRule = rule.replace(/^\*\./, ".");
				if (candidate.hostname.endsWith(cleanedRule)) return false;
			} else if (rule === candidate.origin || rule === candidate.hostname || rule === candidate.href) return false;
			return true;
		}
		/**
		* Applies the request interceptors. The request interceptors are applied after the
		* call to prepareRequest is completed.
		*
		* @param {GaxiosOptionsPrepared} options The current set of options.
		*
		* @returns {Promise<GaxiosOptionsPrepared>} Promise that resolves to the set of options or response after interceptors are applied.
		*/
		async #applyRequestInterceptors(options) {
			let promiseChain = Promise.resolve(options);
			for (const interceptor of this.interceptors.request.values()) if (interceptor) promiseChain = promiseChain.then(interceptor.resolved, interceptor.rejected);
			return promiseChain;
		}
		/**
		* Applies the response interceptors. The response interceptors are applied after the
		* call to request is made.
		*
		* @param {GaxiosOptionsPrepared} options The current set of options.
		*
		* @returns {Promise<GaxiosOptionsPrepared>} Promise that resolves to the set of options or response after interceptors are applied.
		*/
		async #applyResponseInterceptors(response) {
			let promiseChain = Promise.resolve(response);
			for (const interceptor of this.interceptors.response.values()) if (interceptor) promiseChain = promiseChain.then(interceptor.resolved, interceptor.rejected);
			return promiseChain;
		}
		/**
		* Validates the options, merges them with defaults, and prepare request.
		*
		* @param options The original options passed from the client.
		* @returns Prepared options, ready to make a request
		*/
		async #prepareRequest(options) {
			const preparedHeaders = new Headers(this.defaults.headers);
			_a.mergeHeaders(preparedHeaders, options.headers);
			const opts = (0, extend_1.default)(true, {}, this.defaults, options);
			if (!opts.url) throw new Error("URL is required.");
			if (opts.baseURL) opts.url = new URL(opts.url, opts.baseURL);
			opts.url = new URL(opts.url);
			if (opts.params) if (opts.paramsSerializer) {
				let additionalQueryParams = opts.paramsSerializer(opts.params);
				if (additionalQueryParams.startsWith("?")) additionalQueryParams = additionalQueryParams.slice(1);
				const prefix = opts.url.toString().includes("?") ? "&" : "?";
				opts.url = opts.url + prefix + additionalQueryParams;
			} else {
				const url = opts.url instanceof URL ? opts.url : new URL(opts.url);
				for (const [key, value] of new URLSearchParams(opts.params)) url.searchParams.append(key, value);
				opts.url = url;
			}
			if (typeof options.maxContentLength === "number") opts.size = options.maxContentLength;
			if (typeof options.maxRedirects === "number") opts.follow = options.maxRedirects;
			const shouldDirectlyPassData = typeof opts.data === "string" || opts.data instanceof ArrayBuffer || opts.data instanceof Blob || globalThis.File && opts.data instanceof File || opts.data instanceof FormData || opts.data instanceof stream_1.Readable || opts.data instanceof ReadableStream || opts.data instanceof String || opts.data instanceof URLSearchParams || ArrayBuffer.isView(opts.data) || [
				"Blob",
				"File",
				"FormData"
			].includes(opts.data?.constructor?.name || "");
			if (opts.multipart?.length) {
				const boundary = await randomUUID();
				preparedHeaders.set("content-type", `multipart/related; boundary=${boundary}`);
				opts.body = stream_1.Readable.from(this.getMultipartRequest(opts.multipart, boundary));
			} else if (shouldDirectlyPassData) opts.body = opts.data;
			else if (typeof opts.data === "object") if (preparedHeaders.get("Content-Type") === "application/x-www-form-urlencoded") opts.body = opts.paramsSerializer ? opts.paramsSerializer(opts.data) : new URLSearchParams(opts.data);
			else {
				if (!preparedHeaders.has("content-type")) preparedHeaders.set("content-type", "application/json");
				opts.body = JSON.stringify(opts.data);
			}
			else if (opts.data) opts.body = opts.data;
			opts.validateStatus = opts.validateStatus || this.validateStatus;
			opts.responseType = opts.responseType || "unknown";
			if (!preparedHeaders.has("accept") && opts.responseType === "json") preparedHeaders.set("accept", "application/json");
			const proxy = opts.proxy || process?.env?.HTTPS_PROXY || process?.env?.https_proxy || process?.env?.HTTP_PROXY || process?.env?.http_proxy;
			if (opts.agent) {} else if (proxy && this.#urlMayUseProxy(opts.url, opts.noProxy)) {
				const HttpsProxyAgent = await _a.#getProxyAgent();
				if (this.agentCache.has(proxy)) opts.agent = this.agentCache.get(proxy);
				else {
					opts.agent = new HttpsProxyAgent(proxy, {
						cert: opts.cert,
						key: opts.key
					});
					this.agentCache.set(proxy, opts.agent);
				}
			} else if (opts.cert && opts.key) if (this.agentCache.has(opts.key)) opts.agent = this.agentCache.get(opts.key);
			else {
				opts.agent = new https_1.Agent({
					cert: opts.cert,
					key: opts.key
				});
				this.agentCache.set(opts.key, opts.agent);
			}
			if (typeof opts.errorRedactor !== "function" && opts.errorRedactor !== false) opts.errorRedactor = common_js_1.defaultErrorRedactor;
			if (opts.body && !("duplex" in opts))
 /**
			* required for Node.js and the type isn't available today
			* @link https://github.com/nodejs/node/issues/46221
			* @link https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1483
			*/
			opts.duplex = "half";
			this.#appendTimeoutToSignal(opts);
			return Object.assign(opts, {
				headers: preparedHeaders,
				url: opts.url instanceof URL ? opts.url : new URL(opts.url)
			});
		}
		#appendTimeoutToSignal(opts) {
			if (opts.timeout) {
				const timeoutSignal = AbortSignal.timeout(opts.timeout);
				if (opts.signal && !opts.signal.aborted) opts.signal = AbortSignal.any([opts.signal, timeoutSignal]);
				else opts.signal = timeoutSignal;
			}
		}
		/**
		* By default, throw for any non-2xx status code
		* @param status status code from the HTTP response
		*/
		validateStatus(status) {
			return status >= 200 && status < 300;
		}
		/**
		* Attempts to parse a response by looking at the Content-Type header.
		* @param {Response} response the HTTP response.
		* @returns a promise that resolves to the response data.
		*/
		async getResponseDataFromContentType(response) {
			let contentType = response.headers.get("Content-Type");
			if (contentType === null) return response.text();
			contentType = contentType.toLowerCase();
			if (contentType.includes("application/json")) {
				let data = await response.text();
				try {
					data = JSON.parse(data);
				} catch {}
				return data;
			} else if (contentType.match(/^text\//)) return response.text();
			else return response.blob();
		}
		/**
		* Creates an async generator that yields the pieces of a multipart/related request body.
		* This implementation follows the spec: https://www.ietf.org/rfc/rfc2387.txt. However, recursive
		* multipart/related requests are not currently supported.
		*
		* @param {GaxiosMultipartOptions[]} multipartOptions the pieces to turn into a multipart/related body.
		* @param {string} boundary the boundary string to be placed between each part.
		*/
		async *getMultipartRequest(multipartOptions, boundary) {
			const finale = `--${boundary}--`;
			for (const currentPart of multipartOptions) {
				yield `--${boundary}\r\nContent-Type: ${currentPart.headers.get("Content-Type") || "application/octet-stream"}\r\n\r\n`;
				if (typeof currentPart.content === "string") yield currentPart.content;
				else yield* currentPart.content;
				yield "\r\n";
			}
			yield finale;
		}
		/**
		* A cache for the lazily-loaded proxy agent.
		*
		* Should use {@link Gaxios[#getProxyAgent]} to retrieve.
		*/
		static #proxyAgent;
		/**
		* A cache for the lazily-loaded fetch library.
		*
		* Should use {@link Gaxios[#getFetch]} to retrieve.
		*/
		static #fetch;
		/**
		* Imports, caches, and returns a proxy agent - if not already imported
		*
		* @returns A proxy agent
		*/
		static async #getProxyAgent() {
			this.#proxyAgent ||= (await import("../https-proxy-agent.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()))).HttpsProxyAgent;
			return this.#proxyAgent;
		}
		static async #getFetch() {
			const hasWindow = typeof window !== "undefined" && !!window;
			this.#fetch ||= hasWindow ? window.fetch : (await import("../node-fetch.mjs").then((n) => (n.t(), n.n))).default;
			return this.#fetch;
		}
		/**
		* Merges headers.
		* If the base headers do not exist a new `Headers` object will be returned.
		*
		* @remarks
		*
		* Using this utility can be helpful when the headers are not known to exist:
		* - if they exist as `Headers`, that instance will be used
		*   - it improves performance and allows users to use their existing references to their `Headers`
		* - if they exist in another form (`HeadersInit`), they will be used to create a new `Headers` object
		* - if the base headers do not exist a new `Headers` object will be created
		*
		* @param base headers to append/overwrite to
		* @param append headers to append/overwrite with
		* @returns the base headers instance with merged `Headers`
		*/
		static mergeHeaders(base, ...append) {
			base = base instanceof Headers ? base : new Headers(base);
			for (const headers of append) (headers instanceof Headers ? headers : new Headers(headers)).forEach((value, key) => {
				key === "set-cookie" ? base.append(key, value) : base.set(key, value);
			});
			return base;
		}
	};
	exports.Gaxios = Gaxios;
	_a = Gaxios;
}));
//#endregion
//#region node_modules/gaxios/build/cjs/src/index.js
var require_src$3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$6) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$6, p)) __createBinding(exports$6, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.instance = exports.Gaxios = exports.GaxiosError = void 0;
	exports.request = request;
	var gaxios_js_1 = require_gaxios();
	Object.defineProperty(exports, "Gaxios", {
		enumerable: true,
		get: function() {
			return gaxios_js_1.Gaxios;
		}
	});
	var common_js_1 = require_common();
	Object.defineProperty(exports, "GaxiosError", {
		enumerable: true,
		get: function() {
			return common_js_1.GaxiosError;
		}
	});
	__exportStar(require_interceptor(), exports);
	/**
	* The default instance used when the `request` method is directly
	* invoked.
	*/
	exports.instance = new gaxios_js_1.Gaxios();
	/**
	* Make an HTTP request using the given options.
	* @param opts Options for the request
	*/
	async function request(opts) {
		return exports.instance.request(opts);
	}
}));
//#endregion
//#region node_modules/bignumber.js/bignumber.js
var require_bignumber = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(globalObject) {
		"use strict";
		var BigNumber, isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i, mathceil = Math.ceil, mathfloor = Math.floor, bignumberError = "[BigNumber Error] ", tooManyDigits = bignumberError + "Number primitive has more than 15 significant digits: ", BASE = 0x5af3107a4000, LOG_BASE = 14, MAX_SAFE_INTEGER = 9007199254740991, POWS_TEN = [
			1,
			10,
			100,
			1e3,
			1e4,
			1e5,
			1e6,
			1e7,
			1e8,
			1e9,
			1e10,
			1e11,
			0xe8d4a51000,
			0x9184e72a000
		], SQRT_BASE = 1e7, MAX = 1e9;
		function clone(configObject) {
			var div, convertBase, parseNumeric, P = BigNumber.prototype = {
				constructor: BigNumber,
				toString: null,
				valueOf: null
			}, ONE = new BigNumber(1), DECIMAL_PLACES = 20, ROUNDING_MODE = 4, TO_EXP_NEG = -7, TO_EXP_POS = 21, MIN_EXP = -1e7, MAX_EXP = 1e7, CRYPTO = false, MODULO_MODE = 1, POW_PRECISION = 0, FORMAT = {
				prefix: "",
				groupSize: 3,
				secondaryGroupSize: 0,
				groupSeparator: ",",
				decimalSeparator: ".",
				fractionGroupSize: 0,
				fractionGroupSeparator: "\xA0",
				suffix: ""
			}, ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz", alphabetHasNormalDecimalDigits = true;
			function BigNumber(v, b) {
				var alphabet, c, caseChanged, e, i, isNum, len, str, x = this;
				if (!(x instanceof BigNumber)) return new BigNumber(v, b);
				if (b == null) {
					if (v && v._isBigNumber === true) {
						x.s = v.s;
						if (!v.c || v.e > MAX_EXP) x.c = x.e = null;
						else if (v.e < MIN_EXP) x.c = [x.e = 0];
						else {
							x.e = v.e;
							x.c = v.c.slice();
						}
						return;
					}
					if ((isNum = typeof v == "number") && v * 0 == 0) {
						x.s = 1 / v < 0 ? (v = -v, -1) : 1;
						if (v === ~~v) {
							for (e = 0, i = v; i >= 10; i /= 10, e++);
							if (e > MAX_EXP) x.c = x.e = null;
							else {
								x.e = e;
								x.c = [v];
							}
							return;
						}
						str = String(v);
					} else {
						if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);
						x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
					}
					if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
					if ((i = str.search(/e/i)) > 0) {
						if (e < 0) e = i;
						e += +str.slice(i + 1);
						str = str.substring(0, i);
					} else if (e < 0) e = str.length;
				} else {
					intCheck(b, 2, ALPHABET.length, "Base");
					if (b == 10 && alphabetHasNormalDecimalDigits) {
						x = new BigNumber(v);
						return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
					}
					str = String(v);
					if (isNum = typeof v == "number") {
						if (v * 0 != 0) return parseNumeric(x, str, isNum, b);
						x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;
						if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, "").length > 15) throw Error(tooManyDigits + v);
					} else x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
					alphabet = ALPHABET.slice(0, b);
					e = i = 0;
					for (len = str.length; i < len; i++) if (alphabet.indexOf(c = str.charAt(i)) < 0) {
						if (c == ".") {
							if (i > e) {
								e = len;
								continue;
							}
						} else if (!caseChanged) {
							if (str == str.toUpperCase() && (str = str.toLowerCase()) || str == str.toLowerCase() && (str = str.toUpperCase())) {
								caseChanged = true;
								i = -1;
								e = 0;
								continue;
							}
						}
						return parseNumeric(x, String(v), isNum, b);
					}
					isNum = false;
					str = convertBase(str, b, 10, x.s);
					if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
					else e = str.length;
				}
				for (i = 0; str.charCodeAt(i) === 48; i++);
				for (len = str.length; str.charCodeAt(--len) === 48;);
				if (str = str.slice(i, ++len)) {
					len -= i;
					if (isNum && BigNumber.DEBUG && len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) throw Error(tooManyDigits + x.s * v);
					if ((e = e - i - 1) > MAX_EXP) x.c = x.e = null;
					else if (e < MIN_EXP) x.c = [x.e = 0];
					else {
						x.e = e;
						x.c = [];
						i = (e + 1) % LOG_BASE;
						if (e < 0) i += LOG_BASE;
						if (i < len) {
							if (i) x.c.push(+str.slice(0, i));
							for (len -= LOG_BASE; i < len;) x.c.push(+str.slice(i, i += LOG_BASE));
							i = LOG_BASE - (str = str.slice(i)).length;
						} else i -= len;
						for (; i--; str += "0");
						x.c.push(+str);
					}
				} else x.c = [x.e = 0];
			}
			BigNumber.clone = clone;
			BigNumber.ROUND_UP = 0;
			BigNumber.ROUND_DOWN = 1;
			BigNumber.ROUND_CEIL = 2;
			BigNumber.ROUND_FLOOR = 3;
			BigNumber.ROUND_HALF_UP = 4;
			BigNumber.ROUND_HALF_DOWN = 5;
			BigNumber.ROUND_HALF_EVEN = 6;
			BigNumber.ROUND_HALF_CEIL = 7;
			BigNumber.ROUND_HALF_FLOOR = 8;
			BigNumber.EUCLID = 9;
			BigNumber.config = BigNumber.set = function(obj) {
				var p, v;
				if (obj != null) if (typeof obj == "object") {
					if (obj.hasOwnProperty(p = "DECIMAL_PLACES")) {
						v = obj[p];
						intCheck(v, 0, MAX, p);
						DECIMAL_PLACES = v;
					}
					if (obj.hasOwnProperty(p = "ROUNDING_MODE")) {
						v = obj[p];
						intCheck(v, 0, 8, p);
						ROUNDING_MODE = v;
					}
					if (obj.hasOwnProperty(p = "EXPONENTIAL_AT")) {
						v = obj[p];
						if (v && v.pop) {
							intCheck(v[0], -MAX, 0, p);
							intCheck(v[1], 0, MAX, p);
							TO_EXP_NEG = v[0];
							TO_EXP_POS = v[1];
						} else {
							intCheck(v, -MAX, MAX, p);
							TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
						}
					}
					if (obj.hasOwnProperty(p = "RANGE")) {
						v = obj[p];
						if (v && v.pop) {
							intCheck(v[0], -MAX, -1, p);
							intCheck(v[1], 1, MAX, p);
							MIN_EXP = v[0];
							MAX_EXP = v[1];
						} else {
							intCheck(v, -MAX, MAX, p);
							if (v) MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
							else throw Error(bignumberError + p + " cannot be zero: " + v);
						}
					}
					if (obj.hasOwnProperty(p = "CRYPTO")) {
						v = obj[p];
						if (v === !!v) if (v) if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) CRYPTO = v;
						else {
							CRYPTO = !v;
							throw Error(bignumberError + "crypto unavailable");
						}
						else CRYPTO = v;
						else throw Error(bignumberError + p + " not true or false: " + v);
					}
					if (obj.hasOwnProperty(p = "MODULO_MODE")) {
						v = obj[p];
						intCheck(v, 0, 9, p);
						MODULO_MODE = v;
					}
					if (obj.hasOwnProperty(p = "POW_PRECISION")) {
						v = obj[p];
						intCheck(v, 0, MAX, p);
						POW_PRECISION = v;
					}
					if (obj.hasOwnProperty(p = "FORMAT")) {
						v = obj[p];
						if (typeof v == "object") FORMAT = v;
						else throw Error(bignumberError + p + " not an object: " + v);
					}
					if (obj.hasOwnProperty(p = "ALPHABET")) {
						v = obj[p];
						if (typeof v == "string" && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
							alphabetHasNormalDecimalDigits = v.slice(0, 10) == "0123456789";
							ALPHABET = v;
						} else throw Error(bignumberError + p + " invalid: " + v);
					}
				} else throw Error(bignumberError + "Object expected: " + obj);
				return {
					DECIMAL_PLACES,
					ROUNDING_MODE,
					EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
					RANGE: [MIN_EXP, MAX_EXP],
					CRYPTO,
					MODULO_MODE,
					POW_PRECISION,
					FORMAT,
					ALPHABET
				};
			};
			BigNumber.isBigNumber = function(v) {
				if (!v || v._isBigNumber !== true) return false;
				if (!BigNumber.DEBUG) return true;
				var i, n, c = v.c, e = v.e, s = v.s;
				out: if ({}.toString.call(c) == "[object Array]") {
					if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {
						if (c[0] === 0) {
							if (e === 0 && c.length === 1) return true;
							break out;
						}
						i = (e + 1) % LOG_BASE;
						if (i < 1) i += LOG_BASE;
						if (String(c[0]).length == i) {
							for (i = 0; i < c.length; i++) {
								n = c[i];
								if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
							}
							if (n !== 0) return true;
						}
					}
				} else if (c === null && e === null && (s === null || s === 1 || s === -1)) return true;
				throw Error(bignumberError + "Invalid BigNumber: " + v);
			};
			BigNumber.maximum = BigNumber.max = function() {
				return maxOrMin(arguments, -1);
			};
			BigNumber.minimum = BigNumber.min = function() {
				return maxOrMin(arguments, 1);
			};
			BigNumber.random = (function() {
				var pow2_53 = 9007199254740992;
				var random53bitInt = Math.random() * pow2_53 & 2097151 ? function() {
					return mathfloor(Math.random() * pow2_53);
				} : function() {
					return (Math.random() * 1073741824 | 0) * 8388608 + (Math.random() * 8388608 | 0);
				};
				return function(dp) {
					var a, b, e, k, v, i = 0, c = [], rand = new BigNumber(ONE);
					if (dp == null) dp = DECIMAL_PLACES;
					else intCheck(dp, 0, MAX);
					k = mathceil(dp / LOG_BASE);
					if (CRYPTO) if (crypto.getRandomValues) {
						a = crypto.getRandomValues(new Uint32Array(k *= 2));
						for (; i < k;) {
							v = a[i] * 131072 + (a[i + 1] >>> 11);
							if (v >= 9e15) {
								b = crypto.getRandomValues(/* @__PURE__ */ new Uint32Array(2));
								a[i] = b[0];
								a[i + 1] = b[1];
							} else {
								c.push(v % 0x5af3107a4000);
								i += 2;
							}
						}
						i = k / 2;
					} else if (crypto.randomBytes) {
						a = crypto.randomBytes(k *= 7);
						for (; i < k;) {
							v = (a[i] & 31) * 281474976710656 + a[i + 1] * 1099511627776 + a[i + 2] * 4294967296 + a[i + 3] * 16777216 + (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];
							if (v >= 9e15) crypto.randomBytes(7).copy(a, i);
							else {
								c.push(v % 0x5af3107a4000);
								i += 7;
							}
						}
						i = k / 7;
					} else {
						CRYPTO = false;
						throw Error(bignumberError + "crypto unavailable");
					}
					if (!CRYPTO) for (; i < k;) {
						v = random53bitInt();
						if (v < 9e15) c[i++] = v % 0x5af3107a4000;
					}
					k = c[--i];
					dp %= LOG_BASE;
					if (k && dp) {
						v = POWS_TEN[LOG_BASE - dp];
						c[i] = mathfloor(k / v) * v;
					}
					for (; c[i] === 0; c.pop(), i--);
					if (i < 0) c = [e = 0];
					else {
						for (e = -1; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);
						for (i = 1, v = c[0]; v >= 10; v /= 10, i++);
						if (i < LOG_BASE) e -= LOG_BASE - i;
					}
					rand.e = e;
					rand.c = c;
					return rand;
				};
			})();
			BigNumber.sum = function() {
				var i = 1, args = arguments, sum = new BigNumber(args[0]);
				for (; i < args.length;) sum = sum.plus(args[i++]);
				return sum;
			};
			convertBase = (function() {
				var decimal = "0123456789";
				function toBaseOut(str, baseIn, baseOut, alphabet) {
					var j, arr = [0], arrL, i = 0, len = str.length;
					for (; i < len;) {
						for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);
						arr[0] += alphabet.indexOf(str.charAt(i++));
						for (j = 0; j < arr.length; j++) if (arr[j] > baseOut - 1) {
							if (arr[j + 1] == null) arr[j + 1] = 0;
							arr[j + 1] += arr[j] / baseOut | 0;
							arr[j] %= baseOut;
						}
					}
					return arr.reverse();
				}
				return function(str, baseIn, baseOut, sign, callerIsToString) {
					var alphabet, d, e, k, r, x, xc, y, i = str.indexOf("."), dp = DECIMAL_PLACES, rm = ROUNDING_MODE;
					if (i >= 0) {
						k = POW_PRECISION;
						POW_PRECISION = 0;
						str = str.replace(".", "");
						y = new BigNumber(baseIn);
						x = y.pow(str.length - i);
						POW_PRECISION = k;
						y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, "0"), 10, baseOut, decimal);
						y.e = y.c.length;
					}
					xc = toBaseOut(str, baseIn, baseOut, callerIsToString ? (alphabet = ALPHABET, decimal) : (alphabet = decimal, ALPHABET));
					e = k = xc.length;
					for (; xc[--k] == 0; xc.pop());
					if (!xc[0]) return alphabet.charAt(0);
					if (i < 0) --e;
					else {
						x.c = xc;
						x.e = e;
						x.s = sign;
						x = div(x, y, dp, rm, baseOut);
						xc = x.c;
						r = x.r;
						e = x.e;
					}
					d = e + dp + 1;
					i = xc[d];
					k = baseOut / 2;
					r = r || d < 0 || xc[d + 1] != null;
					r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : i > k || i == k && (rm == 4 || r || rm == 6 && xc[d - 1] & 1 || rm == (x.s < 0 ? 8 : 7));
					if (d < 1 || !xc[0]) str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
					else {
						xc.length = d;
						if (r) for (--baseOut; ++xc[--d] > baseOut;) {
							xc[d] = 0;
							if (!d) {
								++e;
								xc = [1].concat(xc);
							}
						}
						for (k = xc.length; !xc[--k];);
						for (i = 0, str = ""; i <= k; str += alphabet.charAt(xc[i++]));
						str = toFixedPoint(str, e, alphabet.charAt(0));
					}
					return str;
				};
			})();
			div = (function() {
				function multiply(x, k, base) {
					var m, temp, xlo, xhi, carry = 0, i = x.length, klo = k % SQRT_BASE, khi = k / SQRT_BASE | 0;
					for (x = x.slice(); i--;) {
						xlo = x[i] % SQRT_BASE;
						xhi = x[i] / SQRT_BASE | 0;
						m = khi * xlo + xhi * klo;
						temp = klo * xlo + m % SQRT_BASE * SQRT_BASE + carry;
						carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
						x[i] = temp % base;
					}
					if (carry) x = [carry].concat(x);
					return x;
				}
				function compare(a, b, aL, bL) {
					var i, cmp;
					if (aL != bL) cmp = aL > bL ? 1 : -1;
					else for (i = cmp = 0; i < aL; i++) if (a[i] != b[i]) {
						cmp = a[i] > b[i] ? 1 : -1;
						break;
					}
					return cmp;
				}
				function subtract(a, b, aL, base) {
					var i = 0;
					for (; aL--;) {
						a[aL] -= i;
						i = a[aL] < b[aL] ? 1 : 0;
						a[aL] = i * base + a[aL] - b[aL];
					}
					for (; !a[0] && a.length > 1; a.splice(0, 1));
				}
				return function(x, y, dp, rm, base) {
					var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0, yL, yz, s = x.s == y.s ? 1 : -1, xc = x.c, yc = y.c;
					if (!xc || !xc[0] || !yc || !yc[0]) return new BigNumber(!x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN : xc && xc[0] == 0 || !yc ? s * 0 : s / 0);
					q = new BigNumber(s);
					qc = q.c = [];
					e = x.e - y.e;
					s = dp + e + 1;
					if (!base) {
						base = BASE;
						e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
						s = s / LOG_BASE | 0;
					}
					for (i = 0; yc[i] == (xc[i] || 0); i++);
					if (yc[i] > (xc[i] || 0)) e--;
					if (s < 0) {
						qc.push(1);
						more = true;
					} else {
						xL = xc.length;
						yL = yc.length;
						i = 0;
						s += 2;
						n = mathfloor(base / (yc[0] + 1));
						if (n > 1) {
							yc = multiply(yc, n, base);
							xc = multiply(xc, n, base);
							yL = yc.length;
							xL = xc.length;
						}
						xi = yL;
						rem = xc.slice(0, yL);
						remL = rem.length;
						for (; remL < yL; rem[remL++] = 0);
						yz = yc.slice();
						yz = [0].concat(yz);
						yc0 = yc[0];
						if (yc[1] >= base / 2) yc0++;
						do {
							n = 0;
							cmp = compare(yc, rem, yL, remL);
							if (cmp < 0) {
								rem0 = rem[0];
								if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
								n = mathfloor(rem0 / yc0);
								if (n > 1) {
									if (n >= base) n = base - 1;
									prod = multiply(yc, n, base);
									prodL = prod.length;
									remL = rem.length;
									while (compare(prod, rem, prodL, remL) == 1) {
										n--;
										subtract(prod, yL < prodL ? yz : yc, prodL, base);
										prodL = prod.length;
										cmp = 1;
									}
								} else {
									if (n == 0) cmp = n = 1;
									prod = yc.slice();
									prodL = prod.length;
								}
								if (prodL < remL) prod = [0].concat(prod);
								subtract(rem, prod, remL, base);
								remL = rem.length;
								if (cmp == -1) while (compare(yc, rem, yL, remL) < 1) {
									n++;
									subtract(rem, yL < remL ? yz : yc, remL, base);
									remL = rem.length;
								}
							} else if (cmp === 0) {
								n++;
								rem = [0];
							}
							qc[i++] = n;
							if (rem[0]) rem[remL++] = xc[xi] || 0;
							else {
								rem = [xc[xi]];
								remL = 1;
							}
						} while ((xi++ < xL || rem[0] != null) && s--);
						more = rem[0] != null;
						if (!qc[0]) qc.splice(0, 1);
					}
					if (base == BASE) {
						for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);
						round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);
					} else {
						q.e = e;
						q.r = +more;
					}
					return q;
				};
			})();
			function format(n, i, rm, id) {
				var c0, e, ne, len, str;
				if (rm == null) rm = ROUNDING_MODE;
				else intCheck(rm, 0, 8);
				if (!n.c) return n.toString();
				c0 = n.c[0];
				ne = n.e;
				if (i == null) {
					str = coeffToString(n.c);
					str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS) ? toExponential(str, ne) : toFixedPoint(str, ne, "0");
				} else {
					n = round(new BigNumber(n), i, rm);
					e = n.e;
					str = coeffToString(n.c);
					len = str.length;
					if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {
						for (; len < i; str += "0", len++);
						str = toExponential(str, e);
					} else {
						i -= ne + (id === 2 && e > ne);
						str = toFixedPoint(str, e, "0");
						if (e + 1 > len) {
							if (--i > 0) for (str += "."; i--; str += "0");
						} else {
							i += e - len;
							if (i > 0) {
								if (e + 1 == len) str += ".";
								for (; i--; str += "0");
							}
						}
					}
				}
				return n.s < 0 && c0 ? "-" + str : str;
			}
			function maxOrMin(args, n) {
				var k, y, i = 1, x = new BigNumber(args[0]);
				for (; i < args.length; i++) {
					y = new BigNumber(args[i]);
					if (!y.s || (k = compare(x, y)) === n || k === 0 && x.s === n) x = y;
				}
				return x;
			}
			function normalise(n, c, e) {
				var i = 1, j = c.length;
				for (; !c[--j]; c.pop());
				for (j = c[0]; j >= 10; j /= 10, i++);
				if ((e = i + e * LOG_BASE - 1) > MAX_EXP) n.c = n.e = null;
				else if (e < MIN_EXP) n.c = [n.e = 0];
				else {
					n.e = e;
					n.c = c;
				}
				return n;
			}
			parseNumeric = (function() {
				var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i, dotAfter = /^([^.]+)\.$/, dotBefore = /^\.([^.]+)$/, isInfinityOrNaN = /^-?(Infinity|NaN)$/, whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
				return function(x, str, isNum, b) {
					var base, s = isNum ? str : str.replace(whitespaceOrPlus, "");
					if (isInfinityOrNaN.test(s)) x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
					else {
						if (!isNum) {
							s = s.replace(basePrefix, function(m, p1, p2) {
								base = (p2 = p2.toLowerCase()) == "x" ? 16 : p2 == "b" ? 2 : 8;
								return !b || b == base ? p1 : m;
							});
							if (b) {
								base = b;
								s = s.replace(dotAfter, "$1").replace(dotBefore, "0.$1");
							}
							if (str != s) return new BigNumber(s, base);
						}
						if (BigNumber.DEBUG) throw Error(bignumberError + "Not a" + (b ? " base " + b : "") + " number: " + str);
						x.s = null;
					}
					x.c = x.e = null;
				};
			})();
			function round(x, sd, rm, r) {
				var d, i, j, k, n, ni, rd, xc = x.c, pows10 = POWS_TEN;
				if (xc) {
					out: {
						for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
						i = sd - d;
						if (i < 0) {
							i += LOG_BASE;
							j = sd;
							n = xc[ni = 0];
							rd = mathfloor(n / pows10[d - j - 1] % 10);
						} else {
							ni = mathceil((i + 1) / LOG_BASE);
							if (ni >= xc.length) if (r) {
								for (; xc.length <= ni; xc.push(0));
								n = rd = 0;
								d = 1;
								i %= LOG_BASE;
								j = i - LOG_BASE + 1;
							} else break out;
							else {
								n = k = xc[ni];
								for (d = 1; k >= 10; k /= 10, d++);
								i %= LOG_BASE;
								j = i - LOG_BASE + d;
								rd = j < 0 ? 0 : mathfloor(n / pows10[d - j - 1] % 10);
							}
						}
						r = r || sd < 0 || xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);
						r = rm < 4 ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 && (i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
						if (sd < 1 || !xc[0]) {
							xc.length = 0;
							if (r) {
								sd -= x.e + 1;
								xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
								x.e = -sd || 0;
							} else xc[0] = x.e = 0;
							return x;
						}
						if (i == 0) {
							xc.length = ni;
							k = 1;
							ni--;
						} else {
							xc.length = ni + 1;
							k = pows10[LOG_BASE - i];
							xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
						}
						if (r) for (;;) if (ni == 0) {
							for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
							j = xc[0] += k;
							for (k = 1; j >= 10; j /= 10, k++);
							if (i != k) {
								x.e++;
								if (xc[0] == BASE) xc[0] = 1;
							}
							break;
						} else {
							xc[ni] += k;
							if (xc[ni] != BASE) break;
							xc[ni--] = 0;
							k = 1;
						}
						for (i = xc.length; xc[--i] === 0; xc.pop());
					}
					if (x.e > MAX_EXP) x.c = x.e = null;
					else if (x.e < MIN_EXP) x.c = [x.e = 0];
				}
				return x;
			}
			function valueOf(n) {
				var str, e = n.e;
				if (e === null) return n.toString();
				str = coeffToString(n.c);
				str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(str, e) : toFixedPoint(str, e, "0");
				return n.s < 0 ? "-" + str : str;
			}
			P.absoluteValue = P.abs = function() {
				var x = new BigNumber(this);
				if (x.s < 0) x.s = 1;
				return x;
			};
			P.comparedTo = function(y, b) {
				return compare(this, new BigNumber(y, b));
			};
			P.decimalPlaces = P.dp = function(dp, rm) {
				var c, n, v, x = this;
				if (dp != null) {
					intCheck(dp, 0, MAX);
					if (rm == null) rm = ROUNDING_MODE;
					else intCheck(rm, 0, 8);
					return round(new BigNumber(x), dp + x.e + 1, rm);
				}
				if (!(c = x.c)) return null;
				n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;
				if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
				if (n < 0) n = 0;
				return n;
			};
			P.dividedBy = P.div = function(y, b) {
				return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
			};
			P.dividedToIntegerBy = P.idiv = function(y, b) {
				return div(this, new BigNumber(y, b), 0, 1);
			};
			P.exponentiatedBy = P.pow = function(n, m) {
				var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y, x = this;
				n = new BigNumber(n);
				if (n.c && !n.isInteger()) throw Error(bignumberError + "Exponent not an integer: " + valueOf(n));
				if (m != null) m = new BigNumber(m);
				nIsBig = n.e > 14;
				if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {
					y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? n.s * (2 - isOdd(n)) : +valueOf(n)));
					return m ? y.mod(m) : y;
				}
				nIsNeg = n.s < 0;
				if (m) {
					if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);
					isModExp = !nIsNeg && x.isInteger() && m.isInteger();
					if (isModExp) x = x.mod(m);
				} else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0 ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7 : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {
					k = x.s < 0 && isOdd(n) ? -0 : 0;
					if (x.e > -1) k = 1 / k;
					return new BigNumber(nIsNeg ? 1 / k : k);
				} else if (POW_PRECISION) k = mathceil(POW_PRECISION / LOG_BASE + 2);
				if (nIsBig) {
					half = new BigNumber(.5);
					if (nIsNeg) n.s = 1;
					nIsOdd = isOdd(n);
				} else {
					i = Math.abs(+valueOf(n));
					nIsOdd = i % 2;
				}
				y = new BigNumber(ONE);
				for (;;) {
					if (nIsOdd) {
						y = y.times(x);
						if (!y.c) break;
						if (k) {
							if (y.c.length > k) y.c.length = k;
						} else if (isModExp) y = y.mod(m);
					}
					if (i) {
						i = mathfloor(i / 2);
						if (i === 0) break;
						nIsOdd = i % 2;
					} else {
						n = n.times(half);
						round(n, n.e + 1, 1);
						if (n.e > 14) nIsOdd = isOdd(n);
						else {
							i = +valueOf(n);
							if (i === 0) break;
							nIsOdd = i % 2;
						}
					}
					x = x.times(x);
					if (k) {
						if (x.c && x.c.length > k) x.c.length = k;
					} else if (isModExp) x = x.mod(m);
				}
				if (isModExp) return y;
				if (nIsNeg) y = ONE.div(y);
				return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
			};
			P.integerValue = function(rm) {
				var n = new BigNumber(this);
				if (rm == null) rm = ROUNDING_MODE;
				else intCheck(rm, 0, 8);
				return round(n, n.e + 1, rm);
			};
			P.isEqualTo = P.eq = function(y, b) {
				return compare(this, new BigNumber(y, b)) === 0;
			};
			P.isFinite = function() {
				return !!this.c;
			};
			P.isGreaterThan = P.gt = function(y, b) {
				return compare(this, new BigNumber(y, b)) > 0;
			};
			P.isGreaterThanOrEqualTo = P.gte = function(y, b) {
				return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;
			};
			P.isInteger = function() {
				return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
			};
			P.isLessThan = P.lt = function(y, b) {
				return compare(this, new BigNumber(y, b)) < 0;
			};
			P.isLessThanOrEqualTo = P.lte = function(y, b) {
				return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
			};
			P.isNaN = function() {
				return !this.s;
			};
			P.isNegative = function() {
				return this.s < 0;
			};
			P.isPositive = function() {
				return this.s > 0;
			};
			P.isZero = function() {
				return !!this.c && this.c[0] == 0;
			};
			P.minus = function(y, b) {
				var i, j, t, xLTy, x = this, a = x.s;
				y = new BigNumber(y, b);
				b = y.s;
				if (!a || !b) return new BigNumber(NaN);
				if (a != b) {
					y.s = -b;
					return x.plus(y);
				}
				var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
				if (!xe || !ye) {
					if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);
					if (!xc[0] || !yc[0]) return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x : ROUNDING_MODE == 3 ? -0 : 0);
				}
				xe = bitFloor(xe);
				ye = bitFloor(ye);
				xc = xc.slice();
				if (a = xe - ye) {
					if (xLTy = a < 0) {
						a = -a;
						t = xc;
					} else {
						ye = xe;
						t = yc;
					}
					t.reverse();
					for (b = a; b--; t.push(0));
					t.reverse();
				} else {
					j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;
					for (a = b = 0; b < j; b++) if (xc[b] != yc[b]) {
						xLTy = xc[b] < yc[b];
						break;
					}
				}
				if (xLTy) {
					t = xc;
					xc = yc;
					yc = t;
					y.s = -y.s;
				}
				b = (j = yc.length) - (i = xc.length);
				if (b > 0) for (; b--; xc[i++] = 0);
				b = BASE - 1;
				for (; j > a;) {
					if (xc[--j] < yc[j]) {
						for (i = j; i && !xc[--i]; xc[i] = b);
						--xc[i];
						xc[j] += BASE;
					}
					xc[j] -= yc[j];
				}
				for (; xc[0] == 0; xc.splice(0, 1), --ye);
				if (!xc[0]) {
					y.s = ROUNDING_MODE == 3 ? -1 : 1;
					y.c = [y.e = 0];
					return y;
				}
				return normalise(y, xc, ye);
			};
			P.modulo = P.mod = function(y, b) {
				var q, s, x = this;
				y = new BigNumber(y, b);
				if (!x.c || !y.s || y.c && !y.c[0]) return new BigNumber(NaN);
				else if (!y.c || x.c && !x.c[0]) return new BigNumber(x);
				if (MODULO_MODE == 9) {
					s = y.s;
					y.s = 1;
					q = div(x, y, 0, 3);
					y.s = s;
					q.s *= s;
				} else q = div(x, y, 0, MODULO_MODE);
				y = x.minus(q.times(y));
				if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;
				return y;
			};
			P.multipliedBy = P.times = function(y, b) {
				var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc, base, sqrtBase, x = this, xc = x.c, yc = (y = new BigNumber(y, b)).c;
				if (!xc || !yc || !xc[0] || !yc[0]) {
					if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) y.c = y.e = y.s = null;
					else {
						y.s *= x.s;
						if (!xc || !yc) y.c = y.e = null;
						else {
							y.c = [0];
							y.e = 0;
						}
					}
					return y;
				}
				e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
				y.s *= x.s;
				xcL = xc.length;
				ycL = yc.length;
				if (xcL < ycL) {
					zc = xc;
					xc = yc;
					yc = zc;
					i = xcL;
					xcL = ycL;
					ycL = i;
				}
				for (i = xcL + ycL, zc = []; i--; zc.push(0));
				base = BASE;
				sqrtBase = SQRT_BASE;
				for (i = ycL; --i >= 0;) {
					c = 0;
					ylo = yc[i] % sqrtBase;
					yhi = yc[i] / sqrtBase | 0;
					for (k = xcL, j = i + k; j > i;) {
						xlo = xc[--k] % sqrtBase;
						xhi = xc[k] / sqrtBase | 0;
						m = yhi * xlo + xhi * ylo;
						xlo = ylo * xlo + m % sqrtBase * sqrtBase + zc[j] + c;
						c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
						zc[j--] = xlo % base;
					}
					zc[j] = c;
				}
				if (c) ++e;
				else zc.splice(0, 1);
				return normalise(y, zc, e);
			};
			P.negated = function() {
				var x = new BigNumber(this);
				x.s = -x.s || null;
				return x;
			};
			P.plus = function(y, b) {
				var t, x = this, a = x.s;
				y = new BigNumber(y, b);
				b = y.s;
				if (!a || !b) return new BigNumber(NaN);
				if (a != b) {
					y.s = -b;
					return x.minus(y);
				}
				var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
				if (!xe || !ye) {
					if (!xc || !yc) return new BigNumber(a / 0);
					if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
				}
				xe = bitFloor(xe);
				ye = bitFloor(ye);
				xc = xc.slice();
				if (a = xe - ye) {
					if (a > 0) {
						ye = xe;
						t = yc;
					} else {
						a = -a;
						t = xc;
					}
					t.reverse();
					for (; a--; t.push(0));
					t.reverse();
				}
				a = xc.length;
				b = yc.length;
				if (a - b < 0) {
					t = yc;
					yc = xc;
					xc = t;
					b = a;
				}
				for (a = 0; b;) {
					a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
					xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
				}
				if (a) {
					xc = [a].concat(xc);
					++ye;
				}
				return normalise(y, xc, ye);
			};
			P.precision = P.sd = function(sd, rm) {
				var c, n, v, x = this;
				if (sd != null && sd !== !!sd) {
					intCheck(sd, 1, MAX);
					if (rm == null) rm = ROUNDING_MODE;
					else intCheck(rm, 0, 8);
					return round(new BigNumber(x), sd, rm);
				}
				if (!(c = x.c)) return null;
				v = c.length - 1;
				n = v * LOG_BASE + 1;
				if (v = c[v]) {
					for (; v % 10 == 0; v /= 10, n--);
					for (v = c[0]; v >= 10; v /= 10, n++);
				}
				if (sd && x.e + 1 > n) n = x.e + 1;
				return n;
			};
			P.shiftedBy = function(k) {
				intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
				return this.times("1e" + k);
			};
			P.squareRoot = P.sqrt = function() {
				var m, n, r, rep, t, x = this, c = x.c, s = x.s, e = x.e, dp = DECIMAL_PLACES + 4, half = new BigNumber("0.5");
				if (s !== 1 || !c || !c[0]) return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : Infinity);
				s = Math.sqrt(+valueOf(x));
				if (s == 0 || s == Infinity) {
					n = coeffToString(c);
					if ((n.length + e) % 2 == 0) n += "0";
					s = Math.sqrt(+n);
					e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);
					if (s == Infinity) n = "5e" + e;
					else {
						n = s.toExponential();
						n = n.slice(0, n.indexOf("e") + 1) + e;
					}
					r = new BigNumber(n);
				} else r = new BigNumber(s + "");
				if (r.c[0]) {
					e = r.e;
					s = e + dp;
					if (s < 3) s = 0;
					for (;;) {
						t = r;
						r = half.times(t.plus(div(x, t, dp, 1)));
						if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {
							if (r.e < e) --s;
							n = n.slice(s - 3, s + 1);
							if (n == "9999" || !rep && n == "4999") {
								if (!rep) {
									round(t, t.e + DECIMAL_PLACES + 2, 0);
									if (t.times(t).eq(x)) {
										r = t;
										break;
									}
								}
								dp += 4;
								s += 4;
								rep = 1;
							} else {
								if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
									round(r, r.e + DECIMAL_PLACES + 2, 1);
									m = !r.times(r).eq(x);
								}
								break;
							}
						}
					}
				}
				return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
			};
			P.toExponential = function(dp, rm) {
				if (dp != null) {
					intCheck(dp, 0, MAX);
					dp++;
				}
				return format(this, dp, rm, 1);
			};
			P.toFixed = function(dp, rm) {
				if (dp != null) {
					intCheck(dp, 0, MAX);
					dp = dp + this.e + 1;
				}
				return format(this, dp, rm);
			};
			P.toFormat = function(dp, rm, format) {
				var str, x = this;
				if (format == null) if (dp != null && rm && typeof rm == "object") {
					format = rm;
					rm = null;
				} else if (dp && typeof dp == "object") {
					format = dp;
					dp = rm = null;
				} else format = FORMAT;
				else if (typeof format != "object") throw Error(bignumberError + "Argument not an object: " + format);
				str = x.toFixed(dp, rm);
				if (x.c) {
					var i, arr = str.split("."), g1 = +format.groupSize, g2 = +format.secondaryGroupSize, groupSeparator = format.groupSeparator || "", intPart = arr[0], fractionPart = arr[1], isNeg = x.s < 0, intDigits = isNeg ? intPart.slice(1) : intPart, len = intDigits.length;
					if (g2) {
						i = g1;
						g1 = g2;
						g2 = i;
						len -= i;
					}
					if (g1 > 0 && len > 0) {
						i = len % g1 || g1;
						intPart = intDigits.substr(0, i);
						for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
						if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
						if (isNeg) intPart = "-" + intPart;
					}
					str = fractionPart ? intPart + (format.decimalSeparator || "") + ((g2 = +format.fractionGroupSize) ? fractionPart.replace(new RegExp("\\d{" + g2 + "}\\B", "g"), "$&" + (format.fractionGroupSeparator || "")) : fractionPart) : intPart;
				}
				return (format.prefix || "") + str + (format.suffix || "");
			};
			P.toFraction = function(md) {
				var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s, x = this, xc = x.c;
				if (md != null) {
					n = new BigNumber(md);
					if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) throw Error(bignumberError + "Argument " + (n.isInteger() ? "out of range: " : "not an integer: ") + valueOf(n));
				}
				if (!xc) return new BigNumber(x);
				d = new BigNumber(ONE);
				n1 = d0 = new BigNumber(ONE);
				d1 = n0 = new BigNumber(ONE);
				s = coeffToString(xc);
				e = d.e = s.length - x.e - 1;
				d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
				md = !md || n.comparedTo(d) > 0 ? e > 0 ? d : n1 : n;
				exp = MAX_EXP;
				MAX_EXP = Infinity;
				n = new BigNumber(s);
				n0.c[0] = 0;
				for (;;) {
					q = div(n, d, 0, 1);
					d2 = d0.plus(q.times(d1));
					if (d2.comparedTo(md) == 1) break;
					d0 = d1;
					d1 = d2;
					n1 = n0.plus(q.times(d2 = n1));
					n0 = d2;
					d = n.minus(q.times(d2 = d));
					n = d2;
				}
				d2 = div(md.minus(d0), d1, 0, 1);
				n0 = n0.plus(d2.times(n1));
				d0 = d0.plus(d2.times(d1));
				n0.s = n1.s = x.s;
				e = e * 2;
				r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
				MAX_EXP = exp;
				return r;
			};
			P.toNumber = function() {
				return +valueOf(this);
			};
			P.toPrecision = function(sd, rm) {
				if (sd != null) intCheck(sd, 1, MAX);
				return format(this, sd, rm, 2);
			};
			P.toString = function(b) {
				var str, n = this, s = n.s, e = n.e;
				if (e === null) if (s) {
					str = "Infinity";
					if (s < 0) str = "-" + str;
				} else str = "NaN";
				else {
					if (b == null) str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(coeffToString(n.c), e) : toFixedPoint(coeffToString(n.c), e, "0");
					else if (b === 10 && alphabetHasNormalDecimalDigits) {
						n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
						str = toFixedPoint(coeffToString(n.c), n.e, "0");
					} else {
						intCheck(b, 2, ALPHABET.length, "Base");
						str = convertBase(toFixedPoint(coeffToString(n.c), e, "0"), 10, b, s, true);
					}
					if (s < 0 && n.c[0]) str = "-" + str;
				}
				return str;
			};
			P.valueOf = P.toJSON = function() {
				return valueOf(this);
			};
			P._isBigNumber = true;
			if (configObject != null) BigNumber.set(configObject);
			return BigNumber;
		}
		function bitFloor(n) {
			var i = n | 0;
			return n > 0 || n === i ? i : i - 1;
		}
		function coeffToString(a) {
			var s, z, i = 1, j = a.length, r = a[0] + "";
			for (; i < j;) {
				s = a[i++] + "";
				z = LOG_BASE - s.length;
				for (; z--; s = "0" + s);
				r += s;
			}
			for (j = r.length; r.charCodeAt(--j) === 48;);
			return r.slice(0, j + 1 || 1);
		}
		function compare(x, y) {
			var a, b, xc = x.c, yc = y.c, i = x.s, j = y.s, k = x.e, l = y.e;
			if (!i || !j) return null;
			a = xc && !xc[0];
			b = yc && !yc[0];
			if (a || b) return a ? b ? 0 : -j : i;
			if (i != j) return i;
			a = i < 0;
			b = k == l;
			if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;
			if (!b) return k > l ^ a ? 1 : -1;
			j = (k = xc.length) < (l = yc.length) ? k : l;
			for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;
			return k == l ? 0 : k > l ^ a ? 1 : -1;
		}
		function intCheck(n, min, max, name) {
			if (n < min || n > max || n !== mathfloor(n)) throw Error(bignumberError + (name || "Argument") + (typeof n == "number" ? n < min || n > max ? " out of range: " : " not an integer: " : " not a primitive number: ") + String(n));
		}
		function isOdd(n) {
			var k = n.c.length - 1;
			return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
		}
		function toExponential(str, e) {
			return (str.length > 1 ? str.charAt(0) + "." + str.slice(1) : str) + (e < 0 ? "e" : "e+") + e;
		}
		function toFixedPoint(str, e, z) {
			var len, zs;
			if (e < 0) {
				for (zs = z + "."; ++e; zs += z);
				str = zs + str;
			} else {
				len = str.length;
				if (++e > len) {
					for (zs = z, e -= len; --e; zs += z);
					str += zs;
				} else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
			}
			return str;
		}
		BigNumber = clone();
		BigNumber["default"] = BigNumber.BigNumber = BigNumber;
		if (typeof define == "function" && define.amd) define(function() {
			return BigNumber;
		});
		else if (typeof module != "undefined" && module.exports) module.exports = BigNumber;
		else {
			if (!globalObject) globalObject = typeof self != "undefined" && self ? self : window;
			globalObject.BigNumber = BigNumber;
		}
	})(exports);
}));
//#endregion
//#region node_modules/json-bigint/lib/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BigNumber = require_bignumber();
	var JSON = module.exports;
	(function() {
		"use strict";
		var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
			"\b": "\\b",
			"	": "\\t",
			"\n": "\\n",
			"\f": "\\f",
			"\r": "\\r",
			"\"": "\\\"",
			"\\": "\\\\"
		}, rep;
		function quote(string) {
			escapable.lastIndex = 0;
			return escapable.test(string) ? "\"" + string.replace(escapable, function(a) {
				var c = meta[a];
				return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
			}) + "\"" : "\"" + string + "\"";
		}
		function str(key, holder) {
			var i, k, v, length, mind = gap, partial, value = holder[key], isBigNumber = value != null && (value instanceof BigNumber || BigNumber.isBigNumber(value));
			if (value && typeof value === "object" && typeof value.toJSON === "function") value = value.toJSON(key);
			if (typeof rep === "function") value = rep.call(holder, key, value);
			switch (typeof value) {
				case "string": if (isBigNumber) return value;
				else return quote(value);
				case "number": return isFinite(value) ? String(value) : "null";
				case "boolean":
				case "null":
				case "bigint": return String(value);
				case "object":
					if (!value) return "null";
					gap += indent;
					partial = [];
					if (Object.prototype.toString.apply(value) === "[object Array]") {
						length = value.length;
						for (i = 0; i < length; i += 1) partial[i] = str(i, value) || "null";
						v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
						gap = mind;
						return v;
					}
					if (rep && typeof rep === "object") {
						length = rep.length;
						for (i = 0; i < length; i += 1) if (typeof rep[i] === "string") {
							k = rep[i];
							v = str(k, value);
							if (v) partial.push(quote(k) + (gap ? ": " : ":") + v);
						}
					} else Object.keys(value).forEach(function(k) {
						var v = str(k, value);
						if (v) partial.push(quote(k) + (gap ? ": " : ":") + v);
					});
					v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
					gap = mind;
					return v;
			}
		}
		if (typeof JSON.stringify !== "function") JSON.stringify = function(value, replacer, space) {
			var i;
			gap = "";
			indent = "";
			if (typeof space === "number") for (i = 0; i < space; i += 1) indent += " ";
			else if (typeof space === "string") indent = space;
			rep = replacer;
			if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) throw new Error("JSON.stringify");
			return str("", { "": value });
		};
	})();
}));
//#endregion
//#region node_modules/json-bigint/lib/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BigNumber = null;
	var suspectProtoRx = /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
	var suspectConstructorRx = /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;
	var json_parse = function(options) {
		"use strict";
		var _options = {
			strict: false,
			storeAsString: false,
			alwaysParseAsBig: false,
			useNativeBigInt: false,
			protoAction: "error",
			constructorAction: "error"
		};
		if (options !== void 0 && options !== null) {
			if (options.strict === true) _options.strict = true;
			if (options.storeAsString === true) _options.storeAsString = true;
			_options.alwaysParseAsBig = options.alwaysParseAsBig === true ? options.alwaysParseAsBig : false;
			_options.useNativeBigInt = options.useNativeBigInt === true ? options.useNativeBigInt : false;
			if (typeof options.constructorAction !== "undefined") if (options.constructorAction === "error" || options.constructorAction === "ignore" || options.constructorAction === "preserve") _options.constructorAction = options.constructorAction;
			else throw new Error(`Incorrect value for constructorAction option, must be "error", "ignore" or undefined but passed ${options.constructorAction}`);
			if (typeof options.protoAction !== "undefined") if (options.protoAction === "error" || options.protoAction === "ignore" || options.protoAction === "preserve") _options.protoAction = options.protoAction;
			else throw new Error(`Incorrect value for protoAction option, must be "error", "ignore" or undefined but passed ${options.protoAction}`);
		}
		var at, ch, escapee = {
			"\"": "\"",
			"\\": "\\",
			"/": "/",
			b: "\b",
			f: "\f",
			n: "\n",
			r: "\r",
			t: "	"
		}, text, error = function(m) {
			throw {
				name: "SyntaxError",
				message: m,
				at,
				text
			};
		}, next = function(c) {
			if (c && c !== ch) error("Expected '" + c + "' instead of '" + ch + "'");
			ch = text.charAt(at);
			at += 1;
			return ch;
		}, number = function() {
			var number, string = "";
			if (ch === "-") {
				string = "-";
				next("-");
			}
			while (ch >= "0" && ch <= "9") {
				string += ch;
				next();
			}
			if (ch === ".") {
				string += ".";
				while (next() && ch >= "0" && ch <= "9") string += ch;
			}
			if (ch === "e" || ch === "E") {
				string += ch;
				next();
				if (ch === "-" || ch === "+") {
					string += ch;
					next();
				}
				while (ch >= "0" && ch <= "9") {
					string += ch;
					next();
				}
			}
			number = +string;
			if (!isFinite(number)) error("Bad number");
			else {
				if (BigNumber == null) BigNumber = require_bignumber();
				if (string.length > 15) return _options.storeAsString ? string : _options.useNativeBigInt ? BigInt(string) : new BigNumber(string);
				else return !_options.alwaysParseAsBig ? number : _options.useNativeBigInt ? BigInt(number) : new BigNumber(number);
			}
		}, string = function() {
			var hex, i, string = "", uffff;
			if (ch === "\"") {
				var startAt = at;
				while (next()) {
					if (ch === "\"") {
						if (at - 1 > startAt) string += text.substring(startAt, at - 1);
						next();
						return string;
					}
					if (ch === "\\") {
						if (at - 1 > startAt) string += text.substring(startAt, at - 1);
						next();
						if (ch === "u") {
							uffff = 0;
							for (i = 0; i < 4; i += 1) {
								hex = parseInt(next(), 16);
								if (!isFinite(hex)) break;
								uffff = uffff * 16 + hex;
							}
							string += String.fromCharCode(uffff);
						} else if (typeof escapee[ch] === "string") string += escapee[ch];
						else break;
						startAt = at;
					}
				}
			}
			error("Bad string");
		}, white = function() {
			while (ch && ch <= " ") next();
		}, word = function() {
			switch (ch) {
				case "t":
					next("t");
					next("r");
					next("u");
					next("e");
					return true;
				case "f":
					next("f");
					next("a");
					next("l");
					next("s");
					next("e");
					return false;
				case "n":
					next("n");
					next("u");
					next("l");
					next("l");
					return null;
			}
			error("Unexpected '" + ch + "'");
		}, value, array = function() {
			var array = [];
			if (ch === "[") {
				next("[");
				white();
				if (ch === "]") {
					next("]");
					return array;
				}
				while (ch) {
					array.push(value());
					white();
					if (ch === "]") {
						next("]");
						return array;
					}
					next(",");
					white();
				}
			}
			error("Bad array");
		}, object = function() {
			var key, object = Object.create(null);
			if (ch === "{") {
				next("{");
				white();
				if (ch === "}") {
					next("}");
					return object;
				}
				while (ch) {
					key = string();
					white();
					next(":");
					if (_options.strict === true && Object.hasOwnProperty.call(object, key)) error("Duplicate key \"" + key + "\"");
					if (suspectProtoRx.test(key) === true) if (_options.protoAction === "error") error("Object contains forbidden prototype property");
					else if (_options.protoAction === "ignore") value();
					else object[key] = value();
					else if (suspectConstructorRx.test(key) === true) if (_options.constructorAction === "error") error("Object contains forbidden constructor property");
					else if (_options.constructorAction === "ignore") value();
					else object[key] = value();
					else object[key] = value();
					white();
					if (ch === "}") {
						next("}");
						return object;
					}
					next(",");
					white();
				}
			}
			error("Bad object");
		};
		value = function() {
			white();
			switch (ch) {
				case "{": return object();
				case "[": return array();
				case "\"": return string();
				case "-": return number();
				default: return ch >= "0" && ch <= "9" ? number() : word();
			}
		};
		return function(source, reviver) {
			var result;
			text = source + "";
			at = 0;
			ch = " ";
			result = value();
			white();
			if (ch) error("Syntax error");
			return typeof reviver === "function" ? (function walk(holder, key) {
				var v, value = holder[key];
				if (value && typeof value === "object") Object.keys(value).forEach(function(k) {
					v = walk(value, k);
					if (v !== void 0) value[k] = v;
					else delete value[k];
				});
				return reviver.call(holder, key, value);
			})({ "": result }, "") : result;
		};
	};
	module.exports = json_parse;
}));
//#endregion
//#region node_modules/json-bigint/index.js
var require_json_bigint = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var json_stringify = require_stringify().stringify;
	var json_parse = require_parse();
	module.exports = function(options) {
		return {
			parse: json_parse(options),
			stringify: json_stringify
		};
	};
	module.exports.parse = json_parse();
	module.exports.stringify = json_stringify;
}));
//#endregion
//#region node_modules/gcp-metadata/build/src/gcp-residency.js
var require_gcp_residency = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Copyright 2022 Google LLC
	*
	* Licensed under the Apache License, Version 2.0 (the "License");
	* you may not use this file except in compliance with the License.
	* You may obtain a copy of the License at
	*
	*      http://www.apache.org/licenses/LICENSE-2.0
	*
	* Unless required by applicable law or agreed to in writing, software
	* distributed under the License is distributed on an "AS IS" BASIS,
	* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	* See the License for the specific language governing permissions and
	* limitations under the License.
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GCE_LINUX_BIOS_PATHS = void 0;
	exports.isGoogleCloudServerless = isGoogleCloudServerless;
	exports.isGoogleComputeEngineLinux = isGoogleComputeEngineLinux;
	exports.isGoogleComputeEngineMACAddress = isGoogleComputeEngineMACAddress;
	exports.isGoogleComputeEngine = isGoogleComputeEngine;
	exports.detectGCPResidency = detectGCPResidency;
	var fs_1 = __require("fs");
	var os_1 = __require("os");
	/**
	* Known paths unique to Google Compute Engine Linux instances
	*/
	exports.GCE_LINUX_BIOS_PATHS = {
		BIOS_DATE: "/sys/class/dmi/id/bios_date",
		BIOS_VENDOR: "/sys/class/dmi/id/bios_vendor"
	};
	var GCE_MAC_ADDRESS_REGEX = /^42:01/;
	/**
	* Determines if the process is running on a Google Cloud Serverless environment (Cloud Run or Cloud Functions instance).
	*
	* Uses the:
	* - {@link https://cloud.google.com/run/docs/container-contract#env-vars Cloud Run environment variables}.
	* - {@link https://cloud.google.com/functions/docs/env-var Cloud Functions environment variables}.
	*
	* @returns {boolean} `true` if the process is running on GCP serverless, `false` otherwise.
	*/
	function isGoogleCloudServerless() {
		return !!(process.env.CLOUD_RUN_JOB || process.env.FUNCTION_NAME || process.env.K_SERVICE);
	}
	/**
	* Determines if the process is running on a Linux Google Compute Engine instance.
	*
	* @returns {boolean} `true` if the process is running on Linux GCE, `false` otherwise.
	*/
	function isGoogleComputeEngineLinux() {
		if ((0, os_1.platform)() !== "linux") return false;
		try {
			(0, fs_1.statSync)(exports.GCE_LINUX_BIOS_PATHS.BIOS_DATE);
			const biosVendor = (0, fs_1.readFileSync)(exports.GCE_LINUX_BIOS_PATHS.BIOS_VENDOR, "utf8");
			return /Google/.test(biosVendor);
		} catch {
			return false;
		}
	}
	/**
	* Determines if the process is running on a Google Compute Engine instance with a known
	* MAC address.
	*
	* @returns {boolean} `true` if the process is running on GCE (as determined by MAC address), `false` otherwise.
	*/
	function isGoogleComputeEngineMACAddress() {
		const interfaces = (0, os_1.networkInterfaces)();
		for (const item of Object.values(interfaces)) {
			if (!item) continue;
			for (const { mac } of item) if (GCE_MAC_ADDRESS_REGEX.test(mac)) return true;
		}
		return false;
	}
	/**
	* Determines if the process is running on a Google Compute Engine instance.
	*
	* @returns {boolean} `true` if the process is running on GCE, `false` otherwise.
	*/
	function isGoogleComputeEngine() {
		return isGoogleComputeEngineLinux() || isGoogleComputeEngineMACAddress();
	}
	/**
	* Determines if the process is running on Google Cloud Platform.
	*
	* @returns {boolean} `true` if the process is running on GCP, `false` otherwise.
	*/
	function detectGCPResidency() {
		return isGoogleCloudServerless() || isGoogleComputeEngine();
	}
}));
//#endregion
//#region node_modules/google-logging-utils/build/src/colours.js
var require_colours = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Colours = void 0;
	/**
	* Handles figuring out if we can use ANSI colours and handing out the escape codes.
	*
	* This is for package-internal use only, and may change at any time.
	*
	* @private
	* @internal
	*/
	var Colours = class Colours {
		/**
		* @param stream The stream (e.g. process.stderr)
		* @returns true if the stream should have colourization enabled
		*/
		static isEnabled(stream) {
			return stream && stream.isTTY && (typeof stream.getColorDepth === "function" ? stream.getColorDepth() > 2 : true);
		}
		static refresh() {
			Colours.enabled = Colours.isEnabled(process === null || process === void 0 ? void 0 : process.stderr);
			if (!this.enabled) {
				Colours.reset = "";
				Colours.bright = "";
				Colours.dim = "";
				Colours.red = "";
				Colours.green = "";
				Colours.yellow = "";
				Colours.blue = "";
				Colours.magenta = "";
				Colours.cyan = "";
				Colours.white = "";
				Colours.grey = "";
			} else {
				Colours.reset = "\x1B[0m";
				Colours.bright = "\x1B[1m";
				Colours.dim = "\x1B[2m";
				Colours.red = "\x1B[31m";
				Colours.green = "\x1B[32m";
				Colours.yellow = "\x1B[33m";
				Colours.blue = "\x1B[34m";
				Colours.magenta = "\x1B[35m";
				Colours.cyan = "\x1B[36m";
				Colours.white = "\x1B[37m";
				Colours.grey = "\x1B[90m";
			}
		}
	};
	exports.Colours = Colours;
	Colours.enabled = false;
	Colours.reset = "";
	Colours.bright = "";
	Colours.dim = "";
	Colours.red = "";
	Colours.green = "";
	Colours.yellow = "";
	Colours.blue = "";
	Colours.magenta = "";
	Colours.cyan = "";
	Colours.white = "";
	Colours.grey = "";
	Colours.refresh();
}));
//#endregion
//#region node_modules/google-logging-utils/build/src/logging-utils.js
var require_logging_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.env = exports.DebugLogBackendBase = exports.placeholder = exports.AdhocDebugLogger = exports.LogSeverity = void 0;
	exports.getNodeBackend = getNodeBackend;
	exports.getDebugBackend = getDebugBackend;
	exports.getStructuredBackend = getStructuredBackend;
	exports.setBackend = setBackend;
	exports.log = log;
	var events_1$1 = __require("events");
	var process$1 = __importStar(__require("process"));
	var util$4 = __importStar(__require("util"));
	var colours_1 = require_colours();
	/**
	* This module defines an ad-hoc debug logger for Google Cloud Platform
	* client libraries in Node. An ad-hoc debug logger is a tool which lets
	* users use an external, unified interface (in this case, environment
	* variables) to determine what logging they want to see at runtime. This
	* isn't necessarily fed into the console, but is meant to be under the
	* control of the user. The kind of logging that will be produced by this
	* is more like "call retry happened", not "events you'd want to record
	* in Cloud Logger".
	*
	* More for Googlers implementing libraries with it:
	* go/cloud-client-logging-design
	*/
	/**
	* Possible log levels. These are a subset of Cloud Observability levels.
	* https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
	*/
	var LogSeverity;
	(function(LogSeverity) {
		LogSeverity["DEFAULT"] = "DEFAULT";
		LogSeverity["DEBUG"] = "DEBUG";
		LogSeverity["INFO"] = "INFO";
		LogSeverity["WARNING"] = "WARNING";
		LogSeverity["ERROR"] = "ERROR";
	})(LogSeverity || (exports.LogSeverity = LogSeverity = {}));
	/**
	* Our logger instance. This actually contains the meat of dealing
	* with log lines, including EventEmitter. This contains the function
	* that will be passed back to users of the package.
	*/
	var AdhocDebugLogger = class extends events_1$1.EventEmitter {
		/**
		* @param upstream The backend will pass a function that will be
		*   called whenever our logger function is invoked.
		*/
		constructor(namespace, upstream) {
			super();
			this.namespace = namespace;
			this.upstream = upstream;
			this.func = Object.assign(this.invoke.bind(this), {
				instance: this,
				on: (event, listener) => this.on(event, listener)
			});
			this.func.debug = (...args) => this.invokeSeverity(LogSeverity.DEBUG, ...args);
			this.func.info = (...args) => this.invokeSeverity(LogSeverity.INFO, ...args);
			this.func.warn = (...args) => this.invokeSeverity(LogSeverity.WARNING, ...args);
			this.func.error = (...args) => this.invokeSeverity(LogSeverity.ERROR, ...args);
			this.func.sublog = (namespace) => log(namespace, this.func);
		}
		invoke(fields, ...args) {
			if (this.upstream) try {
				this.upstream(fields, ...args);
			} catch (e) {}
			try {
				this.emit("log", fields, args);
			} catch (e) {}
		}
		invokeSeverity(severity, ...args) {
			this.invoke({ severity }, ...args);
		}
	};
	exports.AdhocDebugLogger = AdhocDebugLogger;
	/**
	* This can be used in place of a real logger while waiting for Promises or disabling logging.
	*/
	exports.placeholder = new AdhocDebugLogger("", () => {}).func;
	/**
	* The base class for debug logging backends. It's possible to use this, but the
	* same non-guarantees above still apply (unstable interface, etc).
	*
	* @private
	* @internal
	*/
	var DebugLogBackendBase = class {
		constructor() {
			var _a;
			this.cached = /* @__PURE__ */ new Map();
			this.filters = [];
			this.filtersSet = false;
			let nodeFlag = (_a = process$1.env[exports.env.nodeEnables]) !== null && _a !== void 0 ? _a : "*";
			if (nodeFlag === "all") nodeFlag = "*";
			this.filters = nodeFlag.split(",");
		}
		log(namespace, fields, ...args) {
			try {
				if (!this.filtersSet) {
					this.setFilters();
					this.filtersSet = true;
				}
				let logger = this.cached.get(namespace);
				if (!logger) {
					logger = this.makeLogger(namespace);
					this.cached.set(namespace, logger);
				}
				logger(fields, ...args);
			} catch (e) {
				console.error(e);
			}
		}
	};
	exports.DebugLogBackendBase = DebugLogBackendBase;
	var NodeBackend = class extends DebugLogBackendBase {
		constructor() {
			super(...arguments);
			this.enabledRegexp = /.*/g;
		}
		isEnabled(namespace) {
			return this.enabledRegexp.test(namespace);
		}
		makeLogger(namespace) {
			if (!this.enabledRegexp.test(namespace)) return () => {};
			return (fields, ...args) => {
				var _a;
				const nscolour = `${colours_1.Colours.green}${namespace}${colours_1.Colours.reset}`;
				const pid = `${colours_1.Colours.yellow}${process$1.pid}${colours_1.Colours.reset}`;
				let level;
				switch (fields.severity) {
					case LogSeverity.ERROR:
						level = `${colours_1.Colours.red}${fields.severity}${colours_1.Colours.reset}`;
						break;
					case LogSeverity.INFO:
						level = `${colours_1.Colours.magenta}${fields.severity}${colours_1.Colours.reset}`;
						break;
					case LogSeverity.WARNING:
						level = `${colours_1.Colours.yellow}${fields.severity}${colours_1.Colours.reset}`;
						break;
					default:
						level = (_a = fields.severity) !== null && _a !== void 0 ? _a : LogSeverity.DEFAULT;
						break;
				}
				const msg = util$4.formatWithOptions({ colors: colours_1.Colours.enabled }, ...args);
				const filteredFields = Object.assign({}, fields);
				delete filteredFields.severity;
				const fieldsJson = Object.getOwnPropertyNames(filteredFields).length ? JSON.stringify(filteredFields) : "";
				const fieldsColour = fieldsJson ? `${colours_1.Colours.grey}${fieldsJson}${colours_1.Colours.reset}` : "";
				console.error("%s [%s|%s] %s%s", pid, nscolour, level, msg, fieldsJson ? ` ${fieldsColour}` : "");
			};
		}
		setFilters() {
			const regexp = this.filters.join(",").replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^");
			this.enabledRegexp = new RegExp(`^${regexp}$`, "i");
		}
	};
	/**
	* @returns A backend based on Node util.debuglog; this is the default.
	*/
	function getNodeBackend() {
		return new NodeBackend();
	}
	var DebugBackend = class extends DebugLogBackendBase {
		constructor(pkg) {
			super();
			this.debugPkg = pkg;
		}
		makeLogger(namespace) {
			const debugLogger = this.debugPkg(namespace);
			return (fields, ...args) => {
				debugLogger(args[0], ...args.slice(1));
			};
		}
		setFilters() {
			var _a;
			const existingFilters = (_a = process$1.env["NODE_DEBUG"]) !== null && _a !== void 0 ? _a : "";
			process$1.env["NODE_DEBUG"] = `${existingFilters}${existingFilters ? "," : ""}${this.filters.join(",")}`;
		}
	};
	/**
	* Creates a "debug" package backend. The user must call require('debug') and pass
	* the resulting object to this function.
	*
	* ```
	*  setBackend(getDebugBackend(require('debug')))
	* ```
	*
	* https://www.npmjs.com/package/debug
	*
	* Note: Google does not explicitly endorse or recommend this package; it's just
	* being provided as an option.
	*
	* @returns A backend based on the npm "debug" package.
	*/
	function getDebugBackend(debugPkg) {
		return new DebugBackend(debugPkg);
	}
	/**
	* This pretty much works like the Node logger, but it outputs structured
	* logging JSON matching Google Cloud's ingestion specs. Rather than handling
	* its own output, it wraps another backend. The passed backend must be a subclass
	* of `DebugLogBackendBase` (any of the backends exposed by this package will work).
	*/
	var StructuredBackend = class extends DebugLogBackendBase {
		constructor(upstream) {
			var _a;
			super();
			this.upstream = (_a = upstream) !== null && _a !== void 0 ? _a : void 0;
		}
		makeLogger(namespace) {
			var _a;
			const debugLogger = (_a = this.upstream) === null || _a === void 0 ? void 0 : _a.makeLogger(namespace);
			return (fields, ...args) => {
				var _a;
				const severity = (_a = fields.severity) !== null && _a !== void 0 ? _a : LogSeverity.INFO;
				const json = Object.assign({
					severity,
					message: util$4.format(...args)
				}, fields);
				const jsonString = JSON.stringify(json);
				if (debugLogger) debugLogger(fields, jsonString);
				else console.log("%s", jsonString);
			};
		}
		setFilters() {
			var _a;
			(_a = this.upstream) === null || _a === void 0 || _a.setFilters();
		}
	};
	/**
	* Creates a "structured logging" backend. This pretty much works like the
	* Node logger, but it outputs structured logging JSON matching Google
	* Cloud's ingestion specs instead of plain text.
	*
	* ```
	*  setBackend(getStructuredBackend())
	* ```
	*
	* @param upstream If you want to use something besides the Node backend to
	*   write the actual log lines into, pass that here.
	* @returns A backend based on Google Cloud structured logging.
	*/
	function getStructuredBackend(upstream) {
		return new StructuredBackend(upstream);
	}
	/**
	* The environment variables that we standardized on, for all ad-hoc logging.
	*/
	exports.env = { 
	/**
	* Filter wildcards specific to the Node syntax, and similar to the built-in
	* utils.debuglog() environment variable. If missing, disables logging.
	*/
nodeEnables: "GOOGLE_SDK_NODE_LOGGING" };
	var loggerCache = /* @__PURE__ */ new Map();
	var cachedBackend = void 0;
	/**
	* Set the backend to use for our log output.
	* - A backend object
	* - null to disable logging
	* - undefined for "nothing yet", defaults to the Node backend
	*
	* @param backend Results from one of the get*Backend() functions.
	*/
	function setBackend(backend) {
		cachedBackend = backend;
		loggerCache.clear();
	}
	/**
	* Creates a logging function. Multiple calls to this with the same namespace
	* will produce the same logger, with the same event emitter hooks.
	*
	* Namespaces can be a simple string ("system" name), or a qualified string
	* (system:subsystem), which can be used for filtering, or for "system:*".
	*
	* @param namespace The namespace, a descriptive text string.
	* @returns A function you can call that works similar to console.log().
	*/
	function log(namespace, parent) {
		if (!cachedBackend) {
			if (!process$1.env[exports.env.nodeEnables]) return exports.placeholder;
		}
		if (!namespace) return exports.placeholder;
		if (parent) namespace = `${parent.instance.namespace}:${namespace}`;
		const existing = loggerCache.get(namespace);
		if (existing) return existing.func;
		if (cachedBackend === null) return exports.placeholder;
		else if (cachedBackend === void 0) cachedBackend = getNodeBackend();
		const logger = (() => {
			let previousBackend = void 0;
			return new AdhocDebugLogger(namespace, (fields, ...args) => {
				if (previousBackend !== cachedBackend) {
					if (cachedBackend === null) return;
					else if (cachedBackend === void 0) cachedBackend = getNodeBackend();
					previousBackend = cachedBackend;
				}
				cachedBackend === null || cachedBackend === void 0 || cachedBackend.log(namespace, fields, ...args);
			});
		})();
		loggerCache.set(namespace, logger);
		return logger.func;
	}
}));
//#endregion
//#region node_modules/google-logging-utils/build/src/index.js
var require_src$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$5) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$5, p)) __createBinding(exports$5, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_logging_utils(), exports);
}));
//#endregion
//#region node_modules/gcp-metadata/build/src/index.js
var require_src$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	var __exportStar = exports && exports.__exportStar || function(m, exports$4) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$4, p)) __createBinding(exports$4, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.gcpResidencyCache = exports.METADATA_SERVER_DETECTION = exports.HEADERS = exports.HEADER_VALUE = exports.HEADER_NAME = exports.SECONDARY_HOST_ADDRESS = exports.HOST_ADDRESS = exports.BASE_PATH = void 0;
	exports.instance = instance;
	exports.project = project;
	exports.universe = universe;
	exports.bulk = bulk;
	exports.isAvailable = isAvailable;
	exports.resetIsAvailableCache = resetIsAvailableCache;
	exports.getGCPResidency = getGCPResidency;
	exports.setGCPResidency = setGCPResidency;
	exports.requestTimeout = requestTimeout;
	/**
	* Copyright 2018 Google LLC
	*
	* Licensed under the Apache License, Version 2.0 (the "License");
	* you may not use this file except in compliance with the License.
	* You may obtain a copy of the License at
	*
	*      http://www.apache.org/licenses/LICENSE-2.0
	*
	* Unless required by applicable law or agreed to in writing, software
	* distributed under the License is distributed on an "AS IS" BASIS,
	* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	* See the License for the specific language governing permissions and
	* limitations under the License.
	*/
	var gaxios_1 = require_src$3();
	var jsonBigint = require_json_bigint();
	var gcp_residency_1 = require_gcp_residency();
	var logger = __importStar(require_src$2());
	exports.BASE_PATH = "/computeMetadata/v1";
	exports.HOST_ADDRESS = "http://169.254.169.254";
	exports.SECONDARY_HOST_ADDRESS = "http://metadata.google.internal.";
	exports.HEADER_NAME = "Metadata-Flavor";
	exports.HEADER_VALUE = "Google";
	exports.HEADERS = Object.freeze({ [exports.HEADER_NAME]: exports.HEADER_VALUE });
	var log = logger.log("gcp-metadata");
	/**
	* Metadata server detection override options.
	*
	* Available via `process.env.METADATA_SERVER_DETECTION`.
	*/
	exports.METADATA_SERVER_DETECTION = Object.freeze({
		"assume-present": "don't try to ping the metadata server, but assume it's present",
		none: "don't try to ping the metadata server, but don't try to use it either",
		"bios-only": "treat the result of a BIOS probe as canonical (don't fall back to pinging)",
		"ping-only": "skip the BIOS probe, and go straight to pinging"
	});
	/**
	* Returns the base URL while taking into account the GCE_METADATA_HOST
	* environment variable if it exists.
	*
	* @returns The base URL, e.g., http://169.254.169.254/computeMetadata/v1.
	*/
	function getBaseUrl(baseUrl) {
		if (!baseUrl) baseUrl = process.env.GCE_METADATA_IP || process.env.GCE_METADATA_HOST || exports.HOST_ADDRESS;
		if (!/^https?:\/\//.test(baseUrl)) baseUrl = `http://${baseUrl}`;
		return new URL(exports.BASE_PATH, baseUrl).href;
	}
	function validate(options) {
		Object.keys(options).forEach((key) => {
			switch (key) {
				case "params":
				case "property":
				case "headers": break;
				case "qs": throw new Error("'qs' is not a valid configuration option. Please use 'params' instead.");
				default: throw new Error(`'${key}' is not a valid configuration option.`);
			}
		});
	}
	async function metadataAccessor(type, options = {}, noResponseRetries = 3, fastFail = false) {
		const headers = new Headers(exports.HEADERS);
		let metadataKey = "";
		let params = {};
		if (typeof type === "object") {
			const metadataAccessor = type;
			new Headers(metadataAccessor.headers).forEach((value, key) => headers.set(key, value));
			metadataKey = metadataAccessor.metadataKey;
			params = metadataAccessor.params || params;
			noResponseRetries = metadataAccessor.noResponseRetries || noResponseRetries;
			fastFail = metadataAccessor.fastFail || fastFail;
		} else metadataKey = type;
		if (typeof options === "string") metadataKey += `/${options}`;
		else {
			validate(options);
			if (options.property) metadataKey += `/${options.property}`;
			new Headers(options.headers).forEach((value, key) => headers.set(key, value));
			params = options.params || params;
		}
		const requestMethod = fastFail ? fastFailMetadataRequest : gaxios_1.request;
		const req = {
			url: `${getBaseUrl()}/${metadataKey}`,
			headers,
			retryConfig: { noResponseRetries },
			params,
			responseType: "text",
			timeout: requestTimeout()
		};
		log.info("instance request %j", req);
		const res = await requestMethod(req);
		log.info("instance metadata is %s", res.data);
		const metadataFlavor = res.headers.get(exports.HEADER_NAME);
		if (metadataFlavor !== exports.HEADER_VALUE) throw new RangeError(`Invalid response from metadata service: incorrect ${exports.HEADER_NAME} header. Expected '${exports.HEADER_VALUE}', got ${metadataFlavor ? `'${metadataFlavor}'` : "no header"}`);
		if (typeof res.data === "string") try {
			return jsonBigint.parse(res.data);
		} catch {}
		return res.data;
	}
	async function fastFailMetadataRequest(options) {
		const secondaryOptions = {
			...options,
			url: options.url?.toString().replace(getBaseUrl(), getBaseUrl(exports.SECONDARY_HOST_ADDRESS))
		};
		const r1 = (0, gaxios_1.request)(options);
		const r2 = (0, gaxios_1.request)(secondaryOptions);
		return Promise.any([r1, r2]);
	}
	/**
	* Obtain metadata for the current GCE instance.
	*
	* @see {@link https://cloud.google.com/compute/docs/metadata/predefined-metadata-keys}
	*
	* @example
	* ```
	* const serviceAccount: {} = await instance('service-accounts/');
	* const serviceAccountEmail: string = await instance('service-accounts/default/email');
	* ```
	*/
	function instance(options) {
		return metadataAccessor("instance", options);
	}
	/**
	* Obtain metadata for the current GCP project.
	*
	* @see {@link https://cloud.google.com/compute/docs/metadata/predefined-metadata-keys}
	*
	* @example
	* ```
	* const projectId: string = await project('project-id');
	* const numericProjectId: number = await project('numeric-project-id');
	* ```
	*/
	function project(options) {
		return metadataAccessor("project", options);
	}
	/**
	* Obtain metadata for the current universe.
	*
	* @see {@link https://cloud.google.com/compute/docs/metadata/predefined-metadata-keys}
	*
	* @example
	* ```
	* const universeDomain: string = await universe('universe-domain');
	* ```
	*/
	function universe(options) {
		return metadataAccessor("universe", options);
	}
	/**
	* Retrieve metadata items in parallel.
	*
	* @see {@link https://cloud.google.com/compute/docs/metadata/predefined-metadata-keys}
	*
	* @example
	* ```
	* const data = await bulk([
	*   {
	*     metadataKey: 'instance',
	*   },
	*   {
	*     metadataKey: 'project/project-id',
	*   },
	* ] as const);
	*
	* // data.instance;
	* // data['project/project-id'];
	* ```
	*
	* @param properties The metadata properties to retrieve
	* @returns The metadata in `metadatakey:value` format
	*/
	async function bulk(properties) {
		const r = {};
		await Promise.all(properties.map((item) => {
			return (async () => {
				const res = await metadataAccessor(item);
				const key = item.metadataKey;
				r[key] = res;
			})();
		}));
		return r;
	}
	function detectGCPAvailableRetries() {
		return process.env.DETECT_GCP_RETRIES ? Number(process.env.DETECT_GCP_RETRIES) : 0;
	}
	var cachedIsAvailableResponse;
	/**
	* Determine if the metadata server is currently available.
	*/
	async function isAvailable() {
		if (process.env.METADATA_SERVER_DETECTION) {
			const value = process.env.METADATA_SERVER_DETECTION.trim().toLocaleLowerCase();
			if (!(value in exports.METADATA_SERVER_DETECTION)) throw new RangeError(`Unknown \`METADATA_SERVER_DETECTION\` env variable. Got \`${value}\`, but it should be \`${Object.keys(exports.METADATA_SERVER_DETECTION).join("`, `")}\`, or unset`);
			switch (value) {
				case "assume-present": return true;
				case "none": return false;
				case "bios-only": return getGCPResidency();
				case "ping-only":
			}
		}
		try {
			if (cachedIsAvailableResponse === void 0) cachedIsAvailableResponse = metadataAccessor("instance", void 0, detectGCPAvailableRetries(), !(process.env.GCE_METADATA_IP || process.env.GCE_METADATA_HOST));
			await cachedIsAvailableResponse;
			return true;
		} catch (e) {
			const err = e;
			if (process.env.DEBUG_AUTH) console.info(err);
			if (err.type === "request-timeout") return false;
			if (err.response && err.response.status === 404) return false;
			else {
				if (!(err.response && err.response.status === 404) && (!err.code || ![
					"EHOSTDOWN",
					"EHOSTUNREACH",
					"ENETUNREACH",
					"ENOENT",
					"ENOTFOUND",
					"ECONNREFUSED"
				].includes(err.code.toString()))) {
					let code = "UNKNOWN";
					if (err.code) code = err.code.toString();
					process.emitWarning(`received unexpected error = ${err.message} code = ${code}`, "MetadataLookupWarning");
				}
				return false;
			}
		}
	}
	/**
	* reset the memoized isAvailable() lookup.
	*/
	function resetIsAvailableCache() {
		cachedIsAvailableResponse = void 0;
	}
	/**
	* A cache for the detected GCP Residency.
	*/
	exports.gcpResidencyCache = null;
	/**
	* Detects GCP Residency.
	* Caches results to reduce costs for subsequent calls.
	*
	* @see setGCPResidency for setting
	*/
	function getGCPResidency() {
		if (exports.gcpResidencyCache === null) setGCPResidency();
		return exports.gcpResidencyCache;
	}
	/**
	* Sets the detected GCP Residency.
	* Useful for forcing metadata server detection behavior.
	*
	* Set `null` to autodetect the environment (default behavior).
	* @see getGCPResidency for getting
	*/
	function setGCPResidency(value = null) {
		exports.gcpResidencyCache = value !== null ? value : (0, gcp_residency_1.detectGCPResidency)();
	}
	/**
	* Obtain the timeout for requests to the metadata server.
	*
	* In certain environments and conditions requests can take longer than
	* the default timeout to complete. This function will determine the
	* appropriate timeout based on the environment.
	*
	* @returns {number} a request timeout duration in milliseconds.
	*/
	function requestTimeout() {
		return getGCPResidency() ? 0 : 3e3;
	}
	__exportStar(require_gcp_residency(), exports);
}));
//#endregion
//#region node_modules/base64-js/index.js
var require_base64_js = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.byteLength = byteLength;
	exports.toByteArray = toByteArray;
	exports.fromByteArray = fromByteArray;
	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
	var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (var i = 0, len = code.length; i < len; ++i) {
		lookup[i] = code[i];
		revLookup[code.charCodeAt(i)] = i;
	}
	revLookup["-".charCodeAt(0)] = 62;
	revLookup["_".charCodeAt(0)] = 63;
	function getLens(b64) {
		var len = b64.length;
		if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
		var validLen = b64.indexOf("=");
		if (validLen === -1) validLen = len;
		var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
		return [validLen, placeHoldersLen];
	}
	function byteLength(b64) {
		var lens = getLens(b64);
		var validLen = lens[0];
		var placeHoldersLen = lens[1];
		return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
	}
	function _byteLength(b64, validLen, placeHoldersLen) {
		return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
	}
	function toByteArray(b64) {
		var tmp;
		var lens = getLens(b64);
		var validLen = lens[0];
		var placeHoldersLen = lens[1];
		var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
		var curByte = 0;
		var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
		var i;
		for (i = 0; i < len; i += 4) {
			tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
			arr[curByte++] = tmp >> 16 & 255;
			arr[curByte++] = tmp >> 8 & 255;
			arr[curByte++] = tmp & 255;
		}
		if (placeHoldersLen === 2) {
			tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
			arr[curByte++] = tmp & 255;
		}
		if (placeHoldersLen === 1) {
			tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
			arr[curByte++] = tmp >> 8 & 255;
			arr[curByte++] = tmp & 255;
		}
		return arr;
	}
	function tripletToBase64(num) {
		return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
	}
	function encodeChunk(uint8, start, end) {
		var tmp;
		var output = [];
		for (var i = start; i < end; i += 3) {
			tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (uint8[i + 2] & 255);
			output.push(tripletToBase64(tmp));
		}
		return output.join("");
	}
	function fromByteArray(uint8) {
		var tmp;
		var len = uint8.length;
		var extraBytes = len % 3;
		var parts = [];
		var maxChunkLength = 16383;
		for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
		if (extraBytes === 1) {
			tmp = uint8[len - 1];
			parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
		} else if (extraBytes === 2) {
			tmp = (uint8[len - 2] << 8) + uint8[len - 1];
			parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
		}
		return parts.join("");
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/crypto/shared.js
var require_shared$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.fromArrayBufferToHex = fromArrayBufferToHex;
	/**
	* Converts an ArrayBuffer to a hexadecimal string.
	* @param arrayBuffer The ArrayBuffer to convert to hexadecimal string.
	* @return The hexadecimal encoding of the ArrayBuffer.
	*/
	function fromArrayBufferToHex(arrayBuffer) {
		return Array.from(new Uint8Array(arrayBuffer)).map((byte) => {
			return byte.toString(16).padStart(2, "0");
		}).join("");
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/crypto/browser/crypto.js
var require_crypto$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BrowserCrypto = void 0;
	var base64js = require_base64_js();
	var shared_1 = require_shared$1();
	exports.BrowserCrypto = class BrowserCrypto {
		constructor() {
			if (typeof window === "undefined" || window.crypto === void 0 || window.crypto.subtle === void 0) throw new Error("SubtleCrypto not found. Make sure it's an https:// website.");
		}
		async sha256DigestBase64(str) {
			const inputBuffer = new TextEncoder().encode(str);
			const outputBuffer = await window.crypto.subtle.digest("SHA-256", inputBuffer);
			return base64js.fromByteArray(new Uint8Array(outputBuffer));
		}
		randomBytesBase64(count) {
			const array = new Uint8Array(count);
			window.crypto.getRandomValues(array);
			return base64js.fromByteArray(array);
		}
		static padBase64(base64) {
			while (base64.length % 4 !== 0) base64 += "=";
			return base64;
		}
		async verify(pubkey, data, signature) {
			const algo = {
				name: "RSASSA-PKCS1-v1_5",
				hash: { name: "SHA-256" }
			};
			const dataArray = new TextEncoder().encode(data);
			const signatureArray = base64js.toByteArray(BrowserCrypto.padBase64(signature));
			const cryptoKey = await window.crypto.subtle.importKey("jwk", pubkey, algo, true, ["verify"]);
			return await window.crypto.subtle.verify(algo, cryptoKey, Buffer.from(signatureArray), dataArray);
		}
		async sign(privateKey, data) {
			const algo = {
				name: "RSASSA-PKCS1-v1_5",
				hash: { name: "SHA-256" }
			};
			const dataArray = new TextEncoder().encode(data);
			const cryptoKey = await window.crypto.subtle.importKey("jwk", privateKey, algo, true, ["sign"]);
			const result = await window.crypto.subtle.sign(algo, cryptoKey, dataArray);
			return base64js.fromByteArray(new Uint8Array(result));
		}
		decodeBase64StringUtf8(base64) {
			const uint8array = base64js.toByteArray(BrowserCrypto.padBase64(base64));
			return new TextDecoder().decode(uint8array);
		}
		encodeBase64StringUtf8(text) {
			const uint8array = new TextEncoder().encode(text);
			return base64js.fromByteArray(uint8array);
		}
		/**
		* Computes the SHA-256 hash of the provided string.
		* @param str The plain text string to hash.
		* @return A promise that resolves with the SHA-256 hash of the provided
		*   string in hexadecimal encoding.
		*/
		async sha256DigestHex(str) {
			const inputBuffer = new TextEncoder().encode(str);
			const outputBuffer = await window.crypto.subtle.digest("SHA-256", inputBuffer);
			return (0, shared_1.fromArrayBufferToHex)(outputBuffer);
		}
		/**
		* Computes the HMAC hash of a message using the provided crypto key and the
		* SHA-256 algorithm.
		* @param key The secret crypto key in utf-8 or ArrayBuffer format.
		* @param msg The plain text message.
		* @return A promise that resolves with the HMAC-SHA256 hash in ArrayBuffer
		*   format.
		*/
		async signWithHmacSha256(key, msg) {
			const rawKey = typeof key === "string" ? key : String.fromCharCode(...new Uint16Array(key));
			const enc = new TextEncoder();
			const cryptoKey = await window.crypto.subtle.importKey("raw", enc.encode(rawKey), {
				name: "HMAC",
				hash: { name: "SHA-256" }
			}, false, ["sign"]);
			return window.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/crypto/node/crypto.js
var require_crypto$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NodeCrypto = void 0;
	var crypto$3 = __require("crypto");
	var NodeCrypto = class {
		async sha256DigestBase64(str) {
			return crypto$3.createHash("sha256").update(str).digest("base64");
		}
		randomBytesBase64(count) {
			return crypto$3.randomBytes(count).toString("base64");
		}
		async verify(pubkey, data, signature) {
			const verifier = crypto$3.createVerify("RSA-SHA256");
			verifier.update(data);
			verifier.end();
			return verifier.verify(pubkey, signature, "base64");
		}
		async sign(privateKey, data) {
			const signer = crypto$3.createSign("RSA-SHA256");
			signer.update(data);
			signer.end();
			return signer.sign(privateKey, "base64");
		}
		decodeBase64StringUtf8(base64) {
			return Buffer.from(base64, "base64").toString("utf-8");
		}
		encodeBase64StringUtf8(text) {
			return Buffer.from(text, "utf-8").toString("base64");
		}
		/**
		* Computes the SHA-256 hash of the provided string.
		* @param str The plain text string to hash.
		* @return A promise that resolves with the SHA-256 hash of the provided
		*   string in hexadecimal encoding.
		*/
		async sha256DigestHex(str) {
			return crypto$3.createHash("sha256").update(str).digest("hex");
		}
		/**
		* Computes the HMAC hash of a message using the provided crypto key and the
		* SHA-256 algorithm.
		* @param key The secret crypto key in utf-8 or ArrayBuffer format.
		* @param msg The plain text message.
		* @return A promise that resolves with the HMAC-SHA256 hash in ArrayBuffer
		*   format.
		*/
		async signWithHmacSha256(key, msg) {
			const cryptoKey = typeof key === "string" ? key : toBuffer(key);
			return toArrayBuffer(crypto$3.createHmac("sha256", cryptoKey).update(msg).digest());
		}
	};
	exports.NodeCrypto = NodeCrypto;
	/**
	* Converts a Node.js Buffer to an ArrayBuffer.
	* https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
	* @param buffer The Buffer input to covert.
	* @return The ArrayBuffer representation of the input.
	*/
	function toArrayBuffer(buffer) {
		const ab = new ArrayBuffer(buffer.length);
		const view = new Uint8Array(ab);
		for (let i = 0; i < buffer.length; ++i) view[i] = buffer[i];
		return ab;
	}
	/**
	* Converts an ArrayBuffer to a Node.js Buffer.
	* @param arrayBuffer The ArrayBuffer input to covert.
	* @return The Buffer representation of the input.
	*/
	function toBuffer(arrayBuffer) {
		return Buffer.from(arrayBuffer);
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/crypto/crypto.js
var require_crypto = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$3) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$3, p)) __createBinding(exports$3, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createCrypto = createCrypto;
	exports.hasBrowserCrypto = hasBrowserCrypto;
	var crypto_1 = require_crypto$2();
	var crypto_2 = require_crypto$1();
	__exportStar(require_shared$1(), exports);
	function createCrypto() {
		if (hasBrowserCrypto()) return new crypto_1.BrowserCrypto();
		return new crypto_2.NodeCrypto();
	}
	function hasBrowserCrypto() {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined" && typeof window.crypto.subtle !== "undefined";
	}
}));
//#endregion
//#region node_modules/safe-buffer/index.js
var require_safe_buffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
	var buffer = __require("buffer");
	var Buffer = buffer.Buffer;
	function copyProps(src, dst) {
		for (var key in src) dst[key] = src[key];
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) module.exports = buffer;
	else {
		copyProps(buffer, exports);
		exports.Buffer = SafeBuffer;
	}
	function SafeBuffer(arg, encodingOrOffset, length) {
		return Buffer(arg, encodingOrOffset, length);
	}
	SafeBuffer.prototype = Object.create(Buffer.prototype);
	copyProps(Buffer, SafeBuffer);
	SafeBuffer.from = function(arg, encodingOrOffset, length) {
		if (typeof arg === "number") throw new TypeError("Argument must not be a number");
		return Buffer(arg, encodingOrOffset, length);
	};
	SafeBuffer.alloc = function(size, fill, encoding) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		var buf = Buffer(size);
		if (fill !== void 0) if (typeof encoding === "string") buf.fill(fill, encoding);
		else buf.fill(fill);
		else buf.fill(0);
		return buf;
	};
	SafeBuffer.allocUnsafe = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return Buffer(size);
	};
	SafeBuffer.allocUnsafeSlow = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return buffer.SlowBuffer(size);
	};
}));
//#endregion
//#region node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function getParamSize(keySize) {
		return (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
	}
	var paramBytesForAlg = {
		ES256: getParamSize(256),
		ES384: getParamSize(384),
		ES512: getParamSize(521)
	};
	function getParamBytesForAlg(alg) {
		var paramBytes = paramBytesForAlg[alg];
		if (paramBytes) return paramBytes;
		throw new Error("Unknown algorithm \"" + alg + "\"");
	}
	module.exports = getParamBytesForAlg;
}));
//#endregion
//#region node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var getParamBytesForAlg = require_param_bytes_for_alg();
	var MAX_OCTET = 128, CLASS_UNIVERSAL = 0, PRIMITIVE_BIT = 32, TAG_SEQ = 16, TAG_INT = 2, ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6, ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
	function base64Url(base64) {
		return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}
	function signatureAsBuffer(signature) {
		if (Buffer.isBuffer(signature)) return signature;
		else if ("string" === typeof signature) return Buffer.from(signature, "base64");
		throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
	}
	function derToJose(signature, alg) {
		signature = signatureAsBuffer(signature);
		var paramBytes = getParamBytesForAlg(alg);
		var maxEncodedParamLength = paramBytes + 1;
		var inputLength = signature.length;
		var offset = 0;
		if (signature[offset++] !== ENCODED_TAG_SEQ) throw new Error("Could not find expected \"seq\"");
		var seqLength = signature[offset++];
		if (seqLength === (MAX_OCTET | 1)) seqLength = signature[offset++];
		if (inputLength - offset < seqLength) throw new Error("\"seq\" specified length of \"" + seqLength + "\", only \"" + (inputLength - offset) + "\" remaining");
		if (signature[offset++] !== ENCODED_TAG_INT) throw new Error("Could not find expected \"int\" for \"r\"");
		var rLength = signature[offset++];
		if (inputLength - offset - 2 < rLength) throw new Error("\"r\" specified length of \"" + rLength + "\", only \"" + (inputLength - offset - 2) + "\" available");
		if (maxEncodedParamLength < rLength) throw new Error("\"r\" specified length of \"" + rLength + "\", max of \"" + maxEncodedParamLength + "\" is acceptable");
		var rOffset = offset;
		offset += rLength;
		if (signature[offset++] !== ENCODED_TAG_INT) throw new Error("Could not find expected \"int\" for \"s\"");
		var sLength = signature[offset++];
		if (inputLength - offset !== sLength) throw new Error("\"s\" specified length of \"" + sLength + "\", expected \"" + (inputLength - offset) + "\"");
		if (maxEncodedParamLength < sLength) throw new Error("\"s\" specified length of \"" + sLength + "\", max of \"" + maxEncodedParamLength + "\" is acceptable");
		var sOffset = offset;
		offset += sLength;
		if (offset !== inputLength) throw new Error("Expected to consume entire buffer, but \"" + (inputLength - offset) + "\" bytes remain");
		var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
		var dst = Buffer.allocUnsafe(rPadding + rLength + sPadding + sLength);
		for (offset = 0; offset < rPadding; ++offset) dst[offset] = 0;
		signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
		offset = paramBytes;
		for (var o = offset; offset < o + sPadding; ++offset) dst[offset] = 0;
		signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
		dst = dst.toString("base64");
		dst = base64Url(dst);
		return dst;
	}
	function countPadding(buf, start, stop) {
		var padding = 0;
		while (start + padding < stop && buf[start + padding] === 0) ++padding;
		if (buf[start + padding] >= MAX_OCTET) --padding;
		return padding;
	}
	function joseToDer(signature, alg) {
		signature = signatureAsBuffer(signature);
		var paramBytes = getParamBytesForAlg(alg);
		var signatureBytes = signature.length;
		if (signatureBytes !== paramBytes * 2) throw new TypeError("\"" + alg + "\" signatures must be \"" + paramBytes * 2 + "\" bytes, saw \"" + signatureBytes + "\"");
		var rPadding = countPadding(signature, 0, paramBytes);
		var sPadding = countPadding(signature, paramBytes, signature.length);
		var rLength = paramBytes - rPadding;
		var sLength = paramBytes - sPadding;
		var rsBytes = 2 + rLength + 1 + 1 + sLength;
		var shortLength = rsBytes < MAX_OCTET;
		var dst = Buffer.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
		var offset = 0;
		dst[offset++] = ENCODED_TAG_SEQ;
		if (shortLength) dst[offset++] = rsBytes;
		else {
			dst[offset++] = MAX_OCTET | 1;
			dst[offset++] = rsBytes & 255;
		}
		dst[offset++] = ENCODED_TAG_INT;
		dst[offset++] = rLength;
		if (rPadding < 0) {
			dst[offset++] = 0;
			offset += signature.copy(dst, offset, 0, paramBytes);
		} else offset += signature.copy(dst, offset, rPadding, paramBytes);
		dst[offset++] = ENCODED_TAG_INT;
		dst[offset++] = sLength;
		if (sPadding < 0) {
			dst[offset++] = 0;
			signature.copy(dst, offset, paramBytes);
		} else signature.copy(dst, offset, paramBytes + sPadding);
		return dst;
	}
	module.exports = {
		derToJose,
		joseToDer
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LRUCache = void 0;
	exports.snakeToCamel = snakeToCamel;
	exports.originalOrCamelOptions = originalOrCamelOptions;
	exports.removeUndefinedValuesInObject = removeUndefinedValuesInObject;
	exports.isValidFile = isValidFile;
	exports.getWellKnownCertificateConfigFileLocation = getWellKnownCertificateConfigFileLocation;
	var fs$6 = __require("fs");
	var os$1 = __require("os");
	var path$2 = __require("path");
	var WELL_KNOWN_CERTIFICATE_CONFIG_FILE = "certificate_config.json";
	var CLOUDSDK_CONFIG_DIRECTORY = "gcloud";
	/**
	* Returns the camel case of a provided string.
	*
	* @remarks
	*
	* Match any `_` and not `_` pair, then return the uppercase of the not `_`
	* character.
	*
	* @param str the string to convert
	* @returns the camelCase'd string
	*/
	function snakeToCamel(str) {
		return str.replace(/([_][^_])/g, (match) => match.slice(1).toUpperCase());
	}
	/**
	* Get the value of `obj[key]` or `obj[camelCaseKey]`, with a preference
	* for original, non-camelCase key.
	*
	* @param obj object to lookup a value in
	* @returns a `get` function for getting `obj[key || snakeKey]`, if available
	*/
	function originalOrCamelOptions(obj) {
		/**
		*
		* @param key an index of object, preferably snake_case
		* @returns the value `obj[key || snakeKey]`, if available
		*/
		function get(key) {
			const o = obj || {};
			return o[key] ?? o[snakeToCamel(key)];
		}
		return { get };
	}
	/**
	* A simple LRU cache utility.
	* Not meant for external usage.
	*
	* @experimental
	*/
	var LRUCache = class {
		capacity;
		/**
		* Maps are in order. Thus, the older item is the first item.
		*
		* {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map}
		*/
		#cache = /* @__PURE__ */ new Map();
		maxAge;
		constructor(options) {
			this.capacity = options.capacity;
			this.maxAge = options.maxAge;
		}
		/**
		* Moves the key to the end of the cache.
		*
		* @param key the key to move
		* @param value the value of the key
		*/
		#moveToEnd(key, value) {
			this.#cache.delete(key);
			this.#cache.set(key, {
				value,
				lastAccessed: Date.now()
			});
		}
		/**
		* Add an item to the cache.
		*
		* @param key the key to upsert
		* @param value the value of the key
		*/
		set(key, value) {
			this.#moveToEnd(key, value);
			this.#evict();
		}
		/**
		* Get an item from the cache.
		*
		* @param key the key to retrieve
		*/
		get(key) {
			const item = this.#cache.get(key);
			if (!item) return;
			this.#moveToEnd(key, item.value);
			this.#evict();
			return item.value;
		}
		/**
		* Maintain the cache based on capacity and TTL.
		*/
		#evict() {
			const cutoffDate = this.maxAge ? Date.now() - this.maxAge : 0;
			/**
			* Because we know Maps are in order, this item is both the
			* last item in the list (capacity) and oldest (maxAge).
			*/
			let oldestItem = this.#cache.entries().next();
			while (!oldestItem.done && (this.#cache.size > this.capacity || oldestItem.value[1].lastAccessed < cutoffDate)) {
				this.#cache.delete(oldestItem.value[0]);
				oldestItem = this.#cache.entries().next();
			}
		}
	};
	exports.LRUCache = LRUCache;
	function removeUndefinedValuesInObject(object) {
		Object.entries(object).forEach(([key, value]) => {
			if (value === void 0 || value === "undefined") delete object[key];
		});
		return object;
	}
	/**
	* Helper to check if a path points to a valid file.
	*/
	async function isValidFile(filePath) {
		try {
			return (await fs$6.promises.lstat(filePath)).isFile();
		} catch (e) {
			return false;
		}
	}
	/**
	* Determines the well-known gcloud location for the certificate config file.
	* @returns The platform-specific path to the configuration file.
	* @internal
	*/
	function getWellKnownCertificateConfigFileLocation() {
		const configDir = process.env.CLOUDSDK_CONFIG || (_isWindows() ? path$2.join(process.env.APPDATA || "", CLOUDSDK_CONFIG_DIRECTORY) : path$2.join(process.env.HOME || "", ".config", CLOUDSDK_CONFIG_DIRECTORY));
		return path$2.join(configDir, WELL_KNOWN_CERTIFICATE_CONFIG_FILE);
	}
	/**
	* Checks if the current operating system is Windows.
	* @returns True if the OS is Windows, false otherwise.
	* @internal
	*/
	function _isWindows() {
		return os$1.platform().startsWith("win");
	}
}));
//#endregion
//#region node_modules/google-auth-library/package.json
var package_exports = /* @__PURE__ */ __exportAll({
	author: () => author,
	default: () => package_default,
	dependencies: () => dependencies,
	description: () => description,
	devDependencies: () => devDependencies,
	engines: () => engines,
	files: () => files,
	homepage: () => homepage,
	keywords: () => keywords,
	license: () => license,
	main: () => main,
	name: () => name,
	repository: () => repository,
	scripts: () => scripts,
	types: () => types,
	version: () => version
});
var name, version, author, description, engines, main, types, repository, keywords, dependencies, devDependencies, files, scripts, license, homepage, package_default;
var init_package = __esmMin((() => {
	name = "google-auth-library";
	version = "10.9.0";
	author = "Google Inc.";
	description = "Google APIs Authentication Client Library for Node.js";
	engines = { "node": ">=18" };
	main = "./build/src/index.js";
	types = "./build/src/index.d.ts";
	repository = {
		"type": "git",
		"directory": "core/packages/google-auth-library-nodejs",
		"url": "https://github.com/googleapis/google-cloud-node.git"
	};
	keywords = [
		"google",
		"api",
		"google apis",
		"client",
		"client library"
	];
	dependencies = {
		"base64-js": "^1.3.0",
		"ecdsa-sig-formatter": "^1.0.11",
		"gaxios": "^7.1.4",
		"gcp-metadata": "8.1.2",
		"google-logging-utils": "1.1.3",
		"jws": "^4.0.0"
	};
	devDependencies = {
		"@types/base64-js": "^1.2.5",
		"@types/jws": "^3.1.0",
		"@types/mocha": "^10.0.10",
		"@types/mv": "^2.1.0",
		"@types/ncp": "^2.0.8",
		"@types/node": "^24.0.0",
		"@types/sinon": "^21.0.0",
		"assert-rejects": "^1.0.0",
		"c8": "^10.1.3",
		"codecov": "^3.8.3",
		"gts": "^6.0.2",
		"is-docker": "^3.0.0",
		"jsdoc": "^4.0.4",
		"jsdoc-fresh": "^5.0.0",
		"jsdoc-region-tag": "^4.0.0",
		"karma": "^6.0.0",
		"karma-chrome-launcher": "^3.0.0",
		"karma-coverage": "^2.0.0",
		"karma-firefox-launcher": "^2.0.0",
		"karma-mocha": "^2.0.0",
		"karma-sourcemap-loader": "^0.4.0",
		"karma-webpack": "^5.0.1",
		"keypair": "^1.0.4",
		"mocha": "^11.1.0",
		"mv": "^2.1.1",
		"ncp": "^2.0.0",
		"nock": "^14.0.5",
		"null-loader": "^4.0.1",
		"puppeteer": "^24.0.0",
		"sinon": "21.0.3",
		"ts-loader": "^9.5.2",
		"typescript": "5.8.3",
		"webpack": "^5.97.1",
		"webpack-cli": "^6.0.1"
	};
	files = ["build/src", "!build/src/**/*.map"];
	scripts = {
		"test": "c8 mocha build/test",
		"clean": "gts clean",
		"prepare": "npm run compile",
		"lint": "gts check --no-inline-config",
		"compile": "tsc -p .",
		"fix": "gts fix",
		"pretest": "npm run compile -- --sourceMap",
		"docs": "jsdoc -c .jsdoc.js",
		"samples-setup": "cd samples/ && npm link ../ && npm run setup && cd ../",
		"samples-test": "cd samples/ && npm link ../ && npm test && cd ../",
		"system-test": "mocha build/system-test --timeout 60000",
		"presystem-test": "npm run compile -- --sourceMap",
		"webpack": "webpack",
		"browser-test": "karma start",
		"prelint": "cd samples; npm link ../; npm install"
	};
	license = "Apache-2.0";
	homepage = "https://github.com/googleapis/google-cloud-node/tree/main/core/packages/google-auth-library-nodejs";
	package_default = {
		name,
		version,
		author,
		description,
		engines,
		main,
		types,
		repository,
		keywords,
		dependencies,
		devDependencies,
		files,
		scripts,
		license,
		homepage
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/shared.cjs
var require_shared = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.USER_AGENT = exports.PRODUCT_NAME = exports.pkg = void 0;
	var pkg = (init_package(), __toCommonJS(package_exports).default);
	exports.pkg = pkg;
	var PRODUCT_NAME = "google-api-nodejs-client";
	exports.PRODUCT_NAME = PRODUCT_NAME;
	exports.USER_AGENT = `${PRODUCT_NAME}/${pkg.version}`;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/authclient.js
var require_authclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AuthClient = exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS = exports.DEFAULT_UNIVERSE = void 0;
	var events_1 = __require("events");
	var gaxios_1 = require_src$3();
	var util_1 = require_util();
	var google_logging_utils_1 = require_src$2();
	var shared_cjs_1 = require_shared();
	/**
	* The default cloud universe
	*
	* @see {@link AuthJSONOptions.universe_domain}
	*/
	exports.DEFAULT_UNIVERSE = "googleapis.com";
	/**
	* The default {@link AuthClientOptions.eagerRefreshThresholdMillis}
	*/
	exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS = 300 * 1e3;
	exports.AuthClient = class AuthClient extends events_1.EventEmitter {
		apiKey;
		projectId;
		/**
		* The quota project ID. The quota project can be used by client libraries for the billing purpose.
		* See {@link https://cloud.google.com/docs/quota Working with quotas}
		*/
		quotaProjectId;
		/**
		* The {@link Gaxios `Gaxios`} instance used for making requests.
		*/
		transporter;
		credentials = {};
		eagerRefreshThresholdMillis = exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS;
		forceRefreshOnFailure = false;
		universeDomain = exports.DEFAULT_UNIVERSE;
		/**
		* Symbols that can be added to GaxiosOptions to specify the method name that is
		* making an RPC call, for logging purposes, as well as a string ID that can be
		* used to correlate calls and responses.
		*/
		static RequestMethodNameSymbol = Symbol("request method name");
		static RequestLogIdSymbol = Symbol("request log id");
		constructor(opts = {}) {
			super();
			const options = (0, util_1.originalOrCamelOptions)(opts);
			this.apiKey = opts.apiKey;
			this.projectId = options.get("project_id") ?? null;
			this.quotaProjectId = options.get("quota_project_id");
			this.credentials = options.get("credentials") ?? {};
			this.universeDomain = options.get("universe_domain") ?? exports.DEFAULT_UNIVERSE;
			this.transporter = opts.transporter ?? new gaxios_1.Gaxios(opts.transporterOptions);
			if (options.get("useAuthRequestParameters") !== false) {
				this.transporter.interceptors.request.add(AuthClient.DEFAULT_REQUEST_INTERCEPTOR);
				this.transporter.interceptors.response.add(AuthClient.DEFAULT_RESPONSE_INTERCEPTOR);
			}
			if (opts.eagerRefreshThresholdMillis) this.eagerRefreshThresholdMillis = opts.eagerRefreshThresholdMillis;
			this.forceRefreshOnFailure = opts.forceRefreshOnFailure ?? false;
		}
		/**
		* A {@link fetch `fetch`} compliant API for {@link AuthClient}.
		*
		* @see {@link AuthClient.request} for the classic method.
		*
		* @remarks
		*
		* This is useful as a drop-in replacement for `fetch` API usage.
		*
		* @example
		*
		* ```ts
		* const authClient = new AuthClient();
		* const fetchWithAuthClient: typeof fetch = (...args) => authClient.fetch(...args);
		* await fetchWithAuthClient('https://example.com');
		* ```
		*
		* @param args `fetch` API or {@link Gaxios.fetch `Gaxios#fetch`} parameters
		* @returns the {@link GaxiosResponse} with Gaxios-added properties
		*/
		fetch(...args) {
			const input = args[0];
			const init = args[1];
			let url = void 0;
			const headers = new Headers();
			if (typeof input === "string") url = new URL(input);
			else if (input instanceof URL) url = input;
			else if (input && input.url) url = new URL(input.url);
			if (input && typeof input === "object" && "headers" in input) gaxios_1.Gaxios.mergeHeaders(headers, input.headers);
			if (init) gaxios_1.Gaxios.mergeHeaders(headers, new Headers(init.headers));
			if (typeof input === "object" && !(input instanceof URL)) return this.request({
				...init,
				...input,
				headers,
				url
			});
			else return this.request({
				...init,
				headers,
				url
			});
		}
		/**
		* Sets the auth credentials.
		*/
		setCredentials(credentials) {
			this.credentials = credentials;
		}
		/**
		* Append additional headers, e.g., x-goog-user-project, shared across the
		* classes inheriting AuthClient. This method should be used by any method
		* that overrides getRequestMetadataAsync(), which is a shared helper for
		* setting request information in both gRPC and HTTP API calls.
		*
		* @param headers object to append additional headers to.
		*/
		addSharedMetadataHeaders(headers) {
			if (!headers.has("x-goog-user-project") && this.quotaProjectId) headers.set("x-goog-user-project", this.quotaProjectId);
			return headers;
		}
		/**
		* Adds the `x-goog-user-project` and `authorization` headers to the target Headers
		* object, if they exist on the source.
		*
		* @param target the headers to target
		* @param source the headers to source from
		* @returns the target headers
		*/
		addUserProjectAndAuthHeaders(target, source) {
			const xGoogUserProject = source.get("x-goog-user-project");
			const authorizationHeader = source.get("authorization");
			if (xGoogUserProject) target.set("x-goog-user-project", xGoogUserProject);
			if (authorizationHeader) target.set("authorization", authorizationHeader);
			return target;
		}
		static log = (0, google_logging_utils_1.log)("auth");
		static DEFAULT_REQUEST_INTERCEPTOR = { resolved: async (config) => {
			if (!config.headers.has("x-goog-api-client")) {
				const nodeVersion = process.version.replace(/^v/, "");
				config.headers.set("x-goog-api-client", `gl-node/${nodeVersion}`);
			}
			const userAgent = config.headers.get("User-Agent");
			if (!userAgent) config.headers.set("User-Agent", shared_cjs_1.USER_AGENT);
			else if (!userAgent.includes(`${shared_cjs_1.PRODUCT_NAME}/`)) config.headers.set("User-Agent", `${userAgent} ${shared_cjs_1.USER_AGENT}`);
			try {
				const symbols = config;
				const methodName = symbols[AuthClient.RequestMethodNameSymbol];
				const logId = `${Math.floor(Math.random() * 1e3)}`;
				symbols[AuthClient.RequestLogIdSymbol] = logId;
				const logObject = {
					url: config.url,
					headers: config.headers
				};
				if (methodName) AuthClient.log.info("%s [%s] request %j", methodName, logId, logObject);
				else AuthClient.log.info("[%s] request %j", logId, logObject);
			} catch (e) {}
			return config;
		} };
		static DEFAULT_RESPONSE_INTERCEPTOR = {
			resolved: async (response) => {
				try {
					const symbols = response.config;
					const methodName = symbols[AuthClient.RequestMethodNameSymbol];
					const logId = symbols[AuthClient.RequestLogIdSymbol];
					if (methodName) AuthClient.log.info("%s [%s] response %j", methodName, logId, response.data);
					else AuthClient.log.info("[%s] response %j", logId, response.data);
				} catch (e) {}
				return response;
			},
			rejected: async (error) => {
				try {
					const symbols = error.config;
					const methodName = symbols[AuthClient.RequestMethodNameSymbol];
					const logId = symbols[AuthClient.RequestLogIdSymbol];
					if (methodName) AuthClient.log.info("%s [%s] error %j", methodName, logId, error.response?.data);
					else AuthClient.log.error("[%s] error %j", logId, error.response?.data);
				} catch (e) {}
				throw error;
			}
		};
		/**
		* Sets the method name that is making a Gaxios request, so that logging may tag
		* log lines with the operation.
		* @param config A Gaxios request config
		* @param methodName The method name making the call
		*/
		static setMethodName(config, methodName) {
			try {
				const symbols = config;
				symbols[AuthClient.RequestMethodNameSymbol] = methodName;
			} catch (e) {}
		}
		/**
		* Retry config for Auth-related requests.
		*
		* @remarks
		*
		* This is not a part of the default {@link AuthClient.transporter transporter/gaxios}
		* config as some downstream APIs would prefer if customers explicitly enable retries,
		* such as GCS.
		*/
		static get RETRY_CONFIG() {
			return {
				retry: true,
				retryConfig: { httpMethodsToRetry: [
					"GET",
					"PUT",
					"POST",
					"HEAD",
					"OPTIONS",
					"DELETE"
				] }
			};
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/loginticket.js
var require_loginticket = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LoginTicket = void 0;
	var LoginTicket = class {
		envelope;
		payload;
		/**
		* Create a simple class to extract user ID from an ID Token
		*
		* @param {string} env Envelope of the jwt
		* @param {TokenPayload} pay Payload of the jwt
		* @constructor
		*/
		constructor(env, pay) {
			this.envelope = env;
			this.payload = pay;
		}
		getEnvelope() {
			return this.envelope;
		}
		getPayload() {
			return this.payload;
		}
		/**
		* Create a simple class to extract user ID from an ID Token
		*
		* @return The user ID
		*/
		getUserId() {
			const payload = this.getPayload();
			if (payload && payload.sub) return payload.sub;
			return null;
		}
		/**
		* Returns attributes from the login ticket.  This can contain
		* various information about the user session.
		*
		* @return The envelope and payload
		*/
		getAttributes() {
			return {
				envelope: this.getEnvelope(),
				payload: this.getPayload()
			};
		}
	};
	exports.LoginTicket = LoginTicket;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/oauth2client.js
var require_oauth2client = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.OAuth2Client = exports.ClientAuthentication = exports.CertificateFormat = exports.CodeChallengeMethod = void 0;
	var gaxios_1 = require_src$3();
	var querystring = __require("querystring");
	var stream$3 = __require("stream");
	var formatEcdsa = require_ecdsa_sig_formatter();
	var util_1 = require_util();
	var crypto_1 = require_crypto();
	var authclient_1 = require_authclient();
	var loginticket_1 = require_loginticket();
	var CodeChallengeMethod;
	(function(CodeChallengeMethod) {
		CodeChallengeMethod["Plain"] = "plain";
		CodeChallengeMethod["S256"] = "S256";
	})(CodeChallengeMethod || (exports.CodeChallengeMethod = CodeChallengeMethod = {}));
	var CertificateFormat;
	(function(CertificateFormat) {
		CertificateFormat["PEM"] = "PEM";
		CertificateFormat["JWK"] = "JWK";
	})(CertificateFormat || (exports.CertificateFormat = CertificateFormat = {}));
	/**
	* The client authentication type. Supported values are basic, post, and none.
	* https://datatracker.ietf.org/doc/html/rfc7591#section-2
	*/
	var ClientAuthentication;
	(function(ClientAuthentication) {
		ClientAuthentication["ClientSecretPost"] = "ClientSecretPost";
		ClientAuthentication["ClientSecretBasic"] = "ClientSecretBasic";
		ClientAuthentication["None"] = "None";
	})(ClientAuthentication || (exports.ClientAuthentication = ClientAuthentication = {}));
	exports.OAuth2Client = class OAuth2Client extends authclient_1.AuthClient {
		redirectUri;
		certificateCache = {};
		certificateExpiry = null;
		certificateCacheFormat = CertificateFormat.PEM;
		refreshTokenPromises = /* @__PURE__ */ new Map();
		endpoints;
		issuers;
		clientAuthentication;
		_clientId;
		_clientSecret;
		refreshHandler;
		/**
		* An OAuth2 Client for Google APIs.
		*
		* @param options The OAuth2 Client Options. Passing an `clientId` directly is **@DEPRECATED**.
		* @param clientSecret **@DEPRECATED**. Provide a {@link OAuth2ClientOptions `OAuth2ClientOptions`} object in the first parameter instead.
		* @param redirectUri **@DEPRECATED**. Provide a {@link OAuth2ClientOptions `OAuth2ClientOptions`} object in the first parameter instead.
		*/
		constructor(options = {}, clientSecret, redirectUri) {
			super(typeof options === "object" ? options : {});
			if (typeof options !== "object") options = {
				clientId: options,
				clientSecret,
				redirectUri
			};
			this._clientId = options.clientId || options.client_id;
			this._clientSecret = options.clientSecret || options.client_secret;
			this.redirectUri = options.redirectUri || options.redirect_uris?.[0];
			this.endpoints = {
				tokenInfoUrl: "https://oauth2.googleapis.com/tokeninfo",
				oauth2AuthBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
				oauth2TokenUrl: "https://oauth2.googleapis.com/token",
				oauth2RevokeUrl: "https://oauth2.googleapis.com/revoke",
				oauth2FederatedSignonPemCertsUrl: "https://www.googleapis.com/oauth2/v1/certs",
				oauth2FederatedSignonJwkCertsUrl: "https://www.googleapis.com/oauth2/v3/certs",
				oauth2IapPublicKeyUrl: "https://www.gstatic.com/iap/verify/public_key",
				...options.endpoints
			};
			this.clientAuthentication = options.clientAuthentication || ClientAuthentication.ClientSecretPost;
			this.issuers = options.issuers || [
				"accounts.google.com",
				"https://accounts.google.com",
				this.universeDomain
			];
		}
		/**
		* @deprecated use instance's {@link OAuth2Client.endpoints}
		*/
		static GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
		/**
		* Clock skew - five minutes in seconds
		*/
		static CLOCK_SKEW_SECS_ = 300;
		/**
		* The default max Token Lifetime is one day in seconds
		*/
		static DEFAULT_MAX_TOKEN_LIFETIME_SECS_ = 86400;
		/**
		* Generates URL for consent page landing.
		* @param opts Options.
		* @return URL to consent page.
		*/
		generateAuthUrl(opts = {}) {
			if (opts.code_challenge_method && !opts.code_challenge) throw new Error("If a code_challenge_method is provided, code_challenge must be included.");
			opts.response_type = opts.response_type || "code";
			opts.client_id = opts.client_id || this._clientId;
			opts.redirect_uri = opts.redirect_uri || this.redirectUri;
			if (Array.isArray(opts.scope)) opts.scope = opts.scope.join(" ");
			return this.endpoints.oauth2AuthBaseUrl.toString() + "?" + querystring.stringify(opts);
		}
		generateCodeVerifier() {
			throw new Error("generateCodeVerifier is removed, please use generateCodeVerifierAsync instead.");
		}
		/**
		* Convenience method to automatically generate a code_verifier, and its
		* resulting SHA256. If used, this must be paired with a S256
		* code_challenge_method.
		*
		* For a full example see:
		* https://github.com/googleapis/google-auth-library-nodejs/blob/main/samples/oauth2-codeVerifier.js
		*/
		async generateCodeVerifierAsync() {
			const crypto = (0, crypto_1.createCrypto)();
			const codeVerifier = crypto.randomBytesBase64(96).replace(/\+/g, "~").replace(/=/g, "_").replace(/\//g, "-");
			return {
				codeVerifier,
				codeChallenge: (await crypto.sha256DigestBase64(codeVerifier)).split("=")[0].replace(/\+/g, "-").replace(/\//g, "_")
			};
		}
		getToken(codeOrOptions, callback) {
			const options = typeof codeOrOptions === "string" ? { code: codeOrOptions } : codeOrOptions;
			if (callback) this.getTokenAsync(options).then((r) => callback(null, r.tokens, r.res), (e) => callback(e, null, e.response));
			else return this.getTokenAsync(options);
		}
		async getTokenAsync(options) {
			const url = this.endpoints.oauth2TokenUrl.toString();
			const headers = new Headers();
			const values = {
				client_id: options.client_id || this._clientId,
				code_verifier: options.codeVerifier,
				code: options.code,
				grant_type: "authorization_code",
				redirect_uri: options.redirect_uri || this.redirectUri
			};
			if (this.clientAuthentication === ClientAuthentication.ClientSecretBasic) {
				const basic = Buffer.from(`${this._clientId}:${this._clientSecret}`);
				headers.set("authorization", `Basic ${basic.toString("base64")}`);
			}
			if (this.clientAuthentication === ClientAuthentication.ClientSecretPost) values.client_secret = this._clientSecret;
			const opts = {
				...OAuth2Client.RETRY_CONFIG,
				method: "POST",
				url,
				data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(values)),
				headers
			};
			authclient_1.AuthClient.setMethodName(opts, "getTokenAsync");
			const res = await this.transporter.request(opts);
			const tokens = res.data;
			if (res.data && res.data.expires_in) {
				tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + res.data.expires_in * 1e3;
				delete tokens.expires_in;
			}
			this.emit("tokens", tokens);
			return {
				tokens,
				res
			};
		}
		/**
		* Refreshes the access token.
		* @param refresh_token Existing refresh token.
		* @private
		*/
		async refreshToken(refreshToken) {
			if (!refreshToken) return this.refreshTokenNoCache(refreshToken);
			if (this.refreshTokenPromises.has(refreshToken)) return this.refreshTokenPromises.get(refreshToken);
			const p = this.refreshTokenNoCache(refreshToken).then((r) => {
				this.refreshTokenPromises.delete(refreshToken);
				return r;
			}, (e) => {
				this.refreshTokenPromises.delete(refreshToken);
				throw e;
			});
			this.refreshTokenPromises.set(refreshToken, p);
			return p;
		}
		async refreshTokenNoCache(refreshToken) {
			if (!refreshToken) throw new Error("No refresh token is set.");
			const url = this.endpoints.oauth2TokenUrl.toString();
			const data = {
				refresh_token: refreshToken,
				client_id: this._clientId,
				client_secret: this._clientSecret,
				grant_type: "refresh_token"
			};
			let res;
			try {
				const opts = {
					...OAuth2Client.RETRY_CONFIG,
					method: "POST",
					url,
					data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(data))
				};
				authclient_1.AuthClient.setMethodName(opts, "refreshTokenNoCache");
				res = await this.transporter.request(opts);
			} catch (e) {
				if (e instanceof gaxios_1.GaxiosError && e.message === "invalid_grant" && e.response?.data && /ReAuth/i.test(e.response.data.error_description)) e.message = JSON.stringify(e.response.data);
				throw e;
			}
			const tokens = res.data;
			if (res.data && res.data.expires_in) {
				tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + res.data.expires_in * 1e3;
				delete tokens.expires_in;
			}
			this.emit("tokens", tokens);
			return {
				tokens,
				res
			};
		}
		refreshAccessToken(callback) {
			if (callback) this.refreshAccessTokenAsync().then((r) => callback(null, r.credentials, r.res), callback);
			else return this.refreshAccessTokenAsync();
		}
		async refreshAccessTokenAsync() {
			const r = await this.refreshToken(this.credentials.refresh_token);
			const tokens = r.tokens;
			tokens.refresh_token = this.credentials.refresh_token;
			this.credentials = tokens;
			return {
				credentials: this.credentials,
				res: r.res
			};
		}
		getAccessToken(callback) {
			if (callback) this.getAccessTokenAsync().then((r) => callback(null, r.token, r.res), callback);
			else return this.getAccessTokenAsync();
		}
		async getAccessTokenAsync() {
			if (!this.credentials.access_token || this.isTokenExpiring()) {
				if (!this.credentials.refresh_token) if (this.refreshHandler) {
					const refreshedAccessToken = await this.processAndValidateRefreshHandler();
					if (refreshedAccessToken?.access_token) {
						this.setCredentials(refreshedAccessToken);
						return { token: this.credentials.access_token };
					}
				} else throw new Error("No refresh token or refresh handler callback is set.");
				const r = await this.refreshAccessTokenAsync();
				if (!r.credentials || r.credentials && !r.credentials.access_token) throw new Error("Could not refresh access token.");
				return {
					token: r.credentials.access_token,
					res: r.res
				};
			} else return { token: this.credentials.access_token };
		}
		/**
		* The main authentication interface.  It takes an optional url which when
		* present is the endpoint being accessed, and returns a Promise which
		* resolves with authorization header fields.
		*
		* In OAuth2Client, the result has the form:
		* { authorization: 'Bearer <access_token_value>' }
		*/
		async getRequestHeaders(url) {
			return (await this.getRequestMetadataAsync(url)).headers;
		}
		async getRequestMetadataAsync(url) {
			const thisCreds = this.credentials;
			if (!thisCreds.access_token && !thisCreds.refresh_token && !this.apiKey && !this.refreshHandler) throw new Error("No access, refresh token, API key or refresh handler callback is set.");
			if (thisCreds.access_token && !this.isTokenExpiring()) {
				thisCreds.token_type = thisCreds.token_type || "Bearer";
				const headers = new Headers({ authorization: thisCreds.token_type + " " + thisCreds.access_token });
				return { headers: this.addSharedMetadataHeaders(headers) };
			}
			if (this.refreshHandler) {
				const refreshedAccessToken = await this.processAndValidateRefreshHandler();
				if (refreshedAccessToken?.access_token) {
					this.setCredentials(refreshedAccessToken);
					const headers = new Headers({ authorization: "Bearer " + this.credentials.access_token });
					return { headers: this.addSharedMetadataHeaders(headers) };
				}
			}
			if (this.apiKey) return { headers: new Headers({ "X-Goog-Api-Key": this.apiKey }) };
			let r = null;
			let tokens = null;
			try {
				r = await this.refreshToken(thisCreds.refresh_token);
				tokens = r.tokens;
			} catch (err) {
				const e = err;
				if (e.response && (e.response.status === 403 || e.response.status === 404)) e.message = `Could not refresh access token: ${e.message}`;
				throw e;
			}
			const credentials = this.credentials;
			credentials.token_type = credentials.token_type || "Bearer";
			tokens.refresh_token = credentials.refresh_token;
			this.credentials = tokens;
			const headers = new Headers({ authorization: credentials.token_type + " " + tokens.access_token });
			return {
				headers: this.addSharedMetadataHeaders(headers),
				res: r.res
			};
		}
		/**
		* Generates an URL to revoke the given token.
		* @param token The existing token to be revoked.
		*
		* @deprecated use instance method {@link OAuth2Client.getRevokeTokenURL}
		*/
		static getRevokeTokenUrl(token) {
			return new OAuth2Client().getRevokeTokenURL(token).toString();
		}
		/**
		* Generates a URL to revoke the given token.
		*
		* @param token The existing token to be revoked.
		*/
		getRevokeTokenURL(token) {
			const url = new URL(this.endpoints.oauth2RevokeUrl);
			url.searchParams.append("token", token);
			return url;
		}
		revokeToken(token, callback) {
			const opts = {
				...OAuth2Client.RETRY_CONFIG,
				url: this.getRevokeTokenURL(token).toString(),
				method: "POST"
			};
			authclient_1.AuthClient.setMethodName(opts, "revokeToken");
			if (callback) this.transporter.request(opts).then((r) => callback(null, r), callback);
			else return this.transporter.request(opts);
		}
		revokeCredentials(callback) {
			if (callback) this.revokeCredentialsAsync().then((res) => callback(null, res), callback);
			else return this.revokeCredentialsAsync();
		}
		async revokeCredentialsAsync() {
			const token = this.credentials.access_token;
			this.credentials = {};
			if (token) return this.revokeToken(token);
			else throw new Error("No access token to revoke.");
		}
		request(opts, callback) {
			if (callback) this.requestAsync(opts).then((r) => callback(null, r), (e) => {
				return callback(e, e.response);
			});
			else return this.requestAsync(opts);
		}
		async requestAsync(opts, reAuthRetried = false) {
			try {
				const r = await this.getRequestMetadataAsync();
				opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
				this.addUserProjectAndAuthHeaders(opts.headers, r.headers);
				if (this.apiKey) opts.headers.set("X-Goog-Api-Key", this.apiKey);
				return await this.transporter.request(opts);
			} catch (e) {
				const res = e.response;
				if (res) {
					const statusCode = res.status;
					const mayRequireRefresh = this.credentials && this.credentials.access_token && this.credentials.refresh_token && (!this.credentials.expiry_date || this.forceRefreshOnFailure);
					const mayRequireRefreshWithNoRefreshToken = this.credentials && this.credentials.access_token && !this.credentials.refresh_token && (!this.credentials.expiry_date || this.forceRefreshOnFailure) && this.refreshHandler;
					const isReadableStream = res.config.data instanceof stream$3.Readable;
					const isAuthErr = statusCode === 401 || statusCode === 403;
					if (!reAuthRetried && isAuthErr && !isReadableStream && mayRequireRefresh) {
						await this.refreshAccessTokenAsync();
						return this.requestAsync(opts, true);
					} else if (!reAuthRetried && isAuthErr && !isReadableStream && mayRequireRefreshWithNoRefreshToken) {
						const refreshedAccessToken = await this.processAndValidateRefreshHandler();
						if (refreshedAccessToken?.access_token) this.setCredentials(refreshedAccessToken);
						return this.requestAsync(opts, true);
					}
				}
				throw e;
			}
		}
		verifyIdToken(options, callback) {
			if (callback && typeof callback !== "function") throw new Error("This method accepts an options object as the first parameter, which includes the idToken, audience, and maxExpiry.");
			if (callback) this.verifyIdTokenAsync(options).then((r) => callback(null, r), callback);
			else return this.verifyIdTokenAsync(options);
		}
		async verifyIdTokenAsync(options) {
			if (!options.idToken) throw new Error("The verifyIdToken method requires an ID Token");
			const response = await this.getFederatedSignonCertsAsync();
			return await this.verifySignedJwtWithCertsAsync(options.idToken, response.certs, options.audience, this.issuers, options.maxExpiry);
		}
		/**
		* Obtains information about the provisioned access token.  Especially useful
		* if you want to check the scopes that were provisioned to a given token.
		*
		* @param accessToken Required.  The Access Token for which you want to get
		* user info.
		*/
		async getTokenInfo(accessToken) {
			const { data } = await this.transporter.request({
				...OAuth2Client.RETRY_CONFIG,
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded;charset=UTF-8",
					authorization: `Bearer ${accessToken}`
				},
				url: this.endpoints.tokenInfoUrl.toString()
			});
			const info = Object.assign({
				expiry_date: (/* @__PURE__ */ new Date()).getTime() + data.expires_in * 1e3,
				scopes: data.scope.split(" ")
			}, data);
			delete info.expires_in;
			delete info.scope;
			return info;
		}
		getFederatedSignonCerts(callback) {
			if (callback) this.getFederatedSignonCertsAsync().then((r) => callback(null, r.certs, r.res), callback);
			else return this.getFederatedSignonCertsAsync();
		}
		async getFederatedSignonCertsAsync() {
			const nowTime = (/* @__PURE__ */ new Date()).getTime();
			const format = (0, crypto_1.hasBrowserCrypto)() ? CertificateFormat.JWK : CertificateFormat.PEM;
			if (this.certificateExpiry && nowTime < this.certificateExpiry.getTime() && this.certificateCacheFormat === format) return {
				certs: this.certificateCache,
				format
			};
			let res;
			let url;
			switch (format) {
				case CertificateFormat.PEM:
					url = this.endpoints.oauth2FederatedSignonPemCertsUrl.toString();
					break;
				case CertificateFormat.JWK:
					url = this.endpoints.oauth2FederatedSignonJwkCertsUrl.toString();
					break;
				default: throw new Error(`Unsupported certificate format ${format}`);
			}
			try {
				const opts = {
					...OAuth2Client.RETRY_CONFIG,
					url
				};
				authclient_1.AuthClient.setMethodName(opts, "getFederatedSignonCertsAsync");
				res = await this.transporter.request(opts);
			} catch (e) {
				if (e instanceof Error) e.message = `Failed to retrieve verification certificates: ${e.message}`;
				throw e;
			}
			const cacheControl = res?.headers.get("cache-control");
			let cacheAge = -1;
			if (cacheControl) {
				const maxAge = /max-age=(?<maxAge>[0-9]+)/.exec(cacheControl)?.groups?.maxAge;
				if (maxAge) cacheAge = Number(maxAge) * 1e3;
			}
			let certificates = {};
			switch (format) {
				case CertificateFormat.PEM:
					certificates = res.data;
					break;
				case CertificateFormat.JWK:
					for (const key of res.data.keys) certificates[key.kid] = key;
					break;
				default: throw new Error(`Unsupported certificate format ${format}`);
			}
			const now = /* @__PURE__ */ new Date();
			this.certificateExpiry = cacheAge === -1 ? null : new Date(now.getTime() + cacheAge);
			this.certificateCache = certificates;
			this.certificateCacheFormat = format;
			return {
				certs: certificates,
				format,
				res
			};
		}
		getIapPublicKeys(callback) {
			if (callback) this.getIapPublicKeysAsync().then((r) => callback(null, r.pubkeys, r.res), callback);
			else return this.getIapPublicKeysAsync();
		}
		async getIapPublicKeysAsync() {
			let res;
			const url = this.endpoints.oauth2IapPublicKeyUrl.toString();
			try {
				const opts = {
					...OAuth2Client.RETRY_CONFIG,
					url
				};
				authclient_1.AuthClient.setMethodName(opts, "getIapPublicKeysAsync");
				res = await this.transporter.request(opts);
			} catch (e) {
				if (e instanceof Error) e.message = `Failed to retrieve verification certificates: ${e.message}`;
				throw e;
			}
			return {
				pubkeys: res.data,
				res
			};
		}
		verifySignedJwtWithCerts() {
			throw new Error("verifySignedJwtWithCerts is removed, please use verifySignedJwtWithCertsAsync instead.");
		}
		/**
		* Verify the id token is signed with the correct certificate
		* and is from the correct audience.
		* @param jwt The jwt to verify (The ID Token in this case).
		* @param certs The array of certs to test the jwt against.
		* @param requiredAudience The audience to test the jwt against.
		* @param issuers The allowed issuers of the jwt (Optional).
		* @param maxExpiry The max expiry the certificate can be (Optional).
		* @return Returns a promise resolving to LoginTicket on verification.
		*/
		async verifySignedJwtWithCertsAsync(jwt, certs, requiredAudience, issuers, maxExpiry) {
			const crypto = (0, crypto_1.createCrypto)();
			if (!maxExpiry) maxExpiry = OAuth2Client.DEFAULT_MAX_TOKEN_LIFETIME_SECS_;
			const segments = jwt.split(".");
			if (segments.length !== 3) throw new Error("Wrong number of segments in token: " + jwt);
			const signed = segments[0] + "." + segments[1];
			let signature = segments[2];
			let envelope;
			let payload;
			try {
				envelope = JSON.parse(crypto.decodeBase64StringUtf8(segments[0]));
			} catch (err) {
				if (err instanceof Error) err.message = `Can't parse token envelope: ${segments[0]}': ${err.message}`;
				throw err;
			}
			if (!envelope) throw new Error("Can't parse token envelope: " + segments[0]);
			try {
				payload = JSON.parse(crypto.decodeBase64StringUtf8(segments[1]));
			} catch (err) {
				if (err instanceof Error) err.message = `Can't parse token payload '${segments[0]}`;
				throw err;
			}
			if (!payload) throw new Error("Can't parse token payload: " + segments[1]);
			if (!Object.prototype.hasOwnProperty.call(certs, envelope.kid)) throw new Error("No pem found for envelope: " + JSON.stringify(envelope));
			const cert = certs[envelope.kid];
			if (envelope.alg === "ES256") signature = formatEcdsa.joseToDer(signature, "ES256").toString("base64");
			if (!await crypto.verify(cert, signed, signature)) throw new Error("Invalid token signature: " + jwt);
			if (!payload.iat) throw new Error("No issue time in token: " + JSON.stringify(payload));
			if (!payload.exp) throw new Error("No expiration time in token: " + JSON.stringify(payload));
			const iat = Number(payload.iat);
			if (isNaN(iat)) throw new Error("iat field using invalid format");
			const exp = Number(payload.exp);
			if (isNaN(exp)) throw new Error("exp field using invalid format");
			const now = (/* @__PURE__ */ new Date()).getTime() / 1e3;
			if (exp >= now + maxExpiry) throw new Error("Expiration time too far in future: " + JSON.stringify(payload));
			const earliest = iat - OAuth2Client.CLOCK_SKEW_SECS_;
			const latest = exp + OAuth2Client.CLOCK_SKEW_SECS_;
			if (now < earliest) throw new Error("Token used too early, " + now + " < " + earliest + ": " + JSON.stringify(payload));
			if (now > latest) throw new Error("Token used too late, " + now + " > " + latest + ": " + JSON.stringify(payload));
			if (issuers && issuers.indexOf(payload.iss) < 0) throw new Error("Invalid issuer, expected one of [" + issuers + "], but got " + payload.iss);
			if (typeof requiredAudience !== "undefined" && requiredAudience !== null) {
				const aud = payload.aud;
				let audVerified = false;
				if (requiredAudience.constructor === Array) audVerified = requiredAudience.indexOf(aud) > -1;
				else audVerified = aud === requiredAudience;
				if (!audVerified) throw new Error("Wrong recipient, payload audience != requiredAudience");
			}
			return new loginticket_1.LoginTicket(envelope, payload);
		}
		/**
		* Returns a promise that resolves with AccessTokenResponse type if
		* refreshHandler is defined.
		* If not, nothing is returned.
		*/
		async processAndValidateRefreshHandler() {
			if (this.refreshHandler) {
				const accessTokenResponse = await this.refreshHandler();
				if (!accessTokenResponse.access_token) throw new Error("No access token is returned by the refreshHandler callback.");
				return accessTokenResponse;
			}
		}
		/**
		* Returns true if a token is expired or will expire within
		* eagerRefreshThresholdMillismilliseconds.
		* If there is no expiry time, assumes the token is not expired or expiring.
		*/
		isTokenExpiring() {
			const expiryDate = this.credentials.expiry_date;
			return expiryDate ? expiryDate <= (/* @__PURE__ */ new Date()).getTime() + this.eagerRefreshThresholdMillis : false;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/computeclient.js
var require_computeclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Compute = void 0;
	var gaxios_1 = require_src$3();
	var gcpMetadata = require_src$1();
	var oauth2client_1 = require_oauth2client();
	var Compute = class extends oauth2client_1.OAuth2Client {
		serviceAccountEmail;
		scopes;
		/**
		* Google Compute Engine service account credentials.
		*
		* Retrieve access token from the metadata server.
		* See: https://cloud.google.com/compute/docs/access/authenticate-workloads#applications
		*/
		constructor(options = {}) {
			super(options);
			this.credentials = {
				expiry_date: 1,
				refresh_token: "compute-placeholder"
			};
			this.serviceAccountEmail = options.serviceAccountEmail || "default";
			this.scopes = Array.isArray(options.scopes) ? options.scopes : options.scopes ? [options.scopes] : [];
		}
		/**
		* Refreshes the access token.
		* @param refreshToken Unused parameter
		*/
		async refreshTokenNoCache() {
			const tokenPath = `service-accounts/${this.serviceAccountEmail}/token`;
			let data;
			try {
				const instanceOptions = { property: tokenPath };
				if (this.scopes.length > 0) instanceOptions.params = { scopes: this.scopes.join(",") };
				data = await gcpMetadata.instance(instanceOptions);
			} catch (e) {
				if (e instanceof gaxios_1.GaxiosError) {
					e.message = `Could not refresh access token: ${e.message}`;
					this.wrapError(e);
				}
				throw e;
			}
			const tokens = data;
			if (data && data.expires_in) {
				tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + data.expires_in * 1e3;
				delete tokens.expires_in;
			}
			this.emit("tokens", tokens);
			return {
				tokens,
				res: null
			};
		}
		/**
		* Fetches an ID token.
		* @param targetAudience the audience for the fetched ID token.
		*/
		async fetchIdToken(targetAudience) {
			const idTokenPath = `service-accounts/${this.serviceAccountEmail}/identity?format=full&audience=${targetAudience}`;
			let idToken;
			try {
				const instanceOptions = { property: idTokenPath };
				idToken = await gcpMetadata.instance(instanceOptions);
			} catch (e) {
				if (e instanceof Error) e.message = `Could not fetch ID token: ${e.message}`;
				throw e;
			}
			return idToken;
		}
		wrapError(e) {
			const res = e.response;
			if (res && res.status) {
				e.status = res.status;
				if (res.status === 403) e.message = "A Forbidden error was returned while attempting to retrieve an access token for the Compute Engine built-in service account. This may be because the Compute Engine instance does not have the correct permission scopes specified: " + e.message;
				else if (res.status === 404) e.message = "A Not Found error was returned while attempting to retrieve an accesstoken for the Compute Engine built-in service account. This may be because the Compute Engine instance does not have any permission scopes specified: " + e.message;
			}
		}
	};
	exports.Compute = Compute;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/idtokenclient.js
var require_idtokenclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.IdTokenClient = void 0;
	var oauth2client_1 = require_oauth2client();
	var IdTokenClient = class extends oauth2client_1.OAuth2Client {
		targetAudience;
		idTokenProvider;
		/**
		* Google ID Token client
		*
		* Retrieve ID token from the metadata server.
		* See: https://cloud.google.com/docs/authentication/get-id-token#metadata-server
		*/
		constructor(options) {
			super(options);
			this.targetAudience = options.targetAudience;
			this.idTokenProvider = options.idTokenProvider;
		}
		async getRequestMetadataAsync() {
			if (!this.credentials.id_token || !this.credentials.expiry_date || this.isTokenExpiring()) {
				const idToken = await this.idTokenProvider.fetchIdToken(this.targetAudience);
				this.credentials = {
					id_token: idToken,
					expiry_date: this.getIdTokenExpiryDate(idToken)
				};
			}
			return { headers: new Headers({ authorization: "Bearer " + this.credentials.id_token }) };
		}
		getIdTokenExpiryDate(idToken) {
			const payloadB64 = idToken.split(".")[1];
			if (payloadB64) return JSON.parse(Buffer.from(payloadB64, "base64").toString("ascii")).exp * 1e3;
		}
	};
	exports.IdTokenClient = IdTokenClient;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/envDetect.js
var require_envDetect = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GCPEnv = void 0;
	exports.clear = clear;
	exports.getEnv = getEnv;
	var gcpMetadata = require_src$1();
	var GCPEnv;
	(function(GCPEnv) {
		GCPEnv["APP_ENGINE"] = "APP_ENGINE";
		GCPEnv["KUBERNETES_ENGINE"] = "KUBERNETES_ENGINE";
		GCPEnv["CLOUD_FUNCTIONS"] = "CLOUD_FUNCTIONS";
		GCPEnv["COMPUTE_ENGINE"] = "COMPUTE_ENGINE";
		GCPEnv["CLOUD_RUN"] = "CLOUD_RUN";
		GCPEnv["CLOUD_RUN_JOBS"] = "CLOUD_RUN_JOBS";
		GCPEnv["NONE"] = "NONE";
	})(GCPEnv || (exports.GCPEnv = GCPEnv = {}));
	var envPromise;
	function clear() {
		envPromise = void 0;
	}
	async function getEnv() {
		if (envPromise) return envPromise;
		envPromise = getEnvMemoized();
		return envPromise;
	}
	async function getEnvMemoized() {
		let env = GCPEnv.NONE;
		if (isAppEngine()) env = GCPEnv.APP_ENGINE;
		else if (isCloudFunction()) env = GCPEnv.CLOUD_FUNCTIONS;
		else if (await isComputeEngine()) if (await isKubernetesEngine()) env = GCPEnv.KUBERNETES_ENGINE;
		else if (isCloudRun()) env = GCPEnv.CLOUD_RUN;
		else if (isCloudRunJob()) env = GCPEnv.CLOUD_RUN_JOBS;
		else env = GCPEnv.COMPUTE_ENGINE;
		else env = GCPEnv.NONE;
		return env;
	}
	function isAppEngine() {
		return !!(process.env.GAE_SERVICE || process.env.GAE_MODULE_NAME);
	}
	function isCloudFunction() {
		return !!(process.env.FUNCTION_NAME || process.env.FUNCTION_TARGET);
	}
	/**
	* This check only verifies that the environment is running knative.
	* This must be run *after* checking for Kubernetes, otherwise it will
	* return a false positive.
	*/
	function isCloudRun() {
		return !!process.env.K_CONFIGURATION;
	}
	function isCloudRunJob() {
		return !!process.env.CLOUD_RUN_JOB;
	}
	async function isKubernetesEngine() {
		try {
			await gcpMetadata.instance("attributes/cluster-name");
			return true;
		} catch (e) {
			return false;
		}
	}
	async function isComputeEngine() {
		return gcpMetadata.isAvailable();
	}
}));
//#endregion
//#region node_modules/jws/lib/data-stream.js
var require_data_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var Stream$2 = __require("stream");
	var util$3 = __require("util");
	function DataStream(data) {
		this.buffer = null;
		this.writable = true;
		this.readable = true;
		if (!data) {
			this.buffer = Buffer.alloc(0);
			return this;
		}
		if (typeof data.pipe === "function") {
			this.buffer = Buffer.alloc(0);
			data.pipe(this);
			return this;
		}
		if (data.length || typeof data === "object") {
			this.buffer = data;
			this.writable = false;
			process.nextTick(function() {
				this.emit("end", data);
				this.readable = false;
				this.emit("close");
			}.bind(this));
			return this;
		}
		throw new TypeError("Unexpected data type (" + typeof data + ")");
	}
	util$3.inherits(DataStream, Stream$2);
	DataStream.prototype.write = function write(data) {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(data)]);
		this.emit("data", data);
	};
	DataStream.prototype.end = function end(data) {
		if (data) this.write(data);
		this.emit("end", data);
		this.emit("close");
		this.writable = false;
		this.readable = false;
	};
	module.exports = DataStream;
}));
//#endregion
//#region node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer$2 = __require("buffer").Buffer;
	var SlowBuffer = __require("buffer").SlowBuffer;
	module.exports = bufferEq;
	function bufferEq(a, b) {
		if (!Buffer$2.isBuffer(a) || !Buffer$2.isBuffer(b)) return false;
		if (a.length !== b.length) return false;
		var c = 0;
		for (var i = 0; i < a.length; i++) c |= a[i] ^ b[i];
		return c === 0;
	}
	bufferEq.install = function() {
		Buffer$2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
			return bufferEq(this, that);
		};
	};
	var origBufEqual = Buffer$2.prototype.equal;
	var origSlowBufEqual = SlowBuffer.prototype.equal;
	bufferEq.restore = function() {
		Buffer$2.prototype.equal = origBufEqual;
		SlowBuffer.prototype.equal = origSlowBufEqual;
	};
}));
//#endregion
//#region node_modules/jwa/index.js
var require_jwa = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var crypto$2 = __require("crypto");
	var formatEcdsa = require_ecdsa_sig_formatter();
	var util$2 = __require("util");
	var MSG_INVALID_ALGORITHM = "\"%s\" is not a valid algorithm.\n  Supported algorithms are:\n  \"HS256\", \"HS384\", \"HS512\", \"RS256\", \"RS384\", \"RS512\", \"PS256\", \"PS384\", \"PS512\", \"ES256\", \"ES384\", \"ES512\" and \"none\".";
	var MSG_INVALID_SECRET = "secret must be a string or buffer";
	var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
	var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
	var supportsKeyObjects = typeof crypto$2.createPublicKey === "function";
	if (supportsKeyObjects) {
		MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
		MSG_INVALID_SECRET += "or a KeyObject";
	}
	function checkIsPublicKey(key) {
		if (Buffer.isBuffer(key)) return;
		if (typeof key === "string") return;
		if (!supportsKeyObjects) throw typeError(MSG_INVALID_VERIFIER_KEY);
		if (typeof key !== "object") throw typeError(MSG_INVALID_VERIFIER_KEY);
		if (typeof key.type !== "string") throw typeError(MSG_INVALID_VERIFIER_KEY);
		if (typeof key.asymmetricKeyType !== "string") throw typeError(MSG_INVALID_VERIFIER_KEY);
		if (typeof key.export !== "function") throw typeError(MSG_INVALID_VERIFIER_KEY);
	}
	function checkIsPrivateKey(key) {
		if (Buffer.isBuffer(key)) return;
		if (typeof key === "string") return;
		if (typeof key === "object") return;
		throw typeError(MSG_INVALID_SIGNER_KEY);
	}
	function checkIsSecretKey(key) {
		if (Buffer.isBuffer(key)) return;
		if (typeof key === "string") return key;
		if (!supportsKeyObjects) throw typeError(MSG_INVALID_SECRET);
		if (typeof key !== "object") throw typeError(MSG_INVALID_SECRET);
		if (key.type !== "secret") throw typeError(MSG_INVALID_SECRET);
		if (typeof key.export !== "function") throw typeError(MSG_INVALID_SECRET);
	}
	function fromBase64(base64) {
		return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}
	function toBase64(base64url) {
		base64url = base64url.toString();
		var padding = 4 - base64url.length % 4;
		if (padding !== 4) for (var i = 0; i < padding; ++i) base64url += "=";
		return base64url.replace(/\-/g, "+").replace(/_/g, "/");
	}
	function typeError(template) {
		var args = [].slice.call(arguments, 1);
		var errMsg = util$2.format.bind(util$2, template).apply(null, args);
		return new TypeError(errMsg);
	}
	function bufferOrString(obj) {
		return Buffer.isBuffer(obj) || typeof obj === "string";
	}
	function normalizeInput(thing) {
		if (!bufferOrString(thing)) thing = JSON.stringify(thing);
		return thing;
	}
	function createHmacSigner(bits) {
		return function sign(thing, secret) {
			checkIsSecretKey(secret);
			thing = normalizeInput(thing);
			var hmac = crypto$2.createHmac("sha" + bits, secret);
			return fromBase64((hmac.update(thing), hmac.digest("base64")));
		};
	}
	var bufferEqual;
	var timingSafeEqual = "timingSafeEqual" in crypto$2 ? function timingSafeEqual(a, b) {
		if (a.byteLength !== b.byteLength) return false;
		return crypto$2.timingSafeEqual(a, b);
	} : function timingSafeEqual(a, b) {
		if (!bufferEqual) bufferEqual = require_buffer_equal_constant_time();
		return bufferEqual(a, b);
	};
	function createHmacVerifier(bits) {
		return function verify(thing, signature, secret) {
			var computedSig = createHmacSigner(bits)(thing, secret);
			return timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig));
		};
	}
	function createKeySigner(bits) {
		return function sign(thing, privateKey) {
			checkIsPrivateKey(privateKey);
			thing = normalizeInput(thing);
			var signer = crypto$2.createSign("RSA-SHA" + bits);
			return fromBase64((signer.update(thing), signer.sign(privateKey, "base64")));
		};
	}
	function createKeyVerifier(bits) {
		return function verify(thing, signature, publicKey) {
			checkIsPublicKey(publicKey);
			thing = normalizeInput(thing);
			signature = toBase64(signature);
			var verifier = crypto$2.createVerify("RSA-SHA" + bits);
			verifier.update(thing);
			return verifier.verify(publicKey, signature, "base64");
		};
	}
	function createPSSKeySigner(bits) {
		return function sign(thing, privateKey) {
			checkIsPrivateKey(privateKey);
			thing = normalizeInput(thing);
			var signer = crypto$2.createSign("RSA-SHA" + bits);
			return fromBase64((signer.update(thing), signer.sign({
				key: privateKey,
				padding: crypto$2.constants.RSA_PKCS1_PSS_PADDING,
				saltLength: crypto$2.constants.RSA_PSS_SALTLEN_DIGEST
			}, "base64")));
		};
	}
	function createPSSKeyVerifier(bits) {
		return function verify(thing, signature, publicKey) {
			checkIsPublicKey(publicKey);
			thing = normalizeInput(thing);
			signature = toBase64(signature);
			var verifier = crypto$2.createVerify("RSA-SHA" + bits);
			verifier.update(thing);
			return verifier.verify({
				key: publicKey,
				padding: crypto$2.constants.RSA_PKCS1_PSS_PADDING,
				saltLength: crypto$2.constants.RSA_PSS_SALTLEN_DIGEST
			}, signature, "base64");
		};
	}
	function createECDSASigner(bits) {
		var inner = createKeySigner(bits);
		return function sign() {
			var signature = inner.apply(null, arguments);
			signature = formatEcdsa.derToJose(signature, "ES" + bits);
			return signature;
		};
	}
	function createECDSAVerifer(bits) {
		var inner = createKeyVerifier(bits);
		return function verify(thing, signature, publicKey) {
			signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
			return inner(thing, signature, publicKey);
		};
	}
	function createNoneSigner() {
		return function sign() {
			return "";
		};
	}
	function createNoneVerifier() {
		return function verify(thing, signature) {
			return signature === "";
		};
	}
	module.exports = function jwa(algorithm) {
		var signerFactories = {
			hs: createHmacSigner,
			rs: createKeySigner,
			ps: createPSSKeySigner,
			es: createECDSASigner,
			none: createNoneSigner
		};
		var verifierFactories = {
			hs: createHmacVerifier,
			rs: createKeyVerifier,
			ps: createPSSKeyVerifier,
			es: createECDSAVerifer,
			none: createNoneVerifier
		};
		var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
		if (!match) throw typeError(MSG_INVALID_ALGORITHM, algorithm);
		var algo = (match[1] || match[3]).toLowerCase();
		var bits = match[2];
		return {
			sign: signerFactories[algo](bits),
			verify: verifierFactories[algo](bits)
		};
	};
}));
//#endregion
//#region node_modules/jws/lib/tostring.js
var require_tostring = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer$1 = __require("buffer").Buffer;
	module.exports = function toString(obj) {
		if (typeof obj === "string") return obj;
		if (typeof obj === "number" || Buffer$1.isBuffer(obj)) return obj.toString();
		return JSON.stringify(obj);
	};
}));
//#endregion
//#region node_modules/jws/lib/sign-stream.js
var require_sign_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var DataStream = require_data_stream();
	var jwa = require_jwa();
	var Stream$1 = __require("stream");
	var toString = require_tostring();
	var util$1 = __require("util");
	function base64url(string, encoding) {
		return Buffer.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}
	function jwsSecuredInput(header, payload, encoding) {
		encoding = encoding || "utf8";
		var encodedHeader = base64url(toString(header), "binary");
		var encodedPayload = base64url(toString(payload), encoding);
		return util$1.format("%s.%s", encodedHeader, encodedPayload);
	}
	function jwsSign(opts) {
		var header = opts.header;
		var payload = opts.payload;
		var secretOrKey = opts.secret || opts.privateKey;
		var encoding = opts.encoding;
		var algo = jwa(header.alg);
		var securedInput = jwsSecuredInput(header, payload, encoding);
		var signature = algo.sign(securedInput, secretOrKey);
		return util$1.format("%s.%s", securedInput, signature);
	}
	function SignStream(opts) {
		var secret = opts.secret;
		secret = secret == null ? opts.privateKey : secret;
		secret = secret == null ? opts.key : secret;
		if (/^hs/i.test(opts.header.alg) === true && secret == null) throw new TypeError("secret must be a string or buffer or a KeyObject");
		var secretStream = new DataStream(secret);
		this.readable = true;
		this.header = opts.header;
		this.encoding = opts.encoding;
		this.secret = this.privateKey = this.key = secretStream;
		this.payload = new DataStream(opts.payload);
		this.secret.once("close", function() {
			if (!this.payload.writable && this.readable) this.sign();
		}.bind(this));
		this.payload.once("close", function() {
			if (!this.secret.writable && this.readable) this.sign();
		}.bind(this));
	}
	util$1.inherits(SignStream, Stream$1);
	SignStream.prototype.sign = function sign() {
		try {
			var signature = jwsSign({
				header: this.header,
				payload: this.payload.buffer,
				secret: this.secret.buffer,
				encoding: this.encoding
			});
			this.emit("done", signature);
			this.emit("data", signature);
			this.emit("end");
			this.readable = false;
			return signature;
		} catch (e) {
			this.readable = false;
			this.emit("error", e);
			this.emit("close");
		}
	};
	SignStream.sign = jwsSign;
	module.exports = SignStream;
}));
//#endregion
//#region node_modules/jws/lib/verify-stream.js
var require_verify_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var DataStream = require_data_stream();
	var jwa = require_jwa();
	var Stream = __require("stream");
	var toString = require_tostring();
	var util = __require("util");
	var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
	function isObject(thing) {
		return Object.prototype.toString.call(thing) === "[object Object]";
	}
	function safeJsonParse(thing) {
		if (isObject(thing)) return thing;
		try {
			return JSON.parse(thing);
		} catch (e) {
			return;
		}
	}
	function headerFromJWS(jwsSig) {
		var encodedHeader = jwsSig.split(".", 1)[0];
		return safeJsonParse(Buffer.from(encodedHeader, "base64").toString("binary"));
	}
	function securedInputFromJWS(jwsSig) {
		return jwsSig.split(".", 2).join(".");
	}
	function signatureFromJWS(jwsSig) {
		return jwsSig.split(".")[2];
	}
	function payloadFromJWS(jwsSig, encoding) {
		encoding = encoding || "utf8";
		var payload = jwsSig.split(".")[1];
		return Buffer.from(payload, "base64").toString(encoding);
	}
	function isValidJws(string) {
		return JWS_REGEX.test(string) && !!headerFromJWS(string);
	}
	function jwsVerify(jwsSig, algorithm, secretOrKey) {
		if (!algorithm) {
			var err = /* @__PURE__ */ new Error("Missing algorithm parameter for jws.verify");
			err.code = "MISSING_ALGORITHM";
			throw err;
		}
		jwsSig = toString(jwsSig);
		var signature = signatureFromJWS(jwsSig);
		var securedInput = securedInputFromJWS(jwsSig);
		return jwa(algorithm).verify(securedInput, signature, secretOrKey);
	}
	function jwsDecode(jwsSig, opts) {
		opts = opts || {};
		jwsSig = toString(jwsSig);
		if (!isValidJws(jwsSig)) return null;
		var header = headerFromJWS(jwsSig);
		if (!header) return null;
		var payload = payloadFromJWS(jwsSig);
		if (header.typ === "JWT" || opts.json) payload = JSON.parse(payload, opts.encoding);
		return {
			header,
			payload,
			signature: signatureFromJWS(jwsSig)
		};
	}
	function VerifyStream(opts) {
		opts = opts || {};
		var secretOrKey = opts.secret;
		secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
		secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
		if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) throw new TypeError("secret must be a string or buffer or a KeyObject");
		var secretStream = new DataStream(secretOrKey);
		this.readable = true;
		this.algorithm = opts.algorithm;
		this.encoding = opts.encoding;
		this.secret = this.publicKey = this.key = secretStream;
		this.signature = new DataStream(opts.signature);
		this.secret.once("close", function() {
			if (!this.signature.writable && this.readable) this.verify();
		}.bind(this));
		this.signature.once("close", function() {
			if (!this.secret.writable && this.readable) this.verify();
		}.bind(this));
	}
	util.inherits(VerifyStream, Stream);
	VerifyStream.prototype.verify = function verify() {
		try {
			var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
			var obj = jwsDecode(this.signature.buffer, this.encoding);
			this.emit("done", valid, obj);
			this.emit("data", valid);
			this.emit("end");
			this.readable = false;
			return valid;
		} catch (e) {
			this.readable = false;
			this.emit("error", e);
			this.emit("close");
		}
	};
	VerifyStream.decode = jwsDecode;
	VerifyStream.isValid = isValidJws;
	VerifyStream.verify = jwsVerify;
	module.exports = VerifyStream;
}));
//#endregion
//#region node_modules/jws/index.js
var require_jws = /* @__PURE__ */ __commonJSMin(((exports) => {
	var SignStream = require_sign_stream();
	var VerifyStream = require_verify_stream();
	exports.ALGORITHMS = [
		"HS256",
		"HS384",
		"HS512",
		"RS256",
		"RS384",
		"RS512",
		"PS256",
		"PS384",
		"PS512",
		"ES256",
		"ES384",
		"ES512"
	];
	exports.sign = SignStream.sign;
	exports.verify = VerifyStream.verify;
	exports.decode = VerifyStream.decode;
	exports.isValid = VerifyStream.isValid;
	exports.createSign = function createSign(opts) {
		return new SignStream(opts);
	};
	exports.createVerify = function createVerify(opts) {
		return new VerifyStream(opts);
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/jwsSign.js
var require_jwsSign = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.buildPayloadForJwsSign = buildPayloadForJwsSign;
	exports.getJwsSign = getJwsSign;
	var jws_1 = require_jws();
	/** The default algorithm for signing JWTs. */
	var ALG_RS256 = "RS256";
	/** The URL for Google's OAuth 2.0 token endpoint. */
	var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
	/**
	* Builds the JWT payload for signing.
	* @param tokenOptions The options for the token.
	* @returns The JWT payload.
	*/
	function buildPayloadForJwsSign(tokenOptions) {
		const iat = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
		return {
			iss: tokenOptions.iss,
			scope: tokenOptions.scope,
			aud: GOOGLE_TOKEN_URL,
			exp: iat + 3600,
			iat,
			sub: tokenOptions.sub,
			...tokenOptions.additionalClaims
		};
	}
	/**
	* Creates a signed JWS (JSON Web Signature).
	* @param tokenOptions The options for the token.
	* @returns The signed JWS.
	*/
	function getJwsSign(tokenOptions) {
		const payload = buildPayloadForJwsSign(tokenOptions);
		return (0, jws_1.sign)({
			header: { alg: ALG_RS256 },
			payload,
			secret: tokenOptions.key
		});
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/getToken.js
var require_getToken = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getToken = getToken;
	var jwsSign_1 = require_jwsSign();
	/** The URL for Google's OAuth 2.0 token endpoint. */
	var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
	/** The grant type for JWT-based authorization. */
	var GOOGLE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";
	/**
	* Generates the request options for fetching a token.
	* @param tokenOptions The options for the token.
	* @returns The Gaxios options for the request.
	*/
	var generateRequestOptions = (tokenOptions) => {
		return {
			method: "POST",
			url: GOOGLE_TOKEN_URL,
			data: new URLSearchParams({
				grant_type: GOOGLE_GRANT_TYPE,
				assertion: (0, jwsSign_1.getJwsSign)(tokenOptions)
			}),
			responseType: "json",
			retryConfig: { httpMethodsToRetry: ["POST"] }
		};
	};
	/**
	* Fetches an access token.
	* @param tokenOptions The options for the token.
	* @returns A promise that resolves with the token data.
	*/
	async function getToken(tokenOptions) {
		if (!tokenOptions.transporter) throw new Error("No transporter set.");
		try {
			const gaxiosOptions = generateRequestOptions(tokenOptions);
			return (await tokenOptions.transporter.request(gaxiosOptions)).data;
		} catch (e) {
			const err = e;
			const errorData = err.response?.data;
			if (errorData?.error) err.message = `${errorData.error}: ${errorData.error_description}`;
			throw err;
		}
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/errorWithCode.js
var require_errorWithCode = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ErrorWithCode = void 0;
	var ErrorWithCode = class extends Error {
		code;
		constructor(message, code) {
			super(message);
			this.code = code;
		}
	};
	exports.ErrorWithCode = ErrorWithCode;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/getCredentials.js
var require_getCredentials = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getCredentials = getCredentials;
	var path$1 = __require("path");
	var fs$5 = __require("fs");
	var util_1$1 = __require("util");
	var errorWithCode_1 = require_errorWithCode();
	var readFile = fs$5.readFile ? (0, util_1$1.promisify)(fs$5.readFile) : async () => {
		throw new errorWithCode_1.ErrorWithCode("use key rather than keyFile.", "MISSING_CREDENTIALS");
	};
	var ExtensionFiles;
	(function(ExtensionFiles) {
		ExtensionFiles["JSON"] = ".json";
		ExtensionFiles["DER"] = ".der";
		ExtensionFiles["CRT"] = ".crt";
		ExtensionFiles["PEM"] = ".pem";
		ExtensionFiles["P12"] = ".p12";
		ExtensionFiles["PFX"] = ".pfx";
	})(ExtensionFiles || (ExtensionFiles = {}));
	/**
	* Provides credentials from a JSON key file.
	*/
	var JsonCredentialsProvider = class {
		keyFilePath;
		constructor(keyFilePath) {
			this.keyFilePath = keyFilePath;
		}
		/**
		* Reads a JSON key file and extracts the private key and client email.
		* @returns A promise that resolves with the credentials.
		*/
		async getCredentials() {
			const key = await readFile(this.keyFilePath, "utf8");
			let body;
			try {
				body = JSON.parse(key);
			} catch (error) {
				throw new Error(`Invalid JSON key file: ${error.message}`);
			}
			const privateKey = body.private_key;
			const clientEmail = body.client_email;
			if (!privateKey || !clientEmail) throw new errorWithCode_1.ErrorWithCode("private_key and client_email are required.", "MISSING_CREDENTIALS");
			return {
				privateKey,
				clientEmail
			};
		}
	};
	/**
	* Provides credentials from a PEM-like key file.
	*/
	var PemCredentialsProvider = class {
		keyFilePath;
		constructor(keyFilePath) {
			this.keyFilePath = keyFilePath;
		}
		/**
		* Reads a PEM-like key file.
		* @returns A promise that resolves with the private key.
		*/
		async getCredentials() {
			return { privateKey: await readFile(this.keyFilePath, "utf8") };
		}
	};
	/**
	* Handles unsupported P12/PFX certificate types.
	*/
	var P12CredentialsProvider = class {
		/**
		* Throws an error as P12/PFX certificates are not supported.
		* @returns A promise that rejects with an error.
		*/
		async getCredentials() {
			throw new errorWithCode_1.ErrorWithCode("*.p12 certificates are not supported after v6.1.2. Consider utilizing *.json format or converting *.p12 to *.pem using the OpenSSL CLI.", "UNKNOWN_CERTIFICATE_TYPE");
		}
	};
	/**
	* Factory class to create the appropriate credentials provider.
	*/
	var CredentialsProviderFactory = class {
		/**
		* Creates a credential provider based on the key file extension.
		* @param keyFilePath The path to the key file.
		* @returns An instance of a class that implements ICredentialsProvider.
		*/
		static create(keyFilePath) {
			switch (path$1.extname(keyFilePath)) {
				case ExtensionFiles.JSON: return new JsonCredentialsProvider(keyFilePath);
				case ExtensionFiles.DER:
				case ExtensionFiles.CRT:
				case ExtensionFiles.PEM: return new PemCredentialsProvider(keyFilePath);
				case ExtensionFiles.P12:
				case ExtensionFiles.PFX: return new P12CredentialsProvider();
				default: throw new errorWithCode_1.ErrorWithCode("Unknown certificate type. Type is determined based on file extension. Current supported extensions are *.json, and *.pem.", "UNKNOWN_CERTIFICATE_TYPE");
			}
		}
	};
	/**
	* Given a keyFile, extract the key and client email if available
	* @param keyFile Path to a json, pem, or p12 file that contains the key.
	* @returns an object with privateKey and clientEmail properties
	*/
	async function getCredentials(keyFilePath) {
		return CredentialsProviderFactory.create(keyFilePath).getCredentials();
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/tokenHandler.js
var require_tokenHandler = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TokenHandler = void 0;
	var getToken_1 = require_getToken();
	var getCredentials_1 = require_getCredentials();
	/**
	* Manages the fetching and caching of access tokens.
	*/
	var TokenHandler = class {
		/** The cached access token. */
		token;
		/** The expiration time of the cached access token. */
		tokenExpiresAt;
		/** A promise for an in-flight token request. */
		inFlightRequest;
		tokenOptions;
		/**
		* Creates an instance of TokenHandler.
		* @param tokenOptions The options for fetching tokens.
		* @param transporter The transporter to use for making requests.
		*/
		constructor(tokenOptions) {
			this.tokenOptions = tokenOptions;
		}
		/**
		* Processes the credentials, loading them from a key file if necessary.
		* This method is called before any token request.
		*/
		async processCredentials() {
			if (!this.tokenOptions.key && !this.tokenOptions.keyFile) throw new Error("No key or keyFile set.");
			if (!this.tokenOptions.key && this.tokenOptions.keyFile) {
				const credentials = await (0, getCredentials_1.getCredentials)(this.tokenOptions.keyFile);
				this.tokenOptions.key = credentials.privateKey;
				this.tokenOptions.email = credentials.clientEmail;
			}
		}
		/**
		* Checks if the cached token is expired or close to expiring.
		* @returns True if the token is expiring, false otherwise.
		*/
		isTokenExpiring() {
			if (!this.token || !this.tokenExpiresAt) return true;
			const now = (/* @__PURE__ */ new Date()).getTime();
			const eagerRefreshThresholdMillis = this.tokenOptions.eagerRefreshThresholdMillis ?? 0;
			return this.tokenExpiresAt <= now + eagerRefreshThresholdMillis;
		}
		/**
		* Returns whether the token has completely expired.
		*
		* @returns true if the token has expired, false otherwise.
		*/
		hasExpired() {
			(/* @__PURE__ */ new Date()).getTime();
			if (this.token && this.tokenExpiresAt) return (/* @__PURE__ */ new Date()).getTime() >= this.tokenExpiresAt;
			return true;
		}
		/**
		* Fetches an access token, using a cached one if available and not expired.
		* @param forceRefresh If true, forces a new token to be fetched.
		* @returns A promise that resolves with the token data.
		*/
		async getToken(forceRefresh) {
			await this.processCredentials();
			if (this.inFlightRequest && !forceRefresh) return this.inFlightRequest;
			if (this.token && !this.isTokenExpiring() && !forceRefresh) return this.token;
			try {
				this.inFlightRequest = (0, getToken_1.getToken)(this.tokenOptions);
				const token = await this.inFlightRequest;
				this.token = token;
				this.tokenExpiresAt = (/* @__PURE__ */ new Date()).getTime() + (token.expires_in ?? 0) * 1e3;
				return token;
			} finally {
				this.inFlightRequest = void 0;
			}
		}
	};
	exports.TokenHandler = TokenHandler;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/revokeToken.js
var require_revokeToken = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.revokeToken = revokeToken;
	/** The URL for Google's OAuth 2.0 token revocation endpoint. */
	var GOOGLE_REVOKE_TOKEN_URL = "https://oauth2.googleapis.com/revoke?token=";
	/** The default retry behavior for the revoke token request. */
	var DEFAULT_RETRY_VALUE = true;
	/**
	* Revokes a given access token.
	* @param accessToken The access token to revoke.
	* @param transporter The transporter to make the request with.
	* @returns A promise that resolves with the revocation response.
	*/
	async function revokeToken(accessToken, transporter) {
		const url = GOOGLE_REVOKE_TOKEN_URL + accessToken;
		return await transporter.request({
			url,
			retry: DEFAULT_RETRY_VALUE
		});
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/gtoken/googleToken.js
var require_googleToken = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GoogleToken = void 0;
	var gaxios_1 = require_src$3();
	var tokenHandler_1 = require_tokenHandler();
	var revokeToken_1 = require_revokeToken();
	/**
	* The GoogleToken class is used to manage authentication with Google's OAuth 2.0 authorization server.
	* It handles fetching, caching, and refreshing of access tokens.
	*/
	var GoogleToken = class {
		/** The configuration options for this token instance. */
		tokenOptions;
		/** The handler for token fetching and caching logic. */
		tokenHandler;
		/**
		* Create a GoogleToken.
		*
		* @param options  Configuration object.
		*/
		constructor(options) {
			this.tokenOptions = options || {};
			this.tokenOptions.transporter = this.tokenOptions.transporter || { request: (opts) => (0, gaxios_1.request)(opts) };
			if (!this.tokenOptions.iss) this.tokenOptions.iss = this.tokenOptions.email;
			if (typeof this.tokenOptions.scope === "object") this.tokenOptions.scope = this.tokenOptions.scope.join(" ");
			this.tokenHandler = new tokenHandler_1.TokenHandler(this.tokenOptions);
		}
		get expiresAt() {
			return this.tokenHandler.tokenExpiresAt;
		}
		/**
		* The most recent access token obtained by this client.
		*/
		get accessToken() {
			return this.tokenHandler.token?.access_token;
		}
		/**
		* The most recent ID token obtained by this client.
		*/
		get idToken() {
			return this.tokenHandler.token?.id_token;
		}
		/**
		* The token type of the most recent access token.
		*/
		get tokenType() {
			return this.tokenHandler.token?.token_type;
		}
		/**
		* The refresh token for the current credentials.
		*/
		get refreshToken() {
			return this.tokenHandler.token?.refresh_token;
		}
		/**
		* A boolean indicating if the current token has expired.
		*/
		hasExpired() {
			return this.tokenHandler.hasExpired();
		}
		/**
		* A boolean indicating if the current token is expiring soon,
		* based on the `eagerRefreshThresholdMillis` option.
		*/
		isTokenExpiring() {
			return this.tokenHandler.isTokenExpiring();
		}
		getToken(callbackOrOptions, opts = { forceRefresh: false }) {
			let callback;
			if (typeof callbackOrOptions === "function") callback = callbackOrOptions;
			else if (typeof callbackOrOptions === "object") opts = callbackOrOptions;
			const promise = this.tokenHandler.getToken(opts.forceRefresh ?? false);
			if (callback) promise.then((token) => callback(null, token), callback);
			return promise;
		}
		revokeToken(callback) {
			if (!this.accessToken) return Promise.reject(/* @__PURE__ */ new Error("No token to revoke."));
			const promise = (0, revokeToken_1.revokeToken)(this.accessToken, this.tokenOptions.transporter);
			if (callback) promise.then(() => callback(), callback);
			this.tokenHandler = new tokenHandler_1.TokenHandler(this.tokenOptions);
		}
		/**
		* Returns the configuration options for this token instance.
		*/
		get googleTokenOptions() {
			return this.tokenOptions;
		}
	};
	exports.GoogleToken = GoogleToken;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/jwtaccess.js
var require_jwtaccess = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JWTAccess = void 0;
	var jws = require_jws();
	var util_1 = require_util();
	var DEFAULT_HEADER = {
		alg: "RS256",
		typ: "JWT"
	};
	exports.JWTAccess = class JWTAccess {
		email;
		key;
		keyId;
		projectId;
		eagerRefreshThresholdMillis;
		cache = new util_1.LRUCache({
			capacity: 500,
			maxAge: 3600 * 1e3
		});
		/**
		* JWTAccess service account credentials.
		*
		* Create a new access token by using the credential to create a new JWT token
		* that's recognized as the access token.
		*
		* @param email the service account email address.
		* @param key the private key that will be used to sign the token.
		* @param keyId the ID of the private key used to sign the token.
		*/
		constructor(email, key, keyId, eagerRefreshThresholdMillis) {
			this.email = email;
			this.key = key;
			this.keyId = keyId;
			this.eagerRefreshThresholdMillis = eagerRefreshThresholdMillis ?? 300 * 1e3;
		}
		/**
		* Ensures that we're caching a key appropriately, giving precedence to scopes vs. url
		*
		* @param url The URI being authorized.
		* @param scopes The scope or scopes being authorized
		* @returns A string that returns the cached key.
		*/
		getCachedKey(url, scopes) {
			let cacheKey = url;
			if (scopes && Array.isArray(scopes) && scopes.length) cacheKey = url ? `${url}_${scopes.join("_")}` : `${scopes.join("_")}`;
			else if (typeof scopes === "string") cacheKey = url ? `${url}_${scopes}` : scopes;
			if (!cacheKey) throw Error("Scopes or url must be provided");
			return cacheKey;
		}
		/**
		* Get a non-expired access token, after refreshing if necessary.
		*
		* @param url The URI being authorized.
		* @param additionalClaims An object with a set of additional claims to
		* include in the payload.
		* @returns An object that includes the authorization header.
		*/
		getRequestHeaders(url, additionalClaims, scopes) {
			const key = this.getCachedKey(url, scopes);
			const cachedToken = this.cache.get(key);
			const now = Date.now();
			if (cachedToken && cachedToken.expiration - now > this.eagerRefreshThresholdMillis) return new Headers(cachedToken.headers);
			const iat = Math.floor(Date.now() / 1e3);
			const exp = JWTAccess.getExpirationTime(iat);
			let defaultClaims;
			if (Array.isArray(scopes)) scopes = scopes.join(" ");
			if (scopes) defaultClaims = {
				iss: this.email,
				sub: this.email,
				scope: scopes,
				exp,
				iat
			};
			else defaultClaims = {
				iss: this.email,
				sub: this.email,
				aud: url,
				exp,
				iat
			};
			if (additionalClaims) {
				for (const claim in defaultClaims) if (additionalClaims[claim]) throw new Error(`The '${claim}' property is not allowed when passing additionalClaims. This claim is included in the JWT by default.`);
			}
			const header = this.keyId ? {
				...DEFAULT_HEADER,
				kid: this.keyId
			} : DEFAULT_HEADER;
			const payload = Object.assign(defaultClaims, additionalClaims);
			const signedJWT = jws.sign({
				header,
				payload,
				secret: this.key
			});
			const headers = new Headers({ authorization: `Bearer ${signedJWT}` });
			this.cache.set(key, {
				expiration: exp * 1e3,
				headers
			});
			return headers;
		}
		/**
		* Returns an expiration time for the JWT token.
		*
		* @param iat The issued at time for the JWT.
		* @returns An expiration time for the JWT.
		*/
		static getExpirationTime(iat) {
			return iat + 3600;
		}
		/**
		* Create a JWTAccess credentials instance using the given input options.
		* @param json The input object.
		*/
		fromJSON(json) {
			if (!json) throw new Error("Must pass in a JSON object containing the service account auth settings.");
			if (!json.client_email) throw new Error("The incoming JSON object does not contain a client_email field");
			if (!json.private_key) throw new Error("The incoming JSON object does not contain a private_key field");
			this.email = json.client_email;
			this.key = json.private_key;
			this.keyId = json.private_key_id;
			this.projectId = json.project_id;
		}
		fromStream(inputStream, callback) {
			if (callback) this.fromStreamAsync(inputStream).then(() => callback(), callback);
			else return this.fromStreamAsync(inputStream);
		}
		fromStreamAsync(inputStream) {
			return new Promise((resolve, reject) => {
				if (!inputStream) reject(/* @__PURE__ */ new Error("Must pass in a stream containing the service account auth settings."));
				let s = "";
				inputStream.setEncoding("utf8").on("data", (chunk) => s += chunk).on("error", reject).on("end", () => {
					try {
						const data = JSON.parse(s);
						this.fromJSON(data);
						resolve();
					} catch (err) {
						reject(err);
					}
				});
			});
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/jwtclient.js
var require_jwtclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JWT = void 0;
	var googleToken_1 = require_googleToken();
	var getCredentials_1 = require_getCredentials();
	var jwtaccess_1 = require_jwtaccess();
	var oauth2client_1 = require_oauth2client();
	var authclient_1 = require_authclient();
	exports.JWT = class JWT extends oauth2client_1.OAuth2Client {
		email;
		keyFile;
		key;
		keyId;
		defaultScopes;
		scopes;
		scope;
		subject;
		gtoken;
		additionalClaims;
		useJWTAccessWithScope;
		defaultServicePath;
		access;
		/**
		* JWT service account credentials.
		*
		* Retrieve access token using gtoken.
		*
		* @param options the
		*/
		constructor(options = {}) {
			super(options);
			this.email = options.email;
			this.keyFile = options.keyFile;
			this.key = options.key;
			this.keyId = options.keyId;
			this.scopes = options.scopes;
			this.subject = options.subject;
			this.additionalClaims = options.additionalClaims;
			this.credentials = {
				refresh_token: "jwt-placeholder",
				expiry_date: 1
			};
		}
		/**
		* Creates a copy of the credential with the specified scopes.
		* @param scopes List of requested scopes or a single scope.
		* @return The cloned instance.
		*/
		createScoped(scopes) {
			const jwt = new JWT(this);
			jwt.scopes = scopes;
			return jwt;
		}
		/**
		* Obtains the metadata to be sent with the request.
		*
		* @param url the URI being authorized.
		*/
		async getRequestMetadataAsync(url) {
			url = this.defaultServicePath ? `https://${this.defaultServicePath}/` : url;
			const useSelfSignedJWT = !this.hasUserScopes() && url || this.useJWTAccessWithScope && this.hasAnyScopes() || this.universeDomain !== authclient_1.DEFAULT_UNIVERSE;
			if (this.subject && this.universeDomain !== authclient_1.DEFAULT_UNIVERSE) throw new RangeError(`Service Account user is configured for the credential. Domain-wide delegation is not supported in universes other than ${authclient_1.DEFAULT_UNIVERSE}`);
			if (!this.apiKey && useSelfSignedJWT) if (this.additionalClaims && this.additionalClaims.target_audience) {
				const { tokens } = await this.refreshToken();
				return { headers: this.addSharedMetadataHeaders(new Headers({ authorization: `Bearer ${tokens.id_token}` })) };
			} else {
				if (!this.access) this.access = new jwtaccess_1.JWTAccess(this.email, this.key, this.keyId, this.eagerRefreshThresholdMillis);
				let scopes;
				if (this.hasUserScopes()) scopes = this.scopes;
				else if (!url) scopes = this.defaultScopes;
				const useScopes = this.useJWTAccessWithScope || this.universeDomain !== authclient_1.DEFAULT_UNIVERSE;
				const headers = await this.access.getRequestHeaders(url ?? void 0, this.additionalClaims, useScopes ? scopes : void 0);
				return { headers: this.addSharedMetadataHeaders(headers) };
			}
			else if (this.hasAnyScopes() || this.apiKey) return super.getRequestMetadataAsync(url);
			else return { headers: new Headers() };
		}
		/**
		* Fetches an ID token.
		* @param targetAudience the audience for the fetched ID token.
		*/
		async fetchIdToken(targetAudience) {
			const gtoken = new googleToken_1.GoogleToken({
				iss: this.email,
				sub: this.subject,
				scope: this.scopes || this.defaultScopes,
				keyFile: this.keyFile,
				key: this.key,
				additionalClaims: { target_audience: targetAudience },
				transporter: this.transporter
			});
			await gtoken.getToken({ forceRefresh: true });
			if (!gtoken.idToken) throw new Error("Unknown error: Failed to fetch ID token");
			return gtoken.idToken;
		}
		/**
		* Determine if there are currently scopes available.
		*/
		hasUserScopes() {
			if (!this.scopes) return false;
			return this.scopes.length > 0;
		}
		/**
		* Are there any default or user scopes defined.
		*/
		hasAnyScopes() {
			if (this.scopes && this.scopes.length > 0) return true;
			if (this.defaultScopes && this.defaultScopes.length > 0) return true;
			return false;
		}
		authorize(callback) {
			if (callback) this.authorizeAsync().then((r) => callback(null, r), callback);
			else return this.authorizeAsync();
		}
		async authorizeAsync() {
			const result = await this.refreshToken();
			if (!result) throw new Error("No result returned");
			this.credentials = result.tokens;
			this.credentials.refresh_token = "jwt-placeholder";
			this.key = this.gtoken.googleTokenOptions?.key;
			this.email = this.gtoken.googleTokenOptions?.iss;
			return result.tokens;
		}
		/**
		* Refreshes the access token.
		* @param refreshToken ignored
		* @private
		*/
		async refreshTokenNoCache() {
			const gtoken = this.createGToken();
			const tokens = {
				access_token: (await gtoken.getToken({ forceRefresh: this.isTokenExpiring() })).access_token,
				token_type: "Bearer",
				expiry_date: gtoken.expiresAt,
				id_token: gtoken.idToken
			};
			this.emit("tokens", tokens);
			return {
				res: null,
				tokens
			};
		}
		/**
		* Create a gToken if it doesn't already exist.
		*/
		createGToken() {
			if (!this.gtoken) this.gtoken = new googleToken_1.GoogleToken({
				iss: this.email,
				sub: this.subject,
				scope: this.scopes || this.defaultScopes,
				keyFile: this.keyFile,
				key: this.key,
				additionalClaims: this.additionalClaims,
				transporter: this.transporter
			});
			return this.gtoken;
		}
		/**
		* Create a JWT credentials instance using the given input options.
		* @param json The input object.
		*
		* @remarks
		*
		* **Important**: If you accept a credential configuration (credential JSON/File/Stream) from an external source for authentication to Google Cloud, you must validate it before providing it to any Google API or library. Providing an unvalidated credential configuration to Google APIs can compromise the security of your systems and data. For more information, refer to {@link https://cloud.google.com/docs/authentication/external/externally-sourced-credentials Validate credential configurations from external sources}.
		*/
		fromJSON(json) {
			if (!json) throw new Error("Must pass in a JSON object containing the service account auth settings.");
			if (!json.client_email) throw new Error("The incoming JSON object does not contain a client_email field");
			if (!json.private_key) throw new Error("The incoming JSON object does not contain a private_key field");
			this.email = json.client_email;
			this.key = json.private_key;
			this.keyId = json.private_key_id;
			this.projectId = json.project_id;
			this.quotaProjectId = json.quota_project_id;
			this.universeDomain = json.universe_domain || this.universeDomain;
		}
		fromStream(inputStream, callback) {
			if (callback) this.fromStreamAsync(inputStream).then(() => callback(), callback);
			else return this.fromStreamAsync(inputStream);
		}
		fromStreamAsync(inputStream) {
			return new Promise((resolve, reject) => {
				if (!inputStream) throw new Error("Must pass in a stream containing the service account auth settings.");
				let s = "";
				inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => s += chunk).on("end", () => {
					try {
						const data = JSON.parse(s);
						this.fromJSON(data);
						resolve();
					} catch (e) {
						reject(e);
					}
				});
			});
		}
		/**
		* Creates a JWT credentials instance using an API Key for authentication.
		* @param apiKey The API Key in string form.
		*/
		fromAPIKey(apiKey) {
			if (typeof apiKey !== "string") throw new Error("Must provide an API Key string.");
			this.apiKey = apiKey;
		}
		/**
		* Using the key or keyFile on the JWT client, obtain an object that contains
		* the key and the client email.
		*/
		async getCredentials() {
			if (this.key) return {
				private_key: this.key,
				client_email: this.email
			};
			else if (this.keyFile) {
				this.createGToken();
				const creds = await (0, getCredentials_1.getCredentials)(this.keyFile);
				return {
					private_key: creds.privateKey,
					client_email: creds.clientEmail
				};
			}
			throw new Error("A key or a keyFile must be provided to getCredentials.");
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/refreshclient.js
var require_refreshclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.UserRefreshClient = exports.USER_REFRESH_ACCOUNT_TYPE = void 0;
	var oauth2client_1 = require_oauth2client();
	var authclient_1 = require_authclient();
	exports.USER_REFRESH_ACCOUNT_TYPE = "authorized_user";
	exports.UserRefreshClient = class UserRefreshClient extends oauth2client_1.OAuth2Client {
		_refreshToken;
		/**
		* The User Refresh Token client.
		*
		* @param optionsOrClientId The User Refresh Token client options. Passing an `clientId` directly is **@DEPRECATED**.
		* @param clientSecret **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
		* @param refreshToken **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
		* @param eagerRefreshThresholdMillis **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
		* @param forceRefreshOnFailure **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
		*/
		constructor(optionsOrClientId, clientSecret, refreshToken, eagerRefreshThresholdMillis, forceRefreshOnFailure) {
			const opts = optionsOrClientId && typeof optionsOrClientId === "object" ? optionsOrClientId : {
				clientId: optionsOrClientId,
				clientSecret,
				refreshToken,
				eagerRefreshThresholdMillis,
				forceRefreshOnFailure
			};
			super(opts);
			this._refreshToken = opts.refreshToken;
			this.credentials.refresh_token = opts.refreshToken;
		}
		/**
		* Refreshes the access token.
		* @param refreshToken An ignored refreshToken..
		* @param callback Optional callback.
		*/
		async refreshTokenNoCache() {
			return super.refreshTokenNoCache(this._refreshToken);
		}
		async fetchIdToken(targetAudience) {
			const opts = {
				...UserRefreshClient.RETRY_CONFIG,
				url: this.endpoints.oauth2TokenUrl,
				method: "POST",
				data: new URLSearchParams({
					client_id: this._clientId,
					client_secret: this._clientSecret,
					grant_type: "refresh_token",
					refresh_token: this._refreshToken,
					target_audience: targetAudience
				}),
				responseType: "json"
			};
			authclient_1.AuthClient.setMethodName(opts, "fetchIdToken");
			return (await this.transporter.request(opts)).data.id_token;
		}
		/**
		* Create a UserRefreshClient credentials instance using the given input
		* options.
		* @param json The input object.
		*/
		fromJSON(json) {
			if (!json) throw new Error("Must pass in a JSON object containing the user refresh token");
			if (json.type !== "authorized_user") throw new Error("The incoming JSON object does not have the \"authorized_user\" type");
			if (!json.client_id) throw new Error("The incoming JSON object does not contain a client_id field");
			if (!json.client_secret) throw new Error("The incoming JSON object does not contain a client_secret field");
			if (!json.refresh_token) throw new Error("The incoming JSON object does not contain a refresh_token field");
			this._clientId = json.client_id;
			this._clientSecret = json.client_secret;
			this._refreshToken = json.refresh_token;
			this.credentials.refresh_token = json.refresh_token;
			this.quotaProjectId = json.quota_project_id;
			this.universeDomain = json.universe_domain || this.universeDomain;
		}
		fromStream(inputStream, callback) {
			if (callback) this.fromStreamAsync(inputStream).then(() => callback(), callback);
			else return this.fromStreamAsync(inputStream);
		}
		async fromStreamAsync(inputStream) {
			return new Promise((resolve, reject) => {
				if (!inputStream) return reject(/* @__PURE__ */ new Error("Must pass in a stream containing the user refresh token."));
				let s = "";
				inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => s += chunk).on("end", () => {
					try {
						const data = JSON.parse(s);
						this.fromJSON(data);
						return resolve();
					} catch (err) {
						return reject(err);
					}
				});
			});
		}
		/**
		* Create a UserRefreshClient credentials instance using the given input
		* options.
		* @param json The input object.
		*/
		static fromJSON(json) {
			const client = new UserRefreshClient();
			client.fromJSON(json);
			return client;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/impersonated.js
var require_impersonated = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Copyright 2021 Google LLC
	*
	* Licensed under the Apache License, Version 2.0 (the "License");
	* you may not use this file except in compliance with the License.
	* You may obtain a copy of the License at
	*
	*      http://www.apache.org/licenses/LICENSE-2.0
	*
	* Unless required by applicable law or agreed to in writing, software
	* distributed under the License is distributed on an "AS IS" BASIS,
	* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	* See the License for the specific language governing permissions and
	* limitations under the License.
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Impersonated = exports.IMPERSONATED_ACCOUNT_TYPE = void 0;
	var oauth2client_1 = require_oauth2client();
	var gaxios_1 = require_src$3();
	var util_1 = require_util();
	exports.IMPERSONATED_ACCOUNT_TYPE = "impersonated_service_account";
	exports.Impersonated = class Impersonated extends oauth2client_1.OAuth2Client {
		sourceClient;
		targetPrincipal;
		targetScopes;
		delegates;
		lifetime;
		endpoint;
		/**
		* Impersonated service account credentials.
		*
		* Create a new access token by impersonating another service account.
		*
		* Impersonated Credentials allowing credentials issued to a user or
		* service account to impersonate another. The source project using
		* Impersonated Credentials must enable the "IAMCredentials" API.
		* Also, the target service account must grant the orginating principal
		* the "Service Account Token Creator" IAM role.
		*
		* **IMPORTANT**: This method does not validate the credential configuration.
		* A security risk occurs when a credential configuration configured with
		* malicious URLs is used. When the credential configuration is accepted from
		* an untrusted source, you should validate it before using it with this
		* method. For more details, see
		* https://cloud.google.com/docs/authentication/external/externally-sourced-credentials.
		*
		* @param {object} options - The configuration object.
		* @param {object} [options.sourceClient] the source credential used as to
		* acquire the impersonated credentials.
		* @param {string} [options.targetPrincipal] the service account to
		* impersonate.
		* @param {string[]} [options.delegates] the chained list of delegates
		* required to grant the final access_token. If set, the sequence of
		* identities must have "Service Account Token Creator" capability granted to
		* the preceding identity. For example, if set to [serviceAccountB,
		* serviceAccountC], the sourceCredential must have the Token Creator role on
		* serviceAccountB. serviceAccountB must have the Token Creator on
		* serviceAccountC. Finally, C must have Token Creator on target_principal.
		* If left unset, sourceCredential must have that role on targetPrincipal.
		* @param {string[]} [options.targetScopes] scopes to request during the
		* authorization grant.
		* @param {number} [options.lifetime] number of seconds the delegated
		* credential should be valid for up to 3600 seconds by default, or 43,200
		* seconds by extending the token's lifetime, see:
		* https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials#sa-credentials-oauth
		* @param {string} [options.endpoint] api endpoint override.
		*/
		constructor(options = {}) {
			super(options);
			this.credentials = {
				expiry_date: 1,
				refresh_token: "impersonated-placeholder"
			};
			this.sourceClient = options.sourceClient ?? new oauth2client_1.OAuth2Client();
			this.targetPrincipal = options.targetPrincipal ?? "";
			this.delegates = options.delegates ?? [];
			this.targetScopes = options.targetScopes ?? [];
			this.lifetime = options.lifetime ?? 3600;
			if (!!!(0, util_1.originalOrCamelOptions)(options).get("universe_domain")) this.universeDomain = this.sourceClient.universeDomain;
			else if (this.sourceClient.universeDomain !== this.universeDomain) throw new RangeError(`Universe domain ${this.sourceClient.universeDomain} in source credentials does not match ${this.universeDomain} universe domain set for impersonated credentials.`);
			this.endpoint = options.endpoint ?? `https://iamcredentials.${this.universeDomain}`;
		}
		/**
		* Signs some bytes.
		*
		* {@link https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/signBlob Reference Documentation}
		* @param blobToSign String to sign.
		*
		* @returns A {@link SignBlobResponse} denoting the keyID and signedBlob in base64 string
		*/
		async sign(blobToSign) {
			await this.sourceClient.getAccessToken();
			const name = `projects/-/serviceAccounts/${this.targetPrincipal}`;
			const u = `${this.endpoint}/v1/${name}:signBlob`;
			const body = {
				delegates: this.delegates,
				payload: Buffer.from(blobToSign).toString("base64")
			};
			return (await this.sourceClient.request({
				...Impersonated.RETRY_CONFIG,
				url: u,
				data: body,
				method: "POST"
			})).data;
		}
		/** The service account email to be impersonated. */
		getTargetPrincipal() {
			return this.targetPrincipal;
		}
		/**
		* Refreshes the access token.
		*/
		async refreshToken() {
			try {
				await this.sourceClient.getAccessToken();
				const name = "projects/-/serviceAccounts/" + this.targetPrincipal;
				const u = `${this.endpoint}/v1/${name}:generateAccessToken`;
				const body = {
					delegates: this.delegates,
					scope: this.targetScopes,
					lifetime: this.lifetime + "s"
				};
				const res = await this.sourceClient.request({
					...Impersonated.RETRY_CONFIG,
					url: u,
					data: body,
					method: "POST"
				});
				const tokenResponse = res.data;
				this.credentials.access_token = tokenResponse.accessToken;
				this.credentials.expiry_date = Date.parse(tokenResponse.expireTime);
				return {
					tokens: this.credentials,
					res
				};
			} catch (error) {
				if (!(error instanceof Error)) throw error;
				let status = 0;
				let message = "";
				if (error instanceof gaxios_1.GaxiosError) {
					status = error?.response?.data?.error?.status;
					message = error?.response?.data?.error?.message;
				}
				if (status && message) {
					error.message = `${status}: unable to impersonate: ${message}`;
					throw error;
				} else {
					error.message = `unable to impersonate: ${error}`;
					throw error;
				}
			}
		}
		/**
		* Generates an OpenID Connect ID token for a service account.
		*
		* {@link https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken Reference Documentation}
		*
		* @param targetAudience the audience for the fetched ID token.
		* @param options the for the request
		* @return an OpenID Connect ID token
		*/
		async fetchIdToken(targetAudience, options) {
			await this.sourceClient.getAccessToken();
			const name = `projects/-/serviceAccounts/${this.targetPrincipal}`;
			const u = `${this.endpoint}/v1/${name}:generateIdToken`;
			const body = {
				delegates: this.delegates,
				audience: targetAudience,
				includeEmail: options?.includeEmail ?? true,
				useEmailAzp: options?.includeEmail ?? true
			};
			return (await this.sourceClient.request({
				...Impersonated.RETRY_CONFIG,
				url: u,
				data: body,
				method: "POST"
			})).data.token;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/oauth2common.js
var require_oauth2common = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.OAuthClientAuthHandler = void 0;
	exports.getErrorFromOAuthErrorResponse = getErrorFromOAuthErrorResponse;
	var gaxios_1 = require_src$3();
	var crypto_1 = require_crypto();
	/** List of HTTP methods that accept request bodies. */
	var METHODS_SUPPORTING_REQUEST_BODY = [
		"PUT",
		"POST",
		"PATCH"
	];
	/**
	* Abstract class for handling client authentication in OAuth-based
	* operations.
	* When request-body client authentication is used, only application/json and
	* application/x-www-form-urlencoded content types for HTTP methods that support
	* request bodies are supported.
	*/
	var OAuthClientAuthHandler = class {
		#crypto = (0, crypto_1.createCrypto)();
		#clientAuthentication;
		transporter;
		/**
		* Instantiates an OAuth client authentication handler.
		* @param options The OAuth Client Auth Handler instance options. Passing an `ClientAuthentication` directly is **@DEPRECATED**.
		*/
		constructor(options) {
			if (options && "clientId" in options) {
				this.#clientAuthentication = options;
				this.transporter = new gaxios_1.Gaxios();
			} else {
				this.#clientAuthentication = options?.clientAuthentication;
				this.transporter = options?.transporter || new gaxios_1.Gaxios();
			}
		}
		/**
		* Applies client authentication on the OAuth request's headers or POST
		* body but does not process the request.
		* @param opts The GaxiosOptions whose headers or data are to be modified
		*   depending on the client authentication mechanism to be used.
		* @param bearerToken The optional bearer token to use for authentication.
		*   When this is used, no client authentication credentials are needed.
		*/
		applyClientAuthenticationOptions(opts, bearerToken) {
			opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
			this.injectAuthenticatedHeaders(opts, bearerToken);
			if (!bearerToken) this.injectAuthenticatedRequestBody(opts);
		}
		/**
		* Applies client authentication on the request's header if either
		* basic authentication or bearer token authentication is selected.
		*
		* @param opts The GaxiosOptions whose headers or data are to be modified
		*   depending on the client authentication mechanism to be used.
		* @param bearerToken The optional bearer token to use for authentication.
		*   When this is used, no client authentication credentials are needed.
		*/
		injectAuthenticatedHeaders(opts, bearerToken) {
			if (bearerToken) opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers, { authorization: `Bearer ${bearerToken}` });
			else if (this.#clientAuthentication?.confidentialClientType === "basic") {
				opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
				const clientId = this.#clientAuthentication.clientId;
				const clientSecret = this.#clientAuthentication.clientSecret || "";
				const base64EncodedCreds = this.#crypto.encodeBase64StringUtf8(`${clientId}:${clientSecret}`);
				gaxios_1.Gaxios.mergeHeaders(opts.headers, { authorization: `Basic ${base64EncodedCreds}` });
			}
		}
		/**
		* Applies client authentication on the request's body if request-body
		* client authentication is selected.
		*
		* @param opts The GaxiosOptions whose headers or data are to be modified
		*   depending on the client authentication mechanism to be used.
		*/
		injectAuthenticatedRequestBody(opts) {
			if (this.#clientAuthentication?.confidentialClientType === "request-body") {
				const method = (opts.method || "GET").toUpperCase();
				if (!METHODS_SUPPORTING_REQUEST_BODY.includes(method)) throw new Error(`${method} HTTP method does not support ${this.#clientAuthentication.confidentialClientType} client authentication`);
				const contentType = new Headers(opts.headers).get("content-type");
				if (contentType?.startsWith("application/x-www-form-urlencoded") || opts.data instanceof URLSearchParams) {
					const data = new URLSearchParams(opts.data ?? "");
					data.append("client_id", this.#clientAuthentication.clientId);
					data.append("client_secret", this.#clientAuthentication.clientSecret || "");
					opts.data = data;
				} else if (contentType?.startsWith("application/json")) {
					opts.data = opts.data || {};
					Object.assign(opts.data, {
						client_id: this.#clientAuthentication.clientId,
						client_secret: this.#clientAuthentication.clientSecret || ""
					});
				} else throw new Error(`${contentType} content-types are not supported with ${this.#clientAuthentication.confidentialClientType} client authentication`);
			}
		}
		/**
		* Retry config for Auth-related requests.
		*
		* @remarks
		*
		* This is not a part of the default {@link AuthClient.transporter transporter/gaxios}
		* config as some downstream APIs would prefer if customers explicitly enable retries,
		* such as GCS.
		*/
		static get RETRY_CONFIG() {
			return {
				retry: true,
				retryConfig: { httpMethodsToRetry: [
					"GET",
					"PUT",
					"POST",
					"HEAD",
					"OPTIONS",
					"DELETE"
				] }
			};
		}
	};
	exports.OAuthClientAuthHandler = OAuthClientAuthHandler;
	/**
	* Converts an OAuth error response to a native JavaScript Error.
	* @param resp The OAuth error response to convert to a native Error object.
	* @param err The optional original error. If provided, the error properties
	*   will be copied to the new error.
	* @return The converted native Error object.
	*/
	function getErrorFromOAuthErrorResponse(resp, err) {
		const errorCode = resp.error;
		const errorDescription = resp.error_description;
		const errorUri = resp.error_uri;
		let message = `Error code ${errorCode}`;
		if (typeof errorDescription !== "undefined") message += `: ${errorDescription}`;
		if (typeof errorUri !== "undefined") message += ` - ${errorUri}`;
		const newError = new Error(message);
		if (err) {
			const keys = Object.keys(err);
			if (err.stack) keys.push("stack");
			keys.forEach((key) => {
				if (key !== "message") Object.defineProperty(newError, key, {
					value: err[key],
					writable: false,
					enumerable: true
				});
			});
		}
		return newError;
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/stscredentials.js
var require_stscredentials = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.StsCredentials = void 0;
	var gaxios_1 = require_src$3();
	var authclient_1 = require_authclient();
	var oauth2common_1 = require_oauth2common();
	var util_1 = require_util();
	exports.StsCredentials = class StsCredentials extends oauth2common_1.OAuthClientAuthHandler {
		#tokenExchangeEndpoint;
		/**
		* Initializes an STS credentials instance.
		*
		* @param options The STS credentials instance options. Passing an `tokenExchangeEndpoint` directly is **@DEPRECATED**.
		* @param clientAuthentication **@DEPRECATED**. Provide a {@link StsCredentialsConstructionOptions `StsCredentialsConstructionOptions`} object in the first parameter instead.
		*/
		constructor(options = { tokenExchangeEndpoint: "" }, clientAuthentication) {
			if (typeof options !== "object" || options instanceof URL) options = {
				tokenExchangeEndpoint: options,
				clientAuthentication
			};
			super(options);
			this.#tokenExchangeEndpoint = options.tokenExchangeEndpoint;
		}
		/**
		* Exchanges the provided token for another type of token based on the
		* rfc8693 spec.
		* @param stsCredentialsOptions The token exchange options used to populate
		*   the token exchange request.
		* @param additionalHeaders Optional additional headers to pass along the
		*   request.
		* @param options Optional additional GCP-specific non-spec defined options
		*   to send with the request.
		*   Example: `&options=${encodeUriComponent(JSON.stringified(options))}`
		* @return A promise that resolves with the token exchange response containing
		*   the requested token and its expiration time.
		*/
		async exchangeToken(stsCredentialsOptions, headers, options) {
			const values = {
				grant_type: stsCredentialsOptions.grantType,
				resource: stsCredentialsOptions.resource,
				audience: stsCredentialsOptions.audience,
				scope: stsCredentialsOptions.scope?.join(" "),
				requested_token_type: stsCredentialsOptions.requestedTokenType,
				subject_token: stsCredentialsOptions.subjectToken,
				subject_token_type: stsCredentialsOptions.subjectTokenType,
				actor_token: stsCredentialsOptions.actingParty?.actorToken,
				actor_token_type: stsCredentialsOptions.actingParty?.actorTokenType,
				options: options && JSON.stringify(options)
			};
			const opts = {
				...StsCredentials.RETRY_CONFIG,
				url: this.#tokenExchangeEndpoint.toString(),
				method: "POST",
				headers,
				data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(values)),
				responseType: "json"
			};
			authclient_1.AuthClient.setMethodName(opts, "exchangeToken");
			this.applyClientAuthenticationOptions(opts);
			try {
				const response = await this.transporter.request(opts);
				const stsSuccessfulResponse = response.data;
				stsSuccessfulResponse.res = response;
				return stsSuccessfulResponse;
			} catch (error) {
				if (error instanceof gaxios_1.GaxiosError && error.response) throw (0, oauth2common_1.getErrorFromOAuthErrorResponse)(error.response.data, error);
				throw error;
			}
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/baseexternalclient.js
var require_baseexternalclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaseExternalAccountClient = exports.CLOUD_RESOURCE_MANAGER = exports.EXTERNAL_ACCOUNT_TYPE = exports.EXPIRATION_TIME_OFFSET = void 0;
	var gaxios_1 = require_src$3();
	var stream$2 = __require("stream");
	var authclient_1 = require_authclient();
	var sts = require_stscredentials();
	var util_1 = require_util();
	var shared_cjs_1 = require_shared();
	/**
	* The required token exchange grant_type: rfc8693#section-2.1
	*/
	var STS_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange";
	/**
	* The requested token exchange requested_token_type: rfc8693#section-2.1
	*/
	var STS_REQUEST_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
	/** The default OAuth scope to request when none is provided. */
	var DEFAULT_OAUTH_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
	/** Default impersonated token lifespan in seconds.*/
	var DEFAULT_TOKEN_LIFESPAN = 3600;
	/**
	* Offset to take into account network delays and server clock skews.
	*/
	exports.EXPIRATION_TIME_OFFSET = 300 * 1e3;
	/**
	* The credentials JSON file type for external account clients.
	* There are 3 types of JSON configs:
	* 1. authorized_user => Google end user credential
	* 2. service_account => Google service account credential
	* 3. external_Account => non-GCP service (eg. AWS, Azure, K8s)
	*/
	exports.EXTERNAL_ACCOUNT_TYPE = "external_account";
	/**
	* Cloud resource manager URL used to retrieve project information.
	*
	* @deprecated use {@link BaseExternalAccountClient.cloudResourceManagerURL} instead
	**/
	exports.CLOUD_RESOURCE_MANAGER = "https://cloudresourcemanager.googleapis.com/v1/projects/";
	/** The workforce audience pattern. */
	var WORKFORCE_AUDIENCE_PATTERN = "//iam\\.googleapis\\.com/locations/[^/]+/workforcePools/[^/]+/providers/.+";
	var DEFAULT_TOKEN_URL = "https://sts.{universeDomain}/v1/token";
	exports.BaseExternalAccountClient = class BaseExternalAccountClient extends authclient_1.AuthClient {
		/**
		* OAuth scopes for the GCP access token to use. When not provided,
		* the default https://www.googleapis.com/auth/cloud-platform is
		* used.
		*/
		scopes;
		projectNumber;
		audience;
		subjectTokenType;
		stsCredential;
		clientAuth;
		credentialSourceType;
		cachedAccessToken;
		serviceAccountImpersonationUrl;
		serviceAccountImpersonationLifetime;
		workforcePoolUserProject;
		configLifetimeRequested;
		tokenUrl;
		/**
		* @example
		* ```ts
		* new URL('https://cloudresourcemanager.googleapis.com/v1/projects/');
		* ```
		*/
		cloudResourceManagerURL;
		supplierContext;
		/**
		* A pending access token request. Used for concurrent calls.
		*/
		#pendingAccessToken = null;
		/**
		* Instantiate a BaseExternalAccountClient instance using the provided JSON
		* object loaded from an external account credentials file.
		* @param options The external account options object typically loaded
		*   from the external account JSON credential file. The camelCased options
		*   are aliases for the snake_cased options.
		*/
		constructor(options) {
			super(options);
			const opts = (0, util_1.originalOrCamelOptions)(options);
			const type = opts.get("type");
			if (type && type !== exports.EXTERNAL_ACCOUNT_TYPE) throw new Error(`Expected "${exports.EXTERNAL_ACCOUNT_TYPE}" type but received "${options.type}"`);
			const clientId = opts.get("client_id");
			const clientSecret = opts.get("client_secret");
			this.tokenUrl = opts.get("token_url") ?? DEFAULT_TOKEN_URL.replace("{universeDomain}", this.universeDomain);
			const subjectTokenType = opts.get("subject_token_type");
			const workforcePoolUserProject = opts.get("workforce_pool_user_project");
			const serviceAccountImpersonationUrl = opts.get("service_account_impersonation_url");
			const serviceAccountImpersonation = opts.get("service_account_impersonation");
			const serviceAccountImpersonationLifetime = (0, util_1.originalOrCamelOptions)(serviceAccountImpersonation).get("token_lifetime_seconds");
			this.cloudResourceManagerURL = new URL(opts.get("cloud_resource_manager_url") || `https://cloudresourcemanager.${this.universeDomain}/v1/projects/`);
			if (clientId) this.clientAuth = {
				confidentialClientType: "basic",
				clientId,
				clientSecret
			};
			this.stsCredential = new sts.StsCredentials({
				tokenExchangeEndpoint: this.tokenUrl,
				clientAuthentication: this.clientAuth
			});
			this.scopes = opts.get("scopes") || [DEFAULT_OAUTH_SCOPE];
			this.cachedAccessToken = null;
			this.audience = opts.get("audience");
			this.subjectTokenType = subjectTokenType;
			this.workforcePoolUserProject = workforcePoolUserProject;
			const workforceAudiencePattern = new RegExp(WORKFORCE_AUDIENCE_PATTERN);
			if (this.workforcePoolUserProject && !this.audience.match(workforceAudiencePattern)) throw new Error("workforcePoolUserProject should not be set for non-workforce pool credentials.");
			this.serviceAccountImpersonationUrl = serviceAccountImpersonationUrl;
			this.serviceAccountImpersonationLifetime = serviceAccountImpersonationLifetime;
			if (this.serviceAccountImpersonationLifetime) this.configLifetimeRequested = true;
			else {
				this.configLifetimeRequested = false;
				this.serviceAccountImpersonationLifetime = DEFAULT_TOKEN_LIFESPAN;
			}
			this.projectNumber = this.getProjectNumber(this.audience);
			this.supplierContext = {
				audience: this.audience,
				subjectTokenType: this.subjectTokenType,
				transporter: this.transporter
			};
		}
		/** The service account email to be impersonated, if available. */
		getServiceAccountEmail() {
			if (this.serviceAccountImpersonationUrl) {
				if (this.serviceAccountImpersonationUrl.length > 256)
 /**
				* Prevents DOS attacks.
				* @see {@link https://github.com/googleapis/google-auth-library-nodejs/security/code-scanning/84}
				**/
				throw new RangeError(`URL is too long: ${this.serviceAccountImpersonationUrl}`);
				return /serviceAccounts\/(?<email>[^:]+):generateAccessToken$/.exec(this.serviceAccountImpersonationUrl)?.groups?.email || null;
			}
			return null;
		}
		/**
		* Provides a mechanism to inject GCP access tokens directly.
		* When the provided credential expires, a new credential, using the
		* external account options, is retrieved.
		* @param credentials The Credentials object to set on the current client.
		*/
		setCredentials(credentials) {
			super.setCredentials(credentials);
			this.cachedAccessToken = credentials;
		}
		/**
		* @return A promise that resolves with the current GCP access token
		*   response. If the current credential is expired, a new one is retrieved.
		*/
		async getAccessToken() {
			if (!this.cachedAccessToken || this.isExpired(this.cachedAccessToken)) await this.refreshAccessTokenAsync();
			return {
				token: this.cachedAccessToken.access_token,
				res: this.cachedAccessToken.res
			};
		}
		/**
		* The main authentication interface. It takes an optional url which when
		* present is the endpoint being accessed, and returns a Promise which
		* resolves with authorization header fields.
		*
		* The result has the form:
		* { authorization: 'Bearer <access_token_value>' }
		*/
		async getRequestHeaders() {
			const accessTokenResponse = await this.getAccessToken();
			const headers = new Headers({ authorization: `Bearer ${accessTokenResponse.token}` });
			return this.addSharedMetadataHeaders(headers);
		}
		request(opts, callback) {
			if (callback) this.requestAsync(opts).then((r) => callback(null, r), (e) => {
				return callback(e, e.response);
			});
			else return this.requestAsync(opts);
		}
		/**
		* @return A promise that resolves with the project ID corresponding to the
		*   current workload identity pool or current workforce pool if
		*   determinable. For workforce pool credential, it returns the project ID
		*   corresponding to the workforcePoolUserProject.
		*   This is introduced to match the current pattern of using the Auth
		*   library:
		*   const projectId = await auth.getProjectId();
		*   const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
		*   const res = await client.request({ url });
		*   The resource may not have permission
		*   (resourcemanager.projects.get) to call this API or the required
		*   scopes may not be selected:
		*   https://cloud.google.com/resource-manager/reference/rest/v1/projects/get#authorization-scopes
		*/
		async getProjectId() {
			const projectNumber = this.projectNumber || this.workforcePoolUserProject;
			if (this.projectId) return this.projectId;
			else if (projectNumber) {
				const headers = await this.getRequestHeaders();
				const opts = {
					...BaseExternalAccountClient.RETRY_CONFIG,
					headers,
					url: `${this.cloudResourceManagerURL.toString()}${projectNumber}`,
					responseType: "json"
				};
				authclient_1.AuthClient.setMethodName(opts, "getProjectId");
				const response = await this.transporter.request(opts);
				this.projectId = response.data.projectId;
				return this.projectId;
			}
			return null;
		}
		/**
		* Authenticates the provided HTTP request, processes it and resolves with the
		* returned response.
		* @param opts The HTTP request options.
		* @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure.
		* @return A promise that resolves with the successful response.
		*/
		async requestAsync(opts, reAuthRetried = false) {
			let response;
			try {
				const requestHeaders = await this.getRequestHeaders();
				opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
				this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
				response = await this.transporter.request(opts);
			} catch (e) {
				const res = e.response;
				if (res) {
					const statusCode = res.status;
					const isReadableStream = res.config.data instanceof stream$2.Readable;
					if (!reAuthRetried && (statusCode === 401 || statusCode === 403) && !isReadableStream && this.forceRefreshOnFailure) {
						await this.refreshAccessTokenAsync();
						return await this.requestAsync(opts, true);
					}
				}
				throw e;
			}
			return response;
		}
		/**
		* Forces token refresh, even if unexpired tokens are currently cached.
		* External credentials are exchanged for GCP access tokens via the token
		* exchange endpoint and other settings provided in the client options
		* object.
		* If the service_account_impersonation_url is provided, an additional
		* step to exchange the external account GCP access token for a service
		* account impersonated token is performed.
		* @return A promise that resolves with the fresh GCP access tokens.
		*/
		async refreshAccessTokenAsync() {
			this.#pendingAccessToken = this.#pendingAccessToken || this.#internalRefreshAccessTokenAsync();
			try {
				return await this.#pendingAccessToken;
			} finally {
				this.#pendingAccessToken = null;
			}
		}
		async #internalRefreshAccessTokenAsync() {
			const subjectToken = await this.retrieveSubjectToken();
			const stsCredentialsOptions = {
				grantType: STS_GRANT_TYPE,
				audience: this.audience,
				requestedTokenType: STS_REQUEST_TOKEN_TYPE,
				subjectToken,
				subjectTokenType: this.subjectTokenType,
				scope: this.serviceAccountImpersonationUrl ? [DEFAULT_OAUTH_SCOPE] : this.getScopesArray()
			};
			const additionalOptions = !this.clientAuth && this.workforcePoolUserProject ? { userProject: this.workforcePoolUserProject } : void 0;
			const additionalHeaders = new Headers({ "x-goog-api-client": this.getMetricsHeaderValue() });
			const stsResponse = await this.stsCredential.exchangeToken(stsCredentialsOptions, additionalHeaders, additionalOptions);
			if (this.serviceAccountImpersonationUrl) this.cachedAccessToken = await this.getImpersonatedAccessToken(stsResponse.access_token);
			else if (stsResponse.expires_in) this.cachedAccessToken = {
				access_token: stsResponse.access_token,
				expiry_date: (/* @__PURE__ */ new Date()).getTime() + stsResponse.expires_in * 1e3,
				res: stsResponse.res
			};
			else this.cachedAccessToken = {
				access_token: stsResponse.access_token,
				res: stsResponse.res
			};
			this.credentials = {};
			Object.assign(this.credentials, this.cachedAccessToken);
			delete this.credentials.res;
			this.emit("tokens", {
				refresh_token: null,
				expiry_date: this.cachedAccessToken.expiry_date,
				access_token: this.cachedAccessToken.access_token,
				token_type: "Bearer",
				id_token: null
			});
			return this.cachedAccessToken;
		}
		/**
		* Returns the workload identity pool project number if it is determinable
		* from the audience resource name.
		* @param audience The STS audience used to determine the project number.
		* @return The project number associated with the workload identity pool, if
		*   this can be determined from the STS audience field. Otherwise, null is
		*   returned.
		*/
		getProjectNumber(audience) {
			const match = audience.match(/\/projects\/([^/]+)/);
			if (!match) return null;
			return match[1];
		}
		/**
		* Exchanges an external account GCP access token for a service
		* account impersonated access token using iamcredentials
		* GenerateAccessToken API.
		* @param token The access token to exchange for a service account access
		*   token.
		* @return A promise that resolves with the service account impersonated
		*   credentials response.
		*/
		async getImpersonatedAccessToken(token) {
			const opts = {
				...BaseExternalAccountClient.RETRY_CONFIG,
				url: this.serviceAccountImpersonationUrl,
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${token}`
				},
				data: {
					scope: this.getScopesArray(),
					lifetime: this.serviceAccountImpersonationLifetime + "s"
				},
				responseType: "json"
			};
			authclient_1.AuthClient.setMethodName(opts, "getImpersonatedAccessToken");
			const response = await this.transporter.request(opts);
			const successResponse = response.data;
			return {
				access_token: successResponse.accessToken,
				expiry_date: new Date(successResponse.expireTime).getTime(),
				res: response
			};
		}
		/**
		* Returns whether the provided credentials are expired or not.
		* If there is no expiry time, assumes the token is not expired or expiring.
		* @param accessToken The credentials to check for expiration.
		* @return Whether the credentials are expired or not.
		*/
		isExpired(accessToken) {
			const now = (/* @__PURE__ */ new Date()).getTime();
			return accessToken.expiry_date ? now >= accessToken.expiry_date - this.eagerRefreshThresholdMillis : false;
		}
		/**
		* @return The list of scopes for the requested GCP access token.
		*/
		getScopesArray() {
			if (typeof this.scopes === "string") return [this.scopes];
			return this.scopes || [DEFAULT_OAUTH_SCOPE];
		}
		getMetricsHeaderValue() {
			const nodeVersion = process.version.replace(/^v/, "");
			const saImpersonation = this.serviceAccountImpersonationUrl !== void 0;
			const credentialSourceType = this.credentialSourceType ? this.credentialSourceType : "unknown";
			return `gl-node/${nodeVersion} auth/${shared_cjs_1.pkg.version} google-byoid-sdk source/${credentialSourceType} sa-impersonation/${saImpersonation} config-lifetime/${this.configLifetimeRequested}`;
		}
		getTokenUrl() {
			return this.tokenUrl;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/filesubjecttokensupplier.js
var require_filesubjecttokensupplier = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FileSubjectTokenSupplier = void 0;
	var util_1 = __require("util");
	var fs$4 = __require("fs");
	var readFile = (0, util_1.promisify)(fs$4.readFile ?? (() => {}));
	var realpath = (0, util_1.promisify)(fs$4.realpath ?? (() => {}));
	var lstat = (0, util_1.promisify)(fs$4.lstat ?? (() => {}));
	/**
	* Internal subject token supplier implementation used when a file location
	* is configured in the credential configuration used to build an {@link IdentityPoolClient}
	*/
	var FileSubjectTokenSupplier = class {
		filePath;
		formatType;
		subjectTokenFieldName;
		/**
		* Instantiates a new file based subject token supplier.
		* @param opts The file subject token supplier options to build the supplier
		*   with.
		*/
		constructor(opts) {
			this.filePath = opts.filePath;
			this.formatType = opts.formatType;
			this.subjectTokenFieldName = opts.subjectTokenFieldName;
		}
		/**
		* Returns the subject token stored at the file specified in the constructor.
		* @param context {@link ExternalAccountSupplierContext} from the calling
		*   {@link IdentityPoolClient}, contains the requested audience and subject
		*   token type for the external account identity. Not used.
		*/
		async getSubjectToken() {
			let parsedFilePath = this.filePath;
			try {
				parsedFilePath = await realpath(parsedFilePath);
				if (!(await lstat(parsedFilePath)).isFile()) throw new Error();
			} catch (err) {
				if (err instanceof Error) err.message = `The file at ${parsedFilePath} does not exist, or it is not a file. ${err.message}`;
				throw err;
			}
			let subjectToken;
			const rawText = await readFile(parsedFilePath, { encoding: "utf8" });
			if (this.formatType === "text") subjectToken = rawText;
			else if (this.formatType === "json" && this.subjectTokenFieldName) subjectToken = JSON.parse(rawText)[this.subjectTokenFieldName];
			if (!subjectToken) throw new Error("Unable to parse the subject_token from the credential_source file");
			return subjectToken;
		}
	};
	exports.FileSubjectTokenSupplier = FileSubjectTokenSupplier;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/urlsubjecttokensupplier.js
var require_urlsubjecttokensupplier = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.UrlSubjectTokenSupplier = void 0;
	var authclient_1 = require_authclient();
	/**
	* Internal subject token supplier implementation used when a URL
	* is configured in the credential configuration used to build an {@link IdentityPoolClient}
	*/
	var UrlSubjectTokenSupplier = class {
		url;
		headers;
		formatType;
		subjectTokenFieldName;
		additionalGaxiosOptions;
		/**
		* Instantiates a URL subject token supplier.
		* @param opts The URL subject token supplier options to build the supplier with.
		*/
		constructor(opts) {
			this.url = opts.url;
			this.formatType = opts.formatType;
			this.subjectTokenFieldName = opts.subjectTokenFieldName;
			this.headers = opts.headers;
			this.additionalGaxiosOptions = opts.additionalGaxiosOptions;
		}
		/**
		* Sends a GET request to the URL provided in the constructor and resolves
		* with the returned external subject token.
		* @param context {@link ExternalAccountSupplierContext} from the calling
		*   {@link IdentityPoolClient}, contains the requested audience and subject
		*   token type for the external account identity. Not used.
		*/
		async getSubjectToken(context) {
			const opts = {
				...this.additionalGaxiosOptions,
				url: this.url,
				method: "GET",
				headers: this.headers,
				responseType: this.formatType
			};
			authclient_1.AuthClient.setMethodName(opts, "getSubjectToken");
			let subjectToken;
			if (this.formatType === "text") subjectToken = (await context.transporter.request(opts)).data;
			else if (this.formatType === "json" && this.subjectTokenFieldName) subjectToken = (await context.transporter.request(opts)).data[this.subjectTokenFieldName];
			if (!subjectToken) throw new Error("Unable to parse the subject_token from the credential_source URL");
			return subjectToken;
		}
	};
	exports.UrlSubjectTokenSupplier = UrlSubjectTokenSupplier;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/certificatesubjecttokensupplier.js
var require_certificatesubjecttokensupplier = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CertificateSubjectTokenSupplier = exports.InvalidConfigurationError = exports.CertificateSourceUnavailableError = exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE = void 0;
	var util_1 = require_util();
	var fs$3 = __require("fs");
	var crypto_1 = __require("crypto");
	var https$1 = __require("https");
	exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE = "GOOGLE_API_CERTIFICATE_CONFIG";
	/**
	* Thrown when the certificate source cannot be located or accessed.
	*/
	var CertificateSourceUnavailableError = class extends Error {
		constructor(message) {
			super(message);
			this.name = "CertificateSourceUnavailableError";
		}
	};
	exports.CertificateSourceUnavailableError = CertificateSourceUnavailableError;
	/**
	* Thrown for invalid configuration that is not related to file availability.
	*/
	var InvalidConfigurationError = class extends Error {
		constructor(message) {
			super(message);
			this.name = "InvalidConfigurationError";
		}
	};
	exports.InvalidConfigurationError = InvalidConfigurationError;
	/**
	* A subject token supplier that uses a client certificate for authentication.
	* It provides the certificate chain as the subject token for identity federation.
	*/
	var CertificateSubjectTokenSupplier = class {
		certificateConfigPath;
		trustChainPath;
		cert;
		key;
		/**
		* Initializes a new instance of the CertificateSubjectTokenSupplier.
		* @param opts The configuration options for the supplier.
		*/
		constructor(opts) {
			if (!opts.useDefaultCertificateConfig && !opts.certificateConfigLocation) throw new InvalidConfigurationError("Either `useDefaultCertificateConfig` must be true or a `certificateConfigLocation` must be provided.");
			if (opts.useDefaultCertificateConfig && opts.certificateConfigLocation) throw new InvalidConfigurationError("Both `useDefaultCertificateConfig` and `certificateConfigLocation` cannot be provided.");
			this.trustChainPath = opts.trustChainPath;
			this.certificateConfigPath = opts.certificateConfigLocation ?? "";
		}
		/**
		* Creates an HTTPS agent configured with the client certificate and private key for mTLS.
		* @returns An mTLS-configured https.Agent.
		*/
		async createMtlsHttpsAgent() {
			if (!this.key || !this.cert) throw new InvalidConfigurationError("Cannot create mTLS Agent with missing certificate or key");
			return new https$1.Agent({
				key: this.key,
				cert: this.cert
			});
		}
		/**
		* Constructs the subject token, which is the base64-encoded certificate chain.
		* @returns A promise that resolves with the subject token.
		*/
		async getSubjectToken() {
			this.certificateConfigPath = await this.#resolveCertificateConfigFilePath();
			const { certPath, keyPath } = await this.#getCertAndKeyPaths();
			({cert: this.cert, key: this.key} = await this.#getKeyAndCert(certPath, keyPath));
			return await this.#processChainFromPaths(this.cert);
		}
		/**
		* Resolves the absolute path to the certificate configuration file
		* by checking the "certificate_config_location" provided in the ADC file,
		* or the "GOOGLE_API_CERTIFICATE_CONFIG" environment variable
		* or in the default gcloud path.
		* @param overridePath An optional path to check first.
		* @returns The resolved file path.
		*/
		async #resolveCertificateConfigFilePath() {
			const overridePath = this.certificateConfigPath;
			if (overridePath) {
				if (await (0, util_1.isValidFile)(overridePath)) return overridePath;
				throw new CertificateSourceUnavailableError(`Provided certificate config path is invalid: ${overridePath}`);
			}
			const envPath = process.env[exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE];
			if (envPath) {
				if (await (0, util_1.isValidFile)(envPath)) return envPath;
				throw new CertificateSourceUnavailableError(`Path from environment variable "${exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE}" is invalid: ${envPath}`);
			}
			const wellKnownPath = (0, util_1.getWellKnownCertificateConfigFileLocation)();
			if (await (0, util_1.isValidFile)(wellKnownPath)) return wellKnownPath;
			throw new CertificateSourceUnavailableError(`Could not find certificate configuration file. Searched override path, the "${exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE}" env var, and the gcloud path (${wellKnownPath}).`);
		}
		/**
		* Reads and parses the certificate config JSON file to extract the certificate and key paths.
		* @returns An object containing the certificate and key paths.
		*/
		async #getCertAndKeyPaths() {
			const configPath = this.certificateConfigPath;
			let fileContents;
			try {
				fileContents = await fs$3.promises.readFile(configPath, "utf8");
			} catch (err) {
				throw new CertificateSourceUnavailableError(`Failed to read certificate config file at: ${configPath}`);
			}
			try {
				const config = JSON.parse(fileContents);
				const certPath = config?.cert_configs?.workload?.cert_path;
				const keyPath = config?.cert_configs?.workload?.key_path;
				if (!certPath || !keyPath) throw new InvalidConfigurationError(`Certificate config file (${configPath}) is missing required "cert_path" or "key_path" in the workload config.`);
				return {
					certPath,
					keyPath
				};
			} catch (e) {
				if (e instanceof InvalidConfigurationError) throw e;
				throw new InvalidConfigurationError(`Failed to parse certificate config from ${configPath}: ${e.message}`);
			}
		}
		/**
		* Reads and parses the cert and key files get their content and check valid format.
		* @returns An object containing the cert content and key content in buffer format.
		*/
		async #getKeyAndCert(certPath, keyPath) {
			let cert, key;
			try {
				cert = await fs$3.promises.readFile(certPath);
				new crypto_1.X509Certificate(cert);
			} catch (err) {
				throw new CertificateSourceUnavailableError(`Failed to read certificate file at ${certPath}: ${err instanceof Error ? err.message : String(err)}`);
			}
			try {
				key = await fs$3.promises.readFile(keyPath);
				(0, crypto_1.createPrivateKey)(key);
			} catch (err) {
				throw new CertificateSourceUnavailableError(`Failed to read private key file at ${keyPath}: ${err instanceof Error ? err.message : String(err)}`);
			}
			return {
				cert,
				key
			};
		}
		/**
		* Reads the leaf certificate and trust chain, combines them,
		* and returns a JSON array of base64-encoded certificates.
		* @returns A stringified JSON array of the certificate chain.
		*/
		async #processChainFromPaths(leafCertBuffer) {
			const leafCert = new crypto_1.X509Certificate(leafCertBuffer);
			if (!this.trustChainPath) return JSON.stringify([leafCert.raw.toString("base64")]);
			try {
				const chainCerts = ((await fs$3.promises.readFile(this.trustChainPath, "utf8")).match(/-----BEGIN CERTIFICATE-----[^-]+-----END CERTIFICATE-----/g) ?? []).map((pem, index) => {
					try {
						return new crypto_1.X509Certificate(pem);
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err);
						throw new InvalidConfigurationError(`Failed to parse certificate at index ${index} in trust chain file ${this.trustChainPath}: ${message}`);
					}
				});
				const leafIndex = chainCerts.findIndex((chainCert) => leafCert.raw.equals(chainCert.raw));
				let finalChain;
				if (leafIndex === -1) finalChain = [leafCert, ...chainCerts];
				else if (leafIndex === 0) finalChain = chainCerts;
				else throw new InvalidConfigurationError(`Leaf certificate exists in the trust chain but is not the first entry (found at index ${leafIndex}).`);
				return JSON.stringify(finalChain.map((cert) => cert.raw.toString("base64")));
			} catch (err) {
				if (err instanceof InvalidConfigurationError) throw err;
				const message = err instanceof Error ? err.message : String(err);
				throw new CertificateSourceUnavailableError(`Failed to process certificate chain from ${this.trustChainPath}: ${message}`);
			}
		}
	};
	exports.CertificateSubjectTokenSupplier = CertificateSubjectTokenSupplier;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/identitypoolclient.js
var require_identitypoolclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.IdentityPoolClient = void 0;
	var baseexternalclient_1 = require_baseexternalclient();
	var util_1 = require_util();
	var filesubjecttokensupplier_1 = require_filesubjecttokensupplier();
	var urlsubjecttokensupplier_1 = require_urlsubjecttokensupplier();
	var certificatesubjecttokensupplier_1 = require_certificatesubjecttokensupplier();
	var stscredentials_1 = require_stscredentials();
	var gaxios_1 = require_src$3();
	exports.IdentityPoolClient = class IdentityPoolClient extends baseexternalclient_1.BaseExternalAccountClient {
		subjectTokenSupplier;
		/**
		* Instantiate an IdentityPoolClient instance using the provided JSON
		* object loaded from an external account credentials file.
		* An error is thrown if the credential is not a valid file-sourced or
		* url-sourced credential or a workforce pool user project is provided
		* with a non workforce audience.
		* @param options The external account options object typically loaded
		*   from the external account JSON credential file. The camelCased options
		*   are aliases for the snake_cased options.
		*/
		constructor(options) {
			super(options);
			const opts = (0, util_1.originalOrCamelOptions)(options);
			const credentialSource = opts.get("credential_source");
			const subjectTokenSupplier = opts.get("subject_token_supplier");
			if (!credentialSource && !subjectTokenSupplier) throw new Error("A credential source or subject token supplier must be specified.");
			if (credentialSource && subjectTokenSupplier) throw new Error("Only one of credential source or subject token supplier can be specified.");
			if (subjectTokenSupplier) {
				this.subjectTokenSupplier = subjectTokenSupplier;
				this.credentialSourceType = "programmatic";
			} else {
				const credentialSourceOpts = (0, util_1.originalOrCamelOptions)(credentialSource);
				const formatOpts = (0, util_1.originalOrCamelOptions)(credentialSourceOpts.get("format"));
				const formatType = formatOpts.get("type") || "text";
				const formatSubjectTokenFieldName = formatOpts.get("subject_token_field_name");
				if (formatType !== "json" && formatType !== "text") throw new Error(`Invalid credential_source format "${formatType}"`);
				if (formatType === "json" && !formatSubjectTokenFieldName) throw new Error("Missing subject_token_field_name for JSON credential_source format");
				const file = credentialSourceOpts.get("file");
				const url = credentialSourceOpts.get("url");
				const certificate = credentialSourceOpts.get("certificate");
				const headers = credentialSourceOpts.get("headers");
				if (file && url || url && certificate || file && certificate) throw new Error("No valid Identity Pool \"credential_source\" provided, must be either file, url, or certificate.");
				else if (file) {
					this.credentialSourceType = "file";
					this.subjectTokenSupplier = new filesubjecttokensupplier_1.FileSubjectTokenSupplier({
						filePath: file,
						formatType,
						subjectTokenFieldName: formatSubjectTokenFieldName
					});
				} else if (url) {
					this.credentialSourceType = "url";
					this.subjectTokenSupplier = new urlsubjecttokensupplier_1.UrlSubjectTokenSupplier({
						url,
						formatType,
						subjectTokenFieldName: formatSubjectTokenFieldName,
						headers,
						additionalGaxiosOptions: IdentityPoolClient.RETRY_CONFIG
					});
				} else if (certificate) {
					this.credentialSourceType = "certificate";
					const certificateSubjecttokensupplier = new certificatesubjecttokensupplier_1.CertificateSubjectTokenSupplier({
						useDefaultCertificateConfig: certificate.use_default_certificate_config,
						certificateConfigLocation: certificate.certificate_config_location,
						trustChainPath: certificate.trust_chain_path
					});
					this.subjectTokenSupplier = certificateSubjecttokensupplier;
				} else throw new Error("No valid Identity Pool \"credential_source\" provided, must be either file, url, or certificate.");
			}
		}
		/**
		* Triggered when a external subject token is needed to be exchanged for a GCP
		* access token via GCP STS endpoint. Gets a subject token by calling
		* the configured {@link SubjectTokenSupplier}
		* @return A promise that resolves with the external subject token.
		*/
		async retrieveSubjectToken() {
			const subjectToken = await this.subjectTokenSupplier.getSubjectToken(this.supplierContext);
			if (this.subjectTokenSupplier instanceof certificatesubjecttokensupplier_1.CertificateSubjectTokenSupplier) {
				const mtlsAgent = await this.subjectTokenSupplier.createMtlsHttpsAgent();
				this.stsCredential = new stscredentials_1.StsCredentials({
					tokenExchangeEndpoint: this.getTokenUrl(),
					clientAuthentication: this.clientAuth,
					transporter: new gaxios_1.Gaxios({ agent: mtlsAgent })
				});
				this.transporter = new gaxios_1.Gaxios({
					...this.transporter.defaults || {},
					agent: mtlsAgent
				});
			}
			return subjectToken;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/awsrequestsigner.js
var require_awsrequestsigner = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AwsRequestSigner = void 0;
	var gaxios_1 = require_src$3();
	var crypto_1 = require_crypto();
	/** AWS Signature Version 4 signing algorithm identifier.  */
	var AWS_ALGORITHM = "AWS4-HMAC-SHA256";
	/**
	* The termination string for the AWS credential scope value as defined in
	* https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
	*/
	var AWS_REQUEST_TYPE = "aws4_request";
	/**
	* Implements an AWS API request signer based on the AWS Signature Version 4
	* signing process.
	* https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
	*/
	var AwsRequestSigner = class {
		getCredentials;
		region;
		crypto;
		/**
		* Instantiates an AWS API request signer used to send authenticated signed
		* requests to AWS APIs based on the AWS Signature Version 4 signing process.
		* This also provides a mechanism to generate the signed request without
		* sending it.
		* @param getCredentials A mechanism to retrieve AWS security credentials
		*   when needed.
		* @param region The AWS region to use.
		*/
		constructor(getCredentials, region) {
			this.getCredentials = getCredentials;
			this.region = region;
			this.crypto = (0, crypto_1.createCrypto)();
		}
		/**
		* Generates the signed request for the provided HTTP request for calling
		* an AWS API. This follows the steps described at:
		* https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
		* @param amzOptions The AWS request options that need to be signed.
		* @return A promise that resolves with the GaxiosOptions containing the
		*   signed HTTP request parameters.
		*/
		async getRequestOptions(amzOptions) {
			if (!amzOptions.url) throw new RangeError("\"url\" is required in \"amzOptions\"");
			const requestPayloadData = typeof amzOptions.data === "object" ? JSON.stringify(amzOptions.data) : amzOptions.data;
			const url = amzOptions.url;
			const method = amzOptions.method || "GET";
			const requestPayload = amzOptions.body || requestPayloadData;
			const additionalAmzHeaders = amzOptions.headers;
			const awsSecurityCredentials = await this.getCredentials();
			const uri = new URL(url);
			if (typeof requestPayload !== "string" && requestPayload !== void 0) throw new TypeError(`'requestPayload' is expected to be a string if provided. Got: ${requestPayload}`);
			const headerMap = await generateAuthenticationHeaderMap({
				crypto: this.crypto,
				host: uri.host,
				canonicalUri: uri.pathname,
				canonicalQuerystring: uri.search.slice(1),
				method,
				region: this.region,
				securityCredentials: awsSecurityCredentials,
				requestPayload,
				additionalAmzHeaders
			});
			const headers = gaxios_1.Gaxios.mergeHeaders(headerMap.amzDate ? { "x-amz-date": headerMap.amzDate } : {}, {
				authorization: headerMap.authorizationHeader,
				host: uri.host
			}, additionalAmzHeaders || {});
			if (awsSecurityCredentials.token) gaxios_1.Gaxios.mergeHeaders(headers, { "x-amz-security-token": awsSecurityCredentials.token });
			const awsSignedReq = {
				url,
				method,
				headers
			};
			if (requestPayload !== void 0) awsSignedReq.body = requestPayload;
			return awsSignedReq;
		}
	};
	exports.AwsRequestSigner = AwsRequestSigner;
	/**
	* Creates the HMAC-SHA256 hash of the provided message using the
	* provided key.
	*
	* @param crypto The crypto instance used to facilitate cryptographic
	*   operations.
	* @param key The HMAC-SHA256 key to use.
	* @param msg The message to hash.
	* @return The computed hash bytes.
	*/
	async function sign(crypto, key, msg) {
		return await crypto.signWithHmacSha256(key, msg);
	}
	/**
	* Calculates the signing key used to calculate the signature for
	* AWS Signature Version 4 based on:
	* https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
	*
	* @param crypto The crypto instance used to facilitate cryptographic
	*   operations.
	* @param key The AWS secret access key.
	* @param dateStamp The '%Y%m%d' date format.
	* @param region The AWS region.
	* @param serviceName The AWS service name, eg. sts.
	* @return The signing key bytes.
	*/
	async function getSigningKey(crypto, key, dateStamp, region, serviceName) {
		return await sign(crypto, await sign(crypto, await sign(crypto, await sign(crypto, `AWS4${key}`, dateStamp), region), serviceName), "aws4_request");
	}
	/**
	* Generates the authentication header map needed for generating the AWS
	* Signature Version 4 signed request.
	*
	* @param option The options needed to compute the authentication header map.
	* @return The AWS authentication header map which constitutes of the following
	*   components: amz-date, authorization header and canonical query string.
	*/
	async function generateAuthenticationHeaderMap(options) {
		const additionalAmzHeaders = gaxios_1.Gaxios.mergeHeaders(options.additionalAmzHeaders);
		const requestPayload = options.requestPayload || "";
		const serviceName = options.host.split(".")[0];
		const now = /* @__PURE__ */ new Date();
		const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.[0-9]+/, "");
		const dateStamp = now.toISOString().replace(/[-]/g, "").replace(/T.*/, "");
		if (options.securityCredentials.token) additionalAmzHeaders.set("x-amz-security-token", options.securityCredentials.token);
		const amzHeaders = gaxios_1.Gaxios.mergeHeaders({ host: options.host }, additionalAmzHeaders.has("date") ? {} : { "x-amz-date": amzDate }, additionalAmzHeaders);
		let canonicalHeaders = "";
		const signedHeadersList = [...amzHeaders.keys()].sort();
		signedHeadersList.forEach((key) => {
			canonicalHeaders += `${key}:${amzHeaders.get(key)}\n`;
		});
		const signedHeaders = signedHeadersList.join(";");
		const payloadHash = await options.crypto.sha256DigestHex(requestPayload);
		const canonicalRequest = `${options.method.toUpperCase()}\n${options.canonicalUri}\n${options.canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
		const credentialScope = `${dateStamp}/${options.region}/${serviceName}/${AWS_REQUEST_TYPE}`;
		const stringToSign = `${AWS_ALGORITHM}\n${amzDate}\n${credentialScope}\n` + await options.crypto.sha256DigestHex(canonicalRequest);
		const signingKey = await getSigningKey(options.crypto, options.securityCredentials.secretAccessKey, dateStamp, options.region, serviceName);
		const signature = await sign(options.crypto, signingKey, stringToSign);
		const authorizationHeader = `${AWS_ALGORITHM} Credential=${options.securityCredentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${(0, crypto_1.fromArrayBufferToHex)(signature)}`;
		return {
			amzDate: additionalAmzHeaders.has("date") ? void 0 : amzDate,
			authorizationHeader,
			canonicalQuerystring: options.canonicalQuerystring
		};
	}
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/defaultawssecuritycredentialssupplier.js
var require_defaultawssecuritycredentialssupplier = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DefaultAwsSecurityCredentialsSupplier = void 0;
	var authclient_1 = require_authclient();
	/**
	* Internal AWS security credentials supplier implementation used by {@link AwsClient}
	* when a credential source is provided instead of a user defined supplier.
	* The logic is summarized as:
	* 1. If imdsv2_session_token_url is provided in the credential source, then
	*    fetch the aws session token and include it in the headers of the
	*    metadata requests. This is a requirement for IDMSv2 but optional
	*    for IDMSv1.
	* 2. Retrieve AWS region from availability-zone.
	* 3a. Check AWS credentials in environment variables. If not found, get
	*     from security-credentials endpoint.
	* 3b. Get AWS credentials from security-credentials endpoint. In order
	*     to retrieve this, the AWS role needs to be determined by calling
	*     security-credentials endpoint without any argument. Then the
	*     credentials can be retrieved via: security-credentials/role_name
	* 4. Generate the signed request to AWS STS GetCallerIdentity action.
	* 5. Inject x-goog-cloud-target-resource into header and serialize the
	*    signed request. This will be the subject-token to pass to GCP STS.
	*/
	var DefaultAwsSecurityCredentialsSupplier = class {
		regionUrl;
		securityCredentialsUrl;
		imdsV2SessionTokenUrl;
		additionalGaxiosOptions;
		/**
		* Instantiates a new DefaultAwsSecurityCredentialsSupplier using information
		* from the credential_source stored in the ADC file.
		* @param opts The default aws security credentials supplier options object to
		*   build the supplier with.
		*/
		constructor(opts) {
			this.regionUrl = opts.regionUrl;
			this.securityCredentialsUrl = opts.securityCredentialsUrl;
			this.imdsV2SessionTokenUrl = opts.imdsV2SessionTokenUrl;
			this.additionalGaxiosOptions = opts.additionalGaxiosOptions;
		}
		/**
		* Returns the active AWS region. This first checks to see if the region
		* is available as an environment variable. If it is not, then the supplier
		* will call the region URL.
		* @param context {@link ExternalAccountSupplierContext} from the calling
		*   {@link AwsClient}, contains the requested audience and subject token type
		*   for the external account identity.
		* @return A promise that resolves with the AWS region string.
		*/
		async getAwsRegion(context) {
			if (this.#regionFromEnv) return this.#regionFromEnv;
			const metadataHeaders = new Headers();
			if (!this.#regionFromEnv && this.imdsV2SessionTokenUrl) metadataHeaders.set("x-aws-ec2-metadata-token", await this.#getImdsV2SessionToken(context.transporter));
			if (!this.regionUrl) throw new RangeError("Unable to determine AWS region due to missing \"options.credential_source.region_url\"");
			const opts = {
				...this.additionalGaxiosOptions,
				url: this.regionUrl,
				method: "GET",
				responseType: "text",
				headers: metadataHeaders
			};
			authclient_1.AuthClient.setMethodName(opts, "getAwsRegion");
			const response = await context.transporter.request(opts);
			return response.data.substr(0, response.data.length - 1);
		}
		/**
		* Returns AWS security credentials. This first checks to see if the credentials
		* is available as environment variables. If it is not, then the supplier
		* will call the security credentials URL.
		* @param context {@link ExternalAccountSupplierContext} from the calling
		*   {@link AwsClient}, contains the requested audience and subject token type
		*   for the external account identity.
		* @return A promise that resolves with the AWS security credentials.
		*/
		async getAwsSecurityCredentials(context) {
			if (this.#securityCredentialsFromEnv) return this.#securityCredentialsFromEnv;
			const metadataHeaders = new Headers();
			if (this.imdsV2SessionTokenUrl) metadataHeaders.set("x-aws-ec2-metadata-token", await this.#getImdsV2SessionToken(context.transporter));
			const roleName = await this.#getAwsRoleName(metadataHeaders, context.transporter);
			const awsCreds = await this.#retrieveAwsSecurityCredentials(roleName, metadataHeaders, context.transporter);
			return {
				accessKeyId: awsCreds.AccessKeyId,
				secretAccessKey: awsCreds.SecretAccessKey,
				token: awsCreds.Token
			};
		}
		/**
		* @param transporter The transporter to use for requests.
		* @return A promise that resolves with the IMDSv2 Session Token.
		*/
		async #getImdsV2SessionToken(transporter) {
			const opts = {
				...this.additionalGaxiosOptions,
				url: this.imdsV2SessionTokenUrl,
				method: "PUT",
				responseType: "text",
				headers: { "x-aws-ec2-metadata-token-ttl-seconds": "300" }
			};
			authclient_1.AuthClient.setMethodName(opts, "#getImdsV2SessionToken");
			return (await transporter.request(opts)).data;
		}
		/**
		* @param headers The headers to be used in the metadata request.
		* @param transporter The transporter to use for requests.
		* @return A promise that resolves with the assigned role to the current
		*   AWS VM. This is needed for calling the security-credentials endpoint.
		*/
		async #getAwsRoleName(headers, transporter) {
			if (!this.securityCredentialsUrl) throw new Error("Unable to determine AWS role name due to missing \"options.credential_source.url\"");
			const opts = {
				...this.additionalGaxiosOptions,
				url: this.securityCredentialsUrl,
				method: "GET",
				responseType: "text",
				headers
			};
			authclient_1.AuthClient.setMethodName(opts, "#getAwsRoleName");
			return (await transporter.request(opts)).data;
		}
		/**
		* Retrieves the temporary AWS credentials by calling the security-credentials
		* endpoint as specified in the `credential_source` object.
		* @param roleName The role attached to the current VM.
		* @param headers The headers to be used in the metadata request.
		* @param transporter The transporter to use for requests.
		* @return A promise that resolves with the temporary AWS credentials
		*   needed for creating the GetCallerIdentity signed request.
		*/
		async #retrieveAwsSecurityCredentials(roleName, headers, transporter) {
			const opts = {
				...this.additionalGaxiosOptions,
				url: `${this.securityCredentialsUrl}/${roleName}`,
				headers,
				responseType: "json"
			};
			authclient_1.AuthClient.setMethodName(opts, "#retrieveAwsSecurityCredentials");
			return (await transporter.request(opts)).data;
		}
		get #regionFromEnv() {
			return process.env["AWS_REGION"] || process.env["AWS_DEFAULT_REGION"] || null;
		}
		get #securityCredentialsFromEnv() {
			if (process.env["AWS_ACCESS_KEY_ID"] && process.env["AWS_SECRET_ACCESS_KEY"]) return {
				accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
				secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
				token: process.env["AWS_SESSION_TOKEN"]
			};
			return null;
		}
	};
	exports.DefaultAwsSecurityCredentialsSupplier = DefaultAwsSecurityCredentialsSupplier;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/awsclient.js
var require_awsclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AwsClient = void 0;
	var awsrequestsigner_1 = require_awsrequestsigner();
	var baseexternalclient_1 = require_baseexternalclient();
	var defaultawssecuritycredentialssupplier_1 = require_defaultawssecuritycredentialssupplier();
	var util_1 = require_util();
	var gaxios_1 = require_src$3();
	exports.AwsClient = class AwsClient extends baseexternalclient_1.BaseExternalAccountClient {
		environmentId;
		awsSecurityCredentialsSupplier;
		regionalCredVerificationUrl;
		awsRequestSigner;
		region;
		static #DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL = "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15";
		/**
		* @deprecated AWS client no validates the EC2 metadata address.
		**/
		static AWS_EC2_METADATA_IPV4_ADDRESS = "169.254.169.254";
		/**
		* @deprecated AWS client no validates the EC2 metadata address.
		**/
		static AWS_EC2_METADATA_IPV6_ADDRESS = "fd00:ec2::254";
		/**
		* Instantiates an AwsClient instance using the provided JSON
		* object loaded from an external account credentials file.
		* An error is thrown if the credential is not a valid AWS credential.
		* @param options The external account options object typically loaded
		*   from the external account JSON credential file.
		*/
		constructor(options) {
			super(options);
			const opts = (0, util_1.originalOrCamelOptions)(options);
			const credentialSource = opts.get("credential_source");
			const awsSecurityCredentialsSupplier = opts.get("aws_security_credentials_supplier");
			if (!credentialSource && !awsSecurityCredentialsSupplier) throw new Error("A credential source or AWS security credentials supplier must be specified.");
			if (credentialSource && awsSecurityCredentialsSupplier) throw new Error("Only one of credential source or AWS security credentials supplier can be specified.");
			if (awsSecurityCredentialsSupplier) {
				this.awsSecurityCredentialsSupplier = awsSecurityCredentialsSupplier;
				this.regionalCredVerificationUrl = AwsClient.#DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL;
				this.credentialSourceType = "programmatic";
			} else {
				const credentialSourceOpts = (0, util_1.originalOrCamelOptions)(credentialSource);
				this.environmentId = credentialSourceOpts.get("environment_id");
				const regionUrl = credentialSourceOpts.get("region_url");
				const securityCredentialsUrl = credentialSourceOpts.get("url");
				const imdsV2SessionTokenUrl = credentialSourceOpts.get("imdsv2_session_token_url");
				this.awsSecurityCredentialsSupplier = new defaultawssecuritycredentialssupplier_1.DefaultAwsSecurityCredentialsSupplier({
					regionUrl,
					securityCredentialsUrl,
					imdsV2SessionTokenUrl
				});
				this.regionalCredVerificationUrl = credentialSourceOpts.get("regional_cred_verification_url");
				this.credentialSourceType = "aws";
				this.validateEnvironmentId();
			}
			this.awsRequestSigner = null;
			this.region = "";
		}
		validateEnvironmentId() {
			const match = this.environmentId?.match(/^(aws)(\d+)$/);
			if (!match || !this.regionalCredVerificationUrl) throw new Error("No valid AWS \"credential_source\" provided");
			else if (parseInt(match[2], 10) !== 1) throw new Error(`aws version "${match[2]}" is not supported in the current build.`);
		}
		/**
		* Triggered when an external subject token is needed to be exchanged for a
		* GCP access token via GCP STS endpoint. This will call the
		* {@link AwsSecurityCredentialsSupplier} to retrieve an AWS region and AWS
		* Security Credentials, then use them to create a signed AWS STS request that
		* can be exchanged for a GCP access token.
		* @return A promise that resolves with the external subject token.
		*/
		async retrieveSubjectToken() {
			if (!this.awsRequestSigner) {
				this.region = await this.awsSecurityCredentialsSupplier.getAwsRegion(this.supplierContext);
				this.awsRequestSigner = new awsrequestsigner_1.AwsRequestSigner(async () => {
					return this.awsSecurityCredentialsSupplier.getAwsSecurityCredentials(this.supplierContext);
				}, this.region);
			}
			const options = await this.awsRequestSigner.getRequestOptions({
				...AwsClient.RETRY_CONFIG,
				url: this.regionalCredVerificationUrl.replace("{region}", this.region),
				method: "POST"
			});
			const reformattedHeader = [];
			gaxios_1.Gaxios.mergeHeaders({ "x-goog-cloud-target-resource": this.audience }, options.headers).forEach((value, key) => reformattedHeader.push({
				key,
				value
			}));
			return encodeURIComponent(JSON.stringify({
				url: options.url,
				method: options.method,
				headers: reformattedHeader
			}));
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/executable-response.js
var require_executable_response = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InvalidSubjectTokenError = exports.InvalidMessageFieldError = exports.InvalidCodeFieldError = exports.InvalidTokenTypeFieldError = exports.InvalidExpirationTimeFieldError = exports.InvalidSuccessFieldError = exports.InvalidVersionFieldError = exports.ExecutableResponseError = exports.ExecutableResponse = void 0;
	var SAML_SUBJECT_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:saml2";
	var OIDC_SUBJECT_TOKEN_TYPE1 = "urn:ietf:params:oauth:token-type:id_token";
	var OIDC_SUBJECT_TOKEN_TYPE2 = "urn:ietf:params:oauth:token-type:jwt";
	/**
	* Defines the response of a 3rd party executable run by the pluggable auth client.
	*/
	var ExecutableResponse = class {
		/**
		* The version of the Executable response. Only version 1 is currently supported.
		*/
		version;
		/**
		* Whether the executable ran successfully.
		*/
		success;
		/**
		* The epoch time for expiration of the token in seconds.
		*/
		expirationTime;
		/**
		* The type of subject token in the response, currently supported values are:
		* urn:ietf:params:oauth:token-type:saml2
		* urn:ietf:params:oauth:token-type:id_token
		* urn:ietf:params:oauth:token-type:jwt
		*/
		tokenType;
		/**
		* The error code from the executable.
		*/
		errorCode;
		/**
		* The error message from the executable.
		*/
		errorMessage;
		/**
		* The subject token from the executable, format depends on tokenType.
		*/
		subjectToken;
		/**
		* Instantiates an ExecutableResponse instance using the provided JSON object
		* from the output of the executable.
		* @param responseJson Response from a 3rd party executable, loaded from a
		* run of the executable or a cached output file.
		*/
		constructor(responseJson) {
			if (!responseJson.version) throw new InvalidVersionFieldError("Executable response must contain a 'version' field.");
			if (responseJson.success === void 0) throw new InvalidSuccessFieldError("Executable response must contain a 'success' field.");
			this.version = responseJson.version;
			this.success = responseJson.success;
			if (this.success) {
				this.expirationTime = responseJson.expiration_time;
				this.tokenType = responseJson.token_type;
				if (this.tokenType !== SAML_SUBJECT_TOKEN_TYPE && this.tokenType !== OIDC_SUBJECT_TOKEN_TYPE1 && this.tokenType !== OIDC_SUBJECT_TOKEN_TYPE2) throw new InvalidTokenTypeFieldError(`Executable response must contain a 'token_type' field when successful and it must be one of ${OIDC_SUBJECT_TOKEN_TYPE1}, ${OIDC_SUBJECT_TOKEN_TYPE2}, or ${SAML_SUBJECT_TOKEN_TYPE}.`);
				if (this.tokenType === SAML_SUBJECT_TOKEN_TYPE) {
					if (!responseJson.saml_response) throw new InvalidSubjectTokenError(`Executable response must contain a 'saml_response' field when token_type=${SAML_SUBJECT_TOKEN_TYPE}.`);
					this.subjectToken = responseJson.saml_response;
				} else {
					if (!responseJson.id_token) throw new InvalidSubjectTokenError(`Executable response must contain a 'id_token' field when token_type=${OIDC_SUBJECT_TOKEN_TYPE1} or ${OIDC_SUBJECT_TOKEN_TYPE2}.`);
					this.subjectToken = responseJson.id_token;
				}
			} else {
				if (!responseJson.code) throw new InvalidCodeFieldError("Executable response must contain a 'code' field when unsuccessful.");
				if (!responseJson.message) throw new InvalidMessageFieldError("Executable response must contain a 'message' field when unsuccessful.");
				this.errorCode = responseJson.code;
				this.errorMessage = responseJson.message;
			}
		}
		/**
		* @return A boolean representing if the response has a valid token. Returns
		* true when the response was successful and the token is not expired.
		*/
		isValid() {
			return !this.isExpired() && this.success;
		}
		/**
		* @return A boolean representing if the response is expired. Returns true if the
		* provided timeout has passed.
		*/
		isExpired() {
			return this.expirationTime !== void 0 && this.expirationTime < Math.round(Date.now() / 1e3);
		}
	};
	exports.ExecutableResponse = ExecutableResponse;
	/**
	* An error thrown by the ExecutableResponse class.
	*/
	var ExecutableResponseError = class extends Error {
		constructor(message) {
			super(message);
			Object.setPrototypeOf(this, new.target.prototype);
		}
	};
	exports.ExecutableResponseError = ExecutableResponseError;
	/**
	* An error thrown when the 'version' field in an executable response is missing or invalid.
	*/
	var InvalidVersionFieldError = class extends ExecutableResponseError {};
	exports.InvalidVersionFieldError = InvalidVersionFieldError;
	/**
	* An error thrown when the 'success' field in an executable response is missing or invalid.
	*/
	var InvalidSuccessFieldError = class extends ExecutableResponseError {};
	exports.InvalidSuccessFieldError = InvalidSuccessFieldError;
	/**
	* An error thrown when the 'expiration_time' field in an executable response is missing or invalid.
	*/
	var InvalidExpirationTimeFieldError = class extends ExecutableResponseError {};
	exports.InvalidExpirationTimeFieldError = InvalidExpirationTimeFieldError;
	/**
	* An error thrown when the 'token_type' field in an executable response is missing or invalid.
	*/
	var InvalidTokenTypeFieldError = class extends ExecutableResponseError {};
	exports.InvalidTokenTypeFieldError = InvalidTokenTypeFieldError;
	/**
	* An error thrown when the 'code' field in an executable response is missing or invalid.
	*/
	var InvalidCodeFieldError = class extends ExecutableResponseError {};
	exports.InvalidCodeFieldError = InvalidCodeFieldError;
	/**
	* An error thrown when the 'message' field in an executable response is missing or invalid.
	*/
	var InvalidMessageFieldError = class extends ExecutableResponseError {};
	exports.InvalidMessageFieldError = InvalidMessageFieldError;
	/**
	* An error thrown when the subject token in an executable response is missing or invalid.
	*/
	var InvalidSubjectTokenError = class extends ExecutableResponseError {};
	exports.InvalidSubjectTokenError = InvalidSubjectTokenError;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/pluggable-auth-handler.js
var require_pluggable_auth_handler = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PluggableAuthHandler = exports.ExecutableError = void 0;
	var executable_response_1 = require_executable_response();
	var childProcess = __require("child_process");
	var fs$2 = __require("fs");
	/**
	* Error thrown from the executable run by PluggableAuthClient.
	*/
	var ExecutableError = class extends Error {
		/**
		* The exit code returned by the executable.
		*/
		code;
		constructor(message, code) {
			super(`The executable failed with exit code: ${code} and error message: ${message}.`);
			this.code = code;
			Object.setPrototypeOf(this, new.target.prototype);
		}
	};
	exports.ExecutableError = ExecutableError;
	exports.PluggableAuthHandler = class PluggableAuthHandler {
		commandComponents;
		timeoutMillis;
		outputFile;
		/**
		* Instantiates a PluggableAuthHandler instance using the provided
		* PluggableAuthHandlerOptions object.
		*/
		constructor(options) {
			if (!options.command) throw new Error("No command provided.");
			this.commandComponents = PluggableAuthHandler.parseCommand(options.command);
			this.timeoutMillis = options.timeoutMillis;
			if (!this.timeoutMillis) throw new Error("No timeoutMillis provided.");
			this.outputFile = options.outputFile;
		}
		/**
		* Calls user provided executable to get a 3rd party subject token and
		* returns the response.
		* @param envMap a Map of additional Environment Variables required for
		*   the executable.
		* @return A promise that resolves with the executable response.
		*/
		retrieveResponseFromExecutable(envMap) {
			return new Promise((resolve, reject) => {
				const child = childProcess.spawn(this.commandComponents[0], this.commandComponents.slice(1), { env: {
					...process.env,
					...Object.fromEntries(envMap)
				} });
				let output = "";
				child.stdout.on("data", (data) => {
					output += data;
				});
				child.stderr.on("data", (err) => {
					output += err;
				});
				const timeout = setTimeout(() => {
					child.removeAllListeners();
					child.kill();
					return reject(/* @__PURE__ */ new Error("The executable failed to finish within the timeout specified."));
				}, this.timeoutMillis);
				child.on("close", (code) => {
					clearTimeout(timeout);
					if (code === 0) try {
						const responseJson = JSON.parse(output);
						return resolve(new executable_response_1.ExecutableResponse(responseJson));
					} catch (error) {
						if (error instanceof executable_response_1.ExecutableResponseError) return reject(error);
						return reject(new executable_response_1.ExecutableResponseError(`The executable returned an invalid response: ${output}`));
					}
					else return reject(new ExecutableError(output, code.toString()));
				});
			});
		}
		/**
		* Checks user provided output file for response from previous run of
		* executable and return the response if it exists, is formatted correctly, and is not expired.
		*/
		async retrieveCachedResponse() {
			if (!this.outputFile || this.outputFile.length === 0) return;
			let filePath;
			try {
				filePath = await fs$2.promises.realpath(this.outputFile);
			} catch {
				return;
			}
			if (!(await fs$2.promises.lstat(filePath)).isFile()) return;
			const responseString = await fs$2.promises.readFile(filePath, { encoding: "utf8" });
			if (responseString === "") return;
			try {
				const responseJson = JSON.parse(responseString);
				if (new executable_response_1.ExecutableResponse(responseJson).isValid()) return new executable_response_1.ExecutableResponse(responseJson);
				return;
			} catch (error) {
				if (error instanceof executable_response_1.ExecutableResponseError) throw error;
				throw new executable_response_1.ExecutableResponseError(`The output file contained an invalid response: ${responseString}`);
			}
		}
		/**
		* Parses given command string into component array, splitting on spaces unless
		* spaces are between quotation marks.
		*/
		static parseCommand(command) {
			const components = command.match(/(?:[^\s"]+|"[^"]*")+/g);
			if (!components) throw new Error(`Provided command: "${command}" could not be parsed.`);
			for (let i = 0; i < components.length; i++) if (components[i][0] === "\"" && components[i].slice(-1) === "\"") components[i] = components[i].slice(1, -1);
			return components;
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/pluggable-auth-client.js
var require_pluggable_auth_client = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PluggableAuthClient = exports.ExecutableError = void 0;
	var baseexternalclient_1 = require_baseexternalclient();
	var executable_response_1 = require_executable_response();
	var pluggable_auth_handler_1 = require_pluggable_auth_handler();
	var pluggable_auth_handler_2 = require_pluggable_auth_handler();
	Object.defineProperty(exports, "ExecutableError", {
		enumerable: true,
		get: function() {
			return pluggable_auth_handler_2.ExecutableError;
		}
	});
	/**
	* The default executable timeout when none is provided, in milliseconds.
	*/
	var DEFAULT_EXECUTABLE_TIMEOUT_MILLIS = 30 * 1e3;
	/**
	* The minimum allowed executable timeout in milliseconds.
	*/
	var MINIMUM_EXECUTABLE_TIMEOUT_MILLIS = 5 * 1e3;
	/**
	* The maximum allowed executable timeout in milliseconds.
	*/
	var MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS = 120 * 1e3;
	/**
	* The environment variable to check to see if executable can be run.
	* Value must be set to '1' for the executable to run.
	*/
	var GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES = "GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES";
	/**
	* The maximum currently supported executable version.
	*/
	var MAXIMUM_EXECUTABLE_VERSION = 1;
	/**
	* PluggableAuthClient enables the exchange of workload identity pool external credentials for
	* Google access tokens by retrieving 3rd party tokens through a user supplied executable. These
	* scripts/executables are completely independent of the Google Cloud Auth libraries. These
	* credentials plug into ADC and will call the specified executable to retrieve the 3rd party token
	* to be exchanged for a Google access token.
	*
	* <p>To use these credentials, the GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES environment variable
	* must be set to '1'. This is for security reasons.
	*
	* <p>Both OIDC and SAML are supported. The executable must adhere to a specific response format
	* defined below.
	*
	* <p>The executable must print out the 3rd party token to STDOUT in JSON format. When an
	* output_file is specified in the credential configuration, the executable must also handle writing the
	* JSON response to this file.
	*
	* <pre>
	* OIDC response sample:
	* {
	*   "version": 1,
	*   "success": true,
	*   "token_type": "urn:ietf:params:oauth:token-type:id_token",
	*   "id_token": "HEADER.PAYLOAD.SIGNATURE",
	*   "expiration_time": 1620433341
	* }
	*
	* SAML2 response sample:
	* {
	*   "version": 1,
	*   "success": true,
	*   "token_type": "urn:ietf:params:oauth:token-type:saml2",
	*   "saml_response": "...",
	*   "expiration_time": 1620433341
	* }
	*
	* Error response sample:
	* {
	*   "version": 1,
	*   "success": false,
	*   "code": "401",
	*   "message": "Error message."
	* }
	* </pre>
	*
	* <p>The "expiration_time" field in the JSON response is only required for successful
	* responses when an output file was specified in the credential configuration
	*
	* <p>The auth libraries will populate certain environment variables that will be accessible by the
	* executable, such as: GOOGLE_EXTERNAL_ACCOUNT_AUDIENCE, GOOGLE_EXTERNAL_ACCOUNT_TOKEN_TYPE,
	* GOOGLE_EXTERNAL_ACCOUNT_INTERACTIVE, GOOGLE_EXTERNAL_ACCOUNT_IMPERSONATED_EMAIL, and
	* GOOGLE_EXTERNAL_ACCOUNT_OUTPUT_FILE.
	*
	* <p>Please see this repositories README for a complete executable request/response specification.
	*/
	var PluggableAuthClient = class extends baseexternalclient_1.BaseExternalAccountClient {
		/**
		* The command used to retrieve the third party token.
		*/
		command;
		/**
		* The timeout in milliseconds for running executable,
		* set to default if none provided.
		*/
		timeoutMillis;
		/**
		* The path to file to check for cached executable response.
		*/
		outputFile;
		/**
		* Executable and output file handler.
		*/
		handler;
		/**
		* Instantiates a PluggableAuthClient instance using the provided JSON
		* object loaded from an external account credentials file.
		* An error is thrown if the credential is not a valid pluggable auth credential.
		* @param options The external account options object typically loaded from
		*   the external account JSON credential file.
		*/
		constructor(options) {
			super(options);
			if (!options.credential_source.executable) throw new Error("No valid Pluggable Auth \"credential_source\" provided.");
			this.command = options.credential_source.executable.command;
			if (!this.command) throw new Error("No valid Pluggable Auth \"credential_source\" provided.");
			if (options.credential_source.executable.timeout_millis === void 0) this.timeoutMillis = DEFAULT_EXECUTABLE_TIMEOUT_MILLIS;
			else {
				this.timeoutMillis = options.credential_source.executable.timeout_millis;
				if (this.timeoutMillis < MINIMUM_EXECUTABLE_TIMEOUT_MILLIS || this.timeoutMillis > MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS) throw new Error(`Timeout must be between ${MINIMUM_EXECUTABLE_TIMEOUT_MILLIS} and ${MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS} milliseconds.`);
			}
			this.outputFile = options.credential_source.executable.output_file;
			this.handler = new pluggable_auth_handler_1.PluggableAuthHandler({
				command: this.command,
				timeoutMillis: this.timeoutMillis,
				outputFile: this.outputFile
			});
			this.credentialSourceType = "executable";
		}
		/**
		* Triggered when an external subject token is needed to be exchanged for a
		* GCP access token via GCP STS endpoint.
		* This uses the `options.credential_source` object to figure out how
		* to retrieve the token using the current environment. In this case,
		* this calls a user provided executable which returns the subject token.
		* The logic is summarized as:
		* 1. Validated that the executable is allowed to run. The
		*    GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES environment must be set to
		*    1 for security reasons.
		* 2. If an output file is specified by the user, check the file location
		*    for a response. If the file exists and contains a valid response,
		*    return the subject token from the file.
		* 3. Call the provided executable and return response.
		* @return A promise that resolves with the external subject token.
		*/
		async retrieveSubjectToken() {
			if (process.env[GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES] !== "1") throw new Error("Pluggable Auth executables need to be explicitly allowed to run by setting the GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES environment Variable to 1.");
			let executableResponse = void 0;
			if (this.outputFile) executableResponse = await this.handler.retrieveCachedResponse();
			if (!executableResponse) {
				const envMap = /* @__PURE__ */ new Map();
				envMap.set("GOOGLE_EXTERNAL_ACCOUNT_AUDIENCE", this.audience);
				envMap.set("GOOGLE_EXTERNAL_ACCOUNT_TOKEN_TYPE", this.subjectTokenType);
				envMap.set("GOOGLE_EXTERNAL_ACCOUNT_INTERACTIVE", "0");
				if (this.outputFile) envMap.set("GOOGLE_EXTERNAL_ACCOUNT_OUTPUT_FILE", this.outputFile);
				const serviceAccountEmail = this.getServiceAccountEmail();
				if (serviceAccountEmail) envMap.set("GOOGLE_EXTERNAL_ACCOUNT_IMPERSONATED_EMAIL", serviceAccountEmail);
				executableResponse = await this.handler.retrieveResponseFromExecutable(envMap);
			}
			if (executableResponse.version > MAXIMUM_EXECUTABLE_VERSION) throw new Error(`Version of executable is not currently supported, maximum supported version is ${MAXIMUM_EXECUTABLE_VERSION}.`);
			if (!executableResponse.success) throw new pluggable_auth_handler_1.ExecutableError(executableResponse.errorMessage, executableResponse.errorCode);
			if (this.outputFile) {
				if (!executableResponse.expirationTime) throw new executable_response_1.InvalidExpirationTimeFieldError("The executable response must contain the `expiration_time` field for successful responses when an output_file has been specified in the configuration.");
			}
			if (executableResponse.isExpired()) throw new Error("Executable response is expired.");
			return executableResponse.subjectToken;
		}
	};
	exports.PluggableAuthClient = PluggableAuthClient;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/externalclient.js
var require_externalclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ExternalAccountClient = void 0;
	var baseexternalclient_1 = require_baseexternalclient();
	var identitypoolclient_1 = require_identitypoolclient();
	var awsclient_1 = require_awsclient();
	var pluggable_auth_client_1 = require_pluggable_auth_client();
	/**
	* Dummy class with no constructor. Developers are expected to use fromJSON.
	*/
	var ExternalAccountClient = class {
		constructor() {
			throw new Error("ExternalAccountClients should be initialized via: ExternalAccountClient.fromJSON(), directly via explicit constructors, eg. new AwsClient(options), new IdentityPoolClient(options), newPluggableAuthClientOptions, or via new GoogleAuth(options).getClient()");
		}
		/**
		* This static method will instantiate the
		* corresponding type of external account credential depending on the
		* underlying credential source.
		*
		* **IMPORTANT**: This method does not validate the credential configuration.
		* A security risk occurs when a credential configuration configured with
		* malicious URLs is used. When the credential configuration is accepted from
		* an untrusted source, you should validate it before using it with this
		* method. For more details, see
		* https://cloud.google.com/docs/authentication/external/externally-sourced-credentials.
		*
		* @param options The external account options object typically loaded
		*   from the external account JSON credential file.
		* @return A BaseExternalAccountClient instance or null if the options
		*   provided do not correspond to an external account credential.
		*/
		static fromJSON(options) {
			if (options && options.type === baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) if (options.credential_source?.environment_id) return new awsclient_1.AwsClient(options);
			else if (options.credential_source?.executable) return new pluggable_auth_client_1.PluggableAuthClient(options);
			else return new identitypoolclient_1.IdentityPoolClient(options);
			else return null;
		}
	};
	exports.ExternalAccountClient = ExternalAccountClient;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/externalAccountAuthorizedUserClient.js
var require_externalAccountAuthorizedUserClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ExternalAccountAuthorizedUserClient = exports.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE = void 0;
	var authclient_1 = require_authclient();
	var oauth2common_1 = require_oauth2common();
	var gaxios_1 = require_src$3();
	var stream$1 = __require("stream");
	var baseexternalclient_1 = require_baseexternalclient();
	/**
	* The credentials JSON file type for external account authorized user clients.
	*/
	exports.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE = "external_account_authorized_user";
	var DEFAULT_TOKEN_URL = "https://sts.{universeDomain}/v1/oauthtoken";
	/**
	* Handler for token refresh requests sent to the token_url endpoint for external
	* authorized user credentials.
	*/
	var ExternalAccountAuthorizedUserHandler = class ExternalAccountAuthorizedUserHandler extends oauth2common_1.OAuthClientAuthHandler {
		#tokenRefreshEndpoint;
		/**
		* Initializes an ExternalAccountAuthorizedUserHandler instance.
		* @param url The URL of the token refresh endpoint.
		* @param transporter The transporter to use for the refresh request.
		* @param clientAuthentication The client authentication credentials to use
		*   for the refresh request.
		*/
		constructor(options) {
			super(options);
			this.#tokenRefreshEndpoint = options.tokenRefreshEndpoint;
		}
		/**
		* Requests a new access token from the token_url endpoint using the provided
		*   refresh token.
		* @param refreshToken The refresh token to use to generate a new access token.
		* @param additionalHeaders Optional additional headers to pass along the
		*   request.
		* @return A promise that resolves with the token refresh response containing
		*   the requested access token and its expiration time.
		*/
		async refreshToken(refreshToken, headers) {
			const opts = {
				...ExternalAccountAuthorizedUserHandler.RETRY_CONFIG,
				url: this.#tokenRefreshEndpoint,
				method: "POST",
				headers,
				data: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: refreshToken
				}),
				responseType: "json"
			};
			authclient_1.AuthClient.setMethodName(opts, "refreshToken");
			this.applyClientAuthenticationOptions(opts);
			try {
				const response = await this.transporter.request(opts);
				const tokenRefreshResponse = response.data;
				tokenRefreshResponse.res = response;
				return tokenRefreshResponse;
			} catch (error) {
				if (error instanceof gaxios_1.GaxiosError && error.response) throw (0, oauth2common_1.getErrorFromOAuthErrorResponse)(error.response.data, error);
				throw error;
			}
		}
	};
	/**
	* External Account Authorized User Client. This is used for OAuth2 credentials
	* sourced using external identities through Workforce Identity Federation.
	* Obtaining the initial access and refresh token can be done through the
	* Google Cloud CLI.
	*/
	var ExternalAccountAuthorizedUserClient = class extends authclient_1.AuthClient {
		cachedAccessToken;
		externalAccountAuthorizedUserHandler;
		refreshToken;
		/**
		* Instantiates an ExternalAccountAuthorizedUserClient instances using the
		* provided JSON object loaded from a credentials files.
		* An error is throws if the credential is not valid.
		* @param options The external account authorized user option object typically
		*   from the external accoutn authorized user JSON credential file.
		*/
		constructor(options) {
			super(options);
			if (options.universe_domain) this.universeDomain = options.universe_domain;
			this.refreshToken = options.refresh_token;
			const clientAuthentication = {
				confidentialClientType: "basic",
				clientId: options.client_id,
				clientSecret: options.client_secret
			};
			this.externalAccountAuthorizedUserHandler = new ExternalAccountAuthorizedUserHandler({
				tokenRefreshEndpoint: options.token_url ?? DEFAULT_TOKEN_URL.replace("{universeDomain}", this.universeDomain),
				transporter: this.transporter,
				clientAuthentication
			});
			this.cachedAccessToken = null;
			this.quotaProjectId = options.quota_project_id;
			if (typeof options?.eagerRefreshThresholdMillis !== "number") this.eagerRefreshThresholdMillis = baseexternalclient_1.EXPIRATION_TIME_OFFSET;
			else this.eagerRefreshThresholdMillis = options.eagerRefreshThresholdMillis;
			this.forceRefreshOnFailure = !!options?.forceRefreshOnFailure;
		}
		async getAccessToken() {
			if (!this.cachedAccessToken || this.isExpired(this.cachedAccessToken)) await this.refreshAccessTokenAsync();
			return {
				token: this.cachedAccessToken.access_token,
				res: this.cachedAccessToken.res
			};
		}
		async getRequestHeaders() {
			const accessTokenResponse = await this.getAccessToken();
			const headers = new Headers({ authorization: `Bearer ${accessTokenResponse.token}` });
			return this.addSharedMetadataHeaders(headers);
		}
		request(opts, callback) {
			if (callback) this.requestAsync(opts).then((r) => callback(null, r), (e) => {
				return callback(e, e.response);
			});
			else return this.requestAsync(opts);
		}
		/**
		* Authenticates the provided HTTP request, processes it and resolves with the
		* returned response.
		* @param opts The HTTP request options.
		* @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure.
		* @return A promise that resolves with the successful response.
		*/
		async requestAsync(opts, reAuthRetried = false) {
			let response;
			try {
				const requestHeaders = await this.getRequestHeaders();
				opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
				this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
				response = await this.transporter.request(opts);
			} catch (e) {
				const res = e.response;
				if (res) {
					const statusCode = res.status;
					const isReadableStream = res.config.data instanceof stream$1.Readable;
					if (!reAuthRetried && (statusCode === 401 || statusCode === 403) && !isReadableStream && this.forceRefreshOnFailure) {
						await this.refreshAccessTokenAsync();
						return await this.requestAsync(opts, true);
					}
				}
				throw e;
			}
			return response;
		}
		/**
		* Forces token refresh, even if unexpired tokens are currently cached.
		* @return A promise that resolves with the refreshed credential.
		*/
		async refreshAccessTokenAsync() {
			const refreshResponse = await this.externalAccountAuthorizedUserHandler.refreshToken(this.refreshToken);
			this.cachedAccessToken = {
				access_token: refreshResponse.access_token,
				expiry_date: (/* @__PURE__ */ new Date()).getTime() + refreshResponse.expires_in * 1e3,
				res: refreshResponse.res
			};
			if (refreshResponse.refresh_token !== void 0) this.refreshToken = refreshResponse.refresh_token;
			return this.cachedAccessToken;
		}
		/**
		* Returns whether the provided credentials are expired or not.
		* If there is no expiry time, assumes the token is not expired or expiring.
		* @param credentials The credentials to check for expiration.
		* @return Whether the credentials are expired or not.
		*/
		isExpired(credentials) {
			const now = (/* @__PURE__ */ new Date()).getTime();
			return credentials.expiry_date ? now >= credentials.expiry_date - this.eagerRefreshThresholdMillis : false;
		}
	};
	exports.ExternalAccountAuthorizedUserClient = ExternalAccountAuthorizedUserClient;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/gdchclient.js
var require_gdchclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GdchClient = exports.GDCH_SERVICE_ACCOUNT_TYPE = void 0;
	var crypto$1 = __require("crypto");
	var fs$1 = __require("fs");
	var https = __require("https");
	var oauth2client_1 = require_oauth2client();
	var DEFAULT_LIFETIME_IN_SECONDS = 3600;
	exports.GDCH_SERVICE_ACCOUNT_TYPE = "gdch_service_account";
	exports.GdchClient = class GdchClient extends oauth2client_1.OAuth2Client {
		projectId;
		privateKeyId;
		privateKey;
		serviceIdentityName;
		tokenServerUri;
		caCertPath;
		apiAudience;
		lifetime;
		gdchOptions;
		caAgentPromise;
		cachedCaCertPath;
		lastCaCertReadTime = 0;
		CA_CERT_TTL_MS = 300 * 1e3;
		constructor(options = {}) {
			super(options);
			this.gdchOptions = options;
			this.projectId = options.projectId || void 0;
			this.privateKeyId = options.privateKeyId;
			this.privateKey = options.privateKey;
			this.serviceIdentityName = options.serviceIdentityName;
			this.tokenServerUri = options.tokenServerUri;
			this.caCertPath = options.caCertPath;
			this.apiAudience = options.apiAudience;
			this.lifetime = options.lifetime || DEFAULT_LIFETIME_IN_SECONDS;
			this.credentials = {
				refresh_token: "gdch-placeholder",
				expiry_date: 1
			};
		}
		createWithGdchAudience(apiAudience) {
			if (!apiAudience) throw new Error("Audience cannot be null or empty for GDCH service account credentials.");
			return new GdchClient({
				...this.gdchOptions,
				projectId: this.projectId,
				privateKeyId: this.privateKeyId,
				privateKey: this.privateKey,
				serviceIdentityName: this.serviceIdentityName,
				tokenServerUri: this.tokenServerUri,
				caCertPath: this.caCertPath,
				lifetime: this.lifetime,
				apiAudience
			});
		}
		fromJSON(json) {
			if (!json) throw new Error("Must pass in a JSON object containing the GDCH credentials settings.");
			if (json.type !== exports.GDCH_SERVICE_ACCOUNT_TYPE) throw new Error(`The incoming JSON object does not have the "${exports.GDCH_SERVICE_ACCOUNT_TYPE}" type`);
			if (json.format_version !== "1") throw new Error("Only format version 1 is supported.");
			if (!json.project) throw new Error("The incoming JSON object does not contain a project field");
			if (!json.private_key_id) throw new Error("The incoming JSON object does not contain a private_key_id field");
			if (!json.private_key) throw new Error("The incoming JSON object does not contain a private_key field");
			if (!json.name) throw new Error("The incoming JSON object does not contain a name field");
			if (!json.token_uri) throw new Error("The incoming JSON object does not contain a token_uri field");
			this.projectId = json.project;
			this.privateKeyId = json.private_key_id;
			this.privateKey = json.private_key;
			this.serviceIdentityName = json.name;
			this.tokenServerUri = json.token_uri;
			this.caCertPath = json.ca_cert_path;
			this.gdchOptions = {
				...this.gdchOptions,
				projectId: json.project,
				privateKeyId: json.private_key_id,
				privateKey: json.private_key,
				serviceIdentityName: json.name,
				tokenServerUri: json.token_uri,
				caCertPath: json.ca_cert_path
			};
		}
		async refreshTokenNoCache() {
			if (!this.apiAudience) throw new Error("Audience cannot be null or empty for GDCH service account credentials. Specify the audience by calling createWithGdchAudience.");
			if (!this.privateKey) throw new Error("Private key is not configured for GDCH credentials.");
			if (!this.privateKeyId) throw new Error("Private key ID is not configured for GDCH credentials.");
			if (!this.projectId) throw new Error("Project is not configured for GDCH credentials.");
			if (!this.serviceIdentityName) throw new Error("Service identity name is not configured for GDCH credentials.");
			if (!this.tokenServerUri) throw new Error("Token server URI is not configured for GDCH credentials.");
			const assertion = this.createAssertion();
			const data = {
				audience: this.apiAudience,
				grant_type: "urn:ietf:params:oauth:token-type:token-exchange",
				requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
				subject_token: assertion,
				subject_token_type: "urn:k8s:params:oauth:token-type:serviceaccount"
			};
			const requestOpts = {
				url: this.tokenServerUri,
				method: "POST",
				headers: { "Content-Type": "application/json" },
				data,
				responseType: "json",
				timeout: 1e4,
				retry: true,
				retryConfig: {
					httpMethodsToRetry: ["POST"],
					statusCodesToRetry: [[500, 599]],
					noResponseRetries: 3
				}
			};
			if (this.caCertPath) requestOpts.agent = await this.getCaAgent();
			try {
				const res = await this.transporter.request(requestOpts);
				const tokenResponse = res.data;
				if (!tokenResponse.access_token) throw new Error("Token response did not contain an access_token.");
				if (!tokenResponse.expires_in) throw new Error("Token response did not contain an expires_in field.");
				const tokens = {
					access_token: tokenResponse.access_token,
					token_type: "STS-Bearer",
					expiry_date: Date.now() + tokenResponse.expires_in * 1e3
				};
				this.emit("tokens", tokens);
				return {
					res,
					tokens
				};
			} catch (e) {
				if (e && e.config && e.config.data) try {
					if (typeof e.config.data === "string") {
						const parsedData = JSON.parse(e.config.data);
						if (parsedData.subject_token) {
							parsedData.subject_token = "***REDACTED***";
							e.config.data = JSON.stringify(parsedData);
						}
					} else if (typeof e.config.data === "object" && e.config.data.subject_token) e.config.data.subject_token = "***REDACTED***";
				} catch {}
				if (e instanceof Error) e.message = `Error getting access token for GDCH service account: ${e.message}, iss: ${this.serviceIdentityName}`;
				throw e;
			}
		}
		createAssertion() {
			const header = {
				alg: "ES256",
				typ: "JWT",
				kid: this.privateKeyId
			};
			const issSub = `system:serviceaccount:${this.projectId}:${this.serviceIdentityName}`;
			const currentTime = Math.floor(Date.now() / 1e3);
			const payload = {
				iss: issSub,
				sub: issSub,
				iat: currentTime,
				exp: currentTime + this.lifetime,
				aud: this.tokenServerUri
			};
			const signingInput = `${this.base64UrlEncode(JSON.stringify(header))}.${this.base64UrlEncode(JSON.stringify(payload))}`;
			const signature = crypto$1.sign("sha256", Buffer.from(signingInput), {
				key: this.privateKey,
				dsaEncoding: "ieee-p1363"
			});
			return `${signingInput}.${this.base64UrlEncode(signature)}`;
		}
		async requestAsync(opts, retry = false) {
			if (this.caCertPath && !opts.agent) {
				const url = (opts.url || "").toString();
				if (!url.includes("googleapis.com") && !url.includes("google.com")) opts.agent = await this.getCaAgent();
			}
			return super.requestAsync(opts, retry);
		}
		getCaAgent() {
			if (!this.caCertPath) {
				this.caAgentPromise = void 0;
				this.cachedCaCertPath = void 0;
				this.lastCaCertReadTime = 0;
				return;
			}
			const now = Date.now();
			const isCacheExpired = now - this.lastCaCertReadTime > this.CA_CERT_TTL_MS;
			if (this.caAgentPromise && this.caCertPath === this.cachedCaCertPath && !isCacheExpired) return this.caAgentPromise;
			this.cachedCaCertPath = this.caCertPath;
			this.lastCaCertReadTime = now;
			const currentPath = this.caCertPath;
			this.caAgentPromise = (async () => {
				try {
					const ca = await fs$1.promises.readFile(currentPath);
					return new https.Agent({ ca });
				} catch (err) {
					if (this.cachedCaCertPath === currentPath) {
						this.caAgentPromise = void 0;
						this.cachedCaCertPath = void 0;
						this.lastCaCertReadTime = 0;
					}
					if (err instanceof Error) err.message = `Error reading certificate file from CA cert path, value '${currentPath}': ${err.message}`;
					throw err;
				}
			})();
			return this.caAgentPromise;
		}
		toJSON() {
			return {
				...this,
				privateKey: this.privateKey ? "***REDACTED***" : void 0,
				_clientSecret: this._clientSecret ? "***REDACTED***" : void 0,
				apiKey: this.apiKey ? "***REDACTED***" : void 0,
				gdchOptions: this.gdchOptions ? {
					...this.gdchOptions,
					privateKey: this.gdchOptions.privateKey ? "***REDACTED***" : void 0,
					clientSecret: this.gdchOptions.clientSecret ? "***REDACTED***" : void 0,
					client_secret: this.gdchOptions.client_secret ? "***REDACTED***" : void 0,
					apiKey: this.gdchOptions.apiKey ? "***REDACTED***" : void 0,
					credentials: this.gdchOptions.credentials ? {
						...this.gdchOptions.credentials,
						access_token: this.gdchOptions.credentials.access_token ? "***REDACTED***" : void 0,
						refresh_token: this.gdchOptions.credentials.refresh_token ? "***REDACTED***" : void 0
					} : void 0
				} : void 0,
				credentials: {
					...this.credentials,
					access_token: this.credentials?.access_token ? "***REDACTED***" : void 0,
					refresh_token: this.credentials?.refresh_token ? "***REDACTED***" : void 0
				}
			};
		}
		[Symbol.for("nodejs.util.inspect.custom")]() {
			return this.toJSON();
		}
		base64UrlEncode(str) {
			return (typeof str === "string" ? Buffer.from(str) : str).toString("base64url");
		}
	};
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/googleauth.js
var require_googleauth = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GoogleAuth = exports.GoogleAuthExceptionMessages = void 0;
	var child_process_1 = __require("child_process");
	var fs = __require("fs");
	var gaxios_1 = require_src$3();
	var gcpMetadata = require_src$1();
	var os = __require("os");
	var path = __require("path");
	var crypto_1 = require_crypto();
	var computeclient_1 = require_computeclient();
	var idtokenclient_1 = require_idtokenclient();
	var envDetect_1 = require_envDetect();
	var jwtclient_1 = require_jwtclient();
	var refreshclient_1 = require_refreshclient();
	var impersonated_1 = require_impersonated();
	var externalclient_1 = require_externalclient();
	var baseexternalclient_1 = require_baseexternalclient();
	var authclient_1 = require_authclient();
	var externalAccountAuthorizedUserClient_1 = require_externalAccountAuthorizedUserClient();
	var gdchclient_1 = require_gdchclient();
	var util_1 = require_util();
	exports.GoogleAuthExceptionMessages = {
		API_KEY_WITH_CREDENTIALS: "API Keys and Credentials are mutually exclusive authentication methods and cannot be used together.",
		NO_PROJECT_ID_FOUND: "Unable to detect a Project Id in the current environment. \nTo learn more about authentication and Google APIs, visit: \nhttps://cloud.google.com/docs/authentication/getting-started",
		NO_CREDENTIALS_FOUND: "Unable to find credentials in current environment. \nTo learn more about authentication and Google APIs, visit: \nhttps://cloud.google.com/docs/authentication/getting-started",
		NO_ADC_FOUND: "Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.",
		NO_UNIVERSE_DOMAIN_FOUND: "Unable to detect a Universe Domain in the current environment.\nTo learn more about Universe Domain retrieval, visit: \nhttps://cloud.google.com/compute/docs/metadata/predefined-metadata-keys"
	};
	var GoogleAuth = class {
		/**
		* Caches a value indicating whether the auth layer is running on Google
		* Compute Engine.
		* @private
		*/
		checkIsGCE = void 0;
		useJWTAccessWithScope;
		defaultServicePath;
		get isGCE() {
			return this.checkIsGCE;
		}
		_findProjectIdPromise;
		_cachedProjectId;
		jsonContent = null;
		apiKey;
		cachedCredential = null;
		/**
		* A pending {@link AuthClient}. Used for concurrent {@link GoogleAuth.getClient} calls.
		*/
		#pendingAuthClient = null;
		/**
		* Scopes populated by the client library by default. We differentiate between
		* these and user defined scopes when deciding whether to use a self-signed JWT.
		*/
		defaultScopes;
		keyFilename;
		scopes;
		clientOptions = {};
		/**
		* Configuration is resolved in the following order of precedence:
		* - {@link GoogleAuthOptions.credentials `credentials`}
		* - {@link GoogleAuthOptions.keyFilename `keyFilename`}
		* - {@link GoogleAuthOptions.keyFile `keyFile`}
		*
		* {@link GoogleAuthOptions.clientOptions `clientOptions`} are passed to the
		* {@link AuthClient `AuthClient`s}.
		*
		* @param opts
		*/
		constructor(opts = {}) {
			this._cachedProjectId = opts.projectId || null;
			this.cachedCredential = opts.authClient || null;
			this.keyFilename = opts.keyFilename || opts.keyFile;
			this.scopes = opts.scopes;
			this.clientOptions = opts.clientOptions || {};
			this.jsonContent = opts.credentials || null;
			this.apiKey = opts.apiKey || this.clientOptions.apiKey || null;
			if (this.apiKey && (this.jsonContent || this.clientOptions.credentials)) throw new RangeError(exports.GoogleAuthExceptionMessages.API_KEY_WITH_CREDENTIALS);
			if (opts.universeDomain) this.clientOptions.universeDomain = opts.universeDomain;
		}
		setGapicJWTValues(client) {
			client.defaultServicePath = this.defaultServicePath;
			client.useJWTAccessWithScope = this.useJWTAccessWithScope;
			client.defaultScopes = this.defaultScopes;
		}
		getProjectId(callback) {
			if (callback) this.getProjectIdAsync().then((r) => callback(null, r), callback);
			else return this.getProjectIdAsync();
		}
		/**
		* A temporary method for internal `getProjectId` usages where `null` is
		* acceptable. In a future major release, `getProjectId` should return `null`
		* (as the `Promise<string | null>` base signature describes) and this private
		* method should be removed.
		*
		* @returns Promise that resolves with project id (or `null`)
		*/
		async getProjectIdOptional() {
			try {
				return await this.getProjectId();
			} catch (e) {
				if (e instanceof Error && e.message === exports.GoogleAuthExceptionMessages.NO_PROJECT_ID_FOUND) return null;
				else throw e;
			}
		}
		/**
		* A private method for finding and caching a projectId.
		*
		* Supports environments in order of precedence:
		* - GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT environment variable
		* - GOOGLE_APPLICATION_CREDENTIALS JSON file
		* - Cloud SDK: `gcloud config config-helper --format json`
		* - GCE project ID from metadata server
		*
		* @returns projectId
		*/
		async findAndCacheProjectId() {
			let projectId = null;
			projectId ||= await this.getProductionProjectId();
			projectId ||= await this.getFileProjectId();
			projectId ||= await this.getDefaultServiceProjectId();
			projectId ||= await this.getGCEProjectId();
			projectId ||= await this.getExternalAccountClientProjectId();
			if (projectId) {
				this._cachedProjectId = projectId;
				return projectId;
			} else throw new Error(exports.GoogleAuthExceptionMessages.NO_PROJECT_ID_FOUND);
		}
		async getProjectIdAsync() {
			if (this._cachedProjectId) return this._cachedProjectId;
			if (!this._findProjectIdPromise) this._findProjectIdPromise = this.findAndCacheProjectId();
			return this._findProjectIdPromise;
		}
		/**
		* Retrieves a universe domain from the metadata server via
		* {@link gcpMetadata.universe}.
		*
		* @returns a universe domain
		*/
		async getUniverseDomainFromMetadataServer() {
			let universeDomain;
			try {
				universeDomain = await gcpMetadata.universe("universe-domain");
				universeDomain ||= authclient_1.DEFAULT_UNIVERSE;
			} catch (e) {
				if (e && e?.response?.status === 404) universeDomain = authclient_1.DEFAULT_UNIVERSE;
				else throw e;
			}
			return universeDomain;
		}
		/**
		* Retrieves, caches, and returns the universe domain in the following order
		* of precedence:
		* - The universe domain in {@link GoogleAuth.clientOptions}
		* - An existing or ADC {@link AuthClient}'s universe domain
		* - {@link gcpMetadata.universe}, if {@link Compute} client
		*
		* @returns The universe domain
		*/
		async getUniverseDomain() {
			let universeDomain = (0, util_1.originalOrCamelOptions)(this.clientOptions).get("universe_domain");
			try {
				universeDomain ??= (await this.getClient()).universeDomain;
			} catch {
				universeDomain ??= authclient_1.DEFAULT_UNIVERSE;
			}
			return universeDomain;
		}
		/**
		* @returns Any scopes (user-specified or default scopes specified by the
		*   client library) that need to be set on the current Auth client.
		*/
		getAnyScopes() {
			return this.scopes || this.defaultScopes;
		}
		getApplicationDefault(optionsOrCallback = {}, callback) {
			let options;
			if (typeof optionsOrCallback === "function") callback = optionsOrCallback;
			else options = optionsOrCallback;
			if (callback) this.getApplicationDefaultAsync(options).then((r) => callback(null, r.credential, r.projectId), callback);
			else return this.getApplicationDefaultAsync(options);
		}
		async getApplicationDefaultAsync(options = {}) {
			if (this.cachedCredential) return await this.#prepareAndCacheClient(this.cachedCredential, null);
			let credential;
			credential = await this._tryGetApplicationCredentialsFromEnvironmentVariable(options);
			if (credential) {
				if (credential instanceof jwtclient_1.JWT) credential.scopes = this.scopes;
				else if (credential instanceof baseexternalclient_1.BaseExternalAccountClient) credential.scopes = this.getAnyScopes();
				return await this.#prepareAndCacheClient(credential);
			}
			credential = await this._tryGetApplicationCredentialsFromWellKnownFile(options);
			if (credential) {
				if (credential instanceof jwtclient_1.JWT) credential.scopes = this.scopes;
				else if (credential instanceof baseexternalclient_1.BaseExternalAccountClient) credential.scopes = this.getAnyScopes();
				return await this.#prepareAndCacheClient(credential);
			}
			if (await this._checkIsGCE()) {
				options.scopes = this.getAnyScopes();
				return await this.#prepareAndCacheClient(new computeclient_1.Compute(options));
			}
			throw new Error(exports.GoogleAuthExceptionMessages.NO_ADC_FOUND);
		}
		async #prepareAndCacheClient(credential, quotaProjectIdOverride = process.env["GOOGLE_CLOUD_QUOTA_PROJECT"] || null) {
			const projectId = await this.getProjectIdOptional();
			if (quotaProjectIdOverride) credential.quotaProjectId = quotaProjectIdOverride;
			this.cachedCredential = credential;
			return {
				credential,
				projectId
			};
		}
		/**
		* Determines whether the auth layer is running on Google Compute Engine.
		* Checks for GCP Residency, then fallback to checking if metadata server
		* is available.
		*
		* @returns A promise that resolves with the boolean.
		* @api private
		*/
		async _checkIsGCE() {
			if (this.checkIsGCE === void 0) this.checkIsGCE = gcpMetadata.getGCPResidency() || await gcpMetadata.isAvailable();
			return this.checkIsGCE;
		}
		/**
		* Attempts to load default credentials from the environment variable path..
		* @returns Promise that resolves with the OAuth2Client or null.
		* @api private
		*/
		async _tryGetApplicationCredentialsFromEnvironmentVariable(options) {
			const credentialsPath = process.env["GOOGLE_APPLICATION_CREDENTIALS"] || process.env["google_application_credentials"];
			if (!credentialsPath || credentialsPath.length === 0) return null;
			try {
				return this._getApplicationCredentialsFromFilePath(credentialsPath, options);
			} catch (e) {
				if (e instanceof Error) e.message = `Unable to read the credential file specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable: ${e.message}`;
				throw e;
			}
		}
		/**
		* Attempts to load default credentials from a well-known file location
		* @return Promise that resolves with the OAuth2Client or null.
		* @api private
		*/
		async _tryGetApplicationCredentialsFromWellKnownFile(options) {
			let location = null;
			if (this._isWindows()) location = process.env["APPDATA"];
			else {
				const home = process.env["HOME"];
				if (home) location = path.join(home, ".config");
			}
			if (location) {
				location = path.join(location, "gcloud", "application_default_credentials.json");
				if (!fs.existsSync(location)) location = null;
			}
			if (!location) return null;
			return await this._getApplicationCredentialsFromFilePath(location, options);
		}
		/**
		* Attempts to load default credentials from a file at the given path..
		* @param filePath The path to the file to read.
		* @returns Promise that resolves with the OAuth2Client
		* @api private
		*/
		async _getApplicationCredentialsFromFilePath(filePath, options = {}) {
			if (!filePath || filePath.length === 0) throw new Error("The file path is invalid.");
			try {
				filePath = fs.realpathSync(filePath);
				if (!fs.lstatSync(filePath).isFile()) throw new Error();
			} catch (err) {
				if (err instanceof Error) err.message = `The file at ${filePath} does not exist, or it is not a file. ${err.message}`;
				throw err;
			}
			const readStream = fs.createReadStream(filePath);
			return this.fromStream(readStream, options);
		}
		/**
		* Create a credentials instance using a given impersonated input options.
		* @param json The impersonated input object.
		* @returns JWT or UserRefresh Client with data
		*/
		fromImpersonatedJSON(json) {
			if (!json) throw new Error("Must pass in a JSON object containing an  impersonated refresh token");
			if (json.type !== impersonated_1.IMPERSONATED_ACCOUNT_TYPE) throw new Error(`The incoming JSON object does not have the "${impersonated_1.IMPERSONATED_ACCOUNT_TYPE}" type`);
			if (!json.source_credentials) throw new Error("The incoming JSON object does not contain a source_credentials field");
			if (!json.service_account_impersonation_url) throw new Error("The incoming JSON object does not contain a service_account_impersonation_url field");
			const sourceClient = this.fromJSON(json.source_credentials);
			if (json.service_account_impersonation_url?.length > 256)
 /**
			* Prevents DOS attacks.
			* @see {@link https://github.com/googleapis/google-auth-library-nodejs/security/code-scanning/85}
			**/
			throw new RangeError(`Target principal is too long: ${json.service_account_impersonation_url}`);
			const targetPrincipal = /(?<target>[^/]+):(generateAccessToken|generateIdToken)$/.exec(json.service_account_impersonation_url)?.groups?.target;
			if (!targetPrincipal) throw new RangeError(`Cannot extract target principal from ${json.service_account_impersonation_url}`);
			const targetScopes = (this.scopes || json.scopes || this.defaultScopes) ?? [];
			return new impersonated_1.Impersonated({
				...json,
				sourceClient,
				targetPrincipal,
				targetScopes: Array.isArray(targetScopes) ? targetScopes : [targetScopes]
			});
		}
		/**
		* Create a credentials instance using the given input options.
		* This client is not cached.
		*
		* **Important**: If you accept a credential configuration (credential JSON/File/Stream) from an external source for authentication to Google Cloud, you must validate it before providing it to any Google API or library. Providing an unvalidated credential configuration to Google APIs can compromise the security of your systems and data. For more information, refer to {@link https://cloud.google.com/docs/authentication/external/externally-sourced-credentials Validate credential configurations from external sources}.
		*
		* @deprecated This method is being deprecated because of a potential security risk.
		*
		* This method does not validate the credential configuration. The security
		* risk occurs when a credential configuration is accepted from a source that
		* is not under your control and used without validation on your side.
		*
		* If you know that you will be loading credential configurations of a
		* specific type, it is recommended to use a credential-type-specific
		* constructor. This will ensure that an unexpected credential type with
		* potential for malicious intent is not loaded unintentionally. You might
		* still have to do validation for certain credential types. Please follow
		* the recommendation for that method. For example, if you want to load only
		* service accounts, you can use the `JWT` constructor:
		* ```
		* const {JWT} = require('google-auth-library');
		* const keys = require('/path/to/key.json');
		* const client = new JWT({
		*   email: keys.client_email,
		*   key: keys.private_key,
		*   scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		* });
		* ```
		*
		* If you are loading your credential configuration from an untrusted source and have
		* not mitigated the risks (e.g. by validating the configuration yourself), make
		* these changes as soon as possible to prevent security risks to your environment.
		*
		* Regardless of the method used, it is always your responsibility to validate
		* configurations received from external sources.
		*
		* For more details, see https://cloud.google.com/docs/authentication/external/externally-sourced-credentials.
		*
		* @param json The input object.
		* @param options The JWT or UserRefresh options for the client
		* @returns JWT or UserRefresh Client with data
		*/
		fromJSON(json, options = {}) {
			let client;
			const preferredUniverseDomain = (0, util_1.originalOrCamelOptions)(options).get("universe_domain");
			if (json.type === refreshclient_1.USER_REFRESH_ACCOUNT_TYPE) {
				client = new refreshclient_1.UserRefreshClient(options);
				client.fromJSON(json);
			} else if (json.type === impersonated_1.IMPERSONATED_ACCOUNT_TYPE) client = this.fromImpersonatedJSON(json);
			else if (json.type === baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) {
				client = externalclient_1.ExternalAccountClient.fromJSON({
					...json,
					...options
				});
				client.scopes = this.getAnyScopes();
			} else if (json.type === externalAccountAuthorizedUserClient_1.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE) client = new externalAccountAuthorizedUserClient_1.ExternalAccountAuthorizedUserClient({
				...json,
				...options
			});
			else if (json.type === gdchclient_1.GDCH_SERVICE_ACCOUNT_TYPE) {
				client = new gdchclient_1.GdchClient(options);
				client.fromJSON(json);
			} else {
				options.scopes = this.scopes;
				client = new jwtclient_1.JWT(options);
				this.setGapicJWTValues(client);
				client.fromJSON(json);
			}
			if (preferredUniverseDomain) client.universeDomain = preferredUniverseDomain;
			return client;
		}
		/**
		* Return a JWT or UserRefreshClient from JavaScript object, caching both the
		* object used to instantiate and the client.
		* @param json The input object.
		* @param options The JWT or UserRefresh options for the client
		* @returns JWT or UserRefresh Client with data
		*/
		_cacheClientFromJSON(json, options) {
			const client = this.fromJSON(json, options);
			this.jsonContent = json;
			this.cachedCredential = client;
			return client;
		}
		fromStream(inputStream, optionsOrCallback = {}, callback) {
			let options = {};
			if (typeof optionsOrCallback === "function") callback = optionsOrCallback;
			else options = optionsOrCallback;
			if (callback) this.fromStreamAsync(inputStream, options).then((r) => callback(null, r), callback);
			else return this.fromStreamAsync(inputStream, options);
		}
		fromStreamAsync(inputStream, options) {
			return new Promise((resolve, reject) => {
				if (!inputStream) throw new Error("Must pass in a stream containing the Google auth settings.");
				const chunks = [];
				inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => chunks.push(chunk)).on("end", () => {
					try {
						try {
							const data = JSON.parse(chunks.join(""));
							return resolve(this._cacheClientFromJSON(data, options));
						} catch (err) {
							if (!this.keyFilename) throw err;
							const client = new jwtclient_1.JWT({
								...this.clientOptions,
								keyFile: this.keyFilename
							});
							this.cachedCredential = client;
							this.setGapicJWTValues(client);
							return resolve(client);
						}
					} catch (err) {
						return reject(err);
					}
				});
			});
		}
		/**
		* Create a credentials instance using the given API key string.
		* The created client is not cached. In order to create and cache it use the {@link GoogleAuth.getClient `getClient`} method after first providing an {@link GoogleAuth.apiKey `apiKey`}.
		*
		* @param apiKey The API key string
		* @param options An optional options object.
		* @returns A JWT loaded from the key
		*/
		fromAPIKey(apiKey, options = {}) {
			return new jwtclient_1.JWT({
				...options,
				apiKey
			});
		}
		/**
		* Determines whether the current operating system is Windows.
		* @api private
		*/
		_isWindows() {
			const sys = os.platform();
			if (sys && sys.length >= 3) {
				if (sys.substring(0, 3).toLowerCase() === "win") return true;
			}
			return false;
		}
		/**
		* Run the Google Cloud SDK command that prints the default project ID
		*/
		async getDefaultServiceProjectId() {
			return new Promise((resolve) => {
				(0, child_process_1.exec)("gcloud config config-helper --format json", (err, stdout) => {
					if (!err && stdout) try {
						const projectId = JSON.parse(stdout).configuration.properties.core.project;
						resolve(projectId);
						return;
					} catch (e) {}
					resolve(null);
				});
			});
		}
		/**
		* Loads the project id from environment variables.
		* @api private
		*/
		getProductionProjectId() {
			return process.env["GCLOUD_PROJECT"] || process.env["GOOGLE_CLOUD_PROJECT"] || process.env["gcloud_project"] || process.env["google_cloud_project"];
		}
		/**
		* Loads the project id from the GOOGLE_APPLICATION_CREDENTIALS json file.
		* @api private
		*/
		async getFileProjectId() {
			if (this.cachedCredential) return this.cachedCredential.projectId;
			if (this.keyFilename) {
				const creds = await this.getClient();
				if (creds && creds.projectId) return creds.projectId;
			}
			const r = await this._tryGetApplicationCredentialsFromEnvironmentVariable();
			if (r) return r.projectId;
			else return null;
		}
		/**
		* Gets the project ID from external account client if available.
		*/
		async getExternalAccountClientProjectId() {
			if (!this.jsonContent || this.jsonContent.type !== baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) return null;
			return await (await this.getClient()).getProjectId();
		}
		/**
		* Gets the Compute Engine project ID if it can be inferred.
		*/
		async getGCEProjectId() {
			try {
				return await gcpMetadata.project("project-id");
			} catch (e) {
				return null;
			}
		}
		getCredentials(callback) {
			if (callback) this.getCredentialsAsync().then((r) => callback(null, r), callback);
			else return this.getCredentialsAsync();
		}
		async getCredentialsAsync() {
			const client = await this.getClient();
			if (client instanceof impersonated_1.Impersonated) return { client_email: client.getTargetPrincipal() };
			if (client instanceof baseexternalclient_1.BaseExternalAccountClient) {
				const serviceAccountEmail = client.getServiceAccountEmail();
				if (serviceAccountEmail) return {
					client_email: serviceAccountEmail,
					universe_domain: client.universeDomain
				};
			}
			if (this.jsonContent) return {
				client_email: this.jsonContent.client_email,
				private_key: this.jsonContent.private_key,
				universe_domain: this.jsonContent.universe_domain
			};
			if (await this._checkIsGCE()) {
				const [client_email, universe_domain] = await Promise.all([gcpMetadata.instance("service-accounts/default/email"), this.getUniverseDomain()]);
				return {
					client_email,
					universe_domain
				};
			}
			throw new Error(exports.GoogleAuthExceptionMessages.NO_CREDENTIALS_FOUND);
		}
		/**
		* Automatically obtain an {@link AuthClient `AuthClient`} based on the
		* provided configuration. If no options were passed, use Application
		* Default Credentials.
		*/
		async getClient() {
			if (this.cachedCredential) return this.cachedCredential;
			this.#pendingAuthClient = this.#pendingAuthClient || this.#determineClient();
			try {
				const client = await this.#pendingAuthClient;
				if (client instanceof gdchclient_1.GdchClient && !client.apiAudience) {
					const opts = this.clientOptions;
					const endpoint = opts.apiEndpoint || opts.servicePath;
					if (endpoint) {
						const formattedAudience = `${endpoint.startsWith("http") ? "" : "https://"}${endpoint}`.replace(/\/+$/, "");
						const newClient = client.createWithGdchAudience(formattedAudience);
						this.cachedCredential = newClient;
						return newClient;
					}
				}
				return client;
			} finally {
				this.#pendingAuthClient = null;
			}
		}
		async #determineClient() {
			if (this.jsonContent) return this._cacheClientFromJSON(this.jsonContent, this.clientOptions);
			else if (this.keyFilename) {
				const filePath = path.resolve(this.keyFilename);
				const stream = fs.createReadStream(filePath);
				return await this.fromStreamAsync(stream, this.clientOptions);
			} else if (this.apiKey) {
				const client = await this.fromAPIKey(this.apiKey, this.clientOptions);
				client.scopes = this.scopes;
				const { credential } = await this.#prepareAndCacheClient(client);
				return credential;
			} else {
				const { credential } = await this.getApplicationDefaultAsync(this.clientOptions);
				return credential;
			}
		}
		/**
		* Creates a client which will fetch an ID token for authorization.
		* @param targetAudience the audience for the fetched ID token.
		* @returns IdTokenClient for making HTTP calls authenticated with ID tokens.
		*/
		async getIdTokenClient(targetAudience) {
			const client = await this.getClient();
			if (!("fetchIdToken" in client)) throw new Error("Cannot fetch ID token in this environment, use GCE or set the GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account credentials JSON file.");
			return new idtokenclient_1.IdTokenClient({
				targetAudience,
				idTokenProvider: client
			});
		}
		/**
		* Automatically obtain application default credentials, and return
		* an access token for making requests.
		*/
		async getAccessToken() {
			return (await (await this.getClient()).getAccessToken()).token;
		}
		/**
		* Obtain the HTTP headers that will provide authorization for a given
		* request.
		*/
		async getRequestHeaders(url) {
			return (await this.getClient()).getRequestHeaders(url);
		}
		/**
		* Obtain credentials for a request, then attach the appropriate headers to
		* the request options.
		* @param opts Axios or Request options on which to attach the headers
		*/
		async authorizeRequest(opts = {}) {
			const url = opts.url;
			const headers = await (await this.getClient()).getRequestHeaders(url);
			opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers, headers);
			return opts;
		}
		/**
		* A {@link fetch `fetch`} compliant API for {@link GoogleAuth}.
		*
		* @see {@link GoogleAuth.request} for the classic method.
		*
		* @remarks
		*
		* This is useful as a drop-in replacement for `fetch` API usage.
		*
		* @example
		*
		* ```ts
		* const auth = new GoogleAuth();
		* const fetchWithAuth: typeof fetch = (...args) => auth.fetch(...args);
		* await fetchWithAuth('https://example.com');
		* ```
		*
		* @param args `fetch` API or {@link Gaxios.fetch `Gaxios#fetch`} parameters
		* @returns the {@link GaxiosResponse} with Gaxios-added properties
		*/
		async fetch(...args) {
			return (await this.getClient()).fetch(...args);
		}
		/**
		* Automatically obtain application default credentials, and make an
		* HTTP request using the given options.
		*
		* @see {@link GoogleAuth.fetch} for the modern method.
		*
		* @param opts Axios request options for the HTTP request.
		*/
		async request(opts) {
			return (await this.getClient()).request(opts);
		}
		/**
		* Determine the compute environment in which the code is running.
		*/
		getEnv() {
			return (0, envDetect_1.getEnv)();
		}
		/**
		* Sign the given data with the current private key, or go out
		* to the IAM API to sign it.
		* @param data The data to be signed.
		* @param endpoint A custom endpoint to use.
		*
		* @example
		* ```
		* sign('data', 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/');
		* ```
		*/
		async sign(data, endpoint) {
			const client = await this.getClient();
			const universe = await this.getUniverseDomain();
			endpoint = endpoint || `https://iamcredentials.${universe}/v1/projects/-/serviceAccounts/`;
			if (client instanceof impersonated_1.Impersonated) return (await client.sign(data)).signedBlob;
			const crypto = (0, crypto_1.createCrypto)();
			if (client instanceof jwtclient_1.JWT && client.key) return await crypto.sign(client.key, data);
			const creds = await this.getCredentials();
			if (!creds.client_email) throw new Error("Cannot sign data without `client_email`.");
			return this.signBlob(crypto, creds.client_email, data, endpoint);
		}
		async signBlob(crypto, emailOrUniqueId, data, endpoint) {
			const url = new URL(endpoint + `${emailOrUniqueId}:signBlob`);
			return (await this.request({
				method: "POST",
				url: url.href,
				data: { payload: crypto.encodeBase64StringUtf8(data) },
				retry: true,
				retryConfig: { httpMethodsToRetry: ["POST"] }
			})).data.signedBlob;
		}
	};
	exports.GoogleAuth = GoogleAuth;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/iam.js
var require_iam = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.IAMAuth = void 0;
	var IAMAuth = class {
		selector;
		token;
		/**
		* IAM credentials.
		*
		* @param selector the iam authority selector
		* @param token the token
		* @constructor
		*/
		constructor(selector, token) {
			this.selector = selector;
			this.token = token;
			this.selector = selector;
			this.token = token;
		}
		/**
		* Acquire the HTTP headers required to make an authenticated request.
		*/
		getRequestHeaders() {
			return {
				"x-goog-iam-authority-selector": this.selector,
				"x-goog-iam-authorization-token": this.token
			};
		}
	};
	exports.IAMAuth = IAMAuth;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/downscopedclient.js
var require_downscopedclient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DownscopedClient = exports.EXPIRATION_TIME_OFFSET = exports.MAX_ACCESS_BOUNDARY_RULES_COUNT = void 0;
	var gaxios_1 = require_src$3();
	var stream = __require("stream");
	var authclient_1 = require_authclient();
	var sts = require_stscredentials();
	/**
	* The required token exchange grant_type: rfc8693#section-2.1
	*/
	var STS_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange";
	/**
	* The requested token exchange requested_token_type: rfc8693#section-2.1
	*/
	var STS_REQUEST_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
	/**
	* The requested token exchange subject_token_type: rfc8693#section-2.1
	*/
	var STS_SUBJECT_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
	/**
	* The maximum number of access boundary rules a Credential Access Boundary
	* can contain.
	*/
	exports.MAX_ACCESS_BOUNDARY_RULES_COUNT = 10;
	/**
	* Offset to take into account network delays and server clock skews.
	*/
	exports.EXPIRATION_TIME_OFFSET = 300 * 1e3;
	/**
	* Defines a set of Google credentials that are downscoped from an existing set
	* of Google OAuth2 credentials. This is useful to restrict the Identity and
	* Access Management (IAM) permissions that a short-lived credential can use.
	* The common pattern of usage is to have a token broker with elevated access
	* generate these downscoped credentials from higher access source credentials
	* and pass the downscoped short-lived access tokens to a token consumer via
	* some secure authenticated channel for limited access to Google Cloud Storage
	* resources.
	*/
	var DownscopedClient = class extends authclient_1.AuthClient {
		authClient;
		credentialAccessBoundary;
		cachedDownscopedAccessToken;
		stsCredential;
		/**
		* Instantiates a downscoped client object using the provided source
		* AuthClient and credential access boundary rules.
		* To downscope permissions of a source AuthClient, a Credential Access
		* Boundary that specifies which resources the new credential can access, as
		* well as an upper bound on the permissions that are available on each
		* resource, has to be defined. A downscoped client can then be instantiated
		* using the source AuthClient and the Credential Access Boundary.
		* @param options the {@link DownscopedClientOptions `DownscopedClientOptions`} to use. Passing an `AuthClient` directly is **@DEPRECATED**.
		* @param credentialAccessBoundary **@DEPRECATED**. Provide a {@link DownscopedClientOptions `DownscopedClientOptions`} object in the first parameter instead.
		*/
		constructor(options, credentialAccessBoundary = { accessBoundary: { accessBoundaryRules: [] } }) {
			super(options instanceof authclient_1.AuthClient ? {} : options);
			if (options instanceof authclient_1.AuthClient) {
				this.authClient = options;
				this.credentialAccessBoundary = credentialAccessBoundary;
			} else {
				this.authClient = options.authClient;
				this.credentialAccessBoundary = options.credentialAccessBoundary;
			}
			if (this.credentialAccessBoundary.accessBoundary.accessBoundaryRules.length === 0) throw new Error("At least one access boundary rule needs to be defined.");
			else if (this.credentialAccessBoundary.accessBoundary.accessBoundaryRules.length > exports.MAX_ACCESS_BOUNDARY_RULES_COUNT) throw new Error(`The provided access boundary has more than ${exports.MAX_ACCESS_BOUNDARY_RULES_COUNT} access boundary rules.`);
			for (const rule of this.credentialAccessBoundary.accessBoundary.accessBoundaryRules) if (rule.availablePermissions.length === 0) throw new Error("At least one permission should be defined in access boundary rules.");
			this.stsCredential = new sts.StsCredentials({ tokenExchangeEndpoint: `https://sts.${this.universeDomain}/v1/token` });
			this.cachedDownscopedAccessToken = null;
		}
		/**
		* Provides a mechanism to inject Downscoped access tokens directly.
		* The expiry_date field is required to facilitate determination of the token
		* expiration which would make it easier for the token consumer to handle.
		* @param credentials The Credentials object to set on the current client.
		*/
		setCredentials(credentials) {
			if (!credentials.expiry_date) throw new Error("The access token expiry_date field is missing in the provided credentials.");
			super.setCredentials(credentials);
			this.cachedDownscopedAccessToken = credentials;
		}
		async getAccessToken() {
			if (!this.cachedDownscopedAccessToken || this.isExpired(this.cachedDownscopedAccessToken)) await this.refreshAccessTokenAsync();
			return {
				token: this.cachedDownscopedAccessToken.access_token,
				expirationTime: this.cachedDownscopedAccessToken.expiry_date,
				res: this.cachedDownscopedAccessToken.res
			};
		}
		/**
		* The main authentication interface. It takes an optional url which when
		* present is the endpoint being accessed, and returns a Promise which
		* resolves with authorization header fields.
		*
		* The result has the form:
		* { authorization: 'Bearer <access_token_value>' }
		*/
		async getRequestHeaders() {
			const accessTokenResponse = await this.getAccessToken();
			const headers = new Headers({ authorization: `Bearer ${accessTokenResponse.token}` });
			return this.addSharedMetadataHeaders(headers);
		}
		request(opts, callback) {
			if (callback) this.requestAsync(opts).then((r) => callback(null, r), (e) => {
				return callback(e, e.response);
			});
			else return this.requestAsync(opts);
		}
		/**
		* Authenticates the provided HTTP request, processes it and resolves with the
		* returned response.
		* @param opts The HTTP request options.
		* @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure
		* @return A promise that resolves with the successful response.
		*/
		async requestAsync(opts, reAuthRetried = false) {
			let response;
			try {
				const requestHeaders = await this.getRequestHeaders();
				opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
				this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
				response = await this.transporter.request(opts);
			} catch (e) {
				const res = e.response;
				if (res) {
					const statusCode = res.status;
					const isReadableStream = res.config.data instanceof stream.Readable;
					if (!reAuthRetried && (statusCode === 401 || statusCode === 403) && !isReadableStream && this.forceRefreshOnFailure) {
						await this.refreshAccessTokenAsync();
						return await this.requestAsync(opts, true);
					}
				}
				throw e;
			}
			return response;
		}
		/**
		* Forces token refresh, even if unexpired tokens are currently cached.
		* GCP access tokens are retrieved from authclient object/source credential.
		* Then GCP access tokens are exchanged for downscoped access tokens via the
		* token exchange endpoint.
		* @return A promise that resolves with the fresh downscoped access token.
		*/
		async refreshAccessTokenAsync() {
			const stsCredentialsOptions = {
				grantType: STS_GRANT_TYPE,
				requestedTokenType: STS_REQUEST_TOKEN_TYPE,
				subjectToken: (await this.authClient.getAccessToken()).token,
				subjectTokenType: STS_SUBJECT_TOKEN_TYPE
			};
			const stsResponse = await this.stsCredential.exchangeToken(stsCredentialsOptions, void 0, this.credentialAccessBoundary);
			/**
			* The STS endpoint will only return the expiration time for the downscoped
			* access token if the original access token represents a service account.
			* The downscoped token's expiration time will always match the source
			* credential expiration. When no expires_in is returned, we can copy the
			* source credential's expiration time.
			*/
			const sourceCredExpireDate = this.authClient.credentials?.expiry_date || null;
			const expiryDate = stsResponse.expires_in ? (/* @__PURE__ */ new Date()).getTime() + stsResponse.expires_in * 1e3 : sourceCredExpireDate;
			this.cachedDownscopedAccessToken = {
				access_token: stsResponse.access_token,
				expiry_date: expiryDate,
				res: stsResponse.res
			};
			this.credentials = {};
			Object.assign(this.credentials, this.cachedDownscopedAccessToken);
			delete this.credentials.res;
			this.emit("tokens", {
				refresh_token: null,
				expiry_date: this.cachedDownscopedAccessToken.expiry_date,
				access_token: this.cachedDownscopedAccessToken.access_token,
				token_type: "Bearer",
				id_token: null
			});
			return this.cachedDownscopedAccessToken;
		}
		/**
		* Returns whether the provided credentials are expired or not.
		* If there is no expiry time, assumes the token is not expired or expiring.
		* @param downscopedAccessToken The credentials to check for expiration.
		* @return Whether the credentials are expired or not.
		*/
		isExpired(downscopedAccessToken) {
			const now = (/* @__PURE__ */ new Date()).getTime();
			return downscopedAccessToken.expiry_date ? now >= downscopedAccessToken.expiry_date - this.eagerRefreshThresholdMillis : false;
		}
	};
	exports.DownscopedClient = DownscopedClient;
}));
//#endregion
//#region node_modules/google-auth-library/build/src/auth/passthrough.js
var require_passthrough = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PassThroughClient = void 0;
	var authclient_1 = require_authclient();
	/**
	* An AuthClient without any Authentication information. Useful for:
	* - Anonymous access
	* - Local Emulators
	* - Testing Environments
	*
	*/
	var PassThroughClient = class extends authclient_1.AuthClient {
		/**
		* Creates a request without any authentication headers or checks.
		*
		* @remarks
		*
		* In testing environments it may be useful to change the provided
		* {@link AuthClient.transporter} for any desired request overrides/handling.
		*
		* @param opts
		* @returns The response of the request.
		*/
		async request(opts) {
			return this.transporter.request(opts);
		}
		/**
		* A required method of the base class.
		* Always will return an empty object.
		*
		* @returns {}
		*/
		async getAccessToken() {
			return {};
		}
		/**
		* A required method of the base class.
		* Always will return an empty object.
		*
		* @returns {}
		*/
		async getRequestHeaders() {
			return new Headers();
		}
	};
	exports.PassThroughClient = PassThroughClient;
}));
//#endregion
//#region node_modules/@ai-sdk/google-vertex/dist/index.js
var import_src = (/* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GoogleAuth = exports.auth = exports.GDCH_SERVICE_ACCOUNT_TYPE = exports.GdchClient = exports.PassThroughClient = exports.ExternalAccountAuthorizedUserClient = exports.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE = exports.ExecutableError = exports.PluggableAuthClient = exports.DownscopedClient = exports.BaseExternalAccountClient = exports.ExternalAccountClient = exports.IdentityPoolClient = exports.AwsRequestSigner = exports.AwsClient = exports.UserRefreshClient = exports.LoginTicket = exports.ClientAuthentication = exports.OAuth2Client = exports.CodeChallengeMethod = exports.Impersonated = exports.JWT = exports.JWTAccess = exports.IdTokenClient = exports.IAMAuth = exports.GCPEnv = exports.Compute = exports.DEFAULT_UNIVERSE = exports.AuthClient = exports.gaxios = exports.gcpMetadata = void 0;
	var googleauth_1 = require_googleauth();
	Object.defineProperty(exports, "GoogleAuth", {
		enumerable: true,
		get: function() {
			return googleauth_1.GoogleAuth;
		}
	});
	exports.gcpMetadata = require_src$1();
	exports.gaxios = require_src$3();
	var authclient_1 = require_authclient();
	Object.defineProperty(exports, "AuthClient", {
		enumerable: true,
		get: function() {
			return authclient_1.AuthClient;
		}
	});
	Object.defineProperty(exports, "DEFAULT_UNIVERSE", {
		enumerable: true,
		get: function() {
			return authclient_1.DEFAULT_UNIVERSE;
		}
	});
	var computeclient_1 = require_computeclient();
	Object.defineProperty(exports, "Compute", {
		enumerable: true,
		get: function() {
			return computeclient_1.Compute;
		}
	});
	var envDetect_1 = require_envDetect();
	Object.defineProperty(exports, "GCPEnv", {
		enumerable: true,
		get: function() {
			return envDetect_1.GCPEnv;
		}
	});
	var iam_1 = require_iam();
	Object.defineProperty(exports, "IAMAuth", {
		enumerable: true,
		get: function() {
			return iam_1.IAMAuth;
		}
	});
	var idtokenclient_1 = require_idtokenclient();
	Object.defineProperty(exports, "IdTokenClient", {
		enumerable: true,
		get: function() {
			return idtokenclient_1.IdTokenClient;
		}
	});
	var jwtaccess_1 = require_jwtaccess();
	Object.defineProperty(exports, "JWTAccess", {
		enumerable: true,
		get: function() {
			return jwtaccess_1.JWTAccess;
		}
	});
	var jwtclient_1 = require_jwtclient();
	Object.defineProperty(exports, "JWT", {
		enumerable: true,
		get: function() {
			return jwtclient_1.JWT;
		}
	});
	var impersonated_1 = require_impersonated();
	Object.defineProperty(exports, "Impersonated", {
		enumerable: true,
		get: function() {
			return impersonated_1.Impersonated;
		}
	});
	var oauth2client_1 = require_oauth2client();
	Object.defineProperty(exports, "CodeChallengeMethod", {
		enumerable: true,
		get: function() {
			return oauth2client_1.CodeChallengeMethod;
		}
	});
	Object.defineProperty(exports, "OAuth2Client", {
		enumerable: true,
		get: function() {
			return oauth2client_1.OAuth2Client;
		}
	});
	Object.defineProperty(exports, "ClientAuthentication", {
		enumerable: true,
		get: function() {
			return oauth2client_1.ClientAuthentication;
		}
	});
	var loginticket_1 = require_loginticket();
	Object.defineProperty(exports, "LoginTicket", {
		enumerable: true,
		get: function() {
			return loginticket_1.LoginTicket;
		}
	});
	var refreshclient_1 = require_refreshclient();
	Object.defineProperty(exports, "UserRefreshClient", {
		enumerable: true,
		get: function() {
			return refreshclient_1.UserRefreshClient;
		}
	});
	var awsclient_1 = require_awsclient();
	Object.defineProperty(exports, "AwsClient", {
		enumerable: true,
		get: function() {
			return awsclient_1.AwsClient;
		}
	});
	var awsrequestsigner_1 = require_awsrequestsigner();
	Object.defineProperty(exports, "AwsRequestSigner", {
		enumerable: true,
		get: function() {
			return awsrequestsigner_1.AwsRequestSigner;
		}
	});
	var identitypoolclient_1 = require_identitypoolclient();
	Object.defineProperty(exports, "IdentityPoolClient", {
		enumerable: true,
		get: function() {
			return identitypoolclient_1.IdentityPoolClient;
		}
	});
	var externalclient_1 = require_externalclient();
	Object.defineProperty(exports, "ExternalAccountClient", {
		enumerable: true,
		get: function() {
			return externalclient_1.ExternalAccountClient;
		}
	});
	var baseexternalclient_1 = require_baseexternalclient();
	Object.defineProperty(exports, "BaseExternalAccountClient", {
		enumerable: true,
		get: function() {
			return baseexternalclient_1.BaseExternalAccountClient;
		}
	});
	var downscopedclient_1 = require_downscopedclient();
	Object.defineProperty(exports, "DownscopedClient", {
		enumerable: true,
		get: function() {
			return downscopedclient_1.DownscopedClient;
		}
	});
	var pluggable_auth_client_1 = require_pluggable_auth_client();
	Object.defineProperty(exports, "PluggableAuthClient", {
		enumerable: true,
		get: function() {
			return pluggable_auth_client_1.PluggableAuthClient;
		}
	});
	Object.defineProperty(exports, "ExecutableError", {
		enumerable: true,
		get: function() {
			return pluggable_auth_client_1.ExecutableError;
		}
	});
	var externalAccountAuthorizedUserClient_1 = require_externalAccountAuthorizedUserClient();
	Object.defineProperty(exports, "EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE", {
		enumerable: true,
		get: function() {
			return externalAccountAuthorizedUserClient_1.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE;
		}
	});
	Object.defineProperty(exports, "ExternalAccountAuthorizedUserClient", {
		enumerable: true,
		get: function() {
			return externalAccountAuthorizedUserClient_1.ExternalAccountAuthorizedUserClient;
		}
	});
	var passthrough_1 = require_passthrough();
	Object.defineProperty(exports, "PassThroughClient", {
		enumerable: true,
		get: function() {
			return passthrough_1.PassThroughClient;
		}
	});
	var gdchclient_1 = require_gdchclient();
	Object.defineProperty(exports, "GdchClient", {
		enumerable: true,
		get: function() {
			return gdchclient_1.GdchClient;
		}
	});
	Object.defineProperty(exports, "GDCH_SERVICE_ACCOUNT_TYPE", {
		enumerable: true,
		get: function() {
			return gdchclient_1.GDCH_SERVICE_ACCOUNT_TYPE;
		}
	});
	__exportStar(require_googleToken(), exports);
	exports.auth = new googleauth_1.GoogleAuth();
})))();
function createAuthTokenGenerator(options) {
	const auth = new import_src.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/cloud-platform"],
		...options
	});
	return async function generateAuthToken() {
		var _a;
		const token = await (await auth.getClient()).getAccessToken();
		return (_a = token == null ? void 0 : token.token) != null ? _a : null;
	};
}
var VERSION = "5.0.14";
var googleVertexFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: object({ error: object({
		code: number().nullable(),
		message: string(),
		status: string()
	}) }),
	errorToMessage: (data) => data.error.message
});
var googleVertexEmbeddingModelOptions = object({
	/**
	* Optional. Optional reduced dimension for the output embedding.
	* If set, excessive values in the output embedding are truncated from the end.
	*/
	outputDimensionality: number().optional(),
	/**
	* Optional. Specifies the task type for generating embeddings.
	* Supported task types:
	* - SEMANTIC_SIMILARITY: Optimized for text similarity.
	* - CLASSIFICATION: Optimized for text classification.
	* - CLUSTERING: Optimized for clustering texts based on similarity.
	* - RETRIEVAL_DOCUMENT: Optimized for document retrieval.
	* - RETRIEVAL_QUERY: Optimized for query-based retrieval.
	* - QUESTION_ANSWERING: Optimized for answering questions.
	* - FACT_VERIFICATION: Optimized for verifying factual information.
	* - CODE_RETRIEVAL_QUERY: Optimized for retrieving code blocks based on natural language queries.
	*/
	taskType: _enum([
		"SEMANTIC_SIMILARITY",
		"CLASSIFICATION",
		"CLUSTERING",
		"RETRIEVAL_DOCUMENT",
		"RETRIEVAL_QUERY",
		"QUESTION_ANSWERING",
		"FACT_VERIFICATION",
		"CODE_RETRIEVAL_QUERY"
	]).optional(),
	/**
	* Optional. The title of the document being embedded.
	* Only valid when task_type is set to 'RETRIEVAL_DOCUMENT'.
	* Helps the model produce better embeddings by providing additional context.
	*/
	title: string().optional(),
	/**
	* Optional. When set to true, input text will be truncated. When set to false,
	* an error is returned if the input text is longer than the maximum length supported by the model. Defaults to true.
	*/
	autoTruncate: boolean().optional()
});
var GoogleVertexEmbeddingModel = class _GoogleVertexEmbeddingModel {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		this.supportsParallelCalls = true;
		this.modelId = modelId;
		this.config = config;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new _GoogleVertexEmbeddingModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	get maxEmbeddingsPerCall() {
		return usesEmbedContentEndpoint(this.modelId) ? 1 : 2048;
	}
	async doEmbed({ values, headers, abortSignal, providerOptions }) {
		var _a;
		let googleOptions = await parseProviderOptions({
			provider: "googleVertex",
			providerOptions,
			schema: googleVertexEmbeddingModelOptions
		});
		if (googleOptions == null) googleOptions = await parseProviderOptions({
			provider: "vertex",
			providerOptions,
			schema: googleVertexEmbeddingModelOptions
		});
		if (googleOptions == null) googleOptions = await parseProviderOptions({
			provider: "google",
			providerOptions,
			schema: googleVertexEmbeddingModelOptions
		});
		googleOptions = googleOptions != null ? googleOptions : {};
		if (values.length > this.maxEmbeddingsPerCall) throw new TooManyEmbeddingValuesForCallError({
			provider: this.provider,
			modelId: this.modelId,
			maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
			values
		});
		const mergedHeaders = combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, headers);
		if (usesEmbedContentEndpoint(this.modelId)) {
			const { responseHeaders: responseHeaders2, value: response2, rawValue: rawValue2 } = await postJsonToApi({
				url: `${this.config.baseURL}/models/${this.modelId}:embedContent`,
				headers: mergedHeaders,
				body: {
					content: { parts: [{ text: values[0] }] },
					embedContentConfig: {
						outputDimensionality: googleOptions.outputDimensionality,
						taskType: googleOptions.taskType,
						title: googleOptions.title,
						autoTruncate: googleOptions.autoTruncate
					}
				},
				failedResponseHandler: googleVertexFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(googleVertexEmbedContentResponseSchema),
				abortSignal,
				fetch: this.config.fetch
			});
			return {
				warnings: [],
				embeddings: [response2.embedding.values],
				usage: ((_a = response2.usageMetadata) == null ? void 0 : _a.promptTokenCount) == null ? void 0 : { tokens: response2.usageMetadata.promptTokenCount },
				response: {
					headers: responseHeaders2,
					body: rawValue2
				}
			};
		}
		const { responseHeaders, value: response, rawValue } = await postJsonToApi({
			url: `${this.config.baseURL}/models/${this.modelId}:predict`,
			headers: mergedHeaders,
			body: {
				instances: values.map((value) => ({
					content: value,
					task_type: googleOptions.taskType,
					title: googleOptions.title
				})),
				parameters: {
					outputDimensionality: googleOptions.outputDimensionality,
					autoTruncate: googleOptions.autoTruncate
				}
			},
			failedResponseHandler: googleVertexFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleVertexTextEmbeddingResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			warnings: [],
			embeddings: response.predictions.map((prediction) => prediction.embeddings.values),
			usage: { tokens: response.predictions.reduce((tokenCount, prediction) => tokenCount + prediction.embeddings.statistics.token_count, 0) },
			response: {
				headers: responseHeaders,
				body: rawValue
			}
		};
	}
};
var googleVertexTextEmbeddingResponseSchema = object({ predictions: array(object({ embeddings: object({
	values: array(number()),
	statistics: object({ token_count: number() })
}) })) });
var googleVertexEmbedContentResponseSchema = object({
	embedding: object({ values: array(number()) }),
	usageMetadata: object({ promptTokenCount: number().nullish() }).nullish()
});
function usesEmbedContentEndpoint(modelId) {
	return modelId === "gemini-embedding-2" || modelId === "gemini-embedding-2-preview";
}
var googleVertexImageModelOptionsSchema = object({
	negativePrompt: string().nullish(),
	personGeneration: _enum([
		"dont_allow",
		"allow_adult",
		"allow_all"
	]).nullish(),
	safetySetting: _enum([
		"block_low_and_above",
		"block_medium_and_above",
		"block_only_high",
		"block_none"
	]).nullish(),
	addWatermark: boolean().nullish(),
	storageUri: string().nullish(),
	sampleImageSize: _enum(["1K", "2K"]).nullish(),
	/**
	* Configuration for image editing operations
	*/
	edit: object({
		/**
		* An integer that represents the number of sampling steps.
		* A higher value offers better image quality, a lower value offers better latency.
		* Try 35 steps to start. If the quality doesn't meet your requirements,
		* increase the value towards an upper limit of 75.
		*/
		baseSteps: number().nullish(),
		mode: _enum([
			"EDIT_MODE_INPAINT_INSERTION",
			"EDIT_MODE_INPAINT_REMOVAL",
			"EDIT_MODE_OUTPAINT",
			"EDIT_MODE_CONTROLLED_EDITING",
			"EDIT_MODE_PRODUCT_IMAGE",
			"EDIT_MODE_BGSWAP"
		]).nullish(),
		/**
		* The mask mode to use.
		* - `MASK_MODE_DEFAULT` - Default value for mask mode.
		* - `MASK_MODE_USER_PROVIDED` - User provided mask. No segmentation needed.
		* - `MASK_MODE_DETECTION_BOX` - Mask from detected bounding boxes.
		* - `MASK_MODE_CLOTHING_AREA` - Masks from segmenting the clothing area with open-vocab segmentation.
		* - `MASK_MODE_PARSED_PERSON` - Masks from segmenting the person body and clothing using the person-parsing model.
		*/
		maskMode: _enum([
			"MASK_MODE_DEFAULT",
			"MASK_MODE_USER_PROVIDED",
			"MASK_MODE_DETECTION_BOX",
			"MASK_MODE_CLOTHING_AREA",
			"MASK_MODE_PARSED_PERSON"
		]).nullish(),
		/**
		* Optional. A float value between 0 and 1, inclusive, that represents the
		* percentage of the image width to grow the mask by. Using dilation helps
		* compensate for imprecise masks. We recommend a value of 0.01.
		*/
		maskDilation: number().nullish()
	}).nullish()
});
var GoogleVertexImageModel = class _GoogleVertexImageModel {
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
		return new _GoogleVertexImageModel(options.modelId, options.config);
	}
	get maxImagesPerCall() {
		if (isGeminiModel(this.modelId)) return 10;
		return 4;
	}
	get provider() {
		return this.config.provider;
	}
	async doGenerate(options) {
		if (isGeminiModel(this.modelId)) return this.doGenerateGemini(options);
		return this.doGenerateImagen(options);
	}
	async doGenerateImagen({ prompt, n, size, aspectRatio, seed, providerOptions, headers, abortSignal, files, mask }) {
		var _a, _b, _c, _d, _e, _f;
		const warnings = [];
		if (size != null) warnings.push({
			type: "unsupported",
			feature: "size",
			details: "This model does not support the `size` option. Use `aspectRatio` instead."
		});
		const googleVertexImageOptions = (_a = await parseProviderOptions({
			provider: "googleVertex",
			providerOptions,
			schema: googleVertexImageModelOptionsSchema
		})) != null ? _a : await parseProviderOptions({
			provider: "vertex",
			providerOptions,
			schema: googleVertexImageModelOptionsSchema
		});
		const { edit, ...otherOptions } = googleVertexImageOptions != null ? googleVertexImageOptions : {};
		const { mode: editMode, baseSteps, maskMode, maskDilation } = edit != null ? edit : {};
		const isEditMode = files != null && files.length > 0;
		let body;
		if (isEditMode) {
			const referenceImages = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				referenceImages.push({
					referenceType: "REFERENCE_TYPE_RAW",
					referenceId: i + 1,
					referenceImage: { bytesBase64Encoded: getBase64Data(file) }
				});
			}
			if (mask != null) referenceImages.push({
				referenceType: "REFERENCE_TYPE_MASK",
				referenceId: files.length + 1,
				referenceImage: { bytesBase64Encoded: getBase64Data(mask) },
				maskImageConfig: {
					maskMode: maskMode != null ? maskMode : "MASK_MODE_USER_PROVIDED",
					...maskDilation != null ? { dilation: maskDilation } : {}
				}
			});
			body = {
				instances: [{
					prompt,
					referenceImages
				}],
				parameters: {
					sampleCount: n,
					...aspectRatio != null ? { aspectRatio } : {},
					...seed != null ? { seed } : {},
					editMode: editMode != null ? editMode : "EDIT_MODE_INPAINT_INSERTION",
					...baseSteps != null ? { editConfig: { baseSteps } } : {},
					...otherOptions
				}
			};
		} else body = {
			instances: [{ prompt }],
			parameters: {
				sampleCount: n,
				...aspectRatio != null ? { aspectRatio } : {},
				...seed != null ? { seed } : {},
				...otherOptions
			}
		};
		const currentDate = (_d = (_c = (_b = this.config._internal) == null ? void 0 : _b.currentDate) == null ? void 0 : _c.call(_b)) != null ? _d : /* @__PURE__ */ new Date();
		const { value: response, responseHeaders } = await postJsonToApi({
			url: `${this.config.baseURL}/models/${this.modelId}:predict`,
			headers: combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, headers),
			body,
			failedResponseHandler: googleVertexFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleVertexImageResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			images: (_f = (_e = response.predictions) == null ? void 0 : _e.map(({ bytesBase64Encoded }) => bytesBase64Encoded)) != null ? _f : [],
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			},
			providerMetadata: (() => {
				var _a2, _b2;
				const payload = { images: (_b2 = (_a2 = response.predictions) == null ? void 0 : _a2.map((prediction) => {
					const { prompt: revisedPrompt } = prediction;
					return { ...revisedPrompt != null && { revisedPrompt } };
				})) != null ? _b2 : [] };
				return {
					googleVertex: payload,
					vertex: payload
				};
			})()
		};
	}
	async doGenerateGemini({ prompt, n, size, aspectRatio, seed, providerOptions, headers, abortSignal, files, mask }) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i;
		const warnings = [];
		if (mask != null) throw new Error("Gemini image models do not support mask-based image editing.");
		if (n != null && n > 1) throw new Error("Gemini image models do not support generating a set number of images per call. Use n=1 or omit the n parameter.");
		if (size != null) warnings.push({
			type: "unsupported",
			feature: "size",
			details: "This model does not support the `size` option. Use `aspectRatio` instead."
		});
		const userContent = [];
		if (prompt != null) userContent.push({
			type: "text",
			text: prompt
		});
		if (files != null && files.length > 0) for (const file of files) if (file.type === "url") userContent.push({
			type: "file",
			data: {
				type: "url",
				url: new URL(file.url)
			},
			mediaType: "image/*"
		});
		else userContent.push({
			type: "file",
			data: {
				type: "data",
				data: typeof file.data === "string" ? file.data : new Uint8Array(file.data)
			},
			mediaType: file.mediaType
		});
		const languageModelPrompt = [{
			role: "user",
			content: userContent
		}];
		const languageModel = new GoogleLanguageModel(this.modelId, {
			provider: this.config.provider,
			baseURL: this.config.baseURL,
			headers: (_a = this.config.headers) != null ? _a : {},
			fetch: this.config.fetch,
			generateId: (_b = this.config.generateId) != null ? _b : generateId,
			supportedUrls: () => ({ "*": [/^https?:\/\/.*$/, /^gs:\/\/.*$/] })
		});
		const userVertexOptions = (_c = providerOptions == null ? void 0 : providerOptions.googleVertex) != null ? _c : providerOptions == null ? void 0 : providerOptions.vertex;
		const innerVertexOptions = {
			responseModalities: ["IMAGE"],
			imageConfig: aspectRatio ? { aspectRatio } : void 0,
			...userVertexOptions != null ? userVertexOptions : {}
		};
		const result = await languageModel.doGenerate({
			prompt: languageModelPrompt,
			seed,
			providerOptions: {
				googleVertex: innerVertexOptions,
				vertex: innerVertexOptions
			},
			headers,
			abortSignal
		});
		const currentDate = (_f = (_e = (_d = this.config._internal) == null ? void 0 : _d.currentDate) == null ? void 0 : _e.call(_d)) != null ? _f : /* @__PURE__ */ new Date();
		const images = [];
		for (const part of result.content) if (part.type === "file" && part.mediaType.startsWith("image/") && part.data.type === "data") images.push(convertToBase64(part.data.data));
		const geminiPayload = { images: images.map(() => ({})) };
		return {
			images,
			warnings,
			providerMetadata: {
				googleVertex: geminiPayload,
				vertex: geminiPayload
			},
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: (_g = result.response) == null ? void 0 : _g.headers
			},
			usage: result.usage ? {
				inputTokens: result.usage.inputTokens.total,
				outputTokens: result.usage.outputTokens.total,
				totalTokens: ((_h = result.usage.inputTokens.total) != null ? _h : 0) + ((_i = result.usage.outputTokens.total) != null ? _i : 0)
			} : void 0
		};
	}
};
function isGeminiModel(modelId) {
	return modelId.startsWith("gemini-");
}
var googleVertexImageResponseSchema = object({ predictions: array(object({
	bytesBase64Encoded: string(),
	mimeType: string(),
	prompt: string().nullish()
})).nullish() });
function getBase64Data(file) {
	if (file.type === "url") throw new Error("URL-based images are not supported for Google Vertex image editing. Please provide the image data directly.");
	if (typeof file.data === "string") return file.data;
	return convertUint8ArrayToBase64(file.data);
}
var googleVertexTools = {
	googleSearch: googleTools.googleSearch,
	enterpriseWebSearch: googleTools.enterpriseWebSearch,
	googleMaps: googleTools.googleMaps,
	urlContext: googleTools.urlContext,
	fileSearch: googleTools.fileSearch,
	codeExecution: googleTools.codeExecution,
	vertexRagStore: googleTools.vertexRagStore
};
var googleVertexTranscriptionProviderOptionsSchema = object({
	/**
	* BCP-47 language codes to recognize (e.g. `['en-US']`), or `['auto']` to let
	* Chirp auto-detect the spoken language. Defaults to `['auto']`. For
	* `telephony`, pass a supported explicit language code.
	*/
	languageCodes: array(string()).optional(),
	/**
	* Whether to add punctuation to the transcript. Defaults to `true`.
	*/
	enableAutomaticPunctuation: boolean().optional(),
	/**
	* Whether to include word-level timestamps. Defaults to `true` so the
	* transcription result can include segments.
	*
	* Enabling word-level timestamps can reduce transcription quality and speed
	* for Chirp models.
	*/
	enableWordTimeOffsets: boolean().optional(),
	/**
	* The Cloud Speech-to-Text region for the request (e.g. `'us'`, `'eu'`,
	* `'us-central1'`). Defaults to the provider `location`.
	*
	* Note: Speech-to-Text regions differ from Vertex AI regions. Chirp is only
	* available in specific Speech-to-Text regions and is not available in the
	* `global` location.
	*/
	region: string().optional()
});
function parseDurationSeconds(value) {
	if (value == null) return;
	const seconds = Number.parseFloat(value);
	return Number.isFinite(seconds) ? seconds : void 0;
}
function convertBcp47ToIso6391(value) {
	if (value == null) return;
	try {
		const language = new Intl.Locale(value).language;
		return language.length === 2 ? language : void 0;
	} catch (e) {
		return;
	}
}
var GoogleVertexTranscriptionModel = class _GoogleVertexTranscriptionModel {
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
		return new _GoogleVertexTranscriptionModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
		const currentDate = (_c = (_b = (_a = this.config._internal) == null ? void 0 : _a.currentDate) == null ? void 0 : _b.call(_a)) != null ? _c : /* @__PURE__ */ new Date();
		const warnings = [];
		let googleOptions;
		for (const provider of [
			"googleVertex",
			"vertex",
			"google"
		]) {
			googleOptions = await parseProviderOptions({
				provider,
				providerOptions: options.providerOptions,
				schema: googleVertexTranscriptionProviderOptionsSchema
			});
			if (googleOptions != null) break;
		}
		const region = (_d = googleOptions == null ? void 0 : googleOptions.region) != null ? _d : this.config.location;
		const languageCodes = (_e = googleOptions == null ? void 0 : googleOptions.languageCodes) != null ? _e : ["auto"];
		const content = typeof options.audio === "string" ? options.audio : convertUint8ArrayToBase64(options.audio);
		const requestBody = {
			config: {
				model: this.modelId,
				languageCodes,
				autoDecodingConfig: {},
				features: {
					enableWordTimeOffsets: (_f = googleOptions == null ? void 0 : googleOptions.enableWordTimeOffsets) != null ? _f : true,
					enableAutomaticPunctuation: (_g = googleOptions == null ? void 0 : googleOptions.enableAutomaticPunctuation) != null ? _g : true
				}
			},
			content
		};
		const { value: response, responseHeaders, rawValue: rawResponse } = await postJsonToApi({
			url: `https://${region === "global" ? "speech.googleapis.com" : `${region}-speech.googleapis.com`}/v2/projects/${this.config.project}/locations/${region}/recognizers/_:recognize`,
			headers: combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers),
			body: requestBody,
			failedResponseHandler: googleVertexFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(googleVertexTranscriptionResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const results = (_h = response.results) != null ? _h : [];
		return {
			text: results.map((result) => {
				var _a2, _b2, _c2;
				return (_c2 = (_b2 = (_a2 = result.alternatives) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.transcript) != null ? _c2 : "";
			}).join(" ").trim(),
			segments: results.flatMap((result) => {
				var _a2, _b2, _c2, _d2;
				return (_d2 = (_c2 = (_b2 = (_a2 = result.alternatives) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.words) == null ? void 0 : _c2.flatMap((word) => {
					const startSecond = parseDurationSeconds(word.startOffset);
					const endSecond = parseDurationSeconds(word.endOffset);
					return word.word == null || startSecond == null || endSecond == null ? [] : [{
						text: word.word,
						startSecond,
						endSecond
					}];
				})) != null ? _d2 : [];
			}),
			language: convertBcp47ToIso6391((_i = results[0]) == null ? void 0 : _i.languageCode),
			durationInSeconds: parseDurationSeconds((_j = response.metadata) == null ? void 0 : _j.totalBilledDuration),
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders,
				body: rawResponse
			}
		};
	}
};
var googleVertexTranscriptionResponseSchema = object({
	results: array(object({
		alternatives: array(object({
			transcript: string().nullish(),
			words: array(object({
				word: string().nullish(),
				startOffset: string().nullish(),
				endOffset: string().nullish()
			})).nullish()
		})).nullish(),
		languageCode: string().nullish()
	})).nullish(),
	metadata: object({ totalBilledDuration: string().nullish() }).nullish()
});
var googleVertexVideoModelOptionsSchema = lazySchema(() => zodSchema(looseObject({
	pollIntervalMs: number().positive().nullish(),
	pollTimeoutMs: number().positive().nullish(),
	personGeneration: _enum([
		"dont_allow",
		"allow_adult",
		"allow_all"
	]).nullish(),
	negativePrompt: string().nullish(),
	generateAudio: boolean().nullish(),
	gcsOutputDirectory: string().nullish(),
	referenceImages: array(object({
		bytesBase64Encoded: string().nullish(),
		gcsUri: string().nullish()
	})).nullish()
})));
function getFirstFrameImage(options) {
	var _a, _b;
	return (_b = (_a = options.frameImages) == null ? void 0 : _a.find((frame) => frame.frameType === "first_frame")) == null ? void 0 : _b.image;
}
function resolveStartImage(options) {
	var _a;
	return (_a = getFirstFrameImage(options)) != null ? _a : options.image;
}
function getLastFrameImage(options) {
	var _a, _b;
	return (_b = (_a = options.frameImages) == null ? void 0 : _a.find((frame) => frame.frameType === "last_frame")) == null ? void 0 : _b.image;
}
function getInputReferences(options) {
	if (options.frameImages != null && options.frameImages.length > 0) return;
	return options.inputReferences != null && options.inputReferences.length > 0 ? options.inputReferences : void 0;
}
function convertFileToVertexImage(file, warnings) {
	if (file.type === "url") {
		if (file.url.startsWith("gs://")) return {
			gcsUri: file.url,
			mimeType: "image/png"
		};
		warnings.push({
			type: "unsupported",
			feature: "URL-based image input",
			details: "Vertex AI video models require base64-encoded images or GCS URIs. URL will be ignored."
		});
		return;
	}
	return {
		bytesBase64Encoded: typeof file.data === "string" ? file.data : convertUint8ArrayToBase64(file.data),
		mimeType: file.mediaType || "image/png"
	};
}
function convertInputReferenceImage(file, warnings) {
	const image = convertFileToVertexImage(file, warnings);
	return image != null ? {
		image,
		referenceType: "asset"
	} : void 0;
}
var GoogleVertexVideoModel = class {
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
	}
	get provider() {
		return this.config.provider;
	}
	get maxVideosPerCall() {
		return 4;
	}
	async doGenerate(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h;
		const currentDate = (_c = (_b = (_a = this.config._internal) == null ? void 0 : _a.currentDate) == null ? void 0 : _b.call(_a)) != null ? _c : /* @__PURE__ */ new Date();
		const warnings = [];
		const googleVertexOptions = (_d = await parseProviderOptions({
			provider: "googleVertex",
			providerOptions: options.providerOptions,
			schema: googleVertexVideoModelOptionsSchema
		})) != null ? _d : await parseProviderOptions({
			provider: "vertex",
			providerOptions: options.providerOptions,
			schema: googleVertexVideoModelOptionsSchema
		});
		const instances = [{}];
		const instance = instances[0];
		if (options.prompt != null) instance.prompt = options.prompt;
		const startImage = resolveStartImage(options);
		if (startImage != null) {
			const image = convertFileToVertexImage(startImage, warnings);
			if (image != null) instance.image = image;
		}
		const lastFrameImage = getLastFrameImage(options);
		if (lastFrameImage != null) {
			const lastFrame = convertFileToVertexImage(lastFrameImage, warnings);
			if (lastFrame != null) instance.lastFrame = lastFrame;
		}
		const inputReferences = getInputReferences(options);
		if (inputReferences != null) instance.referenceImages = inputReferences.flatMap((reference) => {
			const converted = convertInputReferenceImage(reference, warnings);
			return converted != null ? [converted] : [];
		});
		else if ((googleVertexOptions == null ? void 0 : googleVertexOptions.referenceImages) != null) instance.referenceImages = googleVertexOptions.referenceImages;
		const parameters = { sampleCount: options.n };
		if (options.aspectRatio) parameters.aspectRatio = options.aspectRatio;
		if (options.resolution) parameters.resolution = {
			"1280x720": "720p",
			"1920x1080": "1080p",
			"3840x2160": "4k"
		}[options.resolution] || options.resolution;
		if (options.duration) parameters.durationSeconds = options.duration;
		if (options.seed) parameters.seed = options.seed;
		const generateAudio = (_e = options.generateAudio) != null ? _e : googleVertexOptions == null ? void 0 : googleVertexOptions.generateAudio;
		if (generateAudio != null) parameters.generateAudio = generateAudio;
		if (googleVertexOptions != null) {
			const opts = googleVertexOptions;
			if (opts.personGeneration !== void 0 && opts.personGeneration !== null) parameters.personGeneration = opts.personGeneration;
			if (opts.negativePrompt !== void 0 && opts.negativePrompt !== null) parameters.negativePrompt = opts.negativePrompt;
			if (opts.gcsOutputDirectory !== void 0 && opts.gcsOutputDirectory !== null) parameters.gcsOutputDirectory = opts.gcsOutputDirectory;
			for (const [key, value] of Object.entries(opts)) if (![
				"pollIntervalMs",
				"pollTimeoutMs",
				"personGeneration",
				"negativePrompt",
				"generateAudio",
				"gcsOutputDirectory",
				"referenceImages"
			].includes(key)) parameters[key] = value;
		}
		const { value: operation } = await postJsonToApi({
			url: `${this.config.baseURL}/models/${this.modelId}:predictLongRunning`,
			headers: combineHeaders(await resolve(this.config.headers), options.headers),
			body: {
				instances,
				parameters
			},
			successfulResponseHandler: createJsonResponseHandler(googleVertexOperationSchema),
			failedResponseHandler: googleVertexFailedResponseHandler,
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const operationName = operation.name;
		if (!operationName) throw new AISDKError({
			name: "VERTEX_VIDEO_GENERATION_ERROR",
			message: "No operation name returned from API"
		});
		const pollIntervalMs = (_f = googleVertexOptions == null ? void 0 : googleVertexOptions.pollIntervalMs) != null ? _f : 1e4;
		const pollTimeoutMs = (_g = googleVertexOptions == null ? void 0 : googleVertexOptions.pollTimeoutMs) != null ? _g : 6e5;
		const startTime = Date.now();
		let finalOperation = operation;
		let responseHeaders;
		while (!finalOperation.done) {
			if (Date.now() - startTime > pollTimeoutMs) throw new AISDKError({
				name: "VERTEX_VIDEO_GENERATION_TIMEOUT",
				message: `Video generation timed out after ${pollTimeoutMs}ms`
			});
			await delay(pollIntervalMs);
			if ((_h = options.abortSignal) == null ? void 0 : _h.aborted) throw new AISDKError({
				name: "VERTEX_VIDEO_GENERATION_ABORTED",
				message: "Video generation request was aborted"
			});
			const { value: statusOperation, responseHeaders: pollHeaders } = await postJsonToApi({
				url: `${this.config.baseURL}/models/${this.modelId}:fetchPredictOperation`,
				headers: combineHeaders(await resolve(this.config.headers), options.headers),
				body: { operationName },
				successfulResponseHandler: createJsonResponseHandler(googleVertexOperationSchema),
				failedResponseHandler: googleVertexFailedResponseHandler,
				abortSignal: options.abortSignal,
				fetch: this.config.fetch
			});
			finalOperation = statusOperation;
			responseHeaders = pollHeaders;
		}
		if (finalOperation.error) throw new AISDKError({
			name: "VERTEX_VIDEO_GENERATION_FAILED",
			message: `Video generation failed: ${finalOperation.error.message}`
		});
		const response = finalOperation.response;
		if (!(response == null ? void 0 : response.videos) || response.videos.length === 0) throw new AISDKError({
			name: "VERTEX_VIDEO_GENERATION_ERROR",
			message: `No videos in response. Response: ${JSON.stringify(finalOperation)}`
		});
		const videos = [];
		const videoMetadata = [];
		for (const video of response.videos) if (video.bytesBase64Encoded) {
			videos.push({
				type: "base64",
				data: video.bytesBase64Encoded,
				mediaType: video.mimeType || "video/mp4"
			});
			videoMetadata.push({ mimeType: video.mimeType });
		} else if (video.gcsUri) {
			videos.push({
				type: "url",
				url: video.gcsUri,
				mediaType: video.mimeType || "video/mp4"
			});
			videoMetadata.push({
				gcsUri: video.gcsUri,
				mimeType: video.mimeType
			});
		}
		if (videos.length === 0) throw new AISDKError({
			name: "VERTEX_VIDEO_GENERATION_ERROR",
			message: "No valid videos in response"
		});
		return {
			videos,
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			},
			providerMetadata: /* @__PURE__ */ (() => {
				const payload = { videos: videoMetadata };
				return {
					googleVertex: payload,
					"google-vertex": payload,
					vertex: payload
				};
			})()
		};
	}
};
var googleVertexOperationSchema = object({
	name: string().nullish(),
	done: boolean().nullish(),
	error: object({
		code: number().nullish(),
		message: string(),
		status: string().nullish()
	}).nullish(),
	response: object({
		videos: array(object({
			bytesBase64Encoded: string().nullish(),
			gcsUri: string().nullish(),
			mimeType: string().nullish()
		})).nullish(),
		raiMediaFilteredCount: number().nullish()
	}).nullish()
});
var EXPRESS_MODE_BASE_URL = "https://aiplatform.googleapis.com/v1/publishers/google";
var ENDPOINT_MODEL_PREFIX = "endpoints/";
function isEndpointModelId(modelId) {
	return modelId.startsWith(ENDPOINT_MODEL_PREFIX);
}
function createExpressModeFetch(apiKey, customFetch) {
	return async (url, init) => {
		const modifiedInit = {
			...init,
			headers: {
				...(init == null ? void 0 : init.headers) ? normalizeHeaders(init.headers) : {},
				"x-goog-api-key": apiKey
			}
		};
		return (customFetch != null ? customFetch : fetch)(url.toString(), modifiedInit);
	};
}
function createGoogleVertex(options = {}) {
	const apiKey = loadOptionalSetting({
		settingValue: options.apiKey,
		environmentVariableName: "GOOGLE_VERTEX_API_KEY"
	});
	const loadGoogleVertexProject = () => loadSetting({
		settingValue: options.project,
		settingName: "project",
		environmentVariableName: "GOOGLE_VERTEX_PROJECT",
		description: "Google Vertex project"
	});
	const loadGoogleVertexLocation = () => loadSetting({
		settingValue: options.location,
		settingName: "location",
		environmentVariableName: "GOOGLE_VERTEX_LOCATION",
		description: "Google Vertex location"
	});
	const loadBaseURL = ({ endpoint = false } = {}) => {
		var _a, _b;
		if (apiKey) return (_a = withoutTrailingSlash(options.baseURL)) != null ? _a : EXPRESS_MODE_BASE_URL;
		const region = loadGoogleVertexLocation();
		const project = loadGoogleVertexProject();
		const getHost = () => {
			if (region === "global") return "aiplatform.googleapis.com";
			else if (region === "eu" || region === "us") return `aiplatform.${region}.rep.googleapis.com`;
			else return `${region}-aiplatform.googleapis.com`;
		};
		return (_b = withoutTrailingSlash(options.baseURL)) != null ? _b : `https://${getHost()}/v1beta1/projects/${project}/locations/${region}${endpoint ? "" : "/publishers/google"}`;
	};
	const createConfig = (name, { endpoint = false } = {}) => {
		const getHeaders = async () => {
			var _a;
			return withUserAgentSuffix(await resolve((_a = options.headers) != null ? _a : {}), `ai-sdk/google-vertex/${VERSION}`);
		};
		return {
			provider: `google.vertex.${name}`,
			headers: getHeaders,
			fetch: apiKey ? createExpressModeFetch(apiKey, options.fetch) : options.fetch,
			baseURL: loadBaseURL({ endpoint })
		};
	};
	const createChatModel = (modelId) => {
		var _a;
		const endpoint = isEndpointModelId(modelId);
		if (endpoint && apiKey) throw new Error("Google Vertex tuned models do not support Express Mode API keys. Use standard Google Cloud credentials instead.");
		return new GoogleLanguageModel(modelId, {
			...createConfig("chat", { endpoint }),
			generateId: (_a = options.generateId) != null ? _a : generateId,
			supportedUrls: () => ({ "*": [/^https?:\/\/.*$/, /^gs:\/\/.*$/] })
		});
	};
	const createInteractionsModel = (modelIdOrAgent) => {
		var _a;
		if (apiKey) throw new Error("Google Vertex Interactions models do not support Express Mode API keys. Use standard Google Cloud credentials instead.");
		return new GoogleInteractionsLanguageModel(modelIdOrAgent, {
			...createConfig("interactions", { endpoint: true }),
			generateId: (_a = options.generateId) != null ? _a : generateId
		});
	};
	const createEmbeddingModel = (modelId) => new GoogleVertexEmbeddingModel(modelId, createConfig("embedding"));
	const createImageModel = (modelId) => {
		var _a;
		return new GoogleVertexImageModel(modelId, {
			...createConfig("image"),
			generateId: (_a = options.generateId) != null ? _a : generateId
		});
	};
	const createVideoModel = (modelId) => {
		var _a;
		return new GoogleVertexVideoModel(modelId, {
			...createConfig("video"),
			generateId: (_a = options.generateId) != null ? _a : generateId
		});
	};
	const createSpeechModel = (modelId) => new GoogleSpeechModel(modelId, createConfig("speech"));
	const createTranscriptionModel = (modelId) => {
		if (apiKey) throw new Error("Google Vertex transcription models do not support Express Mode API keys. Use standard Google Cloud credentials instead.");
		const config = createConfig("transcription");
		return new GoogleVertexTranscriptionModel(modelId, {
			provider: config.provider,
			headers: config.headers,
			fetch: config.fetch,
			project: loadGoogleVertexProject(),
			location: loadGoogleVertexLocation()
		});
	};
	const provider = function(modelId) {
		if (new.target) throw new Error("The Google Vertex AI model function cannot be called with the new keyword.");
		return createChatModel(modelId);
	};
	provider.specificationVersion = "v4";
	provider.languageModel = createChatModel;
	provider.interactions = createInteractionsModel;
	provider.embeddingModel = createEmbeddingModel;
	provider.textEmbeddingModel = createEmbeddingModel;
	provider.image = createImageModel;
	provider.imageModel = createImageModel;
	provider.video = createVideoModel;
	provider.videoModel = createVideoModel;
	provider.speech = createSpeechModel;
	provider.speechModel = createSpeechModel;
	provider.transcription = createTranscriptionModel;
	provider.transcriptionModel = createTranscriptionModel;
	provider.tools = googleVertexTools;
	return provider;
}
function createGoogleVertex2(options = {}) {
	if (loadOptionalSetting({
		settingValue: options.apiKey,
		environmentVariableName: "GOOGLE_VERTEX_API_KEY"
	})) return createGoogleVertex(options);
	const generateAuthToken = createAuthTokenGenerator(options.project == null ? options.googleAuthOptions : {
		projectId: options.project,
		...options.googleAuthOptions
	});
	return createGoogleVertex({
		...options,
		headers: async () => ({
			Authorization: `Bearer ${await generateAuthToken()}`,
			...await resolve(options.headers)
		})
	});
}
createGoogleVertex2();
//#endregion
export { createGoogleVertex2 as t };
