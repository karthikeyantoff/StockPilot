const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
} = require('../controllers/productController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);
router.post('/', optionalAuth, createProduct); // Optional auth keeps POS demo functional out-of-the-box
router.put('/:id', optionalAuth, updateProduct);
router.delete('/:id', optionalAuth, deleteProduct);
router.post('/seed', seedProducts);

module.exports = router;
