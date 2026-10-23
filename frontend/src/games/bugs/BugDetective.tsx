import { useEffect, useMemo, useRef, useState } from "react";
import { Kerangka } from "../../shared/frame/Frame";
import { usePemindah } from "../../shared/input/mover";
import { usePemandu } from "../../shared/guide/Guide";
import { Peragaan, useDiamDenganSemangat, type Titik } from "../../shared/demo/Demo";
import { Selamat } from "../../shared/congrats/Congrats";
import { LEBAR_BLOK, TINGGI_BLOK } from "../../shared/program/Block";
import { PapanProgram, TOMBOL_JALAN, Y_PALET, Y_SLOT, xJalan, xPalet, xSlot, yJalan, type Dipegang } from "../../shared/program/ProgramBoard";
import { PetaJalur } from "../../shared/program/PathMap";
import { usePenjalan } from "../../shared/program/useRunner";
import type { Blok, Program } from "../../shared/program/kinds";
import { bicara, bunyi } from "../../shared/sound/audio";
import { durasi } from "../../design/token";
import { levelGalat, levelJalur } from "../../content";
import { simpanProgres, type Progres } from "../../storage/storage";
import { panggungGalat } from "./logic";

/**
 * Detektif Galat: program sudah lengkap tetapi punya tepat satu blok yang salah.
 * Blok yang dicabut pindah ke deretan bawah. Di soal "ganti", dua blok pengganti ikut muncul setelah cabutan pertama.
 * Program dijalankan ulang otomatis setelah blok berlebih dicabut, atau setelah slot kosong diisi lagi di soal "ganti".
 */
export function DetektifGalat({ progres, onKembali, onProgres }: { progres: Progres; onKembali: () => void; onProgres: (p: Progres) => void }) {
  const [nomorLevel, setNomorLevel] = useState(Math.min(progres.levelTerakhir, levelGalat.length - 1));
  const soal = levelGalat[nomorLevel];
  const level = useMemo(() => panggungGalat(soal, levelJalur), [soal]);
  const reaksi = usePemandu();
  const penjalan = usePenjalan(level);
  const { berjalan, masukRumah, setAktif } = penjalan;

  const [program, setProgram] = useState<Program>(() => [...soal.program]);
  const [palet, setPalet] = useState<Blok[]>([]);
  const [penggantiMuncul, setPenggantiMuncul] = useState(false);
  const [pemicuPeragaan, setPemicuPeragaan] = useState(0);
  const [selamat, setSelamat] = useState(false);
  const sudahDiberiPetunjuk = useRef(false);
  const jeda = useRef<number[]>([]);

  const bersihkanJeda = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));
  const peragakan = () => setPemicuPeragaan((n) => n + 1);

  // Di level 1 Si Kancil menjelaskan, dan level yang mengenalkan cara baru diberi satu kalimat penjelasan.
  // Di level lain tangan bayangan memperagakan tanpa suara.
  useEffect(() => {
    let aktif = true;
    bersihkanJeda();
    penjalan.ulangDariAwal();
    setProgram([...soal.program]);
    setPalet([]);
    setPenggantiMuncul(false);
    setSelamat(false);
    sudahDiberiPetunjuk.current = false;
    if (nomorLevel === 0) {
      nanti(400, async () => {
        reaksi("lambai");
        await bicara("umum.sapa");
        if (!aktif) return;
        await bicara("galat.tugas");
        if (!aktif) return;
        peragakan();
        bicara("galat.coba");
      });
    } else if (soal.penjelasan) {
      const kalimat = soal.penjelasan;
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
  }, [soal]);

  const selesaiLevel = () => {
    const tertinggi = Math.max(progres.levelTertinggiSelesai, nomorLevel);
    const berikut = Math.min(nomorLevel + 1, levelGalat.length - 1);
    const baru = { levelTerakhir: berikut, levelTertinggiSelesai: tertinggi };
    simpanProgres("galat", baru);
    onProgres(baru);
    if ((nomorLevel + 1) % 3 === 0) bicara("umum.tunjukkan");
    nanti(durasi.munculSelamat, () => setSelamat(true));
  };

  const jalankan = (p: Program) => {
    penjalan.jalankanProgram(p, {
      onBerhasil: () => {
        bicara("galat.berhasil");
        selesaiLevel();
      },
      onGagal: () => {
        // Di level 1, setelah percobaan pertama gagal, Si Kancil memberi tahu cara mencabut blok.
        if (nomorLevel === 0 && !sudahDiberiPetunjuk.current) {
          sudahDiberiPetunjuk.current = true;
          bicara("galat.cabut");
        }
      },
    });
  };

  const cabut = (indeks: number) => {
    const blok = program[indeks];
    if (!blok) return;
    const baru = program.map((b, i) => (i === indeks ? null : b));
    setProgram(baru);
    setAktif([]);
    bunyi("klik");
    if (soal.jenis === "ganti" && !penggantiMuncul) {
      setPenggantiMuncul(true);
      setPalet((p) => [...(soal.pengganti ?? []), ...p, blok]);
      nanti(400, peragakan);
      return;
    }
    setPalet((p) => [...p, blok]);
    if (soal.jenis === "berlebih") nanti(500, () => jalankan(baru));
  };

  const taruh = (benda: Dipegang, indeksSlot: number) => {
    const baru = [...program];
    let paletBaru = palet;
    if (benda.asal === "slot") {
      baru[benda.indeks] = program[indeksSlot];
    } else {
      paletBaru = palet.filter((_, i) => i !== benda.indeks);
      const lama = program[indeksSlot];
      if (lama) paletBaru = [...paletBaru, lama];
    }
    baru[indeksSlot] = benda.blok;
    setProgram(baru);
    setPalet(paletBaru);
    setAktif([]);
    bunyi("klik");
    if (soal.jenis === "ganti" && baru.every((b) => b !== null)) nanti(500, () => jalankan(baru));
  };

  const pemindah = usePemindah<Dipegang>((benda, tujuan) => {
    if (berjalan) return;
    if (tujuan?.startsWith("slot-")) taruh(benda, Number(tujuan.slice(5)));
    else if (benda.asal === "slot") cabut(benda.indeks);
  });

  const klikPalet = (indeks: number) => {
    if (berjalan) return;
    const sama = pemindah.dipegang?.asal === "palet" && pemindah.dipegang.indeks === indeks;
    pemindah.pegang(sama ? null : { asal: "palet", blok: palet[indeks], indeks });
  };

  const klikSlot = (indeks: number) => {
    if (berjalan) return;
    if (pemindah.dipegang) {
      taruh(pemindah.dipegang, indeks);
      pemindah.lepaskan();
    } else if (program[indeks]) {
      cabut(indeks);
    } else {
      reaksi("tunjuk");
      peragakan();
    }
  };

  const jalan = () => {
    if (berjalan) return;
    pemindah.lepaskan();
    jalankan(program);
  };

  const lanjut = () => {
    if (nomorLevel + 1 < levelGalat.length) setNomorLevel(nomorLevel + 1);
    else onKembali();
  };

  useDiamDenganSemangat(!berjalan && !masukRumah, peragakan);

  // Peragaan menunjuk langkah berikutnya: isi slot kosong, cabut blok yang menyala, atau coba jalankan.
  const titikPeragaan: Titik[] = useMemo(() => {
    const tengahSlot = (i: number) => ({ x: xSlot(program.length, i) + LEBAR_BLOK / 2, y: Y_SLOT + TINGGI_BLOK / 2 });
    const kosong = program.findIndex((b) => b === null);
    if (kosong >= 0 && palet.length > 0) return [{ x: xPalet(palet.length, 0) + LEBAR_BLOK / 2, y: Y_PALET + TINGGI_BLOK / 2 }, tengahSlot(kosong)];
    if (penjalan.aktif.length > 0) return [tengahSlot(penjalan.aktif[penjalan.aktif.length - 1])];
    return [{ x: xJalan + TOMBOL_JALAN / 2, y: yJalan + TOMBOL_JALAN / 2 }];
  }, [program, palet, penjalan.aktif]);

  return (
    <Kerangka
      onKembali={onKembali}
      jumlahLevel={levelGalat.length}
      levelSekarang={nomorLevel}
      levelTertinggiSelesai={progres.levelTertinggiSelesai}
      onPilihLevel={(i) => !berjalan && setNomorLevel(i)}
      onKlikKosong={() => pemindah.lepaskan()}
    >
      <PetaJalur level={level} tokoh={penjalan.tokoh} masukRumah={masukRumah} />

      <PapanProgram
        program={program}
        aktif={penjalan.aktif}
        palet={palet}
        dipegang={pemindah.dipegang}
        hantu={pemindah.hantu}
        berjalan={berjalan}
        onKlikSlot={klikSlot}
        onKlikPalet={klikPalet}
        onSeret={(benda, e) => pemindah.mulaiSeret(benda, e)}
        onJalan={jalan}
      />

      <Peragaan titik={titikPeragaan} pemicu={pemicuPeragaan} />

      {selamat && <Selamat terakhir={nomorLevel + 1 === levelGalat.length} onLanjut={lanjut} />}
    </Kerangka>
  );
}
