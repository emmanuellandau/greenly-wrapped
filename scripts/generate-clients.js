#!/usr/bin/env node
/* Deterministic mock-data generator for clients.json.
   Produces 50 varied clients across industries/sizes/performance.
   Deterministic (seeded) so re-running yields the same set.
   Usage:  node scripts/generate-clients.js [count]  */

const fs = require('fs');
const path = require('path');

const COUNT = parseInt(process.argv[2], 10) || 50;
const YEAR = 2026;

// Simple seeded PRNG (mulberry32) — reproducible, no Math.random.
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260101);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => Math.round(lo + rand() * (hi - lo));

// 60 distinct company names (first-come, we slice to COUNT).
const NAMES = [
  'Acme Corp', 'Lumen Retail', 'Nordhaus Logistics', 'Brightwave Tech', 'Maison Verte',
  'Vantage Steelworks', 'Cumulus Cloud', 'Harbor & Finch', 'Solaris Energy', 'Verdant Foods',
  'Ironclad Industries', 'Pine Ridge Builders', 'Astra Pharma', 'Meridian Bank', 'Northstar Freight',
  'Clearwater Beverages', 'Quantum Textiles', 'Greenfield Agri', 'Helios Motors', 'Cobalt Systems',
  'Riverstone Hotels', 'Apex Chemicals', 'Lantern Media', 'Fjord Shipping', 'Sable & Crow',
  'Terra Cement', 'Novaplast Packaging', 'Evergreen Timber', 'Monarch Airlines', 'Pixel Forge',
  'Granite Mining', 'Aurora Dairy', 'Beacon Insurance', 'Driftwood Apparel', 'Summit Pharma',
  'Copperline Electric', 'Hollow Oak Brewing', 'Vertex Robotics', 'Meadowlark Farms', 'Union Rail',
  'Silverline Telecom', 'Cascade Paper', 'Bluepeak Software', ' Portside Seafood', 'Emberstone Glass',
  'Highgate Retail Group', 'Lotus Cosmetics', 'Redwood Construction', 'Atlas Freightways', 'Celeste Fashion',
  'Nimbus Data Centers', 'Ravenwood Furniture', 'Sunfield Solar', 'Tidal Energy', 'Gearhart Auto Parts',
  'Willowbrook Foods', 'Pinnacle Logistics', 'Zephyr Textiles', 'Oakhaven Bank', 'Starlite Hospitality',
];

// Industry → plausible emission range + fitting standout actions.
const INDUSTRIES = {
  'Manufacturing':   { lo: 800,   hi: 28000, actions: ['Switched 4 facilities to renewable electricity', 'Recovered waste heat across 3 plants', 'Cut scope-2 emissions with on-site solar'] },
  'Retail':          { lo: 1500,  hi: 16000, actions: ['Cut air freight on 60% of inbound logistics', 'Switched the store fleet to EVs', 'Moved private-label packaging to recycled materials'] },
  'Transportation':  { lo: 5000,  hi: 42000, actions: ['Electrified 35% of the last-mile fleet', 'Optimized routing to cut idle miles 18%', 'Switched regional haul to biodiesel'] },
  'Software':        { lo: 90,    hi: 1400,  actions: ['Moved all workloads to carbon-aware data centers', 'Right-sized cloud infra, cutting compute 40%', 'Shifted to 100% renewable-powered regions'] },
  'Food & Beverage': { lo: 1500,  hi: 13000, actions: ['Shifted 70% of sourcing to local suppliers', 'Cut refrigeration leaks across the cold chain', 'Reformulated packaging to lower-carbon materials'] },
  'Construction':    { lo: 3000,  hi: 50000, actions: ['Switched to low-carbon cement on 5 sites', 'Electrified heavy equipment fleet', 'Diverted 80% of demolition waste from landfill'] },
  'Finance':         { lo: 250,   hi: 4500,  actions: ['Decarbonized the corporate real-estate portfolio', 'Set financed-emissions reduction targets', 'Moved data centers to renewable power'] },
  'Healthcare':      { lo: 1000,  hi: 10000, actions: ['Cut anaesthetic gas emissions by 45%', 'Retrofitted facilities for heat efficiency', 'Switched medical logistics to EVs'] },
  'Energy':          { lo: 9000,  hi: 80000, actions: ['Brought a 40MW solar array online', 'Cut methane flaring by 60%', 'Retired the last coal-fired unit'] },
  'Hospitality':     { lo: 900,   hi: 9000,  actions: ['Converted 12 properties to heat pumps', 'Cut food waste 50% across kitchens', 'Switched to 100% renewable electricity'] },
  'Agriculture':     { lo: 2000,  hi: 22000, actions: ['Adopted regenerative practices on 60% of land', 'Cut synthetic fertilizer use by 35%', 'Installed methane digesters on dairy sites'] },
  'Pharmaceuticals': { lo: 1500,  hi: 16000, actions: ['Switched API synthesis to greener solvents', 'Electrified process heat at 2 plants', 'Cut cold-chain emissions with route redesign'] },
};
const INDUSTRY_KEYS = Object.keys(INDUSTRIES);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function equivalent(tons, reduction) {
  const saved = Math.max(1, Math.round(tons * (reduction / 100)));
  const options = [
    `${Math.round(saved / 4.6)} cars off the road for a year`,
    `${Math.round(saved / 6)} homes' yearly energy use`,
    `${(saved / 1000).toFixed(1)}k tons of CO2e avoided`,
    `${Math.round(saved * 16)} trees grown for a decade`,
  ];
  return pick(options);
}

function slugify(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const names = NAMES.slice(0, COUNT);
const seen = new Set();
const clients = names.map((companyName) => {
  const industry = INDUSTRY_KEYS[Math.floor(rand() * INDUSTRY_KEYS.length)];
  const spec = INDUSTRIES[industry];
  const totalEmissionsTons = between(spec.lo, spec.hi);
  const reductionPercent = between(3, 34);
  let slug = slugify(companyName);
  while (seen.has(slug)) slug += '-co';
  seen.add(slug);
  return {
    slug,
    companyName: companyName.trim(),
    year: YEAR,
    totalEmissionsTons,
    reductionPercent,
    actionsCompleted: between(8, 55),
    topAction: pick(spec.actions),
    percentileRank: between(40, 99),
    industry,
    standoutMonth: pick(MONTHS),
    co2SavedEquivalent: equivalent(totalEmissionsTons, reductionPercent),
  };
});

const out = path.join(__dirname, '..', 'clients.json');
fs.writeFileSync(out, JSON.stringify(clients, null, 2) + '\n');
console.log(`Wrote ${clients.length} clients to clients.json`);
