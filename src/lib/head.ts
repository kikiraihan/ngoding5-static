// Judul & meta description per halaman (NF-08).
const SITE = 'Ngoding5';
const DEFAULT_DESC =
  'Latihan logika dan syntax pemrograman berbahasa Indonesia: tulis fungsi yang lulus kasus uji dan tebak output program JavaScript & Python.';

export function setHead(title?: string, desc?: string) {
  if (typeof document === 'undefined') return;
  document.title = title ? `${title} · ${SITE}` : `${SITE} — Latihan logika & syntax pemrograman`;
  let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!m) {
    m = document.createElement('meta');
    m.name = 'description';
    document.head.appendChild(m);
  }
  m.content = (desc || DEFAULT_DESC).slice(0, 160);
}
