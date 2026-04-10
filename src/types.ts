export interface MdFileEntry {
  path: string;
  name: string;
  rel_path: string;
  size: number;
  modified: number;
}

export interface Marker {
  id: string;
  filePath: string;
  text: string;
  color: MarkerColor;
  note?: string;
  createdAt: number;
}

export type MarkerColor = "yellow" | "green" | "blue" | "pink" | "orange";

export const MARKER_COLORS: { key: MarkerColor; label: string; bg: string; fg: string }[] = [
  { key: "yellow", label: "Yellow", bg: "#fff3a1", fg: "#5c4b00" },
  { key: "green", label: "Green", bg: "#b9f5c9", fg: "#0a4a1e" },
  { key: "blue", label: "Blue", bg: "#bfe0ff", fg: "#0a2b4a" },
  { key: "pink", label: "Pink", bg: "#ffcce0", fg: "#5a0a2a" },
  { key: "orange", label: "Orange", bg: "#ffd4a8", fg: "#5a2800" },
];

export interface TocItem {
  id: string;
  level: number;
  text: string;
}
