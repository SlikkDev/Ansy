import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

const base = (props: Props) => ({
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
  ...props,
})

/** Points "back" in the reading direction: the SVG is mirrored under [dir=rtl] by CSS. */
export const ArrowBack = (p: Props) => (
  <svg {...base(p)} className="rtl-flip">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
export const ArrowForward = (p: Props) => (
  <svg {...base(p)} className="rtl-flip">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const Reload = (p: Props) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
)
export const Stop = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const Info = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)
export const Moon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)
export const Sun = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
export const External = (p: Props) => (
  <svg {...base(p)} width={16} height={16}>
    <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)

/** The Ansy mark: an eye with the Slikk.Dev pink pupil. Same drawing as the project site. */
export const AnsyMark = (p: Props) => (
  <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden focusable="false" {...p}>
    <rect width="32" height="32" rx="8" fill="currentColor" opacity=".08" />
    <path
      d="M4.5 16C8 9.8 12 7.5 16 7.5S24 9.8 27.5 16C24 22.2 20 24.5 16 24.5S8 22.2 4.5 16Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="4.6" fill="#FF2D6B" />
  </svg>
)
