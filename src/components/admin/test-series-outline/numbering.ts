// 1 → a, 2 → b, …, 26 → z, 27 → aa, …
export function toLetter(n: number): string {
  let s = "";
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(97 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

const ROMAN_TABLE: [number, string][] = [
  [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
  [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
  [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

// 1 → i, 2 → ii, 4 → iv, …
export function toRoman(n: number): string {
  let num = n;
  let s = "";
  for (const [value, symbol] of ROMAN_TABLE) {
    while (num >= value) {
      s += symbol;
      num -= value;
    }
  }
  return s;
}
