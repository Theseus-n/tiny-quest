import { createRoot } from "react-dom/client";
import { App } from "./App";
import { pasangVariabelCss } from "./desain/token";
import { pasangPemblokir } from "./bersama/masukan/pemblokir";
import "./desain/dasar.css";

pasangVariabelCss(document.documentElement);
pasangPemblokir();

createRoot(document.getElementById("akar")!).render(<App />);
