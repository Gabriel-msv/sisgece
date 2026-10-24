'use strict';
const db = require('../config/database');

const insert = db.prepare(
  'INSERT INTO auditoria (action, request_id, detail, by_user, at) VALUES (?, ?, ?, ?, ?)'
);

// Só insere. Nenhuma rota edita ou apaga linhas da auditoria.
function registrarAuditoria(action, requestId, detail, byName) {
  insert.run(action, requestId || null, detail || '', byName || 'Visitante', new Date().toISOString());
}

module.exports = { registrarAuditoria };
