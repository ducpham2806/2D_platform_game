/**
 * Mô hình HUD (M10): gom những gì HUD cần hiện thành một đối tượng thuần, tách khỏi cách vẽ.
 * Scene dựng mô hình mỗi khung từ StageWorld rồi giao cho StageHud vẽ; test kiểm tra nội dung
 * HUD mà không cần Phaser. Bố cục theo wireframe Main.html (cảm ứng) và HUDPC.html.
 */
import type { StageWorld } from '../world/stage-world';

/** Máu dưới tỉ lệ này thì thanh máu đổi màu cảnh báo (chỉ là hiển thị, không ảnh hưởng luật chơi). */
export const LOW_HP_FRACTION = 0.3;

export interface HudBar {
  value: number;
  max: number;
  /** 0..1, đã kẹp. */
  frac: number;
}

export interface HudModel {
  hp: HudBar & { low: boolean };
  /** Năng lượng vũ khí boss đang cầm; Arc Cannon không tốn năng lượng nên không có. */
  energy: HudBar | undefined;
  weapon: { name: string; index: number; count: number };
  /** Chỉ có trong trận boss. */
  boss: (HudBar & { name: string; phase: number; phaseMarks: number[] }) | undefined;
  /** Core Bit hiện có (bản lưu lúc vào màn + nhặt trong lượt). */
  coreBits: number;
  /** EXP nhận trong lượt. */
  exp: number;
  /** Phòng khóa đang đóng: số kẻ địch còn lại. */
  roomRemaining: number | undefined;
}

function bar(value: number, max: number): HudBar {
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return { value, max, frac };
}

/** `savedCoreBits`: Core Bit trong bản lưu lúc vào màn (0 với màn không lưu). */
export function buildHud(world: StageWorld, savedCoreBits = 0): HudModel {
  const pl = world.player;
  const hp = bar(Math.max(0, Math.ceil(pl.hp)), pl.maxHp);
  const slot = world.loadout.current;
  const boss = world.boss;
  return {
    hp: { ...hp, low: hp.frac <= LOW_HP_FRACTION },
    energy:
      slot.kind === 'buster' ? undefined : bar(Math.floor(slot.energy), world.loadout.energyMax),
    weapon: { name: slot.name, index: world.loadout.index, count: world.loadout.slots.length },
    boss:
      boss && world.phase === 'boss'
        ? {
            ...bar(boss.hp, boss.data.hp),
            name: boss.data.name,
            phase: boss.phase + 1,
            phaseMarks: boss.data.phases.filter((p) => p.untilHpPct > 0).map((p) => p.untilHpPct),
          }
        : undefined,
    coreBits: savedCoreBits + world.coreBits,
    exp: world.exp,
    roomRemaining: world.lockedRoom?.remaining,
  };
}
