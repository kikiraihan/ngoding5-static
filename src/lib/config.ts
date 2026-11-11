// Konfigurasi publik aplikasi. Bisa ditimpa lewat variabel lingkungan Vite saat build.
export const REPO_URL: string = import.meta.env.VITE_REPO_URL || 'https://github.com/kikiraihan/ngoding5-static';

export function reportIssueUrl(kind: 'soal' | 'quiz', id: string, title: string): string {
  const t = encodeURIComponent(`[Soal salah] ${kind}: ${id} — ${title}`);
  const body = encodeURIComponent(
    `ID: ${id}\nHalaman: ${typeof location !== 'undefined' ? location.href : ''}\n\nApa yang salah?\n\nKode/jawaban saya (opsional):\n`,
  );
  return `${REPO_URL}/issues/new?title=${t}&body=${body}&labels=soal-salah`;
}
