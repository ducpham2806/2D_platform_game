import type { BossBeamAttack } from '../../core/boss-config';
import { overlaps } from '../combat/projectiles';
import type { Box } from '../player/collision';
import { laserBox, type LaserPath } from '../stage/laser-path';

export interface BossBeamRoute {
  x: number;
  turns(): number;
  trace(alternate: boolean, maxBounces: number): LaserPath;
}

export interface BossBeamLine {
  path: LaserPath;
  alternate: boolean;
}

export interface BossBeamPulse extends BossBeamLine {
  boxes: Box[];
  damage: number;
  remainingSec: number;
  hitPlayer: boolean;
}

/** Báo và bắn cùng đường tia. Xung đã bắn giữ đường của nó trong cả thời gian hiệu lực. */
export class BossBeam {
  warnings: BossBeamLine[] = [];
  pulses: BossBeamPulse[] = [];
  private route: BossBeamRoute | undefined;
  private turnsAtStart = 0;
  private countered = false;
  private lockAtWarning = false;
  private lockedPrimary: BossBeamLine | undefined;
  private lockedAlternate: BossBeamLine | undefined;

  begin(route: BossBeamRoute | undefined, lockAtWarning = false): void {
    this.cancelPending();
    this.route = route;
    this.lockAtWarning = lockAtWarning;
    this.turnsAtStart = lockAtWarning ? 0 : (route?.turns() ?? 0);
    this.countered = false;
  }

  step(dt: number): void {
    for (const pulse of this.pulses) pulse.remainingSec -= dt;
    this.pulses = this.pulses.filter((pulse) => pulse.remainingSec > 1e-9);
  }

  warn(attack: BossBeamAttack, alternateOnly = false): void {
    this.warnings = [];
    if (!this.route) return;
    if (!alternateOnly) this.warnings.push(this.warningLine(attack, false));
    if (attack.pulseGapSec !== undefined) this.warnings.push(this.warningLine(attack, true));
  }

  cancelPending(): void {
    this.warnings = [];
    this.lockedPrimary = this.lockedAlternate = undefined;
  }

  clear(): void {
    this.begin(undefined);
    this.pulses = [];
  }

  fire(attack: BossBeamAttack, alternate: boolean, boss: Box): boolean {
    const line = this.lockAtWarning ? this.lockedLine(alternate) : this.line(attack, alternate);
    if (!line) return false; // Không bắn theo đường chưa từng báo.
    const boxes = line.path.map((leg) => laserBox(leg, attack.widthPx));
    if (boxes.length)
      this.pulses.push({
        ...line,
        boxes,
        damage: attack.damage,
        remainingSec: attack.activeSec,
        hitPlayer: false,
      });
    if (
      this.lockAtWarning ||
      this.countered ||
      this.route?.turns() === this.turnsAtStart ||
      !boxes.slice(1).some((box) => overlaps(box, boss))
    )
      return false;
    this.countered = true;
    return true;
  }

  private lockedLine(alternate: boolean): BossBeamLine | undefined {
    return alternate ? this.lockedAlternate : this.lockedPrimary;
  }

  private warningLine(attack: BossBeamAttack, alternate: boolean): BossBeamLine {
    if (!this.lockAtWarning) return this.line(attack, alternate);
    const cached = this.lockedLine(alternate);
    if (cached) return cached;
    const path = this.line(attack, alternate).path.map(({ from, to }) => ({
      from: { ...from },
      to: { ...to },
    }));
    const line = { alternate, path };
    if (alternate) this.lockedAlternate = line;
    else this.lockedPrimary = line;
    return line;
  }

  private line(attack: BossBeamAttack, alternate: boolean): BossBeamLine {
    return { alternate, path: this.route?.trace(alternate, attack.maxBounces) ?? [] };
  }
}
