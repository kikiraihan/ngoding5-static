## Ide

Ini langkah "merge" dari merge sort. Karena keduanya terurut, elemen terkecil yang belum diambil pasti ada di depan salah satu array.

## Langkah

1. `i = j = 0`.
2. Selama keduanya belum habis, ambil yang lebih kecil.
3. Tempel sisa `a[i:]` dan `b[j:]`.

## Kompleksitas

- Waktu: O(n + m).
- Ruang: O(n + m).

## Variasi latihan

- Gabungkan tanpa duplikat.
- Gunakan untuk menulis merge sort lengkap.
