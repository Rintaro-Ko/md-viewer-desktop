import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import type { MdFileEntry } from "./types";

export async function pickFolder(): Promise<string | null> {
  const selected = await openDialog({
    directory: true,
    multiple: false,
    title: "Select a folder containing Markdown files",
  });
  if (!selected) return null;
  return typeof selected === "string" ? selected : null;
}

export async function pickMarkdownFile(): Promise<string | null> {
  const selected = await openDialog({
    directory: false,
    multiple: false,
    title: "Open a Markdown file",
    filters: [
      { name: "Markdown", extensions: ["md", "markdown", "mdx"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (!selected) return null;
  return typeof selected === "string" ? selected : null;
}

export async function listMarkdownFiles(root: string): Promise<MdFileEntry[]> {
  return await invoke<MdFileEntry[]>("list_markdown_files", { root });
}

export async function readMarkdownFile(path: string): Promise<string> {
  return await invoke<string>("read_markdown_file", { path });
}

export async function describeFile(path: string): Promise<MdFileEntry> {
  return await invoke<MdFileEntry>("describe_file", { path });
}

export async function pathExists(path: string): Promise<boolean> {
  return await invoke<boolean>("path_exists", { path });
}

export async function openExternalUrl(url: string): Promise<void> {
  await openUrl(url);
}

export async function openLocalPath(path: string): Promise<void> {
  await openPath(path);
}
