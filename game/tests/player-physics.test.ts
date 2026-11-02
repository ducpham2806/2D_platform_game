import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parsePlayer } from '@/core/player-config';
import { NO_INPUT, type PlayerInput, PlayerPhysics } from '@/logic/player/player-physics';
import { playerParams } from '@/logic/player/player-params';
import { TileMap } from '@/logic/tilemap';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const data = parsePlayer(loadData().player);
const params = playerParams(data, TILE_SIZE, DT);

function make(rows: string[]): PlayerPhysics {
  const map = TileMap.fromRows(rows, TILE_SIZE);
  const spawn = map.spawn!;
  return new PlayerPhysics(params, map, spawn.x, spawn.y, 100);
}

const input = (patch: Partial<PlayerInput>): PlayerInput => ({ ...NO_INPUT, ...patch });

/** Phòng rộng 30 ô, cao 12 ô, sàn ở dòng cuối. */
const OPEN = [
  ...Array.from({ length: 10 }, () => '#............................#'),
  '#P...........................#',
  '##############################',
];

function jumpHeight(pl: PlayerPhysics, holdSteps: number): number {
  const start = pl.bottom;
  let top = start;
  for (let i = 0; i < 120; i += 1) {
    const held = i < holdSteps;
    pl.step(input({ jumpPressed: i === 0, jumpHeld: held }), DT);
    top = Math.min(top, pl.bottom);
    if (i > 2 && pl.grounded) break;
  }
  return start - top;
}

describe('chạy và nhảy (GDD 5.1)', () => {
  it('chạy 5,5 ô/giây', () => {
    const pl = make(OPEN);
    const x0 = pl.centerX;
    for (let i = 0; i < 60; i += 1) pl.step(input({ moveX: 1 }), DT);
    expect((pl.centerX - x0) / TILE_SIZE).toBeCloseTo(5.5, 1);
  });

  it('giữ nút nhảy: cao tối đa 4,5 ô', () => {
    expect(Math.abs(jumpHeight(make(OPEN), 999) / TILE_SIZE - 4.5)).toBeLessThan(0.25);
  });

  it('chạm nhanh 1 bước: cao tối thiểu khoảng 1,2 ô', () => {
    expect(Math.abs(jumpHeight(make(OPEN), 1) / TILE_SIZE - 1.2)).toBeLessThan(0.25);
  });

  it('giữ lâu hơn thì cao hơn (nhảy biến thiên)', () => {
    const short = jumpHeight(make(OPEN), 6);
    const mid = jumpHeight(make(OPEN), 12);
    const full = jumpHeight(make(OPEN), 999);
    expect(short).toBeLessThan(mid);
    expect(mid).toBeLessThan(full);
  });

  it('thời gian lên đỉnh khớp apexSec', () => {
    const pl = make(OPEN);
    let steps = 0;
    pl.step(input({ jumpPressed: true, jumpHeld: true }), DT);
    while (pl.vy < 0) {
      pl.step(input({ jumpHeld: true }), DT);
      steps += 1;
    }
    expect(Math.abs((steps + 1) * DT - data.jump.apexSec)).toBeLessThan(2 * DT);
  });
});

/** Gờ cao 3 ô: Kai đứng trên gờ ở bên trái, bên phải là vực xuống sàn. */
const LEDGE = [
  ...Array.from({ length: 7 }, () => '#............................#'),
  '#P...........................#',
  '#######......................#',
  '#............................#',
  '#............................#',
  '##############################',
];

function stepsUntilAirborne(pl: PlayerPhysics): void {
  for (let i = 0; i < 200 && pl.grounded; i += 1) pl.step(input({ moveX: 1 }), DT);
}

describe('coyote time 0,1 giây', () => {
  it.each([
    [1, true],
    [5, true],
    [8, false],
  ])('bấm nhảy %i bước sau khi rời gờ → nhảy được: %s', (late, expected) => {
    const pl = make(LEDGE);
    stepsUntilAirborne(pl);
    for (let i = 1; i < late; i += 1) pl.step(input({ moveX: 1 }), DT);
    const ev = pl.step(input({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT);
    expect(ev.jumped).toBe(expected);
  });
});

describe('jump buffer 0,12 giây', () => {
  /** Thả rơi từ gờ, trả về bước đáp đất đầu tiên. */
  function landingStep(): number {
    const pl = make(LEDGE);
    stepsUntilAirborne(pl);
    for (let i = 0; i < 200; i += 1) {
      if (pl.step(input({ moveX: 1 }), DT).landed) return i;
    }
    throw new Error('không đáp');
  }

  it.each([
    [3, true],
    [6, true],
    [9, false],
  ])('bấm nhảy %i bước trước khi đáp → tự nhảy khi đáp: %s', (early, expected) => {
    const land = landingStep();
    const pl = make(LEDGE);
    stepsUntilAirborne(pl);
    let jumpedAfterLanding = false;
    let landed = false;
    for (let i = 0; i < land + 6; i += 1) {
      const ev = pl.step(input({ moveX: 1, jumpPressed: i === land - early, jumpHeld: false }), DT);
      if (landed && ev.jumped) jumpedAfterLanding = true;
      if (ev.landed) landed = true;
    }
    expect(jumpedAfterLanding).toBe(expected);
  });
});

describe('lướt 3 ô trong 0,25 giây, hồi 0,6 giây, bất tử 0,1 giây đầu', () => {
  it('đi đúng quãng và thời gian', () => {
    const pl = make(OPEN);
    const x0 = pl.centerX;
    pl.step(input({ dashPressed: true }), DT);
    expect(pl.state).toBe('dash');
    for (let i = 1; i < 15; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.dashing).toBe(false);
    expect(Math.abs((pl.centerX - x0) / TILE_SIZE - 3)).toBeLessThan(0.15);
  });

  it('không lướt lại trước khi hết hồi chiêu', () => {
    const pl = make(OPEN);
    pl.step(input({ dashPressed: true }), DT);
    for (let i = 1; i < 15; i += 1) pl.step(NO_INPUT, DT);
    const cooldownSteps = Math.round(data.dash.cooldownSec / DT);
    for (let i = 0; i < cooldownSteps - 2; i += 1) {
      expect(pl.step(input({ dashPressed: true }), DT).dashed).toBe(false);
    }
    let dashed = false;
    for (let i = 0; i < 4 && !dashed; i += 1)
      dashed = pl.step(input({ dashPressed: true }), DT).dashed;
    expect(dashed).toBe(true);
  });

  it('bất tử trong 0,1 giây đầu của cú lướt', () => {
    const pl = make(OPEN);
    pl.step(input({ dashPressed: true }), DT);
    expect(pl.applyHit(10, pl.centerX + 50)).toBe(false);
    for (let i = 0; i < 6; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.applyHit(10, pl.centerX + 50)).toBe(true);
  });

  it('không lướt trên không khi chưa có kỹ năng', () => {
    const pl = make(OPEN);
    pl.step(input({ jumpPressed: true, jumpHeld: true }), DT);
    pl.step(input({ jumpHeld: true }), DT);
    expect(pl.step(input({ jumpHeld: true, dashPressed: true }), DT).dashed).toBe(false);
  });

  it('nhảy khi đang lướt giữ tốc độ lướt trên không (dash-jump)', () => {
    const pl = make(OPEN);
    pl.step(input({ moveX: 1, dashPressed: true }), DT);
    pl.step(input({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT);
    pl.step(input({ moveX: 1, jumpHeld: true }), DT);
    expect(pl.vx).toBeCloseTo(params.dashSpeed);
    expect(pl.grounded).toBe(false);
  });
});

/** Giếng hẹp cao để thử bám và nhảy tường. */
const WELL = ['#....#', ...Array.from({ length: 9 }, () => '#....#'), '#P...#', '######'];

describe('bám tường và nhảy tường', () => {
  it('trượt tường không nhanh hơn 2 ô/giây khi giữ hướng vào tường', () => {
    const pl = make(WELL);
    pl.step(input({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT);
    let slid = false;
    for (let i = 0; i < 90; i += 1) {
      pl.step(input({ moveX: 1, jumpHeld: true }), DT);
      if (pl.state === 'wall_slide') {
        slid = true;
        expect(pl.vy).toBeLessThanOrEqual(params.wallSlideSpeed + 1e-9);
      }
    }
    expect(slid).toBe(true);
  });

  it('nhảy tường bật ra xa tường và lên cao', () => {
    const pl = make(WELL);
    pl.step(input({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT);
    for (let i = 0; i < 40 && pl.state !== 'wall_slide'; i += 1)
      pl.step(input({ moveX: 1, jumpHeld: true }), DT);
    expect(pl.state).toBe('wall_slide');
    const ev = pl.step(input({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT);
    expect(ev.wallJumped).toBe(true);
    expect(pl.vx).toBeLessThan(0);
    expect(pl.vy).toBeLessThan(0);
    expect(pl.facing).toBe(-1);
  });

  it('leo hết giếng 9 ô chỉ bằng nhảy tường qua lại', () => {
    const pl = make(WELL);
    const startBottom = pl.bottom;
    let dir = 1;
    let best = startBottom;
    for (let i = 0; i < 600; i += 1) {
      const ev = pl.step(
        input({ moveX: dir, jumpPressed: i === 0 || pl.state === 'wall_slide', jumpHeld: true }),
        DT,
      );
      if (ev.wallJumped) dir = -dir;
      best = Math.min(best, pl.bottom);
    }
    expect((startBottom - best) / TILE_SIZE).toBeGreaterThan(8);
  });
});

const ONE_WAY = [
  ...Array.from({ length: 7 }, () => '#..........#'),
  '#..======..#',
  '#..........#',
  '#..........#',
  '#....P.....#',
  '############',
];

describe('bục một chiều', () => {
  it('nhảy xuyên từ dưới lên và đứng được trên bục', () => {
    const pl = make(ONE_WAY);
    for (let i = 0; i < 90; i += 1) pl.step(input({ jumpPressed: i === 0, jumpHeld: true }), DT);
    expect(pl.grounded).toBe(true);
    expect(pl.bottom).toBe(7 * TILE_SIZE); // mặt trên bục ở dòng 7
  });

  it('Xuống + Nhảy để rơi xuyên bục', () => {
    const pl = make(ONE_WAY);
    for (let i = 0; i < 90; i += 1) pl.step(input({ jumpPressed: i === 0, jumpHeld: true }), DT);
    pl.step(input({ downHeld: true, jumpPressed: true, jumpHeld: true }), DT);
    for (let i = 0; i < 60; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.bottom).toBe(11 * TILE_SIZE);
  });
});

describe('bị đánh', () => {
  it('bật lùi xa nguồn sát thương, bất tử 1 giây', () => {
    const pl = make(OPEN);
    expect(pl.applyHit(10, pl.centerX + 20)).toBe(true);
    expect(pl.hp).toBe(90);
    pl.step(NO_INPUT, DT);
    expect(pl.vx).toBeLessThan(0);
    expect(pl.state).toBe('hurt');
    for (let i = 0; i < 55; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.applyHit(10, pl.centerX)).toBe(false);
    for (let i = 0; i < 6; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.applyHit(10, pl.centerX)).toBe(true);
  });

  it('hết máu thì chết và không điều khiển được', () => {
    const pl = make(OPEN);
    pl.applyHit(100, pl.centerX + 1);
    const ev = pl.step(input({ moveX: 1, jumpPressed: true }), DT);
    expect(ev.died).toBe(true);
    expect(pl.state).toBe('dead');
    expect(pl.vx).toBe(0);
  });

  it('rơi khỏi đáy bản đồ thì báo rơi hố', () => {
    const pl = make(['#.....#', '#P....#', '##....#']);
    let fell = false;
    for (let i = 0; i < 120 && !fell; i += 1) fell = pl.step(input({ moveX: 1 }), DT).fellOut;
    expect(fell).toBe(true);
  });
});

describe('va chạm', () => {
  const MAZE = [
    '##################',
    '#................#',
    '#...====....##...#',
    '#..........#.....#',
    '#.....##...#..=..#',
    '#..........#.....#',
    '#.==.......####..#',
    '#......###.......#',
    '#..#.............#',
    '#..#.....=====...#',
    '#P.#.............#',
    '##################',
  ];

  it('chạy vào tường thì dừng sát tường', () => {
    const pl = make(['#.....#', '#P....#', '#######']);
    for (let i = 0; i < 120; i += 1) pl.step(input({ moveX: 1 }), DT);
    expect(pl.box.x + pl.box.w).toBe(6 * TILE_SIZE);
  });

  it('4.000 bước điều khiển ngẫu nhiên: không bao giờ lọt vào trong khối đặc', () => {
    const map = TileMap.fromRows(MAZE, TILE_SIZE);
    const pl = new PlayerPhysics(params, map, map.spawn!.x, map.spawn!.y, 100);
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    let current = input({});
    for (let i = 0; i < 4000; i += 1) {
      if (i % 10 === 0) {
        current = input({
          moveX: [-1, 0, 1][Math.floor(rand() * 3)]!,
          jumpPressed: rand() < 0.3,
          jumpHeld: rand() < 0.7,
          dashPressed: rand() < 0.15,
          downHeld: rand() < 0.1,
        });
      }
      pl.step(i % 10 === 0 ? current : { ...current, jumpPressed: false, dashPressed: false }, DT);
      const { x, y, w, h } = pl.box;
      for (let r = Math.floor(y / TILE_SIZE); r <= Math.floor((y + h - 1e-6) / TILE_SIZE); r += 1) {
        for (
          let c = Math.floor(x / TILE_SIZE);
          c <= Math.floor((x + w - 1e-6) / TILE_SIZE);
          c += 1
        ) {
          expect(map.isSolid(c, r), `bước ${i}: lọt vào ô (${c}, ${r})`).toBe(false);
        }
      }
    }
  });
});
