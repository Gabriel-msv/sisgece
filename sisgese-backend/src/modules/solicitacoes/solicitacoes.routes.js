'use strict';
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const service = require('./solicitacoes.service');
const { solicitacaoSchema } = require('./solicitacoes.schema');

const router = express.Router();

const limitCreate = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Muitas solicitações enviadas. Tente novamente mais tarde.' }
});

// Público: números da página inicial.
router.get('/estatisticas', (req, res) => res.json(service.getStats()));

// Público: criar solicitação.
router.post('/solicitacoes', limitCreate, (req, res, next) => {
  try {
    const data = solicitacaoSchema.parse(req.body ?? {});
    res.status(201).json(service.create(data));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
