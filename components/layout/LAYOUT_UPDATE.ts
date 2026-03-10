// In components/layout/Layout.tsx
// REPLACE the NAV_ITEMS array with this updated version:

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',      icon: '◈' },
  { href: '/chart',       label: 'Chart Generator', icon: '✺' },
  { href: '/report',      label: 'HD Report',       icon: '✧' },  // ← ADD THIS LINE
  { href: '/journal',     label: 'Journal',         icon: '✍' },
  { href: '/journal/new', label: 'New Entry',       icon: '✦' },
  { href: '/profile',     label: 'My Chart',        icon: '◎' },
  { href: '/centers',     label: 'Centers',         icon: '◯' },
  { href: '/gates',       label: 'Gate Library',    icon: '⬡' },
  { href: '/transits',    label: 'Moon & Transits', icon: '☽' },
]
