import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

interface MenuProps {
	/** Accessible name for the trigger button. */
	label: string;
	icon: ReactNode;
	className?: string;
	/** Render prop so items can close the menu after acting. */
	children: (close: () => void) => ReactNode;
}

/**
 * Click-to-open dropdown anchored to an icon button. Closes on outside click,
 * Escape, or when an item calls `close()`.
 */
export function Menu({
	label,
	icon,
	className,
	children,
}: MenuProps): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const id = useId();
	const close = useCallback((): void => setOpen(false), []);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (e: PointerEvent): void => {
			if (!rootRef.current?.contains(e.target as Node)) close();
		};
		const onKeyDown = (e: KeyboardEvent): void => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, close]);

	return (
		<div className={`menu${className ? ` ${className}` : ""}`} ref={rootRef}>
			<button
				type="button"
				className={`icon-button menu-trigger${open ? " is-open" : ""}`}
				title={label}
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={id}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
			>
				{icon}
			</button>
			{open && (
				<div className="menu-panel" role="menu" id={id}>
					{children(close)}
				</div>
			)}
		</div>
	);
}

interface ItemProps {
	icon: ReactNode;
	label: string;
	danger?: boolean;
	onClick: () => void;
}

export function MenuItem({
	icon,
	label,
	danger,
	onClick,
}: ItemProps): React.JSX.Element {
	return (
		<button
			type="button"
			role="menuitem"
			className={`menu-item${danger ? " is-danger" : ""}`}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{icon}
			<span>{label}</span>
		</button>
	);
}
