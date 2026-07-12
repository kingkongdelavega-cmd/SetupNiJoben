const request = require('supertest')
const app = require('../src/app')

describe('Inventory API', () => {
  test('GET / returns ok', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  test('GET /api/inventory returns array (requires Supabase env + DB data)', async () => {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }

    const res = await request(app).get('/api/inventory').expect(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

