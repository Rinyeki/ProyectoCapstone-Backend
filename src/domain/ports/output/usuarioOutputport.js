class UsuariosRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }
  async findByIdWithFilters(id, filters) {
    throw new Error('Not implemented');
  }
  async findUserPymes(id, filters) {
    throw new Error('Not implemented');
  }
}

module.exports = { UsuariosRepository };