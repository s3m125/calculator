# Kalkulator

Aplikasi kalkulator sederhana berbasis web (HTML/CSS/JavaScript) — tanpa framework, tanpa dependency.

## Fitur

- Operasi dasar: tambah, kurang, kali, bagi
- Persen, ganti tanda (+/-), titik desimal
- Format angka dengan pemisah ribuan
- Dukungan keyboard (angka, operator, `Enter` = `=`, `Esc` = AC, `Backspace`)
- Responsif untuk mobile

## Cara pakai

Buka `index.html` langsung di browser, atau akses versi live di GitHub Pages.

## Struktur

```
calculator/
├── index.html   # markup UI
├── style.css    # styling (tema gelap ala iOS)
└── script.js    # logika kalkulator
```

## Pintasan keyboard

| Tombol | Fungsi |
|---|---|
| `0`–`9` | Input angka |
| `.` | Titik desimal |
| `+ - * /` | Operator |
| `Enter` / `=` | Hitung |
| `Esc` | Reset (AC) |
| `Backspace` | Hapus 1 digit |
| `%` | Persen |
