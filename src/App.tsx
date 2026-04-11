import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "highlight.js/styles/github-dark.css";
import { FileTree } from "./components/FileTree";
import { MarkdownView } from "./components/MarkdownView";
import { Outline } from "./components/Outline";
import { GlobalSearch } from "./components/GlobalSearch";
import { MarkerPopover } from "./components/MarkerPopover";
import { MarkerList } from "./components/MarkerList";
import { RecentMenu } from "./components/RecentMenu";
import {
  describeFile,
  listMarkdownFiles,
  pickFolder,
  pickMarkdownFile,
  readMarkdownFile,
} from "./api";
import type { Marker, MarkerColor, MdFileEntry, TocItem } from "./types";
import { loadAllMarkers, addMarker, removeMarker } from "./markerStore";
import { uid } from "./utils";
import {
  clearRecent,
  loadRecent,
  pushRecent,
  removeRecent,
  type RecentFile,
} from "./recentFiles";

type Theme = "dark" | "light";
type RightTab = "outline" | "markers";

const LAST_ROOT_KEY = "mdviewer.lastRoot";
const LAST_FILE_KEY = "mdviewer.lastFile";
const THEME_KEY = "mdviewer.theme";

function App() {
  const [root, setRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<MdFileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<MdFileEntry | null>(null);
  const [content, setContent] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [treeFilter, setTreeFilter] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [theme, setTheme] = useState<Theme>("dark");
  const [rightTab, setRightTab] = useState<RightTab>("outline");
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(
    null
  );
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "dark";
    setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    loadAllMarkers().then(setMarkers).catch(console.error);
    setRecent(loadRecent());
  }, []);

  const openFile = useCallback(async (file: MdFileEntry) => {
    try {
      setError(null);
      const text = await readMarkdownFile(file.path);
      setActiveFile(file);
      setContent(text);
      setPageSearch("");
      localStorage.setItem(LAST_FILE_KEY, file.path);
      setRecent(pushRecent(file.path));
      window.scrollTo(0, 0);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const loadRoot = useCallback(
    async (path: string) => {
      try {
        setError(null);
        const list = await listMarkdownFiles(path);
        setRoot(path);
        setFiles(list);
        localStorage.setItem(LAST_ROOT_KEY, path);
        const lastFile = localStorage.getItem(LAST_FILE_KEY);
        const target = list.find((f) => f.path === lastFile) ?? list[0] ?? null;
        if (target) await openFile(target);
        else {
          setActiveFile(null);
          setContent("");
          setToc([]);
        }
      } catch (e) {
        setError(String(e));
      }
    },
    [openFile]
  );

  useEffect(() => {
    const last = localStorage.getItem(LAST_ROOT_KEY);
    if (last) loadRoot(last).catch(console.error);
  }, [loadRoot]);

  const handlePickFolder = async () => {
    const picked = await pickFolder();
    if (picked) await loadRoot(picked);
  };

  const handlePickFile = async () => {
    const picked = await pickMarkdownFile();
    if (!picked) return;
    try {
      setError(null);
      const entry = await describeFile(picked);
      setFiles((prev) => {
        if (prev.some((f) => f.path === entry.path)) return prev;
        return [...prev, entry];
      });
      await openFile(entry);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      setError(null);
      const existing = files.find((f) => f.path === path);
      if (existing) {
        await openFile(existing);
        return;
      }
      const entry = await describeFile(path);
      setFiles((prev) => [...prev, entry]);
      await openFile(entry);
    } catch (e) {
      setError(`Could not open ${path}: ${e}`);
      setRecent(removeRecent(path));
    }
  };

  const handleRemoveRecent = (path: string) => setRecent(removeRecent(path));
  const handleClearRecent = () => setRecent(clearRecent());

  const handleToc = useCallback((items: TocItem[]) => setToc(items), []);

  const handleNavigate = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTextSelected = (text: string, range: Range | null) => {
    if (!text || !range) {
      setSelection(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setSelection({
      text,
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
    });
  };

  const handleAddMarker = async (color: MarkerColor, note: string) => {
    if (!selection || !activeFile) return;
    const marker: Marker = {
      id: uid(),
      filePath: activeFile.path,
      text: selection.text,
      color,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    };
    const next = await addMarker(marker);
    setMarkers(next);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveMarker = async (id: string) => {
    const next = await removeMarker(id);
    setMarkers(next);
  };

  const handleJumpToFile = (path: string) => {
    const f = files.find((x) => x.path === path);
    if (f) openFile(f);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handlePickFile();
      } else if (mod && e.key === "o") {
        e.preventDefault();
        handlePickFolder();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setGlobalOpen(true);
      } else if (mod && e.key === "f") {
        e.preventDefault();
        document.getElementById("page-search")?.focus();
      } else if (e.key === "Escape") {
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fileMarkers = useMemo(
    () => markers.filter((m) => activeFile && m.filePath === activeFile.path),
    [markers, activeFile]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <button className="btn-primary" onClick={handlePickFolder}>
            📁 Open Folder
          </button>
          <button className="btn-secondary" onClick={handlePickFile} title="Open a single .md file">
            📄 Open File
          </button>
          <RecentMenu
            items={recent}
            onPick={handleOpenRecent}
            onRemove={handleRemoveRecent}
            onClear={handleClearRecent}
          />
          <div className="root-path" title={root ?? ""}>
            {root ?? "No folder opened"}
          </div>
        </div>
        <div className="header-center">
          <input
            id="page-search"
            className="search-input"
            placeholder="Search in page  (⌘F)"
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={() => setGlobalOpen(true)} title="⌘⇧F">
            🔎 All Files
          </button>
        </div>
        <div className="header-right">
          <button
            className="btn-ghost"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-bar">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="app-body">
        <aside className="sidebar-left">
          <input
            className="filter-input"
            placeholder="Filter files…"
            value={treeFilter}
            onChange={(e) => setTreeFilter(e.target.value)}
          />
          <div className="sidebar-scroll">
            {files.length === 0 ? (
              <div className="empty-state">
                <p>No folder opened.</p>
                <button className="btn-primary" onClick={handlePickFolder}>
                  Open a folder
                </button>
              </div>
            ) : (
              <FileTree
                files={files}
                activePath={activeFile?.path ?? null}
                onSelect={openFile}
                filter={treeFilter}
              />
            )}
          </div>
          <div className="sidebar-footer">{files.length} files</div>
        </aside>

        <main className="content-pane">
          {activeFile ? (
            <>
              <div className="content-path">{activeFile.rel_path}</div>
              <article>
                <MarkdownView
                  content={content}
                  filePath={activeFile.path}
                  searchQuery={pageSearch}
                  markers={fileMarkers}
                  onToc={handleToc}
                  onTextSelected={handleTextSelected}
                />
              </article>
            </>
          ) : (
            <div className="empty-state center">
              <h1>MD Viewer</h1>
              <p>Open a folder to browse your Markdown files.</p>
              <div className="empty-actions">
                <button className="btn-primary" onClick={handlePickFolder}>
                  📁 Open Folder
                </button>
                <button className="btn-secondary" onClick={handlePickFile}>
                  📄 Open File
                </button>
              </div>
              {recent.length > 0 && (
                <div className="recent-quick">
                  <div className="recent-quick-title">Recent files</div>
                  {recent.slice(0, 6).map((r) => (
                    <button
                      key={r.path}
                      className="recent-quick-item"
                      onClick={() => handleOpenRecent(r.path)}
                      title={r.path}
                    >
                      <span className="recent-quick-name">📄 {r.name}</span>
                      <span className="recent-quick-path">{r.path}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="shortcuts">
                <div>
                  <kbd>⌘</kbd>+<kbd>O</kbd> Open folder
                </div>
                <div>
                  <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>O</kbd> Open single file
                </div>
                <div>
                  <kbd>⌘</kbd>+<kbd>F</kbd> Search in page
                </div>
                <div>
                  <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>F</kbd> Search all files
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="sidebar-right">
          <div className="right-tabs">
            <button
              className={`tab${rightTab === "outline" ? " active" : ""}`}
              onClick={() => setRightTab("outline")}
            >
              Outline
            </button>
            <button
              className={`tab${rightTab === "markers" ? " active" : ""}`}
              onClick={() => setRightTab("markers")}
            >
              Highlights ({markers.length})
            </button>
          </div>
          <div className="sidebar-scroll">
            {rightTab === "outline" ? (
              <Outline items={toc} onNavigate={handleNavigate} />
            ) : (
              <MarkerList
                markers={markers}
                activeFile={activeFile?.path ?? null}
                onJumpToFile={handleJumpToFile}
                onRemove={handleRemoveMarker}
              />
            )}
          </div>
        </aside>
      </div>

      {globalOpen && (
        <GlobalSearch
          files={files}
          onClose={() => setGlobalOpen(false)}
          onJump={(f, q) => {
            openFile(f);
            setPageSearch(q);
          }}
        />
      )}

      <MarkerPopover
        position={selection ? { top: selection.top, left: selection.left } : null}
        onPick={handleAddMarker}
        onCancel={() => setSelection(null)}
      />
    </div>
  );
}

export default App;
