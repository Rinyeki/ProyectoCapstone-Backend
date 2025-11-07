class UsuarioInputPort {
  async getById(id) { throw new Error('Not implemented'); }
  async getByIdWithFilters(id, filters) { throw new Error('Not implemented'); }
  async getPymes(id, filters) { throw new Error('Not implemented'); }
}

module.exports = { UsuarioInputPort };