import { createRoot } from "react-dom/client";
import { App } from "./App";
import { pasangVariabelCss } from "./design/token";
import { pasangPemblokir } from "./shared/input/blocker";
import "./design/base.css";

pasangVariabelCss(document.documentElement);
pasangPemblokir();

createRoot(document.getElementById("akar")!).render(<App />);
