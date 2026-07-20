import { o as __toESM, r as __exportAll, t as __commonJSMin } from "../../_runtime.mjs";
//#region node_modules/react/cjs/react.production.js
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, assign = Object.assign, emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl = Array.isArray;
	function noop() {}
	var ReactSharedInternals = {
		H: null,
		A: null,
		T: null,
		S: null
	}, hasOwnProperty = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE:
				case REACT_PORTAL_TYPE:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result;
			ctor = ctor();
			ctor.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject;
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error;
			});
			-1 === payload._status && (payload._status = 0, payload._result = ctor);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	}, Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.Profiler = REACT_PROFILER_TYPE;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE;
	exports.Suspense = REACT_SUSPENSE_TYPE;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals.H.useMemoCache(size);
		}
	};
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = function(scope) {
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		ReactSharedInternals.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	};
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals.H.useTransition();
	};
	exports.version = "19.2.7";
}));
//#endregion
//#region node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
//#endregion
//#region node_modules/@stylexjs/stylex/lib/es/stylex.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var styleq = {};
var hasRequiredStyleq;
function requireStyleq() {
	if (hasRequiredStyleq) return styleq;
	hasRequiredStyleq = 1;
	Object.defineProperty(styleq, "__esModule", { value: true });
	styleq.styleq = void 0;
	var cache = /* @__PURE__ */ new WeakMap();
	var compiledKey = "$$css";
	function createStyleq(options) {
		var disableCache;
		var disableMix;
		var transform;
		if (options != null) {
			disableCache = options.disableCache === true;
			disableMix = options.disableMix === true;
			transform = options.transform;
		}
		return function styleq() {
			var definedProperties = [];
			var className = "";
			var inlineStyle = null;
			var debugString = "";
			var nextCache = disableCache ? null : cache;
			var styles = new Array(arguments.length);
			for (var i = 0; i < arguments.length; i++) styles[i] = arguments[i];
			while (styles.length > 0) {
				var possibleStyle = styles.pop();
				if (possibleStyle == null || possibleStyle === false) continue;
				if (Array.isArray(possibleStyle)) {
					for (var _i = 0; _i < possibleStyle.length; _i++) styles.push(possibleStyle[_i]);
					continue;
				}
				var style = transform != null ? transform(possibleStyle) : possibleStyle;
				if (style.$$css != null) {
					var classNameChunk = "";
					if (nextCache != null && nextCache.has(style)) {
						var cacheEntry = nextCache.get(style);
						if (cacheEntry != null) {
							classNameChunk = cacheEntry[0];
							debugString = cacheEntry[2];
							definedProperties.push.apply(definedProperties, cacheEntry[1]);
							nextCache = cacheEntry[3];
						}
					} else {
						var definedPropertiesChunk = [];
						for (var prop in style) {
							var value = style[prop];
							if (prop === compiledKey) {
								var compiledKeyValue = style[prop];
								if (compiledKeyValue !== true) debugString = debugString ? compiledKeyValue + "; " + debugString : compiledKeyValue;
								continue;
							}
							if (typeof value === "string" || value === null) {
								if (!definedProperties.includes(prop)) {
									definedProperties.push(prop);
									if (nextCache != null) definedPropertiesChunk.push(prop);
									if (typeof value === "string") classNameChunk += classNameChunk ? " " + value : value;
								}
							} else console.error("styleq: ".concat(prop, " typeof ").concat(String(value), " is not \"string\" or \"null\"."));
						}
						if (nextCache != null) {
							var weakMap = /* @__PURE__ */ new WeakMap();
							nextCache.set(style, [
								classNameChunk,
								definedPropertiesChunk,
								debugString,
								weakMap
							]);
							nextCache = weakMap;
						}
					}
					if (classNameChunk) className = className ? classNameChunk + " " + className : classNameChunk;
				} else if (disableMix) {
					if (inlineStyle == null) inlineStyle = {};
					inlineStyle = Object.assign({}, style, inlineStyle);
				} else {
					var subStyle = null;
					for (var _prop in style) {
						var _value = style[_prop];
						if (_value !== void 0) {
							if (!definedProperties.includes(_prop)) {
								if (_value != null) {
									if (inlineStyle == null) inlineStyle = {};
									if (subStyle == null) subStyle = {};
									subStyle[_prop] = _value;
								}
								definedProperties.push(_prop);
								nextCache = null;
							}
						}
					}
					if (subStyle != null) inlineStyle = Object.assign(subStyle, inlineStyle);
				}
			}
			return [
				className,
				inlineStyle,
				debugString
			];
		};
	}
	var styleq$1 = styleq.styleq = createStyleq();
	styleq$1.factory = createStyleq;
	return styleq;
}
var styleqExports = /*@__PURE__*/ requireStyleq();
function props(...styles) {
	const [className, style, dataStyleSrc] = styleqExports.styleq(styles);
	const result = {};
	if (className != null && className !== "") result.className = className;
	if (style != null && Object.keys(style).length > 0) result.style = style;
	if (dataStyleSrc != null && dataStyleSrc !== "") result["data-style-src"] = dataStyleSrc;
	return result;
}
Object.freeze({});
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/tokens.stylex.js
var colorDefaults = {
	"--color-accent": "light-dark(#0064E0, #2694FE)",
	"--color-accent-muted": "light-dark(#0082FB33, #0082FB3F)",
	"--color-on-accent": "light-dark(#FFFFFF, #FFFFFF)",
	"--color-neutral": "light-dark(rgba(5, 54, 89, 0.1), rgba(223, 226, 229, 0.2))",
	"--color-background-surface": "light-dark(#FFFFFF, #1F1F22)",
	"--color-background-body": "light-dark(#F1F4F7, #111112)",
	"--color-overlay": "light-dark(#01122866, #11111299)",
	"--color-overlay-hover": "light-dark(#0536590C, #FFFFFF0C)",
	"--color-overlay-pressed": "light-dark(#05365919, #FFFFFF19)",
	"--color-background-muted": "light-dark(#0536590C, #1111127F)",
	"--color-text-primary": "light-dark(#0A1317, #DFE2E5)",
	"--color-text-secondary": "light-dark(#4E606F, #AAAFB5)",
	"--color-text-disabled": "light-dark(#A4B0BC, #6F747C)",
	"--color-text-accent": "light-dark(#0064E0, #3E9EFB)",
	"--color-on-dark": "light-dark(#FFFFFF, #FFFFFF)",
	"--color-on-light": "light-dark(#000000, #000000)",
	"--color-icon-accent": "light-dark(#0064E0, #2694FE)",
	"--color-icon-primary": "light-dark(#0A1317, #DFE2E5)",
	"--color-icon-secondary": "light-dark(#4E606F, #AAAFB5)",
	"--color-icon-disabled": "light-dark(#A4B0BC, #6F747C)",
	"--color-background-card": "light-dark(#FFFFFF, #1F1F22)",
	"--color-background-popover": "light-dark(#FFFFFF, #28292C)",
	"--color-background-inverted": "light-dark(#0A1317, #FFFFFF)",
	"--color-background-error-inverted": "light-dark(#AA071E, #E3193B)",
	"--color-success": "light-dark(#0D8626, #0D8626)",
	"--color-success-muted": "light-dark(#0B991F33, #0B991F3F)",
	"--color-on-success": "light-dark(#FFFFFF, #FFFFFF)",
	"--color-error": "light-dark(#E3193B, #F5394F)",
	"--color-error-muted": "light-dark(#E3193B33, #F5394F3F)",
	"--color-on-error": "light-dark(#FFFFFF, #FFFFFF)",
	"--color-warning": "light-dark(#E9AF08, #F2C00B)",
	"--color-warning-muted": "light-dark(#E2A40033, #E2A4003F)",
	"--color-on-warning": "light-dark(#0A1317, #0A1317)",
	"--color-border": "light-dark(#05365919, #F2F4F619)",
	"--color-border-emphasized": "light-dark(#CCD3DB, #494D53)",
	"--color-skeleton": "light-dark(#CCD3DB, #5A5E66)",
	"--color-track": "light-dark(#CCD3DB, #5A5E66)",
	"--color-shadow": "light-dark(rgba(5, 54, 89, 0.1), rgba(0, 0, 0, 0.3))",
	"--color-tint-hover": "light-dark(black, white)",
	"--color-background-blue": "light-dark(#0171E333, #0171E333)",
	"--color-border-blue": "light-dark(#0064E0, #2694FE)",
	"--color-icon-blue": "light-dark(#0064E0, #2694FE)",
	"--color-text-blue": "light-dark(#042F97, #AFD7FF)",
	"--color-background-cyan": "light-dark(#03A7D733, #03A7D733)",
	"--color-border-cyan": "light-dark(#089DD0, #0171A4)",
	"--color-icon-cyan": "light-dark(#00ACC1, #26C6DA)",
	"--color-text-cyan": "light-dark(#014975, #A1EEF9)",
	"--color-background-gray": "light-dark(#0A131733, #666A724C)",
	"--color-border-gray": "light-dark(#647685, #748695)",
	"--color-icon-gray": "light-dark(#4E606F, #AAAFB5)",
	"--color-text-gray": "light-dark(#0A1317, #E7EAED)",
	"--color-background-green": "light-dark(#24BB5E33, #24BB5E33)",
	"--color-border-green": "light-dark(#0D8626, #0B991F)",
	"--color-icon-green": "light-dark(#0D8626, #26A756)",
	"--color-text-green": "light-dark(#09441F, #A5F690)",
	"--color-background-orange": "light-dark(#F2790233, #F2790233)",
	"--color-border-orange": "light-dark(#EB6E00, #B34A01)",
	"--color-icon-orange": "light-dark(#E9690B, #FB8C00)",
	"--color-text-orange": "light-dark(#6B2203, #FDB876)",
	"--color-background-pink": "light-dark(#E638B333, #E638B333)",
	"--color-border-pink": "light-dark(#F351C0, #C02294)",
	"--color-icon-pink": "light-dark(#C2185B, #EC407A)",
	"--color-text-pink": "light-dark(#650053, #FEADE3)",
	"--color-background-purple": "light-dark(#7952FF33, #7952FF33)",
	"--color-border-purple": "light-dark(#9081FF, #7340FE)",
	"--color-icon-purple": "light-dark(#5B08D8, #7952FF)",
	"--color-text-purple": "light-dark(#3E0697, #B3B0FE)",
	"--color-background-red": "light-dark(#E3193B33, #E3193B33)",
	"--color-border-red": "light-dark(#E3193B, #F5394F)",
	"--color-icon-red": "light-dark(#D31130, #E3193B)",
	"--color-text-red": "light-dark(#7B0210, #FFB2B8)",
	"--color-background-teal": "light-dark(#0DB7AF33, #0DB7AF33)",
	"--color-border-teal": "light-dark(#08A3A3, #08767D)",
	"--color-icon-teal": "light-dark(#009688, #26A69A)",
	"--color-text-teal": "light-dark(#083943, #40DCCD)",
	"--color-background-yellow": "light-dark(#E2A40033, #E2A40033)",
	"--color-border-yellow": "light-dark(#C58600, #B47700)",
	"--color-icon-yellow": "light-dark(#FBC02D, #FFEE58)",
	"--color-text-yellow": "light-dark(#753F07, #FBCE03)"
};
var spacingDefaults = {
	"--spacing-0": "0px",
	"--spacing-0-5": "2px",
	"--spacing-1": "4px",
	"--spacing-1-5": "6px",
	"--spacing-2": "8px",
	"--spacing-3": "12px",
	"--spacing-4": "16px",
	"--spacing-5": "20px",
	"--spacing-6": "24px",
	"--spacing-7": "28px",
	"--spacing-8": "32px",
	"--spacing-9": "36px",
	"--spacing-10": "40px",
	"--spacing-11": "44px",
	"--spacing-12": "48px"
};
var spacingVars = {
	"--spacing-0": "var(--spacing-0)",
	"--spacing-0-5": "var(--spacing-0-5)",
	"--spacing-1": "var(--spacing-1)",
	"--spacing-1-5": "var(--spacing-1-5)",
	"--spacing-2": "var(--spacing-2)",
	"--spacing-3": "var(--spacing-3)",
	"--spacing-4": "var(--spacing-4)",
	"--spacing-5": "var(--spacing-5)",
	"--spacing-6": "var(--spacing-6)",
	"--spacing-7": "var(--spacing-7)",
	"--spacing-8": "var(--spacing-8)",
	"--spacing-9": "var(--spacing-9)",
	"--spacing-10": "var(--spacing-10)",
	"--spacing-11": "var(--spacing-11)",
	"--spacing-12": "var(--spacing-12)",
	__varGroupHash__: "x1kvdh9l"
};
var sizeDefaults = {
	"--size-element-sm": "28px",
	"--size-element-md": "32px",
	"--size-element-lg": "36px"
};
var radiusDefaults = {
	"--radius-none": "0px",
	"--radius-inner": "4px",
	"--radius-element": "8px",
	"--radius-container": "12px",
	"--radius-page": "28px",
	"--radius-chat": "28px",
	"--radius-full": "9999px"
};
var shadowDefaults = {
	"--shadow-low": "0px 1px 1px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 8px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))",
	"--shadow-med": "0px 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 12px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))",
	"--shadow-high": "0px 2px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 8px 24px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))",
	"--shadow-inset-hover": "inset 0px 0px 0px 2px light-dark(rgba(5, 54, 89, 0.15), rgba(223, 226, 229, 0.2))",
	"--shadow-inset-selected": "inset 0px 0px 0px 2px rgba(1, 113, 227, 0.5)",
	"--shadow-inset-success": "inset 0px 0px 0px 2px rgba(38, 167, 86, 0.3)",
	"--shadow-inset-warning": "inset 0px 0px 0px 2px rgba(226, 164, 0, 0.3)",
	"--shadow-inset-error": "inset 0px 0px 0px 2px rgba(227, 25, 59, 0.3)"
};
var durationDefaults = {
	"--duration-fast-min": "130ms",
	"--duration-fast": "175ms",
	"--duration-fast-max": "230ms",
	"--duration-medium-min": "310ms",
	"--duration-medium": "410ms",
	"--duration-medium-max": "550ms",
	"--duration-slow-min": "730ms",
	"--duration-slow": "975ms",
	"--duration-slow-max": "1300ms"
};
var durationVars = {
	"--duration-fast-min": "var(--duration-fast-min)",
	"--duration-fast": "var(--duration-fast)",
	"--duration-fast-max": "var(--duration-fast-max)",
	"--duration-medium-min": "var(--duration-medium-min)",
	"--duration-medium": "var(--duration-medium)",
	"--duration-medium-max": "var(--duration-medium-max)",
	"--duration-slow-min": "var(--duration-slow-min)",
	"--duration-slow": "var(--duration-slow)",
	"--duration-slow-max": "var(--duration-slow-max)",
	__varGroupHash__: "x14lkjui"
};
var easeDefaults = { "--ease-standard": "cubic-bezier(0.24, 1, 0.4, 1)" };
var easeVars = {
	"--ease-standard": "var(--ease-standard)",
	__varGroupHash__: "xf09i69"
};
/** @deprecated Use durationVars + easeVars instead */
var transitionDefaults = {
	"--transition-fast": "0.15s ease",
	"--transition-normal": "0.2s ease"
};
var typographyDefaults = {
	"--font-family-body": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif",
	"--font-family-code": "\"SF Mono\", Monaco, Consolas, monospace",
	"--font-family-heading": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
};
var textSizeDefaults = {
	"--font-size-4xs": "0.375rem",
	"--font-size-3xs": "0.4375rem",
	"--font-size-2xs": "0.5rem",
	"--font-size-xs": "0.625rem",
	"--font-size-sm": "0.75rem",
	"--font-size-base": "0.875rem",
	"--font-size-lg": "1.0625rem",
	"--font-size-xl": "1.25rem",
	"--font-size-2xl": "1.5rem",
	"--font-size-3xl": "1.8125rem",
	"--font-size-4xl": "2.1875rem",
	"--font-size-5xl": "2.625rem"
};
var fontWeightDefaults = {
	"--font-weight-normal": "400",
	"--font-weight-medium": "500",
	"--font-weight-semibold": "600",
	"--font-weight-bold": "700"
};
/** @deprecated Use DurationVarName | EaseVarName instead */
var typeScaleDefaults = {
	"--text-heading-1-size": "var(--font-size-2xl)",
	"--text-heading-1-weight": "var(--font-weight-semibold)",
	"--text-heading-1-leading": "1.3333",
	"--text-heading-2-size": "var(--font-size-xl)",
	"--text-heading-2-weight": "var(--font-weight-semibold)",
	"--text-heading-2-leading": "1.4",
	"--text-heading-3-size": "var(--font-size-lg)",
	"--text-heading-3-weight": "var(--font-weight-semibold)",
	"--text-heading-3-leading": "1.4118",
	"--text-heading-4-size": "var(--font-size-base)",
	"--text-heading-4-weight": "var(--font-weight-semibold)",
	"--text-heading-4-leading": "1.4286",
	"--text-heading-5-size": "var(--font-size-sm)",
	"--text-heading-5-weight": "var(--font-weight-semibold)",
	"--text-heading-5-leading": "1.6667",
	"--text-heading-6-size": "var(--font-size-xs)",
	"--text-heading-6-weight": "var(--font-weight-semibold)",
	"--text-heading-6-leading": "1.6",
	"--text-body-size": "var(--font-size-base)",
	"--text-body-weight": "var(--font-weight-normal)",
	"--text-body-leading": "1.4286",
	"--text-large-size": "var(--font-size-lg)",
	"--text-large-weight": "var(--font-weight-semibold)",
	"--text-large-leading": "1.4118",
	"--text-label-size": "var(--font-size-base)",
	"--text-label-weight": "var(--font-weight-medium)",
	"--text-label-leading": "1.4286",
	"--text-code-size": "var(--font-size-base)",
	"--text-code-weight": "var(--font-weight-normal)",
	"--text-code-leading": "1.4286",
	"--text-supporting-size": "var(--font-size-sm)",
	"--text-supporting-weight": "var(--font-weight-normal)",
	"--text-supporting-leading": "1.6667",
	"--text-display-1-size": "var(--font-size-5xl)",
	"--text-display-1-weight": "var(--font-weight-normal)",
	"--text-display-1-leading": "1.2381",
	"--text-display-2-size": "var(--font-size-4xl)",
	"--text-display-2-weight": "var(--font-weight-normal)",
	"--text-display-2-leading": "1.2571",
	"--text-display-3-size": "var(--font-size-3xl)",
	"--text-display-3-weight": "var(--font-weight-normal)",
	"--text-display-3-leading": "1.2414"
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/Stack/stack.stylex.js
var alignItemsStyles = {
	center: {
		kGNEyG: "x6s0dn4",
		$$css: true
	},
	end: {
		kGNEyG: "xuk3077",
		$$css: true
	},
	start: {
		kGNEyG: "x1cy8zhl",
		$$css: true
	},
	stretch: {
		kGNEyG: "x1qjc9v5",
		$$css: true
	}
};
/**
* Cross-axis alignment options for stack items.
* - For HStack: vertical alignment
* - For VStack: horizontal alignment
*/
var justifyContentStyles = {
	start: {
		kjj79g: "x1nhvcw1",
		$$css: true
	},
	center: {
		kjj79g: "xl56j7k",
		$$css: true
	},
	end: {
		kjj79g: "x13a6bvl",
		$$css: true
	},
	between: {
		kjj79g: "x1qughib",
		$$css: true
	},
	around: {
		kjj79g: "x1l1ennw",
		$$css: true
	},
	evenly: {
		kjj79g: "xaw8158",
		$$css: true
	}
};
/**
* Main-axis alignment options for stack items.
* - For HStack: horizontal alignment
* - For VStack: vertical alignment
*/
var directionStyles = {
	horizontal: {
		kXwgrk: "x1q0g3np",
		$$css: true
	},
	vertical: {
		kXwgrk: "xdt5ytf",
		$$css: true
	}
};
/**
* Stack direction.
* - `horizontal`: Items flow left-to-right (HStack)
* - `vertical`: Items flow top-to-bottom (VStack)
*/
var wrapStyles = {
	nowrap: {
		kwnvtZ: "xozqiw3",
		$$css: true
	},
	wrap: {
		kwnvtZ: "x1a02dak",
		$$css: true
	},
	"wrap-reverse": {
		kwnvtZ: "x8hhl5t",
		$$css: true
	}
};
/**
* Flex wrap behavior.
* - `nowrap`: Items stay on one line (default)
* - `wrap`: Items wrap to next line
* - `wrap-reverse`: Items wrap to previous line
*/
var baseStyles$1 = { stack: {
	k1xSpc: "x78zum5",
	$$css: true
} };
/**
* Gap styles using spacing tokens from the theme.
* Keys are numeric SpacingStep values.
*/
var gapStyles = {
	"0": {
		k1C7PZ: "x1o57wo1",
		khm7nJ: "x6yxi7o",
		$$css: true
	},
	"1": {
		k1C7PZ: "x1lfs0n9",
		khm7nJ: "x1ngg2t4",
		$$css: true
	},
	"2": {
		k1C7PZ: "xak3so",
		khm7nJ: "x1x7z4sm",
		$$css: true
	},
	"3": {
		k1C7PZ: "xewh9hi",
		khm7nJ: "x4olc9o",
		$$css: true
	},
	"4": {
		k1C7PZ: "xty4p9g",
		khm7nJ: "xtx9w7w",
		$$css: true
	},
	"5": {
		k1C7PZ: "x1eqhezk",
		khm7nJ: "x1iu6piu",
		$$css: true
	},
	"6": {
		k1C7PZ: "x3qlgwd",
		khm7nJ: "xczp1bk",
		$$css: true
	},
	"8": {
		k1C7PZ: "xicv188",
		khm7nJ: "xgx0vcf",
		$$css: true
	},
	"10": {
		k1C7PZ: "x1p37tyl",
		khm7nJ: "x1xpicb7",
		$$css: true
	},
	"0.5": {
		k1C7PZ: "x1kihgfc",
		khm7nJ: "x1tw44j4",
		$$css: true
	},
	"1.5": {
		k1C7PZ: "x1thn6ci",
		khm7nJ: "xhq53yo",
		$$css: true
	}
};
/**
* StyleX utility to add stack (flex container) styles to any element.
*
* @example
* ```
* import { stack } from '@astryxdesign/core/Layout';
* import * as stylex from '@stylexjs/stylex';
*
* // Horizontal stack with numeric gap
* <div {...stylex.props(...stack({ direction: 'horizontal', gap: 2 }))}>
*   <Child />
*   <Child />
* </div>
*
* // Vertical stack with centered items
* <div {...stylex.props(...stack({ direction: 'vertical', crossAlign: 'center' }))}>
*   <Child />
*   <Child />
* </div>
*
* // Wrapping horizontal stack with larger gap
* <div {...stylex.props(...stack({ direction: 'horizontal', gap: 4, wrap: 'wrap' }))}>
*   <Child />
*   <Child />
*   <Child />
* </div>
* ```
*/
function stack({ crossAlign, direction, gap, mainAlign, wrap }) {
	return [
		baseStyles$1.stack,
		directionStyles[direction],
		gap != null && gapStyles[gap],
		crossAlign != null && alignItemsStyles[crossAlign],
		mainAlign != null && justifyContentStyles[mainAlign],
		wrap != null && wrapStyles[wrap]
	];
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layout/padding.stylex.js
/**
* Maps numeric SpacingStep values to SpacingToken keys used by the container system.
*/
var spacingStepToToken = {
	0: "spacing0",
	.5: "spacing0_5",
	1: "spacing1",
	1.5: "spacing1_5",
	2: "spacing2",
	3: "spacing3",
	4: "spacing4",
	5: "spacing5",
	6: "spacing6",
	8: "spacing8",
	10: "spacing10"
};
/**
* Padding styles for all sides using spacing tokens.
* Each key applies uniform padding to all four sides.
*/
var paddingStyles = {
	"0": {
		kZCmMZ: "x18gyask",
		kwRFfy: "x1s0aq8i",
		kLKAdn: "x1ydh6w3",
		kGO01o: "x1l20ajd",
		$$css: true
	},
	"1": {
		kZCmMZ: "x1vsv5vr",
		kwRFfy: "x1nryj5t",
		kLKAdn: "xfsso4q",
		kGO01o: "xy143xn",
		$$css: true
	},
	"2": {
		kZCmMZ: "x12gdq22",
		kwRFfy: "x1djylfy",
		kLKAdn: "x1xye8es",
		kGO01o: "x1wesfrj",
		$$css: true
	},
	"3": {
		kZCmMZ: "x126nfab",
		kwRFfy: "x1t818jl",
		kLKAdn: "x1vlblms",
		kGO01o: "xvmdzux",
		$$css: true
	},
	"4": {
		kZCmMZ: "x1rey3nv",
		kwRFfy: "xnjyzlh",
		kLKAdn: "x1oa1p4a",
		kGO01o: "x1awphl8",
		$$css: true
	},
	"5": {
		kZCmMZ: "x1blguxw",
		kwRFfy: "xdbrk9v",
		kLKAdn: "xx7rijo",
		kGO01o: "x1hk98q",
		$$css: true
	},
	"6": {
		kZCmMZ: "x31w388",
		kwRFfy: "x1we12cn",
		kLKAdn: "x1adxfkp",
		kGO01o: "xjpqqx5",
		$$css: true
	},
	"8": {
		kZCmMZ: "x1j3hnjz",
		kwRFfy: "x1q91b2g",
		kLKAdn: "xoxd1wu",
		kGO01o: "x2oz4g1",
		$$css: true
	},
	"10": {
		kZCmMZ: "xqp078j",
		kwRFfy: "x160ivqr",
		kLKAdn: "xk6660b",
		kGO01o: "x2izi54",
		$$css: true
	},
	"0.5": {
		kZCmMZ: "x138rykx",
		kwRFfy: "x1le3yxw",
		kLKAdn: "xbx876j",
		kGO01o: "xij103a",
		$$css: true
	},
	"1.5": {
		kZCmMZ: "xfti1ec",
		kwRFfy: "x17hk9do",
		kLKAdn: "x1kwdpsa",
		kGO01o: "x1opdxmq",
		$$css: true
	}
};
/**
* Container padding inline CSS variable styles for edge compensation.
* Sets --container-padding-inline-start and --container-padding-inline-end so
* edge-compensating children know the inline padding to compensate against.
*/
var containerPaddingInlineVarStyles = {
	"0": {
		"--container-padding-inline-start": "x1gu2k80",
		"--container-padding-inline-end": "x91ghl5",
		$$css: true
	},
	"1": {
		"--container-padding-inline-start": "x1cvlban",
		"--container-padding-inline-end": "x2oyxnl",
		$$css: true
	},
	"2": {
		"--container-padding-inline-start": "x1xlrr2o",
		"--container-padding-inline-end": "xcas3b9",
		$$css: true
	},
	"3": {
		"--container-padding-inline-start": "xfdwxua",
		"--container-padding-inline-end": "xu0ipoa",
		$$css: true
	},
	"4": {
		"--container-padding-inline-start": "x1dlhslv",
		"--container-padding-inline-end": "xs0pscg",
		$$css: true
	},
	"5": {
		"--container-padding-inline-start": "x1s81nki",
		"--container-padding-inline-end": "xgkj7vj",
		$$css: true
	},
	"6": {
		"--container-padding-inline-start": "x1ep0dkj",
		"--container-padding-inline-end": "x94cj42",
		$$css: true
	},
	"8": {
		"--container-padding-inline-start": "xw1diwv",
		"--container-padding-inline-end": "x1b9k1pi",
		$$css: true
	},
	"10": {
		"--container-padding-inline-start": "xserb3f",
		"--container-padding-inline-end": "xx5lg5w",
		$$css: true
	},
	"0.5": {
		"--container-padding-inline-start": "x14ws0sr",
		"--container-padding-inline-end": "x1wz3t3y",
		$$css: true
	},
	"1.5": {
		"--container-padding-inline-start": "x176g23i",
		"--container-padding-inline-end": "xntetml",
		$$css: true
	}
};
/**
* Container padding block-start/block-end CSS variable styles for vertical bleed.
* Sets --container-padding-block-start and --container-padding-block-end so bleed children (Table, Divider, Section)
* know the block padding to compensate against when first/last child.
*/
var containerPaddingBlockStartVarStyles = {
	"0": {
		"--container-padding-block-start": "x1i3qcxz",
		$$css: true
	},
	"1": {
		"--container-padding-block-start": "xnsckjb",
		$$css: true
	},
	"2": {
		"--container-padding-block-start": "xa8b4fq",
		$$css: true
	},
	"3": {
		"--container-padding-block-start": "x11k4f5r",
		$$css: true
	},
	"4": {
		"--container-padding-block-start": "xm01sq8",
		$$css: true
	},
	"5": {
		"--container-padding-block-start": "xp8wdkl",
		$$css: true
	},
	"6": {
		"--container-padding-block-start": "x1hmud4d",
		$$css: true
	},
	"8": {
		"--container-padding-block-start": "xfv60at",
		$$css: true
	},
	"10": {
		"--container-padding-block-start": "x17h9kl7",
		$$css: true
	},
	"0.5": {
		"--container-padding-block-start": "xvdf9ev",
		$$css: true
	},
	"1.5": {
		"--container-padding-block-start": "x1kbx601",
		$$css: true
	}
};
var containerPaddingBlockEndVarStyles = {
	"0": {
		"--container-padding-block-end": "xkunwnr",
		$$css: true
	},
	"1": {
		"--container-padding-block-end": "x57a7ii",
		$$css: true
	},
	"2": {
		"--container-padding-block-end": "x1lsgcmx",
		$$css: true
	},
	"3": {
		"--container-padding-block-end": "x1q3ppug",
		$$css: true
	},
	"4": {
		"--container-padding-block-end": "x4hfsld",
		$$css: true
	},
	"5": {
		"--container-padding-block-end": "xbib2ws",
		$$css: true
	},
	"6": {
		"--container-padding-block-end": "x1q8d17g",
		$$css: true
	},
	"8": {
		"--container-padding-block-end": "x8lgq76",
		$$css: true
	},
	"10": {
		"--container-padding-block-end": "x15vxphk",
		$$css: true
	},
	"0.5": {
		"--container-padding-block-end": "x1cao3zv",
		$$css: true
	},
	"1.5": {
		"--container-padding-block-end": "xv53x8y",
		$$css: true
	}
};
/**
* Inline-only padding styles.
* Use when a component needs to set inline (horizontal) padding independently
* of block padding — e.g. the `paddingX` prop on Stack.
*/
var paddingInlineStyles = {
	"0": {
		kZCmMZ: "x18gyask",
		kwRFfy: "x1s0aq8i",
		$$css: true
	},
	"1": {
		kZCmMZ: "x1vsv5vr",
		kwRFfy: "x1nryj5t",
		$$css: true
	},
	"2": {
		kZCmMZ: "x12gdq22",
		kwRFfy: "x1djylfy",
		$$css: true
	},
	"3": {
		kZCmMZ: "x126nfab",
		kwRFfy: "x1t818jl",
		$$css: true
	},
	"4": {
		kZCmMZ: "x1rey3nv",
		kwRFfy: "xnjyzlh",
		$$css: true
	},
	"5": {
		kZCmMZ: "x1blguxw",
		kwRFfy: "xdbrk9v",
		$$css: true
	},
	"6": {
		kZCmMZ: "x31w388",
		kwRFfy: "x1we12cn",
		$$css: true
	},
	"8": {
		kZCmMZ: "x1j3hnjz",
		kwRFfy: "x1q91b2g",
		$$css: true
	},
	"10": {
		kZCmMZ: "xqp078j",
		kwRFfy: "x160ivqr",
		$$css: true
	},
	"0.5": {
		kZCmMZ: "x138rykx",
		kwRFfy: "x1le3yxw",
		$$css: true
	},
	"1.5": {
		kZCmMZ: "xfti1ec",
		kwRFfy: "x17hk9do",
		$$css: true
	}
};
/**
* Block-only padding override styles.
* Use when a component needs to override block padding independently
* of inline padding (e.g., Toolbar sets tight block padding while
* inheriting inline padding from its container).
*/
var paddingBlockStyles = {
	"0": {
		kLKAdn: "x1ydh6w3",
		kGO01o: "x1l20ajd",
		$$css: true
	},
	"1": {
		kLKAdn: "xfsso4q",
		kGO01o: "xy143xn",
		$$css: true
	},
	"2": {
		kLKAdn: "x1xye8es",
		kGO01o: "x1wesfrj",
		$$css: true
	},
	"3": {
		kLKAdn: "x1vlblms",
		kGO01o: "xvmdzux",
		$$css: true
	},
	"4": {
		kLKAdn: "x1oa1p4a",
		kGO01o: "x1awphl8",
		$$css: true
	},
	"5": {
		kLKAdn: "xx7rijo",
		kGO01o: "x1hk98q",
		$$css: true
	},
	"6": {
		kLKAdn: "x1adxfkp",
		kGO01o: "xjpqqx5",
		$$css: true
	},
	"8": {
		kLKAdn: "xoxd1wu",
		kGO01o: "x2oz4g1",
		$$css: true
	},
	"10": {
		kLKAdn: "xk6660b",
		kGO01o: "x2izi54",
		$$css: true
	},
	"0.5": {
		kLKAdn: "xbx876j",
		kGO01o: "xij103a",
		$$css: true
	},
	"1.5": {
		kLKAdn: "x1kwdpsa",
		kGO01o: "x1opdxmq",
		$$css: true
	}
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/utils/mergeProps.js
/**
* Merge xds-* props, stylex.props result, and optional consumer className/style.
*
* stylex.props() returns { className, style }. This merges the Astryx stable
* class name plus any data-attribute reflection from `themeProps()` with the
* StyleX class name so both StyleX styles and the theme-targeting surface are
* applied.
*
* Consumer className is appended after StyleX classes.
* Consumer style is spread after StyleX inline styles, so these values take priority.
*
* @example
* ```tsx
* // Root element with themeProps
* <div {...mergeProps(
*   themeProps('button', { variant }),
*   stylex.props(styles.base, variants[variant]),
*   className,
*   style,
* )} />
*
* // Internal element — stylex + dynamic style only
* <div {...mergeProps(
*   stylex.props(styles.track),
*   { style: { width: dynamicWidth } },
* )} />
* ```
*/
function mergeTwoProps(base, overrides) {
	const merged = {
		...base,
		...overrides
	};
	const cls = [base.className, overrides.className].filter(Boolean).join(" ");
	if (cls) merged.className = cls;
	else delete merged.className;
	const mergedStyle = overrides.style && base.style ? {
		...base.style,
		...overrides.style
	} : overrides.style || base.style;
	if (mergedStyle) merged.style = mergedStyle;
	else delete merged.style;
	return merged;
}
function mergeProps(xdsClassOrStylexResult, stylexResultOrClassName, classNameOrStyle, style) {
	if (typeof xdsClassOrStylexResult === "string") {
		const xdsClass = xdsClassOrStylexResult;
		const stylexResult = stylexResultOrClassName ?? { className: "" };
		const className = classNameOrStyle;
		let cls = stylexResult.className ? `${xdsClass} ${stylexResult.className}` : xdsClass;
		if (className) cls = `${cls} ${className}`;
		const mergedStyle = style && stylexResult.style ? {
			...stylexResult.style,
			...style
		} : style || stylexResult.style;
		return {
			...stylexResult,
			className: cls,
			style: mergedStyle
		};
	}
	let merged = mergeTwoProps(xdsClassOrStylexResult, typeof stylexResultOrClassName === "string" ? { className: stylexResultOrClassName } : stylexResultOrClassName ?? {});
	if (typeof classNameOrStyle === "string") merged = mergeTwoProps(merged, { className: classNameOrStyle });
	else if (classNameOrStyle != null) merged = mergeTwoProps(merged, { style: classNameOrStyle });
	if (style != null) merged = mergeTwoProps(merged, { style });
	return merged;
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/utils/mergeRefs.js
/**
* @file mergeRefs.ts
* @input Multiple React refs (callback, object, or undefined)
* @output A single callback ref that forwards to all inputs
* @position Utility; used by components that need to merge an external ref
*   with an internal ref (e.g., popover trigger + consumer ref).
*/
function mergeRefs(...refs) {
	return (value) => {
		const cleanups = [];
		for (const ref of refs) if (typeof ref === "function") {
			const cleanup = ref(value);
			if (typeof cleanup === "function") cleanups.push(cleanup);
		} else if (ref != null) ref.current = value;
		if (cleanups.length > 0) return () => {
			for (const cleanup of cleanups) cleanup();
		};
	};
}
/**
* Class-name prefix for stable component classes, WITHOUT the trailing dash.
*
* Use {@link stableClassName} to build a full class token rather than
* concatenating this directly.
*/
var classPrefix = "astryx";
/**
* Build a stable component class token, e.g. `stableClassName('button')`
* -> `'astryx-button'`.
*/
function stableClassName(component) {
	return `${classPrefix}-${component}`;
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/utils/themeProps.js
function toDataAttributeName(prop) {
	return `data-${prop.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
function classTokenForPropValue(prop, value) {
	return /^\d/.test(value) ? `${prop}-${value}` : value;
}
/**
* Build the astryx-* class name string for a component.
*
* Every component renders a stable base class (`astryx-button`, `astryx-card`,
* etc.) plus variant classes derived from visual props. Components also reflect
* those visual props as data attributes via `themeProps()` (`data-variant`,
* `data-size`, `data-level`, etc.) so consumers target stable data-attribute
* selectors rather than collision-prone bare class names.
*
* The `astryx-` prefix comes from the centralized naming module
* (`packages/core/src/naming.ts`) so the namespace lives in one place.
*
* <!-- SYNC: packages/core/src/naming.ts (namespace prefix source of truth) -->
* <!-- SYNC: packages/core/src/utils/parseStyleKey.ts -->
*
* Values starting with a digit get prefixed with the prop name since
* CSS class names can't start with a number (e.g. level=1 → "level-1").
* Data attributes keep the literal value (e.g. `data-level="1"`).
*
* @param component - Component name in lowercase (e.g. 'button', 'card')
* @param props - Visual prop values to include as variant classes
* @returns Class name string (e.g. "astryx-button secondary sm")
*
* @example
* ```ts
* buildClassName('button', { variant: 'secondary', size: 'sm' })
* // → "astryx-button secondary sm"
*
* buildClassName('heading', { level: 1 })
* // → "astryx-heading level-1"
*
* buildClassName('card')
* // → "astryx-card"
* ```
*/
function buildClassName(component, props) {
	const classes = [stableClassName(component)];
	if (props) for (const [prop, value] of Object.entries(props)) {
		if (value == null) continue;
		classes.push(classTokenForPropValue(prop, String(value)));
	}
	return classes.join(" ");
}
/**
* Reflect Astryx visual props as `data-*` attributes.
*
* Keys are kebab-cased (`listStyle` → `data-list-style`) and values are the
* literal prop values, including numeric values (`level: 1` → `data-level="1"`).
* Nullish values are omitted.
*/
function themeDataAttributes(props) {
	const attrs = {};
	if (props) for (const [prop, value] of Object.entries(props)) {
		if (value == null) continue;
		attrs[toDataAttributeName(prop)] = String(value);
	}
	return attrs;
}
/**
* Build the props object components should spread onto the same element that
* receives the stable Astryx class name.
*
* This emits the stable astryx class plus the data-attribute reflection
* surface. For example:
*
* ```ts
* themeProps('button', { variant: 'primary', size: 'sm' })
* // → { className: 'astryx-button primary sm', data-variant: 'primary', data-size: 'sm' }
* ```
*/
function themeProps(component, props) {
	return {
		className: buildClassName(component, props),
		...themeDataAttributes(props)
	};
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/utils/sharedResizeObserver.js
var import_jsx_runtime = require_jsx_runtime();
/**
* @file sharedResizeObserver.ts
* @input ResizeObserver API
* @output Exports observeResize / unobserveResize for shared observation
* @position Utility; consumed by useTruncation, useOverflow, and any component
*   that needs resize observation without creating per-instance observers
*
* A single ResizeObserver can observe thousands of elements. Creating one
* per component (e.g. per table cell) is wasteful — browsers batch
* observations per observer instance, so a shared observer means one
* callback dispatch per animation frame instead of N.
*
* SYNC: When modified, update:
* - /packages/core/src/utils/index.ts (exports)
* - /packages/core/src/Text/useTruncation.ts (primary consumer)
*/
var observer = null;
var callbacks = /* @__PURE__ */ new Map();
function getObserver() {
	if (!observer) observer = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const cb = callbacks.get(entry.target);
			if (cb) cb(entry);
		}
	});
	return observer;
}
/**
* Observe an element's size via a shared ResizeObserver singleton.
*
* Fires the callback once synchronously on registration (with a
* synthetic entry) so callers don't need separate initial-measurement
* logic. Subsequent callbacks fire on actual resizes.
*
* Call `unobserveResize` when the element unmounts or observation is
* no longer needed. The shared observer is destroyed when the last
* element is unobserved.
*
* @example
* ```
* observeResize(element, (entry) => {
*   console.log(entry.contentBoxSize);
* });
*
* // Cleanup:
* unobserveResize(element);
* ```
*/
function observeResize(element, callback) {
	callbacks.set(element, callback);
	getObserver().observe(element);
	callback({ target: element });
}
/**
* Stop observing an element. If no elements remain, the shared
* observer is disconnected and released for garbage collection.
*/
function unobserveResize(element) {
	callbacks.delete(element);
	if (observer) {
		observer.unobserve(element);
		if (callbacks.size === 0) {
			observer.disconnect();
			observer = null;
		}
	}
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Stack/Stack.js
/**
* @file Stack.tsx
* @input Uses React, ElementType, stack utility
* @output Exports Stack polymorphic component and StackProps
* @position Layout/Stack component; uses stack.stylex.ts
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Stack/Stack.doc.mjs
* - /apps/storybook/stories/Stack.stories.tsx
* - /packages/cli/templates/blocks/components/Stack/ (showcase blocks)
*/
var overflowStyles = { scrollable: {
	kVQacm: "xysyzu8",
	$$css: true
} };
/**
* Alignment values accepted by Stack.
*
* The full union of main-axis and cross-axis alignment values.
* Which values are valid depends on direction and axis:
* - Main axis (hAlign for horizontal, vAlign for vertical):
*   `'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'`
* - Cross axis (vAlign for horizontal, hAlign for vertical):
*   `'start' | 'center' | 'end' | 'stretch'`
*/
/**
* Unified stack component for arranging items in a horizontal or vertical layout.
*
* Replaces `HStack` and `VStack` with a single component that accepts
* a `direction` prop. Defaults to `'vertical'` since most layouts stack
* top-to-bottom.
*
* The `hAlign` and `vAlign` props automatically map to the correct CSS axis
* based on the direction:
* - `direction='horizontal'`: hAlign → justify-content, vAlign → align-items
* - `direction='vertical'`: hAlign → align-items, vAlign → justify-content
*
* @example
* ```
* <Stack gap={2}>
*   <Item />
*   <Item />
* </Stack>
* <Stack direction="horizontal" gap={4} vAlign="center">
*   <Item />
*   <Item />
* </Stack>
* ```
*/
function Stack({ direction = "vertical", hAlign, vAlign, justify, align, gap, padding, paddingInline, paddingBlock, isScrollable, width, height, maxWidth, minHeight, wrap, as: element = "div", xstyle, className, style, children, ref, ...props$7 }) {
	const resolvedHAlign = hAlign ?? (direction === "horizontal" ? justify : align);
	const resolvedVAlign = vAlign ?? (direction === "horizontal" ? align : justify);
	const mainAlign = direction === "horizontal" ? resolvedHAlign : resolvedVAlign;
	const crossAlign = direction === "horizontal" ? resolvedVAlign : resolvedHAlign;
	const resolvedPaddingInline = paddingInline ?? padding;
	const resolvedPaddingBlock = paddingBlock ?? padding;
	const stylexProps = props(...stack({
		direction,
		crossAlign,
		mainAlign,
		gap,
		wrap
	}), resolvedPaddingInline != null && paddingInlineStyles[resolvedPaddingInline], resolvedPaddingBlock != null && paddingBlockStyles[resolvedPaddingBlock], isScrollable && overflowStyles.scrollable, xstyle);
	const sizingStyle = {
		...width != null && { width: typeof width === "number" ? `${width}px` : width },
		...height != null && { height: typeof height === "number" ? `${height}px` : height },
		...maxWidth != null && { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth },
		...minHeight != null && { minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }
	};
	return /*#__PURE__*/ (0, import_react.createElement)(element, {
		ref,
		...mergeProps(themeProps("stack", {
			direction,
			gap,
			wrap
		}), stylexProps, className, {
			...style,
			...sizingStyle
		}),
		...props$7
	}, children);
}
Stack.displayName = "Stack";
//#endregion
//#region node_modules/@astryxdesign/core/dist/HStack/HStack.js
/**
* @file HStack.tsx
* @input Uses Stack component
* @output Exports HStack as a thin wrapper around Stack
* @position Layout/Stack component; wraps Stack with direction='horizontal'
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Stack/Stack.doc.mjs
* - /packages/core/src/HStack/HStack.test.tsx
* - /packages/cli/templates/blocks/components/HStack/ (showcase blocks)
*/
/**
* Horizontal stack component for arranging items left-to-right.
* Convenience wrapper around `Stack` with `direction="horizontal"`.
*
* @example
* ```
* <HStack gap={2}>
*   <Item />
*   <Item />
* </HStack>
* ```
*/
function HStack({ ref, justify, align, hAlign, vAlign, ...props }) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Stack, {
		...props,
		direction: "horizontal",
		hAlign: hAlign ?? justify,
		vAlign: vAlign ?? align,
		ref
	});
}
HStack.displayName = "HStack";
//#endregion
//#region node_modules/@astryxdesign/core/dist/VStack/VStack.js
/**
* @file VStack.tsx
* @input Uses Stack component
* @output Exports VStack as a thin wrapper around Stack
* @position Layout/Stack component; wraps Stack with direction='vertical'
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Stack/Stack.doc.mjs
* - /packages/core/src/VStack/VStack.test.tsx
* - /packages/cli/templates/blocks/components/VStack/ (showcase blocks)
*/
/**
* Vertical stack component for arranging items top-to-bottom.
* Convenience wrapper around `Stack` with `direction="vertical"`.
*
* @example
* ```
* <VStack gap={2}>
*   <Item />
*   <Item />
* </VStack>
* ```
*/
function VStack({ ref, justify, align, hAlign, vAlign, ...props }) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Stack, {
		...props,
		direction: "vertical",
		hAlign: hAlign ?? align,
		vAlign: vAlign ?? justify,
		ref
	});
}
VStack.displayName = "VStack";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layer/anchorName.js
/**
* @file anchorName.ts
* @input HTMLElement with CSS anchor-name property
* @output Helpers for managing comma-separated anchor-name lists
* @position Utility; used by useLayer for multi-anchor support
*
* SYNC: When modified, update:
* - /packages/core/src/Layer/useLayer.tsx (imports from here)
*/
/**
* CSS `anchor-name` is a comma-separated list, so multiple layers can anchor to
* the same element (e.g. several TopNavMegaMenus anchored to one <nav>). These
* helpers add/remove a single layer's anchor id without clobbering the others —
* overwriting the whole property would break every sibling layer's positioning.
*/
function readAnchorNames(el) {
	return (el.style.anchorName ?? "").split(",").map((name) => name.trim()).filter(Boolean);
}
function writeAnchorNames(el, names) {
	el.style.anchorName = names.join(", ");
}
function addAnchorName(el, name) {
	const names = readAnchorNames(el);
	if (!names.includes(name)) {
		names.push(name);
		writeAnchorNames(el, names);
	}
}
function removeAnchorName(el, name) {
	writeAnchorNames(el, readAnchorNames(el).filter((existing) => existing !== name));
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layer/useLayer.js
/**
* @file useLayer.tsx
* @input Uses React hooks, Popover API, CSS anchor positioning, typography tokens
* @output Exports useLayer hook for layer positioning and visibility
* @position Core layer utility; used by useHoverCard, useTooltip, etc.
*
* SYNC: When modified, update:
* - /packages/core/src/Layer/Layer.doc.mjs
* - /packages/core/src/Layer/index.ts
*/
var styles$4 = {
	base: {
		keoZOQ: "xdj266r",
		k1K539: "xat24cr",
		keTefX: "x1lziwak",
		k71WvV: "x14z9mp",
		kLKAdn: "xexx8yu",
		kGO01o: "x18d9i69",
		kZCmMZ: "x1c1uobl",
		kwRFfy: "xyri2b",
		kMzoRj: "xc342km",
		ksu8eU: "xng3xce",
		kVQacm: "x1rea2x4",
		kMv6JI: "x9ynric",
		kWkggS: "xjbqb8w",
		$$css: true
	},
	fixed: {
		kVAEAm: "xixxii4",
		$$css: true
	}
};
/**
* Position placement relative to anchor
*/
/**
* Alignment along the placement axis
*/
/**
* Render props for context mode (anchor positioning)
*/
/**
* Render props for fixed mode (manual coordinates)
*/
/**
* Base options shared by both modes
*/
/**
* Options for context mode (CSS anchor positioning)
*/
/**
* Options for fixed mode (manual positioning)
*/
/**
* Return type for context mode
*/
/**
* Return type for fixed mode
*/
/**
* Map placement and alignment to CSS position-area value.
*/
function getPositionArea(placement = "above", alignment = "center") {
	const cssPlacement = {
		above: "top",
		below: "bottom",
		start: "left",
		end: "right"
	}[placement];
	if (placement === "above" || placement === "below") {
		if (alignment === "start") return `${cssPlacement} span-right`;
		if (alignment === "end") return `${cssPlacement} span-left`;
		return cssPlacement;
	}
	if (alignment === "start") return `${cssPlacement} span-bottom`;
	if (alignment === "end") return `${cssPlacement} span-top`;
	return `${cssPlacement} center`;
}
/**
* Core layer hook that handles popover behavior and positioning.
*
* Supports two positioning modes with type-safe render props:
* - `context`: CSS anchor positioning relative to a trigger element
* - `fixed`: Fixed positioning at specified coordinates
*
* @example
* ```
* const layer = useLayer({ mode: 'context' });
* <button ref={layer.ref}>Trigger</button>
* {layer.render(<Content />, { placement: 'above', alignment: 'center' })}
* ```
*/
function useLayer(options) {
	const { mode, onShow, onHide, lightDismiss = false } = options;
	const id = (0, import_react.useId)();
	const anchorId = `--astryx-layer-${id.replace(/:/g, "")}`;
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const popoverRef = (0, import_react.useRef)(null);
	const triggerRef = (0, import_react.useRef)(null);
	const isOpenRef = (0, import_react.useRef)(false);
	const show = (0, import_react.useCallback)(() => {
		const el = popoverRef.current;
		if (el && !isOpenRef.current) {
			if (typeof el.showPopover === "function") el.showPopover();
			else el.style.display = "block";
			isOpenRef.current = true;
			setIsOpen(true);
			onShow?.();
		}
	}, [onShow]);
	const hide = (0, import_react.useCallback)(() => {
		if (isOpenRef.current) {
			const el = popoverRef.current;
			if (el) if (typeof el.hidePopover === "function") el.hidePopover();
			else el.style.display = "none";
			isOpenRef.current = false;
			setIsOpen(false);
			onHide?.();
		}
	}, [onHide]);
	const ref = mode === "context" ? (el) => {
		if (triggerRef.current && triggerRef.current !== el) removeAnchorName(triggerRef.current, anchorId);
		if (el) addAnchorName(el, anchorId);
		triggerRef.current = el;
	} : void 0;
	const handleToggle = (0, import_react.useCallback)((e) => {
		if (e.newState === "closed" && isOpenRef.current) {
			isOpenRef.current = false;
			setIsOpen(false);
			onHide?.();
		}
	}, [onHide]);
	const listenedElRef = (0, import_react.useRef)(null);
	const listenedHandlerRef = (0, import_react.useRef)(null);
	const bindToggleListener = (0, import_react.useCallback)((el, handler) => {
		if (listenedElRef.current && listenedHandlerRef.current && (listenedElRef.current !== el || listenedHandlerRef.current !== handler)) {
			listenedElRef.current.removeEventListener("toggle", listenedHandlerRef.current);
			listenedElRef.current = null;
			listenedHandlerRef.current = null;
		}
		if (el && listenedElRef.current !== el) {
			el.addEventListener("toggle", handler);
			listenedElRef.current = el;
			listenedHandlerRef.current = handler;
		}
	}, []);
	const popoverRefCallback = (0, import_react.useCallback)((el) => {
		popoverRef.current = el;
		bindToggleListener(el, handleToggle);
	}, [handleToggle, bindToggleListener]);
	(0, import_react.useEffect)(() => {
		if (popoverRef.current) bindToggleListener(popoverRef.current, handleToggle);
		return () => {
			if (listenedElRef.current && listenedHandlerRef.current) {
				listenedElRef.current.removeEventListener("toggle", listenedHandlerRef.current);
				listenedElRef.current = null;
				listenedHandlerRef.current = null;
			}
		};
	}, [handleToggle, bindToggleListener]);
	const renderContext = (0, import_react.useCallback)((children, props$5) => {
		const { placement = "above", alignment = "center", role, xstyle, className: extraClassName, style: extraStyle, as: Container = "div", onMouseEnter, onMouseLeave } = props$5 || {};
		const anchorStyle = {
			positionAnchor: anchorId,
			positionArea: getPositionArea(placement, alignment),
			positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline"
		};
		const stylexResult = props(styles$4.base, xstyle);
		const combinedClassName = extraClassName ? `${extraClassName} ${stylexResult.className ?? ""}` : stylexResult.className;
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Container, {
			ref: popoverRefCallback,
			id,
			role,
			popover: lightDismiss ? "auto" : "manual",
			className: combinedClassName,
			style: {
				...stylexResult.style,
				...anchorStyle,
				...extraStyle
			},
			onMouseEnter,
			onMouseLeave,
			children
		});
	}, [
		anchorId,
		id,
		lightDismiss,
		popoverRefCallback
	]);
	const renderFixed = (0, import_react.useCallback)((children, props$6) => {
		const { x, y, xstyle, className: extraClassName, style: extraStyle } = props$6;
		const positionStyle = {
			top: y,
			left: x
		};
		const stylexResult = props(styles$4.base, styles$4.fixed, xstyle);
		const combinedClassName = extraClassName ? `${extraClassName} ${stylexResult.className ?? ""}` : stylexResult.className;
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
			ref: popoverRefCallback,
			id,
			popover: lightDismiss ? "auto" : "manual",
			className: combinedClassName,
			style: {
				...stylexResult.style,
				...positionStyle,
				...extraStyle
			},
			children
		});
	}, [
		popoverRefCallback,
		id,
		lightDismiss
	]);
	if (mode === "context") return {
		ref,
		anchorId,
		show,
		hide,
		isOpen,
		id,
		render: renderContext
	};
	return {
		ref: void 0,
		show,
		hide,
		isOpen,
		id,
		render: renderFixed
	};
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layer/layerAnimations.stylex.js
durationVars["--duration-fast-max"], easeVars["--ease-standard"];
/**
* Shared entry animation styles for layer-based components.
*
* Keyed by LayerPlacement ('above' | 'below' | 'start' | 'end')
* for easy lookup: `layerAnimations[placement]`.
*
* Each entry disables its keyframe animation under
* `prefers-reduced-motion: reduce` so the layer appears instantly instead of
* translating/scaling in (infra-6).
*/
var layerAnimations = {
	below: {
		kKVMdj: "xl1vlw0 x1aquc0h",
		k44tkh: "x9uej1z",
		kyAemX: "x128ha8g",
		kWV6AL: "xskzprw",
		$$css: true
	},
	above: {
		kKVMdj: "x3psbcj x1aquc0h",
		k44tkh: "x9uej1z",
		kyAemX: "x128ha8g",
		kWV6AL: "xskzprw",
		$$css: true
	},
	end: {
		kKVMdj: "x1i331go x1aquc0h",
		k44tkh: "x9uej1z",
		kyAemX: "x128ha8g",
		kWV6AL: "xskzprw",
		$$css: true
	},
	start: {
		kKVMdj: "xck01x9 x1aquc0h",
		k44tkh: "x9uej1z",
		kyAemX: "x128ha8g",
		kWV6AL: "xskzprw",
		$$css: true
	}
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/Tooltip/useTooltip.js
/**
* @file useTooltip.tsx
* @input Uses useLayer, React hooks
* @output Exports useTooltip hook for hover/focus triggered tooltips
* @position Layer hook; builds on useLayer for tooltip behavior
*
* SYNC: When modified, update:
* - /packages/core/src/Tooltip/index.ts
*/
/**
* Grace period (ms) before hiding on pointer-leave when no explicit `hideDelay`
* is set, so the pointer can travel across the small gap from the trigger onto
* the tooltip surface without the tooltip disappearing (WCAG 1.4.13 hoverable).
*/
var HOVER_BRIDGE_DELAY = 100;
var styles$3 = {
	container: {
		kWkggS: "x19aspcf",
		kMwMTN: "xrkvqaz",
		kaIpWk: "x1hviunn",
		kMv6JI: "x9ynric",
		kGuDYH: "xjm74w1",
		kLWn49: "xw6l6zx",
		$$css: true
	},
	marginBlock: {
		keoZOQ: "xcsaf9d",
		k1K539: "x14cgwvg",
		keTefX: "x1lziwak",
		k71WvV: "x14z9mp",
		$$css: true
	},
	marginInline: {
		keoZOQ: "xdj266r",
		k1K539: "xat24cr",
		keTefX: "x11g1kdw",
		k71WvV: "xnur1sd",
		$$css: true
	}
};
/**
* Focus trigger behavior for tooltips
*/
/**
* Check if an element is naturally focusable
*/
function isFocusable(element) {
	if (element.hasAttribute("tabindex")) return element.tabIndex >= 0;
	if ([
		"A",
		"BUTTON",
		"INPUT",
		"SELECT",
		"TEXTAREA"
	].includes(element.tagName)) return !element.disabled;
	if (element.isContentEditable) return true;
	return false;
}
/**
* Hook for tooltip behavior with hover/focus triggers.
*
* Builds on useLayer to add:
* - Hover triggers with configurable delay
* - Focus triggers with auto-detection for focusable elements
* - Inverted color palette for high contrast
*
* Unlike HoverCard, tooltips:
* - Don't stay open when hovering the tooltip content
* - Have shorter delays
* - Use inverted colors (dark background, light text)
* - Are typically used for short, non-interactive text
*
* @example
* ```
* const tooltip = useTooltip({ placement: 'above' });
* <Button ref={tooltip.ref} aria-describedby={tooltip.describedBy}>
*   Hover me
* </Button>
* {tooltip.renderTooltip('Helpful tooltip text')}
* ```
*/
function useTooltip(options = {}) {
	const { placement = "above", alignment = "center", delay = 200, hideDelay = 0, focusTrigger = "auto", isEnabled = true, isOpen, isDefaultOpen = false, onShow, onHide } = options;
	const marginStyle = placement === "above" || placement === "below" ? styles$3.marginBlock : styles$3.marginInline;
	const layer = useLayer({
		mode: "context",
		onShow,
		onHide
	});
	const popoverXstyle = (0, import_react.useMemo)(() => [styles$3.container, marginStyle], [marginStyle]);
	const showTimeoutRef = (0, import_react.useRef)(null);
	const hideTimeoutRef = (0, import_react.useRef)(null);
	const triggerRef = (0, import_react.useRef)(null);
	const clearTimeouts = (0, import_react.useCallback)(() => {
		if (showTimeoutRef.current) {
			clearTimeout(showTimeoutRef.current);
			showTimeoutRef.current = null;
		}
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current);
			hideTimeoutRef.current = null;
		}
	}, []);
	const scheduleShow = (0, import_react.useCallback)(() => {
		if (!isEnabled || isOpen === false) return;
		clearTimeouts();
		showTimeoutRef.current = setTimeout(() => {
			layer.show();
		}, delay);
	}, [
		isEnabled,
		isOpen,
		clearTimeouts,
		layer,
		delay
	]);
	const scheduleHide = (0, import_react.useCallback)(() => {
		if (isOpen === true) return;
		clearTimeouts();
		hideTimeoutRef.current = setTimeout(() => {
			layer.hide();
		}, hideDelay > 0 ? hideDelay : HOVER_BRIDGE_DELAY);
	}, [
		isOpen,
		clearTimeouts,
		layer,
		hideDelay
	]);
	const cancelHide = (0, import_react.useCallback)(() => {
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current);
			hideTimeoutRef.current = null;
		}
	}, []);
	const handleMouseEnter = (0, import_react.useCallback)(() => {
		if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches) return;
		scheduleShow();
	}, [scheduleShow]);
	const handleMouseLeave = (0, import_react.useCallback)(() => {
		scheduleHide();
	}, [scheduleHide]);
	const handleFocusIn = (0, import_react.useCallback)((e) => {
		if (!isEnabled) return;
		if (!e.target.matches(":focus-visible")) return;
		clearTimeouts();
		layer.show();
	}, [
		isEnabled,
		clearTimeouts,
		layer
	]);
	const handleFocusOut = (0, import_react.useCallback)(() => {
		scheduleHide();
	}, [scheduleHide]);
	const interactionRef = (0, import_react.useCallback)((el) => {
		if (triggerRef.current) {
			triggerRef.current.removeEventListener("mouseenter", handleMouseEnter);
			triggerRef.current.removeEventListener("mouseleave", handleMouseLeave);
			triggerRef.current.removeEventListener("focusin", handleFocusIn);
			triggerRef.current.removeEventListener("focusout", handleFocusOut);
		}
		if (el) {
			el.addEventListener("mouseenter", handleMouseEnter);
			el.addEventListener("mouseleave", handleMouseLeave);
			if (focusTrigger === "always" || focusTrigger === "auto" && isFocusable(el)) {
				el.addEventListener("focusin", handleFocusIn);
				el.addEventListener("focusout", handleFocusOut);
			}
		}
		triggerRef.current = el;
	}, [
		focusTrigger,
		handleMouseEnter,
		handleMouseLeave,
		handleFocusIn,
		handleFocusOut
	]);
	const ref = (0, import_react.useCallback)((el) => {
		layer.ref(el);
		interactionRef(el);
	}, [layer, interactionRef]);
	(0, import_react.useEffect)(() => {
		return () => {
			clearTimeouts();
		};
	}, [clearTimeouts]);
	(0, import_react.useEffect)(() => {
		if (isDefaultOpen) layer.show();
	}, []);
	(0, import_react.useEffect)(() => {
		if (isOpen === void 0) return;
		if (isOpen) {
			clearTimeouts();
			layer.show();
		} else {
			clearTimeouts();
			layer.hide();
		}
	}, [
		isOpen,
		clearTimeouts,
		layer
	]);
	(0, import_react.useEffect)(() => {
		if (isOpen !== void 0) return;
		const handleKeyDown = (e) => {
			if (e.key !== "Escape") return;
			if (e.isComposing || e.keyCode === 229) return;
			clearTimeouts();
			layer.hide();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		isOpen,
		layer,
		clearTimeouts
	]);
	const renderTooltip = (0, import_react.useCallback)((children, props) => {
		const renderPlacement = props?.placement ?? placement;
		const renderProps = {
			placement: renderPlacement,
			alignment: props?.alignment ?? alignment,
			role: "tooltip",
			xstyle: [popoverXstyle, layerAnimations[renderPlacement]],
			className: themeProps("tooltip").className,
			onMouseEnter: cancelHide,
			onMouseLeave: scheduleHide
		};
		return layer.render(/*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
			className: "xfsso4q xy143xn x12gdq22 x1djylfy xw5ewwj x13faqbe",
			children
		}), renderProps);
	}, [
		layer,
		placement,
		alignment,
		popoverXstyle,
		cancelHide,
		scheduleHide
	]);
	return {
		ref,
		positionRef: layer.ref,
		interactionRef,
		anchorId: layer.anchorId,
		describedBy: layer.id,
		renderTooltip
	};
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/syntax/tokens.js
/**
* @file tokens.ts
* @input None (pure token definitions)
* @output syntaxTokenDefaults, SyntaxTokenName
* @position Domain token sub-module; re-exported from domainTokens/index.ts
*
* Code syntax highlighting tokens. Used by the CodeBlock component and any
* consumer that renders highlighted source code.
*
* Default values reference the theme's named palette via var() so syntax
* colors automatically adapt to any theme's color system. Themes can also
* set an explicit syntax theme via defineTheme({ syntax: dracula }).
*
* 14-token architecture validated against 11 community code themes.
* All themes map cleanly to these 14 slots.
*
* @see https://github.com/facebook/astryx/issues/1148
*/
var syntaxTokenDefaults = {
	"--color-syntax-keyword": "var(--color-text-accent)",
	"--color-syntax-string": "var(--color-text-green)",
	"--color-syntax-comment": "var(--color-text-secondary)",
	"--color-syntax-number": "var(--color-text-orange)",
	"--color-syntax-function": "var(--color-text-blue)",
	"--color-syntax-type": "var(--color-text-purple)",
	"--color-syntax-variable": "var(--color-text-primary)",
	"--color-syntax-operator": "var(--color-text-cyan)",
	"--color-syntax-constant": "var(--color-text-orange)",
	"--color-syntax-tag": "var(--color-text-red)",
	"--color-syntax-attribute": "var(--color-text-teal)",
	"--color-syntax-property": "var(--color-text-cyan)",
	"--color-syntax-punctuation": "var(--color-text-disabled)",
	"--color-syntax-background": "var(--color-background-muted)"
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/domainTokens/dataTokens.js
/**
* @file dataTokens.ts
* @input None (pure token definitions)
* @output dataTokenDefaults, DataTokenName
* @position Domain token sub-module; re-exported from domainTokens/index.ts
*
* Data visualization tokens. Used by chart and graph components to maintain
* consistent, theme-aware color palettes across all data vis surfaces.
*
* Token structure:
* - Categorical: one accent per category (use for distinct series/dimensions)
* - Neutral: a single neutral tone (use for labels, reference lines, empty states)
* - Sequential ramps (color-5 → color-1): darkest → lightest within a hue.
*   Use for ordered/quantitative scales, heatmaps, choropleth maps.
*/
var dataTokenDefaults = {
	"--color-data-categorical-blue": "light-dark(#0171E3, #0171E3)",
	"--color-data-categorical-orange": "light-dark(#EB6E00, #EB6E00)",
	"--color-data-categorical-purple": "light-dark(#6B1EFD, #6B1EFD)",
	"--color-data-categorical-green": "light-dark(#0B991F, #0B991F)",
	"--color-data-categorical-pink": "light-dark(#F351C0, #F351C0)",
	"--color-data-categorical-cyan": "light-dark(#0171A4, #0171A4)",
	"--color-data-categorical-red": "light-dark(#F5394F, #F5394F)",
	"--color-data-categorical-teal": "light-dark(#08A3A3, #08A3A3)",
	"--color-data-categorical-brown": "light-dark(#965E03, #965E03)",
	"--color-data-categorical-indigo": "light-dark(#6F8AFF, #6F8AFF)",
	"--color-data-neutral": "light-dark(#8494A3, #8C939B)",
	"--color-data-blue-5": "light-dark(#02165E, #02165E)",
	"--color-data-blue-4": "light-dark(#004CBC, #004CBC)",
	"--color-data-blue-3": "light-dark(#2694FE, #2694FE)",
	"--color-data-blue-2": "light-dark(#78BEFF, #78BEFF)",
	"--color-data-blue-1": "light-dark(#DBECFF, #DBECFF)",
	"--color-data-shamrock-5": "light-dark(#0B603D, #0B603D)",
	"--color-data-shamrock-4": "light-dark(#138546, #138546)",
	"--color-data-shamrock-3": "light-dark(#24BB5E, #24BB5E)",
	"--color-data-shamrock-2": "light-dark(#8EF7AA, #8EF7AA)",
	"--color-data-shamrock-1": "light-dark(#D6FEE4, #D6FEE4)",
	"--color-data-orange-5": "light-dark(#A13F04, #A13F04)",
	"--color-data-orange-4": "light-dark(#D66100, #D66100)",
	"--color-data-orange-3": "light-dark(#FD9537, #FD9537)",
	"--color-data-orange-2": "light-dark(#FDB876, #FDB876)",
	"--color-data-orange-1": "light-dark(#FFE6CF, #FFE6CF)",
	"--color-data-pink-5": "light-dark(#8E1073, #8E1073)",
	"--color-data-pink-4": "light-dark(#D123A1, #D123A1)",
	"--color-data-pink-3": "light-dark(#F989D3, #F989D3)",
	"--color-data-pink-2": "light-dark(#FEADE3, #FEADE3)",
	"--color-data-pink-1": "light-dark(#FCE3F4, #FCE3F4)",
	"--color-data-purple-5": "light-dark(#3E0697, #3E0697)",
	"--color-data-purple-4": "light-dark(#6B1EFD, #6B1EFD)",
	"--color-data-purple-3": "light-dark(#9081FF, #9081FF)",
	"--color-data-purple-2": "light-dark(#B3B0FE, #B3B0FE)",
	"--color-data-purple-1": "light-dark(#E8E8FB, #E8E8FB)",
	"--color-data-red-5": "light-dark(#9D0519, #9D0519)",
	"--color-data-red-4": "light-dark(#D31130, #D31130)",
	"--color-data-red-3": "light-dark(#FB7D87, #FB7D87)",
	"--color-data-red-2": "light-dark(#FFB2B8, #FFB2B8)",
	"--color-data-red-1": "light-dark(#FEE4E6, #FEE4E6)",
	"--color-data-teal-5": "light-dark(#08767D, #08767D)",
	"--color-data-teal-4": "light-dark(#0C9293, #0C9293)",
	"--color-data-teal-3": "light-dark(#0DB7AF, #0DB7AF)",
	"--color-data-teal-2": "light-dark(#6CE6D8, #6CE6D8)",
	"--color-data-teal-1": "light-dark(#D7FCF8, #D7FCF8)",
	"--color-data-yellow-5": "light-dark(#8A5001, #8A5001)",
	"--color-data-yellow-4": "light-dark(#D69804, #D69804)",
	"--color-data-yellow-3": "light-dark(#FBCE03, #FBCE03)",
	"--color-data-yellow-2": "light-dark(#FCEC85, #FCEC85)",
	"--color-data-yellow-1": "light-dark(#FDF6BA, #FDF6BA)",
	"--color-data-gray-5": "light-dark(#25363F, #333338)",
	"--color-data-gray-4": "light-dark(#5D6C7B, #666A72)",
	"--color-data-gray-3": "light-dark(#AFB9C4, #B2B8BE)",
	"--color-data-gray-2": "light-dark(#CCD3DB, #D0D3D6)",
	"--color-data-gray-1": "light-dark(#F1F4F7, #F2F4F6)"
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/domainTokens/index.js
/** All domain token defaults merged — used by defineTheme for validation */
var domainTokenDefaults = {
	...syntaxTokenDefaults,
	...dataTokenDefaults
};
/** Union of all domain token names */
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/defineTheme.js
/** All valid Astryx core token names */
/** All valid Astryx token names — core + domain tokens */
/**
* Token value — either a single string or a [light, dark] tuple.
* Tuples are converted to CSS light-dark() at theme creation time.
*/
/**
* CSS property values for a style rule.
*
* Keys are camelCase CSS properties with string values, OR pseudo-class
* selectors (starting with `:`) mapping to nested property objects.
*
* Pseudo-class keys generate separate CSS rules with the pseudo appended
* to the component selector. Supported pseudo-classes include `:hover`,
* `:focus-visible`, `:active`, `:checked`, `:disabled`, etc.
*
* @example
* ```ts
* {
*   borderColor: '#8F9296',
*   ':hover': { borderColor: 'color-mix(in srgb, #8F9296, black 20%)' },
*   ':focus-visible': { outline: '2px solid var(--color-accent)' },
* }
* ```
*/
/**
* Component style overrides.
*
* Each top-level key is a component name (lowercase). Values are objects
* mapping style keys to CSS property overrides:
* - `base` — styles applied to all instances of the component
* - `prop:value` — styles when a visual prop matches (e.g. `variant:secondary`)
* - `prop:value+prop:value` — intersection of multiple props
*
* The `base` key is optional — omit it to only override specific variants.
*
* Style values can include pseudo-class keys (`:hover`, `:focus-visible`, etc.)
* to override interaction states without CSS custom property escape hatches.
*
* @example
* ```tsx
* components: {
*   button: {
*     base: { fontWeight: '600' },
*     'variant:secondary': { backgroundColor: 'rgba(0,0,0,0.06)' },
*     'variant:destructive+size:sm': { padding: '2px 6px' },
*   },
*   badge: {
*     'variant:ghost': { border: '1px solid var(--color-border)' },
*   },
*   radio: {
*     base: {
*       borderColor: '#8F9296',
*       ':hover': { borderColor: 'color-mix(in srgb, #8F9296, black 20%)' },
*     },
*   },
* }
* ```
*/
/** Input to defineTheme */
/** A defined theme — ready to pass to <Theme> */
/** All Astryx token defaults as a flat map. Useful for resolving full token sets. */
var tokenDefaults = {
	...colorDefaults,
	...spacingDefaults,
	...sizeDefaults,
	...radiusDefaults,
	...shadowDefaults,
	...durationDefaults,
	...easeDefaults,
	...transitionDefaults,
	...typographyDefaults,
	...textSizeDefaults,
	...fontWeightDefaults,
	...typeScaleDefaults,
	...domainTokenDefaults
};
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/tokens.js
/**
* @file tokens.ts
* @input DefinedTheme objects and token names
* @output Server-safe token helpers for resolving theme values and building CSS var references
* @position Public theme utility; backs useTheme and external styling-library adapters
*
* Use these helpers when code outside React hooks needs Astryx token values:
* build-time theme adapters, chart configuration, canvas/SVG rendering, tests,
* or plain JS theme objects for other styling libraries.
*
* SYNC: When modified, update:
* - /packages/core/src/theme/useTheme.ts
* - /packages/core/src/theme/index.ts
*/
/** Resolved color mode used when choosing the side of light/dark token values. */
/** Options for resolving all tokens from a theme object. */
/** Options for resolving one token from a theme object. */
/**
* Return a CSS custom property reference for an Astryx token name.
*
* Useful for non-StyleX styling-library configs (Panda, Chakra, MUI,
* Emotion, styled-components, UnoCSS, CSS Modules) where the value should
* stay connected to the active Astryx theme through the CSS cascade.
*
* @example
* ```ts
* const theme = {
*   colors: {
*     text: tokenVar('--color-text-primary'),
*     surface: tokenVar('--color-background-surface'),
*   },
* };
* ```
*/
function tokenVar(name) {
	return `var(${name})`;
}
Object.fromEntries(Object.keys(tokenDefaults).map((name) => [name, tokenVar(name)]));
/**
* Split the arguments of a CSS function body on the first top-level comma.
* Handles nested functions such as rgba(), color-mix(), var(), and quoted strings.
*/
function splitTopLevelComma(input) {
	let depth = 0;
	let quote = null;
	let isEscaped = false;
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		if (quote !== null) {
			if (isEscaped) isEscaped = false;
			else if (char === "\\") isEscaped = true;
			else if (char === quote) quote = null;
			continue;
		}
		if (char === "\"" || char === "'") {
			quote = char;
			continue;
		}
		if (char === "(") {
			depth++;
			continue;
		}
		if (char === ")") {
			depth = Math.max(0, depth - 1);
			continue;
		}
		if (char === "," && depth === 0) return [input.slice(0, i).trim(), input.slice(i + 1).trim()];
	}
	return null;
}
/** Parse a CSS light-dark(light, dark) function into its two argument values. */
function parseLightDark(value) {
	const trimmed = value.trim();
	if (!trimmed.startsWith("light-dark(") || !trimmed.endsWith(")")) return null;
	return splitTopLevelComma(trimmed.slice(11, -1));
}
/**
* Resolve a token value for a specific mode.
*
* - `[light, dark]` tuple → picks the side for `mode`
* - `light-dark(light, dark)` string → parses nested CSS values and picks the side
* - any other string → returned unchanged
*/
function resolveXDSTokenValue(value, mode) {
	if (Array.isArray(value)) return mode === "dark" ? value[1] : value[0];
	const parsed = parseLightDark(value);
	if (parsed !== null) return mode === "dark" ? parsed[1] : parsed[0];
	return value;
}
/**
* Resolve all Astryx token values for a theme and effective color mode.
*
* The result starts with `tokenDefaults`, applies `theme.tokens`, then
* reapplies `theme.__inputTokens` when available so explicit tuple overrides
* retain their original light/dark sides instead of relying on CSS parsing.
* This mirrors the token resolution used by `useTheme()` but does not need
* React context or media queries.
*
* Pass `theme` as null/undefined to resolve defaults only.
*/
function resolveThemeTokens(theme, options) {
	const { mode } = options;
	const resolved = {};
	for (const [key, value] of Object.entries(tokenDefaults)) resolved[key] = resolveXDSTokenValue(value, mode);
	if (theme == null) return resolved;
	for (const [key, value] of Object.entries(theme.tokens)) resolved[key] = resolveXDSTokenValue(value, mode);
	if (theme.__inputTokens) {
		for (const [key, value] of Object.entries(theme.__inputTokens)) if (value !== void 0) resolved[key] = resolveXDSTokenValue(value, mode);
	}
	return resolved;
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/hooks/useMediaQuery.js
/**
* @file useMediaQuery.ts
* @input Uses React useSyncExternalStore, useCallback
* @output Exports useMediaQuery hook for responsive breakpoint detection
* @position Core hook; used by consumers for responsive patterns
*
* SSR-safe media query hook that subscribes to window.matchMedia changes
* via useSyncExternalStore — the canonical React pattern for external
* browser state.
*
* SYNC: When modified, update:
* - /packages/core/src/hooks/index.ts
*/
/**
* SSR-safe media query hook.
* Returns whether the given media query matches.
*
* @param query - CSS media query string
* @param serverDefault - Value to return during SSR. Pass a server-side hint
*   (e.g. derived from User-Agent or client hints) to avoid a layout flash.
*
* @example
* ```
* const isMobile = useMediaQuery('(max-width: 768px)');
* const isMobile = useMediaQuery('(max-width: 768px)', defaultIsMobile);
* ```
*/
function useMediaQuery(query, serverDefault = false) {
	return (0, import_react.useSyncExternalStore)((0, import_react.useCallback)((onStoreChange) => {
		const mql = window.matchMedia(query);
		mql.addEventListener("change", onStoreChange);
		return () => mql.removeEventListener("change", onStoreChange);
	}, [query]), (0, import_react.useCallback)(() => {
		return window.matchMedia(query).matches;
	}, [query]), (0, import_react.useCallback)(() => serverDefault, [serverDefault]));
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/theme/useTheme.js
/**
* @file useTheme.ts
* @input ThemeContext provided by Theme
* @output Exports useTheme hook for programmatic access to resolved theme tokens
* @position Theme hook; used by data viz, canvas, and non-CSS consumers
*
* Provides synchronous access to theme token values resolved for the
* current color mode — no DOM reads, no double render. Token resolution
* is shared with the server-safe helpers in ./tokens.ts.
*
* SYNC: When modified, update:
* - /packages/core/src/theme/index.ts
*/
/**
* Internal context value — carries the theme + mode from Theme.
* @internal
*/
/**
* React context for the nearest Theme provider.
* null when no provider is present.
* @internal
*/
var ThemeContext = /*#__PURE__*/ (0, import_react.createContext)(null);
ThemeContext.displayName = "ThemeContext";
/**
* Resolved theme data returned by useTheme.
*/
/**
* Access the current Astryx theme's token values, resolved for the active color mode.
*
* Returns raw CSS values (hex colors, px values, etc.) suitable for
* non-CSS consumers like canvas, SVG, or data visualization libraries
* (e.g. Vega, D3, Chart.js) that need concrete values rather than
* CSS custom property references.
*
* When called outside an <Theme> provider, returns the default theme
* tokens resolved against the current system color mode.
*
* @example
* ```
* function Chart() {
*   const { token, mode } = useTheme();
*   return (
*     <svg>
*       <rect fill={token('--color-accent')} />
*       <text fill={token('--color-text-primary')}>Sales</text>
*     </svg>
*   );
* }
* ```
*/
function useTheme() {
	const ctx = (0, import_react.use)(ThemeContext);
	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
	const mode = ctx?.mode ?? "system";
	const theme = ctx?.theme ?? null;
	const effectiveMode = mode === "system" ? prefersDark ? "dark" : "light" : mode;
	const tokens = (0, import_react.useMemo)(() => resolveThemeTokens(theme, { mode: effectiveMode }), [theme, effectiveMode]);
	const token = (name) => {
		return tokens[name] ?? "";
	};
	return {
		name: theme?.name ?? "default",
		mode: effectiveMode,
		token,
		tokens
	};
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Text/text.stylex.js
var colorStyles = {
	primary: {
		kMwMTN: "x1tgivj0",
		$$css: true
	},
	secondary: {
		kMwMTN: "xv1l7n4",
		$$css: true
	},
	disabled: {
		kMwMTN: "xnbbluu",
		$$css: true
	},
	placeholder: {
		kMwMTN: "xv1l7n4",
		$$css: true
	},
	accent: {
		kMwMTN: "xjse4m1",
		$$css: true
	},
	inherit: {
		kMwMTN: "x1heor9g",
		$$css: true
	}
};
var weightStyles = {
	normal: {
		k63SB2: "x1sodnla",
		$$css: true
	},
	medium: {
		k63SB2: "x1e4wzip",
		$$css: true
	},
	semibold: {
		k63SB2: "x2mo6ok",
		$$css: true
	},
	bold: {
		k63SB2: "x1lvx875",
		$$css: true
	}
};
var defaultWeightByTypeStyles = {
	body: {
		k63SB2: "xxovm9e",
		$$css: true
	},
	large: {
		k63SB2: "x149oux8",
		$$css: true
	},
	label: {
		k63SB2: "xmhvcl5",
		$$css: true
	},
	code: {
		k63SB2: "xx3eeay",
		$$css: true
	},
	supporting: {
		k63SB2: "xv8on6e",
		$$css: true
	},
	"display-1": {
		k63SB2: "x1txul5o",
		$$css: true
	},
	"display-2": {
		k63SB2: "x1y36c3f",
		$$css: true
	},
	"display-3": {
		k63SB2: "x1on40hk",
		$$css: true
	},
	inherit: {
		k63SB2: "x1pd3egz",
		$$css: true
	}
};
var sizeByTypeStyles = {
	body: {
		kGuDYH: "xjm74w1",
		kLWn49: "xw6l6zx",
		$$css: true
	},
	large: {
		kGuDYH: "x18juvz8",
		kLWn49: "xf74fhv",
		$$css: true
	},
	label: {
		kGuDYH: "xcr08ib",
		kLWn49: "x1kq96og",
		$$css: true
	},
	code: {
		kGuDYH: "xp03k98",
		kLWn49: "x17iicif",
		kMv6JI: "x9m5x89",
		$$css: true
	},
	supporting: {
		kGuDYH: "x141an7d",
		kLWn49: "x1ltkj2j",
		$$css: true
	},
	"display-1": {
		kGuDYH: "xsub3ws",
		kLWn49: "x112ttwr",
		$$css: true
	},
	"display-2": {
		kGuDYH: "x1yego12",
		kLWn49: "xh0iwvy",
		$$css: true
	},
	"display-3": {
		kGuDYH: "xlgnzhf",
		kLWn49: "x1ujwuaq",
		$$css: true
	},
	inherit: {
		kGuDYH: "x1qlqyl8",
		kLWn49: "x15bjb6t",
		$$css: true
	}
};
var sizeStyles$1 = {
	"4xs": {
		kGuDYH: "xxc45ev",
		$$css: true
	},
	"3xs": {
		kGuDYH: "x10p7juq",
		$$css: true
	},
	"2xs": {
		kGuDYH: "x16a80zy",
		$$css: true
	},
	xsm: {
		kGuDYH: "x51wmvv",
		$$css: true
	},
	sm: {
		kGuDYH: "x1eqnyfr",
		$$css: true
	},
	base: {
		kGuDYH: "x1j29vfg",
		$$css: true
	},
	lg: {
		kGuDYH: "xc7cgfe",
		$$css: true
	},
	xl: {
		kGuDYH: "x1wqms48",
		$$css: true
	},
	"2xl": {
		kGuDYH: "xhs0kqb",
		$$css: true
	},
	"3xl": {
		kGuDYH: "x10srzze",
		$$css: true
	},
	"4xl": {
		kGuDYH: "xqcvi3d",
		$$css: true
	}
};
var sizeByLevelStyles = {
	"1": {
		kGuDYH: "xcg7oai",
		kLWn49: "xfmsba7",
		k63SB2: "x1v68xuy",
		$$css: true
	},
	"2": {
		kGuDYH: "x1xvnhcw",
		kLWn49: "x1cpk1wn",
		k63SB2: "x12yy4cs",
		$$css: true
	},
	"3": {
		kGuDYH: "xii13ha",
		kLWn49: "xwjzt0u",
		k63SB2: "x1jcxfy8",
		$$css: true
	},
	"4": {
		kGuDYH: "x8tkxat",
		kLWn49: "xqerer",
		k63SB2: "x2hcmsi",
		$$css: true
	},
	"5": {
		kGuDYH: "xsgqta0",
		kLWn49: "xo3gurs",
		k63SB2: "xno150v",
		$$css: true
	},
	"6": {
		kGuDYH: "xw5ohdf",
		kLWn49: "xeixjfn",
		k63SB2: "x1pw4frv",
		$$css: true
	}
};
var displayStyles = {
	inline: {
		k1xSpc: "xt0psk2",
		$$css: true
	},
	block: {
		k1xSpc: "x1lliihq",
		$$css: true
	}
};
var truncationStyles = {
	singleLine: {
		kVQacm: "xb3r6kr",
		kg5iWk: "xlyipyv",
		khDVqt: "xuxw1ft",
		k1xSpc: "x1lliihq",
		$$css: true
	},
	multiLine: {
		kVQacm: "xb3r6kr",
		k1xSpc: "x104kibb",
		kgKLqz: "x1ua5tub",
		$$css: true
	}
};
var wordBreakStyles = {
	"break-word": {
		kTgw9: "x1lldw8n",
		kHjlTd: "x1mzt3pk",
		$$css: true
	},
	"break-all": {
		kTgw9: "x1yn0g08",
		$$css: true
	}
};
var textWrapStyles = {
	wrap: {
		kN2L0X: "xk4td0m",
		$$css: true
	},
	nowrap: {
		kN2L0X: "xebhuq6",
		$$css: true
	},
	balance: {
		kN2L0X: "x1w2vvpw",
		$$css: true
	},
	pretty: {
		kN2L0X: "x1fzhlzt",
		$$css: true
	}
};
var capsizeStyles = { enabled: {
	kxwWH2: "x1b2iylo",
	kzeHkT: "xwgcxoh",
	k1xSpc: "x1lliihq",
	$$css: true
} };
var decorationStyles = { strikethrough: {
	kybGjl: "xmqliwb",
	$$css: true
} };
var tabularNumbersStyle = { enabled: {
	kcqcaj: "xss6m8b",
	$$css: true
} };
var justifyStyles = {
	start: {
		k9WMMc: "x1yc453h",
		$$css: true
	},
	center: {
		k9WMMc: "x2b8uid",
		$$css: true
	},
	end: {
		k9WMMc: "xp4054r",
		$$css: true
	}
};
var truncationTooltipStyles = { content: {
	ks0D6T: "xw5ewwj",
	kTgw9: "x13faqbe",
	$$css: true
} };
//#endregion
//#region node_modules/@astryxdesign/core/dist/Text/useTruncation.js
/**
* @file useTruncation.ts
* @input Uses React hooks, sharedResizeObserver
* @output Exports useTruncation hook for detecting text overflow
* @position Hook; consumed by Text.tsx, Heading.tsx
*
* SYNC: When modified, update:
* - /packages/core/src/Text/Text.doc.mjs
*/
/**
* Hook for detecting text overflow/truncation.
*
* Uses a shared ResizeObserver singleton (via observeResize/unobserveResize)
* for efficient detection when content or container changes. A single
* ResizeObserver instance is shared across all mounted useTruncation hooks,
* so even hundreds of table cells only create one observer.
*
* - Single-line: compares scrollWidth > offsetWidth
* - Multi-line: uses Range.getBoundingClientRect() to measure actual content
*   height, bypassing -webkit-line-clamp's clamped scrollHeight
*
* @example
* ```
* const truncation = useTruncation({ maxLines: 2 });
*
* <div ref={truncation.ref} style={{ WebkitLineClamp: 2 }}>
*   {text}
* </div>
*
* {truncation.isTruncated && <Tooltip>{truncation.fullText}</Tooltip>}
* ```
*/
function useTruncation(options) {
	const { maxLines } = options;
	const [isTruncated, setIsTruncated] = (0, import_react.useState)(false);
	const [fullText, setFullText] = (0, import_react.useState)("");
	const elementRef = (0, import_react.useRef)(null);
	const checkTruncation = (0, import_react.useCallback)((element) => {
		if (maxLines === 0) {
			setIsTruncated(false);
			return;
		}
		setFullText(element.textContent ?? "");
		if (maxLines === 1) setIsTruncated(element.scrollWidth > element.offsetWidth);
		else {
			let contentHeight = element.scrollHeight;
			try {
				const range = document.createRange();
				range.selectNodeContents(element);
				contentHeight = range.getBoundingClientRect().height;
				range.detach();
			} catch {}
			setIsTruncated(contentHeight > element.offsetHeight);
		}
	}, [maxLines]);
	return {
		ref: (0, import_react.useCallback)((element) => {
			if (elementRef.current) unobserveResize(elementRef.current);
			elementRef.current = element;
			if (element && maxLines > 0) if (typeof ResizeObserver !== "undefined") observeResize(element, () => {
				checkTruncation(element);
			});
			else checkTruncation(element);
			else {
				setIsTruncated(false);
				setFullText("");
			}
		}, [maxLines, checkTruncation]),
		isTruncated,
		fullText
	};
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Text/Text.js
/**
* @file Text.tsx
* @input Uses React, HTMLAttributes, ReactNode
* @output Exports Text component, TextProps, TextType, TextSize types
* @position Core implementation; consumed by index.ts, tested by Text.test.tsx
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Text/Text.doc.mjs (props table, features, implementation notes)
* - /packages/core/src/Text/Text.test.tsx (tests for new/changed behavior)
* - /packages/core/src/Text/index.ts (exports if types change)
* - /apps/storybook/stories/Text.stories.tsx (storybook stories)
* - /packages/cli/templates/blocks/components/Text/ (showcase blocks)
*/
var LazyXDSTooltip$1 = /*#__PURE__*/ (0, import_react.lazy)(async () => Promise.resolve().then(() => Tooltip_exports).then((mod) => ({ default: mod.Tooltip })));
var defaultColorByType = {
	body: "primary",
	large: "primary",
	label: "primary",
	supporting: "secondary",
	code: "primary",
	"display-1": "primary",
	"display-2": "primary",
	"display-3": "primary",
	inherit: "inherit"
};
/**
* Resolve the StyleX style key for a text type.
* Custom (theme-defined) types fall back to 'body' for baseline StyleX styles;
* their visual treatment comes from theme CSS overrides (.astryx-text.<type>).
*/
function resolveStyleType(type) {
	if (type in sizeByTypeStyles) return type;
	return "body";
}
/**
* Semantic text component. Renders text with type-based styling from the theme.
*
* @example
* ```
* <Text type="body">Body text</Text>
* <Text type="large">Large body text</Text>
* <Text type="label">Form label</Text>
* <Text type="supporting">Helper text</Text>
* <Text type="code">{'const x = 1;'}</Text>
* <Text type="display-1" as="h1">Hero Title</Text>
* <Text type="display-2">$1.2M Revenue</Text>
* <Text type="body" maxLines={2}>Clamped text</Text>
* ```
*/
function Text({ type = "body", size, color, weight, display = "inline", maxLines = 0, hasTruncateTooltip = true, wordBreak, textWrap, justify = "start", hasCapsize = false, hasStrikethrough = false, hasTabularNumbers = false, xstyle, className, style, as: Component = "span", children, ref, ...props$4 }) {
	const resolvedColor = color ?? defaultColorByType[type] ?? "primary";
	const styleType = resolveStyleType(type);
	const resolvedWordBreak = wordBreak ?? (maxLines === 1 ? "break-all" : "break-word");
	const resolvedDisplay = maxLines > 0 || hasCapsize ? "block" : display;
	const truncation = useTruncation({ maxLines });
	const tooltipPlacement = typeof hasTruncateTooltip === "string" ? hasTruncateTooltip : "above";
	const tooltipEnabled = maxLines > 0 && hasTruncateTooltip !== false && truncation.isTruncated;
	const textRef = (0, import_react.useRef)(null);
	const inlineStyle = maxLines > 1 ? { WebkitLineClamp: maxLines } : void 0;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)(Component, {
		ref: mergeRefs(ref, truncation.ref, textRef),
		...mergeProps(themeProps("text", {
			type,
			size,
			color: resolvedColor
		}), props(colorStyles[resolvedColor], sizeByTypeStyles[styleType], size && sizeStyles$1[size], defaultWeightByTypeStyles[styleType], weight && weightStyles[weight], maxLines === 1 ? truncationStyles.singleLine : maxLines > 1 ? truncationStyles.multiLine : displayStyles[resolvedDisplay], maxLines > 0 && wordBreakStyles[resolvedWordBreak], textWrap && textWrapStyles[textWrap], justify !== "start" && justifyStyles[justify], hasCapsize && capsizeStyles.enabled, hasStrikethrough && decorationStyles.strikethrough, hasTabularNumbers && tabularNumbersStyle.enabled, xstyle), className, {
			...style,
			...inlineStyle
		}),
		title: tooltipEnabled ? truncation.fullText : void 0,
		...props$4,
		children
	}), tooltipEnabled && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: null,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(LazyXDSTooltip$1, {
			anchorRef: textRef,
			content: /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
				...props(truncationTooltipStyles.content),
				children: truncation.fullText
			}),
			placement: tooltipPlacement
		})
	})] });
}
Text.displayName = "Text";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Spinner/Spinner.js
/**
* @file Spinner.tsx
* @input Uses React, StyleX, canvas rendering
* @output Exports Spinner component, SpinnerProps, SpinnerSize, SpinnerShade types
* @position Core implementation of spinner loading indicator
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Spinner/Spinner.doc.mjs
* - /packages/core/src/Spinner/Spinner.test.tsx
* - /packages/core/src/Spinner/index.ts
* - /apps/storybook/stories/Spinner.stories.tsx
* - /packages/cli/templates/blocks/components/Spinner/ (showcase blocks)
*/
/** How much of the circle the active arc covers (as a fraction of 2π) */
/** Where the active arc starts (as a fraction of 2π) */
var START_POINT = 1.5;
var SIZES = {
	sm: {
		diameter: 10,
		border: 2
	},
	md: {
		diameter: 14,
		border: 3
	},
	lg: {
		diameter: 18,
		border: 3
	},
	xl: {
		diameter: 28,
		border: 4
	}
};
var styles$2 = {
	wrapper: {
		k1xSpc: "x3nfvp2",
		kXwgrk: "xdt5ytf",
		kGNEyG: "x6s0dn4",
		kOIVth: "x1txdalj",
		$$css: true
	},
	spinner: {
		k1xSpc: "xwz0xwf",
		kgQiWS: "x1ku5rj1",
		kVQacm: "xb3r6kr",
		kXLuUW: "xxymvpz",
		$$css: true
	}
};
/**
* An animated loading indicator. Available in three sizes and two color shades.
*
* @example
* ```
* <Spinner />
* <Spinner size="sm" />
* <Spinner size="lg" shade="onMedia" />
* <Spinner label="Loading..." />
* <Spinner aria-label="Loading data" />
* ```
*/
function Spinner({ size = "md", shade = "default", label, xstyle, className, style, "aria-label": ariaLabel, "data-testid": testId, ref, ...restProps }) {
	const canvasRef = (0, import_react.useRef)(null);
	const { tokens: themeTokens } = useTheme();
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (canvas == null) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		const { border, diameter } = SIZES[size];
		const pixelRatio = window.devicePixelRatio || 1;
		const inheritedColor = shade === "inherit" ? getComputedStyle(canvas).color : null;
		const activeColor = shade === "inherit" ? inheritedColor : shade === "onMedia" ? themeTokens["--color-on-dark"] : shade === "subtle" ? themeTokens["--color-text-secondary"] : themeTokens["--color-accent"];
		const backgroundColor = shade === "inherit" ? inheritedColor : shade === "onMedia" ? `${themeTokens["--color-on-dark"]}4D` : themeTokens["--color-track"];
		const cssSize = diameter + border * 2;
		const rawFrameSize = Math.round(cssSize * pixelRatio);
		const frameSize = rawFrameSize + rawFrameSize % 2;
		const scale = frameSize / cssSize;
		const radius = diameter / 2 * scale;
		const lineWidth = border * scale;
		canvas.height = canvas.width = frameSize;
		canvas.style.width = canvas.style.height = cssSize + "px";
		context.lineCap = "round";
		context.lineWidth = lineWidth;
		const center = frameSize / 2;
		context.beginPath();
		context.arc(center, center, radius, 0, 2 * Math.PI);
		context.strokeStyle = backgroundColor;
		if (shade === "inherit") context.globalAlpha = .3;
		context.stroke();
		context.globalAlpha = 1;
		context.beginPath();
		context.arc(center, center, radius, START_POINT * Math.PI, 2.25 % 2 * Math.PI);
		context.strokeStyle = activeColor;
		context.stroke();
	}, [
		shade,
		size,
		themeTokens
	]);
	const { border, diameter } = SIZES[size];
	const frameSize = diameter + border * 2;
	const hasLabel = label != null;
	const spinner = /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
		ref: hasLabel ? void 0 : ref,
		role: "status",
		"aria-label": ariaLabel ?? (typeof label === "string" ? label : void 0) ?? "Loading",
		"data-testid": hasLabel ? void 0 : testId,
		...hasLabel ? {} : restProps,
		...mergeProps(hasLabel ? "" : themeProps("spinner", {
			size,
			shade
		}), props(styles$2.spinner, !hasLabel && xstyle), hasLabel ? void 0 : className, {
			...hasLabel ? {} : style,
			width: frameSize,
			height: frameSize
		}),
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "xlp1x4z x1lliihq x1so62im x14qxm4i xnh0sag xa4qsjk x1ka1v4i x1esw782"
		})
	});
	if (!hasLabel) return spinner;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		"data-testid": testId,
		...restProps,
		...mergeProps(themeProps("spinner", {
			size,
			shade
		}), props(styles$2.wrapper, xstyle), className, style),
		children: [spinner, typeof label === "string" ? /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Text, {
			type: "body",
			weight: "bold",
			children: label
		}) : label]
	});
}
Spinner.displayName = "Spinner";
//#endregion
//#region node_modules/@astryxdesign/core/dist/VisuallyHidden/VisuallyHidden.js
/**
* @file VisuallyHidden.tsx
* @input Uses React createElement/ElementType, stylex
* @output Exports VisuallyHidden component and VisuallyHiddenProps
* @position Accessibility primitive; renders content in the a11y tree while
*   hiding it visually (icon-only labels, aria-live regions, SR-only context)
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/VisuallyHidden/VisuallyHidden.doc.mjs
* - /packages/core/src/VisuallyHidden/VisuallyHidden.test.tsx
* - /apps/storybook/stories/VisuallyHidden.stories.tsx
*/
/**
* VisuallyHidden is deliberately styling-free: it exists to *not* be seen, so it
* intentionally omits `xstyle`/`className`/`style`. The clip block is fixed and
* non-overridable — styling a visually-hidden node is always a mistake. The
* accessibility pass-throughs from `BaseProps` (`aria-*`, `role`, `id`,
* `data-*`, event handlers) remain, since the live-region use case needs them.
*/
/**
* Renders its children in the accessibility tree while hiding them visually.
*
* Use for content that assistive technology must perceive but sighted users
* should not see: accessible names for icon-only controls, `aria-live`
* announcement regions, and supplementary screen-reader context.
*
* @example
* ```
* // Accessible name for an icon-only button
* <IconButton icon="trash" label="">
*   <VisuallyHidden>Delete incident</VisuallyHidden>
* </IconButton>
*
* // Live region for announcements
* <VisuallyHidden as="div" aria-live="polite">
*   {`Moved ${task} to ${column}`}
* </VisuallyHidden>
* ```
*/
function VisuallyHidden({ children, as: element = "span", ref, ...props }) {
	return /*#__PURE__*/ (0, import_react.createElement)(element, {
		ref,
		...props,
		className: "x10l6tqk x1i1rx1s xjm9jq1 xkdpibf x1717udv xb3r6kr xzpqnlu xuxw1ft xng3xce x13vifvy x1o0tod x47corl x87ps6o"
	}, children);
}
VisuallyHidden.displayName = "VisuallyHidden";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layout/edgeCompensation.stylex.js
/**
* The data attribute that edge-compensatable components apply.
* Ghost buttons, tabs, and other transparent-padding components
* render this attribute so containers can detect them via `:has()`.
*/
var EDGE_COMP_ATTR = "data-astryx-edge-comp";
//#endregion
//#region node_modules/@astryxdesign/core/dist/SizeContext/SizeContext.js
/**
* @file SizeContext.ts
* @input React createContext, use
* @output Exports SizeContext, useSize, ElementSize, SizeProvider
* @position Context provider; consumed by Button, TextInput, TabList, Selector, etc.
*
* Generic size context that lets container components (Toolbar, TopNav, Card headers)
* cascade a default size to interactive children. Children use the context as a
* fallback — an explicit `size` prop always wins.
*/
/**
* Standard element sizes used across interactive components.
*/
/**
* Context for cascading a default size from container to children.
*
* `null` means no container is providing a size — components use their own default.
*/
var SizeContext = /*#__PURE__*/ (0, import_react.createContext)(null);
SizeContext.displayName = "SizeContext";
/**
* Resolve the effective size from an explicit prop, inherited context, or default.
*
* @param sizeProp - Explicit size prop from the component (wins if set)
* @param defaultSize - Fallback when neither prop nor context provides a size
* @returns The resolved size
*
* @example
* ```ts
* // In a component:
* const size = useSize(sizeProp, 'md');
* ```
*/
function useSize(sizeProp, defaultSize = "md") {
	const inherited = (0, import_react.use)(SizeContext);
	return sizeProp ?? inherited ?? defaultSize;
}
SizeContext.Provider;
//#endregion
//#region node_modules/@astryxdesign/core/dist/ButtonGroup/ButtonGroupContext.js
/**
* @file ButtonGroupContext.ts
* @input None (pure context definition)
* @output Exports ButtonGroup context and useButtonGroup hook
* @position Shared context; consumed by Button for group-aware styling
*/
var ButtonGroupContext = /*#__PURE__*/ (0, import_react.createContext)(null);
ButtonGroupContext.displayName = "ButtonGroupContext";
/**
* Hook for Button to detect when it's inside a ButtonGroup.
* Returns null when used outside a group.
*/
function useButtonGroup() {
	return (0, import_react.use)(ButtonGroupContext);
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Link/LinkContext.js
/**
* @file LinkContext.ts
* @input React createContext, LinkComponentType
* @output Exports LinkContext and LinkContextValue
* @position Context definition for polymorphic link support
*
* Separated from LinkProvider.tsx to allow components to consume
* the context without pulling in the full provider implementation.
* Follows the ThemeContext.ts / Theme.tsx pattern.
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Link/LinkProvider.tsx
* - /packages/core/src/Link/useLinkComponent.ts
* - /packages/core/src/Link/index.ts
* - /packages/core/src/Link/Link.doc.mjs
*/
/**
* Context value for the link provider.
*/
/**
* Context for providing a custom link component to all Astryx components.
* Defaults to null (components fall back to native `<a>`).
*/
var LinkContext = /*#__PURE__*/ (0, import_react.createContext)(null);
LinkContext.displayName = "LinkContext";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Link/useLinkComponent.js
/**
* @file useLinkComponent.ts
* @input React use, useMemo, createElement, forwardRef, LinkContext, LinkComponentType
* @output Exports useLinkComponent hook
* @position Hook for resolving the link component in Astryx components
*
* Resolution order: per-component `as` prop > LinkProvider context > native `<a>`.
*
* When the resolved component is a custom component (not native `<a>`),
* wraps it to pass `to={href}` alongside `href`. This enables compatibility
* with routers that use `to` (React Router, TanStack Router)
* without requiring an adapter component.
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Link/index.ts
* - /packages/core/src/Link/Link.doc.mjs
*/
/**
* Creates a wrapper component that passes both `href` and `to` props
* to the underlying link component. This enables routers that use `to`
* (React Router, TanStack Router) to work without an adapter.
*
* The wrapper is transparent: it forwards refs and all other props unchanged.
* Native `<a>` elements ignore the unknown `to` prop harmlessly.
*/
function createLinkWithTo(Component) {
	function LinkWithTo({ href, ref, ...rest }) {
		return /*#__PURE__*/ (0, import_react.createElement)(Component, {
			ref,
			href,
			to: href,
			...rest
		});
	}
	LinkWithTo.displayName = `LinkWithTo(${typeof Component === "string" ? Component : Component.displayName || Component.name || "Component"})`;
	return LinkWithTo;
}
/**
* Resolves the link component to use.
*
* Priority: `as` prop > `LinkProvider` context > native `<a>`.
*
* When the resolved component is a custom component (not the native `<a>`),
* it is wrapped to receive both `href` and `to` props set to the same value.
* This allows `to`-based routers (React Router, TanStack Router) to work
* out of the box without a manual adapter.
*
* @param as - Per-component override. If provided, takes highest priority.
* @returns The resolved link component (with `to` injection for custom components).
*
* @example
* ```
* function MyComponent({ as }: { as?: LinkComponentType }) {
*   const LinkComponent = useLinkComponent(as);
*   return <LinkComponent href="/foo">Click me</LinkComponent>;
* }
* ```
*/
function useLinkComponent(as) {
	const ctx = (0, import_react.use)(LinkContext);
	const resolved = as ?? ctx?.component ?? "a";
	return (0, import_react.useMemo)(() => {
		if (resolved === "a") return "a";
		return createLinkWithTo(resolved);
	}, [resolved]);
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Button/Button.js
/**
* @file Button.tsx
* @input Uses React, ButtonHTMLAttributes, ReactNode
* @output Exports Button component, ButtonProps, ButtonVariant types
* @position Core implementation; consumed by index.ts, tested by Button.test.tsx
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Button/Button.doc.mjs (props table, features, implementation notes)
* - /packages/core/src/Button/Button.test.tsx (tests for new/changed behavior)
* - /packages/core/src/Button/index.ts (exports if types change)
* - /apps/storybook/stories/Button.stories.tsx (storybook stories)
* - /packages/cli/templates/blocks/components/Button/ (showcase blocks)
*
* Last synced props: label, variant, size, isDisabled, isLoading, isInterruptible, clickAction, icon, isIconOnly, children, tooltip, endContent, href, as, target, rel
*/
/**
* Base button styles
* Pseudo-classes are nested within properties per StyleX recommendation:
* https://stylexjs.com/docs/learn/styling-ui/defining-styles#pseudo-classes
*/
var styles$1 = {
	base: {
		kVAEAm: "x1n2onr6",
		k1xSpc: "x3nfvp2",
		kGNEyG: "x6s0dn4",
		kjj79g: "xl56j7k",
		kOIVth: "x1txdalj",
		k8WAf4: "xce4md1",
		kg3NbH: "xrrkdod",
		kMzoRj: "xc342km",
		ksu8eU: "xng3xce",
		kaIpWk: "x1jxw6zd",
		kMv6JI: "xjb2p0i",
		kGuDYH: "xcr08ib",
		kLWn49: "x1kq96og",
		k63SB2: "x1e4wzip",
		khDVqt: "xuxw1ft",
		kkrTdU: "x1ypdohk",
		k1ekBW: "xrafxwg",
		kIyJzY: "xuedmi6 x12w9bfk",
		kAMwcw: "xlr8y92",
		$$css: true
	},
	pressable: {
		k3aq6I: "x3oybdh xk4oym4",
		$$css: true
	},
	disabled: {
		kkrTdU: "x1h6gzvc",
		kSiTet: "xbyyjgo",
		kKwaWg: "x18o3ruo",
		k3aq6I: "x1c071of x1pdlv7q",
		$$css: true
	},
	ariaDisabled: {
		kKwaWg: "x18o3ruo x8o3jvd xuqm82a",
		$$css: true
	},
	iconOnly: {
		"--button-icon-only-aspect": "x1v15ycx",
		kOBAk4: "xioom0i",
		kg3NbH: "xnjsko4",
		k8WAf4: "xt970qd",
		$$css: true
	},
	iconWrapper: {
		k1xSpc: "x3nfvp2",
		kGNEyG: "x6s0dn4",
		kjj79g: "xl56j7k",
		kmuXW: "x2lah0s",
		$$css: true
	},
	contentWrapper: {
		k1xSpc: "xjp7ctv",
		$$css: true
	},
	link: {
		kybGjl: "x1hl2dhg",
		$$css: true
	}
};
var sizeStyles = {
	sm: {
		kZKoxP: "x6k0iem",
		$$css: true
	},
	md: {
		kZKoxP: "x1ueg155",
		$$css: true
	},
	lg: {
		kZKoxP: "xssyfek",
		$$css: true
	}
};
/**
* Icon size per button size.
* Matches Icon sizing: sm/md=16px, lg=20px.
* fontSize is set so emoji and text-based icons scale correctly.
*/
var iconSizeStyles = {
	sm: {
		kzqmXN: "x1kky2od",
		kZKoxP: "xlup9mm",
		kGuDYH: "x1j61zf2",
		$$css: true
	},
	md: {
		kzqmXN: "x1kky2od",
		kZKoxP: "xlup9mm",
		kGuDYH: "x1j61zf2",
		$$css: true
	},
	lg: {
		kzqmXN: "xw4jnvo",
		kZKoxP: "x1qx5ct2",
		kGuDYH: "xwsyq91",
		$$css: true
	}
};
/**
* Variant styles using backgroundImage for layered colors
* Pseudo-classes are nested within properties per StyleX recommendation
* Overlay is stacked on top of base color using multiple linear-gradients
* Focus outline color matches variant (destructive uses negative color)
*/
var variants = {
	primary: {
		kWkggS: "x1ewilqj",
		kMwMTN: "x17wrial",
		kKwaWg: "x1ilzqfv xq8i9tn",
		kI3sdo: "x17nn4n9",
		"--button-focus-offset": "xkzo27j",
		kInvED: "x1wfwxd8 x13aywxo",
		$$css: true
	},
	secondary: {
		kWkggS: "x17x4s8c",
		kMwMTN: "x1tgivj0",
		kKwaWg: "x1ilzqfv xq8i9tn",
		kI3sdo: "x17nn4n9",
		"--button-focus-offset": "xkzo27j",
		kInvED: "x1wfwxd8 x13aywxo",
		$$css: true
	},
	ghost: {
		kWkggS: "xjbqb8w",
		kMwMTN: "x1tgivj0",
		kKwaWg: "x1ilzqfv xq8i9tn",
		kI3sdo: "x17nn4n9",
		"--button-focus-offset": "xkzo27j",
		kInvED: "x1wfwxd8 x13aywxo",
		$$css: true
	},
	destructive: {
		kWkggS: "x1pjz0fi",
		kMwMTN: "x1m024r3",
		kKwaWg: "x1ilzqfv xq8i9tn",
		kI3sdo: "x1p73he7",
		"--button-focus-offset": "xkzo27j",
		kInvED: "x1wfwxd8 x13aywxo",
		$$css: true
	}
};
durationVars["--duration-medium-min"];
var loadingStyles = {
	hiddenContent: {
		kMwMTN: "x19co3pv",
		$$css: true
	},
	hiddenContentDelayed: {
		kKVMdj: "x1ffowhz",
		k44tkh: "xjlvqhv",
		kWV6AL: "x10e4vud",
		kKxzle: "x17yabm6 x14q22ui",
		$$css: true
	}
};
var groupStyles = {
	horizontal: {
		krdFHd: "x15mokao x8eehn2",
		kVL7Gh: "xbiv7yw x1xrp5p4",
		kfmiAY: "x1ga7v0g x11xp8u1",
		kT0f0o: "x16uus16 x747jw7",
		k2ei4v: "xgbv0en x1pjv70x",
		kVhnKS: "x1t7ytsu xyf0ibl",
		kGJrpR: "x1j92z86",
		$$css: true
	},
	vertical: {
		krdFHd: "x15mokao x8eehn2",
		kfmiAY: "x1ga7v0g x2qxyot",
		kVL7Gh: "xbiv7yw x1yp72r9",
		kT0f0o: "x16uus16 x747jw7",
		kEafiO: "x11xkdxz x1g31smg",
		kPef9Z: "x13fuv20 x1d9v4yf",
		kLZC3w: "x1pc3f07",
		$$css: true
	},
	onSolidHorizontal: {
		kGJrpR: "xrvmtm5",
		$$css: true
	},
	onSolidVertical: {
		kLZC3w: "x11npmm7",
		$$css: true
	}
};
/**
* A versatile button component with multiple variants.
*
* Styles use Astryx theme tokens via StyleX.
* Wrap your app in <Theme> to apply a theme.
* Themes can provide component-level variant overrides via theme.components.button.variants
*
* When `href` is provided (and the button is not disabled), renders as an `<a>`
* element (or custom link component) with full button styling, enabling native
* browser behaviors like right-click → open in new tab and Cmd+Click.
*
* @example
* ```
* <Button label="Click me" />
* <Button label="Primary action" variant="primary" />
* <Button label="Delete" variant="destructive" />
* <Button label="Settings" icon={<GearIcon />} variant="ghost" isIconOnly />
* <Button label="Pick emoji" icon={<span>🚀</span>} variant="ghost" size="sm" isIconOnly />
* <Button label="Edit" icon={<PencilIcon />} />
* <Button label="Messages" endContent={<Badge label={3} />} />
* <Button label="Edit" icon={<PencilIcon />} endContent={<Badge label="New" />} />
* <Button label="Visit site" href="https://example.com" variant="primary" />
* <Button label="Open in new tab" href="https://example.com" target="_blank" rel="noopener noreferrer" />
* ```
*/
function Button({ label, variant = "secondary", size: sizeProp, type = "button", isDisabled = false, isLoading = false, isInterruptible = false, clickAction, icon, isIconOnly = false, children, endContent, tooltip, href, as, target, rel, xstyle, className, style, ref, ...props$3 }) {
	const size = useSize(sizeProp, "md");
	const buttonGroup = useButtonGroup();
	const [isPending, startTransition] = (0, import_react.useTransition)();
	const actionInFlightRef = (0, import_react.useRef)(false);
	const isLoadingState = isLoading || isPending;
	const delaySpinner = isPending || isInterruptible;
	const groupDisabled = buttonGroup?.isDisabled ?? false;
	const buttonDisabled = isDisabled || groupDisabled || isLoadingState && !isInterruptible;
	const LinkComponent = useLinkComponent(as);
	const renderAsLink = href != null && !buttonDisabled;
	const useAriaDisabled = tooltip != null && buttonDisabled;
	const tooltipHook = useTooltip({
		placement: "above",
		isEnabled: tooltip != null
	});
	const handleClick = (e) => {
		if (buttonDisabled || actionInFlightRef.current && !isInterruptible) {
			e.preventDefault();
			return;
		}
		props$3.onClick?.(e);
		if (clickAction && !e.defaultPrevented) {
			actionInFlightRef.current = true;
			startTransition(async () => {
				try {
					await clickAction(e);
				} finally {
					actionInFlightRef.current = false;
				}
			});
		}
	};
	const handleKeyDown = useAriaDisabled ? (e) => {
		if (e.key === "Enter" || e.key === " ") e.preventDefault();
		else props$3.onKeyDown?.(e);
	} : void 0;
	const edgeCompAttr = variant === "ghost" ? { [EDGE_COMP_ATTR]: "" } : null;
	const sharedStylexProps = props(styles$1.base, sizeStyles[size], variants[variant], isIconOnly && styles$1.iconOnly, buttonDisabled && styles$1.disabled, useAriaDisabled && styles$1.ariaDisabled, renderAsLink && styles$1.link, !buttonGroup && styles$1.pressable, buttonGroup && (buttonGroup.orientation === "horizontal" ? groupStyles.horizontal : groupStyles.vertical), buttonGroup && (variant === "primary" || variant === "destructive") && (buttonGroup.orientation === "horizontal" ? groupStyles.onSolidHorizontal : groupStyles.onSolidVertical), xstyle);
	const sharedMergedProps = mergeProps(themeProps("button", {
		variant,
		size
	}), sharedStylexProps, className, style);
	const buttonContent = /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		isLoadingState && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
			...{
				0: { className: "x10l6tqk x13vifvy xu96u03 x3m8u43 x1ey2m1c xrvj5dj x1ku5rj1" },
				1: { className: "x10l6tqk x13vifvy xu96u03 x3m8u43 x1ey2m1c xrvj5dj x1ku5rj1 xqcmdr3 xb2rp9n xskzprw x17yabm6 x14q22ui" }
			}[!!delaySpinner << 0],
			"aria-hidden": "true",
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Spinner, {
				size: "sm",
				shade: "inherit"
			})
		}),
		/*#__PURE__*/ (0, import_jsx_runtime.jsxs)("span", {
			...props(styles$1.contentWrapper, isLoadingState && (delaySpinner ? loadingStyles.hiddenContentDelayed : loadingStyles.hiddenContent)),
			"aria-hidden": isLoadingState || void 0,
			children: [
				icon && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
					...props(styles$1.iconWrapper, iconSizeStyles[size]),
					children: icon
				}),
				isIconOnly ? null : /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
					className: "xb3r6kr xlyipyv xeuugli",
					children: children ?? label
				}),
				!isIconOnly && endContent && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
					className: "x3nfvp2 x6s0dn4 x1heor9g",
					children: endContent
				})
			]
		}),
		/*#__PURE__*/ (0, import_jsx_runtime.jsx)(VisuallyHidden, {
			role: "status",
			"aria-live": "polite",
			children: isLoadingState ? "Loading" : ""
		})
	] });
	const ariaLabelProp = isIconOnly && label !== "" || isLoadingState && !isIconOnly || children != null && children !== label ? { "aria-label": label } : null;
	const describedByProp = tooltip != null ? { "aria-describedby": [props$3["aria-describedby"], tooltipHook.describedBy].filter(Boolean).join(" ") || void 0 } : null;
	const mergedButtonRef = mergeRefs(ref, tooltip != null ? tooltipHook.ref : void 0);
	let element;
	if (renderAsLink) element = /*#__PURE__*/ (0, import_jsx_runtime.jsx)(LinkComponent, {
		ref: mergedButtonRef,
		href,
		target,
		rel,
		...sharedMergedProps,
		...props$3,
		...ariaLabelProp,
		...describedByProp,
		...edgeCompAttr,
		onClick: handleClick,
		children: buttonContent
	});
	else element = /*#__PURE__*/ (0, import_jsx_runtime.jsx)("button", {
		ref: mergedButtonRef,
		type,
		disabled: useAriaDisabled ? void 0 : buttonDisabled,
		...sharedMergedProps,
		...props$3,
		...ariaLabelProp,
		...describedByProp,
		...edgeCompAttr,
		"aria-busy": isLoadingState || void 0,
		"aria-disabled": useAriaDisabled || void 0,
		onClick: handleClick,
		...handleKeyDown ? { onKeyDown: handleKeyDown } : null,
		children: buttonContent
	});
	if (tooltip) return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [element, tooltipHook.renderTooltip(tooltip)] });
	return element;
}
Button.displayName = "Button";
//#endregion
//#region node_modules/@astryxdesign/core/dist/IconButton/IconButton.js
/**
* @file IconButton.tsx
* @input Uses Button, ButtonProps
* @output Exports IconButton component, IconButtonProps type
* @position Composition wrapper over Button for icon-only buttons
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/IconButton/IconButton.doc.mjs (props table, features)
* - /packages/core/src/IconButton/IconButton.test.tsx (tests)
* - /packages/core/src/IconButton/index.ts (exports if types change)
* - /apps/storybook/stories/IconButton.stories.tsx (storybook stories)
* - /packages/cli/templates/blocks/components/IconButton/ (showcase blocks)
*/
/**
* Props for IconButton.
*
* Omits `isIconOnly` (always true), `children` and `endContent` (not applicable
* for icon-only buttons). `icon` is required.
*/
/**
* An icon-only button — a thin wrapper around Button with `isIconOnly`
* always set to true.
*
* Use this instead of `<Button isIconOnly>` for explicit, greppable,
* and codemod-safe icon-only button usage.
*
* @example
* ```
* <IconButton label="Settings" icon={<GearIcon />} variant="ghost" />
* <IconButton label="Delete" icon={<TrashIcon />} variant="destructive" />
* <IconButton label="Emoji" icon={<span>🚀</span>} variant="ghost" size="sm" />
* ```
*/
function IconButton({ icon, ...props }) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Button, {
		...props,
		icon,
		isIconOnly: true
	});
}
IconButton.displayName = "IconButton";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Layout/container.stylex.js
/**
* Spacing token keys for padding props.
*/
var baseStyles = { container: {
	kB7OPa: "x9f619",
	kZCmMZ: "x1c35znw",
	kwRFfy: "x64h4k7",
	kLKAdn: "x14m0hsi",
	kGO01o: "xc1wllq",
	$$css: true
} };
/**
* Component-scoped padding tokens.
*
* Each container component (card, section, dialog) has public CSS custom
* properties that themes can set. The pipeline emits the `--astryx-*` names,
* which the component reads via `var(--astryx-…, …)`:
*
*   --astryx-card-padding          (shorthand — all sides)
*   --astryx-card-padding-inline
*   --astryx-card-padding-inline-start
*   --astryx-card-padding-inline-end
*   --astryx-card-padding-block-start
*   --astryx-card-padding-block-end
*
* The theme build pipeline maps `padding: '20px'` on a container component
* to these tokens. The component reads them with var() fallbacks to --spacing-4.
*
* This indirection exists because StyleX's useCSSLayers emits priority-0
* custom property assignments outside any @layer, making them impossible
* to override from @layer astryx-theme. By reading from a higher-level token,
* the theme CSS sets the token value and the component picks it up via
* CSS custom property cascade — no layer competition.
*/
var SP4 = spacingVars["--spacing-4"];
var cardShorthand = `var(--astryx-card-padding, ${SP4})`;
var cardInline = `var(--astryx-card-padding-inline, ${cardShorthand})`;
`${cardInline}`;
`${cardInline}`;
`${cardShorthand}`;
`${cardShorthand}`;
var sectionShorthand = `var(--astryx-section-padding, ${SP4})`;
var sectionInline = `var(--astryx-section-padding-inline, ${sectionShorthand})`;
`${sectionInline}`;
`${sectionInline}`;
`${sectionShorthand}`;
`${sectionShorthand}`;
var dialogShorthand = `var(--astryx-dialog-padding, ${SP4})`;
var dialogInline = `var(--astryx-dialog-padding-inline, ${dialogShorthand})`;
`${dialogInline}`;
`${dialogInline}`;
`${dialogShorthand}`;
`${dialogShorthand}`;
/**
* Map from component name to its theme default padding styles.
* Each component reads from its own public CSS custom property.
*/
var themeDefaultStyles = {
	card: {
		containerPaddingInlineStart: {
			"--container-padding-inline-start": "xjmlhfd",
			$$css: true
		},
		containerPaddingInlineEnd: {
			"--container-padding-inline-end": "x1ihxwbr",
			$$css: true
		},
		containerPaddingBlockStart: {
			"--container-padding-block-start": "x1rqz8me",
			$$css: true
		},
		containerPaddingBlockEnd: {
			"--container-padding-block-end": "x1omyuck",
			$$css: true
		},
		layoutPaddingOuterX: {
			"--layout-padding-outer-x": "x14rzhog",
			$$css: true
		},
		layoutPaddingOuterY: {
			"--layout-padding-outer-y": "xjej9fs",
			$$css: true
		},
		layoutPaddingInnerX: {
			"--layout-padding-inner-x": "x4poyjn",
			$$css: true
		},
		layoutPaddingInnerY: {
			"--layout-padding-inner-y": "x1u1kw4e",
			$$css: true
		}
	},
	section: {
		containerPaddingInlineStart: {
			"--container-padding-inline-start": "xrgx2ny",
			$$css: true
		},
		containerPaddingInlineEnd: {
			"--container-padding-inline-end": "xyk0j9o",
			$$css: true
		},
		containerPaddingBlockStart: {
			"--container-padding-block-start": "x876hks",
			$$css: true
		},
		containerPaddingBlockEnd: {
			"--container-padding-block-end": "x1u89lk7",
			$$css: true
		},
		layoutPaddingOuterX: {
			"--layout-padding-outer-x": "x12sptzx",
			$$css: true
		},
		layoutPaddingOuterY: {
			"--layout-padding-outer-y": "xo78phr",
			$$css: true
		},
		layoutPaddingInnerX: {
			"--layout-padding-inner-x": "x1we69p7",
			$$css: true
		},
		layoutPaddingInnerY: {
			"--layout-padding-inner-y": "xsdnkbz",
			$$css: true
		}
	},
	dialog: {
		containerPaddingInlineStart: {
			"--container-padding-inline-start": "x1tewnwq",
			$$css: true
		},
		containerPaddingInlineEnd: {
			"--container-padding-inline-end": "x11h1f2o",
			$$css: true
		},
		containerPaddingBlockStart: {
			"--container-padding-block-start": "x1g2kccc",
			$$css: true
		},
		containerPaddingBlockEnd: {
			"--container-padding-block-end": "x1gvthzm",
			$$css: true
		},
		layoutPaddingOuterX: {
			"--layout-padding-outer-x": "x1hsjncj",
			$$css: true
		},
		layoutPaddingOuterY: {
			"--layout-padding-outer-y": "x1pui4bz",
			$$css: true
		},
		layoutPaddingInnerX: {
			"--layout-padding-inner-x": "x2so38",
			$$css: true
		},
		layoutPaddingInnerY: {
			"--layout-padding-inner-y": "xinu7xd",
			$$css: true
		}
	}
};
/**
* Container inline padding styles for edge compensation.
* Sets --container-padding-inline-start and --container-padding-inline-end so
* edge-compensating children (bleed tables, dividers, etc.) know the inline
* padding to compensate against.
*/
var containerPaddingInlineStartStyles = {
	spacing0: {
		"--container-padding-inline-start": "x1gu2k80",
		$$css: true
	},
	spacing0_5: {
		"--container-padding-inline-start": "x14ws0sr",
		$$css: true
	},
	spacing1: {
		"--container-padding-inline-start": "x1cvlban",
		$$css: true
	},
	spacing1_5: {
		"--container-padding-inline-start": "x176g23i",
		$$css: true
	},
	spacing2: {
		"--container-padding-inline-start": "x1xlrr2o",
		$$css: true
	},
	spacing3: {
		"--container-padding-inline-start": "xfdwxua",
		$$css: true
	},
	spacing4: {
		"--container-padding-inline-start": "x1dlhslv",
		$$css: true
	},
	spacing5: {
		"--container-padding-inline-start": "x1s81nki",
		$$css: true
	},
	spacing6: {
		"--container-padding-inline-start": "x1ep0dkj",
		$$css: true
	},
	spacing7: {
		"--container-padding-inline-start": "x157xojc",
		$$css: true
	},
	spacing8: {
		"--container-padding-inline-start": "xw1diwv",
		$$css: true
	},
	spacing9: {
		"--container-padding-inline-start": "xraca2a",
		$$css: true
	},
	spacing10: {
		"--container-padding-inline-start": "xserb3f",
		$$css: true
	},
	spacing11: {
		"--container-padding-inline-start": "xziclwo",
		$$css: true
	},
	spacing12: {
		"--container-padding-inline-start": "x1iiwihq",
		$$css: true
	}
};
var containerPaddingInlineEndStyles = {
	spacing0: {
		"--container-padding-inline-end": "x91ghl5",
		$$css: true
	},
	spacing0_5: {
		"--container-padding-inline-end": "x1wz3t3y",
		$$css: true
	},
	spacing1: {
		"--container-padding-inline-end": "x2oyxnl",
		$$css: true
	},
	spacing1_5: {
		"--container-padding-inline-end": "xntetml",
		$$css: true
	},
	spacing2: {
		"--container-padding-inline-end": "xcas3b9",
		$$css: true
	},
	spacing3: {
		"--container-padding-inline-end": "xu0ipoa",
		$$css: true
	},
	spacing4: {
		"--container-padding-inline-end": "xs0pscg",
		$$css: true
	},
	spacing5: {
		"--container-padding-inline-end": "xgkj7vj",
		$$css: true
	},
	spacing6: {
		"--container-padding-inline-end": "x94cj42",
		$$css: true
	},
	spacing7: {
		"--container-padding-inline-end": "x11tj35w",
		$$css: true
	},
	spacing8: {
		"--container-padding-inline-end": "x1b9k1pi",
		$$css: true
	},
	spacing9: {
		"--container-padding-inline-end": "x19w02kr",
		$$css: true
	},
	spacing10: {
		"--container-padding-inline-end": "xx5lg5w",
		$$css: true
	},
	spacing11: {
		"--container-padding-inline-end": "x1nmgbqg",
		$$css: true
	},
	spacing12: {
		"--container-padding-inline-end": "x1wsfsk2",
		$$css: true
	}
};
/**
* Container block-start/block-end padding styles for vertical bleed.
* Split into start and end because Layout areas have asymmetric block padding
* (e.g., Header: block-start=outer-y, block-end=inner-y).
*/
var containerPaddingBlockStartStyles = {
	spacing0: {
		"--container-padding-block-start": "x1i3qcxz",
		$$css: true
	},
	spacing0_5: {
		"--container-padding-block-start": "xvdf9ev",
		$$css: true
	},
	spacing1: {
		"--container-padding-block-start": "xnsckjb",
		$$css: true
	},
	spacing1_5: {
		"--container-padding-block-start": "x1kbx601",
		$$css: true
	},
	spacing2: {
		"--container-padding-block-start": "xa8b4fq",
		$$css: true
	},
	spacing3: {
		"--container-padding-block-start": "x11k4f5r",
		$$css: true
	},
	spacing4: {
		"--container-padding-block-start": "xm01sq8",
		$$css: true
	},
	spacing5: {
		"--container-padding-block-start": "xp8wdkl",
		$$css: true
	},
	spacing6: {
		"--container-padding-block-start": "x1hmud4d",
		$$css: true
	},
	spacing7: {
		"--container-padding-block-start": "x1c00sag",
		$$css: true
	},
	spacing8: {
		"--container-padding-block-start": "xfv60at",
		$$css: true
	},
	spacing9: {
		"--container-padding-block-start": "x14fzdu7",
		$$css: true
	},
	spacing10: {
		"--container-padding-block-start": "x17h9kl7",
		$$css: true
	},
	spacing11: {
		"--container-padding-block-start": "x1rdjxae",
		$$css: true
	},
	spacing12: {
		"--container-padding-block-start": "xecwdl6",
		$$css: true
	}
};
var containerPaddingBlockEndStyles = {
	spacing0: {
		"--container-padding-block-end": "xkunwnr",
		$$css: true
	},
	spacing0_5: {
		"--container-padding-block-end": "x1cao3zv",
		$$css: true
	},
	spacing1: {
		"--container-padding-block-end": "x57a7ii",
		$$css: true
	},
	spacing1_5: {
		"--container-padding-block-end": "xv53x8y",
		$$css: true
	},
	spacing2: {
		"--container-padding-block-end": "x1lsgcmx",
		$$css: true
	},
	spacing3: {
		"--container-padding-block-end": "x1q3ppug",
		$$css: true
	},
	spacing4: {
		"--container-padding-block-end": "x4hfsld",
		$$css: true
	},
	spacing5: {
		"--container-padding-block-end": "xbib2ws",
		$$css: true
	},
	spacing6: {
		"--container-padding-block-end": "x1q8d17g",
		$$css: true
	},
	spacing7: {
		"--container-padding-block-end": "x1yqogew",
		$$css: true
	},
	spacing8: {
		"--container-padding-block-end": "x8lgq76",
		$$css: true
	},
	spacing9: {
		"--container-padding-block-end": "x1f7f9rt",
		$$css: true
	},
	spacing10: {
		"--container-padding-block-end": "x15vxphk",
		$$css: true
	},
	spacing11: {
		"--container-padding-block-end": "x4bg2x9",
		$$css: true
	},
	spacing12: {
		"--container-padding-block-end": "x186mjxr",
		$$css: true
	}
};
var paddingOuterXStyles = {
	spacing0: {
		"--layout-padding-outer-x": "xswhm3q",
		$$css: true
	},
	spacing0_5: {
		"--layout-padding-outer-x": "xihiwg7",
		$$css: true
	},
	spacing1: {
		"--layout-padding-outer-x": "xc96xmq",
		$$css: true
	},
	spacing1_5: {
		"--layout-padding-outer-x": "x1u93lgd",
		$$css: true
	},
	spacing2: {
		"--layout-padding-outer-x": "x15dxnc0",
		$$css: true
	},
	spacing3: {
		"--layout-padding-outer-x": "xadgj3j",
		$$css: true
	},
	spacing4: {
		"--layout-padding-outer-x": "x1v56qcf",
		$$css: true
	},
	spacing5: {
		"--layout-padding-outer-x": "x1nzs0gl",
		$$css: true
	},
	spacing6: {
		"--layout-padding-outer-x": "x1c3n52a",
		$$css: true
	},
	spacing7: {
		"--layout-padding-outer-x": "x1gfiokx",
		$$css: true
	},
	spacing8: {
		"--layout-padding-outer-x": "x1t3kfz",
		$$css: true
	},
	spacing9: {
		"--layout-padding-outer-x": "xzr4qsh",
		$$css: true
	},
	spacing10: {
		"--layout-padding-outer-x": "x1jdf5a4",
		$$css: true
	},
	spacing11: {
		"--layout-padding-outer-x": "x1hct0t0",
		$$css: true
	},
	spacing12: {
		"--layout-padding-outer-x": "x11cyqoe",
		$$css: true
	}
};
var paddingOuterYStyles = {
	spacing0: {
		"--layout-padding-outer-y": "x1mzf5mb",
		$$css: true
	},
	spacing0_5: {
		"--layout-padding-outer-y": "x1vj96e0",
		$$css: true
	},
	spacing1: {
		"--layout-padding-outer-y": "x1gpfxoh",
		$$css: true
	},
	spacing1_5: {
		"--layout-padding-outer-y": "xd3dqby",
		$$css: true
	},
	spacing2: {
		"--layout-padding-outer-y": "x10pz7y9",
		$$css: true
	},
	spacing3: {
		"--layout-padding-outer-y": "x1p6yq3h",
		$$css: true
	},
	spacing4: {
		"--layout-padding-outer-y": "xx738ci",
		$$css: true
	},
	spacing5: {
		"--layout-padding-outer-y": "x6yxws5",
		$$css: true
	},
	spacing6: {
		"--layout-padding-outer-y": "x180vrwl",
		$$css: true
	},
	spacing7: {
		"--layout-padding-outer-y": "x1q6rme1",
		$$css: true
	},
	spacing8: {
		"--layout-padding-outer-y": "xid7e43",
		$$css: true
	},
	spacing9: {
		"--layout-padding-outer-y": "x1t5kicu",
		$$css: true
	},
	spacing10: {
		"--layout-padding-outer-y": "x26l4wa",
		$$css: true
	},
	spacing11: {
		"--layout-padding-outer-y": "x10zktp0",
		$$css: true
	},
	spacing12: {
		"--layout-padding-outer-y": "x1yz3n6a",
		$$css: true
	}
};
var paddingInnerXStyles = {
	spacing0: {
		"--layout-padding-inner-x": "xj1bl4l",
		$$css: true
	},
	spacing0_5: {
		"--layout-padding-inner-x": "xlriy2h",
		$$css: true
	},
	spacing1: {
		"--layout-padding-inner-x": "x6uuyak",
		$$css: true
	},
	spacing1_5: {
		"--layout-padding-inner-x": "xd38f90",
		$$css: true
	},
	spacing2: {
		"--layout-padding-inner-x": "xxqksqd",
		$$css: true
	},
	spacing3: {
		"--layout-padding-inner-x": "x1fyui2f",
		$$css: true
	},
	spacing4: {
		"--layout-padding-inner-x": "x1i2ajwi",
		$$css: true
	},
	spacing5: {
		"--layout-padding-inner-x": "x1tac27u",
		$$css: true
	},
	spacing6: {
		"--layout-padding-inner-x": "x1ntgf3t",
		$$css: true
	},
	spacing7: {
		"--layout-padding-inner-x": "xhjd9tl",
		$$css: true
	},
	spacing8: {
		"--layout-padding-inner-x": "xn7c84u",
		$$css: true
	},
	spacing9: {
		"--layout-padding-inner-x": "xeqkbsz",
		$$css: true
	},
	spacing10: {
		"--layout-padding-inner-x": "x1vf4qco",
		$$css: true
	},
	spacing11: {
		"--layout-padding-inner-x": "xsmamsf",
		$$css: true
	},
	spacing12: {
		"--layout-padding-inner-x": "x2xk2xj",
		$$css: true
	}
};
var paddingInnerYStyles = {
	spacing0: {
		"--layout-padding-inner-y": "xwuefyo",
		$$css: true
	},
	spacing0_5: {
		"--layout-padding-inner-y": "x180h0y5",
		$$css: true
	},
	spacing1: {
		"--layout-padding-inner-y": "xmpug6m",
		$$css: true
	},
	spacing1_5: {
		"--layout-padding-inner-y": "x1g8jpzm",
		$$css: true
	},
	spacing2: {
		"--layout-padding-inner-y": "x1lksgje",
		$$css: true
	},
	spacing3: {
		"--layout-padding-inner-y": "x4j7gld",
		$$css: true
	},
	spacing4: {
		"--layout-padding-inner-y": "x1s3ehtl",
		$$css: true
	},
	spacing5: {
		"--layout-padding-inner-y": "x1rj5eim",
		$$css: true
	},
	spacing6: {
		"--layout-padding-inner-y": "x1ftgg6u",
		$$css: true
	},
	spacing7: {
		"--layout-padding-inner-y": "x1ho74vh",
		$$css: true
	},
	spacing8: {
		"--layout-padding-inner-y": "xm2cs6f",
		$$css: true
	},
	spacing9: {
		"--layout-padding-inner-y": "x1vsq92b",
		$$css: true
	},
	spacing10: {
		"--layout-padding-inner-y": "x18gbwmk",
		$$css: true
	},
	spacing11: {
		"--layout-padding-inner-y": "x14zymzj",
		$$css: true
	},
	spacing12: {
		"--layout-padding-inner-y": "xzfpkx9",
		$$css: true
	}
};
var maxHeightStyles = { containerMaxHeight: (maxHeight) => [{
	"--container-max-height": maxHeight != null ? "x18nyedi" : maxHeight,
	$$css: true
}, { "--x---container-max-height": maxHeight != null ? maxHeight : void 0 }] };
/**
* StyleX utility to add layout container styles to any element.
*
* Sets CSS variables for padding that child layout components read:
* - `--container-padding-inline-start` / `--container-padding-inline-end` — Inline padding for edge compensation and bleed
* - `--container-padding-block-start` / `--container-padding-block-end` — Block padding for vertical bleed
* - `--layout-padding-outer-x`, `--layout-padding-outer-y` (internal)
* - `--layout-padding-inner-x`, `--layout-padding-inner-y` (internal)
*
* Themes should use `padding` (or `paddingBlock`/`paddingInline`) in
* component overrides to adjust padding. Do not reference
* `--layout-padding-*` variables directly.
*
* @example
* ```
* import { container } from '@astryxdesign/core/Layout';
* import * as stylex from '@stylexjs/stylex';
*
* // Card container with default padding (theme-overridable via padding shorthand)
* <div {...stylex.props(...container({ useThemeDefault: 'card' }))}>
*   <Layout ... />
* </div>
*
* // Uniform padding
* <div {...stylex.props(...container({ padding: 'spacing3' }))}>
*   <Layout ... />
* </div>
*
* // Asymmetric — padding as base, paddingOuterY overrides vertical
* <div {...stylex.props(
*   ...container({ padding: 'spacing3', paddingOuterY: 'spacing2' }),
*   customStyles.card
* )}>
*   <Layout ... />
* </div>
* ```
*/
function container({ padding = "spacing4", paddingOuterX, paddingOuterY, paddingInnerX, paddingInnerY, useThemeDefault, maxHeight }) {
	const outerX = paddingOuterX ?? padding;
	const outerY = paddingOuterY ?? padding;
	const innerX = paddingInnerX ?? padding;
	const innerY = paddingInnerY ?? padding;
	const maxHeightStyle = maxHeight ? maxHeightStyles.containerMaxHeight(maxHeight) : null;
	if (useThemeDefault) {
		const defaults = themeDefaultStyles[useThemeDefault];
		return [
			baseStyles.container,
			defaults.containerPaddingInlineStart,
			defaults.containerPaddingInlineEnd,
			defaults.containerPaddingBlockStart,
			defaults.containerPaddingBlockEnd,
			defaults.layoutPaddingOuterX,
			defaults.layoutPaddingOuterY,
			defaults.layoutPaddingInnerX,
			defaults.layoutPaddingInnerY,
			maxHeightStyle
		];
	}
	return [
		baseStyles.container,
		containerPaddingInlineStartStyles[outerX],
		containerPaddingInlineEndStyles[outerX],
		containerPaddingBlockStartStyles[outerY],
		containerPaddingBlockEndStyles[outerY],
		paddingOuterXStyles[outerX],
		paddingOuterYStyles[outerY],
		paddingInnerXStyles[innerX],
		paddingInnerYStyles[innerY],
		maxHeightStyle
	];
}
//#endregion
//#region node_modules/@astryxdesign/core/dist/Card/Card.js
/**
* @file Card.tsx
* @input Uses container utility, StyleX
* @output Exports Card component and CardProps
* @position Core card container component
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Card/Card.doc.mjs (props table, features)
* - /packages/core/src/Card/index.ts (exports if types change)
* - /apps/storybook/stories/Card.stories.tsx (storybook stories)
* - /packages/cli/templates/blocks/components/Card/ (showcase blocks)
*/
/**
* Background color variant for Card.
* - `default`: standard card background with visible border
* - `transparent`: no background, no visible border — for grouping content without visual weight
* - `muted`: subtle muted background for de-emphasised cards
* - Non-semantic palette: `blue | cyan | gray | green | orange | pink | purple | red | teal | yellow`
*   Each uses the corresponding `--color-background-<name>` token (20% opacity tint).
*
* All variants include a transparent border to prevent layout jitter
* when switching variants. Themes can override borderWidth/borderColor.
*/
var styles = {
	card: {
		"--_card-radius": "x2kkz0m",
		kaIpWk: "x153u1i6",
		kVQacm: "x7giv3",
		kMzoRj: "x1litavf",
		ksu8eU: "x1y0btm7",
		kVAM5u: "x9r1u3d",
		$$css: true
	},
	withBorder: {
		kVAM5u: "xvy26l8",
		$$css: true
	},
	scrollable: {
		kVQacm: "xysyzu8",
		$$css: true
	}
};
var variantStyles = {
	default: {
		kWkggS: "x1de1mus",
		$$css: true
	},
	transparent: {
		kWkggS: "xjbqb8w",
		$$css: true
	},
	muted: {
		kWkggS: "xwmxj5m",
		$$css: true
	},
	blue: {
		kWkggS: "x1o0wnni",
		$$css: true
	},
	cyan: {
		kWkggS: "x1rgj867",
		$$css: true
	},
	gray: {
		kWkggS: "xspzpui",
		$$css: true
	},
	green: {
		kWkggS: "x1sqjeoo",
		$$css: true
	},
	orange: {
		kWkggS: "x1e9xt6e",
		$$css: true
	},
	pink: {
		kWkggS: "xnpoty2",
		$$css: true
	},
	purple: {
		kWkggS: "x16i6n6f",
		$$css: true
	},
	red: {
		kWkggS: "x1cibrc5",
		$$css: true
	},
	teal: {
		kWkggS: "x1jtji5o",
		$$css: true
	},
	yellow: {
		kWkggS: "x1bo7t0x",
		$$css: true
	}
};
var dynamicStyles = { sizing: (width, height, maxWidth, minHeight) => [{
	kzqmXN: width != null ? "x5lhr3w" : width,
	kZKoxP: height != null ? "x16ye13r" : height,
	ks0D6T: maxWidth != null ? "xf68679" : maxWidth,
	kAzted: minHeight != null ? "x82snj4" : minHeight,
	$$css: true
}, {
	"--x-width": ((val) => typeof val === "number" ? val + "px" : val != null ? val : void 0)(width),
	"--x-height": ((val) => typeof val === "number" ? val + "px" : val != null ? val : void 0)(height),
	"--x-maxWidth": ((val) => typeof val === "number" ? val + "px" : val != null ? val : void 0)(maxWidth),
	"--x-minHeight": ((val) => typeof val === "number" ? val + "px" : val != null ? val : void 0)(minHeight)
}] };
/**
* A card container with border and themed styling.
*
* Applies card-specific appearance (background, border, border-radius)
* and sets CSS variables for child layout components.
*
* @compositionHint Use as a top-level container for elevated content.
* Pair with Layout for structured header/content/footer layouts.
*
* @example
* ```
* <Card width={400} height={300}>
*   <Layout
*     header={<LayoutHeader hasDivider>Title</LayoutHeader>}
*     content={<LayoutContent>Content</LayoutContent>}
*     footer={<LayoutFooter hasDivider>Actions</LayoutFooter>}
*   />
* </Card>
* ```
*
* @example
* ```
* <Card variant="blue" width={300}>
*   <p>Blue tinted card</p>
* </Card>
* ```
*
* @example
* ```
* <Card variant="muted" width={300}>
*   <p>Subtle de-emphasised card</p>
* </Card>
* ```
*/
function Card({ width, height, maxWidth, minHeight, children, padding, variant = "default", xstyle, className, style, ref, ...props$2 }) {
	const hasFixedHeight = height != null && height !== "auto";
	const useThemeDefault = padding == null;
	const effectivePadding = padding ?? 4;
	const paddingToken = spacingStepToToken[effectivePadding];
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		ref,
		...mergeProps(themeProps("card", { variant }), props(styles.card, variantStyles[variant], variant === "default" && styles.withBorder, hasFixedHeight && styles.scrollable, dynamicStyles.sizing(width ?? null, height ?? null, maxWidth ?? null, minHeight ?? null), ...container(useThemeDefault ? { useThemeDefault: "card" } : {
			paddingInnerX: paddingToken,
			paddingInnerY: paddingToken,
			paddingOuterX: paddingToken,
			paddingOuterY: paddingToken
		}), !useThemeDefault && effectivePadding !== 4 && paddingStyles[effectivePadding], !useThemeDefault && effectivePadding !== 4 && containerPaddingInlineVarStyles[effectivePadding], !useThemeDefault && effectivePadding !== 4 && containerPaddingBlockStartVarStyles[effectivePadding], !useThemeDefault && effectivePadding !== 4 && containerPaddingBlockEndVarStyles[effectivePadding], xstyle), className, style),
		...props$2,
		children
	});
}
Card.displayName = "Card";
//#endregion
//#region node_modules/@astryxdesign/core/dist/Heading/Heading.js
/**
* @file Heading.tsx
* @input Uses React, HTMLAttributes, ReactNode
* @output Exports Heading component, HeadingProps, HeadingLevel types
* @position Core implementation; lives in own Heading/ dir, re-exported by Text/
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Text/Text.doc.mjs (props table, features, implementation notes)
* - /packages/core/src/Heading/Heading.test.tsx (tests for new/changed behavior)
* - /packages/core/src/Text/index.ts (exports if types change)
* - /apps/storybook/stories/Text.stories.tsx (storybook stories)
* - /packages/cli/templates/blocks/components/Heading/ (showcase blocks)
* - /packages/cli/templates/blocks/components/Text/ (showcase blocks)
*/
var LazyXDSTooltip = /*#__PURE__*/ (0, import_react.lazy)(async () => Promise.resolve().then(() => Tooltip_exports).then((mod) => ({ default: mod.Tooltip })));
/**
* Heading level (1-6). Determines both visual styling and semantic HTML element.
*/
/**
* Display type variants for headings. Applies display-scale sizing
* (larger, lighter) while preserving the semantic heading element.
*/
var levelToTag = {
	1: "h1",
	2: "h2",
	3: "h3",
	4: "h4",
	5: "h5",
	6: "h6"
};
/**
* Heading - Semantic heading component
*
* Renders headings with semantic HTML (h1-h6) and themed styling.
*
* @example
* ```
* <Heading level={1}>Page Title</Heading>
* <Heading level={2}>Section</Heading>
* <Heading level={2} accessibilityLevel={3}>Sidebar Section</Heading>
* <Heading level={1} type="display-1">Hero Title</Heading>
* <Heading level={2} type="display-2">$1.2M Revenue</Heading>
* <Heading level={2} maxLines={1}>Very Long Section Title...</Heading>
* <Heading level={3} color="secondary">Muted Heading</Heading>
* ```
*/
function Heading({ level, type, accessibilityLevel, color = "primary", display = "block", maxLines = 0, hasTruncateTooltip = true, wordBreak, textWrap, justify = "start", hasCapsize = false, hasStrikethrough = false, xstyle, className, style, children, ref, ...props$1 }) {
	const Component = levelToTag[level];
	const ariaProps = accessibilityLevel && accessibilityLevel !== level ? { "aria-level": accessibilityLevel } : {};
	const resolvedWordBreak = wordBreak ?? (maxLines === 1 ? "break-all" : "break-word");
	const resolvedDisplay = maxLines > 0 || hasCapsize ? "block" : display;
	const truncation = useTruncation({ maxLines });
	const tooltipPlacement = typeof hasTruncateTooltip === "string" ? hasTruncateTooltip : "above";
	const tooltipEnabled = maxLines > 0 && hasTruncateTooltip !== false && truncation.isTruncated;
	const headingRef = (0, import_react.useRef)(null);
	const inlineStyle = maxLines > 1 ? { WebkitLineClamp: maxLines } : void 0;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)(Component, {
		ref: mergeRefs(ref, truncation.ref, headingRef),
		...mergeProps(themeProps("heading", {
			level,
			color,
			...type && { type }
		}), props(colorStyles[color], type ? sizeByTypeStyles[type] : sizeByLevelStyles[level], type && defaultWeightByTypeStyles[type], maxLines === 1 ? truncationStyles.singleLine : maxLines > 1 ? truncationStyles.multiLine : displayStyles[resolvedDisplay], maxLines > 0 && wordBreakStyles[resolvedWordBreak], textWrap && textWrapStyles[textWrap], justify !== "start" && justifyStyles[justify], hasCapsize && capsizeStyles.enabled, hasStrikethrough && decorationStyles.strikethrough, xstyle), className, {
			...style,
			...inlineStyle
		}),
		title: tooltipEnabled ? truncation.fullText : void 0,
		...ariaProps,
		...props$1,
		children
	}), tooltipEnabled && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: null,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(LazyXDSTooltip, {
			anchorRef: headingRef,
			content: /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
				...props(truncationTooltipStyles.content),
				children: truncation.fullText
			}),
			placement: tooltipPlacement
		})
	})] });
}
Heading.displayName = "Heading";
//#endregion
//#region node_modules/@astryxdesign/core/dist/hooks/useIsomorphicLayoutEffect.js
/**
* @file useIsomorphicLayoutEffect.ts
* @input React useLayoutEffect, useEffect
* @output Exports useIsomorphicLayoutEffect
* @position Internal utility; used by components that need useLayoutEffect
*   but must avoid the SSR warning React emits when useLayoutEffect runs
*   on the server (where there is no DOM to synchronously measure).
*
* On the client this is useLayoutEffect; on the server it falls back to
* useEffect (which is a no-op during SSR anyway). The runtime behavior is
* identical — neither hook fires during server rendering — but React only
* warns about useLayoutEffect.
*/
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
//#endregion
//#region node_modules/@astryxdesign/core/dist/Tooltip/Tooltip.js
/**
* @file Tooltip.tsx
* @input Uses React, useTooltip hook
* @output Exports Tooltip component for hover/focus triggered tooltips
* @position Layer component; uses display:contents wrapper to avoid cloneElement
*
* SYNC: When modified, update these files to stay in sync:
* - /packages/core/src/Tooltip/index.ts
* - /apps/storybook/stories/Tooltip.stories.tsx
* - /packages/cli/templates/blocks/components/Tooltip/ (showcase blocks)
*/
var Tooltip_exports = /* @__PURE__ */ __exportAll({ Tooltip: () => Tooltip });
/**
* Check if children are text-only (no React elements)
*/
function isTextOnly(children) {
	return typeof children === "string" || typeof children === "number";
}
/**
* Utility to merge ARIA ID strings
*/
function mergeIds(...ids) {
	const filtered = ids.filter(Boolean);
	return filtered.length > 0 ? filtered.join(" ") : void 0;
}
/**
* Tooltip component for displaying informative text on hover/focus.
*
* Uses inverted colors (dark background, light text) for high contrast.
* Uses a display:contents wrapper so children refs are preserved.
* Uses CSS anchor positioning and the Popover API for optimal performance.
*
* @example
* ```
* <Tooltip content="Helpful tooltip text" placement="above">
*   <Button>Hover me</Button>
* </Tooltip>
* ```
*/
function Tooltip({ children, anchorRef, content, placement = "above", alignment = "center", delay = 200, hideDelay = 0, focusTrigger = "auto", isEnabled = true, onOpenChange, hasHoverIndication = "auto", isOpen, isDefaultOpen }) {
	const wrapperRef = (0, import_react.useRef)(null);
	const textOnly = children != null ? isTextOnly(children) : false;
	const showHoverIndication = hasHoverIndication === true || hasHoverIndication === "auto" && textOnly;
	const tooltip = useTooltip({
		placement,
		alignment,
		delay,
		hideDelay,
		focusTrigger,
		isEnabled,
		isOpen,
		isDefaultOpen,
		onShow: (0, import_react.useCallback)(() => {
			onOpenChange?.(true);
		}, [onOpenChange]),
		onHide: (0, import_react.useCallback)(() => {
			onOpenChange?.(false);
		}, [onOpenChange])
	});
	useIsomorphicLayoutEffect(() => {
		if (!anchorRef) return;
		const el = anchorRef.current;
		if (!el) return;
		tooltip.ref(el);
		const existingDescribedBy = el.getAttribute("aria-describedby");
		el.setAttribute("aria-describedby", mergeIds(existingDescribedBy, tooltip.describedBy) ?? "");
		return () => {
			tooltip.ref(null);
			if (existingDescribedBy) el.setAttribute("aria-describedby", existingDescribedBy);
			else el.removeAttribute("aria-describedby");
		};
	}, [
		anchorRef,
		tooltip.ref,
		tooltip.describedBy
	]);
	useIsomorphicLayoutEffect(() => {
		if (anchorRef) return;
		if (textOnly) return;
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const firstChild = wrapper.firstElementChild;
		if (!firstChild) return;
		tooltip.ref(firstChild);
		const existingDescribedBy = firstChild.getAttribute("aria-describedby");
		firstChild.setAttribute("aria-describedby", mergeIds(existingDescribedBy, tooltip.describedBy) ?? "");
		return () => {
			tooltip.ref(null);
			if (existingDescribedBy) firstChild.setAttribute("aria-describedby", existingDescribedBy);
			else firstChild.removeAttribute("aria-describedby");
		};
	}, [
		anchorRef,
		textOnly,
		tooltip.ref,
		tooltip.describedBy
	]);
	if (anchorRef && children == null) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: tooltip.renderTooltip(content) });
	if (textOnly) return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
		ref: tooltip.ref,
		tabIndex: 0,
		"aria-describedby": tooltip.describedBy,
		...{
			0: { className: "xt0psk2" },
			1: { className: "xt0psk2 xujl8zx xev0dqp xycaml9 xrys4gj" }
		}[!!showHoverIndication << 0],
		children
	}), tooltip.renderTooltip(content)] });
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapperRef,
		className: "xjp7ctv",
		children
	}), tooltip.renderTooltip(content)] });
}
Tooltip.displayName = "Tooltip";
//#endregion
export { Text as a, require_jsx_runtime as c, Button as i, require_react as l, Card as n, VStack as o, IconButton as r, HStack as s, Heading as t };
