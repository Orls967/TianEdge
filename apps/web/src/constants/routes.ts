export const PRIMARY_ROUTES = [
  { to: '/', label: 'Overview', end: true },
  { to: '/anatomy', label: 'Chip Anatomy', end: false },
  { to: '/journey', label: 'Instruction Journey', end: false },
  { to: '/simulator', label: 'CPU Simulator', end: false },
  { to: '/insights', label: 'Engineering Insights', end: false },
  { to: '/library', label: 'Technical Library', end: false },
] as const;
