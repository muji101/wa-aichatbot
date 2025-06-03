const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const productsPath = path.join(__dirname, '../config/products.json');

// Helper functions for better code organization
const readProducts = async () => {
    try {
        const data = await fs.readFile(productsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

const writeProducts = async (products) => {
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
};

const validateProductInput = (productData) => {
    const { name, description, category, price, stock } = productData;
    const errors = [];

    if (!name?.trim()) errors.push('Name is required');
    if (!description?.trim()) errors.push('Description is required');
    if (!category?.trim()) errors.push('Category is required');
    
    if (price !== undefined && (isNaN(price) || price < 0)) {
        errors.push('Price must be a non-negative number');
    }
    
    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
        errors.push('Stock must be a non-negative number');
    }

    return errors;
};

const sanitizeProductData = (productData) => {
    const { name, description, category, price, link, stock } = productData;
    
    return {
        name: name?.trim(),
        description: description?.trim(),
        category: category?.trim(),
        price: parseInt(price) || 0,
        link: link?.trim() || null,
        stock: parseInt(stock) || 0
    };
};

const findProductById = (products, id) => {
    const index = products.findIndex(p => p.id === id);
    return index !== -1 ? { product: products[index], index } : null;
};

const checkDuplicateName = (products, name, excludeId = null) => {
    return products.find(p => 
        p.name.toLowerCase() === name.toLowerCase() && 
        p.id !== excludeId
    );
};

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const products = await readProducts();
        res.json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to read products' });
    }
});

// GET /api/products/:id - Get specific product
router.get('/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error reading product:', error);
        res.status(500).json({ error: 'Failed to read product' });
    }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        
        // Validate input
        const validationErrors = validateProductInput(productData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }
        
        const products = await readProducts();
        
        // Check if product with same name already exists
        const existingProduct = checkDuplicateName(products, productData.name);
        if (existingProduct) {
            return res.status(400).json({ error: 'Product with this name already exists' });
        }
        
        const newProduct = {
            id: uuidv4(),
            ...sanitizeProductData(productData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await writeProducts(products);
        
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
    try {
        const productData = req.body;
        
        // Validate input
        const validationErrors = validateProductInput(productData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }

        const products = await readProducts();
        const productResult = findProductById(products, req.params.id);
        
        if (!productResult) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const sanitizedData = sanitizeProductData(productData);
        
        // Check for duplicate name
        const duplicateProduct = checkDuplicateName(products, sanitizedData.name, req.params.id);
        if (duplicateProduct) {
            return res.status(400).json({ 
                error: 'Another product with this name already exists' 
            });
        }
        
        const updatedProduct = {
            ...productResult.product,
            ...sanitizedData,
            updatedAt: new Date().toISOString()
        };
        
        products[productResult.index] = updatedProduct;
        await writeProducts(products);
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const productResult = findProductById(products, req.params.id);
        
        if (!productResult) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const deletedProduct = productResult.product;
        products.splice(productResult.index, 1);
        await writeProducts(products);
        
        res.json({ 
            message: 'Product deleted successfully', 
            deletedProduct 
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// GET /api/products/search - Search products
router.get('/search', async (req, res) => {
    try {
        const { q, category, limit } = req.query;
        let products = await readProducts();
        
        // Filter by search query
        if (q) {
            const searchTerm = q.toLowerCase();
            products = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by category
        if (category) {
            products = products.filter(product => product.category === category);
        }
        
        // Limit results
        if (limit) {
            products = products.slice(0, parseInt(limit));
        }
        
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// GET /api/products/stats - Get product statistics
router.get('/stats', async (req, res) => {
    try {
        const products = await readProducts();
        
        const stats = {
            total: products.length,
            byCategory: {},
            lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
            outOfStock: products.filter(p => p.stock === 0).length,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0)
        };
        
        // Count by category
        products.forEach(product => {
            if (stats.byCategory[product.category]) {
                stats.byCategory[product.category]++;
            } else {
                stats.byCategory[product.category] = 1;
            }
        });
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({ error: 'Failed to get product statistics' });
    }
});

module.exports = router;
