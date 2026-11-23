import { randomBytes } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { isIPv4 } from 'node:net';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { preview } from 'vite';

const host = process.argv[2];
const port = Number(process.argv[3] ?? 4187);
if (
  !host ||
  !isIPv4(host) ||
  !Object.values(networkInterfaces())
    .flat()
    .some((item) => item?.address === host) ||
  !Number.isInteger(port) ||
  port < 1024 ||
  port > 65535
) {
  throw new Error('Cần địa chỉ IPv4 của máy và cổng 1024–65535.');
}

const origin = `http://${host}:${port}`;
const session = process.env.CV_PROTOTYPE3D_SESSION ?? randomBytes(12).toString('hex');
if (!/^[\da-f]{24}$/.test(session)) throw new Error('Mã phiên phải có 24 ký tự hex.');
const directory = join(process.cwd(), '.prototype3d-playtests');
await mkdir(directory, { recursive: true, mode: 0o700 });
const output = join(directory, `${session}.jsonl`);
const limit = 8192;

await preview({
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
            req.headers.origin !== origin ||
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
            } catch {
              res.writeHead(400).end();
              return;
            }
            try {
              await appendFile(output, `${JSON.stringify(report)}\n`, { mode: 0o600 });
              res.writeHead(201).end();
            } catch {
              res.writeHead(500).end();
            }
          });
        });
      },
    },
  ],
});

console.log(`Điện thoại: ${origin}/prototype-3d.html?measure=1&session=${session}`);
console.log(`Kết quả: ${output}`);
