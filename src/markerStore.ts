import { LazyStore } from "@tauri-apps/plugin-store";
import type { Marker } from "./types";

const STORE_FILE = "markers.json";
const KEY = "markers";

let storePromise: Promise<LazyStore> | null = null;

function getStore(): Promise<LazyStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const s = new LazyStore(STORE_FILE, { defaults: {}, autoSave: true });
      return s;
    })();
  }
  return storePromise;
}

export async function loadAllMarkers(): Promise<Marker[]> {
  const store = await getStore();
  const raw = await store.get<Marker[]>(KEY);
  return raw ?? [];
}

export async function saveAllMarkers(markers: Marker[]): Promise<void> {
  const store = await getStore();
  await store.set(KEY, markers);
  await store.save();
}

export async function addMarker(marker: Marker): Promise<Marker[]> {
  const all = await loadAllMarkers();
  const next = [...all, marker];
  await saveAllMarkers(next);
  return next;
}

export async function removeMarker(id: string): Promise<Marker[]> {
  const all = await loadAllMarkers();
  const next = all.filter((m) => m.id !== id);
  await saveAllMarkers(next);
  return next;
}

export async function updateMarker(id: string, patch: Partial<Marker>): Promise<Marker[]> {
  const all = await loadAllMarkers();
  const next = all.map((m) => (m.id === id ? { ...m, ...patch } : m));
  await saveAllMarkers(next);
  return next;
}
