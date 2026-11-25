import { createHash, randomBytes } from 'node:crypto';
import { appendFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { isIPv4 } from 'node:net';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview } from 'vite';

const check = process.argv[2] === '--check';
const host = check ? '127.0.0.1' : process.argv[2];
const port = check ? 0 : Number(process.argv[3] ?? 4187);
if (
  !check &&
  (!host ||
    !isIPv4(host) ||
    (host !== '127.0.0.1' &&
      !Object.values(networkInterfaces())
        .flat()
        .some((item) => item?.address === host)) ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535)
) {
  throw new Error('Cần địa chỉ IPv4 của máy và cổng 1024–65535.');
}

// Kiểm thử chỉ dùng địa chỉ loopback, mã mới và thư mục tạm; không dùng phiên đang mở.
const session =
  (check ? undefined : process.env.CV_PROTOTYPE3D_SESSION) ?? randomBytes(12).toString('hex');
if (!/^[\da-f]{24}$/.test(session)) throw new Error('Mã phiên phải có 24 ký tự hex.');
const directory = check
  ? await mkdtemp(join(tmpdir(), 'cv3d-preflight-'))
  : join(process.cwd(), '.prototype3d-playtests');
await mkdir(directory, { recursive: true, mode: 0o700 });
const output = join(directory, `${session}.jsonl`);
const limit = 8192;
const validId = (id) => typeof id === 'string' && /^[\da-f]{32}$/.test(id);
const digest = (json) => createHash('sha256').update(json).digest('hex');
let ledger;
let writeQueue = Promise.resolve();

async function loadLedger() {
  let file;
  try {
    file = await readFile(output, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    file = '';
  }
  const ids = new Map();
  for (const line of file.split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (validId(row?.submissionId)) ids.set(row.submissionId, digest(JSON.stringify(row)));
  }
  return { ids, needsBreak: file.length > 0 && !file.endsWith('\n') };
}

function saveReport(report) {
  const saved = writeQueue.then(async () => {
    ledger ??= await loadLedger();
    const id = report.submissionId;
    const entry = JSON.stringify(report);
    const hash = validId(id) ? digest(entry) : undefined;
    const previous = ledger.ids.get(id);
    if (previous !== undefined) return previous === hash ? 201 : 409;
    try {
      await appendFile(output, `${ledger.needsBreak ? '\n' : ''}${entry}\n`, { mode: 0o600 });
    } catch (error) {
      ledger = undefined; // Lần sau đọc lại tệp nếu lần ghi này chỉ hoàn tất một phần.
      throw error;
    }
    ledger.needsBreak = false;
    if (hash !== undefined) ledger.ids.set(id, hash);
    return 201;
  });
  // Một lỗi ghi không chặn các yêu cầu chờ phía sau; giữ thứ tự kiểm mã và ghi.
  writeQueue = saved.catch(() => {});
  return saved;
}

const serve = () =>
  preview({
    preview: { host, port, strictPort: true },
    plugins: [
      {
        name: 'prototype3d-lan-report',
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('Cache-Control', 'no-store');
            if (req.url !== '/__prototype3d-report') return next();
            if (
              req.method !== 'POST' ||
              req.headers.origin !== `http://${host}:${req.socket.localPort}` ||
              req.headers['x-playtest-session'] !== session ||
              req.headers['content-type'] !== 'application/json'
            ) {
              res.writeHead(403).end();
              return;
            }
            let body = '';
            req.setEncoding('utf8');
            req.on('error', () => res.destroy());
            req.on('data', (chunk) => {
              body += chunk;
              if (Buffer.byteLength(body) <= limit) return;
              res.writeHead(413).end();
              req.destroy();
            });
            req.on('end', async () => {
              let report;
              try {
                report = JSON.parse(body);
                if (report?.version !== 1 || report.page !== 'prototype-3d' || !report.metrics)
                  throw new Error('Báo cáo sai định dạng');
                if (report.submissionId !== undefined && !validId(report.submissionId))
                  throw new Error('Mã lần gửi sai định dạng');
              } catch {
                res.writeHead(400).end();
                return;
              }
              try {
                res.writeHead(await saveReport(report)).end();
              } catch {
                res.writeHead(500).end();
              }
            });
          });
        },
      },
    ],
  });

async function verify(origin) {
  const get = (path) => fetch(new URL(path, origin), { signal: AbortSignal.timeout(5000) });
  const page = await get('/prototype-3d.html?measure=1');
  if (
    page.status !== 200 ||
    !page.headers.get('content-type')?.includes('text/html') ||
    page.headers.get('cache-control') !== 'no-store' ||
    !(await page.text()).includes('id="measure-save"')
  ) {
    throw new Error('Bản build thiếu trang hoặc biểu mẫu Trạm phản lực; chạy lại npm run build.');
  }
  const config = await get('/data/prototype3d.json');
  if (config.status !== 200 || !config.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Bản build thiếu dữ liệu phòng thử 3D; chạy lại npm run build.');
  }
  const data = await config.json();
  if (!Number.isFinite(data?.stepSec) || !Array.isArray(data?.platforms)) {
    throw new Error('Dữ liệu phòng thử 3D không đúng cấu trúc.');
  }
  for (const name of ['kai', 'terrain-kit']) {
    const model = await get(`/assets/prototype3d/${name}.glb`);
    const bytes = Buffer.from(await model.arrayBuffer());
    if (
      model.status !== 200 ||
      bytes.length < 12 ||
      bytes.toString('ascii', 0, 4) !== 'glTF' ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length
    ) {
      throw new Error(`Bản build thiếu model ${name}.glb hoặc trả về trang HTML.`);
    }
  }

  const report = JSON.stringify({
    version: 1,
    page: 'prototype-3d',
    submissionId: randomBytes(16).toString('hex'),
    quality: 'default',
    art: 'glb',
    metrics: {
      loadMs: 125,
      fpsAverage: 50,
      fpsMedian: 49.4,
      slowFramePct: 0,
      frames: 3,
      activeMs: 60,
    },
    run: {
      finished: false,
      elapsedSec: 0.06,
      checkpoint: 0,
      falls: 0,
      fallsBySection: { cross: 0, relay: 0, ridge: 0, exit: 0 },
    },
    feedback: { device: 'Synthetic loopback preflight' },
  });
  const post = (body, key = session, source = origin) =>
    fetch(new URL('/__prototype3d-report', origin), {
      method: 'POST',
      headers: { Origin: source, 'Content-Type': 'application/json', 'X-Playtest-Session': key },
      body,
      signal: AbortSignal.timeout(5000),
    });
  if (
    (await post(report, 'wrong-session')).status !== 403 ||
    (await post(report, session, 'null')).status !== 403
  ) {
    throw new Error('Đường nhận không loại mã phiên hoặc origin sai.');
  }
  if ((await post('{')).status !== 400) throw new Error('Đường nhận không loại JSON hỏng.');
  if ((await post(report)).status !== 201)
    throw new Error('Đường nhận chưa trả biên nhận HTTP 201.');
  const retries = await Promise.all([post(report), post(report)]);
  if (retries.some((response) => response.status !== 201)) {
    throw new Error('Gửi lại cùng báo cáo phải nhận HTTP 201 mà không tạo thêm dòng.');
  }
  const changed = JSON.stringify({ ...JSON.parse(report), feedback: { device: 'Changed' } });
  if ((await post(changed)).status !== 409)
    throw new Error('Đường nhận không loại mã bị dùng lại.');
  if ((await readFile(output, 'utf8')) !== `${report}\n`) {
    throw new Error('Tệp báo cáo phải có đúng một dòng JSONL khớp dữ liệu thử.');
  }
}

if (!check) {
  await serve();
  const origin = `http://${host}:${port}`;
  console.log(`Điện thoại: ${origin}/prototype-3d.html?measure=1&session=${session}`);
  console.log(`Kết quả: ${output}`);
} else {
  let server;
  try {
    server = await serve();
    const address = server.httpServer.address();
    if (address === null || typeof address === 'string')
      throw new Error('Không mở được cổng kiểm tra.');
    await verify(`http://${host}:${address.port}`);
    console.log(
      'Kiểm cục bộ đạt: trang, dữ liệu, hai model GLB, quyền gửi, HTTP 201 và đúng một dòng JSONL. Chưa thử Wi-Fi hay điện thoại.',
    );
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
