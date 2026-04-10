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

export async function listMarkdownFiles(root: string): Promise<MdFileEntry[]> {
  return await invoke<MdFileEntry[]>("list_markdown_files", { root });
}

export async function readMarkdownFile(path: string): Promise<string> {
  return await invoke<string>("read_markdown_file", { path });
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
