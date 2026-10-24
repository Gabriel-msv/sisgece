'use strict';
const crypto = require('crypto');
const repository = require('./solicitacoes.repository');
const { gerarProtocolo } = require('./protocolo');
const { registrarAuditoria } = require('../../shared/auditoria');
const AppError = require('../../shared/AppError');

// O servidor define id, protocolo, data e status. O que o cliente mandar nesses campos é ignorado.
function buildRow(d) {
  const isStudent = d.type === 'aluno';
  return {
    id: crypto.randomUUID(),
    type: d.type,
    requester_name: isStudent ? d.studentName : d.requesterName,
    student_name: d.studentName,
    enrollment: d.enrollment,
    course: isStudent ? d.course : '',
    guardian_name: isStudent ? d.guardianName : d.requesterName,
    guardian_phone: d.guardianPhone,
    cpf: isStudent ? '' : d.cpf.replace(/\D/g, ''),
    kinship: isStudent ? '' : d.kinship,
    exit_type: d.exitType,
    exit_date: d.date,
    exit_time: d.time,
    justification: d.justification,
    created_at: new Date().toISOString()
  };
}

function create(data) {
  const row = buildRow(data);
  for (let attempt = 0; attempt < 5; attempt++) {
    const protocol = gerarProtocolo();
    try {
      repository.insert({ ...row, protocol });
      // A auditoria guarda só o protocolo: nada de CPF, telefone ou justificativa.
      registrarAuditoria('Solicitação criada', row.id, protocol, 'Visitante');
      return { protocol };
    } catch (err) {
      if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err; // protocolo repetido: sorteia outro
    }
  }
  throw new AppError('Não foi possível gerar o protocolo. Tente novamente.', 500);
}

function getStats() {
  const counts = Object.fromEntries(repository.countByStatus().map((r) => [r.status, r.n]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { total, pending: counts.pending || 0, approved: counts.approved || 0, done: counts.done || 0 };
}

module.exports = { create, getStats };
