#!/usr/bin/env node
/* ============================================================
   Climate Wrapped — static build engine.

   Reads template.html + clients.json, renders one HTML file per
   client into dist/, and generates dist/index.html linking them.

   No dependencies. Run with:  node build.js
   Optionally set SITE_BASE_URL so Open Graph (social share) tags
   use absolute URLs, e.g.
     SITE_BASE_URL="https://<user>.github.io/<repo>" node build.js
============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(ROOT, 'template.html');
const CLIENTS_PATH = path.join(ROOT, 'clients.json');

// Base URL for absolute OG tags (trailing slash trimmed). Empty = relative.
const BASE_URL = (process.env.SITE_BASE_URL || '').replace(/\/+$/, '');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function ogTags(client, pageUrl) {
  const title = `${client.companyName} · ${client.year} Climate Wrapped`;
  const desc = `${client.companyName} cut emissions ${client.reductionPercent}% and completed ${client.actionsCompleted} climate actions in ${client.year}. Measured with Greenly.`;
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}">`,
    `<meta name="description" content="${escapeHtml(desc)}">`,
  ];
  if (pageUrl) tags.push(`<meta property="og:url" content="${escapeHtml(pageUrl)}">`);
  // NOTE: og:image intentionally omitted — needs a pre-rendered share card
  // PNG per client. See README "Next steps". Without it, LinkedIn shows a
  // text-only preview (title + description), which still works.
  return tags.join('\n');
}

function renderClient(template, client) {
  const title = `${client.companyName} · ${client.year} Climate Wrapped`;
  const pageUrl = BASE_URL ? `${BASE_URL}/${client.slug}.html` : '';
  // Only the fields the template consumes get shipped to the browser.
  const payload = {
    companyName: client.companyName,
    year: client.year,
    totalEmissionsTons: client.totalEmissionsTons,
    reductionPercent: client.reductionPercent,
    actionsCompleted: client.actionsCompleted,
    topAction: client.topAction,
    percentileRank: client.percentileRank,
    industry: client.industry,
    standoutMonth: client.standoutMonth,
    co2SavedEquivalent: client.co2SavedEquivalent,
  };
  return template
    .replace('__TITLE__', escapeHtml(title))
    .replace('__OG_TAGS__', ogTags(client, pageUrl))
    // JSON is valid JS; </script> guard prevents early script termination.
    .replace('__CLIENT_DATA_JSON__', JSON.stringify(payload).replace(/<\/script>/gi, '<\\/script>'));
}

function renderIndex(clients) {
  const cards = clients.map(c => {
    const href = `${c.slug}.html`;
    return `    <a class="card" href="${escapeHtml(href)}">
      <div class="card-industry">${escapeHtml(c.industry)}</div>
      <div class="card-name">${escapeHtml(c.companyName)}</div>
      <div class="card-stat">-${escapeHtml(String(c.reductionPercent))}% emissions &middot; ${escapeHtml(String(c.actionsCompleted))} actions</div>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Greenly Climate Wrapped</title>
<style>
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; padding:48px 20px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:radial-gradient(circle at 30% 10%, #1f3d2b, #050705 70%); color:#fff;
  }
  .wrap{ max-width:900px; margin:0 auto; }
  .logo-chip{ display:flex; align-items:center; gap:8px; font-weight:700; opacity:.85; margin-bottom:28px; }
  .logo-chip .dot{ width:10px; height:10px; border-radius:50%; background:#1DB954; }
  h1{ font-size:2rem; margin:0 0 6px; }
  .sub{ opacity:.7; margin:0 0 32px; }
  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
  .card{
    display:block; text-decoration:none; color:#fff;
    background:linear-gradient(160deg,#0f2e1c,#071c11 70%);
    border:1px solid rgba(255,255,255,.12); border-radius:18px; padding:22px;
    transition:transform .15s ease, border-color .15s ease;
  }
  .card:hover{ transform:translateY(-3px); border-color:rgba(29,185,84,.6); }
  .card-industry{ letter-spacing:2px; text-transform:uppercase; font-size:.65rem; opacity:.6; margin-bottom:10px; }
  .card-name{ font-size:1.3rem; font-weight:800; margin-bottom:8px; }
  .card-stat{ font-size:.85rem; opacity:.8; }
  footer{ margin-top:40px; font-size:.75rem; opacity:.5; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="logo-chip"><span class="dot"></span>Greenly Wrapped</div>
    <h1>2026 Climate Wrapped</h1>
    <p class="sub">${clients.length} client stories &middot; tap any card to view</p>
    <div class="grid">
${cards}
    </div>
    <footer>Demo build &middot; mock data only.</footer>
  </div>
</body>
</html>
`;
}

function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf8'));

  // Clean + recreate dist/
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const seen = new Set();
  clients.forEach((client, i) => {
    if (!client.slug) client.slug = slugify(client.companyName) || `client-${i + 1}`;
    if (seen.has(client.slug)) throw new Error(`Duplicate slug: ${client.slug}`);
    seen.add(client.slug);

    const html = renderClient(template, client);
    fs.writeFileSync(path.join(DIST, `${client.slug}.html`), html);
    console.log(`  ✓ ${client.slug}.html  (${client.companyName})`);
  });

  fs.writeFileSync(path.join(DIST, 'index.html'), renderIndex(clients));
  // .nojekyll so GitHub Pages serves files verbatim (no Jekyll processing).
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
  console.log(`  ✓ index.html  (${clients.length} clients)`);
  console.log(`\nBuilt ${clients.length} pages into dist/${BASE_URL ? `  [base: ${BASE_URL}]` : '  [relative URLs — set SITE_BASE_URL for absolute OG tags]'}`);
}

main();
