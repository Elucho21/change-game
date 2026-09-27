import React from 'react';
import {COLORS} from '../tokens';

export const CheckIcon: React.FC<{size: number; color?: string}> = ({size, color = COLORS.primary}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={`${color}26`} stroke={color} strokeWidth={1.4} />
    <path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon: React.FC<{size: number; color?: string}> = ({size, color = COLORS.destructive}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={`${color}26`} stroke={color} strokeWidth={1.4} />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </svg>
);

export const ArrowUpIcon: React.FC<{size: number; color?: string}> = ({size, color = COLORS.accent}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M6 11l6-6 6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LinkIcon: React.FC<{size: number; color?: string}> = ({size, color = COLORS.accent}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

export const GiftIcon: React.FC<{size: number; color?: string}> = ({size, color = COLORS.accent}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="9" width="17" height="11.5" rx="2" stroke={color} strokeWidth={1.8} />
    <path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4-6-1.5S12 9 12 9zm0 0c1.5-3.5 6-4 6-1.5S12 9 12 9z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);
