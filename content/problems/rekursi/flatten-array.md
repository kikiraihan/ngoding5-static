## Ide

Sama seperti menjumlah array secara rekursif: tangani "kepala" (baris pertama), serahkan "ekor" (sisa baris) ke panggilan rekursif.

## Langkah

1. Kosong → [].
2. `[...grid[0], ...ratakan(grid.slice(1))]`.

## Kompleksitas

- Waktu: O(total elemen + baris²) karena slice; versi iteratif O(total).
- Ruang: O(total).

## Variasi latihan

- Ratakan array bersarang dengan kedalaman sembarang.
