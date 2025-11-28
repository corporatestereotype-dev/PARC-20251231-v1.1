import type { CommunityStyle } from '../types';

export const DEFAULT_STYLE: CommunityStyle = {
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#334155',
  '--border-primary': '#334155',
  '--text-primary': '#f1f5f9',
  '--text-secondary': '#94a3b8',
  '--text-accent': '#60a5fa',
  '--accent-primary': '#2563eb',
  '--accent-primary-hover': '#3b82f6',
};

export const applyTheme = (style: CommunityStyle) => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(style)) {
    root.style.setProperty(key, value);
  }
};
