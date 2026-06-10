// Compact inline-SVG icon set (stroke style) for the LMS shell. Kept tiny and
// dependency-free; `className` drives size/color via currentColor.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ children, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    {children}
  </svg>
)

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
)

export const IconAssignments = (p) => (
  <Svg {...p}>
    <path d="M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z" />
    <path d="M9 12l1.5 1.5L13 11" />
    <path d="M9 16h6" />
  </Svg>
)

export const IconScale = (p) => (
  <Svg {...p}>
    <path d="M12 4v16" />
    <path d="M6 8h12" />
    <path d="M6 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" />
    <path d="M18 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" />
    <path d="M8 20h8" />
  </Svg>
)

export const IconRubric = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 4v16" />
    <path d="M3 14h18" />
  </Svg>
)

export const IconOutcomes = (p) => (
  <Svg {...p}>
    <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    <path d="M9.5 13.5 8 21l4-2 4 2-1.5-7.5" />
  </Svg>
)

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
)

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)
