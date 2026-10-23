import { useEffect, useRef } from "react";
import { Tangan } from "../../gambar/ilustrasi";
import { usePemandu } from "../pemandu/Pemandu";
import { bicara, dengarNarator, naratorSibuk } from "../suara/audio";
import { durasi } from "../../desain/token";

export type Titik = { x: number; y: number };

/**
 * Tangan bayangan memperagakan satu langkah: muncul di titik pertama, bergerak ke titik berikutnya,
 * lalu menghilang. Diputar ulang setiap kali `pemicu` berubah.
 * `klik` menentukan apakah tangan menekan di setiap titik.
 */
export function Peragaan({ titik, pemicu, klik = true }: { titik: Titik[]; pemicu: number; klik?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || pemicu === 0 || titik.length === 0) return;
    // Ujung jari ada di sekitar (28, 6) pada gambar tangan.
    const pos = (t: Titik, tekan = false) => `translate(${t.x - 28}px, ${t.y - 6}px) scale(${tekan ? 0.85 : 1})`;
    const bingkai: Keyframe[] = [{ opacity: 0, transform: pos(titik[0]), offset: 0 }];
    const n = titik.length;
    titik.forEach((t, i) => {
      const awal = 0.08 + (i / n) * 0.8;
      const ruas = 0.8 / n;
      bingkai.push({ opacity: 1, transform: pos(t), offset: awal });
      if (klik) bingkai.push({ opacity: 1, transform: pos(t, true), offset: awal + ruas * 0.3 });
      bingkai.push({ opacity: 1, transform: pos(t), offset: awal + ruas * 0.6 });
    });
    bingkai.push({ opacity: 0, transform: pos(titik[n - 1]), offset: 1 });
    const anim = el.animate(bingkai, { duration: 1200 * n + 600, easing: "ease-in-out", fill: "forwards" });
    // Begitu anak mulai mencoba sendiri, tangan bayangan langsung menghilang.
    const berhenti = () => anim.cancel();
    window.addEventListener("pointerdown", berhenti);
    return () => {
      anim.cancel();
      window.removeEventListener("pointerdown", berhenti);
    };
    // `titik` sengaja tidak masuk daftar: peragaan hanya diputar ulang saat `pemicu` berubah,
    // bukan setiap kali anak menaruh blok dan letak slot kosong berikutnya ikut berubah.
  }, [pemicu, klik]);

  return (
    <div ref={ref} data-testid="peragaan" data-pemicu={pemicu} style={{ position: "absolute", left: 0, top: 0, opacity: 0, pointerEvents: "none", zIndex: 20 }}>
      <Tangan lebar={64} />
    </div>
  );
}

/**
 * Memanggil `diamTerlalulama` kalau tidak ada klik selama 10 detik, selama `aktif`.
 * Hitungan dimulai ulang setiap kali narator mulai atau selesai berbicara,
 * karena anak yang sedang mendengarkan Si Kancil tidak sedang diam.
 */
export function useDiam(aktif: boolean, diamTerlaluLama: () => void) {
  const cb = useRef(diamTerlaluLama);
  cb.current = diamTerlaluLama;

  useEffect(() => {
    if (!aktif) return;
    let jeda: number | undefined;
    const atur = () => {
      window.clearTimeout(jeda);
      jeda = window.setTimeout(function berulang() {
        cb.current();
        jeda = window.setTimeout(berulang, durasi.diamSebelumPeragaan);
      }, durasi.diamSebelumPeragaan);
    };
    atur();
    window.addEventListener("pointerdown", atur);
    const berhentiMendengar = dengarNarator(atur);
    return () => {
      window.clearTimeout(jeda);
      window.removeEventListener("pointerdown", atur);
      berhentiMendengar();
    };
  }, [aktif]);
}

/**
 * Anak diam terlalu lama: tangan bayangan memperagakan lagi, dan setiap dua kali
 * Si Kancil ikut menyemangati. Semangat dilewati kalau narator masih berbicara.
 */
export function useDiamDenganSemangat(aktif: boolean, peragakan: () => void) {
  const reaksi = usePemandu();
  const ke = useRef(0);
  useDiam(aktif, () => {
    ke.current += 1;
    peragakan();
    if (ke.current % 2 === 1 && !naratorSibuk()) {
      reaksi("tepuk");
      bicara("umum.semangat");
    }
  });
}
