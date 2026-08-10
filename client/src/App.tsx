import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "./api";
import { Editor } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import type { TreeNode } from "./types";
import { useAutosave } from "./useAutosave";
import { useTheme } from "./useTheme";

interface OpenNote {
	path: string;
	content: string;
}

const parentOf = (p: string): string => {
	const i = p.lastIndexOf("/");
	return i === -1 ? "" : p.slice(0, i);
};
const joinPath = (dir: string, name: string): string =>
	dir ? `${dir}/${name}` : name;

const cleanName = (raw: string | null): string | null => {
	if (raw === null) return null;
	const name = raw.trim();
	if (name === "" || name.includes("/") || name.includes("\\")) return null;
	return name;
};

export function App(): React.JSX.Element {
	const [tree, setTree] = useState<TreeNode[]>([]);
	const [open, setOpen] = useState<OpenNote | null>(null);
	const [activeFolder, setActiveFolder] = useState("");
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);

	const { state: saveState, schedule, flush } = useAutosave();
	const { preference, cycle } = useTheme();

	const fail = useCallback((err: unknown): void => {
		const message =
			err instanceof ApiError ? err.message : "Something went wrong";
		setError(message);
	}, []);

	const refreshTree = useCallback(async (): Promise<TreeNode[]> => {
		const next = await api.getTree();
		setTree(next);
		return next;
	}, []);

	useEffect(() => {
		refreshTree().catch(fail);
	}, [refreshTree, fail]);

	const expandAncestors = useCallback((path: string): void => {
		const parts = path.split("/").slice(0, -1);
		if (parts.length === 0) return;
		setExpanded((prev) => {
			const next = new Set(prev);
			let acc = "";
			for (const part of parts) {
				acc = acc ? `${acc}/${part}` : part;
				next.add(acc);
			}
			return next;
		});
	}, []);

	const selectNote = useCallback(
		async (path: string): Promise<void> => {
			setError(null);
			try {
				await flush();
				const content = await api.getNote(path);
				setOpen({ path, content });
				setActiveFolder(parentOf(path));
			} catch (err) {
				fail(err);
			}
		},
		[flush, fail],
	);

	const toggleFolder = useCallback((path: string): void => {
		setActiveFolder(path);
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	}, []);

	const onEditorChange = useCallback(
		(markdown: string): void => {
			setOpen((current) => {
				if (current) schedule(current.path, markdown);
				return current;
			});
		},
		[schedule],
	);

	const newNote = useCallback(async (): Promise<void> => {
		const name = cleanName(window.prompt("Note name:"));
		if (!name) return;
		const fileName = name.toLowerCase().endsWith(".md") ? name : `${name}.md`;
		const path = joinPath(activeFolder, fileName);
		try {
			await api.createNote(path);
			await refreshTree();
			expandAncestors(path);
			await selectNote(path);
		} catch (err) {
			fail(err);
		}
	}, [activeFolder, refreshTree, expandAncestors, selectNote, fail]);

	const newFolder = useCallback(async (): Promise<void> => {
		const name = cleanName(window.prompt("Folder name:"));
		if (!name) return;
		const path = joinPath(activeFolder, name);
		try {
			await api.createFolder(path);
			await refreshTree();
			expandAncestors(path);
			setExpanded((prev) => new Set(prev).add(path));
			setActiveFolder(path);
		} catch (err) {
			fail(err);
		}
	}, [activeFolder, refreshTree, expandAncestors, fail]);

	const rename = useCallback(
		async (node: TreeNode): Promise<void> => {
			const isNote = node.type === "note";
			const current = isNote ? node.name.replace(/\.md$/i, "") : node.name;
			const name = cleanName(window.prompt("Rename to:", current));
			if (!name || name === current) return;
			const fileName = isNote ? `${name.replace(/\.md$/i, "")}.md` : name;
			const target = joinPath(parentOf(node.path), fileName);
			try {
				await flush();
				await api.move(node.path, target);
				await refreshTree();
				if (
					open &&
					(open.path === node.path || open.path.startsWith(`${node.path}/`))
				) {
					await selectNote(open.path.replace(node.path, target));
				}
			} catch (err) {
				fail(err);
			}
		},
		[open, flush, refreshTree, selectNote, fail],
	);

	const remove = useCallback(
		async (node: TreeNode): Promise<void> => {
			const what =
				node.type === "note" ? "note" : "folder and everything in it";
			if (!window.confirm(`Delete this ${what}?`)) return;
			try {
				if (node.type === "note") await api.deleteNote(node.path);
				else await api.deleteFolder(node.path);
				await refreshTree();
				if (
					open &&
					(open.path === node.path || open.path.startsWith(`${node.path}/`))
				) {
					setOpen(null);
				}
			} catch (err) {
				fail(err);
			}
		},
		[open, refreshTree, fail],
	);

	return (
		<div className="layout">
			<Sidebar
				tree={tree}
				selectedPath={open?.path ?? null}
				activeFolder={activeFolder}
				expanded={expanded}
				saveState={saveState}
				themePreference={preference}
				onToggleFolder={toggleFolder}
				onSelectNote={(p) => void selectNote(p)}
				onRename={(n) => void rename(n)}
				onDelete={(n) => void remove(n)}
				onNewNote={() => void newNote()}
				onNewFolder={() => void newFolder()}
				onCycleTheme={cycle}
			/>
			<main className="main">
				{error && (
					<div className="error-banner" role="alert">
						{error}
						<button
							type="button"
							onClick={() => setError(null)}
							aria-label="Dismiss"
						>
							✕
						</button>
					</div>
				)}
				{open ? (
					<Editor
						key={open.path}
						initialValue={open.content}
						onChange={onEditorChange}
					/>
				) : (
					<div className="placeholder">
						<p>Select a note, or create one.</p>
					</div>
				)}
			</main>
		</div>
	);
}
