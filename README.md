# MD Viewer

A human-friendly, cross-platform desktop viewer for browsing many Markdown files at once.
Built with **Tauri 2 + React + TypeScript** — lightweight native binaries for macOS, Linux, and Windows.

![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)
![tauri](https://img.shields.io/badge/tauri-2.x-orange)
![license](https://img.shields.io/badge/license-MIT-green)

## Why

Reading large Markdown collections (docs, notes, ADRs, design specs) in a text editor is noisy;
opening them one by one in a browser loses context. MD Viewer gives you:

- A folder-based, tree-navigated reading experience
- Full-text search across every `.md` in the folder
- Ergonomic typography with a dark/light theme
- Click-to-open external links and relative code files
- Persistent highlights / markers with notes — your reading annotations stay between sessions

## Features

| Feature                       | Details                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| 📁 Folder browsing            | Recursively lists `.md` / `.markdown` / `.mdx`. Ignores `node_modules`, `.git`, `target`, etc. |
| 🌲 File tree + filter         | Collapsible directory tree with live filtering                                                |
| 📖 Rich Markdown rendering    | GitHub-Flavored Markdown (tables, task lists, strikethrough) + syntax highlighting            |
| 🔎 In-page search             | `⌘F` / `Ctrl+F` — highlights matches inline                                                  |
| 🔍 Cross-file fuzzy search    | `⌘⇧F` / `Ctrl+Shift+F` — Fuse.js-powered search over all file contents                         |
| 🌐 One-click link handling    | External `http(s)` opens in the default browser                                               |
| 📎 Code file navigation       | Click a relative code path in Markdown to open it in the OS default editor                    |
| 🎨 Highlight / marker tool    | Select text → pick a color → add optional note; markers persist across sessions               |
| 🧭 Outline / table of contents | Auto-generated from headings, click to jump                                                   |
| 🌗 Dark / light theme         | Toggle from the header; remembers your choice                                                 |
| ⌨️  Keyboard-first            | See shortcuts below                                                                            |
| 💾 Session restore            | Re-opens your last folder and file on launch                                                  |

## Screenshots

_(Add screenshots after first launch)_

## Keyboard Shortcuts

| Shortcut                      | Action              |
| ----------------------------- | ------------------- |
| `⌘/Ctrl + O`                  | Open folder         |
| `⌘/Ctrl + F`                  | Search in page      |
| `⌘/Ctrl + Shift + F`          | Search all files    |
| `Esc`                         | Close marker popover / global search |

## Development

### Prerequisites

- [Rust (stable)](https://www.rust-lang.org/tools/install) — required by Tauri
- Node.js 20+ and npm
- Platform-specific Tauri prerequisites: see <https://v2.tauri.app/start/prerequisites/>

### Install & run

```bash
git clone https://github.com/Rintaro-Ko/md-viewer-desktop.git
cd md-viewer-desktop
npm install
npm run tauri dev
```

### Production build

```bash
npm run tauri build
```

This produces native bundles under `src-tauri/target/release/bundle/`:

- macOS: `.app` and `.dmg`
- Linux: `.deb`, `.rpm`, `.AppImage`
- Windows: `.msi`, `.exe`

## Architecture

```
┌─────────────────────────────────────────────┐
│ React (Vite) — UI, markdown rendering,      │
│ search, highlighting, outline               │
└──────────────┬──────────────────────────────┘
               │ invoke / plugin IPC
┌──────────────▼──────────────────────────────┐
│ Tauri Rust core                             │
│  • list_markdown_files  (walkdir)           │
│  • read_markdown_file                       │
│  • path_exists                              │
│  • plugins: dialog / fs / opener / store    │
└─────────────────────────────────────────────┘
```

### Key dependencies

**Frontend**
- `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-highlight` — rendering pipeline
- `highlight.js` — code syntax themes
- `fuse.js` — fuzzy cross-file search
- `@tauri-apps/plugin-{dialog,fs,opener,store}` — native bridges

**Rust**
- `walkdir` — recursive file enumeration
- `tauri-plugin-{dialog,fs,opener,store}`

### Project layout

```
md-viewer-desktop/
├── src/                    # React / TS frontend
│   ├── components/         # FileTree, MarkdownView, Outline, GlobalSearch, etc.
│   ├── api.ts              # Tauri command wrappers
│   ├── markerStore.ts      # Highlight persistence via plugin-store
│   └── App.tsx             # Main layout
├── src-tauri/
│   ├── src/lib.rs          # Rust commands
│   ├── capabilities/       # Tauri permissions
│   └── tauri.conf.json
└── README.md
```

## Roadmap

- [ ] Multi-folder workspaces
- [ ] Export annotated Markdown as PDF/HTML
- [ ] Mermaid / math rendering
- [ ] Per-file marker count badges in the tree
- [ ] Full-text index caching for faster cross-file search
- [ ] Custom editor command for "Open in editor" (configurable VS Code / IntelliJ)

## License

MIT © Rintaro-Ko
