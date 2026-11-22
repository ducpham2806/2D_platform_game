/**
 * Làm sạch thông báo lỗi trước khi ghi (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md` mục 3,
 * 4). Sau khi làm sạch, mọi chuỗi trong sự kiện chỉ còn ASCII in được, nên byte = độ dài JSON.
 */

/** Chuỗi trong nháy: V8 chép nguyên đoạn người chơi dán vào lời lỗi `JSON.parse`. */
const QUOTED_RE = /"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”/g;
const URL_RE = /\b(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S*/gi;
const SCHEME_RE = /\b(?:blob|data|file|chrome-extension|moz-extension):\S*/gi;
const PATH_RE = /(?:[A-Za-z]:)?(?:[\\/][^\s\\/'"()<>]+){2,}[\\/]?/g;
const DIGITS_RE = /\d+/g;
const MARKS_RE = /[\u0300-\u036f]/g;
const NON_ASCII_RE = /[^\x20-\x7e]/g;

/**
 * Thông báo lỗi cho `client_error.msg` (GDD 13 mục 3, 4; duyệt Technical Director 14/11). Theo thứ
 * tự: bỏ chuỗi trong nháy, URL, đường dẫn; chữ số thành `#`; bỏ dấu tiếng Việt (đ → d); bỏ ký tự
 * ngoài ASCII in được; gộp khoảng trắng; cắt còn `maxChars` ký tự. Kết quả chỉ có ASCII.
 */
export function sanitizeErrorMessage(msg: string, maxChars: number): string {
  return msg
    .replace(QUOTED_RE, '<s>')
    .replace(URL_RE, '<url>')
    .replace(SCHEME_RE, '<url>')
    .replace(PATH_RE, '<path>')
    .replace(DIGITS_RE, '#')
    .normalize('NFD')
    .replace(MARKS_RE, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(NON_ASCII_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars)
    .trim();
}
