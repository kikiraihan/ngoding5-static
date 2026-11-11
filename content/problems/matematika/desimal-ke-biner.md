## Ide

Bit paling kanan adalah `n % 2`. Setelah dibagi 2 (bulat), bit berikutnya muncul sebagai sisa lagi. Bit didapat dari kanan ke kiri, jadi sisipkan di depan atau balik di akhir.

## Langkah

1. n = 0 → "0".
2. Selama `n > 0`: sisipkan `n % 2` di depan, `n = n // 2`.

## Kompleksitas

- Waktu: O(log n).
- Ruang: O(log n).

## Variasi latihan

- Umumkan ke basis 2–16 (heksadesimal pakai A–F).
