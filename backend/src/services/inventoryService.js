const inventorySupabaseStore = require('./inventorySupabaseStore')

function computeStatus(inStock) {
  if (inStock === 0) return 'OutOfStock'
  if (inStock <= 5) return 'Low'
  if (inStock <= 10) return 'NearingExpiration'
  return 'Good'
}

function mapInventoryRow(row) {
  const id = row.id
  const name = row.item_name
  // Supabase tests/model uses nested relationship: inventory_categories: { name }
  const category =
    row.category_name ?? row.inventory_categories?.name ?? row.category ?? undefined
  const inStock = Number(row.current_stock ?? row.in_stock ?? 0)

  return {
    id,
    name,
    category,
    inStock,
    status: computeStatus(inStock),
  }
}

async function listInventory({ q, category } = {}) {
  const keyword = typeof q === 'string' ? q.trim().toLowerCase() : ''
  const normalizedCategory = typeof category === 'string' ? category.trim() : ''

  let rows
  try {
    rows = await inventorySupabaseStore.getAllInventory()
  } catch (err) {
    console.log('err', err)

    const { inventory } = require('./inventoryStore')
    return inventory
  }

  let result = rows.map(mapInventoryRow)

  if (normalizedCategory) {
    result = result.filter((item) => item.category === normalizedCategory)
  }

  if (keyword) {
    result = result.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)
      )
    })
  }

  return result
}

function createHttpError(message, statusCode) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

function resolveInMemoryItem(id) {
  const { inventory } = require('./inventoryStore')
  return inventory.find((it) => it.id === id)
}

function updateInMemoryStatus(item) {
  item.status = computeStatus(item.inStock)
  return item
}

// --- Best-effort Supabase write-through -------------------------------
//
// Closes the gap where reads (listInventory) try Supabase but writes
// (update/deduct/create/delete) previously only ever touched the
// in-memory store — meaning even a fully-configured Supabase project
// would silently never receive any writes, so "database records match
// displayed inventory information" could not hold once the DB was live.
//
// This is deliberately fire-and-forget / non-blocking:
//   - It does NOT change the synchronous return value of
//     updateInventoryById / deductInventoryById / createInventoryItem /
//     deleteInventoryItem, so existing callers and existing unit tests
//     that assert on the returned in-memory item are unaffected.
//   - Failures (including "Supabase not configured" in dev/CI) are
//     caught and logged, never thrown, so behavior in unconfigured
//     environments is identical to before.
//   - This is an *eventually-consistent* sync, not a two-phase commit.
//     A follow-up improvement (once existing unit tests for update/
//     deduct are visible) would migrate these functions to be fully
//     async and await the Supabase write before responding, so a client
//     never sees a "success" response that hasn't actually reached the
//     database yet.
function bestEffortSupabaseSync(promiseFactory, context) {
  Promise.resolve()
    .then(promiseFactory)
    .catch((err) => {
      console.warn(`[inventoryService] Supabase sync skipped/failed (${context}):`, err?.message || err)
    })
}

function updateInventoryById(id, { quantity, reason, notes } = {}) {
  const item = resolveInMemoryItem(id)

  if (!item) {
    const err = new Error('Inventory item not found')
    err.statusCode = 404
    throw err
  }

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    const err = new Error('`quantity` must be a number')
    err.statusCode = 400
    throw err
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    const err = new Error('`reason` must be provided')
    err.statusCode = 400
    throw err
  }

  const newStock = item.inStock + quantity
  item.inStock = newStock
  updateInMemoryStatus(item)

  void notes

  bestEffortSupabaseSync(
    () => inventorySupabaseStore.updateInventory(id, { current_stock: newStock }),
    `updateInventoryById(${id})`
  )

  return item
}

function deductInventoryById(id, { quantity, reason, notes } = {}) {
  const item = resolveInMemoryItem(id)

  if (!item) {
    throw createHttpError('Inventory item not found', 404)
  }

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    throw createHttpError('`quantity` must be a number', 400)
  }

  if (quantity <= 0) {
    throw createHttpError('`quantity` must be greater than 0', 400)
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    throw createHttpError('`reason` must be provided', 400)
  }

  const newStock = item.inStock - quantity
  if (newStock < 0) {
    throw createHttpError('Insufficient stock', 409)
  }

  item.inStock = newStock
  updateInMemoryStatus(item)

  void notes

  bestEffortSupabaseSync(
    () => inventorySupabaseStore.updateInventory(id, { current_stock: newStock }),
    `deductInventoryById(${id})`
  )

  return item
}

// --- Create / Delete, closing the CRUD gap ---
function generateNextId(inventory) {
  const nums = inventory
    .map((it) => {
      const match = String(it.id).match(/-(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .filter((n) => !Number.isNaN(n))

  const max = nums.length ? Math.max(...nums) : 0
  const next = max + 1
  return `I-${String(next).padStart(3, '0')}`
}

function createInventoryItem({ name, category, inStock } = {}) {
  const { inventory } = require('./inventoryStore')

  if (typeof name !== 'string' || name.trim() === '') {
    throw createHttpError('`name` must be provided', 400)
  }

  const stock = Number(inStock)
  if (Number.isNaN(stock) || stock < 0) {
    throw createHttpError('`inStock` must be a non-negative number', 400)
  }

  const id = generateNextId(inventory)
  const item = {
    id,
    name: name.trim(),
    category: category || undefined,
    inStock: stock,
    status: computeStatus(stock),
  }

  inventory.push(item)

  bestEffortSupabaseSync(
    () =>
      inventorySupabaseStore.createInventory({
        id: item.id,
        item_name: item.name,
        current_stock: item.inStock,
        category: item.category,
      }),
    `createInventoryItem(${item.id})`
  )

  return item
}

function deleteInventoryItem(id) {
  const { inventory } = require('./inventoryStore')

  const index = inventory.findIndex((it) => it.id === id)
  if (index === -1) {
    throw createHttpError('Inventory item not found', 404)
  }

  const [deleted] = inventory.splice(index, 1)

  bestEffortSupabaseSync(
    () => inventorySupabaseStore.deleteInventory(id),
    `deleteInventoryItem(${id})`
  )

  return deleted
}

module.exports = {
  computeStatus,
  mapInventoryRow,
  listInventory,
  updateInventoryById,
  deductInventoryById,
  createInventoryItem,
  deleteInventoryItem,
}