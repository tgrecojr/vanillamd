import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { SaveState } from "./types";

interface Pending {
	path: string;
	content: string;
}

/**
 * Debounced autosave. `schedule` queues the latest content for a path and saves
 * after `delay` ms of quiet. `flush` forces an immediate save of anything
 * pending (used before switching notes or when the tab is hidden).
 */
export function useAutosave(delay = 600): {
	state: SaveState;
	schedule: (path: string, content: string) => void;
	flush: () => Promise<void>;
} {
	const [state, setState] = useState<SaveState>("idle");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pending = useRef<Pending | null>(null);

	const flush = useCallback(async (): Promise<void> => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		const job = pending.current;
		if (!job) return;
		pending.current = null;
		setState("saving");
		try {
			await api.saveNote(job.path, job.content);
			setState("saved");
		} catch {
			setState("error");
		}
	}, []);

	const schedule = useCallback(
		(path: string, content: string): void => {
			pending.current = { path, content };
			setState("saving");
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => void flush(), delay);
		},
		[flush, delay],
	);

	useEffect(() => {
		const onHide = (): void => {
			if (document.visibilityState === "hidden") void flush();
		};
		document.addEventListener("visibilitychange", onHide);
		return () => document.removeEventListener("visibilitychange", onHide);
	}, [flush]);

	return { state, schedule, flush };
}
