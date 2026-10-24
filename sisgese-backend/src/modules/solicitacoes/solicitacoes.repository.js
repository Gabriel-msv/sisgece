'use strict';
const db = require('../../config/database');

const insertStmt = db.prepare(`
  INSERT INTO solicitacoes
    (id, protocol, type, requester_name, student_name, enrollment, course, guardian_name,
     guardian_phone, cpf, kinship, exit_type, exit_date, exit_time, justification, created_at, status)
  VALUES
    (@id, @protocol, @type, @requester_name, @student_name, @enrollment, @course, @guardian_name,
     @guardian_phone, @cpf, @kinship, @exit_type, @exit_date, @exit_time, @justification, @created_at, 'pending')
`);

const countStmt = db.prepare('SELECT status, COUNT(*) AS n FROM solicitacoes GROUP BY status');

const insert = (row) => insertStmt.run(row);
const countByStatus = () => countStmt.all();

module.exports = { insert, countByStatus };
