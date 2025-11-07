const express = require('express');
const { PymeUseCase } = require('../../../domain/usecase/pymeUseCase');
const { PymeSequelizeRepository } = require('../../repository/pymeRepository');

const router = express.Router();

const repository = new PymeSequelizeRepository();
const useCase = new PymeUseCase(repository);

router.get('/', async (req, res) => {
  try {
    const pymes = await useCase.list(req.query);
    res.json(pymes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pymes' });
  }
});

module.exports = { router };