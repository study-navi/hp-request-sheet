import { mkdir, copyFile } from "node:fs/promises";
const files = ["admin-manifest.json", "admin-icon-192.png", "admin-icon-512.png", "admin-apple-touch-icon.png", "_headers", "admin.css", "admin.html", "admin.js", "app.css", "apple-touch-icon.png", "config.js", "en.html", "icon-192.png", "icon-512.png", "index.html", "manifest.json", "reset-password.html", "reset-password.js", "sw.js"];
await mkdir("dist", { recursive: true });
for (const file of files) await copyFile(file, `dist/${file}`);
console.log(`Prepared ${files.length} static files`);
