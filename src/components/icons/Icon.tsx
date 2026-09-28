import React from 'react';

export type IconName =
  | 'home'
  | 'building'
  | 'device'
  | 'settings'
  | 'users'
  | 'shield'
  | 'search'
  | 'refresh'
  | 'plus'
  | 'chevron'
  | 'more'
  | 'check'
  | 'file'
  | 'arrowRight'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'edit'
  | 'trash'
  | 'info'
  | 'lock'
  | 'minus'
  | 'external'
  | 'logout'
  | 'x'
  | 'eye'
  | 'eyeOff';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, color = 'currentColor' }) => {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M2 21h20" />
      </>
    ),
    device: (
      <>
        <rect x="3" y="9" width="18" height="10" rx="2" />
        <path d="M8 9V5m8 4V5M7 14h.01M11 14h.01M15 14h2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19 13.5v-3l-2-.7-.8-1.9.9-1.9L15 3.9l-1.9.9-1.9-.8-.7-2h-3l-.7 2-1.9.8L3 3.9.9 6l.9 1.9L1 9.8l-2 .7v3l2 .7.8 1.9-.9 1.9L3 20.1l1.9-.9 1.9.8.7 2h3l.7-2 1.9-.8 1.9.9 2.1-2.1-.9-1.9.8-1.9z"
          transform="translate(2) scale(.83)"
        />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5.2 3.4 9.2 8 11 4.6-1.8 8-5.8 8-11V5z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 6v5h-5M4 18v-5h5" />
        <path d="M18.5 9A7 7 0 0 0 6 6l-2 2m2 7a7 7 0 0 0 12 3l2-2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    external: (
      <>
        <path d="M14 5h5v5M13 11l6-6" />
        <path d="M19 13v6H5V5h6" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
};

export default Icon;
