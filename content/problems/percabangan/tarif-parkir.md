## Ide

Soal aturan bisnis: terjemahkan tiap kalimat menjadi satu langkah. Kuncinya pembulatan **ke atas** untuk jam ("atau sebagiannya").

## Langkah

1. Jika `menit <= 15`, gratis (ini juga menangani 0 dan negatif).
2. `jam = ceil(menit / 60)`. Di Python tanpa `math`: `-(-menit // 60)`.
3. `biaya = 5000 + (jam - 1) * 3000`.
4. Kembalikan `min(biaya, 25000)`.

## Kompleksitas

- Waktu: O(1).
- Ruang: O(1).

## Variasi latihan

- Tarif berbeda untuk motor dan mobil.
- Parkir lebih dari 24 jam: batas maksimal berlaku per hari.
