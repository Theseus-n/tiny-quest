import { useEffect, useMemo, useRef, useState } from "react";
import { Kerangka } from "../../bersama/kerangka/Kerangka";
import { Klik } from "../../bersama/masukan/Klik";
import { usePemandu } from "../../bersama/pemandu/Pemandu";
import { Peragaan, useDiamDenganSemangat, type Titik } from "../../bersama/peragaan/Peragaan";
import { Selamat } from "../../bersama/selamat/Selamat";
import { Angka } from "../../bersama/angka/Angka";
import { bicara, bunyi } from "../../bersama/suara/audio";
import { Bakul, Benda, DaunPisang } from "../../gambar/ilustrasi";
import { durasi, ukuran, warnaAlas, warnaBilangan } from "../../desain/token";
import { levelTirai } from "../../konten";
import { simpanProgres, type Progres } from "../../penyimpanan/penyimpanan";
import { pecahKelompok, posisiKelompok, susunanLain } from "./logika";

const KOTAK = 150;
const JARAK_KELOMPOK = 90;
const BENDA = 52;
const DAUN = { lebar: 640, tinggi: 250 };
const WADAH = { lebar: 260, tinggi: 150 };
const JARAK_WADAH = 64;
const Y_WADAH = ukuran.barisTengahAtas + 20;

type Tahap = "pengantar" | "tampil" | "tertutup" | "benar" | "salah";

export function TiraiDaun({ progres, onKembali, onProgres }: { progres: Progres; onKembali: () => void; onProgres: (p: Progres) => void }) {
  const [nomorLevel, setNomorLevel] = useState(Math.min(progres.levelTerakhir, levelTirai.length - 1));
  const level = levelTirai[nomorLevel];
  const [nomorSoal, setNomorSoal] = useState(0);
  const [ulang, setUlang] = useState(0);
  const [tahap, setTahap] = useState<Tahap>("tampil");
  const [nyala, setNyala] = useState(-1);
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const [selamat, setSelamat] = useState(false);
  const reaksi = usePemandu();
  const jeda = useRef<number[]>([]);

  const soal = level.soal[nomorSoal];
  const susunan = useMemo(() => (ulang % 2 === 1 ? susunanLain(soal.susunan) : soal.susunan), [soal, ulang]);

  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));
  const bersihkan = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };

  useEffect(() => {
    setNomorSoal(0);
    setUlang(0);
    setSelamat(false);
  }, [level]);

  // Setiap soal: benda tampil selama lamaTampilMs, lalu daun menutup dan wadah muncul.
  // Di soal pertama level 1, Si Kancil menjelaskan dulu sebelum benda tampil, supaya anak tahu harus
  // memperhatikan sebelum daun menutup. Level yang mengenalkan cara baru diberi satu kalimat penjelasan, juga sebelum benda tampil.
  useEffect(() => {
    let aktif = true;
    bersihkan();
    setNyala(-1);
    const pertama = nomorLevel === 0 && nomorSoal === 0 && ulang === 0;
    const tampilkan = () => {
      setTahap("tampil");
      nanti(level.lamaTampilMs, () => {
        setTahap("tertutup");
        if (!pertama) return;
        bicara("tirai.pilih");
        nanti(500, () => setPemicuPeragaan((n) => n + 1));
      });
    };
    if (pertama) {
      setTahap("pengantar");
      reaksi("lambai");
      (async () => {
        await bicara("umum.sapa");
        if (!aktif) return;
        await bicara("tirai.tugas");
        if (aktif) tampilkan();
      })();
    } else if (level.penjelasan && nomorSoal === 0 && ulang === 0) {
      const kalimat = level.penjelasan;
      setTahap("pengantar");
      reaksi("tunjuk");
      (async () => {
        await bicara(kalimat);
        if (aktif) tampilkan();
      })();
    } else {
      tampilkan();
    }
    return () => {
      aktif = false;
      bersihkan();
    };
  }, [level, nomorSoal, ulang]);

  const pilih = (isi: number) => {
    if (tahap !== "tertutup") return;
    if (isi === soal.jumlah) {
      setTahap("benar");
      bunyi("benar");
      reaksi("tepuk");
      bicara("tirai.berhasil");
      if (nomorSoal + 1 < level.soal.length) {
        nanti(1800, () => {
          setNomorSoal(nomorSoal + 1);
          setUlang(0);
        });
        return;
      }
      nanti(durasi.munculSelamat, () => {
        const tertinggi = Math.max(progres.levelTertinggiSelesai, nomorLevel);
        const berikut = Math.min(nomorLevel + 1, levelTirai.length - 1);
        const baru = { levelTerakhir: berikut, levelTertinggiSelesai: tertinggi };
        simpanProgres("tirai", baru);
        onProgres(baru);
        if ((nomorLevel + 1) % 3 === 0) bicara("umum.tunjukkan");
        setSelamat(true);
      });
      return;
    }
    // Salah: daun tersibak, benda menyala per kelompok, narator menyebut jumlahnya,
    // lalu soal yang sama diulang dengan susunan berbeda.
    setTahap("salah");
    bunyi("cobaLagi");
    reaksi("garuk");
    susunan.forEach((_, k) => nanti(500 + k * 800, () => setNyala(k)));
    const selesaiNyala = 500 + susunan.length * 800;
    nanti(selesaiNyala, () => {
      setNyala(susunan.length);
      bicara(`angka.${soal.jumlah}`);
    });
    nanti(selesaiNyala + 2200, () => setUlang((u) => u + 1));
  };

  // Tata letak benda di tengah area kerja.
  const kelompok = posisiKelompok(susunan, KOTAK, JARAK_KELOMPOK);
  const lebarBenda = susunan.length * KOTAK + (susunan.length - 1) * JARAK_KELOMPOK;
  const xBenda = (ukuran.lebarPanggung - lebarBenda) / 2;
  const yBenda = ukuran.areaKerjaAtas + (ukuran.areaKerjaTinggi - KOTAK) / 2;
  const xDaun = (ukuran.lebarPanggung - DAUN.lebar) / 2;
  const yDaun = ukuran.areaKerjaAtas + (ukuran.areaKerjaTinggi - DAUN.tinggi) / 2;
  const tertutup = tahap === "tertutup";

  const lebarWadah = soal.pilihan.length * WADAH.lebar + (soal.pilihan.length - 1) * JARAK_WADAH;
  const xWadah = (i: number) => (ukuran.lebarPanggung - lebarWadah) / 2 + i * (WADAH.lebar + JARAK_WADAH);
  const titikPeragaan: Titik[] = soal.pilihan.map((_, i) => ({ x: xWadah(i) + WADAH.lebar / 2, y: Y_WADAH + WADAH.tinggi / 2 }));

  useDiamDenganSemangat(tertutup, () => setPemicuPeragaan((n) => n + 1));

  const lanjut = () => {
    if (nomorLevel + 1 < levelTirai.length) setNomorLevel(nomorLevel + 1);
    else onKembali();
  };

  return (
    <Kerangka
      onKembali={onKembali}
      jumlahLevel={levelTirai.length}
      levelSekarang={nomorLevel}
      levelTertinggiSelesai={progres.levelTertinggiSelesai}
      onPilihLevel={(i) => setNomorLevel(i)}
    >
      <div data-testid="benda" data-tahap={tahap} data-jumlah={soal.jumlah} style={{ position: "absolute", left: xBenda, top: yBenda, width: lebarBenda, height: KOTAK, visibility: tahap === "pengantar" ? "hidden" : undefined }}>
        {kelompok.map(({ kelompok: k, titik }) =>
          titik.map((t, i) => (
            <div
              key={`${ulang}-${k}-${i}`}
              data-kelompok={k}
              style={{
                position: "absolute",
                left: t.x - BENDA / 2,
                top: t.y - BENDA / 2,
                transition: "transform 200ms",
                transform: nyala === k ? "scale(1.25)" : "none",
              }}
            >
              <Benda jenis={level.benda} lebar={BENDA} />
            </div>
          )),
        )}
      </div>

      {tahap === "salah" && nyala >= susunan.length && (
        <div
          data-testid="angka-jumlah"
          style={{
            position: "absolute",
            left: xBenda + lebarBenda + 40,
            top: yBenda + KOTAK / 2 - 40,
            width: 80,
            height: 80,
            borderRadius: 22,
            background: warnaBilangan[soal.jumlah].isi,
            boxShadow: `0 6px 0 ${warnaAlas(warnaBilangan[soal.jumlah].isi)}, inset 4px -5px 0 color-mix(in srgb, var(--tinta) 10%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Angka nilai={soal.jumlah} besar={52} warnaAngka={warnaBilangan[soal.jumlah].angka} />
        </div>
      )}

      <div
        data-testid="daun"
        data-tertutup={tertutup || undefined}
        style={{
          position: "absolute",
          left: xDaun,
          top: yDaun,
          transition: "transform 260ms ease-out",
          transform: tertutup ? "translateY(0)" : `translateY(-${yDaun + DAUN.tinggi + 10}px)`,
          pointerEvents: "none",
        }}
      >
        <DaunPisang lebar={DAUN.lebar} tinggi={DAUN.tinggi} />
      </div>

      {tahap !== "tampil" && tahap !== "pengantar" &&
        soal.pilihan.map((isi, i) => {
          const grup = pecahKelompok(isi);
          const posisi = posisiKelompok(grup, 70, 26);
          const lebarIsi = grup.length * 70 + (grup.length - 1) * 26;
          return (
            <Klik key={`${nomorSoal}-${ulang}-${i}`} x={xWadah(i)} y={Y_WADAH} lebar={WADAH.lebar} tinggi={WADAH.tinggi} ujiId={`wadah-${isi}`} onKlik={() => pilih(isi)}>
              <Bakul lebar={WADAH.lebar} tinggi={WADAH.tinggi} />
              <div style={{ position: "absolute", left: (WADAH.lebar - lebarIsi) / 2, top: 38 }}>
                {posisi.map(({ kelompok: k, titik }) =>
                  titik.map((t, j) => (
                    <div key={`${k}-${j}`} style={{ position: "absolute", left: t.x - 16, top: t.y - 16 }}>
                      <Benda jenis={level.benda} lebar={32} />
                    </div>
                  )),
                )}
              </div>
            </Klik>
          );
        })}

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} klik={false} />

      {selamat && <Selamat terakhir={nomorLevel + 1 === levelTirai.length} onLanjut={lanjut} />}
    </Kerangka>
  );
}
