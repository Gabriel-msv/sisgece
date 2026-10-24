'use strict';
const { z } = require('zod');
const { isValidCpf } = require('./cpf');

const EXIT_TYPES = [
  'Saída antecipada',
  'Saída em horário regular',
  'Atividade externa',
  'Entrada fora do horário',
  'Acesso fora do turno',
  'Outro'
];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const optionalText = (max) =>
  z.string().trim().max(max, 'Texto longo demais (máximo ' + max + ' caracteres).').default('');

const todayInFortaleza = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const isPhone = (value) => [10, 11].includes(value.replace(/\D/g, '').length);

// Campos fora desta lista (id, status, protocol, decision...) são descartados.
const solicitacaoSchema = z.object({
  type: optionalText(20).refine((v) => ['aluno', 'responsavel'].includes(v), 'Tipo de solicitante inválido.'),
  requesterName: optionalText(120),
  studentName: optionalText(120),
  enrollment: optionalText(30),
  course: optionalText(80),
  guardianName: optionalText(120),
  guardianPhone: optionalText(30),
  cpf: optionalText(14),
  kinship: optionalText(40),
  exitType: optionalText(60),
  date: optionalText(10),
  time: optionalText(5),
  justification: optionalText(800)
}).superRefine((d, ctx) => {
  const check = (ok, field, message) => {
    if (!ok) ctx.addIssue({ code: 'custom', path: [field], message });
  };
  const isStudent = d.type === 'aluno';

  check(d.studentName.length >= 3, 'studentName', 'Informe o nome completo do aluno.');
  if (isStudent) {
    check(d.enrollment.length > 0, 'enrollment', 'Informe a matrícula.');
    check(d.guardianName.length > 0, 'guardianName', 'Informe o nome do responsável.');
    check(isPhone(d.guardianPhone), 'guardianPhone', 'Informe um telefone válido com DDD.');
  } else {
    check(d.requesterName.length >= 3, 'requesterName', 'Informe o nome completo do responsável.');
    check(isValidCpf(d.cpf), 'cpf', 'CPF inválido.');
    check(isPhone(d.guardianPhone), 'guardianPhone', 'Informe um telefone válido com DDD.');
    check(d.kinship.length > 0, 'kinship', 'Informe o grau de parentesco.');
  }
  check(EXIT_TYPES.includes(d.exitType), 'exitType', 'Selecione o tipo de saída.');
  check(isRealDate(d.date), 'date', 'Data inválida.');
  if (isRealDate(d.date)) check(d.date >= todayInFortaleza(), 'date', 'A data prevista não pode estar no passado.');
  check(TIME_RE.test(d.time), 'time', 'Horário inválido.');
  check(d.justification.length >= 8, 'justification', 'A justificativa precisa ter pelo menos 8 caracteres.');
});

module.exports = { solicitacaoSchema };
