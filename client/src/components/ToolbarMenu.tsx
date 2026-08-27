import type { ReactNode } from "react";

interface ButtonProps {
	title: string;
	icon: ReactNode;
	disabled?: boolean;
	onClick?: () => void;
}

/** A square icon button in the editor toolbar. */
export function ToolbarButton({
	title,
	icon,
	disabled,
	onClick,
}: ButtonProps): React.JSX.Element {
	return (
		<button
			type="button"
			className="tb-button"
			title={title}
			aria-label={title}
			disabled={disabled}
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
 * Toolbar button that reveals a dropdown of related actions on hover or
 * keyboard focus (pure CSS, see `.tb-menu`), like many-notes' hover menus.
 */
export function ToolbarMenu({
	title,
	icon,
	disabled,
	children,
}: MenuProps): React.JSX.Element {
	return (
		<div className={`tb-menu${disabled ? " is-disabled" : ""}`}>
			<ToolbarButton title={title} icon={icon} disabled={disabled} />
			{!disabled && <div className="tb-dropdown">{children}</div>}
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
