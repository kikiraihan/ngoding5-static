## Ide

Pecah per spasi tunggal, ubah tiap potongan, lalu gabungkan lagi dengan spasi tunggal. Dengan begitu spasi ganda menghasilkan potongan kosong dan tetap terjaga.

## Langkah

1. `s.split(" ")`.
2. Kata tidak kosong → `kata[0].upper() + kata[1:].lower()`.
3. `join(" ")`.

## Kompleksitas

- Waktu: O(n).
- Ruang: O(n).

## Variasi latihan

- Jangan kapitalkan kata sambung seperti "dan", "di", "ke" kecuali di awal.
