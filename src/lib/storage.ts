// Semua akses localStorage lewat modul ini (FE-51, FE-54).
// Aplikasi tetap jalan bila localStorage diblokir — hanya tidak menyimpan.
export const PREFIX = 'ngoding5:v1:';

let available: boolean | null = null;
function ok(): boolean {
  if (available !== null) return available;
  try {
    const k = PREFIX + '__test';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function storageAvailable() {
  return ok();
}

export function load<T>(key: string, fallback: T): T {
  if (!ok()) return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  if (!ok()) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* kuota penuh atau diblokir: abaikan */
  }
}

export function remove(key: string): void {
  if (!ok()) return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* abaikan */
  }
}

/** Semua kunci (tanpa prefix) yang diawali `sub`. */
export function keys(sub = ''): string[] {
  if (!ok()) return [];
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX + sub)) out.push(k.slice(PREFIX.length));
    }
  } catch {
    /* abaikan */
  }
  return out;
}
