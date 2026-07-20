const express = require('express')
const router = express.Router()

const {
  listInventory,
  updateInventoryById,
  createInventoryItem,
  deleteInventoryItem,
} = require('../services/inventoryService')

// READ (list)
router.get('/', async (req, res) => {
  const { q, category } = req.query

  try {
    const data = await listInventory({ q, category })
    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    res.status(err?.statusCode || 500).json({
      success: false,
      error: {
        message: err?.message || 'Internal server error',
      },
    })
  }
})

// CREATE
router.post('/', (req, res) => {
  const { name, category, inStock } = req.body || {}

  try {
    const data = createInventoryItem({ name, category, inStock })
    res.status(201).json({
      success: true,
      data,
    })
  } catch (err) {
    const status = err?.statusCode || 500
    res.status(status).json({
      success: false,
      error: { message: err.message || 'Internal server error' },
    })
  }
})

// UPDATE
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { quantity, reason, notes } = req.body || {}

  try {
    const data = updateInventoryById(id, { quantity, reason, notes })
    res.json({ data })
  } catch (err) {
    const status = err?.statusCode || 500
    res.status(status).json({ error: err.message || 'Internal server error' })
  }
})

// DELETE
router.delete('/:id', (req, res) => {
  const { id } = req.params

  try {
    const data = deleteInventoryItem(id)
    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    const status = err?.statusCode || 500
    res.status(status).json({
      success: false,
      error: { message: err.message || 'Internal server error' },
    })
  }
})

module.exports = router