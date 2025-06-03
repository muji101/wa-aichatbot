// Product Management JavaScript
let products = [];
let editingProductId = null;

// Ensure navbar menu is closed on page load
document.addEventListener('DOMContentLoaded', function() {
    const navbarMenu = document.getElementById('navbar-menu');
    if (navbarMenu) {
        navbarMenu.classList.remove('active');
    }
    
    // Initialize feather icons
    feather.replace();
    
    // Load products
    loadProducts();
});

// Load products from server
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            products = await response.json();
            displayProducts();
            updateStatistics();
        } else {
            console.error('Failed to load products');
            showNotification('Failed to load products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

// Display products in the list
function displayProducts(filteredProducts = null) {
    const productList = document.getElementById('productList');
    const productsToShow = filteredProducts || products;
    
    if (productsToShow.length === 0) {
        productList.innerHTML = `
            <div class="empty-state">
                <i data-feather="package" class="empty-state-icon"></i>
                <p>No products found.</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    productList.innerHTML = productsToShow.map(product => `
        <div class="product-item" data-id="${product.id}">
            <div class="product-header">
                <div class="product-info">
                    <h4 class="product-name">${escapeHtml(product.name)}</h4>
                    <span class="product-category ${product.category}">${formatCategory(product.category)}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-icon" onclick="editProduct('${product.id}')" title="Edit Product">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deleteProduct('${product.id}')" title="Delete Product">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
              <div class="product-description">
                ${escapeHtml(product.description)}
            </div>
            
            <div class="product-price">
                <strong>${formatPrice(product.price)}</strong>
            </div>
            
            <div class="product-details">
                <div class="product-stock ${getStockStatus(product.stock)}">
                    <i data-feather="package"></i>
                    Stock: ${product.stock === 0 ? 'Unlimited' : product.stock}
                </div>
                ${product.link ? `
                    <div class="product-link">
                        <a href="${escapeHtml(product.link)}" target="_blank" rel="noopener">
                            <i data-feather="external-link"></i>
                            View Product
                        </a>
                    </div>
                ` : ''}
            </div>
            
            <div class="product-meta">
                <small>Created: ${formatDate(product.createdAt)}</small>
                ${product.updatedAt && product.updatedAt !== product.createdAt ? 
                    `<small>Updated: ${formatDate(product.updatedAt)}</small>` : ''}
            </div>
        </div>
    `).join('');
    
    feather.replace();
}

// Add new product
async function addProduct(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category: document.getElementById('productCategory').value,
        price: parseInt(document.getElementById('productPrice').value) || 0,
        link: document.getElementById('productLink').value.trim(),
        stock: parseInt(document.getElementById('productStock').value) || 0
    };
    
    if (!formData.name || !formData.description || !formData.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newProduct = await response.json();
            products.unshift(newProduct);
            displayProducts();
            updateStatistics();
            clearForm();
            showNotification('Product added successfully!', 'success');
        } else {
            const error = await response.text();
            showNotification(`Failed to add product: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product', 'error');
    }
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price || '';
    document.getElementById('editProductLink').value = product.link || '';
    document.getElementById('editProductStock').value = product.stock;
    
    document.getElementById('editModal').style.display = 'flex';
}

// Update product
async function updateProduct(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('editProductName').value.trim(),
        description: document.getElementById('editProductDescription').value.trim(),
        category: document.getElementById('editProductCategory').value,
        price: parseInt(document.getElementById('editProductPrice').value) || 0,
        link: document.getElementById('editProductLink').value.trim(),
        stock: parseInt(document.getElementById('editProductStock').value) || 0
    };
    
    if (!formData.name || !formData.description || !formData.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${editingProductId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const updatedProduct = await response.json();
            const index = products.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                products[index] = updatedProduct;
                displayProducts();
                updateStatistics();
            }
            closeEditModal();
            showNotification('Product updated successfully!', 'success');
        } else {
            const error = await response.text();
            showNotification(`Failed to update product: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error updating product', 'error');
    }
}

// Delete product
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            products = products.filter(p => p.id !== productId);
            displayProducts();
            updateStatistics();
            showNotification('Product deleted successfully!', 'success');
        } else {
            const error = await response.text();
            showNotification(`Failed to delete product: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    
    let filtered = products;
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    displayProducts(filtered);
}

// Update statistics
function updateStatistics() {
    const totalProducts = products.length;
    const totalServices = products.filter(p => p.category === 'service').length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalServices').textContent = totalServices;
    document.getElementById('lowStockCount').textContent = lowStockCount;
}

// Clear form
function clearForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '0';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingProductId = null;
}

// Export products
function exportProducts() {
    if (products.length === 0) {
        showNotification('No products to export', 'info');
        return;
    }
    
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `products_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Products exported successfully!', 'success');
}

// Format price to Indonesian Rupiah
function formatPrice(price) {
    if (!price || price === 0) {
        return 'Contact for Price';
    }
    return `Rp ${parseInt(price).toLocaleString('id-ID')}`;
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatCategory(category) {
    const categories = {
        'product': 'Product',
        'service': 'Service',
        'digital': 'Digital',
        'course': 'Course',
        'other': 'Other'
    };
    return categories[category] || category;
}

function getStockStatus(stock) {
    if (stock === 0) return 'unlimited';
    if (stock <= 5) return 'low';
    return 'normal';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i data-feather="${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i data-feather="x"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    feather.replace();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'alert-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    };
    return icons[type] || 'info';
}

// Navbar toggle function for mobile
function toggleNavbar() {
    const navbarMenu = document.getElementById('navbar-menu');
    if (navbarMenu) {
        navbarMenu.classList.toggle('active');
        
        // Add/remove body scroll lock when menu is open
        if (navbarMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close navbar menu when clicking outside
document.addEventListener('click', function(event) {
    const navbarMenu = document.getElementById('navbar-menu');
    const navbarToggle = document.querySelector('.navbar-toggle');
    const modal = document.getElementById('editModal');
    
    // Handle navbar toggle
    if (navbarMenu && navbarToggle) {
        if (!navbarMenu.contains(event.target) && !navbarToggle.contains(event.target)) {
            navbarMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // Handle modal close
    if (event.target === modal) {
        closeEditModal();
    }
    
    // Close navbar menu when clicking on navbar items
    if (event.target.closest('.navbar-item')) {
        if (navbarMenu) {
            navbarMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Close navbar menu when window is resized to desktop size
window.addEventListener('resize', function() {
    const navbarMenu = document.getElementById('navbar-menu');
    if (navbarMenu && window.innerWidth > 768) {
        navbarMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeEditModal();
    }
});
