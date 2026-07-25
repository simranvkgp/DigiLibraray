// pdfjs-dist ships its worker as an ES module. Letting webpack bundle it (via
// `new URL(..., import.meta.url)`) makes Next.js run it through Terser, which
// chokes on top-level import/export syntax. Serving it as a plain static file
// instead sidesteps webpack/Terser entirely.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

fs.copyFileSync(src, dest);
