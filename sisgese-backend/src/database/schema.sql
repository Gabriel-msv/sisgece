CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  identity      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('superuser','management','reception','gate')),
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS solicitacoes (
  id               TEXT PRIMARY KEY,
  protocol         TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL CHECK (type IN ('aluno','responsavel')),
  requester_name   TEXT NOT NULL,
  student_name     TEXT NOT NULL,
  enrollment       TEXT NOT NULL DEFAULT '',
  course           TEXT NOT NULL DEFAULT '',
  guardian_name    TEXT NOT NULL DEFAULT '',
  guardian_phone   TEXT NOT NULL DEFAULT '',
  cpf              TEXT NOT NULL DEFAULT '',
  kinship          TEXT NOT NULL DEFAULT '',
  exit_type        TEXT NOT NULL,
  exit_date        TEXT NOT NULL,
  exit_time        TEXT NOT NULL,
  justification    TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','done')),
  decision_by      TEXT,
  decision_at      TEXT,
  decision_reason  TEXT,
  reception_by     TEXT,
  reception_at     TEXT,
  gate_by          TEXT,
  gate_at          TEXT
);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status);

CREATE TABLE IF NOT EXISTS auditoria (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  action      TEXT NOT NULL,
  request_id  TEXT,
  detail      TEXT NOT NULL DEFAULT '',
  by_user     TEXT NOT NULL,
  at          TEXT NOT NULL
);
