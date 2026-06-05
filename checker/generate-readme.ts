import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

interface CorsResult {
  allowed: boolean | null;
  method: string;
}

interface ApiResult {
  id: string;
  name: string;
  up: boolean;
  cors: CorsResult;
  last_checked: string;
  response_ms: number;
  notes: string;
}

interface StatusFile {
  generated: string;
  summary: {
    total: number;
    up: number;
    cors_ok: number;
    cors_unknown: number;
    cors_fail: number;
  };
  results: ApiResult[];
}

interface ApiEntry {
  id: string;
  name: string;
  category: string;
  docs_url: string;
}

function corsEmoji(allowed: boolean | null): string {
  if (allowed === true) return '✅';
  if (allowed === false) return '❌';
  return '❓';
}

function corsLabel(allowed: boolean | null, method: string): string {
  const emoji = corsEmoji(allowed);
  const label = allowed === true ? 'Yes' : allowed === false ? 'No' : 'Unknown';
  return `${emoji} ${label} *(${method})*`;
}

function upEmoji(up: boolean): string {
  return up ? '🟢' : '🔴';
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

async function main() {
  const statusPath = path.join(ROOT, 'results', 'status.json');
  const apisPath = path.join(ROOT, 'data', 'apis.json');
  const readmePath = path.join(ROOT, 'README.md');

  if (!fs.existsSync(statusPath)) {
    console.error('results/status.json not found — run `npm run check` first');
    process.exit(1);
  }

  const status: StatusFile = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const { apis }: { apis: ApiEntry[] } = JSON.parse(fs.readFileSync(apisPath, 'utf-8'));
  const apiMap = new Map(apis.map(a => [a.id, a]));

  const pct = Math.round((status.summary.up / status.summary.total) * 100);
  const color = pct >= 80 ? 'brightgreen' : pct >= 50 ? 'yellow' : 'red';
  const badgeLine = `![API Status](https://img.shields.io/badge/APIs-${pct}%25%20live-${color})  ![Last Check](https://img.shields.io/badge/last%20check-${status.generated.slice(0, 10).replace(/-/g, '--')}-blue)`;

  // Group by category, sorted alphabetically
  const grouped = new Map<string, typeof status.results>();
  for (const r of status.results) {
    const cat = apiMap.get(r.id)?.category ?? 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(r);
  }
  const sortedCategories = [...grouped.keys()].sort();

  const tableRows: string[] = [];
  for (const cat of sortedCategories) {
    tableRows.push(`| **${cat}** | | | | |`);
    for (const r of grouped.get(cat)!) {
      const entry = apiMap.get(r.id);
      const nameLink = entry ? `[${entry.name}](${entry.docs_url})` : r.name;
      tableRows.push(`| ${nameLink} | | ${corsLabel(r.cors.allowed, r.cors.method)} | ${upEmoji(r.up)} | ${formatDate(r.last_checked)} |`);
    }
  }

  const table = [
    '| Name | | CORS | Status | Last Checked |',
    '|------|---|------|:------:|:------------:|',
    ...tableRows,
  ].join('\n');

  let readme = fs.readFileSync(readmePath, 'utf-8');

  readme = readme.replace(
    /<!-- BADGE:START -->[\s\S]*?<!-- BADGE:END -->/,
    `<!-- BADGE:START -->\n${badgeLine}\n<!-- BADGE:END -->`
  );

  readme = readme.replace(
    /<!-- STATUS:START -->[\s\S]*?<!-- STATUS:END -->/,
    `<!-- STATUS:START -->\n*Last generated: ${status.generated} — ${status.summary.up}/${status.summary.total} APIs live, ${status.summary.cors_ok} CORS-verified*\n\n${table}\n<!-- STATUS:END -->`
  );

  fs.writeFileSync(readmePath, readme);
  console.log(`README updated. ${status.summary.up}/${status.summary.total} APIs live (${pct}%). CORS OK: ${status.summary.cors_ok}.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
