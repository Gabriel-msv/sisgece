'use strict';
const argon2 = require('argon2');
const db = require('../../config/database');
const AppError = require('../../shared/AppError');
const { normalizeIdentity } = require('../../shared/identity');
const { registrarAuditoria } = require('../../shared/auditoria');

const AREA_ROLES = {
  management: ['superuser', 'management'],
  gate: ['superuser', 'reception', 'gate']
};
const INVALID = 'Identificação, senha ou permissão inválida.';

// Hash falso para gastar o mesmo tempo quando o usuário não existe (evita descobrir usuários pelo tempo de resposta).
let dummyHash;
const getDummyHash = () => (dummyHash = dummyHash || argon2.hash('senha-que-nao-existe'));

function toPublicUser(user) {
  return { id: user.id, name: user.name, identity: user.identity, role: user.role, active: Boolean(user.active) };
}

function getActiveUserById(id) {
  return db.prepare('SELECT * FROM usuarios WHERE id = ? AND active = 1').get(id) || null;
}

// Mascara dígitos (CPF/matrícula) para a auditoria não guardar o documento inteiro.
const maskIdentity = (value) => value.slice(0, 60).replace(/\d(?=\d{3})/g, '*');

async function login({ identity, password, area }) {
  const normalized = normalizeIdentity(identity);
  const user = db.prepare('SELECT * FROM usuarios WHERE identity = ? AND active = 1').get(normalized);

  const passwordOk = await argon2.verify(user ? user.password_hash : await getDummyHash(), password);

  if (!user || !passwordOk || !AREA_ROLES[area].includes(user.role)) {
    registrarAuditoria('Login recusado', null, 'identificação: ' + maskIdentity(normalized) + ' · área: ' + area, 'Visitante');
    throw new AppError(INVALID, 401);
  }

  registrarAuditoria('Login', null, 'área: ' + area, user.name);
  return toPublicUser(user);
}

module.exports = { login, toPublicUser, getActiveUserById };
