## Ide

Normalisasi lalu bandingkan. Dua penunjuk (kiri dan kanan) bergerak ke tengah; begitu ada pasangan berbeda, langsung bukan palindrom.

## Langkah

1. Ubah ke huruf kecil dan buang karakter non-alfanumerik.
2. `i = 0`, `j = len - 1`. Selama `i < j`, bandingkan `t[i]` dan `t[j]`.
3. Jika semua sama, kembalikan true.

## Kompleksitas

- Waktu: O(n).
- Ruang: O(n) untuk string bersih (bisa O(1) jika melompati karakter di tempat).

## Variasi latihan

- Bolehkan menghapus paling banyak satu karakter.
