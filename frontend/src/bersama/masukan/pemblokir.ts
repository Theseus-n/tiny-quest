// Keyboard, klik kanan, dan zoom tidak berpengaruh apa pun di layar anak (frontend.md, Keputusan yang sudah diambil).

export function pasangPemblokir(): () => void {
  const tolakTombol = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const tolak = (e: Event) => e.preventDefault();
  const tolakZoom = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault();
  };

  window.addEventListener("keydown", tolakTombol, { capture: true });
  window.addEventListener("keyup", tolakTombol, { capture: true });
  window.addEventListener("contextmenu", tolak, { capture: true });
  window.addEventListener("wheel", tolakZoom, { capture: true, passive: false });
  window.addEventListener("dragstart", tolak, { capture: true });
  window.addEventListener("selectstart", tolak, { capture: true });

  return () => {
    window.removeEventListener("keydown", tolakTombol, { capture: true });
    window.removeEventListener("keyup", tolakTombol, { capture: true });
    window.removeEventListener("contextmenu", tolak, { capture: true });
    window.removeEventListener("wheel", tolakZoom, { capture: true });
    window.removeEventListener("dragstart", tolak, { capture: true });
    window.removeEventListener("selectstart", tolak, { capture: true });
  };
}
