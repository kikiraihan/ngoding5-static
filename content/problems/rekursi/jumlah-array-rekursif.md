## Ide

Pecah masalah: jumlah seluruh array = elemen pertama + jumlah sisanya. "Sisanya" adalah masalah yang sama tapi lebih kecil.

## Langkah

1. Jika kosong → 0.
2. `arr[0] + jumlah(arr[1:])`.

## Kompleksitas

- Waktu: O(n²) karena slice menyalin; dengan parameter indeks menjadi O(n).
- Ruang: O(n) tumpukan panggilan.

## Variasi latihan

- Versi dengan parameter indeks tanpa slice.
