const express = require('express')
const router = express.Router()

const initialInventory = require('../data/mockInventory')

// In-memory mutable store (project currently uses mock data)
const inventory = initialInventory.map((item) => ({ ...item }))

function computeStatus(inStock) {
  if (inStock === 0) return 'OutOfStock'
  if (inStock <= 5) return 'Low'
  if (inStock <= 10) return 'NearingExpiration'
  return 'Good'
}

router.get('/', (req, res) => {
  const { q, category } = req.query

  const keyword = typeof q === 'string' ? q.trim().toLowerCase() : ''
  const normalizedCategory = typeof category === 'string' ? category.trim() : ''

  let result = inventory

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

  res.json({ data: result })
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const item = inventory.find((it) => it.id === id)

  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }

  const { quantity, reason, notes } = req.body || {}

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    return res.status(400).json({ error: '`quantity` must be a number' })
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    return res.status(400).json({ error: '`reason` must be provided' })
  }

  // quantity can be positive (restock) or negative (consumption/usage)
  const newStock = item.inStock + quantity
  item.inStock = newStock
  item.status = computeStatus(newStock)

  // notes/reason accepted for future audit log (not stored in this simplified version)
  void notes

  res.json({ data: item })
})

module.exports = router

