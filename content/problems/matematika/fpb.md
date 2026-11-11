## Ide

Algoritma Euclid: setiap pembagi bersama a dan b juga membagi `a mod b`. Jadi masalah bisa diperkecil terus.

## Langkah

1. Selama `b != 0`: `(a, b) = (b, a % b)`.
2. Kembalikan `a`.

## Kompleksitas

- Waktu: O(log min(a, b)).
- Ruang: O(1).

## Variasi latihan

- KPK(a, b) = a × b / FPB(a, b).
