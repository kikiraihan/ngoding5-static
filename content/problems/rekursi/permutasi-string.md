## Ide

Backtracking: bangun permutasi karakter demi karakter. Di setiap langkah, coba setiap karakter yang belum dipakai, lalu mundur (*backtrack*) untuk mencoba pilihan lain.

## Langkah

1. Basis: string kosong → [""].
2. Untuk setiap indeks i: ambil `s[i]`, permutasikan sisanya, tempel `s[i]` di depan.
3. Hilangkan duplikat (Set), urutkan.

Versi tanpa duplikat sejak awal: urutkan karakter, lewati `chars[i]` jika sama dengan `chars[i-1]` yang belum dipakai.

## Kompleksitas

- Waktu: O(n · n!).
- Ruang: O(n · n!) untuk hasil.

## Variasi latihan

- Kembalikan hanya permutasi ke-k tanpa membuat semuanya.
