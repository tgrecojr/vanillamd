/**
 * Inline SVG icons (Heroicons / Lucide / Iconify shapes, as used by many-notes).
 * Each renders at 1em and inherits `currentColor`.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base: P = { width: "1em", height: "1em" };

export const TableAddIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 28 28"
	>
		<path
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="0.5"
			d="M3 6.75A3.75 3.75 0 0 1 6.75 3h14.5A3.75 3.75 0 0 1 25 6.75v14.5A3.75 3.75 0 0 1 21.25 25H6.75A3.75 3.75 0 0 1 3 21.25zM4.5 18.5v2.75a2.25 2.25 0 0 0 2.25 2.25H9.5v-5zm5-1.5v-6h-5v6zm1.5 1.5v5h6v-5zm6-1.5v-6h-6v6zm1.5 1.5v5h2.75a2.25 2.25 0 0 0 2.25-2.25V18.5zm5-1.5v-6h-5v6zm0-10.25a2.25 2.25 0 0 0-2.25-2.25H18.5v5h5zM17 4.5h-6v5h6zm-7.5 0H6.75A2.25 2.25 0 0 0 4.5 6.75V9.5h5z"
		/>
	</svg>
);
export const TableAddColumnIcon = (p: P) => (
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
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			d="M3 3h3M3 21h3m0 0h4a2 2 0 0 0 2-2V9M6 21V9m0-6h4a2 2 0 0 1 2 2v4M6 3v6M3 9h3m0 0h6m-9 6h9m3-3h3m0 0h3m-3 0v3m0-3V9"
		/>
	</svg>
);
export const TableAddRowIcon = (p: P) => (
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
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			d="M3 3v3m18-3v3m0 0v4a2 2 0 0 1-2 2H9m12-6H9M3 6v4a2 2 0 0 0 2 2h4M3 6h6m0-3v3m0 0v6m6-9v9m-3 3v3m0 0v3m0-3h3m-3 0H9"
		/>
	</svg>
);
export const TableDeleteIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 28 28"
	>
		<path
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="0.5"
			d="M3 6.75A3.75 3.75 0 0 1 6.75 3h14.5A3.75 3.75 0 0 1 25 6.75v7.75a7.5 7.5 0 0 0-1.5-.876V11h-5v2.27a7.5 7.5 0 0 0-1.5.595V11h-6v6h2.865a7.5 7.5 0 0 0-.595 1.5H11v5h2.624c.234.535.529 1.038.875 1.5H6.75A3.75 3.75 0 0 1 3 21.25zM4.5 18.5v2.75a2.25 2.25 0 0 0 2.25 2.25H9.5v-5zm5-1.5v-6h-5v6zm14-10.25a2.25 2.25 0 0 0-2.25-2.25H18.5v5h5zM17 4.5h-6v5h6zm-7.5 0H6.75A2.25 2.25 0 0 0 4.5 6.75V9.5h5zm17.5 16a6.5 6.5 0 1 1-13 0a6.5 6.5 0 0 1 13 0m-9.146-3.354a.5.5 0 0 0-.708.708l2.647 2.646l-2.647 2.646a.5.5 0 0 0 .708.708l2.646-2.647l2.646 2.647a.5.5 0 0 0 .708-.708L21.207 20.5l2.647-2.646a.5.5 0 0 0-.708-.708L20.5 19.793z"
		/>
	</svg>
);
export const TableDeleteColumnIcon = (p: P) => (
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
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			d="M3 3h3M3 21h3m0 0h4a2 2 0 0 0 2-2V9M6 21V9m0-6h4a2 2 0 0 1 2 2v4M6 3v6M3 9h3m0 0h6m-9 6h9m3-6l3 3m0 0l3 3m-3-3l3-3m-3 3l-3 3"
		/>
	</svg>
);
export const TableDeleteRowIcon = (p: P) => (
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
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			d="M3 3v3m18-3v3m0 0v4a2 2 0 0 1-2 2H9m12-6H9M3 6v4a2 2 0 0 0 2 2h4M3 6h6m0-3v3m0 0v6m6-9v9m-6 3l3 3m0 0l3 3m-3-3l3-3m-3 3l-3 3"
		/>
	</svg>
);
export const AlignLeftIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M15 12H3" />
		<path d="M17 18H3" />
		<path d="M21 6H3" />
	</svg>
);
export const AlignCenterIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17 12H7" />
		<path d="M19 18H5" />
		<path d="M21 6H3" />
	</svg>
);
export const AlignRightIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M21 12H9" />
		<path d="M21 18H7" />
		<path d="M21 6H3" />
	</svg>
);
