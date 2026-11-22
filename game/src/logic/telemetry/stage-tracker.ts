/**
 * Theo dõi một lượt vào màn và ghi sự kiện đo lường (logic thuần, ST-13-02; GDD 13 mục 3; QB-47
 * lượt, QB-98 trang ẩn). Nhận sự kiện của từng bước logic (`WorldEvents`) và trạng thái StageWorld,
 * sinh: `stage_start`, `section_enter`, `checkpoint`, `death`, `boss_start`, `boss_end`,
 * `difficulty_hint`, `stage_progress`, `stage_end`. Không cấp phát mỗi bước trừ khi có sự kiện.
 */
import type { InputDevice } from '../input/actions';
import { sectionAt } from '../playtest/recorder';
import type { WorldEvents, WorldPhase } from '../world/world-types';
import type { Telemetry } from './logger';
import type { Props } from './schema';

/** Phần StageWorld mà bộ theo dõi đọc (StageWorld thỏa sẵn). */
export interface TrackedWorld {
  readonly player: { readonly centerX: number };
  readonly phase: WorldPhase;
  readonly boss:
    | { readonly hpPct: number; readonly data: { readonly id: string; readonly weakness: string } }
    | undefined;
  /** Vũ khí đang có (tên); `boss_start.weaponsOwned`, `weaknessOwned` (MV6). */
  readonly loadout: { readonly slots: ReadonlyArray<{ readonly name: string }> };
  readonly bossDamage: ReadonlyMap<string, number>;
  readonly bossWeakHits: number;
  readonly deathStreak: number;
  readonly layout: { readonly sections: ReadonlyArray<{ id: string; fromCol: number }> };
}

export interface StageTrackerOptions {
  /** id màn chiến dịch (`stages.json`) hoặc `prologue`. */
  stage: string;
  tileSize: number;
  /** Tên vũ khí → id (`weaponId`). */
  weaponId: (name: string) => string;
  /** Nhịp ghi `stage_progress` (giây chơi). */
  progressSec: number;
  /** Tốc độ game lúc vào màn (tiếp cận; 1 = 100%). */
  gameSpeed: number;
}

/** Số liệu lớp nối đưa vào lúc ghi tiến độ hoặc hết lượt. */
export interface RunExtras {
  /** Giây thật (không cộng lúc tab ẩn). */
  realSec: number;
  /** EXP và Core Bit kiếm được trong lượt (kể cả thưởng boss; `StageWorld.exp`, `coreBits`). */
  expEarned: number;
  coreBitsEarned: number;
  /** Core Bit trong ví sau lượt. */
  balance: number;
  fpsMedian?: number;
  slowFramePct?: number;
}

interface BossFight {
  attempt: number;
  startSec: number;
  dmg0: Map<string, number>;
  weak0: number;
  swaps: number;
  weaknessOwned: boolean;
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

export class StageTracker {
  private runSec = 0;
  private sinceProgress = 0;
  private readonly deviceSec: Record<string, number> = {};
  private readonly order: string[];
  private readonly visited = new Set<string>();
  private furthest = -1;
  private last = '';
  private deaths = 0;
  private pits = 0;
  private secrets = 0;
  private gameSpeedMin: number;
  private fight: BossFight | undefined;
  private attempts = 0;
  private done = false;

  constructor(
    private readonly tel: Telemetry,
    private readonly world: TrackedWorld,
    private readonly opts: StageTrackerOptions,
  ) {
    this.order = world.layout.sections.map((s) => s.id);
    this.gameSpeedMin = opts.gameSpeed;
  }

  get ended(): boolean {
    return this.done;
  }

  /** Vào màn: `stage_start` (thuộc tính do lớp nối dựng) rồi `section_enter` của đoạn đầu. */
  start(props: Props, device: InputDevice): void {
    this.tel.log('stage_start', { ...props, stage: this.opts.stage, device });
    this.visit(this.section());
  }

  /** Gọi sau mỗi bước logic với sự kiện của bước đó. */
  step(ev: WorldEvents, device: InputDevice, dt: number): void {
    if (this.done) return;
    this.runSec += dt;
    this.sinceProgress += dt;
    this.deviceSec[device] = (this.deviceSec[device] ?? 0) + dt;
    this.secrets += ev.secretsFound.length;
    if (ev.swapped && this.fight) this.fight.swaps += 1;
    const section = this.section();
    this.visit(section);
    if (ev.checkpoint !== undefined)
      this.tel.log('checkpoint', {
        stage: this.opts.stage,
        index: ev.checkpoint,
        tRun: this.runSec,
      });
    if (ev.fellInPit) {
      this.pits += 1;
      this.death('pit', 'pit', section, device);
    }
    if (ev.playerDied) {
      this.deaths += 1;
      this.death('death', ev.deathCause, section, device);
      if (this.fight) this.bossEnd('death', device);
    }
    if (ev.gateClosed || (ev.respawned && this.world.phase === 'boss')) this.bossStart();
    if (ev.bossDefeated) this.bossEnd('win', device);
  }

  /** Gợi ý NOVA sau 3 lần chết vừa hiện (GDD 11 mục 2.5). */
  hint(difficulty: string): void {
    this.tel.log('difficulty_hint', {
      stage: this.opts.stage,
      difficulty,
      section: this.section(),
    });
  }

  /** Đổi tốc độ game giữa lượt (để báo cáo loại lượt có giảm tốc, QB-95). */
  setGameSpeed(speed: number): void {
    this.gameSpeedMin = Math.min(this.gameSpeedMin, speed);
  }

  /** Ghi tiến độ đã tới hạn (`progressSec`); trả về true nếu đã ghi. */
  progressDue(): boolean {
    return !this.done && this.sinceProgress >= this.opts.progressSec;
  }

  /** `stage_progress` (định kỳ và khi trang ẩn, QB-98). */
  progress(extra: RunExtras): void {
    if (this.done) return;
    this.sinceProgress = 0;
    this.tel.flushErrorCounts();
    this.tel.log('stage_progress', this.runProps(extra));
  }

  /**
   * Hết lượt (QB-47): hạ boss rồi rời màn (`clear`), thoát hoặc Chơi lại (`quit`). Trận boss còn dở
   * thì ghi `boss_end` `exit` trước.
   */
  end(outcome: 'clear' | 'quit', extra: RunExtras, device: InputDevice): void {
    if (this.done) return;
    if (this.fight) this.bossEnd('exit', device);
    this.tel.log('stage_end', { ...this.runProps(extra), outcome });
    this.done = true;
  }

  private section(): string {
    if (this.world.phase === 'boss' && this.order.includes('boss')) return 'boss';
    if (this.order.length === 0) return 'start';
    return sectionAt(
      this.world.layout.sections,
      Math.floor(this.world.player.centerX / this.opts.tileSize),
    );
  }

  private visit(section: string): void {
    this.last = section;
    const idx = this.order.indexOf(section);
    if (idx > this.furthest) this.furthest = idx;
    if (this.visited.has(section)) return;
    this.visited.add(section);
    this.tel.log('section_enter', { stage: this.opts.stage, section, tRun: this.runSec });
  }

  private death(
    kind: 'death' | 'pit',
    cause: string | undefined,
    section: string,
    device: InputDevice,
  ): void {
    this.tel.log('death', {
      stage: this.opts.stage,
      section,
      kind,
      ...(cause ? { cause } : {}),
      device,
      tRun: this.runSec,
      streak: Math.max(1, this.world.deathStreak),
    });
  }

  private bossStart(): void {
    const boss = this.world.boss;
    if (!boss || this.fight) return;
    this.attempts += 1;
    const owned = this.world.loadout.slots.map((w) => w.name);
    this.fight = {
      attempt: this.attempts,
      startSec: this.runSec,
      dmg0: new Map(this.world.bossDamage),
      weak0: this.world.bossWeakHits,
      swaps: 0,
      weaknessOwned: owned.includes(boss.data.weakness),
    };
    this.tel.log('boss_start', {
      stage: this.opts.stage,
      boss: boss.data.id,
      attempt: this.attempts,
      weaknessOwned: this.fight.weaknessOwned,
      weaponsOwned: owned.map(this.opts.weaponId),
    });
  }

  private bossEnd(outcome: 'win' | 'death' | 'exit', device: InputDevice): void {
    const fight = this.fight;
    const boss = this.world.boss;
    this.fight = undefined;
    if (!fight || !boss) return;
    const dmg: Record<string, number> = {};
    for (const [name, total] of this.world.bossDamage) {
      const delta = total - (fight.dmg0.get(name) ?? 0);
      if (delta > 0) dmg[this.opts.weaponId(name)] = round1(delta);
    }
    this.tel.log('boss_end', {
      boss: boss.data.id,
      outcome,
      fightSec: this.runSec - fight.startSec,
      dmg,
      weakHits: this.world.bossWeakHits - fight.weak0,
      swaps: fight.swaps,
      bossHpPct: outcome === 'win' ? 0 : Math.max(0, boss.hpPct),
      // Ưu tiên 0, nên MV6 vẫn có khi `boss_start` (ưu tiên 1) bị bỏ lúc bộ đệm đầy.
      weaknessOwned: fight.weaknessOwned,
      device,
      gameSpeed: this.gameSpeedMin,
    });
  }

  private runProps(extra: RunExtras): Props {
    const deviceSec: Record<string, number> = {};
    for (const [d, sec] of Object.entries(this.deviceSec)) deviceSec[d] = round1(sec);
    return {
      stage: this.opts.stage,
      runSec: this.runSec,
      realSec: extra.realSec,
      deaths: this.deaths,
      pits: this.pits,
      furthest: this.order[this.furthest] ?? this.last,
      last: this.last,
      coreBitsEarned: Math.round(extra.coreBitsEarned),
      expEarned: Math.round(extra.expEarned),
      balance: Math.round(extra.balance),
      secrets: this.secrets,
      deviceSec,
      gameSpeedMin: this.gameSpeedMin,
      ...(extra.fpsMedian !== undefined ? { fpsMedian: Math.round(extra.fpsMedian) } : {}),
      ...(extra.slowFramePct !== undefined ? { slowFramePct: extra.slowFramePct } : {}),
    };
  }
}

/** Chữ ký build kỹ năng: tổng bậc đã học theo nhánh Vanguard, Phantom, Core (`V2P1C0`). */
export function buildSignature(skills: Readonly<Record<string, number>>): string {
  const sum = { V: 0, P: 0, C: 0 };
  for (const [node, rank] of Object.entries(skills)) {
    const branch = node[0] as keyof typeof sum;
    if (branch in sum && rank > 0) sum[branch] += rank;
  }
  return `V${sum.V}P${sum.P}C${sum.C}`;
}
