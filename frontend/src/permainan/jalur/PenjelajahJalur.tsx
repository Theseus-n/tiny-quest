import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Kerangka } from "../../bersama/kerangka/Kerangka";
import { usePemindah } from "../../bersama/masukan/pemindah";
import { usePemandu } from "../../bersama/pemandu/Pemandu";
import { Peragaan, useDiamDenganSemangat, type Titik } from "../../bersama/peragaan/Peragaan";
import { Selamat } from "../../bersama/selamat/Selamat";
import { LEBAR_BLOK, TINGGI_BLOK } from "../../bersama/program/Blok";
import { PapanProgram, Y_PALET, Y_SLOT, xPalet, xSlot, type Dipegang } from "../../bersama/program/PapanProgram";
import { PetaJalur } from "../../bersama/program/PetaJalur";
import { usePenjalan } from "../../bersama/program/usePenjalan";
import type { Program } from "../../bersama/program/jenis";
import { bicara, bunyi } from "../../bersama/suara/audio";
import { durasi } from "../../desain/token";
import { levelJalur } from "../../konten";
import { simpanProgres, type Progres } from "../../penyimpanan/penyimpanan";

export function PenjelajahJalur({ progres, onKembali, onProgres }: { progres: Progres; onKembali: () => void; onProgres: (p: Progres) => void }) {
  const [nomorLevel, setNomorLevel] = useState(Math.min(progres.levelTerakhir, levelJalur.length - 1));
  const level = levelJalur[nomorLevel];
  const reaksi = usePemandu();
  const penjalan = usePenjalan(level);
  const { berjalan, masukRumah, setAktif } = penjalan;

  const [program, setProgram] = useState<Program>(() => Array(level.slot).fill(null));
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const [selamat, setSelamat] = useState(false);
  const jeda = useRef<number[]>([]);

  const bersihkanJeda = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));

  // Mulai level: program kosong, tokoh di awal. Di level 1 Si Kancil menjelaskan tujuan dan caranya,
  // dan tangan bayangan memperagakan saat caranya dijelaskan. Level yang mengenalkan blok baru diberi
  // satu kalimat penjelasan. Di level lain anak langsung mencoba sendiri.
  useEffect(() => {
    let aktif = true;
    bersihkanJeda();
    penjalan.ulangDariAwal();
    setProgram(Array(level.slot).fill(null));
    setSelamat(false);
    if (nomorLevel === 0) {
      nanti(400, async () => {
        reaksi("lambai");
        await bicara("umum.sapa");
        if (!aktif) return;
        await bicara("jalur.tugas");
        if (!aktif) return;
        setPemicuPeragaan((n) => n + 1);
        await bicara("jalur.cara");
        if (!aktif) return;
        await bicara("jalur.jalan");
        if (!aktif) return;
        bicara("jalur.coba-banyak");
      });
    } else if (level.penjelasan) {
      const kalimat = level.penjelasan;
      nanti(400, () => {
        reaksi("tunjuk");
        setPemicuPeragaan((n) => n + 1);
        bicara(kalimat);
      });
    } else {
      nanti(600, () => setPemicuPeragaan((n) => n + 1));
    }
    return () => {
      aktif = false;
      bersihkanJeda();
    };
  }, [level]);

  const taruh = useCallback(
    (benda: Dipegang, indeksSlot: number) => {
      setProgram((p) => {
        const baru = [...p];
        if (benda.asal === "slot") baru[benda.indeks] = p[indeksSlot];
        baru[indeksSlot] = benda.blok;
        return baru;
      });
      setAktif([]);
      bunyi("klik");
    },
    [],
  );

  const cabut = useCallback((indeks: number) => {
    setProgram((p) => p.map((b, i) => (i === indeks ? null : b)));
    setAktif([]);
    bunyi("klik");
  }, []);

  const pemindah = usePemindah<Dipegang>((benda, tujuan) => {
    if (berjalan) return;
    if (tujuan?.startsWith("slot-")) taruh(benda, Number(tujuan.slice(5)));
    else if (benda.asal === "slot") cabut(benda.indeks);
  });

  const klikPalet = (indeks: number) => {
    if (berjalan) return;
    const sama = pemindah.dipegang?.asal === "palet" && pemindah.dipegang.indeks === indeks;
    pemindah.pegang(sama ? null : { asal: "palet", blok: level.blok[indeks], indeks });
  };

  const klikSlot = (indeks: number) => {
    if (berjalan) return;
    if (pemindah.dipegang) {
      taruh(pemindah.dipegang, indeks);
      pemindah.lepaskan();
    } else if (program[indeks]) {
      cabut(indeks);
    } else {
      // Slot kosong diklik tanpa memegang blok: anak belum tahu caranya, jadi peragakan lagi.
      reaksi("tunjuk");
      setPemicuPeragaan((n) => n + 1);
    }
  };

  const selesaiLevel = () => {
    const tertinggi = Math.max(progres.levelTertinggiSelesai, nomorLevel);
    const berikut = Math.min(nomorLevel + 1, levelJalur.length - 1);
    const baru = { levelTerakhir: berikut, levelTertinggiSelesai: tertinggi };
    simpanProgres("jalur", baru);
    onProgres(baru);
    if ((nomorLevel + 1) % 3 === 0) bicara("umum.tunjukkan");
    nanti(durasi.munculSelamat, () => setSelamat(true));
  };

  const lanjut = () => {
    if (nomorLevel + 1 < levelJalur.length) setNomorLevel(nomorLevel + 1);
    else onKembali();
  };

  const jalan = () => {
    if (berjalan) return;
    pemindah.lepaskan();
    if (program.every((b) => b === null)) {
      reaksi("tunjuk");
      setPemicuPeragaan((n) => n + 1);
      return;
    }
    penjalan.jalankanProgram(program, {
      onBerhasil: () => {
        bicara("jalur.berhasil");
        selesaiLevel();
      },
      onGagal: () => bicara("jalur.coba-lagi"),
    });
  };

  useDiamDenganSemangat(!berjalan && !masukRumah, () => setPemicuPeragaan((n) => n + 1));

  const titikPeragaan: Titik[] = useMemo(() => {
    const kosong = program.findIndex((b) => b === null);
    const s = kosong === -1 ? 0 : kosong;
    // Tangan mengambil blok yang dibutuhkan slot itu menurut contoh penyelesaian, supaya blok baru ikut diperagakan.
    const dibutuhkan = level.penyelesaian[s];
    const p = Math.max(0, level.blok.findIndex((b) => JSON.stringify(b) === JSON.stringify(dibutuhkan)));
    return [
      { x: xPalet(level.blok.length, p) + LEBAR_BLOK / 2, y: Y_PALET + TINGGI_BLOK / 2 },
      { x: xSlot(level.slot, s) + LEBAR_BLOK / 2, y: Y_SLOT + TINGGI_BLOK / 2 },
    ];
  }, [level, program]);

  return (
    <Kerangka
      onKembali={onKembali}
      jumlahLevel={levelJalur.length}
      levelSekarang={nomorLevel}
      levelTertinggiSelesai={progres.levelTertinggiSelesai}
      onPilihLevel={(i) => !berjalan && setNomorLevel(i)}
      onKlikKosong={() => pemindah.lepaskan()}
    >
      <PetaJalur level={level} tokoh={penjalan.tokoh} masukRumah={masukRumah} />

      <PapanProgram
        program={program}
        aktif={penjalan.aktif}
        palet={level.blok}
        dipegang={pemindah.dipegang}
        hantu={pemindah.hantu}
        berjalan={berjalan}
        onKlikSlot={klikSlot}
        onKlikPalet={klikPalet}
        onSeret={(benda, e) => pemindah.mulaiSeret(benda, e)}
        onJalan={jalan}
      />

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} />

      {selamat && <Selamat terakhir={nomorLevel + 1 === levelJalur.length} onLanjut={lanjut} />}
    </Kerangka>
  );
}
