/**
 * Admin icon set — inline SVGs so we avoid a heavy icon dep.
 * All icons are 24×24 viewBox, stroke-based, currentColor.
 */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

const svgProps = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function IconDashboard({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="3"  y="3"  width="7" height="9" rx="1.5" />
      <rect x="14" y="3"  width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3"  y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconUsers({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconGift({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5c2.5 0 4.5 5 4.5 5" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5c-2.5 0-4.5 5-4.5 5" />
    </svg>
  );
}

export function IconCoffee({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <path d="M6 2v3M10 2v3M14 2v3" />
    </svg>
  );
}

export function IconTag({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.6 8.57a2 2 0 0 1 0 2.83z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconHome({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function IconInfo({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}

export function IconQr({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="3"  y="3"  width="7" height="7" rx="1" />
      <rect x="14" y="3"  width="7" height="7" rx="1" />
      <rect x="3"  y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3v1M20 20v1" />
    </svg>
  );
}

export function IconReceipt({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M4 2h16v20l-3-2-3 2-2-2-2 2-3-2-3 2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function IconPlus({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconChevronDown({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconChevronLeft({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconClose({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMenu({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconMore({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="5"  cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconEdit({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function IconEye({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a19.7 19.7 0 0 1 4.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a19.5 19.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}

export function IconSparkle({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}

export function IconTrendUp({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export function IconLogout({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function IconCheck({ size = 20, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
