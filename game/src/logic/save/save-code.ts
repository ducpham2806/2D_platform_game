/**
 * Mã sao lưu có checksum (đặc tả Hub & Shop mục 8) cho người không dùng tài khoản:
 * `CV1.<JSON bản lưu, UTF-8, base64url>.<FNV-1a 32 bit, 8 chữ số hex>`.
 * Checksum chỉ bắt mã chép thiếu/sai, không chống sửa có chủ đích (Gem và giao dịch do máy chủ giữ).
 */
import { fnv1a } from '../hash';
import { parseSave, type SaveData, SaveError } from './save-data';

const PREFIX = 'CV1';

export { fnv1a } from '../hash';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeSaveCode(save: SaveData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  const sum = fnv1a(bytes).toString(16).padStart(8, '0');
  return `${PREFIX}.${toBase64Url(bytes)}.${sum}`;
}

/** Giải mã; sai định dạng hoặc sai checksum thì báo SaveError với lời nhắn cho người chơi. */
export function decodeSaveCode(code: string): SaveData {
  const parts = code.replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX || !/^[0-9a-f]{8}$/i.test(parts[2] ?? ''))
    throw new SaveError('Mã sao lưu không đúng định dạng.');
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(parts[1] ?? '');
  } catch {
    throw new SaveError('Mã sao lưu không đúng định dạng.');
  }
  if (fnv1a(bytes) !== parseInt(parts[2] ?? '', 16))
    throw new SaveError('Mã sao lưu bị thiếu hoặc sai ký tự (checksum không khớp).');
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new SaveError('Mã sao lưu không đọc được.');
  }
  return parseSave(raw);
}
