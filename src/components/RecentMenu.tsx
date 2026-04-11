import { useEffect, useRef, useState } from "react";
import type { RecentFile } from "../recentFiles";

interface Props {
  items: RecentFile[];
  onPick: (path: string) => void;
  onRemove: (path: string) => void;
  onClear: () => void;
}

export function RecentMenu({ items, onPick, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="recent-menu" ref={ref}>
      <button
        className="btn-secondary"
        onClick={() => setOpen((o) => !o)}
        title="Recently opened files"
      >
        🕘 Recent
        {items.length > 0 && <span className="recent-badge">{items.length}</span>}
      </button>
      {open && (
        <div className="recent-dropdown" role="menu">
          <div className="recent-header">
            <span>Recently opened</span>
            {items.length > 0 && (
              <button className="recent-clear" onClick={onClear}>
                Clear all
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="recent-empty">No recent files yet.</div>
          ) : (
            <div className="recent-list">
              {items.map((r) => (
                <div key={r.path} className="recent-item">
                  <button
                    className="recent-pick"
                    onClick={() => {
                      onPick(r.path);
                      setOpen(false);
                    }}
                    title={r.path}
                  >
                    <span className="recent-name">📄 {r.name}</span>
                    <span className="recent-path">{r.path}</span>
                    <span className="recent-time">{formatRelative(r.openedAt)}</span>
                  </button>
                  <button
                    className="recent-remove"
                    onClick={() => onRemove(r.path)}
                    aria-label="Remove from recent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const date = new Date(ts);
  return date.toLocaleDateString();
}
