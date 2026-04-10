export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function dirname(path: string): string {
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(0, idx) : "";
}

export function joinPath(base: string, rel: string): string {
  if (/^([a-zA-Z]:)?[\\/]/.test(rel)) return rel;
  const sep = base.includes("\\") ? "\\" : "/";
  return `${base}${sep}${rel}`.replace(/[/\\]+/g, sep);
}

export function isExternalUrl(href: string): boolean {
  return /^(https?|mailto|tel):/i.test(href);
}

export function isAnchor(href: string): boolean {
  return href.startsWith("#");
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
