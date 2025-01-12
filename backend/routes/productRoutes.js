const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/initialize-database', productController.initializeDatabase);
router.get('/transactions', productController.listTransactions);
router.get('/statistics', productController.getStatistics);
router.get('/bar-chart', productController.getBarChartData);
router.get('/pie-chart', productController.getPieChartData);
router.get('/combined-data', productController.getCombinedData);

module.exports = router;