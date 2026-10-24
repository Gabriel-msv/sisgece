'use strict';
const express = require('express');
const { z } = require('zod');
const service = require('./gestao.service');
const { requireAuth, requireRole } = require('../auth/auth.middleware');

const router = express.Router();

const decisionSchema = z.object({
  approve: z.boolean({ message: 'Informe se a solicitação foi autorizada ou indeferida.' }),
  reason: z.string().max(300, 'Motivo longo demais (máximo 300 caracteres).').default('')
});

router.get('/solicitacoes', requireAuth, (req, res) => {
  res.json(service.list(req.user));
});

router.patch('/solicitacoes/:id/decisao', requireRole('superuser', 'management'), (req, res, next) => {
  try {
    const data = decisionSchema.parse(req.body ?? {});
    service.decidir(req.user, req.params.id, data);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
