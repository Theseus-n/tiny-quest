import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Kerangka } from "../../shared/frame/Frame";
import { Klik } from "../../shared/input/Click";
import { usePemindah } from "../../shared/input/mover";
import { usePanggung } from "../../shared/stage/Stage";
import { usePemandu } from "../../shared/guide/Guide";
import { Peragaan, useDiamDenganSemangat, type Titik as TitikLayar } from "../../shared/demo/Demo";
import { Selamat } from "../../shared/congrats/Congrats";
import { bicara, bunyi } from "../../shared/sound/audio";
import { durasi, ukuran, warna } from "../../design/token";
import { levelTangram } from "../../content";
import { simpanProgres, type Progres } from "../../storage/storage";
import { SATUAN, batasBayangan, cariTempat, jariJari, poligonTempat, putar, sudutSetara, titikPotongan, type JenisPotongan, type Titik } from "./logic";
import { GambarPotongan } from "./PieceArt";

type Letak = { di: "rak" } | { di: "papan"; x: number; y: number } | { di: "tempat"; indeks: number };
type Potongan = { id: number; jenis: JenisPotongan; sudut: number; letak: Letak };

const PEGANGAN = ukuran.klikMinimal;
const Y_RAK = ukuran.barisTengahAtas + 120;
const JARAK_RAK = 64;
const AREA = { kiri: 24, atas: ukuran.areaKerjaAtas, lebar: ukuran.lebarPanggung - 48, tinggi: ukuran.areaKerjaTinggi };

/** Pegangan putar: lingkaran dengan panah melingkar searah jarum jam. */
function GambarPegangan() {
  // Lingkaran yang terlihat lebih kecil dari area kliknya (88 unit), supaya rapi di sudut potongan.
  return (
    <svg width={PEGANGAN} height={PEGANGAN} viewBox="0 0 88 88" style={{ overflow: "visible" }} aria-hidden>
      <circle cx="44" cy="48" r="25" fill={warna.tepi} />
      <circle cx="44" cy="44" r="24" fill={warna.putih} stroke={warna.tepi} strokeWidth={3} />
      <path d="M34 48 A11 11 0 1 1 50 53" fill="none" stroke={warna.tinta} strokeWidth={4.5} strokeLinecap="round" />
      <path d="M45 50 L51 55 L53 47" fill="none" stroke={warna.tinta} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Matriks Tangram: anak mengisi bayangan bentuk dengan potongan segitiga dan persegi.
 * Klik pegangan memutar potongan 45 derajat. Potongan menempel sendiri kalau jenis, posisi, dan sudutnya cocok,
 * lalu tidak bisa digeser lagi.
 */
export function MatriksTangram({ progres, onKembali, onProgres }: { progres: Progres; onKembali: () => void; onProgres: (p: Progres) => void }) {
  const [nomorLevel, setNomorLevel] = useState(Math.min(progres.levelTerakhir, levelTangram.length - 1));
  const level = levelTangram[nomorLevel];
  const reaksi = usePemandu();
  const { keUnit } = usePanggung();

  const potonganAwal = () => level.rak.map((p, id): Potongan => ({ id, jenis: p.jenis, sudut: p.sudut, letak: { di: "rak" } }));
  const [potongan, setPotongan] = useState<Potongan[]>(potonganAwal);
  const [selesai, setSelesai] = useState(false);
  const [selamat, setSelamat] = useState(false);
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const jeda = useRef<number[]>([]);

  const bersihkanJeda = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));
  const peragakan = () => setPemicuPeragaan((n) => n + 1);

  // Level 1: Si Kancil menjelaskan tujuan dan caranya. Level yang mengenalkan cara baru diberi satu kalimat penjelasan.
  useEffect(() => {
    let aktif = true;
    bersihkanJeda();
    setPotongan(potonganAwal());
    setSelesai(false);
    setSelamat(false);
    if (nomorLevel === 0) {
      nanti(400, async () => {
        reaksi("lambai");
        await bicara("umum.sapa");
        if (!aktif) return;
        await bicara("tangram.tugas");
        if (!aktif) return;
        peragakan();
        bicara("tangram.cara");
      });
    } else if (level.penjelasan) {
      const kalimat = level.penjelasan;
      nanti(400, () => {
        reaksi("tunjuk");
        peragakan();
        bicara(kalimat);
      });
    } else {
      nanti(600, peragakan);
    }
    return () => {
      aktif = false;
      bersihkanJeda();
    };
  }, [level]);

  // Bayangan diletakkan di tengah area kerja. Titik dalam satuan diubah ke unit panggung dengan keLayar.
  const batas = useMemo(() => batasBayangan(level), [level]);
  const geserX = ukuran.lebarPanggung / 2 - ((batas.kiri + batas.kanan) / 2) * SATUAN;
  const geserY = AREA.atas + AREA.tinggi / 2 - ((batas.atas + batas.bawah) / 2) * SATUAN;
  const keLayar = (x: number, y: number) => ({ x: geserX + x * SATUAN, y: geserY + y * SATUAN });
  const keSatuan = (x: number, y: number) => ({ x: (x - geserX) / SATUAN, y: (y - geserY) / SATUAN });

  // Potongan di rak berjajar di tengah, masing-masing selebar garis tengahnya.
  const diRak = potongan.filter((p) => p.letak.di === "rak");
  const lebarRak = diRak.reduce((n, p) => n + jariJari(p.jenis) * 2 * SATUAN, 0) + (diRak.length - 1) * JARAK_RAK;
  const pusatRak = new Map<number, { x: number; y: number }>();
  diRak.reduce((x, p) => {
    const lebar = jariJari(p.jenis) * 2 * SATUAN;
    pusatRak.set(p.id, { x: x + lebar / 2, y: Y_RAK });
    return x + lebar + JARAK_RAK;
  }, (ukuran.lebarPanggung - lebarRak) / 2);

  const pusat = (p: Potongan) => {
    if (p.letak.di === "rak") return pusatRak.get(p.id)!;
    if (p.letak.di === "papan") return keLayar(p.letak.x, p.letak.y);
    const t = level.tempat[p.letak.indeks];
    return keLayar(t.x, t.y);
  };
  const terisi = new Set(potongan.flatMap((p) => (p.letak.di === "tempat" ? [p.letak.indeks] : [])));

  const selesaiLevel = () => {
    setSelesai(true);
    bunyi("benar");
    reaksi("tepuk");
    bicara("tangram.berhasil");
    const tertinggi = Math.max(progres.levelTertinggiSelesai, nomorLevel);
    const berikut = Math.min(nomorLevel + 1, levelTangram.length - 1);
    const baru = { levelTerakhir: berikut, levelTertinggiSelesai: tertinggi };
    simpanProgres("tangram", baru);
    onProgres(baru);
    if ((nomorLevel + 1) % 3 === 0) bicara("umum.tunjukkan");
    nanti(durasi.munculSelamat + 500, () => setSelamat(true));
  };

  /** Memindahkan satu potongan, lalu menempelkannya kalau sudah cocok dengan tempat di bayangan. */
  const ubah = (id: number, perubahan: Partial<Potongan>) => {
    const baru = potongan.map((p) => (p.id === id ? { ...p, ...perubahan } : p));
    const p = baru.find((x) => x.id === id)!;
    if (p.letak.di === "papan") {
      const di = p.letak;
      const sudahTerisi = new Set(baru.flatMap((x) => (x.letak.di === "tempat" ? [x.letak.indeks] : [])));
      const indeks = cariTempat(level, p.jenis, p.sudut, di.x, di.y, sudahTerisi);
      if (indeks >= 0) {
        p.letak = { di: "tempat", indeks };
        bunyi("klik");
        if (sudahTerisi.size + 1 === level.tempat.length) selesaiLevel();
      } else if (level.tempat.some((t, i) => !sudahTerisi.has(i) && t.jenis === p.jenis && Math.hypot(t.x - di.x, t.y - di.y) <= level.toleransi)) {
        // Sudah di tempat yang benar tetapi sudutnya belum pas: Si Kancil menunjuk, tangan memperagakan pegangan putar.
        reaksi("tunjuk");
        peragakan();
      }
    }
    setPotongan(baru);
  };

  const pemindah = usePemindah<number>((id, tujuan, titik) => {
    if (selesai) return;
    if (tujuan === "papan") ubah(id, { letak: { di: "papan", ...keSatuan(titik.x, titik.y) } });
    else if (tujuan === "rak") ubah(id, { letak: { di: "rak" } });
  });

  const klikPotongan = (id: number) => {
    if (selesai) return;
    pemindah.pegang(pemindah.dipegang === id ? null : id);
  };

  const klikPapan = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (selesai || pemindah.dipegang === null) return;
    const t = keUnit(e.clientX, e.clientY);
    const id = pemindah.dipegang;
    pemindah.lepaskan();
    bunyi("klik");
    ubah(id, { letak: { di: "papan", ...keSatuan(t.x, t.y) } });
  };

  const klikRak = () => {
    const id = pemindah.dipegang;
    if (selesai || id === null) return;
    pemindah.lepaskan();
    if (potongan.find((p) => p.id === id)?.letak.di === "papan") {
      bunyi("klik");
      ubah(id, { letak: { di: "rak" } });
    }
  };

  const putarPotongan = (id: number) => {
    if (selesai) return;
    bunyi("klik");
    const p = potongan.find((x) => x.id === id)!;
    ubah(id, { sudut: putar(p.sudut) });
  };

  const lanjut = () => {
    if (nomorLevel + 1 < levelTangram.length) setNomorLevel(nomorLevel + 1);
    else onKembali();
  };

  useDiamDenganSemangat(!selesai, peragakan);

  // Pegangan menempel di luar sudut potongan yang paling kanan atas, dihitung dari bentuk setelah diputar,
  // jadi ikut berpindah saat potongan diputar dan tidak pernah menutupi potongannya.
  const letakPegangan = (p: Potongan) => {
    const c = pusat(p);
    const [x, y] = titikPotongan(p.jenis, p.sudut).reduce((a, b) => (b[0] - b[1] > a[0] - a[1] ? b : a));
    const jarak = 21;
    return { x: c.x + x * SATUAN + jarak - PEGANGAN / 2, y: c.y + y * SATUAN - jarak - PEGANGAN / 2 };
  };

  // Peragaan untuk tempat kosong pertama: putar dulu kalau sudutnya belum pas, lalu taruh di tempatnya.
  const titikPeragaan: TitikLayar[] = (() => {
    const indeks = level.tempat.findIndex((_, i) => !terisi.has(i));
    if (indeks < 0) return [];
    const t = level.tempat[indeks];
    const p = potongan.find((x) => x.letak.di !== "tempat" && x.jenis === t.jenis);
    if (!p) return [];
    if (!sudutSetara(p.jenis, p.sudut, t.sudut)) {
      const g = letakPegangan(p);
      return [{ x: g.x + PEGANGAN / 2, y: g.y + PEGANGAN / 2 }];
    }
    return [pusat(p), keLayar(t.x, t.y)];
  })();

  const poligonLayar = (titik: Titik[]) => titik.map(([x, y]) => `${geserX + x * SATUAN},${geserY + y * SATUAN}`).join(" ");
  const dipegang = pemindah.dipegang;

  return (
    <Kerangka
      onKembali={onKembali}
      jumlahLevel={levelTangram.length}
      levelSekarang={nomorLevel}
      levelTertinggiSelesai={progres.levelTertinggiSelesai}
      onPilihLevel={(i) => setNomorLevel(i)}
      onKlikKosong={() => pemindah.lepaskan()}
    >
      {/* Papan: seluruh area kerja. Potongan yang dipegang diletakkan di titik yang diklik. */}
      <div data-testid="papan" data-tujuan="papan" onClick={klikPapan} style={{ position: "absolute", left: AREA.kiri, top: AREA.atas, width: AREA.lebar, height: AREA.tinggi }} />
      <div data-testid="rak" data-tujuan="rak" onClick={(e) => (e.stopPropagation(), klikRak())} style={{ position: "absolute", left: 24, top: ukuran.barisTengahAtas, width: AREA.lebar, height: ukuran.tinggiPanggung - ukuran.barisTengahAtas }} />

      <svg
        data-testid="bayangan"
        data-bentuk={level.bentuk}
        data-terisi={terisi.size}
        width={ukuran.lebarPanggung}
        height={ukuran.tinggiPanggung}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        aria-hidden
      >
        {level.tempat.map((t, i) => (
          <polygon key={i} points={poligonLayar(poligonTempat(t))} fill={warna.bayangan} stroke={warna.bayangan} strokeWidth={2} strokeLinejoin="round" />
        ))}
        {level.garisBantu &&
          level.tempat.map((t, i) => (
            <polygon key={`g${i}`} data-garis-bantu points={poligonLayar(poligonTempat(t))} fill="none" stroke={warna.tinta} strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="9 7" strokeLinejoin="round" />
          ))}
      </svg>

      {potongan.map((p, i) => {
        const c = pusat(p);
        const r = jariJari(p.jenis) * SATUAN;
        const menempel = p.letak.di === "tempat";
        const sisi = Math.max(r * 2, ukuran.klikMinimal);
        const isi = (
          <div style={{ width: sisi, height: sisi, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GambarPotongan jenis={p.jenis} sudut={p.sudut} />
          </div>
        );
        if (menempel) {
          // Potongan yang menempel bukan benda yang bisa diklik, jadi tidak bisa tergeser oleh klik lain.
          return (
            <div key={p.id} data-testid={`potongan-${i + 1}`} className={selesai ? "rayakan" : undefined} style={{ position: "absolute", left: c.x - sisi / 2, top: c.y - sisi / 2, pointerEvents: "none", zIndex: 2 }}>
              <div data-letak="tempat" data-sudut={p.sudut} data-jenis={p.jenis}>
                {isi}
              </div>
            </div>
          );
        }
        return (
          <Klik
            key={p.id}
            x={c.x - sisi / 2}
            y={c.y - sisi / 2}
            lebar={sisi}
            tinggi={sisi}
            tujuan={p.letak.di === "papan" ? "papan" : "rak"}
            ujiId={`potongan-${i + 1}`}
            dipegang={dipegang === p.id}
            style={{ zIndex: 3 }}
            onKlik={() => klikPotongan(p.id)}
            onPointerDown={!selesai ? (e) => pemindah.mulaiSeret(p.id, e) : undefined}
          >
            <div data-letak={p.letak.di} data-sudut={p.sudut} data-jenis={p.jenis}>
              {isi}
            </div>
          </Klik>
        );
      })}

      {/* Penanda titik pusat setiap tempat, tidak terlihat. Dipakai uji otomatis untuk mengklik tepat di tempatnya. */}
      {level.tempat.map((t, i) => {
        const c = keLayar(t.x, t.y);
        return <div key={`tempat-${i}`} data-testid={`tempat-${i + 1}`} style={{ position: "absolute", left: c.x - 1, top: c.y - 1, width: 2, height: 2, pointerEvents: "none" }} />;
      })}

      {/* Pegangan putar di sudut kanan atas setiap potongan yang belum menempel */}
      {!selesai &&
        potongan.map((p, i) => {
          if (p.letak.di === "tempat") return null;
          const g = letakPegangan(p);
          return (
            <Klik key={`putar-${p.id}`} x={g.x} y={g.y} lebar={PEGANGAN} tinggi={PEGANGAN} ujiId={`putar-${i + 1}`} style={{ zIndex: 4 }} onKlik={() => putarPotongan(p.id)}>
              <GambarPegangan />
            </Klik>
          );
        })}

      {pemindah.hantu && (
        <div className="dipegang" style={{ position: "absolute", left: pemindah.hantu.x - jariJari(potongan[pemindah.hantu.benda].jenis) * SATUAN, top: pemindah.hantu.y - jariJari(potongan[pemindah.hantu.benda].jenis) * SATUAN, pointerEvents: "none", zIndex: 30 }}>
          <GambarPotongan jenis={potongan[pemindah.hantu.benda].jenis} sudut={potongan[pemindah.hantu.benda].sudut} />
        </div>
      )}

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} />

      {selamat && <Selamat terakhir={nomorLevel + 1 === levelTangram.length} onLanjut={lanjut} />}
    </Kerangka>
  );
}
