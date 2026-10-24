'use strict';
const repository = require('./gestao.repository');
const AppError = require('../../shared/AppError');
const { toFront, FULL_ACCESS_ROLES } = require('../../shared/solicitacao.mapper');
const { registrarAuditoria } = require('../../shared/auditoria');

function list(user) {
  const rows = FULL_ACCESS_ROLES.includes(user.role) ? repository.listAll() : repository.listAuthorized();
  return rows.map((row) => toFront(row, user.role));
}

function decidir(user, id, { approve, reason }) {
  const request = repository.findById(id);
  if (!request) throw new AppError('Solicitação não encontrada.', 404);
  if (request.status !== 'pending') throw new AppError('Esta solicitação já foi analisada.', 409);

  const cleanReason = approve ? '' : reason.trim();
  if (!approve && cleanReason.length < 4) throw new AppError('Informe o motivo do indeferimento.', 400);

  // Quem decidiu e quando vem do servidor (sessão e relógio), nunca do corpo da requisição.
  const changes = repository.decide({
    id,
    status: approve ? 'approved' : 'rejected',
    by: user.name,
    at: new Date().toISOString(),
    reason: cleanReason
  });
  if (changes === 0) throw new AppError('Esta solicitação já foi analisada.', 409);

  registrarAuditoria(approve ? 'Solicitação autorizada' : 'Solicitação indeferida', id, request.protocol, user.name);
}

module.exports = { list, decidir };
