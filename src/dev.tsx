import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { html } from "./template.ts";
import { TITLE, DESCRIPTION, REVIEW_NOTES } from "./content/positioning.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pub = resolve(root, "public");



const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

async function renderPage(): Promise<string> {
  // Re-import on every request so edits to page.tsx / styles are picked up.
  const pageMod = await import(`./page.tsx?t=${Date.now()}`);
  const Page = pageMod.default;
  const base = await readFile(resolve(pub, "styles/base.css"), "utf8");
  const page = await readFile(resolve(here, "styles.css"), "utf8");
  const body = renderToStaticMarkup(<Page />);
  return html({ title: TITLE, description: DESCRIPTION, body, css: `${base}\n${page}`, reviewNotes: REVIEW_NOTES });
}

async function renderCvPage(): Promise<string> {
  const pageMod = await import(`./cv.tsx?t=${Date.now()}`);
  const CvPage = pageMod.default;
  const base = await readFile(resolve(pub, "styles/base.css"), "utf8");
  const cv = await readFile(resolve(here, "cv-styles.css"), "utf8");
  const body = renderToStaticMarkup(<CvPage />);
  return html({
    title: "CV - Kevin Mamaqi Kapllani",
    description: "Printable CV of Kevin Mamaqi Kapllani, Engineering Manager (Hands-On) in Barcelona.",
    body,
    css: `${base}\n${cv}`,
    url: "https://kevinmamaqi.com/cv/",
  });
}

const port = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port,
  development: true,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/" || pathname === "/index.html") {
      try {
        const body = await renderPage();
        return new Response(body, { headers: { "content-type": MIME[".html"] } });
      } catch (e) {
        console.error(e);
        return new Response(String(e), { status: 500 });
      }
    }

    if (pathname === "/cv" || pathname === "/cv/" || pathname === "/cv/index.html") {
      try {
        const body = await renderCvPage();
        return new Response(body, { headers: { "content-type": MIME[".html"] } });
      } catch (e) {
        console.error(e);
        return new Response(String(e), { status: 500 });
      }
    }

    // Public assets
    const filePath = resolve(pub, "." + pathname);
    if (filePath.startsWith(pub) && existsSync(filePath)) {
      const ext = extname(filePath).toLowerCase();
      const mime = MIME[ext] ?? "application/octet-stream";
      const file = Bun.file(filePath);
      return new Response(file, { headers: { "content-type": mime } });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log("kevinmamaqi.com dev server");
console.log(`http://localhost:${server.port}`);
