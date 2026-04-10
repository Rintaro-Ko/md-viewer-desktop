import type { TocItem } from "../types";

interface Props {
  items: TocItem[];
  onNavigate: (id: string) => void;
}

export function Outline({ items, onNavigate }: Props) {
  if (items.length === 0) {
    return <div className="outline-empty">No headings</div>;
  }
  return (
    <nav className="outline">
      {items.map((it) => (
        <button
          key={it.id}
          className={`outline-item level-${it.level}`}
          style={{ paddingLeft: 8 + (it.level - 1) * 12 }}
          onClick={() => onNavigate(it.id)}
          title={it.text}
        >
          {it.text}
        </button>
      ))}
    </nav>
  );
}
