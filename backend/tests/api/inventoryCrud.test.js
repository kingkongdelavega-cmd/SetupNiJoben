const request = require('supertest')
const app = require('../../src/app')

const { inventory } = require('../../src/services/inventoryStore')

describe('Inventory Management - Create/Delete API (OB2W6D1 follow-up)', () => {
  // Track ids created during a test so we can always clean them up,
  // even if an assertion throws partway through.
  let createdIds = []

  afterEach(() => {
    createdIds.forEach((id) => {
      const idx = inventory.findIndex((it) => it.id === id)
      if (idx !== -1) inventory.splice(idx, 1)
    })
    createdIds = []
  })

  it('POST /api/inventory creates a new item and it appears in subsequent GET', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({ name: 'Test Syrup', category: 'Beverage', inStock: 12 })
      .expect(201)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toMatchObject({
      name: 'Test Syrup',
      category: 'Beverage',
      inStock: 12,
      status: 'Good',
    })

    createdIds.push(res.body.data.id)

    const listRes = await request(app).get('/api/inventory').expect(200)
    const created = listRes.body.data.find((it) => it.id === res.body.data.id)
    expect(created).toBeTruthy()
    expect(created.inStock).toBe(12)
  })

  it('POST /api/inventory rejects missing name with 400', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({ category: 'Beverage', inStock: 5 })
      .expect(400)

    expect(res.body).toHaveProperty('success', false)
    expect(String(res.body.error.message)).toMatch(/name/i)
  })

  it('POST /api/inventory rejects negative or non-numeric inStock with 400', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({ name: 'Bad Stock Item', inStock: -3 })
      .expect(400)

    expect(res.body).toHaveProperty('success', false)
    expect(String(res.body.error.message)).toMatch(/inStock/i)
  })

  it('DELETE /api/inventory/:id removes the item so it no longer appears in GET', async () => {
    const createRes = await request(app)
      .post('/api/inventory')
      .send({ name: 'Temp Item To Delete', inStock: 4 })
      .expect(201)

    const id = createRes.body.data.id
    createdIds.push(id) // safety net in case delete assertion fails

    const deleteRes = await request(app)
      .delete(`/api/inventory/${encodeURIComponent(id)}`)
      .expect(200)

    expect(deleteRes.body).toHaveProperty('success', true)
    expect(deleteRes.body.data).toHaveProperty('id', id)

    // Already deleted -> nothing left to clean up in afterEach.
    createdIds = createdIds.filter((cid) => cid !== id)

    const listRes = await request(app).get('/api/inventory').expect(200)
    const stillThere = listRes.body.data.find((it) => it.id === id)
    expect(stillThere).toBeUndefined()
  })

  it('DELETE /api/inventory/:id returns 404 for a non-existent item', async () => {
    const res = await request(app)
      .delete('/api/inventory/I-DOES-NOT-EXIST')
      .expect(404)

    expect(res.body).toHaveProperty('success', false)
    expect(String(res.body.error.message)).toMatch(/not found/i)
  })
})