import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
type Effective = "light" | "dark";

const STORAGE_KEY = "vanillamd.theme";

function readPreference(): ThemePreference {
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === "light" || stored === "dark" ? stored : "system";
}

function systemPrefersDark(): boolean {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Theme that follows the OS by default with a manual override persisted to
 * localStorage. Resolves to an explicit light/dark value applied as a
 * `data-theme` attribute on <html> so CSS never needs media queries.
 */
export function useTheme(): {
	preference: ThemePreference;
	effective: Effective;
	cycle: () => void;
} {
	const [preference, setPreference] = useState<ThemePreference>(readPreference);
	const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	const effective: Effective =
		preference === "system" ? (systemDark ? "dark" : "light") : preference;

	useEffect(() => {
		document.documentElement.dataset.theme = effective;
	}, [effective]);

	const cycle = useCallback(() => {
		setPreference((prev) => {
			const next: ThemePreference =
				prev === "system" ? "light" : prev === "light" ? "dark" : "system";
			if (next === "system") localStorage.removeItem(STORAGE_KEY);
			else localStorage.setItem(STORAGE_KEY, next);
			return next;
		});
	}, []);

	return { preference, effective, cycle };
}
