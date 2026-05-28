/// <reference types="vite/client" />

// Vite-native `?url` asset imports — used by lib/pdfExtract to point
// pdf.js at its worker bundle without baking it into the main chunk.
declare module '*?url' {
  const src: string;
  export default src;
}
