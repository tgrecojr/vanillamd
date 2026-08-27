/**
 * Inline SVG icons (Heroicons / Lucide / Iconify shapes, as used by many-notes).
 * Each renders at 1em and inherits `currentColor`.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base: P = { width: "1em", height: "1em" };

export const UndoIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		>
			<path d="M4.5 8H15q0 0 0 0s5 0 5 4.706C20 18 15 18 15 18H6.286" />
			<path d="M7.5 11.5L4 8l3.5-3.5" />
		</g>
	</svg>
);
export const RedoIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		>
			<path d="M19.5 8H9q0 0 0 0s-5 0-5 4.706C4 18 9 18 9 18h8.714" />
			<path d="M16.5 11.5L20 8l-3.5-3.5" />
		</g>
	</svg>
);
export const HeadingIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M7 5V12M7 12V19M7 12H17M17 5V12M17 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading1Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M16 10L19 9L19 19M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading2Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M15 12.5V12C15 10.3431 16.3431 9 18 9H18.1716C19.7337 9 20.9996 10.2665 20.9996 11.8286C20.9996 12.5788 20.702 13.2982 20.1716 13.8286L15 19.0002L21 19M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading3Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M15 9H21L17 13H18C19.6569 13 21 14.3431 21 16C21 17.6569 19.6569 19 18 19C17.3793 19 16.7738 18.8077 16.2671 18.4492C15.7604 18.0907 15.3775 17.5838 15.1709 16.9985M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading4Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M18 9L15.5 17H20M20 17H21M20 17V14M20 17V19M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading5Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M21 9H17L15.75 14.0158C15.8285 13.9268 15.912 13.8429 16 13.7642C16.3509 13.4504 16.7731 13.2209 17.2346 13.0991C17.9263 12.9166 18.6611 12.9876 19.3053 13.2987C19.9495 13.6099 20.4608 14.1414 20.7479 14.7967C21.035 15.452 21.0788 16.188 20.8707 16.8725C20.6627 17.557 20.2165 18.1447 19.6133 18.5295C19.0101 18.9142 18.2895 19.0704 17.5811 18.9704C16.8726 18.8705 16.2232 18.521 15.75 17.9844M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const Heading6Icon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g>
			<path
				d="M15.4024 14.5249C14.574 15.9516 15.0656 17.7759 16.5005 18.5997C17.9354 19.4234 19.7701 18.9346 20.5986 17.5078C21.427 16.0811 20.9352 14.2571 19.5003 13.4334C18.0655 12.6097 16.2309 13.0982 15.4024 14.5249ZM15.4024 14.5249L18.9998 8M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			></path>
		</g>
	</svg>
);
export const PilcrowIcon = (p: P) => (
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
			d="M13 4v16m4-16v16m2-16H9.5a4.5 4.5 0 0 0 0 9H13"
		/>
	</svg>
);
export const QuoteIcon = (p: P) => (
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
			d="M9 6h8m-8 6h10M9 18h8M5 3v18"
			color="currentColor"
		/>
	</svg>
);
export const CodeIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="m16 18 6-6-6-6" />
		<path d="m8 6-6 6 6 6" />
	</svg>
);
export const TextIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill="currentColor"
			d="m19.813 17.525l-.394-.919l-6-14L13.16 2h-2.32l-.26.606l-6 14l-.393.92l1.838.787l.394-.92l1.824-4.254h7.515l1.823 4.255l.394.92zM9.791 11.14H9.1L12 4.372l2.9 6.767H9.791M19 22h1v-2H4v2z"
		/>
	</svg>
);
export const BoldIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
	</svg>
);
export const ItalicIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="19" x2="10" y1="4" y2="4" />
		<line x1="14" x2="5" y1="20" y2="20" />
		<line x1="15" x2="9" y1="4" y2="20" />
	</svg>
);
export const StrikeIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M16 4H9a3 3 0 0 0-2.83 4" />
		<path d="M14 12a4 4 0 0 1 0 8H6" />
		<line x1="4" x2="20" y1="12" y2="12" />
	</svg>
);
export const CodeInlineIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 256 256"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill="currentColor"
			d="M69.12 94.15L28.5 128l40.62 33.85a8 8 0 1 1-10.24 12.29l-48-40a8 8 0 0 1 0-12.29l48-40a8 8 0 0 1 10.24 12.3m176 27.7l-48-40a8 8 0 1 0-10.24 12.3L227.5 128l-40.62 33.85a8 8 0 1 0 10.24 12.29l48-40a8 8 0 0 0 0-12.29m-82.39-89.37a8 8 0 0 0-10.25 4.79l-64 176a8 8 0 0 0 4.79 10.26A8.1 8.1 0 0 0 96 224a8 8 0 0 0 7.52-5.27l64-176a8 8 0 0 0-4.79-10.25"
		/>
	</svg>
);
