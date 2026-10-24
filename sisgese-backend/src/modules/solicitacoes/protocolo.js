'use strict';
const crypto = require('crypto');

// Sem 0, O, 1, I para evitar confusão ao ditar o protocolo. 32 símbolos = sem viés no sorteio.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function gerarProtocolo() {
  let code = '';
  for (const byte of crypto.randomBytes(6)) code += ALPHABET[byte % ALPHABET.length];
  return 'SG-' + new Date().getFullYear() + '-' + code;
}

module.exports = { gerarProtocolo };
