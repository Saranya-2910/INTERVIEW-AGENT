// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add your other VITE_ vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}