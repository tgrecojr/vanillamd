import { useEffect, useState } from "react";

/** True while the given CSS media query matches; tracks changes live. */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(
		() => window.matchMedia(query).matches,
	);
	useEffect(() => {
		const mql = window.matchMedia(query);
		const onChange = (e: MediaQueryListEvent): void => setMatches(e.matches);
		setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);
	return matches;
}

/** Narrow (phone-sized) layout: sidebar becomes an overlay drawer. */
export const MOBILE_QUERY = "(max-width: 768px)";

/**
 * Mirrors the *visual* viewport into `--app-height` / `--app-top` on <html>.
 * On iOS Safari the on-screen keyboard shrinks the visual viewport without
 * changing `100vh`/`100dvh`, and the browser scrolls the layout viewport to
 * keep the caret visible. Sizing the app shell from these variables keeps the
 * toolbar and the editor's scroll region inside the area the user can see.
 */
export function useVisualViewportVars(): void {
	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const root = document.documentElement;
		const update = (): void => {
			root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
			root.style.setProperty("--app-top", `${Math.round(vv.offsetTop)}px`);
		};
		update();
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
			root.style.removeProperty("--app-height");
			root.style.removeProperty("--app-top");
		};
	}, []);
}
