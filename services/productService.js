const fs = require('fs').promises;
const path = require('path');

class ProductService {
  constructor() {
    this.productsPath = path.join(__dirname, '../config/products.json');
    this.products = [];
    this.loadProducts();
  }

  async loadProducts() {
    try {
      const data = await fs.readFile(this.productsPath, 'utf8');
      this.products = JSON.parse(data);
      console.log(`📦 Loaded ${this.products.length} products for AI integration`);
    } catch (error) {
      console.warn('⚠️ Could not load products for AI:', error.message);
      this.products = [];
    }
  }

  // Reload products (useful when products are updated)
  async reloadProducts() {
    await this.loadProducts();
  }

  // Get all products
  getProducts() {
    return this.products;
  }

  // Search products by name or description
  searchProducts(query) {
    if (!query || typeof query !== 'string') return [];
    
    const searchTerm = query.toLowerCase().trim();
    if (searchTerm.length < 2) return [];

    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  // Get products by category
  getProductsByCategory(category) {
    if (!category) return [];
    return this.products.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get available products (in stock)
  getAvailableProducts() {
    return this.products.filter(product => product.stock === 0 || product.stock > 0);
  }

  // Get out of stock products
  getOutOfStockProducts() {
    return this.products.filter(product => product.stock > 0 && product.stock === 0);
  }
  // Format product for AI context
  formatProductForAI(product) {
    const stockInfo = product.stock === 0 ? 'Unlimited' : `${product.stock} unit tersedia`;
    const linkInfo = product.link ? `\nLink: ${product.link}` : '';
    const priceInfo = product.price ? `\nHarga: ${this.formatPrice(product.price)}` : '';
    
    return `${product.name} (${product.category})
Deskripsi: ${product.description}${priceInfo}
Stok: ${stockInfo}${linkInfo}`;
  }

  // Format price to Indonesian Rupiah
  formatPrice(price) {
    if (!price || isNaN(price)) return 'Hubungi untuk harga';
    return `Rp ${parseInt(price).toLocaleString('id-ID')}`;
  }
  // Get product context for AI based on message
  getProductContext(message) {
    if (!message || typeof message !== 'string') return '';
    
    const messageLower = message.toLowerCase();
    let context = '';
    
    // Check if message contains product-related keywords
    const productKeywords = [
      'produk', 'product', 'jual', 'beli', 'harga', 'price', 'stock', 'stok', 
      'tersedia', 'available', 'katalog', 'catalog', 'layanan', 'service', 
      'jasa', 'order', 'pesan', 'bisa', 'ada', 'punya', 'jualan', 'dagangan',
      'semua', 'all', 'daftar', 'list', 'lengkap', 'complete'
    ];

    const hasProductKeyword = productKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    if (hasProductKeyword || this.products.length > 0) {
      // Try to find specific products mentioned in the message
      const mentionedProducts = this.searchProducts(message);
      
      if (mentionedProducts.length > 0) {
        context += '\n\n=== PRODUK YANG DISEBUTKAN ===\n';
        // Show all mentioned products, not limited to 3
        mentionedProducts.forEach(product => {
          context += this.formatProductForAI(product) + '\n\n';
        });
      } else if (hasProductKeyword && this.products.length > 0) {
        // Check if user wants complete/all products
        const wantsComplete = messageLower.includes('semua') || 
                             messageLower.includes('all') || 
                             messageLower.includes('daftar') || 
                             messageLower.includes('list') || 
                             messageLower.includes('lengkap') || 
                             messageLower.includes('complete') ||
                             messageLower.includes('katalog') ||
                             messageLower.includes('catalog');
        
        if (wantsComplete) {
          // Show ALL products when user asks for complete list
          context += '\n\n=== DAFTAR LENGKAP PRODUK & LAYANAN ===\n';
          this.products.forEach(product => {
            context += this.formatProductForAI(product) + '\n\n';
          });
        } else {
          // Show some available products for general inquiries
          context += '\n\n=== PRODUK & LAYANAN TERSEDIA ===\n';
          const availableProducts = this.getAvailableProducts().slice(0, 5);
          availableProducts.forEach(product => {
            context += this.formatProductForAI(product) + '\n\n';
          });
          
          if (this.products.length > 5) {
            context += `Dan ${this.products.length - 5} produk lainnya. Tanya "daftar semua produk" untuk melihat lengkap.\n`;
          }
        }
      }
    }

    return context;
  }
  // Get comprehensive product info for AI
  getProductSummary(includeAll = false) {
    if (this.products.length === 0) {
      return '\n\n=== INFO PRODUK ===\nBelum ada produk yang terdaftar saat ini.';
    }

    const categories = {};
    let totalProducts = 0;
    let availableProducts = 0;

    this.products.forEach(product => {
      totalProducts++;
      if (product.stock === 0 || product.stock > 0) {
        availableProducts++;
      }

      if (!categories[product.category]) {
        categories[product.category] = 0;
      }
      categories[product.category]++;
    });

    let summary = '\n\n=== RINGKASAN PRODUK & LAYANAN ===\n';
    summary += `Total: ${totalProducts} item (${availableProducts} tersedia)\n`;
    summary += 'Kategori:\n';
    
    Object.entries(categories).forEach(([category, count]) => {
      const categoryName = this.getCategoryDisplayName(category);
      summary += `- ${categoryName}: ${count} item\n`;
    });

    if (includeAll) {
      // Include all products when requested
      summary += '\n=== DAFTAR LENGKAP PRODUK ===\n';
      this.products.forEach(product => {
        const stockInfo = product.stock === 0 ? 'Ready' : `Stok: ${product.stock}`;
        const priceInfo = product.price ? ` - ${this.formatPrice(product.price)}` : '';
        summary += `- ${product.name} (${this.getCategoryDisplayName(product.category)}) - ${stockInfo}${priceInfo}\n`;
      });
    } else {
      // Add some featured products
      const featured = this.products.slice(0, 3);
      if (featured.length > 0) {
        summary += '\nProduk Unggulan:\n';
        featured.forEach(product => {
          const stockInfo = product.stock === 0 ? 'Ready' : `Stok: ${product.stock}`;
          const priceInfo = product.price ? ` - ${this.formatPrice(product.price)}` : '';
          summary += `- ${product.name} (${stockInfo})${priceInfo}\n`;
        });
        
        if (this.products.length > 3) {
          summary += `\n💡 Ada ${this.products.length - 3} produk lainnya. Tanya "daftar semua produk" untuk melihat semua.\n`;
        }
      }
    }

    return summary;
  }

  getCategoryDisplayName(category) {
    const categoryMap = {
      'product': 'Produk',
      'service': 'Layanan',
      'digital': 'Digital',
      'course': 'Kursus',
      'other': 'Lainnya'
    };
    return categoryMap[category] || category;
  }
  // Check if message is asking about products
  isProductInquiry(message) {
    if (!message || typeof message !== 'string') return false;
    
    const messageLower = message.toLowerCase();
    const productInquiryPatterns = [
      /(?:ada|punya|jual|tersedia).*(produk|barang|layanan|jasa)/,
      /(?:harga|biaya|tarif|price)/,
      /(?:katalog|daftar|list).*(produk|barang|semua|lengkap)/,
      /(?:bisa|beli|order|pesan|mau|ingin)/,
      /(?:stok|stock|tersedia|ready)/,
      /(?:produk|product|layanan|service|jasa)/,
      /(?:semua|all|lengkap|complete).*(produk|barang|katalog)/,
      /(?:kategori|jenis).*(produk|barang)/,
      /(?:cari|search|find).*(produk|barang)/
    ];

    // Additional keyword check
    const productKeywords = [
      'produk', 'product', 'barang', 'item', 'jual', 'beli', 'harga', 'price', 
      'stock', 'stok', 'tersedia', 'available', 'katalog', 'catalog', 'daftar', 'list',
      'layanan', 'service', 'jasa', 'order', 'pesan', 'bisa', 'ada', 'punya', 
      'jualan', 'dagangan', 'semua', 'all', 'lengkap', 'complete', 'kategori',
      'jenis', 'cari', 'search', 'find'
    ];

    const hasProductKeyword = productKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    return productInquiryPatterns.some(pattern => pattern.test(messageLower)) || hasProductKeyword;
  }

  // Get all products in detailed format for AI
  getAllProductsForAI() {
    if (this.products.length === 0) {
      return '\n\n=== INFO PRODUK ===\nBelum ada produk yang terdaftar saat ini.';
    }

    let context = '\n\n=== DAFTAR LENGKAP SEMUA PRODUK & LAYANAN ===\n';
    context += `Total: ${this.products.length} produk tersedia\n\n`;

    // Group by category
    const productsByCategory = {};
    this.products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    // Display products by category
    Object.entries(productsByCategory).forEach(([category, products]) => {
      const categoryName = this.getCategoryDisplayName(category);
      context += `📂 ${categoryName.toUpperCase()} (${products.length} item)\n`;
      context += '─'.repeat(40) + '\n';
      
      products.forEach((product, index) => {
        context += `${index + 1}. ${this.formatProductForAI(product)}\n`;
      });
      context += '\n';
    });

    return context;
  }

  // Get products by category for AI
  getProductsByCategoryForAI(category) {
    const categoryProducts = this.getProductsByCategory(category);
    if (categoryProducts.length === 0) {
      return `\n\n=== PRODUK KATEGORI ${category.toUpperCase()} ===\nTidak ada produk dalam kategori ini.`;
    }

    let context = `\n\n=== PRODUK KATEGORI ${this.getCategoryDisplayName(category).toUpperCase()} ===\n`;
    context += `Ditemukan ${categoryProducts.length} produk:\n\n`;

    categoryProducts.forEach((product, index) => {
      context += `${index + 1}. ${this.formatProductForAI(product)}\n`;
    });

    return context;
  }

  // Enhanced search with better AI context
  searchProductsForAI(query) {
    const results = this.searchProducts(query);
    if (results.length === 0) {
      return `\n\n=== HASIL PENCARIAN ===\nTidak ditemukan produk dengan kata kunci "${query}".`;
    }

    let context = `\n\n=== HASIL PENCARIAN: "${query}" ===\n`;
    context += `Ditemukan ${results.length} produk:\n\n`;

    results.forEach((product, index) => {
      context += `${index + 1}. ${this.formatProductForAI(product)}\n`;
    });

    return context;
  }
}

module.exports = ProductService;
