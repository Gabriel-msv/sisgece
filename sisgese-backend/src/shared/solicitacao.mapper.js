'use strict';

const FULL_ACCESS_ROLES = ['superuser', 'management'];

// Converte a linha do banco no formato que o front espera.
// Recepção e portaria não recebem CPF nem telefone (LGPD: só o necessário para a função).
function toFront(row, role) {
  const full = FULL_ACCESS_ROLES.includes(role);
  return {
    id: row.id,
    protocol: row.protocol,
    type: row.type,
    requesterName: row.requester_name,
    studentName: row.student_name,
    enrollment: row.enrollment,
    course: row.course,
    guardianName: row.guardian_name,
    guardianPhone: full ? row.guardian_phone : '',
    cpf: full ? row.cpf : '',
    kinship: row.kinship,
    exitType: row.exit_type,
    date: row.exit_date,
    time: row.exit_time,
    justification: row.justification,
    createdAt: row.created_at,
    status: row.status,
    decision: row.decision_at
      ? { by: row.decision_by, at: row.decision_at, reason: row.decision_reason || '' }
      : null,
    reception: { checked: Boolean(row.reception_at), at: row.reception_at, by: row.reception_by },
    gate: { checked: Boolean(row.gate_at), at: row.gate_at, by: row.gate_by }
  };
}

module.exports = { toFront, FULL_ACCESS_ROLES };
