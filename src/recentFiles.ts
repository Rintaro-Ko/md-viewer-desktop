const KEY = "mdviewer.recentFiles";
const MAX = 20;

export interface RecentFile {
  path: string;
  name: string;
  openedAt: number;
}

export function loadRecent(): RecentFile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentFile[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.path === "string");
  } catch {
    return [];
  }
}

export function pushRecent(path: string): RecentFile[] {
  const name = baseName(path);
  const now = Date.now();
  const current = loadRecent().filter((r) => r.path !== path);
  const next = [{ path, name, openedAt: now }, ...current].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function removeRecent(path: string): RecentFile[] {
  const next = loadRecent().filter((r) => r.path !== path);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearRecent(): RecentFile[] {
  localStorage.removeItem(KEY);
  return [];
}

function baseName(path: string): string {
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}
