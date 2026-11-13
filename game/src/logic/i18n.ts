import type { Lang, StringKey, StringsData } from '../core/strings-config';

export type StringParams = Readonly<Record<string, string | number>>;

/**
 * Tra chuỗi giao diện theo ngôn ngữ đang chọn. `{tham_số}` viết thường được thay bằng giá trị;
 * `{BIỂU_TƯỢNG_NÚT}` giữ nguyên để `formatGlyphs` thay theo thiết bị. Logic thuần.
 */
export class Strings {
  private readonly table: Readonly<Record<StringKey, string>>;

  constructor(
    data: StringsData,
    readonly lang: Lang,
  ) {
    this.table = data.tables[lang];
  }

  t(key: StringKey, params?: StringParams): string {
    const text = this.table[key];
    if (!params) return text;
    return text.replace(/\{([a-z][A-Za-z0-9]*)\}/g, (whole, name: string) => {
      const v = params[name];
      return v === undefined ? whole : String(v);
    });
  }
}
