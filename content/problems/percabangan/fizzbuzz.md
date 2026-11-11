## Ide

Setiap angka hanya punya satu keluaran, jadi kita perlu memilih **satu** cabang. Kondisi yang paling khusus (habis dibagi 3 *dan* 5) harus dicek lebih dulu, karena angka seperti 15 juga memenuhi kondisi "habis dibagi 3".

## Langkah

1. Siapkan daftar kosong.
2. Ulangi `i` dari 1 sampai `n`.
3. Jika `i % 15 == 0` tambahkan "FizzBuzz"; jika tidak, cek `i % 3`, lalu `i % 5`.
4. Selain itu tambahkan `i` sebagai string.

## Kompleksitas

- Waktu: O(n), satu kali lewat.
- Ruang: O(n) untuk daftar hasil.

## Variasi latihan

- Tambahkan aturan kelipatan 7 = "Bazz".
- Tulis tanpa operator `%`, pakai dua penghitung.
