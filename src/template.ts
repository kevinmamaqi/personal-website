interface TemplateInput {
  title: string;
  description: string;
  body: string;
  css: string;
  url?: string;
  structuredData?: object;
}

export function html({ title, description, body, css, url = "https://kevinmamaqi.com/", structuredData }: TemplateInput): string {
  const jsonLd = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("</", "<\\/")}</script>\n`
    : "";
  const imageUrl = new URL("/avatar.svg", url).toString();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#F7F3EC" />
<meta name="color-scheme" content="light dark" />
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}" />
<meta name="author" content="Kevin Mamaqi Kapllani" />

<link rel="canonical" href="${escape(url)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/avatar.svg" />

<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escape(url)}" />
<meta property="og:image" content="${escape(imageUrl)}" />
<meta property="og:locale" content="en_GB" />
<meta property="og:site_name" content="Kevin Mamaqi Kapllani" />

<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escape(title)}" />
<meta name="twitter:description" content="${escape(description)}" />
<meta name="twitter:image" content="${escape(imageUrl)}" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<script src="/theme.js"></script>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600&display=swap" />

<style>${css}</style>
${jsonLd}</head>
<body>
<div id="root">${body}</div>
</body>
</html>
`;
}

function escape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
