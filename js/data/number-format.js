export const MONEY_SUFFIXES = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];

export function idleSuffix(index) {
  if (index < MONEY_SUFFIXES.length) return MONEY_SUFFIXES[index];
  const offset = index - MONEY_SUFFIXES.length;
  let n = offset;
  const digits = [];
  do {
    digits.unshift(n % 26);
    n = Math.floor(n / 26);
  } while (n > 0);
  while (digits.length < 2) digits.unshift(0);
  return digits.map(d => String.fromCharCode(97 + d)).join('');
}

export function formatMoneyValue(n, { rate = false } = {}) {
  if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) n = 0;
  if (!Number.isFinite(n)) return '$∞';
  if (n < 1000) {
    if (rate) {
      return '$' + n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    }
    return '$' + Math.floor(n);
  }
  const group = Math.floor(Math.log10(n) / 3);
  const suffixIndex = group - 1;
  const scaled = n / Math.pow(1000, group);
  let formatted = scaled.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  return '$' + formatted + idleSuffix(suffixIndex);
}
