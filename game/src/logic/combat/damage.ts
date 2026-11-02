/**
 * Tính sát thương (logic thuần). Đơn vị gây ra: "phát Arc Cannon gốc" (máu kẻ địch, boss);
 * đơn vị nhận vào: máu người chơi. Xem weapons.json, bosses.json, difficulties.json.
 */
export interface OutgoingHit {
  /** Sát thương đã nhân mọi hệ số. */
  amount: number;
  /** Trúng điểm yếu (vũ khí khắc chế). */
  weak: boolean;
  /** Thời gian choáng gây ra cho mục tiêu (chỉ khi trúng điểm yếu). */
  stunSec: number;
}

export interface OutgoingParams {
  /** Sát thương gốc của vũ khí (Arc Cannon = 1). */
  base: number;
  /** Hệ số của loại đòn: nạp vừa/nạp đầy, roi Vine Lash… */
  kindMul: number;
  /** Hệ số theo chỉ số Công của người chơi (công hiện tại / công cấp 1). */
  attackMul: number;
  weapon: string;
  targetWeakness: string | undefined;
  weakMul: number;
  weakStunSec: number;
}

export function outgoingDamage(p: OutgoingParams): OutgoingHit {
  const weak = p.targetWeakness !== undefined && p.targetWeakness === p.weapon;
  const amount = p.base * p.kindMul * p.attackMul * (weak ? p.weakMul : 1);
  return { amount, weak, stunSec: weak ? p.weakStunSec : 0 };
}

/**
 * Sát thương người chơi nhận: nhân hệ số độ khó (difficulties.json damageTaken), làm tròn,
 * và một đòn có sát thương thì luôn mất ít nhất 1 máu.
 */
export function incomingDamage(base: number, damageTaken: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * damageTaken));
}
