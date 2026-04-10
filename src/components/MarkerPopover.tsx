import { useEffect, useState } from "react";
import { MARKER_COLORS, type MarkerColor } from "../types";

interface Props {
  position: { top: number; left: number } | null;
  onPick: (color: MarkerColor, note: string) => void;
  onCancel: () => void;
}

export function MarkerPopover({ position, onPick, onCancel }: Props) {
  const [note, setNote] = useState("");
  const [color, setColor] = useState<MarkerColor>("yellow");

  useEffect(() => {
    setNote("");
    setColor("yellow");
  }, [position]);

  if (!position) return null;
  return (
    <div
      className="marker-popover"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="marker-colors">
        {MARKER_COLORS.map((c) => (
          <button
            key={c.key}
            className={`marker-color-btn${color === c.key ? " selected" : ""}`}
            style={{ backgroundColor: c.bg }}
            aria-label={c.label}
            onClick={() => setColor(c.key)}
          />
        ))}
      </div>
      <input
        className="marker-note"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onPick(color, note);
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="marker-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={() => onPick(color, note)}>
          Highlight
        </button>
      </div>
    </div>
  );
}
