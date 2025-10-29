// ==================== SUPABASE CONFIGURATION ====================
const SUPABASE_URL = 'https://tufxxzglvjqiusbadlkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Znh4emdsdmpxaXVzYmFkbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODIyNTIsImV4cCI6MjA3NzI1ODI1Mn0.TJivyjtf79uEP2UL0XeVIso-ttpWGq4SE4UGraME4Lw';

// ==================== GLOBAL VARIABLES ====================
let currentAdminPage = 'dashboard';
let websiteSettings = null;
let categories = [];
let categoryCards = [];
let products = [];
let paymentMethods = [];
let orders = [];
let users = [];
let coupons = [];
let currentFilter = 'all';
let uploadedFiles = {};

// ==================== INITIALIZATION ====================


// ==================== INITIALIZE DASHBOARD ====================
async function initializeAdminDashboard() {
    document.getElementById('adminDashboard').classList.remove('hidden');
    
    // Load all data
    await loadDashboardStats();
    await loadWebsiteSettings();
    await loadCategories();
    await loadProducts();
    await loadPaymentMethods();
    await loadOrders();
    await loadUsers();
    await loadCoupons();
    
    hideAdminLoading();
}

// ==================== NAVIGATION ====================
function adminNavigateTo(page) {
    // Update active nav item
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.admin-nav-item').classList.add('active');
    
    // Hide all pages
    document.querySelectorAll('.admin-page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`adminPage${page.charAt(0).toUpperCase() + page.slice(1)}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'settings': 'Website Settings',
        'categories': 'Categories',
        'products': 'Products',
        'payment': 'Payment Methods',
        'banners': 'Banners',
        'news': 'News',
        'contacts': 'Contacts',
        'orders': 'Orders',
        'users': 'Users',
        'coupons': 'Coupons',
        'music': 'Music'
    };
    
    document.getElementById('adminPageTitle').textContent = titles[page] || page;
    currentAdminPage = page;
    
    // Load page-specific data
    loadPageData(page);
}

async function loadPageData(page) {
    switch(page) {
        case 'dashboard':
            await loadDashboardStats();
            break;
        case 'settings':
            await loadWebsiteSettings();
            break;
        case 'categories':
            await loadCategories();
            break;
        case 'products':
            await loadProducts();
            break;
        case 'payment':
            await loadPaymentMethods();
            break;
        case 'banners':
            await loadBanners();
            break;
        case 'news':
            await loadNews();
            break;
        case 'contacts':
            await loadContacts();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'coupons':
            await loadCoupons();
            break;
        case 'music':
            await loadMusic();
            break;
    }
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        // Load users count
        const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const usersData = await usersResponse.json();
        document.getElementById('statTotalUsers').textContent = usersData.length;
        
        // Load orders count
        const ordersResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,total_price,status`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const ordersData = await ordersResponse.json();
        document.getElementById('statTotalOrders').textContent = ordersData.length;
        
        // Calculate revenue
        let totalRevenue = 0;
        let pendingOrders = 0;
        ordersData.forEach(order => {
            if (order.status === 'approved') {
                totalRevenue += order.total_price;
            }
            if (order.status === 'pending') {
                pendingOrders++;
            }
        });
        document.getElementById('statTotalRevenue').textContent = totalRevenue.toLocaleString();
        document.getElementById('statPendingOrders').textContent = pendingOrders;
        
        // Load recent orders
        await loadRecentOrders();
        
        // Load top products
        await loadTopProducts();
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,users(username),products(name)&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const orders = await response.json();
        const container = document.getElementById('recentOrdersList');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--admin-text-secondary);">No orders yet</p>';
            return;
        }
        
        orders.forEach(order => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--admin-border); display: flex; justify-content: space-between; align-items: center;';
            
            item.innerHTML = `
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">${order.users?.username || 'User'}</div>
                    <div style="font-size: 13px; color: var(--admin-text-secondary);">${order.products?.name || 'Product'}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: var(--admin-primary);">${order.total_price} Ks</div>
                    <div class="order-card-status ${order.status}" style="margin-top: 4px;">${order.status}</div>
                </div>
            `;
            
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadTopProducts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,orders(id)&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const products = await response.json();
        const container = document.getElementById('topProductsList');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--admin-text-secondary);">No products yet</p>';
            return;
        }
        
        products.forEach(product => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--admin-border); display: flex; justify-content: space-between; align-items: center;';
            
            const salesCount = product.orders?.length || 0;
            
            item.innerHTML = `
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">${product.name}</div>
                    <div style="font-size: 13px; color: var(--admin-text-secondary);">${product.price} Ks</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: var(--admin-success);">${salesCount} sales</div>
                </div>
            `;
            
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading top products:', error);
    }
}

// ==================== TOAST NOTIFICATION ====================
function showAdminToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="admin-toast-icon">${icons[type]}</div>
        <div class="admin-toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== FILE UPLOAD HELPER ====================
async function uploadFile(file, folder) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${folder}/${fileName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: file
        });
        
        if (response.ok) {
            return `${SUPABASE_URL}/storage/v1/object/public/${folder}/${fileName}`;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

function previewImage(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// ==================== MODAL HELPERS ====================
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    const modalContent = document.createElement('div');
    modalContent.className = 'admin-modal-content';
    
    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h2>${title}</h2>
            <button class="admin-modal-close" onclick="this.closest('.admin-modal').remove()">×</button>
        </div>
        ${content}
    `;
    
    modal.appendChild(modalContent);
    document.getElementById('modalContainer').appendChild(modal);
    
    return modal;
}

function closeModal() {
    const modals = document.querySelectorAll('.admin-modal');
    modals.forEach(modal => modal.remove());
}

// ==================== WEBSITE SETTINGS ====================
async function loadWebsiteSettings() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/website_settings?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const settings = await response.json();
        
        if (settings && settings.length > 0) {
            websiteSettings = settings[0];
            populateSettingsForm();
        }
        
    } catch (error) {
        console.error('Error loading website settings:', error);
    }
}

function populateSettingsForm() {
    if (!websiteSettings) return;
    
    const nameInput = document.getElementById('settingsName');
    const versionInput = document.getElementById('settingsVersion');
    const webappUrlInput = document.getElementById('settingsWebAppUrl');
    
    if (nameInput) nameInput.value = websiteSettings.name || '';
    if (versionInput) versionInput.value = websiteSettings.version || '1.0.0';
    if (webappUrlInput) webappUrlInput.value = websiteSettings.webapp_url || '';
    
    // Show previews
    if (websiteSettings.logo_url) {
        document.getElementById('logoPreview').innerHTML = `<img src="${websiteSettings.logo_url}">`;
    }
    if (websiteSettings.background_url) {
        document.getElementById('backgroundPreview').innerHTML = `<img src="${websiteSettings.background_url}">`;
    }
}

async function saveWebsiteSettings() {
    showAdminLoading();
    
    try {
        const data = {
            name: document.getElementById('settingsName').value,
            version: document.getElementById('settingsVersion').value,
            webapp_url: document.getElementById('settingsWebAppUrl').value
        };
        
        // Upload logo if changed
        const logoFile = document.getElementById('settingsLogo').files[0];
        if (logoFile) {
            const logoUrl = await uploadFile(logoFile, 'website_assets');
            if (logoUrl) data.logo_url = logoUrl;
        }
        
        // Upload background if changed
        const bgFile = document.getElementById('settingsBackground').files[0];
        if (bgFile) {
            const bgUrl = await uploadFile(bgFile, 'website_assets');
            if (bgUrl) data.background_url = bgUrl;
        }
        
        // Upload button background if changed
        const buttonBgFile = document.getElementById('settingsButtonBg').files[0];
        if (buttonBgFile) {
            const buttonBgUrl = await uploadFile(buttonBgFile, 'website_assets');
            if (buttonBgUrl) data.button_background_url = buttonBgUrl;
        }
        
        // Upload loading animation if changed
        const loadingFile = document.getElementById('settingsLoading').files[0];
        if (loadingFile) {
            const loadingUrl = await uploadFile(loadingFile, 'website_assets');
            if (loadingUrl) data.loading_animation_url = loadingUrl;
        }
        
        // Upload success loading animation if changed
        const successLoadingFile = document.getElementById('settingsSuccessLoading').files[0];
        if (successLoadingFile) {
            const successLoadingUrl = await uploadFile(successLoadingFile, 'website_assets');
            if (successLoadingUrl) data.success_loading_url = successLoadingUrl;
        }
        
        let response;
        if (websiteSettings && websiteSettings.id) {
            // Update existing
            response = await fetch(`${SUPABASE_URL}/rest/v1/website_settings?id=eq.${websiteSettings.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch(`${SUPABASE_URL}/rest/v1/website_settings`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Settings saved successfully', 'success');
            await loadWebsiteSettings();
        } else {
            throw new Error('Failed to save settings');
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showAdminToast('Failed to save settings', 'error');
    } finally {
        hideAdminLoading();
    }
}

// File input change handlers
document.addEventListener('DOMContentLoaded', () => {
    const logoInput = document.getElementById('settingsLogo');
    const bgInput = document.getElementById('settingsBackground');
    const buttonBgInput = document.getElementById('settingsButtonBg');
    const loadingInput = document.getElementById('settingsLoading');
    const successLoadingInput = document.getElementById('settingsSuccessLoading');
    
    if (logoInput) logoInput.addEventListener('change', (e) => previewImage(e.target, 'logoPreview'));
    if (bgInput) bgInput.addEventListener('change', (e) => previewImage(e.target, 'backgroundPreview'));
    if (buttonBgInput) buttonBgInput.addEventListener('change', (e) => previewImage(e.target, 'buttonBgPreview'));
    if (loadingInput) loadingInput.addEventListener('change', (e) => previewImage(e.target, 'loadingPreview'));
    if (successLoadingInput) successLoadingInput.addEventListener('change', (e) => previewImage(e.target, 'successLoadingPreview'));
});

// ==================== MARKETING ANALYTICS (Add to admin.js Part 1) ====================
// Add after loadDashboardStats function

async function loadDetailedAnalytics() {
    try {
        // Sales by category
        const categorySales = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,products(category_card_id),category_cards(category_id,categories(name))&status=eq.approved`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        // Revenue by date
        const revenueByDate = await calculateRevenueByDate();
        
        // Top customers
        const topCustomers = await getTopCustomers();
        
        // Product performance
        const productPerformance = await getProductPerformance();
        
        return {
            categorySales: processCategorySales(categorySales),
            revenueByDate,
            topCustomers,
            productPerformance
        };
        
    } catch (error) {
        console.error('Analytics error:', error);
        return null;
    }
}

async function calculateRevenueByDate() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=created_at,total_price&status=eq.approved&order=created_at.desc&limit=30`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const orders = await response.json();
        
        const revenueByDate = {};
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            revenueByDate[date] = (revenueByDate[date] || 0) + order.total_price;
        });
        
        return revenueByDate;
    } catch (error) {
        console.error('Revenue calculation error:', error);
        return {};
    }
}

async function getTopCustomers() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=user_id,users(username,email),total_price&status=eq.approved`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const orders = await response.json();
        
        const customerStats = {};
        orders.forEach(order => {
            const userId = order.user_id;
            if (!customerStats[userId]) {
                customerStats[userId] = {
                    username: order.users?.username,
                    email: order.users?.email,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            customerStats[userId].totalSpent += order.total_price;
            customerStats[userId].orderCount += 1;
        });
        
        return Object.values(customerStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);
            
    } catch (error) {
        console.error('Top customers error:', error);
        return [];
    }
}

async function getProductPerformance() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=product_id,products(name,price),total_price&status=eq.approved`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const orders = await response.json();
        
        const productStats = {};
        orders.forEach(order => {
            const productId = order.product_id;
            if (!productStats[productId]) {
                productStats[productId] = {
                    name: order.products?.name,
                    sales: 0,
                    revenue: 0
                };
            }
            productStats[productId].sales += 1;
            productStats[productId].revenue += order.total_price;
        });
        
        return Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
            
    } catch (error) {
        console.error('Product performance error:', error);
        return [];
    }
}

// ==================== CATEGORIES MANAGEMENT ====================
async function loadCategories() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        categories = await response.json();
        renderCategories();
        populateCategoryFilters();
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-text">No categories yet</div></div>';
        return;
    }
    
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        
        card.innerHTML = `
            <div class="category-card-name">${category.name}</div>
            <div class="category-card-meta">
                <span>Created: ${new Date(category.created_at).toLocaleDateString()}</span>
            </div>
            <div class="category-card-actions">
                <button class="btn-secondary" onclick="editCategory(${category.id})">Edit</button>
                <button class="btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateCategoryModal() {
    const content = `
        <div class="form-group">
            <label>Category Name</label>
            <input type="text" id="categoryName" placeholder="Enter category name">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveCategory()">Create Category</button>
        </div>
    `;
    
    createModal('Create Category', content);
}

async function saveCategory(id = null) {
    const name = document.getElementById('categoryName').value.trim();
    
    if (!name) {
        showAdminToast('Please enter category name', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            name: name,
            created_at: new Date().toISOString()
        };
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Category saved successfully', 'success');
            closeModal();
            await loadCategories();
        } else {
            throw new Error('Failed to save category');
        }
        
    } catch (error) {
        console.error('Error saving category:', error);
        showAdminToast('Failed to save category', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const content = `
        <div class="form-group">
            <label>Category Name</label>
            <input type="text" id="categoryName" value="${category.name}" placeholder="Enter category name">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveCategory(${id})">Update Category</button>
        </div>
    `;
    
    createModal('Edit Category', content);
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Category deleted successfully', 'success');
            await loadCategories();
        } else {
            throw new Error('Failed to delete category');
        }
        
    } catch (error) {
        console.error('Error deleting category:', error);
        showAdminToast('Failed to delete category', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== CATEGORY CARDS MANAGEMENT ====================
function switchCategoryTab(tab) {
    document.querySelectorAll('.categories-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('categoriesListTab').classList.remove('active');
    document.getElementById('categoryCardsTab').classList.remove('active');
    
    if (tab === 'categories') {
        document.getElementById('categoriesListTab').classList.add('active');
    } else {
        document.getElementById('categoryCardsTab').classList.add('active');
        loadCategoryCards();
    }
}

async function loadCategoryCards() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards?select=*,categories(name)&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        categoryCards = await response.json();
        renderCategoryCards();
        
    } catch (error) {
        console.error('Error loading category cards:', error);
    }
}

function renderCategoryCards() {
    const container = document.getElementById('categoryCardsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filter = document.getElementById('cardCategoryFilter')?.value;
    const filteredCards = filter ? categoryCards.filter(c => c.category_id == filter) : categoryCards;
    
    if (filteredCards.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎴</div><div class="empty-state-text">No category cards yet</div></div>';
        return;
    }
    
    filteredCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'product-card';
        
        cardEl.innerHTML = `
            <img src="${card.icon_url}" class="product-card-image">
            <div class="product-card-info">
                <div class="product-card-name">${card.name}</div>
                <div class="product-card-details">
                    <div>Category: ${card.categories?.name || 'N/A'}</div>
                    ${card.discount_percentage > 0 ? `<div>Discount: ${card.discount_percentage}%</div>` : ''}
                    ${card.country_flag ? `<div>Has Flag</div>` : ''}
                </div>
                <div class="product-card-actions">
                    <button class="btn-secondary" onclick="editCategoryCard(${card.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteCategoryCard(${card.id})">Delete</button>
                </div>
            </div>
        `;
        
        container.appendChild(cardEl);
    });
}

function populateCategoryFilters() {
    const filter = document.getElementById('cardCategoryFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        filter.appendChild(option);
    });
}

function filterCategoryCards() {
    renderCategoryCards();
}

function showCreateCategoryCardModal() {
    const categoriesOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    const content = `
        <div class="form-group">
            <label>Select Category</label>
            <select id="cardCategoryId">
                <option value="">Select Category</option>
                ${categoriesOptions}
            </select>
        </div>
        <div class="form-group">
            <label>Card Name</label>
            <input type="text" id="cardName" placeholder="Enter card name">
        </div>
        <div class="form-group">
            <label>Icon</label>
            <input type="file" id="cardIcon" accept="image/*">
            <div id="cardIconPreview" class="image-preview"></div>
        </div>
        <div class="form-group">
            <label>Country Flag (Optional)</label>
            <input type="file" id="cardFlag" accept="image/*">
            <div id="cardFlagPreview" class="image-preview"></div>
        </div>
        <div class="form-group">
            <label>Discount Percentage (Optional)</label>
            <input type="number" id="cardDiscount" placeholder="0" min="0" max="100">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveCategoryCard()">Create Card</button>
        </div>
    `;
    
    createModal('Create Category Card', content);
    
    document.getElementById('cardIcon').addEventListener('change', (e) => previewImage(e.target, 'cardIconPreview'));
    document.getElementById('cardFlag').addEventListener('change', (e) => previewImage(e.target, 'cardFlagPreview'));
}

async function saveCategoryCard(id = null) {
    const categoryId = document.getElementById('cardCategoryId').value;
    const name = document.getElementById('cardName').value.trim();
    const discount = document.getElementById('cardDiscount').value;
    
    if (!categoryId || !name) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            category_id: categoryId,
            name: name,
            discount_percentage: discount ? parseInt(discount) : 0,
            created_at: new Date().toISOString()
        };
        
        // Upload icon
        const iconFile = document.getElementById('cardIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'category_cards');
            if (iconUrl) data.icon_url = iconUrl;
        }
        
        // Upload flag if exists
        const flagFile = document.getElementById('cardFlag').files[0];
        if (flagFile) {
            const flagUrl = await uploadFile(flagFile, 'category_cards');
            if (flagUrl) data.country_flag = flagUrl;
        }
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Category card saved successfully', 'success');
            closeModal();
            await loadCategoryCards();
        } else {
            throw new Error('Failed to save category card');
        }
        
    } catch (error) {
        console.error('Error saving category card:', error);
        showAdminToast('Failed to save category card', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteCategoryCard(id) {
    if (!confirm('Are you sure you want to delete this category card?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Category card deleted successfully', 'success');
            await loadCategoryCards();
        } else {
            throw new Error('Failed to delete category card');
        }
        
    } catch (error) {
        console.error('Error deleting category card:', error);
        showAdminToast('Failed to delete category card', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== PRODUCTS MANAGEMENT ====================
function switchProductTab(tab) {
    document.querySelectorAll('.products-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('#adminPageProducts .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabMap = {
        'products': 'productsListTab',
        'inputTables': 'inputTablesTab',
        'productBanners': 'productBannersTab',
        'guidelines': 'guidelinesTab',
        'videos': 'videosTab',
        'backgrounds': 'backgroundsTab'
    };
    
    const tabElement = document.getElementById(tabMap[tab]);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Load tab data
    switch(tab) {
        case 'products':
            loadProducts();
            break;
        case 'inputTables':
            loadInputTables();
            break;
        case 'productBanners':
            loadProductBanners();
            break;
        case 'guidelines':
            loadGuidelines();
            break;
        case 'videos':
            loadYouTubeVideos();
            break;
        case 'backgrounds':
            loadPageBackgrounds();
            break;
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        products = await response.json();
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛍️</div><div class="empty-state-text">No products yet</div></div>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const finalPrice = product.discount_percentage > 0 
            ? Math.floor(product.price - (product.price * product.discount_percentage / 100))
            : product.price;
        
        card.innerHTML = `
            <img src="${product.icon_url || 'https://via.placeholder.com/100'}" class="product-card-image">
            <div class="product-card-info">
                <div class="product-card-name">${product.name}</div>
                <div class="product-card-details">
                    <div>Card: ${product.category_cards?.name || 'N/A'}</div>
                    <div>Amount: ${product.amount}</div>
                    ${product.product_type ? `<div>Type: ${product.product_type}</div>` : ''}
                </div>
                <div class="product-card-price">${finalPrice} Ks ${product.discount_percentage > 0 ? `<span style="font-size: 14px; text-decoration: line-through; color: var(--admin-text-secondary);">${product.price} Ks</span>` : ''}</div>
                <div class="product-card-actions">
                    <button class="btn-secondary" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateProductModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="productCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Product Name</label>
            <input type="text" id="productName" placeholder="Enter product name">
        </div>
        <div class="form-group">
            <label>Price (Ks)</label>
            <input type="number" id="productPrice" placeholder="0" min="0">
        </div>
        <div class="form-group">
            <label>Discount % (Optional)</label>
            <input type="number" id="productDiscount" placeholder="0" min="0" max="100">
        </div>
        <div class="form-group">
            <label>Amount</label>
            <input type="text" id="productAmount" placeholder="e.g. 100 Diamonds">
        </div>
        <div class="form-group">
            <label>Product Type (Optional)</label>
            <input type="text" id="productType" placeholder="e.g. Game Account">
        </div>
        <div class="form-group">
            <label>Type Badge Colors (Optional)</label>
            <div id="badgeColorsList" class="color-list"></div>
            <div class="color-picker-group">
                <input type="color" id="badgeColorPicker" class="color-picker-input">
                <button type="button" class="color-add-btn" onclick="addBadgeColor()">+ Add Color</button>
            </div>
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <textarea id="productDescription" placeholder="Enter product description"></textarea>
        </div>
        <div class="form-group">
            <label>Product Icon (Optional)</label>
            <input type="file" id="productIcon" accept="image/*">
            <div id="productIconPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveProduct()">Create Product</button>
        </div>
    `;
    
    createModal('Create Product', content);
    
    // Load category cards
    loadCategoryCardsForSelect();
    
    document.getElementById('productIcon').addEventListener('change', (e) => previewImage(e.target, 'productIconPreview'));
}

async function loadCategoryCardsForSelect() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards?select=id,name,categories(name)&order=name.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const cards = await response.json();
        const select = document.getElementById('productCardId');
        
        if (select) {
            select.innerHTML = '<option value="">Select Category Card</option>';
            cards.forEach(card => {
                const option = document.createElement('option');
                option.value = card.id;
                option.textContent = `${card.categories?.name || 'N/A'} - ${card.name}`;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading category cards:', error);
    }
}

let badgeColors = [];

function addBadgeColor() {
    const color = document.getElementById('badgeColorPicker').value;
    badgeColors.push(color);
    renderBadgeColors();
}

function renderBadgeColors() {
    const container = document.getElementById('badgeColorsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    badgeColors.forEach((color, index) => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.style.background = color;
        item.innerHTML = `
            <span>${color}</span>
            <span class="color-remove" onclick="removeBadgeColor(${index})">×</span>
        `;
        container.appendChild(item);
    });
}

function removeBadgeColor(index) {
    badgeColors.splice(index, 1);
    renderBadgeColors();
}

async function saveProduct(id = null) {
    const cardId = document.getElementById('productCardId').value;
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value;
    const discount = document.getElementById('productDiscount').value;
    const amount = document.getElementById('productAmount').value.trim();
    const type = document.getElementById('productType').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    
    if (!cardId || !name || !price || !amount) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            category_card_id: cardId,
            name: name,
            price: parseInt(price),
            discount_percentage: discount ? parseInt(discount) : 0,
            amount: amount,
            product_type: type || null,
            description: description || null,
            created_at: new Date().toISOString()
        };
        
        // Badge colors
        if (badgeColors.length > 0) {
            data.type_badge_color = `linear-gradient(135deg, ${badgeColors.join(', ')})`;
        }
        
        // Upload icon
        const iconFile = document.getElementById('productIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'products');
            if (iconUrl) data.icon_url = iconUrl;
        }
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Product saved successfully', 'success');
            closeModal();
            badgeColors = [];
            await loadProducts();
        } else {
            throw new Error('Failed to save product');
        }
        
    } catch (error) {
        console.error('Error saving product:', error);
        showAdminToast('Failed to save product', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Product deleted successfully', 'success');
            await loadProducts();
        } else {
            throw new Error('Failed to delete product');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showAdminToast('Failed to delete product', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== PAYMENT METHODS ====================
async function loadPaymentMethods() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        paymentMethods = await response.json();
        renderPaymentMethods();
        
    } catch (error) {
        console.error('Error loading payment methods:', error);
    }
}

function renderPaymentMethods() {
    const container = document.getElementById('paymentMethodsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (paymentMethods.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-text">No payment methods yet</div></div>';
        return;
    }
    
    paymentMethods.forEach(method => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        
        card.innerHTML = `
            <img src="${method.icon_url}" class="contact-card-icon">
            <div class="contact-card-info">
                <div class="contact-card-name">${method.name}</div>
                <div class="contact-card-description">${method.account_name}</div>
                <div style="font-size: 13px; color: var(--admin-text-secondary); margin-top: 4px;">${method.account_number}</div>
            </div>
            <div class="contact-card-actions">
                <button class="btn-secondary" onclick="editPaymentMethod(${method.id})">Edit</button>
                <button class="btn-danger" onclick="deletePaymentMethod(${method.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreatePaymentMethodModal() {
    const content = `
        <div class="form-group">
            <label>Payment Method Name</label>
            <input type="text" id="paymentName" placeholder="e.g. KBZ Pay">
        </div>
        <div class="form-group">
            <label>Account Name</label>
            <input type="text" id="paymentAccountName" placeholder="Enter account name">
        </div>
        <div class="form-group">
            <label>Account Number / Address</label>
            <input type="text" id="paymentAccountNumber" placeholder="Enter account number or address">
        </div>
        <div class="form-group">
            <label>Instructions (Optional)</label>
            <textarea id="paymentInstructions" placeholder="Enter payment instructions"></textarea>
        </div>
        <div class="form-group">
            <label>Payment Icon</label>
            <input type="file" id="paymentIcon" accept="image/*">
            <div id="paymentIconPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="savePaymentMethod()">Create Payment Method</button>
        </div>
    `;
    
    createModal('Create Payment Method', content);
    
    document.getElementById('paymentIcon').addEventListener('change', (e) => previewImage(e.target, 'paymentIconPreview'));
}

async function savePaymentMethod(id = null) {
    const name = document.getElementById('paymentName').value.trim();
    const accountName = document.getElementById('paymentAccountName').value.trim();
    const accountNumber = document.getElementById('paymentAccountNumber').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    
    if (!name || !accountName || !accountNumber) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            name: name,
            account_name: accountName,
            account_number: accountNumber,
            instructions: instructions || null,
            created_at: new Date().toISOString()
        };
        
        // Upload icon
        const iconFile = document.getElementById('paymentIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'payment_methods');
            if (iconUrl) data.icon_url = iconUrl;
        }
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Payment method saved successfully', 'success');
            closeModal();
            await loadPaymentMethods();
        } else {
            throw new Error('Failed to save payment method');
        }
        
    } catch (error) {
        console.error('Error saving payment method:', error);
        showAdminToast('Failed to save payment method', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deletePaymentMethod(id) {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Payment method deleted successfully', 'success');
            await loadPaymentMethods();
        } else {
            throw new Error('Failed to delete payment method');
        }
        
    } catch (error) {
        console.error('Error deleting payment method:', error);
        showAdminToast('Failed to delete payment method', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== ORDERS MANAGEMENT ====================
async function loadOrders() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,users(username,email),products(name),payment_methods(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        orders = await response.json();
        renderOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function filterOrders(status) {
    currentFilter = status;
    
    // Update active filter button
    document.querySelectorAll('.orders-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderOrders();
}

function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filteredOrders = currentFilter === 'all' 
        ? orders 
        : orders.filter(o => o.status === currentFilter);
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">No orders found</div></div>';
        return;
    }
    
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        card.innerHTML = `
            <div class="order-card-header">
                <div class="order-card-id">Order #${order.order_id}</div>
                <div class="order-card-status ${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div class="order-card-body">
                <div class="order-card-row">
                    <span class="order-card-label">Customer:</span>
                    <span class="order-card-value">${order.users?.username || 'N/A'} (${order.users?.email || 'N/A'})</span>
                </div>
                <div class="order-card-row">
                    <span class="order-card-label">Product:</span>
                    <span class="order-card-value">${order.products?.name || 'N/A'}</span>
                </div>
                <div class="order-card-row">
                    <span class="order-card-label">Total Price:</span>
                    <span class="order-card-value">${order.total_price} Ks</span>
                </div>
                <div class="order-card-row">
                    <span class="order-card-label">Payment Method:</span>
                    <span class="order-card-value">${order.payment_methods?.name || 'N/A'}</span>
                </div>
                <div class="order-card-row">
                    <span class="order-card-label">Created:</span>
                    <span class="order-card-value">${new Date(order.created_at).toLocaleString()}</span>
                </div>
                ${order.input_data ? `
                <div class="order-card-row">
                    <span class="order-card-label">Input Data:</span>
                    <span class="order-card-value">${formatInputData(order.input_data)}</span>
                </div>
                ` : ''}
            </div>
            ${order.proof_image_url ? `
            <div class="order-card-image">
                <img src="${order.proof_image_url}" alt="Payment Proof" onclick="viewImage('${order.proof_image_url}')">
            </div>
            ` : ''}
            ${order.status === 'pending' ? `
            <div class="order-card-message">
                <textarea id="orderMessage${order.id}" placeholder="Enter message for customer (optional)"></textarea>
            </div>
            <div class="order-card-actions">
                <button class="btn-success" onclick="approveOrder(${order.id})">✓ Approve</button>
                <button class="btn-danger" onclick="rejectOrder(${order.id})">✗ Reject</button>
            </div>
            ` : ''}
            ${order.admin_message ? `
            <div style="margin-top: 12px; padding: 12px; background: var(--admin-elevated); border-radius: 8px; font-size: 14px;">
                <strong>Admin Message:</strong> ${order.admin_message}
            </div>
            ` : ''}
            ${order.approved_at ? `
            <div class="order-card-row" style="margin-top: 12px;">
                <span class="order-card-label">Approved At:</span>
                <span class="order-card-value">${new Date(order.approved_at).toLocaleString()}</span>
            </div>
            ` : ''}
        `;
        
        container.appendChild(card);
    });
}

function formatInputData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        return Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(', ');
    } catch (error) {
        return jsonData;
    }
}

function viewImage(url) {
    const modal = createModal('Payment Proof', `
        <img src="${url}" style="max-width: 100%; border-radius: 12px;">
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `);
}

async function approveOrder(orderId) {
    const message = document.getElementById(`orderMessage${orderId}`)?.value || '';
    
    if (!confirm('Are you sure you want to approve this order?')) return;
    
    showAdminLoading();
    
    try {
        const data = {
            status: 'approved',
            approved_at: new Date().toISOString(),
            admin_message: message || 'Your order has been approved!'
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Order approved successfully', 'success');
            await loadOrders();
        } else {
            throw new Error('Failed to approve order');
        }
        
    } catch (error) {
        console.error('Error approving order:', error);
        showAdminToast('Failed to approve order', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function rejectOrder(orderId) {
    const message = document.getElementById(`orderMessage${orderId}`)?.value || '';
    
    if (!confirm('Are you sure you want to reject this order?')) return;
    
    showAdminLoading();
    
    try {
        const data = {
            status: 'rejected',
            admin_message: message || 'Your order has been rejected. Please contact support for more information.'
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Order rejected', 'success');
            await loadOrders();
        } else {
            throw new Error('Failed to reject order');
        }
        
    } catch (error) {
        console.error('Error rejecting order:', error);
        showAdminToast('Failed to reject order', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== USERS MANAGEMENT ====================
async function loadUsers() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        users = await response.json();
        renderUsers();
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (users.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">No users yet</div></div>';
        return;
    }
    
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        card.innerHTML = `
            <img src="${user.profile_picture}" class="user-card-avatar">
            <div class="user-card-info">
                <div class="user-card-name">${user.username}</div>
                <div class="user-card-email">${user.email}</div>
                <div class="user-card-meta">
                    <span>Joined: ${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="user-card-actions">
                <div class="user-status ${user.is_active ? 'active' : 'inactive'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </div>
                ${user.is_active ? 
                    `<button class="btn-danger" onclick="deactivateUser(${user.id})">Deactivate</button>` :
                    `<button class="btn-success" onclick="activateUser(${user.id})">Activate</button>`
                }
                <button class="btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

async function deactivateUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: false })
        });
        
        if (response.ok) {
            showAdminToast('User deactivated successfully', 'success');
            await loadUsers();
        } else {
            throw new Error('Failed to deactivate user');
        }
        
    } catch (error) {
        console.error('Error deactivating user:', error);
        showAdminToast('Failed to deactivate user', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function activateUser(userId) {
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: true })
        });
        
        if (response.ok) {
            showAdminToast('User activated successfully', 'success');
            await loadUsers();
        } else {
            throw new Error('Failed to activate user');
        }
        
    } catch (error) {
        console.error('Error activating user:', error);
        showAdminToast('Failed to activate user', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone!')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('User deleted successfully', 'success');
            await loadUsers();
        } else {
            throw new Error('Failed to delete user');
        }
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showAdminToast('Failed to delete user', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== COUPONS MANAGEMENT ====================
async function loadCoupons() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/coupons?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        coupons = await response.json();
        renderCoupons();
        
    } catch (error) {
        console.error('Error loading coupons:', error);
    }
}

function renderCoupons() {
    const container = document.getElementById('couponsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (coupons.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎟️</div><div class="empty-state-text">No coupons yet</div></div>';
        return;
    }
    
    coupons.forEach(coupon => {
        const card = document.createElement('div');
        card.className = 'coupon-card';
        
        const usedCount = coupon.used_count || 0;
        const totalUsers = coupon.target_users ? JSON.parse(coupon.target_users).length : 0;
        
        card.innerHTML = `
            <div class="coupon-card-code">${coupon.code}</div>
            <div class="coupon-card-discount">${coupon.discount_percentage}% OFF</div>
            <div class="coupon-card-details">
                <div>Type: ${coupon.coupon_type || 'General'}</div>
                <div>Created: ${new Date(coupon.created_at).toLocaleDateString()}</div>
                ${coupon.product_id ? '<div>Product Specific</div>' : '<div>All Products</div>'}
            </div>
            <div class="coupon-card-stats">
                <div class="coupon-card-stat">
                    <div class="coupon-card-stat-value">${usedCount}</div>
                    <div class="coupon-card-stat-label">Used</div>
                </div>
                <div class="coupon-card-stat">
                    <div class="coupon-card-stat-value">${totalUsers}</div>
                    <div class="coupon-card-stat-label">Target Users</div>
                </div>
            </div>
            <div class="coupon-card-actions">
                <button class="btn-secondary" onclick="sendCoupon(${coupon.id})">Send to Users</button>
                <button class="btn-danger" onclick="deleteCoupon(${coupon.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateCouponModal() {
    const content = `
        <div class="form-group">
            <label>Coupon Code</label>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="couponCode" placeholder="Enter code or generate" style="flex: 1;">
                <button class="btn-secondary" onclick="generateCouponCode()">Generate</button>
            </div>
        </div>
        <div class="form-group">
            <label>Discount Percentage</label>
            <input type="number" id="couponDiscount" placeholder="0" min="1" max="100">
        </div>
        <div class="form-group">
            <label>Coupon Type</label>
            <select id="couponType">
                <option value="all">All Products</option>
                <option value="specific">Specific Product</option>
            </select>
        </div>
        <div class="form-group" id="productSelectGroup" style="display: none;">
            <label>Select Product</label>
            <select id="couponProduct">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Target Users</label>
            <select id="couponUsers" multiple style="min-height: 120px;">
                <option value="all">All Users</option>
            </select>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveCoupon()">Create Coupon</button>
        </div>
    `;
    
    createModal('Create Coupon', content);
    
    // Load products and users for selection
    loadProductsForCoupon();
    loadUsersForCoupon();
    
    // Show/hide product select based on type
    document.getElementById('couponType').addEventListener('change', (e) => {
        const productGroup = document.getElementById('productSelectGroup');
        productGroup.style.display = e.target.value === 'specific' ? 'block' : 'none';
    });
}

function generateCouponCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById('couponCode').value = code;
}

async function loadProductsForCoupon() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name&order=name.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const products = await response.json();
        const select = document.getElementById('couponProduct');
        
        if (select) {
            select.innerHTML = '<option value="">Select Product</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading products for coupon:', error);
    }
}

async function loadUsersForCoupon() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,username&is_active=eq.true&order=username.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const users = await response.json();
        const select = document.getElementById('couponUsers');
        
        if (select) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading users for coupon:', error);
    }
}

async function saveCoupon() {
    const code = document.getElementById('couponCode').value.trim();
    const discount = document.getElementById('couponDiscount').value;
    const type = document.getElementById('couponType').value;
    const productId = document.getElementById('couponProduct')?.value;
    const userSelect = document.getElementById('couponUsers');
    const selectedUsers = Array.from(userSelect.selectedOptions).map(opt => opt.value);
    
    if (!code || !discount) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    if (type === 'specific' && !productId) {
        showAdminToast('Please select a product', 'error');
        return;
    }
    
    if (selectedUsers.length === 0) {
        showAdminToast('Please select at least one user', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            code: code,
            discount_percentage: parseInt(discount),
            coupon_type: type,
            product_id: type === 'specific' ? productId : null,
            target_users: JSON.stringify(selectedUsers),
            used_count: 0,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Coupon created successfully', 'success');
            closeModal();
            await loadCoupons();
        } else {
            throw new Error('Failed to create coupon');
        }
        
    } catch (error) {
        console.error('Error creating coupon:', error);
        showAdminToast('Failed to create coupon', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function sendCoupon(couponId) {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    if (!confirm(`Send coupon ${coupon.code} to target users?`)) return;
    
    showAdminLoading();
    
    try {
        const targetUsers = JSON.parse(coupon.target_users);
        
        // Create notifications for each user
        for (let userId of targetUsers) {
            if (userId === 'all') continue;
            
            const notification = {
                user_id: userId,
                title: '🎉 You received a coupon!',
                message: `Use code ${coupon.code} for ${coupon.discount_percentage}% discount!`,
                coupon_id: couponId,
                is_read: false,
                created_at: new Date().toISOString()
            };
            
            await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notification)
            });
        }
        
        showAdminToast('Coupon sent to users successfully', 'success');
        
    } catch (error) {
        console.error('Error sending coupon:', error);
        showAdminToast('Failed to send coupon', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteCoupon(id) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/coupons?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Coupon deleted successfully', 'success');
            await loadCoupons();
        } else {
            throw new Error('Failed to delete coupon');
        }
        
    } catch (error) {
        console.error('Error deleting coupon:', error);
        showAdminToast('Failed to delete coupon', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== BANNERS MANAGEMENT ====================
function switchBannerTab(tab) {
    document.querySelectorAll('.banners-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('mainBannersTab').classList.remove('active');
    document.getElementById('linkBannersTab').classList.remove('active');
    
    if (tab === 'main') {
        document.getElementById('mainBannersTab').classList.add('active');
        loadMainBanners();
    } else {
        document.getElementById('linkBannersTab').classList.add('active');
        loadLinkBanners();
    }
}

async function loadBanners() {
    await loadMainBanners();
    await loadLinkBanners();
}

async function loadMainBanners() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/main_banners?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const banners = await response.json();
        renderMainBanners(banners);
        
    } catch (error) {
        console.error('Error loading main banners:', error);
    }
}

function renderMainBanners(banners) {
    const container = document.getElementById('mainBannersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (banners.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-text">No banners yet</div></div>';
        return;
    }
    
    banners.forEach(banner => {
        const card = document.createElement('div');
        card.className = 'banner-card';
        
        card.innerHTML = `
            <img src="${banner.image_url}" class="banner-card-image">
            <div class="banner-card-actions">
                <button class="btn-danger" onclick="deleteMainBanner(${banner.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateMainBannerModal() {
    const content = `
        <div class="form-group">
            <label>Banner Image (1280x720)</label>
            <input type="file" id="mainBannerImage" accept="image/*">
            <div id="mainBannerPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveMainBanner()">Add Banner</button>
        </div>
    `;
    
    createModal('Add Main Banner', content);
    
    document.getElementById('mainBannerImage').addEventListener('change', (e) => previewImage(e.target, 'mainBannerPreview'));
}

async function saveMainBanner() {
    const imageFile = document.getElementById('mainBannerImage').files[0];
    
    if (!imageFile) {
        showAdminToast('Please select an image', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const imageUrl = await uploadFile(imageFile, 'banners');
        
        if (!imageUrl) {
            throw new Error('Failed to upload image');
        }
        
        const data = {
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/main_banners`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Banner added successfully', 'success');
            closeModal();
            await loadMainBanners();
        } else {
            throw new Error('Failed to add banner');
        }
        
    } catch (error) {
        console.error('Error adding banner:', error);
        showAdminToast('Failed to add banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteMainBanner(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/main_banners?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Banner deleted successfully', 'success');
            await loadMainBanners();
        } else {
            throw new Error('Failed to delete banner');
        }
        
    } catch (error) {
        console.error('Error deleting banner:', error);
        showAdminToast('Failed to delete banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function loadLinkBanners() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/link_banners?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const banners = await response.json();
        renderLinkBanners(banners);
        
    } catch (error) {
        console.error('Error loading link banners:', error);
    }
}

function renderLinkBanners(banners) {
    const container = document.getElementById('linkBannersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (banners.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-text">No link banners yet</div></div>';
        return;
    }
    
    banners.forEach(banner => {
        const card = document.createElement('div');
        card.className = 'banner-card';
        
        card.innerHTML = `
            <img src="${banner.image_url}" class="banner-card-image">
            <div style="padding: 12px; font-size: 13px; color: var(--admin-text-secondary);">
                Link: ${banner.link_url || 'N/A'}
            </div>
            <div class="banner-card-actions">
                <button class="btn-danger" onclick="deleteLinkBanner(${banner.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateLinkBannerModal() {
    const content = `
        <div class="form-group">
            <label>Banner Image (1280x180)</label>
            <input type="file" id="linkBannerImage" accept="image/*">
            <div id="linkBannerPreview" class="image-preview"></div>
        </div>
        <div class="form-group">
            <label>Link URL</label>
            <input type="url" id="linkBannerUrl" placeholder="https://...">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveLinkBanner()">Add Banner</button>
        </div>
    `;
    
    createModal('Add Link Banner', content);
    
    document.getElementById('linkBannerImage').addEventListener('change', (e) => previewImage(e.target, 'linkBannerPreview'));
}

async function saveLinkBanner() {
    const imageFile = document.getElementById('linkBannerImage').files[0];
    const linkUrl = document.getElementById('linkBannerUrl').value.trim();
    
    if (!imageFile || !linkUrl) {
        showAdminToast('Please fill all fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const imageUrl = await uploadFile(imageFile, 'banners');
        
        if (!imageUrl) {
            throw new Error('Failed to upload image');
        }
        
        const data = {
            image_url: imageUrl,
            link_url: linkUrl,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/link_banners`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Link banner added successfully', 'success');
            closeModal();
            await loadLinkBanners();
        } else {
            throw new Error('Failed to add banner');
        }
        
    } catch (error) {
        console.error('Error adding banner:', error);
        showAdminToast('Failed to add banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteLinkBanner(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/link_banners?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Banner deleted successfully', 'success');
            await loadLinkBanners();
        } else {
            throw new Error('Failed to delete banner');
        }
        
    } catch (error) {
        console.error('Error deleting banner:', error);
        showAdminToast('Failed to delete banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== NEWS MANAGEMENT ====================
async function loadNews() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/news?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const news = await response.json();
        renderNews(news);
        
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderNews(newsItems) {
    const container = document.getElementById('newsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (newsItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📰</div><div class="empty-state-text">No news yet</div></div>';
        return;
    }
    
    newsItems.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card';
        
        if (news.media_url) {
            if (news.media_type === 'video') {
                card.innerHTML += `<video src="${news.media_url}" class="news-card-media" controls></video>`;
            } else if (news.media_type === 'youtube') {
                card.innerHTML += `<iframe src="${convertYouTubeUrl(news.media_url)}" class="news-card-media" frameborder="0" allowfullscreen></iframe>`;
            } else {
                card.innerHTML += `<img src="${news.media_url}" class="news-card-media">`;
            }
        }
        
        card.innerHTML += `
            <div class="news-card-content">
                <div class="news-card-title">${news.title}</div>
                <div class="news-card-text">${news.content.substring(0, 150)}...</div>
                <div class="news-card-actions">
                    <button class="btn-secondary" onclick="editNews(${news.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteNews(${news.id})">Delete</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function convertYouTubeUrl(url) {
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtube.com/shorts')) {
        const videoId = url.split('shorts/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}

function showCreateNewsModal() {
    const content = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" id="newsTitle" placeholder="Enter news title">
        </div>
        <div class="form-group">
            <label>Content</label>
            <textarea id="newsContent" placeholder="Enter news content (supports image URLs)" style="min-height: 200px;"></textarea>
            <small style="color: var(--admin-text-secondary);">Tip: Paste image URLs directly to embed images</small>
        </div>
        <div class="form-group">
            <label>Media Type</label>
            <select id="newsMediaType">
                <option value="">None</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="youtube">YouTube</option>
            </select>
        </div>
        <div class="form-group" id="newsMediaUpload" style="display: none;">
            <label>Upload Media</label>
            <input type="file" id="newsMediaFile" accept="image/*,video/*">
            <div id="newsMediaPreview" class="image-preview"></div>
        </div>
        <div class="form-group" id="newsYouTubeUrl" style="display: none;">
            <label>YouTube URL</label>
            <input type="url" id="newsYouTube" placeholder="https://youtube.com/...">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveNews()">Create News</button>
        </div>
    `;
    
    createModal('Create News', content);
    
    document.getElementById('newsMediaType').addEventListener('change', (e) => {
        const uploadGroup = document.getElementById('newsMediaUpload');
        const youtubeGroup = document.getElementById('newsYouTubeUrl');
        
        uploadGroup.style.display = 'none';
        youtubeGroup.style.display = 'none';
        
        if (e.target.value === 'image' || e.target.value === 'video') {
            uploadGroup.style.display = 'block';
        } else if (e.target.value === 'youtube') {
            youtubeGroup.style.display = 'block';
        }
    });
    
    document.getElementById('newsMediaFile').addEventListener('change', (e) => previewImage(e.target, 'newsMediaPreview'));
}

async function saveNews(id = null) {
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const mediaType = document.getElementById('newsMediaType').value;
    
    if (!title || !content) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            title: title,
            content: content,
            media_type: mediaType || null,
            created_at: new Date().toISOString()
        };
        
        // Handle media
        if (mediaType === 'image' || mediaType === 'video') {
            const mediaFile = document.getElementById('newsMediaFile').files[0];
            if (mediaFile) {
                const mediaUrl = await uploadFile(mediaFile, 'news');
                if (mediaUrl) data.media_url = mediaUrl;
            }
        } else if (mediaType === 'youtube') {
            const youtubeUrl = document.getElementById('newsYouTube').value.trim();
            if (youtubeUrl) data.media_url = youtubeUrl;
        }
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/news`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('News saved successfully', 'success');
            closeModal();
            await loadNews();
        } else {
            throw new Error('Failed to save news');
        }
        
    } catch (error) {
        console.error('Error saving news:', error);
        showAdminToast('Failed to save news', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this news?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('News deleted successfully', 'success');
            await loadNews();
        } else {
            throw new Error('Failed to delete news');
        }
        
    } catch (error) {
        console.error('Error deleting news:', error);
        showAdminToast('Failed to delete news', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== CONTACTS MANAGEMENT ====================
async function loadContacts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const contacts = await response.json();
        renderContacts(contacts);
        
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function renderContacts(contacts) {
    const container = document.getElementById('contactsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (contacts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📞</div><div class="empty-state-text">No contacts yet</div></div>';
        return;
    }
    
    contacts.forEach(contact => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        
        card.innerHTML = `
            <img src="${contact.icon_url}" class="contact-card-icon">
            <div class="contact-card-info">
                <div class="contact-card-name">${contact.name}</div>
                <div class="contact-card-description">${contact.description || ''}</div>
                <div style="font-size: 13px; color: var(--admin-text-secondary); margin-top: 4px;">${contact.address || ''}</div>
            </div>
            <div class="contact-card-actions">
                <button class="btn-secondary" onclick="editContact(${contact.id})">Edit</button>
                <button class="btn-danger" onclick="deleteContact(${contact.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateContactModal() {
    const content = `
        <div class="form-group">
            <label>Contact Name</label>
            <input type="text" id="contactName" placeholder="e.g. Facebook">
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" id="contactDescription" placeholder="Enter description">
        </div>
        <div class="form-group">
            <label>Address (Optional)</label>
            <input type="text" id="contactAddress" placeholder="Enter address">
        </div>
        <div class="form-group">
            <label>Link URL</label>
            <input type="url" id="contactLink" placeholder="https://...">
        </div>
        <div class="form-group">
            <label>Contact Icon</label>
            <input type="file" id="contactIcon" accept="image/*">
            <div id="contactIconPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveContact()">Create Contact</button>
        </div>
    `;
    
    createModal('Create Contact', content);
    
    document.getElementById('contactIcon').addEventListener('change', (e) => previewImage(e.target, 'contactIconPreview'));
}

async function saveContact(id = null) {
    const name = document.getElementById('contactName').value.trim();
    const description = document.getElementById('contactDescription').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const link = document.getElementById('contactLink').value.trim();
    
    if (!name || !link) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            name: name,
            description: description || null,
            address: address || null,
            link_url: link,
            created_at: new Date().toISOString()
        };
        
        // Upload icon
        const iconFile = document.getElementById('contactIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'contacts');
            if (iconUrl) data.icon_url = iconUrl;
        }
        
        let response;
        if (id) {
            response = await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showAdminToast('Contact saved successfully', 'success');
            closeModal();
            await loadContacts();
        } else {
            throw new Error('Failed to save contact');
        }
        
    } catch (error) {
        console.error('Error saving contact:', error);
        showAdminToast('Failed to save contact', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Contact deleted successfully', 'success');
            await loadContacts();
        } else {
            throw new Error('Failed to delete contact');
        }
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        showAdminToast('Failed to delete contact', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== MUSIC MANAGEMENT ====================
async function loadMusic() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_playlist?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const music = await response.json();
        renderMusic(music);
        
    } catch (error) {
        console.error('Error loading music:', error);
    }
}

function renderMusic(musicList) {
    const container = document.getElementById('musicList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (musicList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><div class="empty-state-text">No music yet</div></div>';
        return;
    }
    
    musicList.forEach(music => {
        const card = document.createElement('div');
        card.className = 'music-card';
        
        card.innerHTML = `
            <div class="music-card-icon">🎵</div>
            <div class="music-card-info">
                <div class="music-card-name">${music.name}</div>
                <div class="music-card-size">${formatFileSize(music.file_size)}</div>
            </div>
            <div class="music-card-actions">
                <button class="btn-secondary" onclick="playMusicPreview('${music.file_url}')">▶️</button>
                <button class="btn-danger" onclick="deleteMusic(${music.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showAddMusicModal() {
    const content = `
        <div class="form-group">
            <label>Music Name</label>
            <input type="text" id="musicName" placeholder="Enter music name">
        </div>
        <div class="form-group">
            <label>Music File (MP3/MP4, Max 50MB)</label>
            <input type="file" id="musicFile" accept="audio/*">
            <small style="color: var(--admin-text-secondary);">Maximum file size: 50MB</small>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveMusic()">Add Music</button>
        </div>
    `;
    
    createModal('Add Music', content);
}

async function saveMusic() {
    const name = document.getElementById('musicName').value.trim();
    const musicFile = document.getElementById('musicFile').files[0];
    
    if (!name || !musicFile) {
        showAdminToast('Please fill all fields', 'error');
        return;
    }
    
    // Check file size (max 50MB)
    if (musicFile.size > 50 * 1024 * 1024) {
        showAdminToast('File size must be less than 50MB', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const fileUrl = await uploadFile(musicFile, 'music');
        
        if (!fileUrl) {
            throw new Error('Failed to upload music');
        }
        
        const data = {
            name: name,
            file_url: fileUrl,
            file_size: musicFile.size,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_playlist`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Music added successfully', 'success');
            closeModal();
            await loadMusic();
        } else {
            throw new Error('Failed to add music');
        }
        
    } catch (error) {
        console.error('Error adding music:', error);
        showAdminToast('Failed to add music', 'error');
    } finally {
        hideAdminLoading();
    }
}

function playMusicPreview(url) {
    const audio = new Audio(url);
    audio.play();
    
    setTimeout(() => {
        audio.pause();
    }, 10000); // Play for 10 seconds
}

async function deleteMusic(id) {
    if (!confirm('Are you sure you want to delete this music?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_playlist?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Music deleted successfully', 'success');
            await loadMusic();
        } else {
            throw new Error('Failed to delete music');
        }
        
    } catch (error) {
        console.error('Error deleting music:', error);
        showAdminToast('Failed to delete music', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== INPUT TABLES MANAGEMENT ====================
async function loadInputTables() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/input_tables?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const tables = await response.json();
        renderInputTables(tables);
        
    } catch (error) {
        console.error('Error loading input tables:', error);
    }
}

function renderInputTables(tables) {
    const container = document.getElementById('inputTablesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (tables.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No input tables yet</div></div>';
        return;
    }
    
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'data-item';
        
        card.innerHTML = `
            <div class="data-item-header">
                <div class="data-item-title">${table.title}</div>
                <div class="data-item-actions">
                    <button class="btn-danger" onclick="deleteInputTable(${table.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                Card: ${table.category_cards?.name || 'N/A'}<br>
                Placeholder: ${table.placeholder}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateInputTableModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="inputTableCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Field Title</label>
            <input type="text" id="inputTableTitle" placeholder="e.g. User ID">
        </div>
        <div class="form-group">
            <label>Placeholder</label>
            <input type="text" id="inputTablePlaceholder" placeholder="e.g. Enter your User ID">
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveInputTable()">Create Input Table</button>
        </div>
    `;
    
    createModal('Create Input Table', content);
    loadCategoryCardsForSelect();
}

async function saveInputTable() {
    const cardId = document.getElementById('inputTableCardId').value;
    const title = document.getElementById('inputTableTitle').value.trim();
    const placeholder = document.getElementById('inputTablePlaceholder').value.trim();
    
    if (!cardId || !title || !placeholder) {
        showAdminToast('Please fill all fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            category_card_id: cardId,
            title: title,
            placeholder: placeholder,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/input_tables`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Input table created successfully', 'success');
            closeModal();
            await loadInputTables();
        } else {
            throw new Error('Failed to create input table');
        }
        
    } catch (error) {
        console.error('Error creating input table:', error);
        showAdminToast('Failed to create input table', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteInputTable(id) {
    if (!confirm('Are you sure you want to delete this input table?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/input_tables?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Input table deleted successfully', 'success');
            await loadInputTables();
        } else {
            throw new Error('Failed to delete input table');
        }
        
    } catch (error) {
        console.error('Error deleting input table:', error);
        showAdminToast('Failed to delete input table', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== PRODUCT BANNERS MANAGEMENT ====================
async function loadProductBanners() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_banners?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const banners = await response.json();
        renderProductBanners(banners);
        
    } catch (error) {
        console.error('Error loading product banners:', error);
    }
}

function renderProductBanners(banners) {
    const container = document.getElementById('productBannersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (banners.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-text">No product banners yet</div></div>';
        return;
    }
    
    banners.forEach(banner => {
        const card = document.createElement('div');
        card.className = 'banner-card';
        
        card.innerHTML = `
            <img src="${banner.image_url}" class="banner-card-image">
            <div style="padding: 12px; font-size: 13px; color: var(--admin-text-secondary);">
                Card: ${banner.category_cards?.name || 'N/A'}
            </div>
            <div class="banner-card-actions">
                <button class="btn-danger" onclick="deleteProductBanner(${banner.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateProductBannerModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="productBannerCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Banner Image</label>
            <input type="file" id="productBannerImage" accept="image/*">
            <div id="productBannerPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveProductBanner()">Add Banner</button>
        </div>
    `;
    
    createModal('Add Product Banner', content);
    loadCategoryCardsForSelect();
    
    document.getElementById('productBannerImage').addEventListener('change', (e) => previewImage(e.target, 'productBannerPreview'));
}

async function saveProductBanner() {
    const cardId = document.getElementById('productBannerCardId').value;
    const imageFile = document.getElementById('productBannerImage').files[0];
    
    if (!cardId || !imageFile) {
        showAdminToast('Please fill all fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const imageUrl = await uploadFile(imageFile, 'product_banners');
        
        if (!imageUrl) {
            throw new Error('Failed to upload image');
        }
        
        const data = {
            category_card_id: cardId,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_banners`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Product banner added successfully', 'success');
            closeModal();
            await loadProductBanners();
        } else {
            throw new Error('Failed to add product banner');
        }
        
    } catch (error) {
        console.error('Error adding product banner:', error);
        showAdminToast('Failed to add product banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteProductBanner(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_banners?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Banner deleted successfully', 'success');
            await loadProductBanners();
        } else {
            throw new Error('Failed to delete banner');
        }
        
    } catch (error) {
        console.error('Error deleting banner:', error);
        showAdminToast('Failed to delete banner', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== GUIDELINES MANAGEMENT ====================
async function loadGuidelines() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_guidelines?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const guidelines = await response.json();
        renderGuidelines(guidelines);
        
    } catch (error) {
        console.error('Error loading guidelines:', error);
    }
}

function renderGuidelines(guidelines) {
    const container = document.getElementById('guidelinesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (guidelines.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No guidelines yet</div></div>';
        return;
    }
    
    guidelines.forEach(guideline => {
        const card = document.createElement('div');
        card.className = 'data-item';
        
        card.innerHTML = `
            <div class="data-item-header">
                <div class="data-item-title">${guideline.title}</div>
                <div class="data-item-actions">
                    <button class="btn-danger" onclick="deleteGuideline(${guideline.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                Card: ${guideline.category_cards?.name || 'N/A'}<br>
                ${guideline.content.substring(0, 100)}...
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateGuidelineModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="guidelineCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Title</label>
            <input type="text" id="guidelineTitle" placeholder="Enter guideline title">
        </div>
        <div class="form-group">
            <label>Content</label>
            <textarea id="guidelineContent" placeholder="Enter guideline content" style="min-height: 150px;"></textarea>
        </div>
        <div class="form-group">
            <label>Icon (Optional)</label>
            <input type="file" id="guidelineIcon" accept="image/*">
            <div id="guidelineIconPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveGuideline()">Create Guideline</button>
        </div>
    `;
    
    createModal('Create Guideline', content);
    loadCategoryCardsForSelect();
    
    document.getElementById('guidelineIcon').addEventListener('change', (e) => previewImage(e.target, 'guidelineIconPreview'));
}

async function saveGuideline() {
    const cardId = document.getElementById('guidelineCardId').value;
    const title = document.getElementById('guidelineTitle').value.trim();
    const content = document.getElementById('guidelineContent').value.trim();
    
    if (!cardId || !title || !content) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            category_card_id: cardId,
            title: title,
            content: content,
            created_at: new Date().toISOString()
        };
        
        const iconFile = document.getElementById('guidelineIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'guidelines');
            if (iconUrl) data.icon_url = iconUrl;
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_guidelines`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Guideline created successfully', 'success');
            closeModal();
            await loadGuidelines();
        } else {
            throw new Error('Failed to create guideline');
        }
        
    } catch (error) {
        console.error('Error creating guideline:', error);
        showAdminToast('Failed to create guideline', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteGuideline(id) {
    if (!confirm('Are you sure you want to delete this guideline?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_guidelines?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Guideline deleted successfully', 'success');
            await loadGuidelines();
        } else {
            throw new Error('Failed to delete guideline');
        }
        
    } catch (error) {
        console.error('Error deleting guideline:', error);
        showAdminToast('Failed to delete guideline', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== YOUTUBE VIDEOS MANAGEMENT ====================
async function loadYouTubeVideos() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_videos?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const videos = await response.json();
        renderYouTubeVideos(videos);
        
    } catch (error) {
        console.error('Error loading YouTube videos:', error);
    }
}

function renderYouTubeVideos(videos) {
    const container = document.getElementById('videosList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📹</div><div class="empty-state-text">No videos yet</div></div>';
        return;
    }
    
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'data-item';
        
        card.innerHTML = `
            <div class="data-item-header">
                <div class="data-item-title">YouTube Video</div>
                <div class="data-item-actions">
                    <button class="btn-danger" onclick="deleteYouTubeVideo(${video.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                Card: ${video.category_cards?.name || 'N/A'}<br>
                URL: ${video.video_url}<br>
                ${video.description || ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreateVideoModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="videoCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>YouTube Video URL</label>
            <input type="url" id="videoUrl" placeholder="https://youtube.com/...">
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <textarea id="videoDescription" placeholder="Enter video description"></textarea>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveYouTubeVideo()">Add Video</button>
        </div>
    `;
    
    createModal('Add YouTube Video', content);
    loadCategoryCardsForSelect();
}

async function saveYouTubeVideo() {
    const cardId = document.getElementById('videoCardId').value;
    const url = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    
    if (!cardId || !url) {
        showAdminToast('Please fill required fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const data = {
            category_card_id: cardId,
            video_url: url,
            description: description || null,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_videos`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Video added successfully', 'success');
            closeModal();
            await loadYouTubeVideos();
        } else {
            throw new Error('Failed to add video');
        }
        
    } catch (error) {
        console.error('Error adding video:', error);
        showAdminToast('Failed to add video', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deleteYouTubeVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_videos?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Video deleted successfully', 'success');
            await loadYouTubeVideos();
        } else {
            throw new Error('Failed to delete video');
        }
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showAdminToast('Failed to delete video', 'error');
    } finally {
        hideAdminLoading();
    }
}

// ==================== PAGE BACKGROUNDS MANAGEMENT ====================
async function loadPageBackgrounds() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/page_backgrounds?select=*,category_cards(name)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const backgrounds = await response.json();
        renderPageBackgrounds(backgrounds);
        
    } catch (error) {
        console.error('Error loading page backgrounds:', error);
    }
}

function renderPageBackgrounds(backgrounds) {
    const container = document.getElementById('pageBackgroundsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (backgrounds.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎨</div><div class="empty-state-text">No page backgrounds yet</div></div>';
        return;
    }
    
    backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = 'banner-card';
        
        card.innerHTML = `
            <img src="${bg.background_url}" class="banner-card-image">
            <div style="padding: 12px; font-size: 13px; color: var(--admin-text-secondary);">
                Card: ${bg.category_cards?.name || 'N/A'}
            </div>
            <div class="banner-card-actions">
                <button class="btn-danger" onclick="deletePageBackground(${bg.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showCreatePageBackgroundModal() {
    const content = `
        <div class="form-group">
            <label>Select Category Card</label>
            <select id="bgCardId">
                <option value="">Loading...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Background Image/Video</label>
            <input type="file" id="bgFile" accept="image/*,video/*">
            <div id="bgPreview" class="image-preview"></div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="savePageBackground()">Add Background</button>
        </div>
    `;
    
    createModal('Add Page Background', content);
    loadCategoryCardsForSelect();
    
    document.getElementById('bgFile').addEventListener('change', (e) => previewImage(e.target, 'bgPreview'));
}

async function savePageBackground() {
    const cardId = document.getElementById('bgCardId').value;
    const bgFile = document.getElementById('bgFile').files[0];
    
    if (!cardId || !bgFile) {
        showAdminToast('Please fill all fields', 'error');
        return;
    }
    
    showAdminLoading();
    
    try {
        const bgUrl = await uploadFile(bgFile, 'page_backgrounds');
        
        if (!bgUrl) {
            throw new Error('Failed to upload background');
        }
        
        const data = {
            category_card_id: cardId,
            background_url: bgUrl,
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/page_backgrounds`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAdminToast('Background added successfully', 'success');
            closeModal();
            await loadPageBackgrounds();
        } else {
            throw new Error('Failed to add background');
        }
        
    } catch (error) {
        console.error('Error adding background:', error);
        showAdminToast('Failed to add background', 'error');
    } finally {
        hideAdminLoading();
    }
}

async function deletePageBackground(id) {
    if (!confirm('Are you sure you want to delete this background?')) return;
    
    showAdminLoading();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/page_backgrounds?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            showAdminToast('Background deleted successfully', 'success');
            await loadPageBackgrounds();
        } else {
            throw new Error('Failed to delete background');
        }
        
    } catch (error) {
        console.error('Error deleting background:', error);
        showAdminToast('Failed to delete background', 'error');
    } finally {
        hideAdminLoading();
    }
}

