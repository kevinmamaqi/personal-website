# kevinmamaqi.com

The personal site of Kevin Mamaqi Kapllani — a small, statically rendered single-page site for selected work, notes, and LinkedIn contact.

Built with **Bun + React 19 + SSG**. No client-side JavaScript ships to the browser; the page is rendered to HTML at build time and served as a static file.

## Requirements

- [Bun](https://bun.com) `>= 1.3`

## Develop

```bash
bun install
bun run dev          # http://localhost:3000
```

The dev server re-renders the page on every request, so editing `src/page.tsx` or `src/styles.css` only requires a browser refresh.

## Build

```bash
bun run build        # writes dist/index.html and copies public/
```

The `dist/` folder is fully static and can be served from any host or CDN — Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, Fly Static, GitHub Pages, a coffee shop's hard drive.

## Cloudflare Pages

The zero-cost production target is Cloudflare Pages Direct Upload.

Cloudflare Pages project:

```text
kevinmamaqi
```

Deployments are direct uploads using Wrangler; the GitHub repository (`kevinmamaqi/personal-website`) is the source of truth but is not attached to Cloudflare's Git integration.

```bash
bun add -d wrangler@latest   # one-time setup
bun run pages:dev            # local Pages preview from dist/
bun run pages:deploy         # deploys dist/ to the kevinmamaqi Pages project
```

If this site is later connected through Cloudflare's Git integration, use:

- Root directory: `website`
- Build command: `bun run build`
- Build output directory: `dist`
- Project name: `kevinmamaqi`

The stable Pages URL is `https://kevinmamaqi.pages.dev`. Custom-domain setup should point `kevinmamaqi.com` to the Pages project through Cloudflare Pages custom domains, not to an individual deployment hash URL.

## Project layout

```
website/
├── public/              static assets copied verbatim
│   ├── styles/
│   │   ├── base.css     shared design tokens + page chrome (all pages)
│   │   ├── note.css     note entity (articles under /notes/)
│   │   └── deck.css     presentation entity (slide decks)
│   ├── notes/           static note/presentation pages
│   ├── avatar.svg
│   ├── favicon.svg
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── build.tsx        SSG entry: renders to dist/index.html
│   ├── dev.tsx          Bun.serve() dev server
│   ├── page.tsx         the frontpage (content + structure)
│   ├── styles.css       frontpage-only styles (base.css is inlined ahead)
│   └── template.ts      HTML document shell (head, meta, fonts)
├── package.json
└── tsconfig.json
```

## Page entities

Every page type shares one design system. `public/styles/base.css` owns the tokens and chrome; the frontpage, notes, and presentations each layer their own entity stylesheet on top. New pages extend an entity stylesheet — tokens are never copied into a page.

## Legacy sites

Older implementations are archived on GitHub: `gatsby-kevinmamaqi`, `web`, `web_sapper`, and `simpleportfolio`. The live `kevinmamaqi.com` domain was moved to this Cloudflare Pages project on 2026-06-19; this folder is the canonical current implementation.

## Design

Warm-paper palette, EB Garamond for display, Inter for sans. The production version is intentionally simpler than the earlier editorial draft: no monogram, no ventures section, no CV download, and no decorative sketch layer. The "worked with" section is text-only in a compact monochrome wordmark-style grid.
