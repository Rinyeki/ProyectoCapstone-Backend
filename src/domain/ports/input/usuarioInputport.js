class UsuarioInputPort {
  async getById(id) { throw new Error('Not implemented'); }
  async getByIdWithFilters(id, filters) { throw new Error('Not implemented'); }
  async getPymes(id, filters) { throw new Error('Not implemented'); }
  async list(filters) { throw new Error('Not implemented'); }
  async create(data) { throw new Error('Not implemented'); }
  async update(id, data) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

module.exports = { UsuarioInputPort };