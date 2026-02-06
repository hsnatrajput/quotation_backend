const express = require('express');
const router = express.Router();
const {
  createQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  getQuotationById, // ← add this import too
} = require('../controllers/quotationController');

const { protect } = require('../middleware/authMiddleware');

// Protected routes (admin only)
router.use(protect);

router.route('/')
  .post(createQuotation)
  .get(getQuotations);

// ← Add this new route here ↓
router.route('/:id')
  .get(getQuotationById)     // ← new single get
  .put(updateQuotation)
  .delete(deleteQuotation);

router.route('/:id/send')
  .post(sendQuotation);

module.exports = router;