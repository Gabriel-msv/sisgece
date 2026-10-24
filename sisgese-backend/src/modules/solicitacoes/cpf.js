'use strict';

function isValidCpf(value) {
  const c = String(value || '').replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const digit = (n) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(c[i]) * (n + 1 - i);
    return ((sum * 10) % 11) % 10;
  };
  return digit(9) === Number(c[9]) && digit(10) === Number(c[10]);
}

module.exports = { isValidCpf };
