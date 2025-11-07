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
}

module.exports = { UsuarioUseCase };