import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const command = fileURLToPath(new URL('../scripts/prototype3d-lan.mjs', import.meta.url));

function runCheck(corrupt?: 'page' | 'data' | 'model') {
  const root = mkdtempSync(join(tmpdir(), 'cv3d-check-fixture-'));
  try {
    const assets = join(root, 'dist', 'assets', 'prototype3d');
    const data = join(root, 'dist', 'data');
    const scratch = join(root, 'tmp');
    const existing = join(root, '.prototype3d-playtests');
    for (const dir of [assets, data, scratch, existing]) mkdirSync(dir, { recursive: true });
    const old = join(existing, 'previous-report.jsonl');
    writeFileSync(old, '{"synthetic":"previous"}\n');
    writeFileSync(
      join(root, 'dist', 'prototype-3d.html'),
      corrupt === 'page' ? '<html></html>' : '<button id="measure-save"></button>',
    );
    writeFileSync(
      join(data, 'prototype3d.json'),
      corrupt === 'data' ? '{}' : '{"stepSec":0.016,"platforms":[]}',
    );
    // Minimal synthetic GLB envelope. This check is not a GLB rendering/geometry test.
    const model = Buffer.alloc(12);
    model.write('glTF', 0);
    model.writeUInt32LE(2, 4);
    model.writeUInt32LE(model.length, 8);
    writeFileSync(join(assets, 'terrain-kit.glb'), model);
    writeFileSync(join(assets, 'kai.glb'), corrupt === 'model' ? '<html></html>' : model);
    const result = spawnSync(process.execPath, [command, '--check'], {
      cwd: root,
      env: {
        ...process.env,
        CV_PROTOTYPE3D_SESSION: 'not-a-real-session',
        TMPDIR: scratch,
        TEMP: scratch,
        TMP: scratch,
      },
      encoding: 'utf8',
      timeout: 15_000,
    });
    if (result.error) throw result.error;
    expect(readdirSync(scratch)).toEqual([]);
    expect(readdirSync(existing)).toEqual(['previous-report.jsonl']);
    expect(readFileSync(old, 'utf8')).toBe('{"synthetic":"previous"}\n');
    return result;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('ST-22-07 LAN preflight CLI', () => {
  it('uses the real HTTP receiver and leaves existing reports alone', () => {
    const result = runCheck();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('HTTP 201 và đúng một dòng JSONL.');
    expect(result.stdout).toContain('Chưa thử Wi-Fi hay điện thoại.');
  });

  it.each([
    ['page', 'thiếu trang hoặc biểu mẫu'],
    ['data', 'không đúng cấu trúc'],
    ['model', 'thiếu model kai.glb'],
  ] as const)('fails closed on a misleading %s response', (corrupt, message) => {
    const result = runCheck(corrupt);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(message);
    expect(result.stdout).not.toContain('Kiểm cục bộ đạt');
  });

  it('acknowledges a retry once across concurrent requests and a receiver restart', async () => {
    const root = mkdtempSync(join(tmpdir(), 'cv3d-retry-fixture-'));
    const session = '0'.repeat(24);
    const id = 'a'.repeat(32);
    const legacy = { version: 1, page: 'prototype-3d', metrics: { frames: 3 } };
    const first = { ...legacy, submissionId: id };
    const separate = { ...legacy, submissionId: 'b'.repeat(32) };
    const result = join(root, '.prototype3d-playtests', `${session}.jsonl`);
    let child: ReturnType<typeof spawn> | undefined;
    const stop = async () => {
      if (child && child.exitCode === null && child.signalCode === null) {
        const done = once(child, 'exit');
        child.kill();
        await done;
      }
    };
    try {
      mkdirSync(join(root, 'dist'));
      mkdirSync(join(root, '.prototype3d-playtests'));
      writeFileSync(join(root, 'dist', 'index.html'), '<html></html>');
      writeFileSync(result, JSON.stringify(legacy)); // Also preserve a valid last line without LF.
      const probe = createServer();
      probe.listen(0, '127.0.0.1');
      await once(probe, 'listening');
      const address = probe.address();
      if (address === null || typeof address === 'string') throw new Error('Missing loopback port');
      const { port } = address;
      probe.close();
      await once(probe, 'close');
      const origin = `http://127.0.0.1:${port}`;
      const start = async () => {
        child = spawn(process.execPath, [command, '127.0.0.1', String(port)], {
          cwd: root,
          env: { ...process.env, CV_PROTOTYPE3D_SESSION: session },
          stdio: ['ignore', 'pipe', 'inherit'],
        });
        await Promise.race([
          once(child.stdout!, 'data'),
          once(child, 'exit').then(() => {
            throw new Error('Receiver exited before listening');
          }),
        ]);
      };
      const post = (body: unknown) =>
        fetch(`${origin}/__prototype3d-report`, {
          method: 'POST',
          headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            'X-Playtest-Session': session,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
      const rows = (): unknown[] =>
        readFileSync(result, 'utf8')
          .trimEnd()
          .split('\n')
          .map((s) => JSON.parse(s));
      await start();
      const receipts = await Promise.all([post(first), post(first)]);
      expect(receipts.map((r) => r.status)).toEqual([201, 201]);
      expect(rows()).toEqual([legacy, first]);
      await stop();

      await start();
      expect((await post(first)).status).toBe(201);
      expect((await post({ ...first, metrics: { frames: 4 } })).status).toBe(409);
      expect((await post({ ...first, submissionId: 'invalid' })).status).toBe(400);
      expect((await post(separate)).status).toBe(201);
      expect(rows()).toEqual([legacy, first, separate]);
    } finally {
      await stop();
      rmSync(root, { recursive: true, force: true });
    }
  }, 15_000);
});
