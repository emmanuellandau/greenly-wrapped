# Greenly Wrapped

Spotify-Wrapped-style yearly climate recap per Greenly client: a shareable
story page generated from one structured dataset, deployed as a static site on
GitHub Pages. No framework, no server, no dependencies.

> ⚠️ Temporarily under `emmanuellandau`. To be transferred into the Greenly
> org (`Offspend`) once an org owner can accept the transfer.

## How it works

```
clients.json  ──►  build.js  ──►  dist/<slug>.html   (one story per client)
template.html ──►            ──►  dist/index.html     (links them all)
                                  ──►  GitHub Pages (via GitHub Actions)
```

- **`template.html`** — the design (the Wrapped slide deck). Never edited per
  client. It reads its data from a single injected object and contains three
  markers the build fills: `__TITLE__`, `__OG_TAGS__`, `__CLIENT_DATA_JSON__`.
- **`clients.json`** — the data (currently mock). One object per client. `slug`
  sets the output filename/URL; if omitted it's derived from `companyName`.
- **`build.js`** — reads the template, injects each client's JSON, and writes
  one HTML file per client plus an `index.html` into `dist/`.

## Run locally

```bash
node build.js            # → writes dist/
open dist/index.html     # view the gallery
```

Bake absolute Open Graph URLs (for correct LinkedIn previews):

```bash
SITE_BASE_URL="https://emmanuellandau.github.io/greenly-wrapped" node build.js
```

## Deploy (automatic)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.

One-time setup: repo **Settings → Pages → Build and deployment → Source =
GitHub Actions**. After that, the site lives at
`https://emmanuellandau.github.io/greenly-wrapped/`. `SITE_BASE_URL` is passed
automatically by the workflow.

## Adding / changing clients

Edit `clients.json` and push. CI rebuilds and redeploys. That's the whole loop.

## Known limitations / next steps

- **Public host, guessable URLs.** GitHub Pages is world-readable and slugs like
  `/acme-corp.html` are enumerable. Fine for the current mock data; **revisit
  before any real client data** goes live (hashed slugs, a private host behind
  auth, or signed expiring links).
- **No `og:image` yet.** Social previews show title + description but no image.
  To add one, pre-render the per-client share card to a PNG at build time and
  point `og:image` at it. Hook marked in `build.js` (`ogTags`).
- **Single template, not yet a scene deck.** This iteration renders the same
  slides for every client. The richer per-client "scene deck" + video pipeline
  (Remotion) remains a possible future direction, not built here.
