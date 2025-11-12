const { UsuarioInputPort } = require('../ports/input/usuarioInputport');
const { UsuariosRepository } = require('../ports/output/usuarioOutputport');

class UsuarioUseCase extends UsuarioInputPort {
  constructor(usuarioRepository) {
    super();
    if (!usuarioRepository || !(usuarioRepository instanceof UsuariosRepository || typeof usuarioRepository.findById === 'function')) {
      throw new Error('usuarioRepository inválido');
    }
    this.usuarioRepository = usuarioRepository;
  }

  async getById(id) {
    return await this.usuarioRepository.findById(id);
  }

  async getByIdWithFilters(id, filters = {}) {
    return await this.usuarioRepository.findByIdWithFilters(id, filters);
  }

  async getPymes(id, filters = {}) {
    return await this.usuarioRepository.findUserPymes(id, filters);
  }

  async list(filters = {}) {
    return await this.usuarioRepository.findAll(filters);
  }

  async create(data) {
    return await this.usuarioRepository.create(data);
  }

  async update(id, data) {
    return await this.usuarioRepository.update(id, data);
  }

  async delete(id) {
    return await this.usuarioRepository.delete(id);
  }
}

module.exports = { UsuarioUseCase };