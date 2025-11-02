const express = require('express');
const router = express.Router();
const {
  createContract,
  requestContract,
  getMyContracts,
  getContract,
  signContract,
  generatePDF,
  updateContract,
  deleteContract
} = require('../controllers/contract.controller');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/', protect, createContract);
router.post('/request', requestContract);
router.get('/', getMyContracts);
router.get('/:id', getContract);
router.put('/:id/sign', signContract);
router.get('/:id/pdf', generatePDF);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

module.exports = router;
