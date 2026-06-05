import { chromium } from 'playwright';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

interface ApiEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  test_url: string;
  docs_url: string;
  https: boolean;
  auth: string;
  expects: { status: number; content_type: string };
}

interface CorsResult {
  allowed: boolean | null;
  method: 'header' | 'playwright' | 'unknown';
}

interface ApiResult {
  id: string;
  name: string;
  up: boolean;
  https: boolean;
  cors: CorsResult;
  last_checked: string;
  response_ms: number;
  notes: string;
}

const cliArgs = process.argv.slice(2);
const HEADER_ONLY = cliArgs.includes('--header-only');
const ONLY_IDS_ARG = cliArgs.find(a => a.startsWith('--only-ids='));
const ONLY_IDS: string[] | null = ONLY_IDS_ARG ? ONLY_IDS_ARG.split('=')[1].split(',') : null;
const CONCURRENCY = 5;
const REQUEST_TIMEOUT_MS = 10_000;
const PLAYWRIGHT_TIMEOUT_MS = 15_000;

const USER_AGENT = 'keyless-apis-checker/1.0 (+https://github.com/keyless-apis/keyless-apis)';

async function checkHeaders(url: string): Promise<CorsResult> {
  const tryFetch = async (method: string, extraHeaders: Record<string, string> = {}): Promise<Response | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers: { Origin: 'http://localhost', 'User-Agent': USER_AGENT, ...extraHeaders },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      return res;
    } catch {
      clearTimeout(timer);
      return null;
    }
  };

  // Try OPTIONS preflight first
  const optionsRes = await tryFetch('OPTIONS', { 'Access-Control-Request-Method': 'GET' });
  const acao = optionsRes?.headers.get('access-control-allow-origin') ?? null;

  if (acao === '*' || acao === 'http://localhost') return { allowed: true, method: 'header' };
  if (acao && acao.length > 0 && acao !== 'null') return { allowed: false, method: 'header' };

  // Try GET with Origin header as fallback
  const getRes = await tryFetch('GET');
  const acao2 = getRes?.headers.get('access-control-allow-origin') ?? null;

  if (acao2 === '*' || acao2 === 'http://localhost') return { allowed: true, method: 'header' };
  if (acao2 && acao2.length > 0 && acao2 !== 'null') return { allowed: false, method: 'header' };

  return { allowed: null, method: 'unknown' };
}

function startTestServer(targetUrl: string): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const html = `<!DOCTYPE html><html><head><title>CORS_TEST</title></head><body><script>
fetch(${JSON.stringify(targetUrl)}, { mode: 'cors' })
  .then(() => { document.title = 'CORS_OK'; })
  .catch(e => { document.title = 'CORS_FAIL:' + e.message; });
</script></body></html>`;

    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, port: addr.port });
    });
  });
}

async function checkPlaywright(url: string): Promise<CorsResult> {
  const { server, port } = await startTestServer(url);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, timeout: 30_000 });
  } catch {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    return { allowed: null, method: 'unknown' };
  }

  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { timeout: PLAYWRIGHT_TIMEOUT_MS });

    const title = await page
      .waitForFunction(() => document.title !== 'CORS_TEST', { timeout: PLAYWRIGHT_TIMEOUT_MS })
      .then(() => page.title())
      .catch(() => 'TIMEOUT');

    if (title === 'CORS_OK') return { allowed: true, method: 'playwright' };
    if (title.startsWith('CORS_FAIL')) return { allowed: false, method: 'playwright' };
    return { allowed: null, method: 'unknown' };
  } catch {
    return { allowed: null, method: 'unknown' };
  } finally {
    await browser!.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function checkUptime(entry: ApiEntry): Promise<{ up: boolean; response_ms: number; notes: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(entry.test_url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
    const response_ms = Date.now() - start;

    // http-cat returns 404 by design — check against expects.status
    const up = res.status === entry.expects.status || (res.status >= 200 && res.status < 300 && entry.expects.status === 200);
    const notes = up ? '' : `HTTP ${res.status} (expected ${entry.expects.status})`;
    return { up, response_ms, notes };
  } catch (e: unknown) {
    clearTimeout(timer);
    const response_ms = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    const notes = msg.includes('abort') || msg.includes('signal') ? 'timeout' : `fetch error: ${msg.slice(0, 100)}`;
    return { up: false, response_ms, notes };
  }
}

async function checkApi(entry: ApiEntry): Promise<ApiResult> {
  console.log(`  Checking ${entry.id}...`);

  const { up, response_ms, notes } = await checkUptime(entry);

  let cors: CorsResult = { allowed: null, method: 'unknown' };

  if (up || notes === '') {
    const headerResult = await checkHeaders(entry.test_url);

    if (headerResult.allowed === true) {
      cors = { allowed: true, method: 'header' };
    } else if (headerResult.allowed === false) {
      cors = { allowed: false, method: 'header' };
    } else if (!HEADER_ONLY) {
      cors = await checkPlaywright(entry.test_url);
    }
  }

  const result: ApiResult = {
    id: entry.id,
    name: entry.name,
    up,
    https: entry.https,
    cors,
    last_checked: new Date().toISOString(),
    response_ms,
    notes,
  };

  const corsStr = cors.allowed === true ? '✅ CORS' : cors.allowed === false ? '❌ CORS' : '❓ CORS';
  const upStr = up ? '🟢' : '🔴';
  console.log(`  ${upStr} ${corsStr} [${cors.method}] ${entry.id} (${response_ms}ms)${notes ? ' — ' + notes : ''}`);

  return result;
}

async function runConcurrent<T, R>(items: T[], fn: (item: T) => Promise<R>, limit: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.map((item, i) => ({ item, i }));

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      results[next.i] = await fn(next.item);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const apisPath = path.join(ROOT, 'data', 'apis.json');
  const { apis }: { apis: ApiEntry[] } = JSON.parse(fs.readFileSync(apisPath, 'utf-8'));

  const targets = ONLY_IDS ? apis.filter(a => ONLY_IDS!.includes(a.id)) : apis;

  console.log(`\nkeyless-apis checker`);
  console.log(`  APIs to check: ${targets.length}`);
  console.log(`  Mode: ${HEADER_ONLY ? 'header-only' : 'hybrid (header + Playwright)'}`);
  console.log(`  Concurrency: ${CONCURRENCY}\n`);

  const results = await runConcurrent(targets, checkApi, CONCURRENCY);

  const summary = {
    total: results.length,
    up: results.filter(r => r.up).length,
    cors_ok: results.filter(r => r.cors.allowed === true).length,
    cors_unknown: results.filter(r => r.cors.allowed === null).length,
    cors_fail: results.filter(r => r.cors.allowed === false).length,
  };

  const output = {
    generated: new Date().toISOString(),
    summary,
    results,
  };

  const resultsDir = path.join(ROOT, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'status.json'), JSON.stringify(output, null, 2));

  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Up:          ${summary.up}/${summary.total}`);
  console.log(`  CORS OK:     ${summary.cors_ok}`);
  console.log(`  CORS unknown: ${summary.cors_unknown}`);
  console.log(`  CORS fail:   ${summary.cors_fail}`);
  console.log(`\n  Written: results/status.json`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
