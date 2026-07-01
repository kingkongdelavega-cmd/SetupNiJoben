// Mock alert data for inventory low-stock warnings
export const mockAlerts = [
  {
    id: 'ALERT-001',
    itemId: 'I-002',
    itemName: 'Whole Milk',
    category: 'Dairy',
    currentStock: 5,
    threshold: 10,
    severity: 'critical',
    message: 'Whole Milk is running critically low',
    timestamp: new Date(Date.now() - 2 * 60000), // 2 minutes ago
  },
  {
    id: 'ALERT-002',
    itemId: 'I-005',
    itemName: 'Cookies',
    category: 'Snacks',
    currentStock: 3,
    threshold: 15,
    severity: 'critical',
    message: 'Cookies stock is critically low',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
  },
  {
    id: 'ALERT-003',
    itemId: 'I-003',
    itemName: 'Vanilla Syrup',
    category: 'Condiments',
    currentStock: 7,
    threshold: 12,
    severity: 'warning',
    message: 'Vanilla Syrup is nearing reorder level',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
  },
];

export default mockAlerts;
