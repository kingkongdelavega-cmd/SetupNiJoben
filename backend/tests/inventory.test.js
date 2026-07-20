const request = require('supertest')
const app = require('../src/app')
const inventorySupabaseStore = require('../src/services/inventorySupabaseStore')
const supabaseClient = require('../src/services/supabaseClient')
const { makeFakeSupabaseClient } = require('./helpers/fakeSupabaseClient')

describe('Inventory API', () => {
  beforeEach(() => {
    // Deterministic rows, in the exact shape a real Supabase "inventory"
    // table row + joined category would have. I-001 first, matching the
    // assertions below, and I-002 low enough to produce "alert-1".
    const seedRows = [
      {
        id: 'I-001',
        item_name: 'Milk Tea Powder',
        current_stock: 20,
        inventory_categories: { name: 'Beverage' },
      },
      {
        id: 'I-002',
        item_name: 'Cups (16oz)',
        current_stock: 3, // <=5 -> "Low" -> the only alert -> becomes alert-1
        inventory_categories: { name: 'Supplies' },
      },
    ]
    inventorySupabaseStore.__setSupabaseClient(() => makeFakeSupabaseClient(seedRows))
  })

  afterEach(() => {
    // Restore the real getter so the fake client doesn't leak into other
    // test files that run in the same process.
    inventorySupabaseStore.__setSupabaseClient(() => supabaseClient.getSupabase())
  })

  test('GET /api/inventory returns items', async () => {
    const res = await request(app).get('/api/inventory').expect(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0]).toHaveProperty('id', 'I-001')
  })

  test('GET /api/inventory/alerts returns alerts', async () => {
    const res = await request(app).get('/api/inventory/alerts').expect(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0]).toHaveProperty('id', 'alert-1')
    expect(res.body.data[0]).toHaveProperty('severity')
  })

  test('GET / returns ok', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})