const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { overview, conversionFunnel, leadSources, staffPerformance, trends, calendarData, exportCSV, exportPDF } = require('../controllers/reportsController');

router.use(verifyToken, requireAdmin);
router.get('/overview', overview);
router.get('/conversion-funnel', conversionFunnel);
router.get('/lead-sources', leadSources);
router.get('/staff-performance', staffPerformance);
router.get('/trends', trends);
router.get('/calendar', calendarData);
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

module.exports = router;
