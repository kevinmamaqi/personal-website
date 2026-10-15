import { mkdir, cp, writeFile, readFile, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import Page from "./page.tsx";
import CvPage from "./cv.tsx";
import { html } from "./template.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");
const pub = resolve(root, "public");

const TITLE = "Kevin Mamaqi Kapllani - Engineering Manager · TypeScript, Golang, AI Infrastructure";
const DESCRIPTION =
  "Hands-on engineering manager in Barcelona, 15 years building software. TypeScript, Node.js, Golang, Python, React, GraphQL, gRPC, AWS, GCP. AI infrastructure, distributed systems, and team leadership across AI, maritime, and healthcare software.";
const SITE_URL = "https://kevinmamaqi.com/";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kevin Mamaqi Kapllani",
  url: SITE_URL,
  jobTitle: "Engineering Manager",
  address: { "@type": "PostalAddress", addressLocality: "Barcelona", addressCountry: "ES" },
  sameAs: [
    "https://www.linkedin.com/in/kevinmamaqi",
    "https://www.malt.es/profile/kevinmamaqikapllani",
  ],
  knowsAbout: [
    "TypeScript",
    "Node.js",
    "Golang",
    "Python",
    "React",
    "GraphQL",
    "gRPC",
    "REST APIs",
    "PostgreSQL",
    "DynamoDB",
    "AWS",
    "Google Cloud Platform",
    "CI/CD",
    "AI infrastructure",
    "Workflow orchestration",
    "Distributed systems",
    "Event-driven architecture",
    "Domain-driven design",
    "Observability",
    "Engineering management",
    "Team leadership",
  ],
};

async function loadCss(): Promise<string> {
  // base.css is the shared design system (tokens + chrome) used by every
  // page entity; the frontpage inlines it ahead of its own styles.
  const base = await readFile(resolve(pub, "styles/base.css"), "utf8");
  const page = await readFile(resolve(here, "styles.css"), "utf8");
  return `${base}\n${page}`;
}

async function loadCvCss(): Promise<string> {
  const base = await readFile(resolve(pub, "styles/base.css"), "utf8");
  const cv = await readFile(resolve(here, "cv-styles.css"), "utf8");
  return `${base}\n${cv}`;
}

async function prepareDist() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
}

async function copyPublic() {
  if (!existsSync(pub)) {
    await mkdir(pub, { recursive: true });
    return;
  }
  await cp(pub, dist, { recursive: true });
}

async function main() {
  const t0 = performance.now();
  await prepareDist();
  const css = await loadCss();
  const body = renderToStaticMarkup(<Page />);
  const doc = html({ title: TITLE, description: DESCRIPTION, body, css, url: SITE_URL, structuredData: STRUCTURED_DATA });
  await writeFile(resolve(dist, "index.html"), doc, "utf8");

  const cvDir = resolve(dist, "cv");
  await mkdir(cvDir, { recursive: true });
  const cvBody = renderToStaticMarkup(<CvPage />);
  const cvDoc = html({
    title: "CV - Kevin Mamaqi Kapllani",
    description: "Printable CV of Kevin Mamaqi Kapllani, Engineering Manager (Hands-On) in Barcelona.",
    body: cvBody,
    css: await loadCvCss(),
    url: `${SITE_URL}cv/`,
  });
  await writeFile(resolve(cvDir, "index.html"), cvDoc, "utf8");

  await copyPublic();
  const t = (performance.now() - t0).toFixed(1);
  const size = (await stat(resolve(dist, "index.html"))).size;
  console.log(`built dist/index.html (${(size / 1024).toFixed(1)} kB) in ${t} ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
