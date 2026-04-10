import { useMemo, useState } from "react";
import type { MdFileEntry } from "../types";

interface Props {
  files: MdFileEntry[];
  activePath: string | null;
  onSelect: (file: MdFileEntry) => void;
  filter: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: MdFileEntry;
}

function buildTree(files: MdFileEntry[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };
  for (const f of files) {
    const parts = f.rel_path.split(/[/\\]/);
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      let next = cur.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: [],
          file: isLast ? f : undefined,
        };
        cur.children.push(next);
      }
      cur = next;
    }
  }
  sortTree(root);
  return root;
}

function sortTree(node: TreeNode): void {
  node.children.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortTree);
}

function matches(node: TreeNode, filter: string): boolean {
  if (!filter) return true;
  const q = filter.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children.some((c) => matches(c, filter));
}

export function FileTree({ files, activePath, onSelect, filter }: Props) {
  const tree = useMemo(() => buildTree(files), [files]);
  return (
    <div className="file-tree">
      {tree.children.map((n) => (
        <TreeNodeView
          key={n.path}
          node={n}
          depth={0}
          activePath={activePath}
          onSelect={onSelect}
          filter={filter}
        />
      ))}
    </div>
  );
}

function TreeNodeView({
  node,
  depth,
  activePath,
  onSelect,
  filter,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (f: MdFileEntry) => void;
  filter: string;
}) {
  const [open, setOpen] = useState(depth < 1 || !!filter);
  const isActive = node.file && node.file.path === activePath;
  if (!matches(node, filter)) return null;
  if (node.isDir) {
    return (
      <div>
        <button
          className="tree-row tree-dir"
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="chev">{open ? "▾" : "▸"}</span>
          <span className="tree-name">{node.name}</span>
        </button>
        {open &&
          node.children.map((c) => (
            <TreeNodeView
              key={c.path}
              node={c}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
              filter={filter}
            />
          ))}
      </div>
    );
  }
  return (
    <button
      className={`tree-row tree-file${isActive ? " active" : ""}`}
      style={{ paddingLeft: 8 + depth * 14 + 14 }}
      onClick={() => node.file && onSelect(node.file)}
      title={node.file?.path}
    >
      <span className="tree-icon">📄</span>
      <span className="tree-name">{node.name}</span>
    </button>
  );
}
