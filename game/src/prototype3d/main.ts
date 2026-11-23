import { parsePrototype3d } from '../core/prototype3d-config';
import { FixedStep } from '../logic/fixed-step';
import { PrototypeRoom, type Objective3 } from '../logic/prototype3d/room';
import { PrototypeInput } from './input';
import { loadModels } from './models';
import { PrototypeView } from './view';
import './style.css';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'finished' | 'error';

const OBJECTIVES: Record<Objective3, readonly [string, string]> = {
  cross: ['Vượt dãy bục đầu', 'Theo mũi tên và nhảy sang bục lệch chiều sâu.'],
  relay: ['Bắn lõi màu hổ phách', 'Hướng Kai về phía lõi để mở cổng.'],
  ridge: ['Lên sàn trên', 'Qua khúc cua bên phải rồi nhảy qua hai bục.'],
  exit: ['Tới vòng thoát', 'Theo mũi tên qua vòng cầu đến sàn cuối.'],
};

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Thiếu phần tử ${id}`);
  return found as T;
}

const canvas = element<HTMLCanvasElement>('viewport');
const pause = element<HTMLButtonElement>('pause');
const proceed = element<HTMLButtonElement>('proceed');
const restart = element<HTMLButtonElement>('restart');
const briefing = element('briefing');
const mission = element('mission');
const toast = element('toast');
const time = element('time');
const liveStats = element('live-stats');
const checkpoints = element('checkpoints');
const objective = element('objective-text');
const detail = element('objective-detail');
const title = element('brief-title');
const description = element('brief-description');
const results = element('results');
const touch = element('touch');
const input = new PrototypeInput(
  element('steer'),
  element('jump'),
  element('dash'),
  element('shoot'),
);
const params = new URLSearchParams(location.search);
const gray = params.get('gray') === '1';
const low = params.get('q') === 'low';

let phase: Phase = 'loading';
let world: PrototypeRoom | undefined;
let clock: FixedStep | undefined;
let view: PrototypeView | undefined;
let toastUntil = 0;
let lastObjective: Objective3 | undefined;
let lastFrame = 0;

function labelTime(seconds: number) {
  const elapsed = Math.floor(seconds);
  return `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

function setText(node: HTMLElement, value: string) {
  if (node.textContent !== value) node.textContent = value;
}

function phaseTo(value: Phase, error?: string) {
  phase = value;
  document.body.dataset.phase = value;
  input.enabled = value === 'playing';
  input.clear();
  clock?.reset();
  const live = value === 'playing';
  liveStats.hidden = !(live || value === 'paused' || value === 'finished');
  mission.hidden = !live;
  pause.hidden = !live;
  touch.hidden = !live;
  briefing.hidden = live;
  results.hidden = value !== 'finished';
  proceed.hidden = value === 'loading';
  restart.hidden = value !== 'paused';
  toast.hidden = true;
  if (live) return;
  const headings = {
    loading: ['Trạm phản lực', 'Đang nạp phòng thử…', ''],
    ready: ['Trạm phản lực', 'Nhảy qua các bục, bắn mở cổng và tới vòng thoát.', 'Bắt đầu'],
    paused: ['Tạm dừng', 'Kai đang đợi tại vị trí hiện tại.', 'Tiếp tục'],
    finished: ['Đã tới đích', 'Hoàn thành tuyến vượt chướng ngại của Kai.', 'Chơi lại'],
    error: ['Không mở được phòng', error ?? 'Có lỗi khi nạp phòng thử.', 'Thử lại'],
  } as const;
  const [header, copy, button] = headings[value];
  title.textContent = header;
  description.textContent = copy;
  proceed.textContent = button;
  if (value === 'finished' && world) {
    element('result-time').textContent = labelTime(world.elapsed);
    element('result-falls').textContent = String(world.falls);
    element('result-shots').textContent = String(world.shots);
  }
}

function start() {
  if (!world) return;
  world = new PrototypeRoom(world.config);
  view?.reset();
  lastObjective = undefined;
  phaseTo('playing');
}

function proceedWithPhase() {
  if (phase === 'ready' || phase === 'finished') start();
  else if (phase === 'paused') phaseTo('playing');
  else if (phase === 'error') location.reload();
}

function announce(text: string, now: number) {
  toast.textContent = text;
  toast.hidden = false;
  toastUntil = now + 1350;
}

function frame(now: number) {
  const dt = Math.min(0.08, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  if (!world || !view || !clock) return;
  if (phase === 'playing') {
    const oldCheckpoint = world.checkpoint,
      oldFalls = world.falls,
      oldRelay = world.relayPowered;
    const steps = clock.advance(dt * 1000);
    for (let i = 0; i < steps; i++)
      world.step(input.read((world.config.camera.yawDeg * Math.PI) / 180));

    setText(time, labelTime(world.elapsed));
    setText(checkpoints, `${world.checkpoint + 1}/${world.config.checkpoints.length}`);
    if (lastObjective !== world.objective) {
      const [goal, description] = OBJECTIVES[world.objective];
      objective.textContent = goal;
      detail.textContent = description;
      lastObjective = world.objective;
    }
    if (world.falls > oldFalls)
      announce(world.checkpoint < 0 ? 'Quay lại điểm xuất phát' : 'Quay lại checkpoint', now);
    else if (world.relayPowered !== oldRelay) announce('Cổng đã mở', now);
    else if (world.checkpoint > oldCheckpoint) announce('Đã lưu checkpoint', now);
    if (now > toastUntil) toast.hidden = true;
    if (world.finished) phaseTo('finished');
  }
  view.render(world, dt, now / 1000, phase === 'ready');
  requestAnimationFrame(frame);
}

proceed.addEventListener('click', proceedWithPhase);
pause.addEventListener('click', () => {
  if (phase === 'playing') phaseTo('paused');
});
restart.addEventListener('click', () => {
  if (phase === 'paused') start();
});
window.addEventListener('keydown', (event) => {
  if (event.repeat || event.altKey || event.metaKey || event.ctrlKey) return;
  if (
    event.code === 'Enter' &&
    phase !== 'playing' &&
    phase !== 'loading' &&
    !(event.target instanceof HTMLButtonElement) &&
    !(event.target instanceof HTMLAnchorElement)
  ) {
    event.preventDefault();
    proceedWithPhase();
  } else if (event.code === 'KeyP' || event.code === 'Escape') {
    if (phase === 'playing') phaseTo('paused');
    else if (phase === 'paused') phaseTo('playing');
  }
});
window.addEventListener('blur', () => {
  if (phase === 'playing') phaseTo('paused');
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') phaseTo('paused');
});
window.addEventListener('resize', resize);
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  view = undefined;
  phaseTo('error', 'Trình duyệt đã ngắt đồ họa. Tải lại để vào phòng thử.');
});

function resize() {
  const bounds = canvas.getBoundingClientRect();
  view?.size(bounds.width, bounds.height);
}

async function boot() {
  const base = new URL('./', location.href);
  try {
    const [raw, models] = await Promise.all([
      fetch(new URL('data/prototype3d.json', base)).then(async (response) => {
        if (!response.ok) throw new Error('Không đọc được dữ liệu phòng thử.');
        return response.json() as Promise<unknown>;
      }),
      gray ? undefined : loadModels(new URL('assets/prototype3d/', base)),
    ]);
    const config = parsePrototype3d(raw);
    world = new PrototypeRoom(config);
    clock = new FixedStep(config.stepSec * 1000, 5);
    view = new PrototypeView(canvas, config, models, low);
    resize();
    element('view-mode').hidden = !gray;
    phaseTo('ready');
    if (params.get('debug') === '1') {
      Object.assign(window, {
        cv3d: () => {
          const w = world!;
          return {
            phase,
            gray,
            low,
            position: { ...w.position },
            grounded: w.grounded,
            facing: { ...w.facing },
            camera: view?.camera.position.toArray(),
            yawDeg: config.camera.yawDeg,
            clip: w.clip,
            elapsed: w.elapsed,
            falls: w.falls,
            shots: w.shots,
            checkpoint: w.checkpoint,
            relayPowered: w.relayPowered,
            aimingAtRelay: w.aimingAtRelay,
            finished: w.finished,
          };
        },
      });
    }
    requestAnimationFrame(frame);
  } catch (error) {
    phaseTo('error', error instanceof Error ? error.message : 'Không thể khởi động phòng thử.');
  }
}

void boot();
