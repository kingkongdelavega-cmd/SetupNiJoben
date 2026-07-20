const express = require('express')
const router = express.Router()
const { listInventory } = require('../services/inventoryService')

const LOW_STOCK_STATUSES = new Set(['Low', 'OutOfStock', 'NearingExpiration'])

function buildAlertFromItem(item, index) {
  const severity = item.status === 'OutOfStock' ? 'critical' : 'warning'
  const message =
    item.status === 'OutOfStock'
      ? `${item.name} is out of stock`
      : `${item.name} is running low (${item.inStock} remaining)`

  // Unit tests expect: first returned alert to have id "alert-1".
  // Alert ids are assigned by position among alerting items (1-based),
  // NOT derived from the underlying item's own id/number. The item
  // that happens to sit first in the inventory list may not be the
  // first (or even an) alerting item, so numbering must be based on
  // the item's index within the *filtered* alerts list.
  return {
    id: `alert-${index + 1}`,
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    inStock: item.inStock,
    status: item.status,
    severity,
    message,
    timestamp: new Date().toISOString(),
  }
}

// GET /api/inventory/alerts
// Computes low-stock / out-of-stock alerts live from current inventory,
// rather than serving static mock data, so alerts stay in sync with
// real-time stock changes (e.g. after a POS sale).
router.get('/', async (req, res) => {
  try {
    const inventory = await listInventory({})

    const alerts = inventory
      .filter((item) => {
        // Unit test uses inventoryModel where statuses are like "Available" and "Low".
        // Only items in a low-stock-ish or out-of-stock state produce alerts.
        return LOW_STOCK_STATUSES.has(item.status) || item.status === 'OutOfStock'
      })
      .map((item, index) => buildAlertFromItem(item, index))

    res.status(200).json({
      success: true,
      data: alerts,
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

module.exports = router