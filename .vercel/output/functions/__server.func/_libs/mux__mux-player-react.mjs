import { o as __toESM } from "../_runtime.mjs";
import { l as require_react } from "./@astryxdesign/core+[...].mjs";
import { t as kn } from "./@mux/mux-player+[...].mjs";
//#region node_modules/@mux/mux-player-react/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var M = parseInt("19.2.7") >= 19, E = {
	className: "class",
	classname: "class",
	htmlFor: "for",
	crossOrigin: "crossorigin",
	viewBox: "viewBox",
	playsInline: "playsinline",
	autoPlay: "autoplay",
	playbackRate: "playbackrate"
}, B = (e) => e == null, ee = (e, t) => B(t) ? !1 : e in t, te = (e) => e.replace(/[A-Z]/g, (t) => `-${t.toLowerCase()}`), ne = (e, t) => {
	if (!(!M && typeof t == "boolean" && !t)) {
		if (ee(e, E)) return E[e];
		if (typeof t != "undefined") return /[A-Z]/.test(e) ? te(e) : e;
	}
};
var ae = (e, t) => !M && typeof e == "boolean" ? "" : e, P = (e = {}) => {
	let { ref: t, ...n } = e;
	return Object.entries(n).reduce((o, [a, l]) => {
		let i = ne(a, l);
		if (!i) return o;
		return o[i] = ae(l, a), o;
	}, {});
};
function x(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
function re(...e) {
	return (t) => {
		let n = !1, o = e.map((a) => {
			let l = x(a, t);
			return !n && typeof l == "function" && (n = !0), l;
		});
		if (n) return () => {
			for (let a = 0; a < o.length; a++) {
				let l = o[a];
				typeof l == "function" ? l() : x(e[a], null);
			}
		};
	};
}
function f(...e) {
	return import_react.useCallback(re(...e), e);
}
var oe = Object.prototype.hasOwnProperty, ue = (e, t) => {
	if (Object.is(e, t)) return !0;
	if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
	if (Array.isArray(e)) return !Array.isArray(t) || e.length !== t.length ? !1 : e.some((a, l) => t[l] === a);
	let n = Object.keys(e), o = Object.keys(t);
	if (n.length !== o.length) return !1;
	for (let a = 0; a < n.length; a++) if (!oe.call(t, n[a]) || !Object.is(e[n[a]], t[n[a]])) return !1;
	return !0;
}, p = (e, t, n) => !ue(t, e[n]), se = (e, t, n) => {
	e[n] = t;
}, ie = (e, t, n, o = se, a = p) => (0, import_react.useEffect)(() => {
	let l = n == null ? void 0 : n.current;
	l && a(l, t, e) && o(l, t, e);
}, [n == null ? void 0 : n.current, t]), u = ie;
var ye = () => {
	try {
		return "3.13.0";
	} catch {}
	return "UNKNOWN";
}, me = ye(), g = () => me;
var r = (e, t, n) => (0, import_react.useEffect)(() => {
	let o = t == null ? void 0 : t.current;
	if (!o || !n) return;
	let a = e, l = n;
	return o.addEventListener(a, l), () => {
		o.removeEventListener(a, l);
	};
}, [
	t == null ? void 0 : t.current,
	n,
	e
]);
var Pe = import_react.forwardRef(({ children: e, ...t }, n) => import_react.createElement("mux-player", {
	suppressHydrationWarning: !0,
	...P(t),
	ref: n
}, e)), xe = (e, t) => {
	let { onAbort: n, onCanPlay: o, onCanPlayThrough: a, onEmptied: l, onLoadStart: i, onLoadedData: c, onLoadedMetadata: v, onProgress: R, onDurationChange: T, onVolumeChange: h, onRateChange: b, onResize: C, onWaiting: k, onPlay: O, onPlaying: S, onTimeUpdate: w, onPause: N, onSeeking: L, onSeeked: A, onStalled: I, onSuspend: _, onEnded: K, onError: H, onCuePointChange: D, onChapterChange: V, metadata: W, tokens: U, paused: z, playbackId: F, playbackRates: G, currentTime: Z, themeProps: j, extraSourceParams: q, castCustomData: J, _hlsConfig: Y, ...$ } = t;
	return u("tokens", U, e), u("playbackId", F, e), u("playbackRates", G, e), u("metadata", W, e), u("extraSourceParams", q, e), u("_hlsConfig", Y, e), u("themeProps", j, e), u("castCustomData", J, e), u("paused", z, e, (s, y) => {
		y != null && (y ? s.pause() : s.play());
	}, (s, y, Q) => s.hasAttribute("autoplay") && !s.hasPlayed ? !1 : p(s, y, Q)), u("currentTime", Z, e, (s, y) => {
		y != null && (s.currentTime = y);
	}), r("abort", e, n), r("canplay", e, o), r("canplaythrough", e, a), r("emptied", e, l), r("loadstart", e, i), r("loadeddata", e, c), r("loadedmetadata", e, v), r("progress", e, R), r("durationchange", e, T), r("volumechange", e, h), r("ratechange", e, b), r("resize", e, C), r("waiting", e, k), r("play", e, O), r("playing", e, S), r("timeupdate", e, w), r("pause", e, N), r("seeking", e, L), r("seeked", e, A), r("stalled", e, I), r("suspend", e, _), r("ended", e, K), r("error", e, H), r("cuepointchange", e, D), r("chapterchange", e, V), [$];
}, de = g(), fe = "mux-player-react", ze = import_react.forwardRef((e, t) => {
	var i;
	let n = (0, import_react.useRef)(null), o = f(n, t), [a] = xe(n, e), [l] = (0, import_react.useState)((i = e.playerInitTime) != null ? i : kn());
	return import_react.createElement(Pe, {
		ref: o,
		defaultHiddenCaptions: e.defaultHiddenCaptions,
		playerSoftwareName: fe,
		playerSoftwareVersion: de,
		playerInitTime: l,
		...a
	});
});
//#endregion
export { ze as t };
