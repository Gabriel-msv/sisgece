'use strict';
const argon2 = require('argon2');
const crypto = require('crypto');
const env = require('../src/config/env');
const db = require('../src/config/database');

if (env.nodeEnv === 'production') throw new Error('Teste só para desenvolvimento.');

const base = 'http://localhost:' + env.port + '/api';
const roles = { gestao: 'management', recepcao: 'reception', portaria: 'gate' };
const cleanup = () => db.prepare("DELETE FROM usuarios WHERE identity LIKE 'teste.%'").run();

async function api(method, path, cookie, body) {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  return { status: r.status, body: t ? JSON.parse(t) : null, cookie: (r.headers.getSetCookie()[0] || '').split(';')[0] };
}
const ok = (name, cond, extra = '') => console.log((cond ? 'OK     ' : 'FALHOU ') + name + (extra ? '  ' + extra : ''));

(async () => {
  cleanup();
  db.prepare(`UPDATE solicitacoes SET status='pending', decision_by=NULL, decision_at=NULL, decision_reason=NULL,
    reception_by=NULL, reception_at=NULL, gate_by=NULL, gate_at=NULL`).run();

  const sessions = {};
  for (const [nick, role] of Object.entries(roles)) {
    const pw = crypto.randomBytes(12).toString('hex');
    db.prepare('INSERT INTO usuarios (id,name,identity,password_hash,role,active,created_at) VALUES (?,?,?,?,?,1,?)')
      .run('test-' + nick, 'Teste ' + nick, 'teste.' + nick, await argon2.hash(pw), role, new Date().toISOString());
    const r = await api('POST', '/auth/login', null, { identity: 'teste.' + nick, password: pw, area: role === 'management' ? 'management' : 'gate' });
    if (r.status !== 200) throw new Error('login ' + nick + ' falhou: ' + r.status);
    sessions[nick] = r.cookie;
  }
  try {
    let r = await api('GET', '/solicitacoes', null);
    ok('1) sem login -> 401', r.status === 401, '[' + r.status + ']');

    r = await api('GET', '/solicitacoes', sessions.recepcao);
    ok('2) recepção, todas pendentes -> lista vazia', r.status === 200 && r.body.length === 0, '[' + r.status + ', ' + (r.body || []).length + ' itens]');

    r = await api('GET', '/solicitacoes', sessions.gestao);
    const list = r.body || [];
    const resp = list.find((x) => x.type === 'responsavel');
    const aluno = list.find((x) => x.type === 'aluno');
    ok('3) gestão vê todas, com CPF', r.status === 200 && list.length >= 2 && resp && resp.cpf.length === 11, '[' + r.status + ', ' + list.length + ' itens]');

    r = await api('PATCH', '/solicitacoes/' + resp.id + '/decisao', sessions.recepcao, { approve: true });
    ok('4) recepção tenta decidir -> 403', r.status === 403, '[' + r.status + ']');

    r = await api('PATCH', '/solicitacoes/' + aluno.id + '/decisao', sessions.gestao, { approve: false });
    ok('5) indeferir sem motivo -> 400', r.status === 400, '[' + r.status + '] ' + (r.body && r.body.message));

    r = await api('PATCH', '/solicitacoes/' + aluno.id + '/decisao', sessions.gestao, { approve: false, reason: 'Sem autorização do responsável.' });
    ok('6) indeferir com motivo -> 204', r.status === 204, '[' + r.status + ']');

    r = await api('PATCH', '/solicitacoes/' + resp.id + '/decisao', sessions.gestao, { approve: true, by: 'forjado', at: '2000-01-01' });
    ok('7) autorizar -> 204', r.status === 204, '[' + r.status + ']');

    r = await api('PATCH', '/solicitacoes/' + resp.id + '/decisao', sessions.gestao, { approve: false, reason: 'Mudei de ideia.' });
    ok('8) decidir de novo -> 409', r.status === 409, '[' + r.status + ']');

    r = await api('GET', '/solicitacoes', sessions.portaria);
    const seen = r.body || [];
    ok('9) portaria vê só a autorizada, sem CPF e telefone', r.status === 200 && seen.length === 1 && seen[0].cpf === '' && seen[0].guardianPhone === '', '[' + r.status + ', ' + seen.length + ' itens]');

    const row = db.prepare('SELECT status, decision_by, decision_at FROM solicitacoes WHERE id = ?').get(resp.id);
    ok('10) quem decidiu veio da sessão, não do corpo', row.status === 'approved' && row.decision_by === 'Teste gestao' && !row.decision_at.startsWith('2000'), JSON.stringify(row));
  } finally {
    cleanup();
  }
})().catch((e) => { try { cleanup(); } catch {} console.error('Erro no teste:', e.message); process.exit(1); });
