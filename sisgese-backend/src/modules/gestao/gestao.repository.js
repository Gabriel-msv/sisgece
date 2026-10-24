'use strict';
const db = require('../../config/database');

const listAllStmt = db.prepare('SELECT * FROM solicitacoes ORDER BY created_at DESC');
const listAuthorizedStmt = db.prepare(
  "SELECT * FROM solicitacoes WHERE status IN ('approved','done') ORDER BY created_at DESC"
);
const findStmt = db.prepare('SELECT * FROM solicitacoes WHERE id = ?');

// O "AND status = 'pending'" garante que duas decisões simultâneas não se sobrescrevam.
const decideStmt = db.prepare(`
  UPDATE solicitacoes
  SET status = @status, decision_by = @by, decision_at = @at, decision_reason = @reason
  WHERE id = @id AND status = 'pending'
`);

const listAll = () => listAllStmt.all();
const listAuthorized = () => listAuthorizedStmt.all();
const findById = (id) => findStmt.get(id);
const decide = (params) => decideStmt.run(params).changes;

module.exports = { listAll, listAuthorized, findById, decide };
