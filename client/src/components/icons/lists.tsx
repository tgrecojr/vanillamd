/**
 * Inline SVG icons (Heroicons / Lucide / Iconify shapes, as used by many-notes).
 * Each renders at 1em and inherits `currentColor`.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base: P = { width: "1em", height: "1em" };

export const ListIcon = (p: P) => (
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
		<path d="M3 12h.01" />
		<path d="M3 18h.01" />
		<path d="M3 6h.01" />
		<path d="M8 12h13" />
		<path d="M8 18h13" />
		<path d="M8 6h13" />
	</svg>
);
export const ListOrderedIcon = (p: P) => (
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
		<path d="M10 12h11" />
		<path d="M10 18h11" />
		<path d="M10 6h11" />
		<path d="M4 10h2" />
		<path d="M4 6h1v4" />
		<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
	</svg>
);
export const ListTodoIcon = (p: P) => (
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
		<rect x="3" y="5" width="6" height="6" rx="1" />
		<path d="m3 17 2 2 4-4" />
		<path d="M13 6h8" />
		<path d="M13 12h8" />
		<path d="M13 18h8" />
	</svg>
);
export const IndentIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
	>
		<path
			fill="currentColor"
			d="M2 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m.646 2.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L4.293 8L2.646 6.354a.5.5 0 0 1 0-.708M7 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m-5 3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
		/>
	</svg>
);
export const OutdentIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
	>
		<path
			fill="currentColor"
			d="M2 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m10.646 2.146a.5.5 0 0 1 .708.708L11.707 8l1.647 1.646a.5.5 0 0 1-.708.708l-2-2a.5.5 0 0 1 0-.708zM2 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
		/>
	</svg>
);
export const DocumentPlusIcon = (p: P) => (
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
			d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		></path>
	</svg>
);
export const LinkIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M16.4437 2.00021C14.9719 1.98733 13.5552 2.55719 12.4986 3.58488L12.4883 3.59504L11.6962 4.38801C11.3059 4.77876 11.3063 5.41192 11.697 5.80222C12.0878 6.19252 12.721 6.19216 13.1113 5.80141L13.8979 5.01386C14.5777 4.35511 15.4855 3.99191 16.4262 4.00014C17.3692 4.00839 18.2727 4.38923 18.9416 5.06286C19.6108 5.73671 19.9916 6.64971 19.9998 7.6056C20.008 8.55874 19.6452 9.47581 18.9912 10.1607L16.2346 12.9367C15.8688 13.3052 15.429 13.5897 14.9453 13.7714C14.4616 13.9531 13.945 14.0279 13.4304 13.9907C12.9159 13.9536 12.4149 13.8055 11.9616 13.5561C11.5083 13.3067 11.1129 12.9617 10.8027 12.5441C10.4734 12.1007 9.847 12.0083 9.40364 12.3376C8.96029 12.6669 8.86785 13.2933 9.19718 13.7367C9.67803 14.384 10.2919 14.9202 10.9975 15.3084C11.7032 15.6966 12.4838 15.9277 13.2866 15.9856C14.0893 16.0435 14.8949 15.9268 15.6486 15.6437C16.4022 15.3606 17.0861 14.9177 17.654 14.3457L20.4168 11.5635L20.429 11.551C21.4491 10.4874 22.0125 9.0642 21.9997 7.58834C21.987 6.11247 21.3992 4.69931 20.3607 3.65359C19.3221 2.60764 17.9155 2.01309 16.4437 2.00021Z"
			fill="currentColor"
		></path>
		<path
			d="M10.7134 8.01444C9.91064 7.95655 9.10506 8.0732 8.35137 8.35632C7.59775 8.63941 6.91382 9.08232 6.34597 9.65431L3.5831 12.4365L3.57097 12.449C2.5508 13.5126 1.98748 14.9358 2.00021 16.4117C2.01295 17.8875 2.60076 19.3007 3.6392 20.3464C4.67787 21.3924 6.08439 21.9869 7.55623 21.9998C9.02807 22.0127 10.4447 21.4428 11.5014 20.4151L11.5137 20.4029L12.3012 19.6099C12.6903 19.218 12.6881 18.5849 12.2962 18.1957C11.9043 17.8066 11.2712 17.8088 10.882 18.2007L10.1011 18.9871C9.42133 19.6452 8.51402 20.0081 7.57373 19.9999C6.63074 19.9916 5.72728 19.6108 5.05834 18.9371C4.38918 18.2633 4.00839 17.3503 4.00014 16.3944C3.99191 15.4412 4.35479 14.5242 5.00874 13.8393L7.76537 11.0633C8.13118 10.6948 8.57097 10.4103 9.05467 10.2286C9.53836 10.0469 10.0549 9.97215 10.5695 10.0093C11.0841 10.0464 11.585 10.1945 12.0383 10.4439C12.4917 10.6933 12.887 11.0383 13.1972 11.4559C13.5266 11.8993 14.1529 11.9917 14.5963 11.6624C15.0397 11.3331 15.1321 10.7067 14.8028 10.2633C14.3219 9.61599 13.708 9.07982 13.0024 8.69161C12.2968 8.30338 11.5161 8.07233 10.7134 8.01444Z"
			fill="currentColor"
		></path>
	</svg>
);
export const ImageIcon = (p: P) => (
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
		<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
		<circle cx="9" cy="9" r="2" />
		<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
	</svg>
);
export const HorizontalRuleIcon = (p: P) => (
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
		<path d="M5 12h14" />
	</svg>
);
export const MarkdownIcon = (p: P) => (
	<svg
		{...base}
		{...p}
		aria-hidden="true"
		viewBox="0 0 15 15"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill="currentColor"
			d="m2.5 5.5l.354-.354A.5.5 0 0 0 2 5.5zm2 2l-.354.354l.354.353l.354-.353zm2-2H7a.5.5 0 0 0-.854-.354zm4 4l-.354.354l.354.353l.354-.353zM1.5 3h12V2h-12zm12.5.5v8h1v-8zm-.5 8.5h-12v1h12zM1 11.5v-8H0v8zm.5.5a.5.5 0 0 1-.5-.5H0A1.5 1.5 0 0 0 1.5 13zm12.5-.5a.5.5 0 0 1-.5.5v1a1.5 1.5 0 0 0 1.5-1.5zM13.5 3a.5.5 0 0 1 .5.5h1A1.5 1.5 0 0 0 13.5 2zm-12-1A1.5 1.5 0 0 0 0 3.5h1a.5.5 0 0 1 .5-.5zM3 10V5.5H2V10zm-.854-4.146l2 2l.708-.708l-2-2zm2.708 2l2-2l-.708-.708l-2 2zM6 5.5V10h1V5.5zm4-.5v4.5h1V5zM8.146 7.854l2 2l.708-.708l-2-2zm2.708 2l2-2l-.708-.708l-2 2z"
		/>
	</svg>
);
