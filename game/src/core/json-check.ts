/** Hàm kiểm tra JSON dùng chung cho các file cấu hình (logic thuần). */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export type Json = Record<string, unknown>;

export function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function obj(value: unknown, path: string): Json {
  if (!isObject(value)) throw new ConfigError(`${path}: cần một object`);
  return value;
}

export function num(value: unknown, path: string, opts: { min?: number } = {}): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ConfigError(`${path}: cần một số`);
  }
  if (opts.min !== undefined && value < opts.min) {
    throw new ConfigError(`${path}: phải ≥ ${opts.min} (đang là ${value})`);
  }
  return value;
}

export function str(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ConfigError(`${path}: cần một chuỗi khác rỗng`);
  }
  return value;
}

export function arr(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ConfigError(`${path}: cần một mảng`);
  return value;
}
