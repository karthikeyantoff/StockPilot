const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// 1. Get all products with search & category filtering
const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    const filtered = lowStock === 'true'
      ? products.filter((p) => p.stock <= p.lowStockThreshold)
      : products;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products: ' + err.message });
  }
};

// 2. Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product: ' + err.message });
  }
};

// 3. Create new product
const createProduct = async (req, res) => {
  try {
    const { name, price, stock, category, sku, lowStockThreshold } = req.body;

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedThreshold = lowStockThreshold ? Number(lowStockThreshold) : 5;

    if (!name || isNaN(parsedPrice) || isNaN(parsedStock)) {
      return res.status(400).json({
        error: 'Invalid input: Please provide a valid Name, Price, and Stock quantity.',
      });
    }

    if (parsedPrice < 0 || parsedStock < 0) {
      return res.status(400).json({
        error: 'Price and Stock cannot be negative numbers.',
      });
    }

    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;

    const product = new Product({
      name: name.trim(),
      sku: generatedSku,
      category: category ? category.trim() : 'General',
      price: parsedPrice,
      stock: parsedStock,
      lowStockThreshold: parsedThreshold,
    });

    await product.save();

    await AuditLog.create({
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product._id.toString(),
      description: `New product added: "${product.name}" ($${product.price}, Stock: ${product.stock})`,
      metadata: { name: product.name, price: product.price, stock: product.stock, sku: product.sku },
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'Anonymous / System',
      ipAddress: req.ip,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
};

// 4. Update product
const updateProduct = async (req, res) => {
  try {
    const { name, price, stock, category, lowStockThreshold } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const previousStock = product.stock;

    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (category !== undefined) product.category = category.trim();
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

    await product.save();

    await AuditLog.create({
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: product._id.toString(),
      description: `Product updated: "${product.name}". Stock changed: ${previousStock} -> ${product.stock}`,
      metadata: { previousStock, newStock: product.stock, price: product.price },
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'System',
      ipAddress: req.ip,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
};

// 5. Delete product (soft-delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await AuditLog.create({
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: product._id.toString(),
      description: `Product archived: "${product.name}"`,
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'System',
      ipAddress: req.ip,
    });

    res.json({ message: 'Product archived successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
};

// 6. Seed demo products if catalog is empty
const seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments({ isActive: true });
    if (count > 0) {
      return res.json({ message: `Database already has ${count} products.` });
    }

    const defaultItems = [
      { name: 'Wireless Barcode Scanner', sku: 'SKU-SCN01', category: 'Hardware', price: 49.99, stock: 25, lowStockThreshold: 5 },
      { name: 'Thermal Receipt Paper (50pk)', sku: 'SKU-RPT50', category: 'Supplies', price: 29.50, stock: 60, lowStockThreshold: 10 },
      { name: 'Heavy-Duty Cash Drawer', sku: 'SKU-DRW02', category: 'Hardware', price: 85.00, stock: 12, lowStockThreshold: 3 },
      { name: 'Touchscreen POS Terminal Stand', sku: 'SKU-STD09', category: 'Accessories', price: 39.99, stock: 18, lowStockThreshold: 4 },
      { name: 'Optical USB Barcode Wand', sku: 'SKU-OPT33', category: 'Hardware', price: 22.00, stock: 4, lowStockThreshold: 5 },
      { name: 'Direct Thermal Barcode Labels', sku: 'SKU-LBL04', category: 'Supplies', price: 15.75, stock: 40, lowStockThreshold: 8 },
    ];

    const inserted = await Product.insertMany(defaultItems);
    res.status(201).json({ message: `Successfully seeded ${inserted.length} demo products.`, inserted });
  } catch (err) {
    res.status(500).json({ error: 'Seeding failed: ' + err.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
};
