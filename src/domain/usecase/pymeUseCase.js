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

  async getById(id) {
    return await this.pymesRepository.findById(id);
  }

  async create(data) {
    return await this.pymesRepository.create(data);
  }

  async update(id, data) {
    return await this.pymesRepository.update(id, data);
  }

  async delete(id) {
    return await this.pymesRepository.delete(id);
  }
}

module.exports = { PymeUseCase };