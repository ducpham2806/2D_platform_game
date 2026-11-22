/** Băm dùng chung (logic thuần): mã sao lưu (M11) và dấu vân tay dữ liệu cho đo lường (EP-13). */

/** FNV-1a 32 bit trên các byte. */
export function fnv1a(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** File loại khỏi dấu vân tay: chỉnh ngưỡng báo cáo không được tách hai build đo lường. */
export const FINGERPRINT_EXCLUDE = ['telemetry.json'];

/**
 * Dấu vân tay `03-Data` (`01-GDD/13-Do-luong-MVP.md` mục 5): FNV-1a trên `<tên file>\n<nội dung,
 * CRLF → LF>\n` của các file `.json` sắp theo tên, trừ `FINGERPRINT_EXCLUDE`; 8 ký tự hex.
 * Tính lúc build (Vite `define`) để gắn vào mỗi lô.
 */
export function dataFingerprint(files: ReadonlyArray<{ name: string; text: string }>): string {
  const body = [...files]
    .filter((f) => f.name.endsWith('.json') && !FINGERPRINT_EXCLUDE.includes(f.name))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((f) => `${f.name}\n${f.text.replace(/\r\n/g, '\n')}\n`)
    .join('');
  return fnv1a(new TextEncoder().encode(body)).toString(16).padStart(8, '0');
}
