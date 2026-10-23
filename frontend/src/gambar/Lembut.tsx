// Gaya gambar mengikuti Kitbitz (kitbitz.art, CC0): bentuk tanpa garis tepi, bayangan dalam yang gelap
// di kiri bawah, kilau putih di kanan atas, dan bayangan elips di bawah benda. Cahaya datang dari kanan atas.

/**
 * Filter bayangan dalam. Dipasang sekali di akar aplikasi, lalu dipakai lewat filter="url(#lembut)".
 * Ukuran geser dihitung untuk gambar ber-viewBox sekitar 80 sampai 120 unit.
 * Gambar yang berdiri sendiri (misalnya gambar kecil karya) memasang definisi ini di dalam SVG-nya.
 */
export function DefinisiLembut() {
  const lapisan = (id: string, gelap: [number, number, number], terang: [number, number, number]) => (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 127 0" result="alpa" />
      <feOffset in="alpa" dx={gelap[0]} dy={gelap[1]} />
      <feGaussianBlur stdDeviation={gelap[2]} />
      <feComposite in2="alpa" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0" />
      <feBlend in2="SourceGraphic" mode="normal" result="bergelap" />
      <feOffset in="alpa" dx={terang[0]} dy={terang[1]} />
      <feGaussianBlur stdDeviation={terang[2]} />
      <feComposite in2="alpa" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.3 0" />
      <feBlend in2="bergelap" mode="normal" />
    </filter>
  );
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {lapisan("lembut", [6, -6, 5], [-4, 6, 3])}
        {lapisan("lembut-kecil", [3, -3, 2.5], [-2, 3, 1.5])}
      </defs>
    </svg>
  );
}

/** Bayangan elips di bawah benda yang berdiri di tanah. */
export function BayanganKaki({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" fillOpacity={0.12} />;
}
