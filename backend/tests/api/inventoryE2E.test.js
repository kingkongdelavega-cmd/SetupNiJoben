const request = require('supertest')
const app = require('../../src/app')

const { inventory } = require('../../src/services/inventoryStore')

function getItem(itemId) {
  return inventory.find((i) => i.id === itemId)
}

function snapshotItem(itemId) {
  const item = getItem(itemId)
  if (!item) throw new Error(`Test fixture missing inventory item: ${itemId}`)
  return { inStock: item.inStock, status: item.status }
}

function restoreItem(itemId, { inStock, status }) {
  const item = getItem(itemId)
  if (!item) throw new Error(`Test fixture missing inventory item: ${itemId}`)
  item.inStock = inStock
  item.status = status
}

describe('Inventory Management - End-to-End API (OB2W6D1)', () => {
  // Tracks snapshots taken during a test so they are always restored,
  // even if an assertion throws partway through.
  let pendingRestores = []

  function trackSnapshot(itemId) {
    const snapshot = snapshotItem(itemId)
    pendingRestores.push({ itemId, snapshot })
    return snapshot
  }

  afterEach(() => {
    pendingRestores.forEach(({ itemId, snapshot }) => restoreItem(itemId, snapshot))
    pendingRestores = []
  })

  it('GET /api/inventory returns items with id + status', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(Array.isArray(res.body.data)).toBe(true)

    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0]).toHaveProperty('id')
    expect(res.body.data[0]).toHaveProperty('status')
    expect(res.body.data[0].status).toEqual(
      expect.stringMatching(/OutOfStock|Low|NearingExpiration|Good|Available|NearExpiring/i)
    )
  })

  it('PUT /api/inventory/:id updates stock and recalculates status', async () => {
    const itemId = 'I-002'
    const before = trackSnapshot(itemId)

    const res = await request(app)
      .put(`/api/inventory/${encodeURIComponent(itemId)}`)
      .send({ quantity: 1, reason: 'restock', notes: 'testing' })
      .expect(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('id', itemId)
    expect(res.body.data).toHaveProperty('inStock')
    expect(res.body.data).toHaveProperty('status')

    const after = getItem(itemId)
    expect(after.inStock).toBe(before.inStock + 1)
    expect(after.status).toBe(res.body.data.status)
  })

  it('PUT /api/inventory/:id rejects invalid quantity with 400', async () => {
    const itemId = 'I-001'

    const res = await request(app)
      .put(`/api/inventory/${encodeURIComponent(itemId)}`)
      .send({ quantity: NaN, reason: 'restock' })
      .expect(400)

    expect(res.body).toHaveProperty('error')
    expect(String(res.body.error)).toMatch(/quantity/i)
  })

  it('PUT /api/inventory/:id rejects missing reason with 400', async () => {
    const itemId = 'I-001'

    const res = await request(app)
      .put(`/api/inventory/${encodeURIComponent(itemId)}`)
      .send({ quantity: 1, reason: '   ' })
      .expect(400)

    expect(res.body).toHaveProperty('error')
    expect(String(res.body.error)).toMatch(/reason/i)
  })

  it('POS transaction deducts inventory and reflected by subsequent GET /api/inventory', async () => {
    const itemId = 'I-002'
    const before = trackSnapshot(itemId)

    if (before.inStock <= 0) {
      throw new Error(`Fixture inventory ${itemId} has non-positive stock; cannot test deduction.`)
    }

    const deductionQty = 1

    const saleRes = await request(app)
      .post('/api/sales/transactions')
      .send({
        orderId: 'ORD-E2E-INV-1',
        items: [{ itemId, quantity: deductionQty, itemName: 'Milk' }],
      })
      .expect(201)

    expect(saleRes.body).toHaveProperty('success', true)
    expect(saleRes.body).toHaveProperty('data')
    expect(saleRes.body.data).toHaveProperty('items')
    expect(Array.isArray(saleRes.body.data.items)).toBe(true)

    const afterDeduct = getItem(itemId)
    expect(afterDeduct.inStock).toBe(before.inStock - deductionQty)

    const invRes = await request(app)
      .get('/api/inventory')
      .expect(200)

    const row = invRes.body.data.find((x) => x.id === itemId)
    expect(row).toBeTruthy()
    expect(row.inStock).toBe(before.inStock - deductionQty)
    expect(row.status).toBe(afterDeduct.status)

    if (row.inStock <= 5 && row.inStock > 0) {
      expect(row.status).toBe('Low')
    }
    if (row.inStock === 0) {
      expect(row.status).toBe('OutOfStock')
    }
  })

  it('POS transaction prevents deduction below zero and returns 409; inventory unchanged', async () => {
    const itemId = 'I-002'
    const before = trackSnapshot(itemId)

    const qtyTooHigh = before.inStock + 1

    const saleRes = await request(app)
      .post('/api/sales/transactions')
      .send({
        orderId: 'ORD-E2E-INV-2',
        items: [{ itemId, quantity: qtyTooHigh, itemName: 'Milk' }],
      })
      .expect(409)

    expect(saleRes.body).toHaveProperty('success', false)
    expect(saleRes.body).toHaveProperty('error')
    expect(String(saleRes.body.error.message)).toMatch(/insufficient stock/i)

    const after = getItem(itemId)
    expect(after.inStock).toBe(before.inStock)
    expect(after.status).toBe(before.status)
  })

  it('GET /api/inventory/alerts returns alerts payload (baseline integration check)', async () => {
    const res = await request(app)
      .get('/api/inventory/alerts')
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(Array.isArray(res.body.data)).toBe(true)

    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('id')
      expect(res.body.data[0]).toHaveProperty('severity')
      expect(res.body.data[0]).toHaveProperty('timestamp')
    }
  })

  it('low-stock alert appears after POS sale drops item below threshold', async () => {
    const itemId = 'I-002'
    const before = trackSnapshot(itemId)

    // Drop stock to exactly the "Low" threshold (<=5) via a sale, regardless
    // of starting value, so this test doesn't depend on fixture stock levels.
    const targetStock = 5
    if (before.inStock <= targetStock) {
      throw new Error(
        `Fixture inventory ${itemId} already at or below Low threshold (${before.inStock}); adjust fixture or test setup.`
      )
    }
    const deductionQty = before.inStock - targetStock

    await request(app)
      .post('/api/sales/transactions')
      .send({
        orderId: 'ORD-E2E-INV-3',
        items: [{ itemId, quantity: deductionQty, itemName: 'Milk' }],
      })
      .expect(201)

    const afterDeduct = getItem(itemId)
    expect(afterDeduct.inStock).toBe(targetStock)
    expect(afterDeduct.status).toBe('Low')

    const alertsRes = await request(app)
      .get('/api/inventory/alerts')
      .expect(200)

    const alert = alertsRes.body.data.find((a) => a.itemId === itemId)
    expect(alert).toBeTruthy()
    expect(alert.status).toBe('Low')
    expect(alert.severity).toBe('warning')
  })
})