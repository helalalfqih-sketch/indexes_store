import { o as __toESM } from "../_runtime.mjs";
import { i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { n as quickOrderLink } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useThree, c as Matrix4, d as TextureLoader, f as Vector3, i as useLoader, l as Quaternion, n as Canvas, o as ClampToEdgeWrapping, r as useFrame, s as LinearFilter, t as Float, u as SRGBColorSpace } from "../_libs/@react-three/drei+[...].mjs";
import { B as MessageCircle, L as Package, t as lucide_react_exports, y as Sparkles } from "../_libs/lucide-react.mjs";
import { a as useScroll, i as useTransform, o as motion, r as useSpring, s as AnimatePresence } from "../_libs/framer-motion.mjs";
import { t as ProductCard } from "./product-card-C_xAF7Ek.mjs";
import { t as Route } from "./routes-BuhtP6-n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CnsqNamw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BG_TOP = "#040818";
var BG_MID = "#06091f";
var BG_BOT = "#000209";
var ACCENT = "#4f8cff";
var ACCENT2 = "#a259ff";
var LIGHT$1 = "#eeeeff";
var RING_CLR = "#3a6bdb";
var RADIUS = 2.2;
var TILE = .7;
function proxiedTextureUrl(value) {
	try {
		const url = new URL(value.trim());
		if (url.protocol !== "https:") return value;
		return `/api/public/image-proxy?url=${encodeURIComponent(url.toString())}`;
	} catch {
		return value;
	}
}
var TileErrorBoundary = class extends import_react.Component {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error, info) {
		console.warn("[TileErrorBoundary]", error, info);
	}
	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
};
function cleanR3FProps(props) {
	const out = {};
	for (const [k, v] of Object.entries(props)) if (!k.startsWith("data-")) out[k] = v;
	return out;
}
function r3f(type, props) {
	const { children, ...rest } = props;
	return (0, import_react.createElement)(type, cleanR3FProps(rest), children);
}
var RMesh = (p) => r3f("mesh", p);
var RGroup = (p) => r3f("group", p);
var RPlaneGeometry = (p) => r3f("planeGeometry", p);
var RSphereGeometry = (p) => r3f("sphereGeometry", p);
var RTorusGeometry = (p) => r3f("torusGeometry", p);
var RMeshBasicMaterial = (p) => r3f("meshBasicMaterial", p);
var RMeshStandardMaterial = (p) => r3f("meshStandardMaterial", p);
var RColor = (p) => r3f("color", p);
var RFog = (p) => r3f("fog", p);
var RAmbientLight = (p) => r3f("ambientLight", p);
var RDirectionalLight = (p) => r3f("directionalLight", p);
var RPointLight = (p) => r3f("pointLight", p);
function fibonacciSphere(count, radius) {
	if (count <= 1) return [new Vector3(0, 0, radius)];
	const pts = [];
	const phi = Math.PI * (Math.sqrt(5) - 1);
	for (let i = 0; i < count; i++) {
		const y = 1 - i / (count - 1) * 2;
		const r = Math.sqrt(1 - y * y);
		const theta = phi * i;
		pts.push(new Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius));
	}
	return pts;
}
function OrbitalRing() {
	const meshRef = (0, import_react.useRef)(null);
	useFrame((_, delta) => {
		if (!meshRef.current) return;
		meshRef.current.rotation.x += delta * .08;
		meshRef.current.rotation.z += delta * .04;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, {
		ref: meshRef,
		rotation: [
			Math.PI / 2.5,
			.2,
			0
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RTorusGeometry, { args: [
			2.75,
			.018,
			16,
			120
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshBasicMaterial, {
			color: RING_CLR,
			transparent: true,
			opacity: .55
		})]
	});
}
function OrbitalRing2() {
	const meshRef = (0, import_react.useRef)(null);
	useFrame((_, delta) => {
		if (!meshRef.current) return;
		meshRef.current.rotation.y += delta * .06;
		meshRef.current.rotation.z -= delta * .03;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, {
		ref: meshRef,
		rotation: [
			.8,
			1.2,
			.4
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RTorusGeometry, { args: [
			3.1,
			.01,
			12,
			100
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshBasicMaterial, {
			color: ACCENT2,
			transparent: true,
			opacity: .3
		})]
	});
}
function ProductTile({ data, onHover, onLeave, onSelect, isHovered }) {
	const rawUrl = data.product.image;
	const texture = useLoader(TextureLoader, proxiedTextureUrl(!!data.product.videoPlaybackId ? `https://image.mux.com/${data.product.videoPlaybackId}/thumbnail.jpg?time=2` : rawUrl), (loader) => {
		loader.setCrossOrigin("anonymous");
	});
	if (texture) {
		texture.colorSpace = SRGBColorSpace;
		texture.wrapS = ClampToEdgeWrapping;
		texture.wrapT = ClampToEdgeWrapping;
		texture.minFilter = LinearFilter;
		texture.magFilter = LinearFilter;
		texture.flipY = true;
		texture.anisotropy = 4;
	}
	const meshRef = (0, import_react.useRef)(null);
	const glowRef = (0, import_react.useRef)(null);
	useFrame((_, delta) => {
		if (!meshRef.current) return;
		const target = isHovered ? 1.28 : 1;
		const cur = meshRef.current.scale.x;
		const next = cur + (target - cur) * Math.min(1, delta * 10);
		meshRef.current.scale.setScalar(next);
		if (glowRef.current) {
			const mat = glowRef.current.material;
			mat.opacity += ((isHovered ? .6 : 0) - mat.opacity) * Math.min(1, delta * 8);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RGroup, {
		position: data.position,
		quaternion: data.quaternion,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, {
			ref: glowRef,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RPlaneGeometry, { args: [TILE * 1.18, TILE * 1.18] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshBasicMaterial, {
				color: ACCENT,
				transparent: true,
				opacity: 0,
				side: 2
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, {
			ref: meshRef,
			onPointerOver: (e) => {
				e.stopPropagation();
				document.body.style.cursor = "pointer";
				onHover(data.product);
			},
			onPointerOut: () => {
				document.body.style.cursor = "";
				onLeave();
			},
			onClick: (e) => {
				e.stopPropagation();
				onSelect(data.product);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RPlaneGeometry, { args: [TILE, TILE] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshBasicMaterial, {
				map: texture,
				toneMapped: false,
				side: 2
			})]
		})]
	});
}
function useDragRotation(groupRef) {
	const isDragging = (0, import_react.useRef)(false);
	const lastPos = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const velocity = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const autoRotate = (0, import_react.useRef)(true);
	const { gl } = useThree();
	(0, import_react.useEffect)(() => {
		const el = gl.domElement;
		const onDown = (x, y) => {
			isDragging.current = true;
			lastPos.current = {
				x,
				y
			};
			autoRotate.current = false;
			velocity.current = {
				x: 0,
				y: 0
			};
		};
		const onMove = (x, y) => {
			if (!isDragging.current || !groupRef.current) return;
			const dx = x - lastPos.current.x;
			const dy = y - lastPos.current.y;
			groupRef.current.rotation.y += dx * .008;
			groupRef.current.rotation.x += dy * .008;
			velocity.current = {
				x: dy * .008,
				y: dx * .008
			};
			lastPos.current = {
				x,
				y
			};
		};
		const onUp = () => {
			isDragging.current = false;
			setTimeout(() => {
				autoRotate.current = true;
			}, 2500);
		};
		const mouseDown = (e) => onDown(e.clientX, e.clientY);
		const mouseMove = (e) => onMove(e.clientX, e.clientY);
		const touchStart = (e) => {
			const t = e.touches[0];
			onDown(t.clientX, t.clientY);
		};
		const touchMove = (e) => {
			e.preventDefault();
			const t = e.touches[0];
			onMove(t.clientX, t.clientY);
		};
		el.addEventListener("mousedown", mouseDown);
		el.addEventListener("mousemove", mouseMove);
		el.addEventListener("mouseup", onUp);
		el.addEventListener("touchstart", touchStart, { passive: true });
		el.addEventListener("touchmove", touchMove, { passive: false });
		el.addEventListener("touchend", onUp);
		return () => {
			el.removeEventListener("mousedown", mouseDown);
			el.removeEventListener("mousemove", mouseMove);
			el.removeEventListener("mouseup", onUp);
			el.removeEventListener("touchstart", touchStart);
			el.removeEventListener("touchmove", touchMove);
			el.removeEventListener("touchend", onUp);
		};
	}, [gl, groupRef]);
	return {
		isDragging,
		autoRotate,
		velocity
	};
}
function ProductSphere({ products, onHoverAny, onSelect, hoveredId }) {
	const groupRef = (0, import_react.useRef)(null);
	const { isDragging, autoRotate, velocity } = useDragRotation(groupRef);
	const tiles = (0, import_react.useMemo)(() => {
		const positions = fibonacciSphere(products.length, RADIUS);
		const up = new Vector3(0, 1, 0);
		return products.map((p, i) => {
			const pos = positions[i];
			const normal = pos.clone().normalize();
			const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
			const right = new Vector3().crossVectors(up, normal).normalize();
			if (right.lengthSq() > .001) {
				const tileUp = new Vector3().crossVectors(normal, right).normalize();
				const m = new Matrix4().makeBasis(right, tileUp, normal);
				q.setFromRotationMatrix(m);
			}
			return {
				product: p,
				position: pos,
				quaternion: q
			};
		});
	}, [products]);
	useFrame((_, delta) => {
		if (!groupRef.current) return;
		if (!isDragging.current && autoRotate.current) {
			groupRef.current.rotation.y += delta * (hoveredId ? .015 : .09);
			groupRef.current.rotation.x += delta * .012;
		} else if (!isDragging.current) {
			velocity.current.x *= .92;
			velocity.current.y *= .92;
			groupRef.current.rotation.x += velocity.current.x;
			groupRef.current.rotation.y += velocity.current.y;
		}
	});
	const fallbackMat = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshBasicMaterial, {
		color: "#1e2a4a",
		side: 2
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RGroup, {
		ref: groupRef,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RSphereGeometry, { args: [
				RADIUS * .78,
				40,
				40
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RMeshStandardMaterial, {
				color: "#0a0e2a",
				emissive: ACCENT,
				emissiveIntensity: .12,
				metalness: .85,
				roughness: .25,
				transparent: true,
				opacity: .45
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitalRing, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitalRing2, {}),
			tiles.map((t) => {
				const fb = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RMesh, {
					position: t.position,
					quaternion: t.quaternion,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RPlaneGeometry, { args: [TILE, TILE] }), fallbackMat]
				}, t.product.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TileErrorBoundary, {
					fallback: fb,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: fb,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductTile, {
							data: t,
							isHovered: hoveredId === t.product.id,
							onHover: (p) => onHoverAny(p),
							onLeave: () => onHoverAny(null),
							onSelect
						})
					})
				}, t.product.id);
			})
		]
	});
}
function Scene({ products, onHoverAny, onSelect, hoveredId }) {
	const { size, camera } = useThree();
	(0, import_react.useEffect)(() => {
		const aspect = size.width / size.height;
		if (aspect < 1) {
			camera.position.z = 5.8 / (aspect * 1.15);
			camera.position.y = .55;
		} else {
			camera.position.z = 5.8;
			camera.position.y = .25;
		}
		camera.lookAt(0, -.15, 0);
		camera.updateProjectionMatrix();
	}, [
		size.width,
		size.height,
		camera
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RColor, {
			attach: "background",
			args: [BG_MID]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RFog, {
			attach: "fog",
			args: [
				BG_BOT,
				10,
				26
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RAmbientLight, { intensity: 1.8 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RDirectionalLight, {
			position: [
				2,
				4,
				6
			],
			intensity: 2.8,
			color: "#c8d4ff"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RDirectionalLight, {
			position: [
				-5,
				2,
				-3
			],
			intensity: 2,
			color: ACCENT
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RDirectionalLight, {
			position: [
				0,
				-4,
				-5
			],
			intensity: 1.4,
			color: ACCENT2
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RPointLight, {
			position: [
				3,
				2,
				4
			],
			intensity: 30,
			color: "#d0e0ff",
			distance: 14,
			decay: 2
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RPointLight, {
			position: [
				-3,
				-2,
				-3
			],
			intensity: 18,
			color: ACCENT2,
			distance: 12,
			decay: 2
		}),
		(0, import_react.createElement)(Float, {
			speed: .6,
			rotationIntensity: .08,
			floatIntensity: .18
		}, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductSphere, {
			products,
			onHoverAny,
			onSelect,
			hoveredId
		}))
	] });
}
function Fallback() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 grid place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-12 w-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-0 animate-spin rounded-full border-2",
					style: { borderColor: `${ACCENT} transparent transparent transparent` }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-2 animate-ping rounded-full",
					style: {
						background: ACCENT,
						opacity: .3
					}
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-medium tracking-[0.35em]",
				style: {
					color: "rgba(200,210,255,0.45)",
					fontFamily: "Tajawal, system-ui, sans-serif"
				},
				children: "جاري تحميل المعرض…"
			})]
		})
	});
}
function StarField() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 overflow-hidden",
		children: (0, import_react.useMemo)(() => {
			const arr = [];
			for (let i = 0; i < 80; i++) arr.push({
				x: Math.random() * 100,
				y: Math.random() * 100,
				r: .5 + Math.random() * 1.2,
				op: .15 + Math.random() * .45,
				dur: 2 + Math.random() * 4
			});
			return arr;
		}, []).map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute rounded-full animate-pulse",
			style: {
				left: `${s.x}%`,
				top: `${s.y}%`,
				width: `${s.r * 2}px`,
				height: `${s.r * 2}px`,
				background: "white",
				opacity: s.op,
				animationDuration: `${s.dur}s`,
				animationDelay: `${Math.random() * 4}s`
			}
		}, i))
	});
}
function ProductSphereHero({ products }) {
	const navigate = useNavigate();
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [hovered, setHovered] = (0, import_react.useState)(null);
	const [showHint, setShowHint] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		const t = setTimeout(() => setShowHint(false), 4e3);
		return () => clearTimeout(t);
	}, []);
	const dismissHint = (0, import_react.useCallback)(() => setShowHint(false), []);
	const pool = (0, import_react.useMemo)(() => products.filter((p) => !!p.image).slice(0, 28), [products]);
	const hoveredId = hovered?.id ?? null;
	const handleSelect = (0, import_react.useCallback)((p) => navigate({
		to: "/product/$slug",
		params: { slug: p.slug }
	}), [navigate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		dir: "rtl",
		className: "relative -mx-4 overflow-hidden rounded-3xl",
		style: {
			height: "88vh",
			minHeight: "580px",
			background: `radial-gradient(ellipse at 50% 30%, #0d1435 0%, #06091f 55%, ${BG_BOT} 100%)`
		},
		onPointerDown: dismissHint,
		onTouchStart: dismissHint,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarField, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0",
				style: { background: ["radial-gradient(ellipse 60% 40% at 20% 80%, rgba(79,140,255,0.08) 0%, transparent 70%)", "radial-gradient(ellipse 50% 35% at 80% 20%, rgba(162,89,255,0.07) 0%, transparent 70%)"].join(", ") }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				style: { touchAction: "none" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fallback, {}),
					children: mounted && pool.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
						dpr: [1, 1.5],
						camera: {
							position: [
								0,
								.3,
								5.8
							],
							fov: 44
						},
						gl: {
							antialias: true,
							alpha: false,
							powerPreference: "high-performance",
							stencil: false,
							depth: true
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
							fallback: null,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scene, {
								products: pool,
								onHoverAny: setHovered,
								onSelect: handleSelect,
								hoveredId
							})
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fallback, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 h-32",
				style: { background: `linear-gradient(to bottom, ${BG_TOP}ee 0%, transparent 100%)` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 h-40",
				style: { background: `linear-gradient(to top, ${BG_BOT}f5 0%, transparent 100%)` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-7 text-center",
				style: { fontFamily: "Tajawal, system-ui, sans-serif" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						initial: {
							opacity: 0,
							y: -8
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: {
							delay: .3,
							duration: .6
						},
						className: "mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1",
						style: {
							border: "1px solid rgba(79,140,255,0.35)",
							background: "rgba(79,140,255,0.10)",
							backdropFilter: "blur(8px)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-1.5 w-1.5 animate-pulse rounded-full",
							style: { background: ACCENT }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-bold tracking-[0.35em]",
							style: { color: "rgba(200,220,255,0.85)" },
							children: "INDEXES · LIVE SHOWCASE"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h1, {
						initial: {
							opacity: 0,
							y: -6
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: {
							delay: .45,
							duration: .7
						},
						className: "text-3xl font-black leading-tight sm:text-5xl",
						style: {
							color: LIGHT$1,
							textShadow: `0 0 40px ${ACCENT}55, 0 2px 12px rgba(0,0,0,0.8)`,
							letterSpacing: "-0.01em"
						},
						children: "معرض المنتجات الذكي"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						transition: {
							delay: .7,
							duration: .8
						},
						className: "mt-2 text-[11px] leading-relaxed sm:text-sm",
						style: { color: "rgba(180,200,255,0.60)" },
						children: "اسحب الكرة — كل وجه منتج، اضغط لتفتحه"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: showHint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: {
					opacity: 0,
					scale: .8
				},
				animate: {
					opacity: 1,
					scale: 1
				},
				exit: {
					opacity: 0,
					scale: .85
				},
				transition: {
					delay: 1.2,
					duration: .5
				},
				className: "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					animate: {
						scale: [
							1,
							1.15,
							1
						],
						opacity: [
							.6,
							.9,
							.6
						]
					},
					transition: {
						repeat: Infinity,
						duration: 2
					},
					className: "flex flex-col items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xl",
						children: "✦"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[9px] font-bold tracking-[0.4em]",
						style: {
							color: "rgba(180,200,255,0.55)",
							fontFamily: "Tajawal, system-ui"
						},
						children: "اسحب"
					})]
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: hovered && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: {
					y: 24,
					opacity: 0,
					scale: .95
				},
				animate: {
					y: 0,
					opacity: 1,
					scale: 1
				},
				exit: {
					y: 16,
					opacity: 0,
					scale: .96
				},
				transition: {
					duration: .28,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				className: "absolute inset-x-4 bottom-5 z-20 mx-auto sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px]",
				style: { pointerEvents: "none" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded-2xl px-3 py-2.5",
					style: {
						background: "rgba(6,9,31,0.82)",
						border: "1px solid rgba(79,140,255,0.22)",
						backdropFilter: "blur(24px)",
						boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,140,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
						fontFamily: "Tajawal, system-ui, sans-serif"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl",
							style: { border: "1px solid rgba(79,140,255,0.25)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: proxiedTextureUrl(hovered.image),
								alt: hovered.name,
								className: "h-full w-full object-cover",
								loading: "lazy",
								onError: (e) => {
									e.target.style.display = "none";
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs font-bold leading-snug",
								style: { color: LIGHT$1 },
								children: hovered.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-[11px] font-black",
								style: { color: ACCENT },
								children: formatPrice(hovered.price)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black tracking-wider",
							style: {
								background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
								color: "white",
								boxShadow: `0 0 16px ${ACCENT}55`
							},
							children: "افتح"
						})
					]
				})
			}, hovered.id) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: { delay: 1.5 },
				className: "pointer-events-none absolute bottom-5 left-5 z-10 hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1",
				style: {
					background: "rgba(6,9,31,0.70)",
					border: "1px solid rgba(79,140,255,0.18)",
					backdropFilter: "blur(10px)",
					fontFamily: "Tajawal, system-ui, sans-serif"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "h-1.5 w-1.5 rounded-full animate-pulse",
					style: { background: "#4ade80" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[9px] font-bold",
					style: { color: "rgba(180,210,255,0.65)" },
					children: [pool.length, " منتج"]
				})]
			})
		]
	});
}
var VIDEO_SRC = "https://cdn.coverr.co/videos/coverr-a-luxury-modern-living-room-4568/1080p.mp4";
var VIDEO_POSTER = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=70";
var WA_LINK = "https://wa.me/967774437523?text=" + encodeURIComponent("مرحباً، أريد الاستفسار عن منتجات اندكس ستور");
var HEADLINE = "اندكس ستور: حيث تلتقي الفخامة بالتقنية";
var STORY_BLOCKS = [
	{
		kicker: "الفصل الأول",
		title: "تجربة تسوّق سينمائية",
		body: "لا نبيع منتجات فقط — نصنع لحظات. كل تفصيلة داخل اندكس ستور مصمّمة لتمنحك إحساسًا بالفخامة منذ اللمسة الأولى."
	},
	{
		kicker: "الفصل الثاني",
		title: "تقنية بلا حدود",
		body: "أحدث الأجهزة الذكية، الإكسسوارات الفاخرة، والتجارب ثلاثية الأبعاد التي تجعلك تعيش المنتج قبل اقتنائه."
	},
	{
		kicker: "الفصل الثالث",
		title: "خدمة تليق بك",
		body: "توصيل لكل المحافظات، دعم مباشر عبر الواتساب، وضمان جودة على كل قطعة. أنت في المكان الصحيح."
	}
];
var headlineWords = HEADLINE.split(" ");
var wordVariants = {
	hidden: {
		opacity: 0,
		y: 40,
		filter: "blur(12px)"
	},
	show: (i) => ({
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: {
			duration: .9,
			delay: i * .08,
			ease: [
				.22,
				1,
				.36,
				1
			]
		}
	})
};
function CinematicStory() {
	const sectionRef = (0, import_react.useRef)(null);
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start start", "end end"]
	});
	const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
	const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
	const overlayOpacity = useTransform(scrollYProgress, [
		0,
		.4,
		1
	], [
		.55,
		.7,
		.85
	]);
	const bgTypoX = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref: sectionRef,
		dir: "rtl",
		"aria-label": "قصة اندكس ستور",
		className: "relative w-full",
		style: {
			height: "400vh",
			fontFamily: "Tajawal, system-ui, sans-serif"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sticky top-0 h-screen w-full overflow-hidden bg-[#000209]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					style: {
						scale: videoScale,
						y: videoY
					},
					className: "absolute inset-0 h-full w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: VIDEO_SRC,
						poster: VIDEO_POSTER,
						autoPlay: true,
						muted: true,
						loop: true,
						playsInline: true,
						preload: "metadata",
						className: "h-full w-full object-cover"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					style: { opacity: overlayOpacity },
					className: "absolute inset-0",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full w-full",
						style: { background: "linear-gradient(180deg, rgba(0,2,9,0.9) 0%, rgba(0,2,9,0.35) 40%, rgba(0,2,9,0.55) 70%, rgba(0,2,9,0.95) 100%)" }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					style: { x: bgTypoX },
					"aria-hidden": true,
					className: "pointer-events-none absolute inset-0 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "select-none font-black tracking-tight text-white/25 mix-blend-overlay whitespace-nowrap",
						style: {
							fontSize: "clamp(8rem, 26vw, 26rem)",
							lineHeight: .85
						},
						children: "INDEXES"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center text-white",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h2, {
							initial: "hidden",
							whileInView: "show",
							viewport: {
								once: false,
								amount: .4
							},
							className: "mx-auto max-w-5xl font-black leading-[1.15] tracking-tight text-[clamp(2rem,5vw,5rem)]",
							children: headlineWords.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
								custom: i,
								variants: wordVariants,
								className: "inline-block px-1",
								children: w
							}, `${w}-${i}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 flex w-full max-w-2xl flex-col gap-6",
							children: STORY_BLOCKS.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									y: 40
								},
								whileInView: {
									opacity: 1,
									y: 0
								},
								viewport: {
									once: false,
									amount: .6
								},
								transition: {
									duration: .9,
									delay: i * .08,
									ease: [
										.22,
										1,
										.36,
										1
									]
								},
								className: "rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] font-bold uppercase tracking-[0.25em] text-white/60",
										children: b.kicker
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-1.5 text-lg font-black text-white text-[clamp(1.1rem,2.4vw,1.6rem)]",
										children: b.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm leading-relaxed text-white/80 text-[clamp(0.9rem,1.6vw,1.05rem)]",
										children: b.body
									})
								]
							}, b.title))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.a, {
							href: WA_LINK,
							target: "_blank",
							rel: "noopener noreferrer",
							initial: {
								opacity: 0,
								y: 30,
								scale: .9
							},
							whileInView: {
								opacity: 1,
								y: 0,
								scale: 1
							},
							viewport: {
								once: false,
								amount: .9
							},
							transition: {
								duration: .8,
								ease: [
									.22,
									1,
									.36,
									1
								]
							},
							whileHover: { scale: 1.04 },
							whileTap: { scale: .97 },
							className: "mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-black text-white shadow-2xl backdrop-blur-xl transition hover:bg-white/20",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ابدأ رحلتك معنا عبر واتساب" })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": true,
					className: "pointer-events-none absolute inset-x-0 bottom-0 h-40",
					style: { background: "linear-gradient(to top, #000209 0%, transparent 100%)" }
				})
			]
		})
	});
}
var DARK = "#000209";
var LIGHT = "#EEEEEE";
var revealProps = {
	initial: {
		opacity: 0,
		y: 50
	},
	whileInView: {
		opacity: 1,
		y: 0
	},
	viewport: {
		once: false,
		amount: .3
	},
	transition: {
		duration: .8,
		ease: [
			.22,
			1,
			.36,
			1
		]
	}
};
function HomePage() {
	const { categories, bestSellers, dailyDeals, allProducts } = Route.useLoaderData();
	const pageRef = (0, import_react.useRef)(null);
	const { scrollY } = useScroll();
	const smoothY = useSpring(scrollY, {
		stiffness: 60,
		damping: 20,
		mass: .4
	});
	const bgYSlow = useTransform(smoothY, (v) => v * .15);
	const bgYMid = useTransform(smoothY, (v) => v * .35);
	const bgRotate = useTransform(smoothY, (v) => v * .02);
	const [focusedProduct, setFocusedProduct] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const cards = document.querySelectorAll("[data-product-id]");
		if (!cards.length) return;
		const viewportCenter = () => window.innerHeight / 2;
		const pick = () => {
			let best = null;
			const c = viewportCenter();
			cards.forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.bottom < 0 || r.top > window.innerHeight) return;
				const mid = r.top + r.height / 2;
				const dist = Math.abs(mid - c);
				if (!best || dist < best.dist) best = {
					el,
					dist
				};
			});
			if (best) {
				const id = best.el.dataset.productId;
				const found = allProducts.find((p) => p.id === id) ?? null;
				setFocusedProduct((prev) => prev?.id === found?.id ? prev : found);
			}
		};
		pick();
		const onScroll = () => requestAnimationFrame(pick);
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: pageRef,
		"data-home-root": "true",
		className: "relative flex flex-col gap-10 overflow-hidden pt-4 pb-64",
		style: {
			background: DARK,
			color: LIGHT,
			fontFamily: "Tajawal, system-ui, sans-serif"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 -z-0 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						style: { y: bgYSlow },
						className: "absolute inset-0 opacity-[0.12]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0",
							style: {
								backgroundImage: "linear-gradient(rgba(238,238,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(238,238,238,0.4) 1px, transparent 1px)",
								backgroundSize: "42px 42px",
								maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)"
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						style: {
							y: bgYMid,
							rotate: bgRotate
						},
						className: "absolute -start-24 top-[20vh] h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full w-full",
							style: { background: "radial-gradient(circle, rgba(31,94,255,0.55) 0%, transparent 65%)" }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						style: { y: bgYSlow },
						className: "absolute -end-32 top-[80vh] h-[70vh] w-[70vh] rounded-full opacity-40 blur-3xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full w-full",
							style: { background: "radial-gradient(circle, rgba(102,166,255,0.45) 0%, transparent 65%)" }
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-10 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductSphereHero, { products: allProducts })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				...revealProps,
				className: "relative z-10 px-4 pt-8 sm:pt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 inline-block text-[10px] font-bold tracking-[0.3em]",
						style: { color: "rgba(238,238,238,0.55)" },
						children: "NEW ARRIVALS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-black leading-tight sm:text-2xl",
						style: { color: LIGHT },
						children: "أحدث المنتجات"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						className: "text-xs font-bold",
						style: { color: "rgba(238,238,238,0.65)" },
						children: "استكشف الكل"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 [&_a>div:first-child]:transition-transform [&_a:hover>div:first-child]:scale-[1.03] [&_a]:shadow-card [&_a:hover]:shadow-xl [&_a]:transition-shadow",
					children: allProducts.slice(0, 12).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.section, {
				...revealProps,
				className: "relative z-10 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/immersive-store",
					className: "group relative flex items-center justify-between gap-3 overflow-hidden rounded-3xl border p-4 shadow-2xl",
					style: {
						borderColor: "rgba(238,238,238,0.12)",
						background: "linear-gradient(120deg, rgba(11,18,32,0.9) 0%, rgba(31,94,255,0.55) 55%, rgba(102,166,255,0.4) 100%)",
						color: LIGHT
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(102,166,255,0.7),transparent_45%)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold",
									children: "جديد · تجربة ثلاثية الأبعاد"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1.5 text-lg font-black leading-tight",
									children: "المعرض الافتراضي"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-white/85",
									children: "تجوّل داخل اندكس ستور الفاخر"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-md transition group-hover:scale-110",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5" })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				...revealProps,
				className: "relative z-10 px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-black",
						style: { color: LIGHT },
						children: "التصنيفات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						className: "text-xs font-bold",
						style: { color: "rgba(238,238,238,0.65)" },
						children: "الكل"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					initial: "hidden",
					whileInView: "show",
					viewport: {
						once: false,
						amount: .2
					},
					variants: {
						hidden: {},
						show: { transition: { staggerChildren: .05 } }
					},
					className: "grid grid-cols-4 gap-3",
					children: categories.slice(0, 8).map((c) => {
						const Icon = lucide_react_exports[c.icon] ?? Package;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							variants: {
								hidden: {
									opacity: 0,
									y: 30
								},
								show: {
									opacity: 1,
									y: 0,
									transition: {
										duration: .6,
										ease: [
											.22,
											1,
											.36,
											1
										]
									}
								}
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/category/$id",
								params: { id: c.id },
								className: "flex flex-col items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-6 w-6" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-center text-[10px] font-semibold leading-tight",
									style: { color: "rgba(238,238,238,0.85)" },
									children: c.name
								})]
							})
						}, c.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				...revealProps,
				className: "relative z-10 px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-black",
						style: { color: LIGHT },
						children: "عروض اليوم 🔥"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/offers",
						className: "text-xs font-bold",
						style: { color: "rgba(238,238,238,0.65)" },
						children: "الكل"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
					children: dailyDeals.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "relative z-10 -mx-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CinematicStory, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				...revealProps,
				className: "relative z-10 px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-black",
						style: { color: LIGHT },
						children: "الأكثر مبيعاً"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						className: "text-xs font-bold",
						style: { color: "rgba(238,238,238,0.65)" },
						children: "الكل"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
					children: bestSellers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: false,
				animate: {
					y: focusedProduct ? 0 : 120,
					opacity: focusedProduct ? 1 : 0
				},
				transition: {
					duration: .4,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				className: "pointer-events-none fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-3",
				children: focusedProduct && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: quickOrderLink(focusedProduct),
					target: "_blank",
					rel: "noopener noreferrer",
					className: "pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-2.5 shadow-2xl",
					style: {
						borderColor: "rgba(238,238,238,0.12)",
						background: "rgba(0,2,9,0.72)",
						backdropFilter: "blur(24px) saturate(160%)",
						color: LIGHT
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 ps-2 text-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs font-bold",
							children: focusedProduct.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-black",
							style: { color: "rgba(238,238,238,0.7)" },
							children: formatPrice(focusedProduct.price)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black",
						style: {
							background: LIGHT,
							color: DARK
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" }), "اطلب عبر واتساب"]
					})]
				})
			})
		]
	});
}
//#endregion
export { HomePage as component };
