import { useEffect, useMemo, useRef, useState } from "react";
import { Kerangka } from "../../bersama/kerangka/Kerangka";
import { Klik } from "../../bersama/masukan/Klik";
import { usePemindah } from "../../bersama/masukan/pemindah";
import { usePemandu } from "../../bersama/pemandu/Pemandu";
import { Peragaan, useDiamDenganSemangat, type Titik } from "../../bersama/peragaan/Peragaan";
import { Selamat } from "../../bersama/selamat/Selamat";
import { bicara, bunyi } from "../../bersama/suara/audio";
import { durasi, ukuran, warna } from "../../desain/token";
import { levelBalok } from "../../konten";
import { simpanProgres, type Progres } from "../../penyimpanan/penyimpanan";
import { AngkaBalok, GambarBalok, LEBAR_ANGKA, SATUAN } from "./GambarBalok";
import { bisaDigabung, potong } from "./logika";
import { PetaSungai, SUNGAI, Y_JEMBATAN } from "./PetaSungai";

type BalokRak = { id: number; nilai: number };

const BARIS_RAK = [ukuran.barisTengahAtas + 16, ukuran.barisBawahAtas + 10];
const KIRI_RAK = 48;
const KANAN_RAK = ukuran.lebarPanggung - 48;
const JARAK_RAK = 32;
const LAMA_MENYEBERANG = 1600;

/** Posisi setiap balok di rak: berjajar dari kiri, pindah ke baris kedua kalau baris pertama penuh. */
function aturRak(rak: BalokRak[], pakaiAngka: boolean) {
  const posisi = new Map<number, { x: number; y: number }>();
  let baris = 0;
  let x = KIRI_RAK;
  for (const b of rak) {
    const lebar = lebarItem(b.nilai, pakaiAngka);
    if (x + lebar > KANAN_RAK && x > KIRI_RAK && baris < BARIS_RAK.length - 1) {
      baris++;
      x = KIRI_RAK;
    }
    posisi.set(b.id, { x, y: BARIS_RAK[baris] });
    x += lebar + JARAK_RAK;
  }
  return posisi;
}
const lebarItem = (nilai: number, pakaiAngka: boolean) => (pakaiAngka ? LEBAR_ANGKA : 0) + nilai * SATUAN;

/**
 * Balok Bilangan: kucing mau menyeberang sungai. Anak membuat jembatan dari balok yang panjangnya pas,
 * dengan memasang, menyatukan, atau memotong balok. Tanpa lambang tambah dan kurang.
 */
export function BalokBilangan({ progres, onKembali, onProgres }: { progres: Progres; onKembali: () => void; onProgres: (p: Progres) => void }) {
  const [nomorLevel, setNomorLevel] = useState(Math.min(progres.levelTerakhir, levelBalok.length - 1));
  const level = levelBalok[nomorLevel];
  const reaksi = usePemandu();

  const idBerikut = useRef(0);
  const buatBalok = (nilai: number): BalokRak => ({ id: idBerikut.current++, nilai });
  const [rak, setRak] = useState<BalokRak[]>(() => level.rak.map(buatBalok));
  const [diSungai, setDiSungai] = useState<BalokRak[]>([]);
  const [jadi, setJadi] = useState(false);
  const [percobaan, setPercobaan] = useState<number | null>(null);
  const [menyeberang, setMenyeberang] = useState(false);
  const [selamat, setSelamat] = useState(false);
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const jeda = useRef<number[]>([]);

  const bersihkanJeda = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));
  const peragakan = () => setPemicuPeragaan((n) => n + 1);
  const selesai = jadi;
  const terisi = diSungai.reduce((n, b) => n + b.nilai, 0);

  // Level 1: Si Kancil menjelaskan tujuan dan caranya. Level yang mengenalkan cara baru (menyusun, memotong)
  // diberi satu kalimat penjelasan. Level lain hanya diperagakan tangan bayangan tanpa suara.
  useEffect(() => {
    let aktif = true;
    bersihkanJeda();
    setRak(level.rak.map(buatBalok));
    setDiSungai([]);
    setJadi(false);
    setPercobaan(null);
    setMenyeberang(false);
    setSelamat(false);
    if (nomorLevel === 0) {
      nanti(400, async () => {
        reaksi("lambai");
        await bicara("umum.sapa");
        if (!aktif) return;
        await bicara("balok.tugas");
        if (!aktif) return;
        peragakan();
        bicara("balok.cara");
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

  const sebutAngka = (...nilai: number[]) => {
    if (level.angka) nilai.forEach((n) => bicara(`angka.${n}`));
  };

  const pemindah = usePemindah<BalokRak>((benda, tujuan) => {
    if (tujuan === "sungai") pasang(benda);
    else if (tujuan?.startsWith("balok-")) {
      const lain = rak.find((b) => b.id === Number(tujuan.slice(6)));
      if (lain && lain.id !== benda.id) gabung(benda, lain);
    }
  });

  const gabung = (a: BalokRak, b: BalokRak) => {
    pemindah.lepaskan();
    if (!bisaDigabung(a.nilai, b.nilai)) {
      bunyi("cobaLagi");
      reaksi("garuk");
      return;
    }
    const baru = buatBalok(a.nilai + b.nilai);
    setRak((r) => r.filter((x) => x.id !== a.id).map((x) => (x.id === b.id ? baru : x)));
    bunyi("klik");
    sebutAngka(baru.nilai);
  };

  const potongBalok = (b: BalokRak, k: number) => {
    pemindah.lepaskan();
    const [kiri, kanan] = potong(b.nilai, k).map(buatBalok);
    setRak((r) => r.flatMap((x) => (x.id === b.id ? [kiri, kanan] : [x])));
    bunyi("klik");
    sebutAngka(kiri.nilai, kanan.nilai);
  };

  const selesaiLevel = () => {
    const tertinggi = Math.max(progres.levelTertinggiSelesai, nomorLevel);
    const berikut = Math.min(nomorLevel + 1, levelBalok.length - 1);
    const baru = { levelTerakhir: berikut, levelTertinggiSelesai: tertinggi };
    simpanProgres("balok", baru);
    onProgres(baru);
    if ((nomorLevel + 1) % 3 === 0) bicara("umum.tunjukkan");
    nanti(LAMA_MENYEBERANG + durasi.munculSelamat, () => setSelamat(true));
  };

  // Balok disusun di atas sungai dari kiri. Jembatan jadi saat cetakannya terisi pas.
  // Balok yang melewati tepi sungai tampil sebentar menjorok, lalu tetap di rak, supaya anak melihat kelebihannya.
  const pasang = (b: BalokRak) => {
    pemindah.lepaskan();
    if (terisi + b.nilai > level.sungai) {
      setPercobaan(b.nilai);
      bunyi("cobaLagi");
      reaksi("garuk");
      nanti(1200, () => setPercobaan(null));
      return;
    }
    setPercobaan(null);
    setRak((r) => r.filter((x) => x.id !== b.id));
    setDiSungai((s) => [...s, b]);
    if (terisi + b.nilai < level.sungai) {
      bunyi("klik");
      return;
    }
    setJadi(true);
    bunyi("benar");
    reaksi("tepuk");
    bicara("balok.berhasil");
    nanti(400, () => setMenyeberang(true));
    selesaiLevel();
  };

  /** Balok di atas sungai diklik: kembali ke rak, beserta balok di sebelah kanannya supaya susunan tetap rapat dari kiri. */
  const ambilDariSungai = (indeks: number) => {
    if (selesai) return;
    pemindah.lepaskan();
    setRak((r) => [...r, ...diSungai.slice(indeks)]);
    setDiSungai((s) => s.slice(0, indeks));
    bunyi("klik");
  };

  const klikBalok = (b: BalokRak) => {
    if (selesai) return;
    const dipegang = pemindah.dipegang;
    if (!dipegang) pemindah.pegang(b);
    else if (dipegang.id === b.id) pemindah.lepaskan();
    else gabung(dipegang, b);
  };

  const klikSungai = () => {
    if (selesai) return;
    if (pemindah.dipegang) pasang(pemindah.dipegang);
    else {
      reaksi("tunjuk");
      peragakan();
    }
  };

  const lanjut = () => {
    if (nomorLevel + 1 < levelBalok.length) setNomorLevel(nomorLevel + 1);
    else onKembali();
  };

  useDiamDenganSemangat(!selesai, peragakan);

  // Tata letak sungai: selebar n satuan di tengah, dengan tepi di kiri dan kanannya.
  const lebarSungai = level.sungai * SATUAN;
  const xSungai = (ukuran.lebarPanggung - lebarSungai) / 2;
  const posisi = aturRak(rak, level.angka);
  const xBalok = (b: BalokRak) => posisi.get(b.id)!.x + (level.angka ? LEBAR_ANGKA : 0);

  const titikPeragaan: Titik[] = useMemo(() => {
    const tengah = (b: BalokRak) => ({ x: xBalok(b) + (b.nilai * SATUAN) / 2, y: posisi.get(b.id)!.y + SATUAN / 2 });
    const sungai = { x: xSungai + lebarSungai / 2, y: Y_JEMBATAN + SATUAN / 2 };
    const cari = (n: number, kecuali?: number) => rak.find((b) => b.nilai === n && b.id !== kecuali);
    const c = level.contoh;
    if ("gabung" in c) {
      // Menyusun di sungai: tangan memasang balok pertama di ujung kiri cetakan.
      const a = cari(c.gabung[0]);
      const kiri = { x: xSungai + terisi * SATUAN + (c.gabung[0] * SATUAN) / 2, y: Y_JEMBATAN + SATUAN / 2 };
      if (a) return [tengah(a), kiri];
    }
    if ("potong" in c) {
      const a = cari(c.potong[0]);
      if (a) return [tengah(a), { x: xBalok(a) + c.potong[1] * SATUAN, y: posisi.get(a.id)!.y + SATUAN / 2 }];
    }
    const pas = cari(level.sungai) ?? rak[0];
    return pas ? [tengah(pas), sungai] : [];
  }, [rak, level, terisi]);

  const dipegang = pemindah.dipegang;

  return (
    <Kerangka
      onKembali={onKembali}
      jumlahLevel={levelBalok.length}
      levelSekarang={nomorLevel}
      levelTertinggiSelesai={progres.levelTertinggiSelesai}
      onPilihLevel={(i) => setNomorLevel(i)}
      onKlikKosong={() => pemindah.lepaskan()}
    >
      <PetaSungai sungai={level.sungai} xSungai={xSungai} diSungai={diSungai} terisi={terisi} percobaan={percobaan} menyeberang={menyeberang} />

      {/* Seluruh sungai bisa diklik. Gambarnya di peta 3D di bawahnya. */}
      <Klik x={xSungai} y={SUNGAI.atas} lebar={lebarSungai} tinggi={SUNGAI.bawah - SUNGAI.atas} tujuan="sungai" ujiId="sungai" onKlik={klikSungai}>
        <div data-lebar={level.sungai} />
      </Klik>

      {level.angka && (
        <div style={{ position: "absolute", left: xSungai + lebarSungai / 2 - 26, top: SUNGAI.bawah - 62, pointerEvents: "none" }}>
          <AngkaBalok nilai={level.sungai} />
        </div>
      )}

      {/* Penanda untuk uji otomatis: sisa cetakan, jembatan jadi, dan kucing menyeberang. Tidak tampil. */}
      <div data-testid="cetakan" data-sisa={level.sungai - terisi} style={{ position: "absolute", left: xSungai, top: Y_JEMBATAN, pointerEvents: "none" }}>
        {Array.from({ length: level.sungai - terisi }, (_, i) => (
          <span key={i} data-kosong />
        ))}
      </div>
      {jadi && <div data-testid="jembatan" style={{ position: "absolute", left: xSungai, top: Y_JEMBATAN, width: lebarSungai, height: SATUAN, pointerEvents: "none" }} />}
      {percobaan !== null && <div data-testid="percobaan" style={{ position: "absolute", left: xSungai + terisi * SATUAN, top: Y_JEMBATAN, width: percobaan * SATUAN, height: SATUAN, pointerEvents: "none" }} />}
      <div data-testid="kucing" data-seberang={menyeberang || undefined} style={{ position: "absolute", left: xSungai - 96, top: Y_JEMBATAN, width: 1, height: 1, pointerEvents: "none" }} />

      {/* Balok yang sudah disusun di atas sungai. Klik untuk mengembalikannya ke rak. */}
      {diSungai.map((b, i) => {
        const x = xSungai + diSungai.slice(0, i).reduce((n, s) => n + s.nilai, 0) * SATUAN;
        return (
          <Klik key={b.id} x={x} y={Y_JEMBATAN} lebar={b.nilai * SATUAN} tinggi={SATUAN} tujuan="sungai" ujiId={`di-sungai-${b.nilai}`} style={{ zIndex: 4 }} onKlik={() => ambilDariSungai(i)}>
            <div data-nilai={b.nilai} />
          </Klik>
        );
      })}

      {/* Rak balok */}
      {rak.map((b) => {
        const p = posisi.get(b.id)!;
        const pegang = dipegang?.id === b.id;
        return (
          <Klik
            key={b.id}
            x={p.x}
            y={p.y}
            lebar={lebarItem(b.nilai, level.angka)}
            tinggi={SATUAN}
            tujuan={`balok-${b.id}`}
            ujiId={`balok-${b.nilai}`}
            dipegang={pegang}
            onKlik={() => klikBalok(b)}
            onPointerDown={!selesai ? (e) => pemindah.mulaiSeret(b, e) : undefined}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {level.angka && <AngkaBalok nilai={b.nilai} />}
              <GambarBalok nilai={b.nilai} />
            </div>
          </Klik>
        );
      })}

      {/* Garis potong muncul di badan balok yang sedang dipegang */}
      {dipegang &&
        rak.some((b) => b.id === dipegang.id) &&
        Array.from({ length: dipegang.nilai - 1 }, (_, i) => {
          const k = i + 1;
          const p = posisi.get(dipegang.id)!;
          return (
            <Klik
              key={`potong-${k}`}
              x={xBalok(dipegang) + k * SATUAN - SATUAN / 2}
              y={p.y - 10}
              lebar={SATUAN}
              tinggi={SATUAN}
              ujiId={`potong-${k}`}
              style={{ zIndex: 10 }}
              onKlik={() => potongBalok(dipegang, k)}
            >
              <svg width={SATUAN} height={SATUAN} viewBox="0 0 88 88" aria-hidden>
                <line x1="44" y1="4" x2="44" y2="84" stroke={warna.tinta} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
              </svg>
            </Klik>
          );
        })}

      {pemindah.hantu && (
        <div className="dipegang" style={{ position: "absolute", left: pemindah.hantu.x - (pemindah.hantu.benda.nilai * SATUAN) / 2, top: pemindah.hantu.y - SATUAN / 2, pointerEvents: "none", zIndex: 30 }}>
          <GambarBalok nilai={pemindah.hantu.benda.nilai} />
        </div>
      )}

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} />

      {selamat && <Selamat terakhir={nomorLevel + 1 === levelBalok.length} onLanjut={lanjut} />}
    </Kerangka>
  );
}
