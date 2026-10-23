import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Kerangka } from "../../shared/frame/Frame";
import { Klik } from "../../shared/input/Click";
import { usePemindah } from "../../shared/input/mover";
import { usePanggung } from "../../shared/stage/Stage";
import { usePemandu } from "../../shared/guide/Guide";
import { Peragaan, type Titik } from "../../shared/demo/Demo";
import { AlasKeping, GambarBlok, GambarSlot, LEBAR_BLOK, TINGGI_BLOK, bentukKeping } from "../../shared/program/Block";
import type { Blok, Program, Sel } from "../../shared/program/kinds";
import { bicara, bunyi } from "../../shared/sound/audio";
import { IkonJalan } from "../../images/icons";
import { durasi, paletStudio, ukuran, warna, warnaAlas } from "../../design/token";
import { daftarKarya, muatKarya, simpanKarya, type KaryaLokal } from "../../storage/storage";
import { BARIS, KOLOM, TOKOH_TERBANYAK, isiKosong, jalankanCerita, tokohBaru, type Bingkai, type IsiKarya, type JenisTokoh, type Latar, type TokohKarya } from "./logic";
import { GambarLatar, GambarTokoh, KOTAK, buatGambarKecil } from "./StudioArt";
import { Panggung3D } from "./Stage3D";
import { bisa3D, type Foto } from "../../shared/map3d/Map3D";

// Tata letak layar membuat karya (frontend.md, bagian Studio Kreasi).
const PANGGUNG = { x: 32, y: ukuran.areaKerjaAtas + 8 };
const KANAN = PANGGUNG.x + KOLOM * KOTAK + 24;
const JARAK = 12;
const Y_UTAMA = ukuran.barisTengahAtas + 16;
const Y_PEMICU = ukuran.barisBawahAtas + 8;
const X_SLOT = 128;
const X_PALET = 736;
const TOMBOL_JALAN = 96;
const JENIS_TOKOH: JenisTokoh[] = ["kucing", "ikan", "bola", "burung"];
const WARNA_AWAL: Record<JenisTokoh, number> = { kucing: 0, ikan: 2, bola: 1, burung: 4 };
const SEMUA_LATAR: Latar[] = ["taman", "pantai", "malam"];
const PALET_BLOK: Blok[] = [{ jenis: "maju" }, { jenis: "putar-kiri" }, { jenis: "putar-kanan" }, { jenis: "lompat" }, { jenis: "ulangi", kali: 3 }];

type Baris = "utama" | "pemicu";
type Dipegang =
  | { macam: "blok"; blok: Blok; dari: { baris: Baris; indeks: number } | null }
  | { macam: "pemicu" }
  | { macam: "tokohBaru"; jenis: JenisTokoh }
  | { macam: "tokoh"; id: string };

const xSlot = (i: number) => X_SLOT + i * (LEBAR_BLOK + JARAK);
const xPalet = (i: number) => X_PALET + (i % 3) * (LEBAR_BLOK + JARAK);
const yPalet = (i: number) => (i < 3 ? Y_UTAMA : Y_PEMICU);
const xJalan = ukuran.lebarPanggung - 24 - TOMBOL_JALAN;
const pusatKotak = ([k, b]: Sel) => ({ x: PANGGUNG.x + k * KOTAK + KOTAK / 2, y: PANGGUNG.y + b * KOTAK + KOTAK / 2 });

/** Blok pemicu kuning: dua tokoh bersentuhan. Setelah sasaran dipilih, gambar tokoh sasaran tampil di blok. */
function GambarBlokPemicu({ sasaran, menunggu = false }: { sasaran: TokohKarya | null; menunggu?: boolean }) {
  return (
    <svg width={LEBAR_BLOK} height={TINGGI_BLOK} viewBox="0 0 104 88" data-blok="pemicu" className={menunggu ? "berdenyut" : undefined} style={{ overflow: "visible" }}>
      <AlasKeping warnaAlas={warna.blokPemicuAlas} />
      <path d={bentukKeping} fill={warna.blokPemicu} filter="url(#lembut)" />
      {sasaran ? (
        <foreignObject x="20" y="14" width="64" height="60">
          <GambarTokoh jenis={sasaran.jenis} warnaBadan={paletStudio[sasaran.warna]} lebar={58} />
        </foreignObject>
      ) : (
        <g stroke={warna.tinta} strokeWidth={4} fill="none">
          <circle cx="42" cy="44" r="14" />
          <circle cx="64" cy="44" r="14" strokeDasharray="5 4" />
        </g>
      )}
    </svg>
  );
}

/** Layar membuat karya. Setiap perubahan disimpan otomatis. */
function LayarKarya({ id, isiAwal, karyaPertama, onKembali }: { id: string; isiAwal: IsiKarya; karyaPertama: boolean; onKembali: () => void }) {
  const reaksi = usePemandu();
  const { keUnit } = usePanggung();
  const [isi, setIsi] = useState<IsiKarya>(isiAwal);
  const [terpilih, setTerpilih] = useState<string | null>(isiAwal.tokoh[0]?.id ?? null);
  const [pilihSasaran, setPilihSasaran] = useState(false);
  const [bingkai, setBingkai] = useState<Bingkai | null>(null);
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const sudahDipuji = useRef(false);
  const sudahDijelaskanPemicu = useRef(false);
  const jeda = useRef<number[]>([]);
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));
  const berhenti = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const peragakan = () => setPemicuPeragaan((n) => n + 1);
  const berjalan = bingkai !== null;
  const tokoh = isi.tokoh.find((t) => t.id === terpilih) ?? null;
  const tiga = bisa3D();
  const fotoPanggung = useRef<Foto | null>(null);

  // Karya pertama: Si Kancil menyapa dan menjelaskan caranya, lalu tangan memperagakan.
  useEffect(() => {
    if (karyaPertama) {
      // Kedua kalimat langsung masuk antrean, supaya selalu terdengar sebelum kalimat lain dari tindakan anak.
      nanti(400, () => {
        reaksi("lambai");
        bicara("umum.sapa");
        bicara("studio.tugas");
        peragakan();
      });
    }
    return berhenti;
  }, []);

  // Simpan otomatis setiap ada perubahan. Karya baru yang masih kosong belum disimpan.
  const pertama = useRef(true);
  useEffect(() => {
    if (pertama.current) {
      pertama.current = false;
      return;
    }
    // Gambar kecil difoto dari panggung 3D. Tanpa 3D, digambar ulang sebagai SVG.
    const foto = () => fotoPanggung.current?.({ x: PANGGUNG.x, y: PANGGUNG.y, lebar: KOLOM * KOTAK, tinggi: BARIS * KOTAK }, (KOLOM * KOTAK) / 2) ?? buatGambarKecil(isi);
    const j = window.setTimeout(() => simpanKarya(id, isi as unknown as Record<string, unknown>, foto()), 400);
    return () => window.clearTimeout(j);
  }, [isi]);

  const ubahTokoh = (tid: string, f: (t: TokohKarya) => TokohKarya) => setIsi((s) => ({ ...s, tokoh: s.tokoh.map((t) => (t.id === tid ? f(t) : t)) }));
  const terisi = (sel: Sel, kecuali?: string) => isi.tokoh.some((t) => t.id !== kecuali && t.sel[0] === sel[0] && t.sel[1] === sel[1]);

  const pemindah = usePemindah<Dipegang>((benda, tujuan, titik) => {
    if (tujuan === "panggung") taruhDiPanggung(benda, kotakDari(titik.x, titik.y));
    else if (tujuan === "rak-tokoh" && benda.macam === "tokoh") hapusTokoh(benda.id);
    // "slot-pemicu" (tempat blok pemicu) diperiksa sebelum "slot-<baris>-<i>" (slot program).
    else if (tujuan === "slot-pemicu") pasangPemicu(benda);
    else if (tujuan?.startsWith("slot-")) {
      const [, baris, i] = tujuan.split("-");
      taruhBlok(benda, baris as Baris, Number(i));
    } else if (benda.macam === "blok" && benda.dari) cabut(benda.dari.baris, benda.dari.indeks);
  });
  const dipegang = pemindah.dipegang;

  const kotakDari = (x: number, y: number): Sel => [
    Math.min(KOLOM - 1, Math.max(0, Math.floor((x - PANGGUNG.x) / KOTAK))),
    Math.min(BARIS - 1, Math.max(0, Math.floor((y - PANGGUNG.y) / KOTAK))),
  ];

  const taruhDiPanggung = (benda: Dipegang, sel: Sel) => {
    pemindah.lepaskan();
    if (benda.macam === "tokohBaru") {
      if (isi.tokoh.length >= TOKOH_TERBANYAK || terisi(sel)) {
        bunyi("cobaLagi");
        reaksi("garuk");
        return;
      }
      const baru = tokohBaru(crypto.randomUUID(), benda.jenis, sel, WARNA_AWAL[benda.jenis]);
      setIsi((s) => ({ ...s, tokoh: [...s.tokoh, baru] }));
      setTerpilih(baru.id);
      bunyi("klik");
    } else if (benda.macam === "tokoh" && !terisi(sel, benda.id)) {
      ubahTokoh(benda.id, (t) => ({ ...t, sel }));
      bunyi("klik");
    }
  };

  const hapusTokoh = (tid: string) => {
    pemindah.lepaskan();
    setIsi((s) => ({
      ...s,
      tokoh: s.tokoh.filter((t) => t.id !== tid).map((t) => (t.pemicu.sasaran === tid ? { ...t, pemicu: { ...t.pemicu, sasaran: null } } : t)),
    }));
    if (terpilih === tid) setTerpilih(null);
    bunyi("klik");
  };

  const aturProgram = (baris: Baris, f: (p: Program) => Program) => {
    if (!tokoh) return;
    ubahTokoh(tokoh.id, (t) => (baris === "utama" ? { ...t, program: f(t.program) } : { ...t, pemicu: { ...t.pemicu, program: f(t.pemicu.program) } }));
  };

  const taruhBlok = (benda: Dipegang, baris: Baris, i: number) => {
    pemindah.lepaskan();
    if (benda.macam !== "blok") return;
    if (benda.dari) {
      const dari = benda.dari;
      if (dari.baris === baris) aturProgram(baris, (p) => p.map((b, k) => (k === i ? benda.blok : k === dari.indeks ? p[i] : b)));
      else {
        aturProgram(dari.baris, (p) => p.map((b, k) => (k === dari.indeks ? null : b)));
        aturProgram(baris, (p) => p.map((b, k) => (k === i ? benda.blok : b)));
      }
    } else aturProgram(baris, (p) => p.map((b, k) => (k === i ? benda.blok : b)));
    bunyi("klik");
  };

  const cabut = (baris: Baris, i: number) => {
    aturProgram(baris, (p) => p.map((b, k) => (k === i ? null : b)));
    bunyi("klik");
  };

  const pasangPemicu = (benda: Dipegang) => {
    pemindah.lepaskan();
    if (benda.macam !== "pemicu" || !tokoh) return;
    ubahTokoh(tokoh.id, (t) => ({ ...t, pemicu: { ...t.pemicu, ada: true, sasaran: null } }));
    setPilihSasaran(true);
    bunyi("klik");
    // Blok pemicu dijelaskan sekali saat pertama kali dipasang, lalu Si Kancil meminta anak memilih sasarannya.
    if (!sudahDijelaskanPemicu.current) {
      sudahDijelaskanPemicu.current = true;
      bicara("studio.pemicu");
    }
    bicara("studio.sasaran");
    reaksi("tunjuk");
  };

  const klikSlot = (baris: Baris, i: number) => {
    if (berjalan) return;
    if (!tokoh) {
      reaksi("tunjuk");
      peragakan();
      return;
    }
    const p = baris === "utama" ? tokoh.program : tokoh.pemicu.program;
    if (dipegang?.macam === "blok") taruhBlok(dipegang, baris, i);
    else if (p[i]) cabut(baris, i);
    else {
      reaksi("tunjuk");
      peragakan();
    }
  };

  const klikSlotPemicu = () => {
    if (berjalan || !tokoh) return;
    if (dipegang?.macam === "pemicu") pasangPemicu(dipegang);
    else if (tokoh.pemicu.ada) {
      ubahTokoh(tokoh.id, (t) => ({ ...t, pemicu: { ...t.pemicu, ada: false, sasaran: null } }));
      setPilihSasaran(false);
      bunyi("klik");
    } else {
      reaksi("tunjuk");
      peragakan();
    }
  };

  const klikTokoh = (t: TokohKarya) => {
    if (berjalan) return;
    if (pilihSasaran && tokoh && t.id !== tokoh.id) {
      ubahTokoh(tokoh.id, (x) => ({ ...x, pemicu: { ...x.pemicu, sasaran: t.id } }));
      setPilihSasaran(false);
      bunyi("klik");
      return;
    }
    setTerpilih(t.id);
    pemindah.pegang(dipegang?.macam === "tokoh" && dipegang.id === t.id ? null : { macam: "tokoh", id: t.id });
  };

  const klikPanggung = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (berjalan || !dipegang || (dipegang.macam !== "tokohBaru" && dipegang.macam !== "tokoh")) return;
    const t = keUnit(e.clientX, e.clientY);
    taruhDiPanggung(dipegang, kotakDari(t.x, t.y));
  };

  const klikRakTokoh = (jenis: JenisTokoh) => {
    if (berjalan) return;
    if (dipegang?.macam === "tokoh") return hapusTokoh(dipegang.id);
    const sama = dipegang?.macam === "tokohBaru" && dipegang.jenis === jenis;
    pemindah.pegang(sama ? null : { macam: "tokohBaru", jenis });
  };

  const pegangPalet = (benda: Dipegang) => {
    if (berjalan) return;
    const sama = JSON.stringify(dipegang) === JSON.stringify(benda);
    pemindah.pegang(sama ? null : benda);
  };

  // Jalan: semua tokoh bergerak bersamaan. Klik lagi saat berjalan untuk berhenti; tokoh kembali ke tempat awal.
  const jalan = () => {
    pemindah.lepaskan();
    berhenti();
    if (berjalan) {
      setBingkai(null);
      return;
    }
    const semua = jalankanCerita(isi.tokoh);
    if (semua.length <= 1) {
      reaksi("tunjuk");
      peragakan();
      return;
    }
    bunyi("klik");
    semua.forEach((b, n) => nanti(n * (durasi.langkahTokoh + 150), () => setBingkai(b)));
    nanti(semua.length * (durasi.langkahTokoh + 150) + 1200, () => setBingkai(null));
    if (!sudahDipuji.current) {
      sudahDipuji.current = true;
      nanti(semua.length * (durasi.langkahTokoh + 150), () => {
        reaksi("tepuk");
        bicara("studio.seru");
      });
    }
  };

  const titikPeragaan: Titik[] = useMemo(() => {
    if (isi.tokoh.length === 0) return [{ x: KANAN + KOTAK / 2, y: PANGGUNG.y + 8 + KOTAK / 2 }, pusatKotak([2, 1])];
    if (!tokoh) return [pusatKotak(isi.tokoh[0].sel)];
    if (tokoh.program.every((b) => b === null)) return [{ x: xPalet(0) + LEBAR_BLOK / 2, y: Y_UTAMA + TINGGI_BLOK / 2 }, { x: xSlot(0) + LEBAR_BLOK / 2, y: Y_UTAMA + TINGGI_BLOK / 2 }];
    return [{ x: xJalan + TOMBOL_JALAN / 2, y: Y_PEMICU + 8 + TOMBOL_JALAN / 2 }];
  }, [isi, tokoh]);

  const sasaran = tokoh?.pemicu.sasaran ? (isi.tokoh.find((t) => t.id === tokoh.pemicu.sasaran) ?? null) : null;
  const aktif = (baris: Baris) => (tokoh && bingkai?.[tokoh.id]?.aktif?.baris === baris ? bingkai[tokoh.id].aktif!.indeks : []);

  return (
    <Kerangka onKembali={onKembali} jumlahLevel={0} levelSekarang={0} levelTertinggiSelesai={-1} onPilihLevel={() => {}} onKlikKosong={() => pemindah.lepaskan()}>
      {/* Latar di baris atas */}
      {SEMUA_LATAR.map((l, i) => (
        <Klik key={l} x={160 + i * (KOTAK + 16)} y={12} lebar={KOTAK} tinggi={KOTAK} ujiId={`latar-${l}`} onKlik={() => !berjalan && (bunyi("klik"), setIsi((s) => ({ ...s, latar: l })))}>
          <div style={{ width: KOTAK, height: KOTAK, borderRadius: "var(--sudut)", overflow: "hidden", display: "flex", alignItems: "center", border: `${isi.latar === l ? 6 : 3}px solid ${isi.latar === l ? warna.tinta : warna.tepi}`, background: warna.panggung }} data-terpilih={isi.latar === l || undefined}>
            <GambarLatar latar={l} lebar={KOTAK * 1.6} />
          </div>
        </Klik>
      ))}

      {/* Panggung: diorama 3D, atau gambar datar kalau peramban tidak bisa menggambar 3D */}
      {tiga && <Panggung3D x={PANGGUNG.x} y={PANGGUNG.y} isi={isi} bingkai={bingkai} terpilih={terpilih} sasaran={tokoh?.pemicu.sasaran ?? null} fotoRef={fotoPanggung} />}
      <div style={{ position: "absolute", left: PANGGUNG.x, top: PANGGUNG.y, borderRadius: 8, overflow: "hidden", pointerEvents: "none" }} data-testid="latar" data-latar={isi.latar}>
        {!tiga && <GambarLatar latar={isi.latar} />}
      </div>
      <div data-testid="panggung" data-tujuan="panggung" onClick={klikPanggung} style={{ position: "absolute", left: PANGGUNG.x, top: PANGGUNG.y, width: KOLOM * KOTAK, height: BARIS * KOTAK }} />
      {isi.tokoh.map((t) => {
        const k = bingkai?.[t.id] ?? { sel: t.sel, arah: t.arah, lompat: false };
        const c = pusatKotak(k.sel);
        const putaran = { kanan: "none", kiri: "scaleX(-1)", atas: "rotate(-90deg)", bawah: "rotate(90deg)" }[k.arah];
        return (
          <Klik
            key={t.id}
            x={c.x - KOTAK / 2}
            y={c.y - KOTAK / 2}
            lebar={KOTAK}
            tinggi={KOTAK}
            tujuan="panggung"
            ujiId={`tokoh-${t.jenis}`}
            dipegang={dipegang?.macam === "tokoh" && dipegang.id === t.id}
            style={{ transition: `left ${durasi.langkahTokoh}ms ease-in-out, top ${durasi.langkahTokoh}ms ease-in-out`, zIndex: 3 }}
            onKlik={() => klikTokoh(t)}
            onPointerDown={!berjalan ? (e) => pemindah.mulaiSeret({ macam: "tokoh", id: t.id }, e) : undefined}
          >
            <div
              data-sel={k.sel.join(",")}
              data-warna={t.warna}
              data-terpilih={t.id === terpilih || undefined}
              data-sasaran={t.id === tokoh?.pemicu.sasaran || undefined}
              style={{
                width: KOTAK,
                height: KOTAK,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // Di panggung 3D, penanda dan lompatan digambar di peta. Di sini hanya untuk gambar datar.
                outline: tiga ? "none" : t.id === terpilih ? `5px solid ${warna.tinta}` : t.id === tokoh?.pemicu.sasaran ? `5px dashed ${warna.blokPemicuAlas}` : "none",
                transform: k.lompat && !tiga ? "translateY(-28px)" : "none",
                transition: "transform 200ms",
              }}
            >
              {!tiga && (
                <div style={{ transform: putaran }}>
                  <GambarTokoh jenis={t.jenis} warnaBadan={paletStudio[t.warna]} lebar={76} />
                </div>
              )}
            </div>
          </Klik>
        );
      })}

      {/* Rak tokoh dan warna di kanan panggung */}
      <div data-tujuan="rak-tokoh" style={{ position: "absolute", left: KANAN - 8, top: PANGGUNG.y, width: 4 * (KOTAK + JARAK) + 8, height: KOTAK + 16 }} />
      {JENIS_TOKOH.map((j, i) => (
        <Klik key={j} x={KANAN + i * (KOTAK + JARAK)} y={PANGGUNG.y + 8} lebar={KOTAK} tinggi={KOTAK} tujuan="rak-tokoh" ujiId={`rak-${j}`} dipegang={dipegang?.macam === "tokohBaru" && dipegang.jenis === j} onKlik={() => klikRakTokoh(j)} onPointerDown={!berjalan ? (e) => pemindah.mulaiSeret({ macam: "tokohBaru", jenis: j }, e) : undefined}>
          <GambarTokoh jenis={j} warnaBadan={paletStudio[WARNA_AWAL[j]]} lebar={KOTAK} />
        </Klik>
      ))}
      {paletStudio.map((w, i) => (
        <Klik key={w} x={KANAN + (i % 3) * (KOTAK + JARAK)} y={PANGGUNG.y + KOTAK + 32 + Math.floor(i / 3) * (KOTAK + JARAK)} lebar={KOTAK} tinggi={KOTAK} ujiId={`warna-${i + 1}`} onKlik={() => tokoh && !berjalan && (bunyi("klik"), ubahTokoh(tokoh.id, (t) => ({ ...t, warna: i })))}>
          <div style={{ width: KOTAK, height: KOTAK, borderRadius: "50%", background: w, border: `${tokoh?.warna === i ? 7 : 3}px solid ${tokoh?.warna === i ? warna.tinta : warna.tepi}`, boxShadow: `0 5px 0 ${warnaAlas(w)}`, opacity: tokoh ? 1 : 0.4 }} />
        </Klik>
      ))}

      {/* Tokoh terpilih, lalu program utama dan program pemicunya */}
      <div style={{ position: "absolute", left: 24, top: Y_UTAMA, width: KOTAK, height: KOTAK, opacity: tokoh ? 1 : 0.3 }} data-testid="tokoh-terpilih">
        {tokoh && <GambarTokoh jenis={tokoh.jenis} warnaBadan={paletStudio[tokoh.warna]} lebar={KOTAK} />}
      </div>
      {(["utama", "pemicu"] as const).map((baris) => {
        const program = tokoh ? (baris === "utama" ? tokoh.program : tokoh.pemicu.program) : Array(baris === "utama" ? 5 : 4).fill(null);
        const geser = baris === "utama" ? 0 : 1;
        return program.map((blok: Blok | null, i: number) => (
          <Klik
            key={`${baris}-${i}`}
            x={xSlot(i + geser)}
            y={baris === "utama" ? Y_UTAMA : Y_PEMICU}
            lebar={LEBAR_BLOK}
            tinggi={TINGGI_BLOK}
            tujuan={`slot-${baris}-${i}`}
            ujiId={`slot-${baris}-${i + 1}`}
            style={{ opacity: tokoh && (baris === "utama" || tokoh.pemicu.ada) ? 1 : 0.35 }}
            onKlik={() => klikSlot(baris, i)}
            onPointerDown={blok && !berjalan ? (e) => pemindah.mulaiSeret({ macam: "blok", blok, dari: { baris, indeks: i } }, e) : undefined}
          >
            {blok ? <GambarBlok blok={blok} menyala={aktif(baris).includes(i)} /> : <GambarSlot />}
          </Klik>
        ));
      })}
      <Klik x={xSlot(0)} y={Y_PEMICU} lebar={LEBAR_BLOK} tinggi={TINGGI_BLOK} tujuan="slot-pemicu" ujiId="slot-pemicu" style={{ opacity: tokoh ? 1 : 0.35 }} onKlik={klikSlotPemicu}>
        {tokoh?.pemicu.ada ? <GambarBlokPemicu sasaran={sasaran} menunggu={pilihSasaran} /> : <GambarSlot />}
      </Klik>

      {/* Blok pilihan, termasuk blok pemicu, dan tombol jalan */}
      {PALET_BLOK.map((blok, i) => (
        <Klik key={blok.jenis} x={xPalet(i)} y={yPalet(i)} lebar={LEBAR_BLOK} tinggi={TINGGI_BLOK} ujiId={`palet-${blok.jenis}`} dipegang={dipegang?.macam === "blok" && !dipegang.dari && dipegang.blok.jenis === blok.jenis} onKlik={() => pegangPalet({ macam: "blok", blok, dari: null })} onPointerDown={!berjalan ? (e) => pemindah.mulaiSeret({ macam: "blok", blok, dari: null }, e) : undefined}>
          <GambarBlok blok={blok} />
        </Klik>
      ))}
      <Klik x={xPalet(5)} y={yPalet(5)} lebar={LEBAR_BLOK} tinggi={TINGGI_BLOK} ujiId="palet-pemicu" dipegang={dipegang?.macam === "pemicu"} onKlik={() => pegangPalet({ macam: "pemicu" })} onPointerDown={!berjalan ? (e) => pemindah.mulaiSeret({ macam: "pemicu" }, e) : undefined}>
        <GambarBlokPemicu sasaran={null} />
      </Klik>
      <Klik x={xJalan} y={Y_PEMICU + 8} lebar={TOMBOL_JALAN} tinggi={TOMBOL_JALAN} ujiId="jalan" onKlik={jalan}>
        <div data-berjalan={berjalan || undefined}>
          <IkonJalan besar={TOMBOL_JALAN} />
        </div>
      </Klik>

      {pemindah.hantu && (
        <div className="dipegang" style={{ position: "absolute", left: pemindah.hantu.x - 44, top: pemindah.hantu.y - 44, pointerEvents: "none", zIndex: 30 }}>
          {pemindah.hantu.benda.macam === "blok" && <GambarBlok blok={pemindah.hantu.benda.blok} />}
          {pemindah.hantu.benda.macam === "pemicu" && <GambarBlokPemicu sasaran={null} />}
          {pemindah.hantu.benda.macam === "tokohBaru" && <GambarTokoh jenis={pemindah.hantu.benda.jenis} warnaBadan={paletStudio[WARNA_AWAL[pemindah.hantu.benda.jenis]]} lebar={KOTAK} />}
          {pemindah.hantu.benda.macam === "tokoh" &&
            (() => {
              const id = pemindah.hantu.benda.id;
              const t = isi.tokoh.find((x) => x.id === id);
              return t ? <GambarTokoh jenis={t.jenis} warnaBadan={paletStudio[t.warna]} lebar={KOTAK} /> : null;
            })()}
        </div>
      )}

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} />
    </Kerangka>
  );
}

const LEBAR_KARTU = 260;
// Sama dengan perbandingan panggung 9 × 4, supaya gambar kecil tidak terpotong.
const TINGGI_KARTU = Math.round((LEBAR_KARTU * BARIS) / KOLOM);
const KARTU_TERBANYAK = 7;

/** Galeri karya: satu gambar kosong bertanda tambah untuk karya baru, lalu karya yang terakhir diubah. */
function Galeri({ karya, onBuka, onBaru, onKembali }: { karya: KaryaLokal[]; onBuka: (k: KaryaLokal) => void; onBaru: () => void; onKembali: () => void }) {
  const kartu = [null, ...karya.slice(0, KARTU_TERBANYAK)];
  const lebar = 4 * LEBAR_KARTU + 3 * 24;
  const pos = (i: number) => ({ x: (ukuran.lebarPanggung - lebar) / 2 + (i % 4) * (LEBAR_KARTU + 24), y: ukuran.areaKerjaAtas + 40 + Math.floor(i / 4) * (TINGGI_KARTU + 48) });
  return (
    <Kerangka onKembali={onKembali} jumlahLevel={0} levelSekarang={0} levelTertinggiSelesai={-1} onPilihLevel={() => {}}>
      {kartu.map((k, i) => {
        const p = pos(i);
        const gaya = { width: LEBAR_KARTU, height: TINGGI_KARTU, borderRadius: 22, border: `var(--garis) solid ${warna.tepi}`, boxShadow: `0 6px 0 ${warna.tepi}`, background: warna.panggung, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" } as const;
        return k === null ? (
          <Klik key="baru" x={p.x} y={p.y} lebar={LEBAR_KARTU} tinggi={TINGGI_KARTU} ujiId="karya-baru" onKlik={() => (bunyi("klik"), onBaru())}>
            <div style={{ ...gaya, borderStyle: "dashed" }}>
              <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                <path d="M36 10 V62 M10 36 H62" stroke={warna.tinta} strokeWidth={10} strokeLinecap="round" />
              </svg>
            </div>
          </Klik>
        ) : (
          <Klik key={k.id} x={p.x} y={p.y} lebar={LEBAR_KARTU} tinggi={TINGGI_KARTU} ujiId={`karya-${i}`} onKlik={() => (bunyi("klik"), onBuka(k))}>
            <div style={gaya}>{k.gambarKecil && <img src={k.gambarKecil} alt="" width={LEBAR_KARTU} height={TINGGI_KARTU} style={{ objectFit: "cover" }} />}</div>
          </Klik>
        );
      })}
    </Kerangka>
  );
}

/**
 * Studio Kreasi: ruang bebas tanpa level dan tanpa salah. Anak memilih tokoh, mewarnai, memilih latar,
 * dan menggerakkan tokoh dengan blok, termasuk blok pemicu "saat tokoh ini menyentuh tokoh itu".
 */
export function StudioKreasi({ onKembali }: { onKembali: () => void }) {
  const [karya, setKarya] = useState<KaryaLokal[]>(daftarKarya);
  const [dibuka, setDibuka] = useState<{ id: string; isi: IsiKarya; pertama: boolean } | null>(null);

  useEffect(() => {
    void muatKarya().then(setKarya);
  }, []);

  if (dibuka) {
    return (
      <LayarKarya
        key={dibuka.id}
        id={dibuka.id}
        isiAwal={dibuka.isi}
        karyaPertama={dibuka.pertama}
        onKembali={() => {
          setDibuka(null);
          setKarya(daftarKarya());
        }}
      />
    );
  }
  return (
    <Galeri
      karya={karya}
      onKembali={onKembali}
      onBaru={() => setDibuka({ id: crypto.randomUUID(), isi: isiKosong(), pertama: karya.length === 0 })}
      onBuka={(k) => setDibuka({ id: k.id, isi: k.isi as unknown as IsiKarya, pertama: false })}
    />
  );
}
