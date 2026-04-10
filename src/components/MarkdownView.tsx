import { createElement, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import type { Marker } from "../types";
import { MARKER_COLORS } from "../types";
import { slugify, escapeRegExp, dirname, joinPath, isAnchor, isExternalUrl } from "../utils";
import { openExternalUrl, openLocalPath, pathExists } from "../api";

interface Props {
  content: string;
  filePath: string;
  searchQuery: string;
  markers: Marker[];
  onToc: (items: { id: string; level: number; text: string }[]) => void;
  onTextSelected: (text: string, range: Range | null) => void;
}

export function MarkdownView({
  content,
  filePath,
  searchQuery,
  markers,
  onToc,
  onTextSelected,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDir = useMemo(() => dirname(filePath), [filePath]);

  const components = useMemo(
    () => ({
      h1: (props: any) => <Heading level={1} {...props} />,
      h2: (props: any) => <Heading level={2} {...props} />,
      h3: (props: any) => <Heading level={3} {...props} />,
      h4: (props: any) => <Heading level={4} {...props} />,
      h5: (props: any) => <Heading level={5} {...props} />,
      h6: (props: any) => <Heading level={6} {...props} />,
      a: (props: any) => <SmartLink baseDir={baseDir} {...props} />,
      table: (props: any) => (
        <div className="table-wrap">
          <table {...props} />
        </div>
      ),
    }),
    [baseDir]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const items: { id: string; level: number; text: string }[] = [];
    containerRef.current.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
      const level = parseInt(el.tagName.slice(1), 10);
      const text = el.textContent ?? "";
      const id = el.id || slugify(text);
      el.id = id;
      items.push({ id, level, text });
    });
    onToc(items);
  }, [content, onToc]);

  useEffect(() => {
    if (!containerRef.current) return;
    applySearchHighlight(containerRef.current, searchQuery);
  }, [content, searchQuery]);

  useEffect(() => {
    if (!containerRef.current) return;
    applyMarkers(
      containerRef.current,
      markers.filter((m) => m.filePath === filePath)
    );
  }, [content, markers, filePath]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      onTextSelected("", null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) {
      onTextSelected("", null);
      return;
    }
    onTextSelected(text, sel.getRangeAt(0).cloneRange());
  };

  return (
    <div ref={containerRef} className="markdown-body" onMouseUp={handleMouseUp}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function Heading({ level, children, ...rest }: any) {
  const text = extractText(children);
  const id = slugify(text);
  return createElement(`h${level}`, { id, ...rest }, children);
}

function extractText(node: any): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props && node.props.children) return extractText(node.props.children);
  return "";
}

function SmartLink({
  href,
  children,
  baseDir,
  ...rest
}: {
  href?: string;
  children: any;
  baseDir: string;
}) {
  const onClick = async (e: React.MouseEvent) => {
    if (!href) return;
    if (isAnchor(href)) return;
    e.preventDefault();
    if (isExternalUrl(href)) {
      try {
        await openExternalUrl(href);
      } catch (err) {
        console.error("Failed to open URL", href, err);
      }
      return;
    }
    let target = href;
    if (target.startsWith("file://")) target = decodeURI(target.slice(7));
    const full = joinPath(baseDir, target);
    try {
      if (await pathExists(full)) {
        await openLocalPath(full);
      } else {
        await openExternalUrl(href);
      }
    } catch (err) {
      console.error("Failed to open path", full, err);
    }
  };
  const external = href && isExternalUrl(href);
  return (
    <a
      {...rest}
      href={href}
      onClick={onClick}
      className={external ? "external" : "local"}
      title={href}
    >
      {children}
      {external && <span className="ext-icon">↗</span>}
    </a>
  );
}

function clearDecorations(container: HTMLElement, className: string) {
  container.querySelectorAll(`.${className}`).forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  });
}

function wrapMatches(
  container: HTMLElement,
  pattern: RegExp,
  buildWrapper: (matchText: string) => HTMLElement
) {
  walkTextNodes(container, (node) => {
    const text = node.nodeValue ?? "";
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length === 0) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of matches) {
      const idx = m.index ?? 0;
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const wrapper = buildWrapper(m[0]);
      frag.appendChild(wrapper);
      last = idx + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode?.replaceChild(frag, node);
  });
}

function applySearchHighlight(container: HTMLElement, query: string) {
  clearDecorations(container, "search-hit");
  if (!query.trim()) return;
  const re = new RegExp(escapeRegExp(query), "gi");
  wrapMatches(container, re, (text) => {
    const mark = document.createElement("mark");
    mark.className = "search-hit";
    mark.textContent = text;
    return mark;
  });
}

function applyMarkers(container: HTMLElement, markers: Marker[]) {
  clearDecorations(container, "user-marker");
  if (markers.length === 0) return;
  for (const m of markers) {
    const color = MARKER_COLORS.find((c) => c.key === m.color) ?? MARKER_COLORS[0];
    const re = new RegExp(escapeRegExp(m.text), "g");
    wrapMatches(container, re, (text) => {
      const mark = document.createElement("mark");
      mark.className = "user-marker";
      mark.dataset.markerId = m.id;
      mark.style.backgroundColor = color.bg;
      mark.style.color = color.fg;
      mark.textContent = text;
      return mark;
    });
  }
}

function walkTextNodes(root: Node, cb: (n: Text) => void) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "code" || tag === "pre") {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest("pre")) return NodeFilter.FILTER_REJECT;
      if (!(node.nodeValue && node.nodeValue.trim())) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    nodes.push(n as Text);
    n = walker.nextNode();
  }
  nodes.forEach(cb);
}
