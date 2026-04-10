import type { Marker } from "../types";
import { MARKER_COLORS } from "../types";

interface Props {
  markers: Marker[];
  activeFile: string | null;
  onJumpToFile: (path: string) => void;
  onRemove: (id: string) => void;
}

export function MarkerList({ markers, activeFile, onJumpToFile, onRemove }: Props) {
  if (markers.length === 0) {
    return <div className="outline-empty">No highlights yet. Select text to add one.</div>;
  }
  const sorted = [...markers].sort((a, b) => {
    if (activeFile) {
      const aOn = a.filePath === activeFile ? 0 : 1;
      const bOn = b.filePath === activeFile ? 0 : 1;
      if (aOn !== bOn) return aOn - bOn;
    }
    return b.createdAt - a.createdAt;
  });
  return (
    <div className="marker-list">
      {sorted.map((m) => {
        const color = MARKER_COLORS.find((c) => c.key === m.color) ?? MARKER_COLORS[0];
        const isActiveFile = m.filePath === activeFile;
        return (
          <div
            key={m.id}
            className={`marker-item${isActiveFile ? " active-file" : ""}`}
            style={{ borderLeftColor: color.bg }}
          >
            <button className="marker-text" onClick={() => onJumpToFile(m.filePath)}>
              <span className="marker-swatch" style={{ backgroundColor: color.bg }} />
              <span className="marker-snippet">{m.text}</span>
            </button>
            {m.note && <div className="marker-note-text">{m.note}</div>}
            <div className="marker-meta">
              <span className="marker-file" title={m.filePath}>
                {fileName(m.filePath)}
              </span>
              <button className="marker-remove" onClick={() => onRemove(m.id)}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fileName(path: string): string {
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}
