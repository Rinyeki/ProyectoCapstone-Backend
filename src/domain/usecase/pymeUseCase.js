const { PymeInputPort } = require('../ports/input/pymeInputport');
const { PymesRepository } = require('../ports/output/pymeOutputport');

class PymeUseCase extends PymeInputPort {
  constructor(pymesRepository) {
    super();
    if (!pymesRepository || !(pymesRepository instanceof PymesRepository || typeof pymesRepository.findAll === 'function')) {
      throw new Error('pymesRepository inválido');
    }
    this.pymesRepository = pymesRepository;
  }

  async list(filters = {}) {
    return await this.pymesRepository.findAll(filters);
  }
}

module.exports = { PymeUseCase };