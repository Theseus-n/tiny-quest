import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Suara narator ditanam di bundel (lihat shared/sound/audio.ts), dan aplikasi hanya dibuka dari laptop sendiri.
  build: { chunkSizeWarningLimit: 4000 },
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8080" },
  },
});
