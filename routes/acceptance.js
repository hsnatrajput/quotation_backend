// routes/acceptance.js
const express = require('express');
const router = express.Router();
const { submitAcceptance, getAllAcceptances } = require('../controllers/acceptanceController');

router.post('/', submitAcceptance);
router.get('/', getAllAcceptances);

module.exports = router;