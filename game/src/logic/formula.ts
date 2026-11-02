/**
 * Tính công thức số học trong dữ liệu (ví dụ "100+4*(L-1)", "40*L^1.4") mà không dùng eval.
 * Hỗ trợ + - * / ^, ngoặc, số thập phân và các biến được truyền vào. Logic thuần.
 */
export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaError';
  }
}

type Token =
  { kind: 'num'; value: number } | { kind: 'id'; name: string } | { kind: 'op'; op: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i] ?? '';
    if (ch === ' ') {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^[0-9]*\.?[0-9]+/.exec(source.slice(i));
      if (!match) throw new FormulaError(`Số không hợp lệ ở vị trí ${i}`);
      tokens.push({ kind: 'num', value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
      tokens.push({ kind: 'id', name: match?.[0] ?? ch });
      i += match?.[0].length ?? 1;
    } else if ('+-*/^()'.includes(ch)) {
      tokens.push({ kind: 'op', op: ch });
      i += 1;
    } else {
      throw new FormulaError(`Ký tự lạ "${ch}" trong công thức`);
    }
  }
  return tokens;
}

/** Tính giá trị công thức với các biến cho trước. */
export function evaluateFormula(source: string, vars: Readonly<Record<string, number>>): number {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];
  const takeOp = (op: string): boolean => {
    const t = peek();
    if (t?.kind === 'op' && t.op === op) {
      pos += 1;
      return true;
    }
    return false;
  };

  // expr := term (('+'|'-') term)* ; term := power (('*'|'/') power)* ;
  // power := unary ('^' power)? ; unary := '-' unary | atom ; atom := num | id | '(' expr ')'
  const expr = (): number => {
    let v = term();
    for (;;) {
      if (takeOp('+')) v += term();
      else if (takeOp('-')) v -= term();
      else return v;
    }
  };
  const term = (): number => {
    let v = power();
    for (;;) {
      if (takeOp('*')) v *= power();
      else if (takeOp('/')) v /= power();
      else return v;
    }
  };
  const power = (): number => {
    const base = unary();
    return takeOp('^') ? base ** power() : base;
  };
  const unary = (): number => (takeOp('-') ? -unary() : atom());
  const atom = (): number => {
    const t = peek();
    if (!t) throw new FormulaError('Công thức kết thúc giữa chừng');
    pos += 1;
    if (t.kind === 'num') return t.value;
    if (t.kind === 'id') {
      const value = vars[t.name];
      if (value === undefined) throw new FormulaError(`Biến "${t.name}" chưa có giá trị`);
      return value;
    }
    if (t.op === '(') {
      const v = expr();
      if (!takeOp(')')) throw new FormulaError('Thiếu dấu ")"');
      return v;
    }
    throw new FormulaError(`Không mong đợi "${t.op}"`);
  };

  const result = expr();
  if (pos !== tokens.length) throw new FormulaError('Thừa ký tự ở cuối công thức');
  if (!Number.isFinite(result)) throw new FormulaError('Kết quả không phải số hữu hạn');
  return result;
}
