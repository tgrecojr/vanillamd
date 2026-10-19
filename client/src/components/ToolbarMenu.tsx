import {
	type MouseEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface ButtonProps {
	title: string;
	icon: ReactNode;
	disabled?: boolean;
	pressed?: boolean;
	onClick?: () => void;
}

/**
 * Keep focus (and, on phones, the on-screen keyboard) in the editor when a
 * toolbar control is pressed. Without this, tapping a button on iOS blurs the
 * contenteditable, dismisses the keyboard, and the formatting command lands
 * on a stale selection.
 */
const keepEditorFocus = (e: MouseEvent): void => e.preventDefault();

/** A square icon button in the editor toolbar. */
export function ToolbarButton({
	title,
	icon,
	disabled,
	pressed,
	onClick,
}: ButtonProps): React.JSX.Element {
	return (
		<button
			type="button"
			className={`tb-button${pressed ? " is-active" : ""}`}
			title={title}
			aria-label={title}
			aria-pressed={pressed}
			disabled={disabled}
			onMouseDown={keepEditorFocus}
			onClick={onClick}
		>
			{icon}
		</button>
	);
}

/** A borderless icon button inside a {@link ToolbarMenu} dropdown. */
export function ToolbarSubButton({
	title,
	icon,
	onClick,
}: ButtonProps): React.JSX.Element {
	return (
		<button
			type="button"
			className="tb-sub-button"
			title={title}
			aria-label={title}
			onMouseDown={keepEditorFocus}
			onClick={onClick}
		>
			{icon}
		</button>
	);
}

interface MenuProps {
	title: string;
	icon: ReactNode;
	disabled?: boolean;
	/** One or more `<ToolbarRow>`s of sub-buttons. */
	children: ReactNode;
}

/**
 * Toolbar button that reveals a dropdown of related actions. On pointer
 * devices it opens on hover (pure CSS, see `.tb-menu`), like many-notes'
 * hover menus; a click toggles it so touch and keyboard users can open it
 * too. Picking an item, clicking elsewhere, or Escape closes it.
 */
export function ToolbarMenu({
	title,
	icon,
	disabled,
	children,
}: MenuProps): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
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

	useEffect(() => {
		if (disabled) setOpen(false);
	}, [disabled]);

	return (
		<div
			className={`tb-menu${disabled ? " is-disabled" : ""}${open ? " is-open" : ""}`}
			ref={rootRef}
		>
			<ToolbarButton
				title={title}
				icon={icon}
				disabled={disabled}
				onClick={() => setOpen((v) => !v)}
			/>
			{!disabled && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: bubbling click from item buttons; they are keyboard-reachable themselves
				// biome-ignore lint/a11y/noStaticElementInteractions: same
				<div className="tb-dropdown" onClick={close}>
					{children}
				</div>
			)}
		</div>
	);
}

export function ToolbarRow({
	children,
}: {
	children: ReactNode;
}): React.JSX.Element {
	return <div className="tb-row">{children}</div>;
}
