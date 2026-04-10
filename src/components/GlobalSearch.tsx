import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { MdFileEntry } from "../types";
import { readMarkdownFile } from "../api";

interface Props {
  files: MdFileEntry[];
  onJump: (file: MdFileEntry, query: string) => void;
  onClose: () => void;
}

interface Hit {
  file: MdFileEntry;
  preview: string;
  score: number;
}

interface IndexItem {
  file: MdFileEntry;
  content: string;
}

export function GlobalSearch({ files, onJump, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const items: IndexItem[] = [];
      for (const f of files) {
        try {
          const content = await readMarkdownFile(f.path);
          items.push({ file: f, content });
        } catch (_e) {
          /* skip unreadable */
        }
        if (cancelled) return;
      }
      if (!cancelled) {
        setIndex(items);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "file.name", weight: 0.3 },
          { name: "content", weight: 0.7 },
        ],
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [index]
  );

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const results = fuse.search(query, { limit: 50 });
    const mapped: Hit[] = results.map((r) => ({
      file: r.item.file,
      preview: buildPreview(r.item.content, query),
      score: r.score ?? 0,
    }));
    setHits(mapped);
  }, [query, fuse]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search" onClick={(e) => e.stopPropagation()}>
        <input
          className="global-search-input"
          autoFocus
          placeholder="Search all markdown files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="global-search-status">
          {loading
            ? `Indexing ${files.length} files…`
            : query.trim()
              ? `${hits.length} result${hits.length === 1 ? "" : "s"}`
              : `${index.length} files indexed`}
        </div>
        <div className="global-search-results">
          {hits.map((h) => (
            <button
              key={h.file.path}
              className="gs-hit"
              onClick={() => {
                onJump(h.file, query);
                onClose();
              }}
            >
              <div className="gs-title">{h.file.name}</div>
              <div className="gs-path">{h.file.rel_path}</div>
              <div className="gs-preview">{h.preview}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildPreview(content: string, query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return content.slice(0, 120);
  const idx = content.toLowerCase().indexOf(q);
  if (idx < 0) {
    return content.replace(/\s+/g, " ").slice(0, 120) + "…";
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + q.length + 80);
  const slice = content.slice(start, end).replace(/\s+/g, " ");
  return (start > 0 ? "…" : "") + slice + (end < content.length ? "…" : "");
}
