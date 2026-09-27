/**
 * Inline SVG icons (Heroicons / Lucide / Iconify shapes, as used by many-notes).
 * Each renders at 1em and inherits `currentColor`.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base: P = { width: "1em", height: "1em" };

export const Bars3Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const XMarkIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M6 18 18 6M6 6l12 12"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const FileMarkdownIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 19 16"
	>
		<path
			fill="currentColor"
			d="M2.491 4.046a.75.75 0 0 1 .83.218L7 8.592l3.678-4.328A.75.75 0 0 1 12 4.75v9.5a.75.75 0 0 1-1.5 0V6.79l-2.929 3.446a.75.75 0 0 1-1.142 0L3.5 6.79v7.46a.75.75 0 0 1-1.5 0v-9.5a.75.75 0 0 1 .491-.704M13.22 11.72a.75.75 0 0 1 1.06 0l.72.72V4.75a.75.75 0 0 1 1.5 0v7.69l.72-.72a.75.75 0 1 1 1.06 1.06l-2 2a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 0-1.06"
		/>
	</svg>
);
export const ChevronDownIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="m19.5 8.25-7.5 7.5-7.5-7.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const EllipsisVerticalIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const FolderPlusIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const PencilSquareIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
		/>
	</svg>
);
export const TrashIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
		/>
	</svg>
);
export const MoonIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z"
		/>
	</svg>
);
export const ClipboardIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
		<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
	</svg>
);
export const CheckIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="m4.5 12.75 6 6 9-13.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const AlertCircleIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		fill="none"
		strokeWidth="1.5"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 8v4m0 4h.01" />
	</svg>
);
export const FullscreenIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
	>
		<path
			fill="none"
			stroke="currentColor"
			strokeLinecap="square"
			strokeWidth="1.5"
			d="M6.343 17.657L17.657 6.343M18.5 11V5.5H13M5.5 13v5.5H11"
		/>
	</svg>
);
