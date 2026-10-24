'use strict';

function normalizeIdentity(value) {
  const text = String(value || '').trim().toLowerCase();
  return /^[\d.\-\/\s]+$/.test(text) ? text.replace(/\D/g, '') : text;
}

module.exports = { normalizeIdentity };
