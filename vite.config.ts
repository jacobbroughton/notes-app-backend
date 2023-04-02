import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// to set the bundle’s entry point to src/main.jsx instead of the default index.html.
export default defineConfig({
  plugins: [react()],
  // build: {
  //   manifest: true,
  //   rollupOptions: {
  //     input: "./src/main.tsx",
  //   },
  // },
});