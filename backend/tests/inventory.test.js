const request = require('supertest')
const app = require('../src/app')

describe('Inventory API', () => {
  test('GET /api/inventory returns items', async () => {
    const res = await request(app).get('/api/inventory').expect(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0]).toHaveProperty('id', 'I-001')
  })

  test('GET / returns ok', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  test('GET /api/inventory?q=keyword filters by name/id', async () => {
    const res = await request(app).get('/api/inventory?q=milk').expect(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0]).toHaveProperty('name')

    for (const item of res.body.data) {
      const name = String(item.name).toLowerCase()
      const id = String(item.id).toLowerCase()
      expect(name.includes('milk') || id.includes('milk')).toBe(true)
    }
  })

  test('GET /api/inventory?category=... filters by category', async () => {
    const res = await request(app)
      .get('/api/inventory?category=Dairy')
      .expect(200)

    expect(res.body.data.length).toBeGreaterThan(0)
    for (const item of res.body.data) {
      expect(item.category).toBe('Dairy')
    }
  })

  test('PUT /api/inventory/:id updates inStock and recomputes status', async () => {
    // item I-002 starts at 10 in mockInventory.js
    const updateRes = await request(app)
      .put('/api/inventory/I-002')
      .send({ quantity: -10, reason: 'Unit test adjustment', notes: 'test' })
      .expect(200)

    expect(updateRes.body).toHaveProperty('data')
    expect(updateRes.body.data).toHaveProperty('id', 'I-002')
    expect(updateRes.body.data).toHaveProperty('inStock', 0)
    expect(updateRes.body.data).toHaveProperty('status', 'OutOfStock')

    // persistence in-memory store
    const after = await request(app).get('/api/inventory').expect(200)
    const itemAfter = after.body.data.find((x) => x.id === 'I-002')
    expect(itemAfter).toBeDefined()
    expect(itemAfter.inStock).toBe(0)
    expect(itemAfter.status).toBe('OutOfStock')
  })
})

