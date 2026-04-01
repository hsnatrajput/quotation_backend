// routes/proposalPrint.js
const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');

router.get('/:proposalId', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ proposalId: req.params.proposalId });

    if (!quotation) {
      return res.status(404).send('Quotation not found');
    }

    // Render the same components as ProposalPage but in one continuous view (no stepper)
    // For simplicity, we use server-side rendering with EJS or inline HTML.
    // Since your components are React, we'll create a clean HTML version.

    res.render('proposal-print', { quotation });   // We'll create this EJS template next

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating print view');
  }
});

module.exports = router;