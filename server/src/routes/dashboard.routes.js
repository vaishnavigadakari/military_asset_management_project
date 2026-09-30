const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDashboardMetrics, getNetMovementBreakdown } = require('../services/metricsService');

// Get Dashboard Aggregated Key Metrics
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    let { startDate, endDate, baseId, equipmentTypeId } = req.query;

    // Scoping for Base Commander and Logistics Officer if baseId is not explicit
    if (req.user.role !== 'Admin' && req.user.base_id) {
      if (!baseId || baseId === 'all') {
        baseId = String(req.user.base_id);
      }
    }

    const filters = {
      startDate: startDate || null,
      endDate: endDate || null,
      baseId: baseId || 'all',
      equipmentTypeId: equipmentTypeId || 'all'
    };

    const metrics = getDashboardMetrics(filters);
    res.json({
      filters,
      metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard metrics.', error: error.message });
  }
});

// Get Pop-up Detailed Breakdowns for Net Movement (Purchases, Transfers In, Transfers Out) [Bonus Requirement]
router.get('/breakdown', authenticateToken, (req, res) => {
  try {
    let { startDate, endDate, baseId, equipmentTypeId } = req.query;

    if (req.user.role !== 'Admin' && req.user.base_id) {
      if (!baseId || baseId === 'all') {
        baseId = String(req.user.base_id);
      }
    }

    const filters = {
      startDate: startDate || null,
      endDate: endDate || null,
      baseId: baseId || 'all',
      equipmentTypeId: equipmentTypeId || 'all'
    };

    const breakdown = getNetMovementBreakdown(filters);
    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching net movement breakdown:', error);
    res.status(500).json({ message: 'Failed to retrieve net movement breakdown.', error: error.message });
  }
});

module.exports = router;
