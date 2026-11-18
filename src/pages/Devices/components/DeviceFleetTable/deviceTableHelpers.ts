/**
 * Helper formatting utilities for device fleet table columns
 */

export const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || bytes === 0) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i <= 0) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatUptimeDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '-';
  let rem = seconds;
  const days = Math.floor(rem / 86400);
  rem -= days * 86400;
  const hours = Math.floor(rem / 3600);
  rem -= hours * 3600;
  const mins = Math.floor(rem / 60);
  rem -= mins * 60;
  const secs = rem;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(days)}d${pad(hours)}h${pad(mins)}m${pad(secs)}s`;
};

export const formatCertExpiry = (ts?: number): string => {
  if (!ts || ts === 0) return '-';
  const now = Math.floor(Date.now() / 1000);
  const diff = ts - now;
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400);
  if (days >= 365) return `${Math.floor(days / 365)}y`;
  return `${days}d`;
};

export const formatRelative = (ts?: number | string): string => {
  if (!ts) return '-';
  const num = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  if (!num || isNaN(num) || num === 0) return '-';
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - num);
  if (diff < 15) return 'Just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / (86400 * 30))} months ago`;
};

export const getRevision = (str?: string): string => {
  if (!str) return 'TIP-v4.2';
  return str.split(' / ')[1] ?? str;
};

export const getCountryFlag = (locale?: string): string => {
  if (!locale || locale.length < 2) return '🇺🇸';
  const code = locale.slice(0, 2).toUpperCase();
  const codePoints = [...code].map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🇺🇸';
  }
};

