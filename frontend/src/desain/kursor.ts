import { warna } from "./token";

// Kursor panah 64 px (dua kali ukuran biasa), tinta dengan garis putih.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
<path d="M6 4 L6 52 L19 40 L28 60 L37 56 L28 37 L46 37 Z" fill="${warna.tinta}" stroke="${warna.putih}" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

export const kursorBesar = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 6 4, default`;
