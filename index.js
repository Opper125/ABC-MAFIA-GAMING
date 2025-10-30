// ==================== SUPABASE CONFIGURATION ====================
const SUPABASE_URL = 'https://lbcmpfqlwooajiycywwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiY21wZnFsd29vYWppeWN5d3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjA5OTMsImV4cCI6MjA3NzM5Njk5M30.Vu66wK_H-Tkb3m9g1Z6U4g1jjA2F79i1b1tzqAw8CAQ';

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let websiteSettings = null;
let categories = [];
let products = [];
let orders = [];
let notifications = [];
let currentPage = 'home';
let selectedProduct = null;
let selectedPaymentMethod = null;
let uploadedProofFile = null;
let musicPlayer = null;
let currentMusicIndex = 0;
let musicPlaylist = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    await initializeApp();
});

async function initializeApp() {
    try {
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            await loadUserData();
            showMainApp();
        } else {
            hideLoading();
            showAuthModal();
        }
        
        // Load website settings
        await loadWebsiteSettings();
        
        // Initialize music player
        initializeMusicPlayer();
        
        // Prevent auto refresh on file uploads
        preventAutoRefresh();
        
    } catch (error) {
        console.error('Initialization error:', error);
        hideLoading();
    }
}

// ==================== LOADING SCREEN ====================
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
}

// ==================== AUTH FUNCTIONS ====================
function showAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('hidden');
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('hidden');
    }
}

function switchToSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function switchToLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// ==================== VALIDATION FUNCTIONS ====================
function validateEnglishOnly(text) {
    return /^[a-zA-Z0-9@#%*&®©]+$/.test(text);
}

function validateEmail(email) {
    return /^[a-zA-Z0-9._-]+@gmail\.com$/.test(email);
}

function validatePassword(password) {
    // Min 8 characters, contains special char, starts with capital letter
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password[0])) return false;
    if (!/[@#%*&®©]/.test(password)) return false;
    return true;
}

function containsProfanity(text) {
    const profanityList = [
        'fuck', 'shit', 'damn', 'bitch', 'ass', 'bastard',
        'အမေ', 'အဖေ', 'မင်းမ', 'ကောင်မ', 'ခွေး'
    ];
    
    const lowerText = text.toLowerCase();
    return profanityList.some(word => lowerText.includes(word));
}

async function checkUserExists(username, email) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(username.eq.${username},email.eq.${email})`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const users = await response.json();
        return users;
    } catch (error) {
        console.error('Error checking user:', error);
        return [];
    }
}

// ==================== SIGNUP FUNCTION ====================
async function handleSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (!validateEnglishOnly(username)) {
        showNotification('Username must contain only English characters', 'error');
        return;
    }
    
    if (containsProfanity(username)) {
        showNotification('Username contains inappropriate language', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please use a valid @gmail.com email', 'error');
        return;
    }
    
    if (containsProfanity(email)) {
        showNotification('Email contains inappropriate language', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showNotification('Password must be at least 8 characters, start with capital letter and contain special character (@#%*&®©)', 'error');
        return;
    }
    
    if (password === email.split('@')[0]) {
        showNotification('Password cannot be the same as email username', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Check if user exists
    const existingUsers = await checkUserExists(username, email);
    
    if (existingUsers && existingUsers.length > 0) {
        const errors = [];
        existingUsers.forEach(user => {
            if (user.username === username) errors.push('Username already exists');
            if (user.email === email) errors.push('Email already exists');
        });
        showNotification(errors.join(', '), 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Generate AI profile picture
        const profilePicture = await generateAIProfilePicture();
        
        // Create user
        const newUser = {
            username: username,
            email: email,
            password: password, // Store plain password (as requested)
            profile_picture: profilePicture,
            created_at: new Date().toISOString(),
            is_active: true
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(newUser)
        });
        
        if (response.ok) {
            const createdUser = await response.json();
            currentUser = createdUser[0];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            closeAuthModal();
            await loadUserData();
            showMainApp();
            showNotification('Account created successfully!', 'success');
        } else {
            throw new Error('Failed to create account');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Failed to create account. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== LOGIN FUNCTION ====================
async function handleLogin() {
    const usernameOrEmail = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!usernameOrEmail || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(username.eq.${usernameOrEmail},email.eq.${usernameOrEmail})&password=eq.${password}&is_active=eq.true`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const users = await response.json();
        
        if (users && users.length > 0) {
            currentUser = users[0];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            closeAuthModal();
            await loadUserData();
            showMainApp();
            showNotification('Welcome back!', 'success');
        } else {
            showNotification('Invalid credentials or account deactivated', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== LOGOUT FUNCTION ====================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

// ==================== AI PROFILE PICTURE GENERATOR ====================
async function generateAIProfilePicture() {
    // Generate a unique avatar using DiceBear API
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

// ==================== SHOW MAIN APP ====================
function showMainApp() {
    document.getElementById('mainApp').classList.remove('hidden');
    hideLoading();
}

// ==================== LOAD USER DATA ====================
async function loadUserData() {
    if (!currentUser) return;
    
    // Update profile display
    const userAvatarTop = document.getElementById('userAvatarTop');
    const userAvatar = document.getElementById('userAvatar');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    
    if (userAvatarTop) userAvatarTop.src = currentUser.profile_picture;
    if (userAvatar) userAvatar.src = currentUser.profile_picture;
    if (profileUsername) profileUsername.textContent = currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    
    // Load user orders
    await loadOrders();
    
    // Load notifications
    await loadNotifications();
}

// ==================== LOAD WEBSITE SETTINGS ====================
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
            applyWebsiteSettings();
        }
        
        // Load categories
        await loadCategories();
        
        // Load banners
        await loadBanners();
        
    } catch (error) {
        console.error('Error loading website settings:', error);
    }
}

function applyWebsiteSettings() {
    if (!websiteSettings) return;
    
    // Apply logo
    const logo = document.getElementById('websiteLogo');
    if (logo && websiteSettings.logo_url) {
        logo.src = websiteSettings.logo_url;
    }
    
    // Apply background
    if (websiteSettings.background_url) {
        document.body.style.backgroundImage = `url(${websiteSettings.background_url})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
    }
    
    // Apply custom CSS if available
    if (websiteSettings.custom_css) {
        const style = document.createElement('style');
        style.textContent = websiteSettings.custom_css;
        document.head.appendChild(style);
    }
}

// ==================== SESSION MANAGEMENT (Add to index.js Part 1) ====================
// After loadUserData function

function initializeSessionManagement() {
    // Prevent auto logout by checking session every 5 minutes
    setInterval(async () => {
        if (!currentUser) return;
        
        try {
            // Check if user still exists and is active
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${currentUser.id}&is_active=eq.true`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const users = await response.json();
            
            if (!users || users.length === 0) {
                // User has been deleted or deactivated
                localStorage.removeItem('currentUser');
                showNotification('Your account has been deactivated', 'error');
                setTimeout(() => location.reload(), 2000);
            } else {
                // Update user data
                currentUser = users[0];
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }, 300000); // Check every 5 minutes
}

// Call this in initializeApp function
// Add after: currentUser = JSON.parse(savedUser);
// initializeSessionManagement();

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 99999;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== NAVIGATION FUNCTIONS ====================
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Remove active from nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected page
    let pageElement;
    switch(page) {
        case 'home':
            pageElement = document.getElementById('homePage');
            break;
        case 'orderHistory':
            pageElement = document.getElementById('orderHistoryPage');
            loadOrders();
            break;
        case 'news':
            pageElement = document.getElementById('newsPage');
            loadNews();
            break;
        case 'contacts':
            pageElement = document.getElementById('contactsPage');
            loadContacts();
            break;
        case 'profile':
            pageElement = document.getElementById('profilePage');
            break;
    }
    
    if (pageElement) {
        pageElement.classList.add('active');
        currentPage = page;
    }
    
    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    const navMap = { 'home': 0, 'orderHistory': 1, 'news': 2, 'contacts': 3, 'profile': 4 };
    if (navItems[navMap[page]]) {
        navItems[navMap[page]].classList.add('active');
    }
}

function navigateToProfile() {
    navigateTo('profile');
}

function navigateBack() {
    navigateTo('home');
}

// ==================== LOAD CATEGORIES ====================
async function loadCategories() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        categories = await response.json();
        
        // Load category cards for each category
        for (let category of categories) {
            await loadCategoryCards(category.id);
        }
        
        renderCategories();
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoryCards(categoryId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/category_cards?category_id=eq.${categoryId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const cards = await response.json();
        
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            category.cards = cards;
        }
        
    } catch (error) {
        console.error('Error loading category cards:', error);
    }
}

function renderCategories() {
    const categoriesSection = document.getElementById('categoriesSection');
    if (!categoriesSection) return;
    
    categoriesSection.innerHTML = '';
    
    categories.forEach(category => {
        const categoryBlock = document.createElement('div');
        categoryBlock.className = 'category-block';
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'category-title';
        titleEl.textContent = category.name;
        categoryBlock.appendChild(titleEl);
        
        if (category.cards && category.cards.length > 0) {
            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'category-cards-grid';
            
            category.cards.forEach(card => {
                const cardEl = createCategoryCard(card, category);
                cardsGrid.appendChild(cardEl);
            });
            
            categoryBlock.appendChild(cardsGrid);
        }
        
        categoriesSection.appendChild(categoryBlock);
    });
}

function createCategoryCard(card, category) {
    const cardEl = document.createElement('div');
    cardEl.className = 'category-card';
    cardEl.onclick = () => openProductPage(category, card);
    
    // Flag
    if (card.country_flag) {
        const flag = document.createElement('img');
        flag.src = card.country_flag;
        flag.className = 'category-card-flag';
        cardEl.appendChild(flag);
    }
    
    // Discount badge
    if (card.discount_percentage > 0) {
        const discount = document.createElement('div');
        discount.className = 'category-card-discount';
        discount.textContent = `-${card.discount_percentage}%`;
        cardEl.appendChild(discount);
    }
    
    // Icon
    const icon = document.createElement('img');
    icon.src = card.icon_url;
    icon.className = 'category-card-icon';
    cardEl.appendChild(icon);
    
    // Name
    const name = document.createElement('div');
    name.className = 'category-card-name';
    name.textContent = card.name;
    cardEl.appendChild(name);
    
    // Rating and sales
    const rating = document.createElement('div');
    rating.className = 'category-card-rating';
    rating.innerHTML = `
        <span class="category-card-stars">${'⭐'.repeat(Math.floor(card.average_rating || 0))}</span>
        <span>${card.total_sales || 0} sales</span>
    `;
    cardEl.appendChild(rating);
    
    // Top Up button
    const topUpBtn = document.createElement('button');
    topUpBtn.className = 'category-card-topup-btn';
    topUpBtn.textContent = 'Top Up';
    topUpBtn.onclick = (e) => {
        e.stopPropagation();
        openProductPage(category, card);
    };
    cardEl.appendChild(topUpBtn);
    
    return cardEl;
}

// ==================== PRODUCT PAGE ====================
async function openProductPage(category, card) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    showLoading();
    
    // Load products for this card
    await loadProducts(card.id);
    
    // Load input tables
    await loadInputTables(card.id);
    
    // Load product banners
    await loadProductBanners(card.id);
    
    // Load product guidelines
    await loadProductGuidelines(card.id);
    
    // Load YouTube videos
    await loadYouTubeVideos(card.id);
    
    // Load feedback
    await loadFeedback(card.id);
    
    // Render product page
    renderProductPage(category, card);
    
    hideLoading();
}

async function loadProducts(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?category_card_id=eq.${cardId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        products = await response.json();
        
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

async function loadInputTables(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/input_tables?category_card_id=eq.${cardId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error loading input tables:', error);
        return [];
    }
}

async function loadProductBanners(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_banners?category_card_id=eq.${cardId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error loading product banners:', error);
        return [];
    }
}

async function loadProductGuidelines(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_guidelines?category_card_id=eq.${cardId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error loading guidelines:', error);
        return [];
    }
}

async function loadYouTubeVideos(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_videos?category_card_id=eq.${cardId}&select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error loading YouTube videos:', error);
        return [];
    }
}

async function loadFeedback(cardId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback?category_card_id=eq.${cardId}&select=*,users(username,profile_picture)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error loading feedback:', error);
        return [];
    }
}

async function renderProductPage(category, card) {
    const productDetailsPage = document.getElementById('productDetailsPage');
    const productDetailsContent = document.getElementById('productDetailsContent');
    
    if (!productDetailsPage || !productDetailsContent) return;
    
    productDetailsContent.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'product-page-header';
    header.innerHTML = `
        <img src="${card.icon_url}" class="product-page-icon">
        <div class="product-page-info">
            <h2>${card.name}</h2>
            <p>${category.name}</p>
        </div>
    `;
    productDetailsContent.appendChild(header);
    
    // Product Banners
    const banners = await loadProductBanners(card.id);
    if (banners && banners.length > 0) {
        const bannerSection = createProductBannerSection(banners);
        productDetailsContent.appendChild(bannerSection);
    }
    
    // Input Tables
    const inputTables = await loadInputTables(card.id);
    if (inputTables && inputTables.length > 0) {
        const inputSection = createInputTableSection(inputTables);
        productDetailsContent.appendChild(inputSection);
    }
    
    // Products Menu
    if (products && products.length > 0) {
        const productsSection = createProductsMenuSection(products);
        productDetailsContent.appendChild(productsSection);
    }
    
    // Buy Now Button
    const buyNowSection = document.createElement('div');
    buyNowSection.className = 'buy-now-section';
    buyNowSection.innerHTML = `
        <button class="buy-now-btn" onclick="handleBuyNow()">Buy Now</button>
    `;
    productDetailsContent.appendChild(buyNowSection);
    
    // Guidelines
    const guidelines = await loadProductGuidelines(card.id);
    if (guidelines && guidelines.length > 0) {
        const guidelinesSection = createGuidelinesSection(guidelines);
        productDetailsContent.appendChild(guidelinesSection);
    }
    
    // YouTube Videos
    const videos = await loadYouTubeVideos(card.id);
    if (videos && videos.length > 0) {
        const videosSection = createYouTubeSection(videos);
        productDetailsContent.appendChild(videosSection);
    }
    
    // Feedback
    const feedback = await loadFeedback(card.id);
    const feedbackSection = createFeedbackSection(feedback, card.id);
    productDetailsContent.appendChild(feedbackSection);
    
    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    productDetailsPage.classList.add('active');
}

function createProductBannerSection(banners) {
    const section = document.createElement('div');
    section.className = 'product-banner-section';
    
    const slider = document.createElement('div');
    slider.className = 'product-banner-slider';
    slider.id = 'productBannerSlider';
    
    banners.forEach((banner, index) => {
        const item = document.createElement('div');
        item.className = 'product-banner-item';
        if (index === 0) item.classList.add('center');
        else item.classList.add('side');
        
        const img = document.createElement('img');
        img.src = banner.image_url;
        item.appendChild(img);
        
        slider.appendChild(item);
    });
    
    section.appendChild(slider);
    
    // Auto slide
    if (banners.length > 1) {
        let currentBannerIndex = 0;
        setInterval(() => {
            currentBannerIndex = (currentBannerIndex + 1) % banners.length;
            updateProductBannerSlider(currentBannerIndex);
        }, 5000);
    }
    
    return section;
}

function updateProductBannerSlider(index) {
    const items = document.querySelectorAll('.product-banner-item');
    items.forEach((item, i) => {
        item.classList.remove('center', 'side');
        if (i === index) {
            item.classList.add('center');
        } else {
            item.classList.add('side');
        }
    });
}

function createInputTableSection(inputTables) {
    const section = document.createElement('div');
    section.className = 'input-table-section';
    
    const title = document.createElement('h3');
    title.className = 'input-table-title';
    title.textContent = 'Account Information';
    section.appendChild(title);
    
    inputTables.forEach(table => {
        const group = document.createElement('div');
        group.className = 'input-table-group';
        
        const label = document.createElement('label');
        label.textContent = table.title;
        group.appendChild(label);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = table.placeholder;
        input.id = `input_${table.id}`;
        group.appendChild(input);
        
        section.appendChild(group);
    });
    
    return section;
}

function createProductsMenuSection(products) {
    const section = document.createElement('div');
    section.className = 'products-menu-section';
    
    const title = document.createElement('h3');
    title.textContent = 'Select Product';
    section.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'products-grid';
    
    products.forEach(product => {
        const item = createProductMenuItem(product);
        grid.appendChild(item);
    });
    
    section.appendChild(grid);
    
    return section;
}

function createProductMenuItem(product) {
    const item = document.createElement('div');
    item.className = 'product-menu-item';
    item.onclick = () => selectProduct(product, item);
    
    // Icon
    const icon = document.createElement('img');
    icon.src = product.icon_url || 'https://via.placeholder.com/150';
    icon.className = 'product-menu-icon';
    item.appendChild(icon);
    
    // Info
    const info = document.createElement('div');
    info.className = 'product-menu-info';
    
    // Product type badge
    if (product.product_type) {
        const badge = document.createElement('div');
        badge.className = 'product-type-badge';
        badge.textContent = product.product_type;
        badge.style.background = product.type_badge_color || 'linear-gradient(135deg, #667eea, #764ba2)';
        info.appendChild(badge);
    }
    
    // Name
    const name = document.createElement('div');
    name.className = 'product-menu-name';
    name.textContent = product.name;
    info.appendChild(name);
    
    // Amount
    const amount = document.createElement('div');
    amount.className = 'product-menu-amount';
    amount.textContent = product.amount;
    info.appendChild(amount);
    
    // Price
    const priceContainer = document.createElement('div');
    priceContainer.className = 'product-menu-price-container';
    
    const finalPrice = calculateFinalPrice(product.price, product.discount_percentage);
    
    const price = document.createElement('div');
    price.className = 'product-menu-price';
    price.textContent = `${finalPrice} Ks`;
    priceContainer.appendChild(price);
    
    if (product.discount_percentage > 0) {
        const originalPrice = document.createElement('div');
        originalPrice.className = 'product-menu-price-original';
        originalPrice.textContent = `${product.price} Ks`;
        priceContainer.appendChild(originalPrice);
        
        const discount = document.createElement('div');
        discount.className = 'product-menu-discount';
        discount.textContent = `-${product.discount_percentage}%`;
        priceContainer.appendChild(discount);
    }
    
    info.appendChild(priceContainer);
    
    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'product-menu-expand-btn';
    expandBtn.textContent = 'View Details';
    expandBtn.onclick = (e) => {
        e.stopPropagation();
        showProductDetailsModal(product);
    };
    info.appendChild(expandBtn);
    
    item.appendChild(info);
    
    return item;
}

function calculateFinalPrice(price, discountPercentage) {
    if (!discountPercentage || discountPercentage === 0) return price;
    return Math.floor(price - (price * discountPercentage / 100));
}

function selectProduct(product, element) {
    // Remove previous selection
    document.querySelectorAll('.product-menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select current
    element.classList.add('selected');
    selectedProduct = product;
}

function showProductDetailsModal(product) {
    const modal = document.createElement('div');
    modal.className = 'product-details-modal';
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    const content = document.createElement('div');
    content.className = 'product-details-content';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'product-details-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => modal.remove();
    content.appendChild(closeBtn);
    
    content.innerHTML += `
        <h2>${product.name}</h2>
        <p><strong>Amount:</strong> ${product.amount}</p>
        <p><strong>Price:</strong> ${product.price} Ks</p>
        ${product.discount_percentage > 0 ? `<p><strong>Discount:</strong> ${product.discount_percentage}%</p>` : ''}
        <p><strong>Final Price:</strong> ${calculateFinalPrice(product.price, product.discount_percentage)} Ks</p>
        ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// ==================== BUY NOW FUNCTION ====================
async function handleBuyNow() {
    if (!selectedProduct) {
        showNotification('Please select a product', 'error');
        return;
    }
    
    // Get input table values
    const inputTables = document.querySelectorAll('.input-table-group input');
    const inputData = {};
    let hasEmptyFields = false;
    
    inputTables.forEach(input => {
        if (input.value.trim() === '') {
            hasEmptyFields = true;
        }
        inputData[input.id] = input.value.trim();
    });
    
    if (hasEmptyFields && inputTables.length > 0) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Show payment modal
    showPaymentModal(selectedProduct, inputData);
}

async function showPaymentModal(product, inputData) {
    showLoading();
    
    // Load payment methods
    const paymentMethods = await loadPaymentMethods(product.id);
    
    hideLoading();
    
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.id = 'paymentModal';
    
    const content = document.createElement('div');
    content.className = 'payment-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'payment-header';
    header.innerHTML = `
        <h2>Complete Payment</h2>
        <p>Please review your order and select payment method</p>
    `;
    content.appendChild(header);
    
    // Summary
    const summary = document.createElement('div');
    summary.className = 'payment-summary';
    const finalPrice = calculateFinalPrice(product.price, product.discount_percentage);
    summary.innerHTML = `
        <div class="payment-summary-item">
            <span>Product:</span>
            <span>${product.name}</span>
        </div>
        <div class="payment-summary-item">
            <span>Amount:</span>
            <span>${product.amount}</span>
        </div>
        <div class="payment-summary-item">
            <span>Original Price:</span>
            <span>${product.price} Ks</span>
        </div>
        ${product.discount_percentage > 0 ? `
        <div class="payment-summary-item">
            <span>Discount:</span>
            <span>-${product.discount_percentage}%</span>
        </div>
        ` : ''}
        <div class="payment-summary-item">
            <span>Total:</span>
            <span>${finalPrice} Ks</span>
        </div>
    `;
    content.appendChild(summary);
    
    // Payment methods
    if (paymentMethods && paymentMethods.length > 0) {
        const methodsSection = document.createElement('div');
        methodsSection.className = 'payment-methods';
        methodsSection.innerHTML = '<h3>Select Payment Method</h3>';
        
        const methodsGrid = document.createElement('div');
        methodsGrid.className = 'payment-method-grid';
        
        paymentMethods.forEach(method => {
            const methodItem = createPaymentMethodItem(method);
            methodsGrid.appendChild(methodItem);
        });
        
        methodsSection.appendChild(methodsGrid);
        content.appendChild(methodsSection);
    }
    
    // Payment details (will be shown when method is selected)
    const detailsContainer = document.createElement('div');
    detailsContainer.id = 'paymentDetailsContainer';
    content.appendChild(detailsContainer);
    
    // Proof upload
    const proofSection = document.createElement('div');
    proofSection.className = 'payment-proof-upload';
    proofSection.innerHTML = `
        <h3>Upload Payment Proof</h3>
        <div class="file-upload-area" id="fileUploadArea" onclick="document.getElementById('proofFileInput').click()">
            <div class="file-upload-icon">📤</div>
            <div class="file-upload-text">Click to upload screenshot</div>
        </div>
        <input type="file" id="proofFileInput" accept="image/*" style="display: none;">
        <div class="file-preview" id="filePreview"></div>
    `;
    content.appendChild(proofSection);
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-order-btn';
    submitBtn.textContent = 'Submit Order';
    submitBtn.disabled = true;
    submitBtn.id = 'submitOrderBtn';
    submitBtn.onclick = () => submitOrder(product, inputData, finalPrice);
    content.appendChild(submitBtn);
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // File upload handler
    document.getElementById('proofFileInput').addEventListener('change', handleProofFileUpload);
}

async function loadPaymentMethods(productId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_payment_methods?product_id=eq.${productId}&select=*,payment_methods(*)`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const data = await response.json();
        return data.map(item => item.payment_methods);
        
    } catch (error) {
        console.error('Error loading payment methods:', error);
        return [];
    }
}

function createPaymentMethodItem(method) {
    const item = document.createElement('div');
    item.className = 'payment-method-item';
    item.onclick = () => selectPaymentMethod(method, item);
    
    const icon = document.createElement('img');
    icon.src = method.icon_url;
    icon.className = 'payment-method-icon';
    item.appendChild(icon);
    
    const name = document.createElement('div');
    name.className = 'payment-method-name';
    name.textContent = method.name;
    item.appendChild(name);
    
    return item;
}

function selectPaymentMethod(method, element) {
    // Remove previous selection
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select current
    element.classList.add('selected');
    selectedPaymentMethod = method;
    
    // Show payment details
    showPaymentDetails(method);
    
    // Enable submit button if file is uploaded
    updateSubmitButtonState();
}

function showPaymentDetails(method) {
    const container = document.getElementById('paymentDetailsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="payment-details">
            <h3>Payment Details</h3>
            <div class="payment-detail-item">
                <label>Account Name:</label>
                <p>${method.account_name}</p>
            </div>
            <div class="payment-detail-item">
                <label>Account Number / Address:</label>
                <p>${method.account_number}</p>
            </div>
            ${method.instructions ? `
            <div class="payment-detail-item">
                <label>Instructions:</label>
                <p>${method.instructions}</p>
            </div>
            ` : ''}
        </div>
    `;
}

function handleProofFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file', 'error');
        return;
    }
    
    uploadedProofFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('filePreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        
        const uploadArea = document.getElementById('fileUploadArea');
        uploadArea.classList.add('has-file');
        uploadArea.querySelector('.file-upload-text').textContent = file.name;
    };
    reader.readAsDataURL(file);
    
    updateSubmitButtonState();
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
        submitBtn.disabled = !(selectedPaymentMethod && uploadedProofFile);
    }
}

// ==================== SUBMIT ORDER ====================
async function submitOrder(product, inputData, finalPrice) {
    if (!selectedPaymentMethod || !uploadedProofFile) {
        showNotification('Please complete all steps', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Upload proof image
        const proofUrl = await uploadProofImage(uploadedProofFile);
        
        // Generate order ID
        const orderId = generateOrderId();
        
        // Create order
        const order = {
            order_id: orderId,
            user_id: currentUser.id,
            product_id: product.id,
            payment_method_id: selectedPaymentMethod.id,
            input_data: JSON.stringify(inputData),
            proof_image_url: proofUrl,
            total_price: finalPrice,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            // Close payment modal
            const modal = document.getElementById('paymentModal');
            if (modal) modal.remove();
            
            // Reset selections
            selectedProduct = null;
            selectedPaymentMethod = null;
            uploadedProofFile = null;
            
            showNotification('Order submitted successfully!', 'success');
            
            // Navigate to order history
            setTimeout(() => {
                navigateTo('orderHistory');
            }, 1500);
        } else {
            throw new Error('Failed to submit order');
        }
        
    } catch (error) {
        console.error('Submit order error:', error);
        showNotification('Failed to submit order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function uploadProofImage(file) {
    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/payment_proofs/${fileName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: file
        });
        
        if (response.ok) {
            return `${SUPABASE_URL}/storage/v1/object/public/payment_proofs/${fileName}`;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        // Fallback: return placeholder
        return 'https://via.placeholder.com/400x300?text=Payment+Proof';
    }
}

function generateOrderId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
}

// ==================== ENHANCED ORDER RECEIPT (Replace generateOrderReceipt in index.js Part 2) ====================

async function generateOrderReceipt(order) {
    // Create a more structured receipt
    const receipt = {
        websiteName: websiteSettings?.name || 'Premium Shop',
        websiteLogo: websiteSettings?.logo_url || '',
        orderId: order.order_id,
        orderDate: new Date(order.created_at).toLocaleString(),
        approvedDate: order.approved_at ? new Date(order.approved_at).toLocaleString() : 'N/A',
        customer: {
            username: order.users?.username || 'N/A',
            email: order.users?.email || 'N/A'
        },
        product: {
            name: order.products?.name || 'N/A',
            amount: order.products?.amount || 'N/A',
            price: order.total_price
        },
        payment: {
            method: order.payment_methods?.name || 'N/A'
        },
        status: order.status,
        message: order.admin_message || ''
    };
    
    // Create HTML receipt
    const htmlReceipt = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .receipt { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
        .title { font-size: 28px; font-weight: bold; color: #333; }
        .order-id { font-size: 18px; color: #6366f1; margin-top: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #555; margin-bottom: 10px; border-left: 4px solid #6366f1; padding-left: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-weight: 500; }
        .value { color: #333; font-weight: 600; }
        .total { font-size: 24px; color: #6366f1; font-weight: bold; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        .status.approved { background: #10b981; color: white; }
        .status.pending { background: #f59e0b; color: white; }
        .status.rejected { background: #ef4444; color: white; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #999; font-size: 14px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            ${receipt.websiteLogo ? `<img src="${receipt.websiteLogo}" class="logo">` : ''}
            <div class="title">${receipt.websiteName}</div>
            <div class="order-id">Order #${receipt.orderId}</div>
        </div>
        
        <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
                <span class="label">Order Date:</span>
                <span class="value">${receipt.orderDate}</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="status ${receipt.status}">${receipt.status.toUpperCase()}</span>
            </div>
            ${receipt.approvedDate !== 'N/A' ? `
            <div class="info-row">
                <span class="label">Approved Date:</span>
                <span class="value">${receipt.approvedDate}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
                <span class="label">Username:</span>
                <span class="value">${receipt.customer.username}</span>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${receipt.customer.email}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Product Details</div>
            <div class="info-row">
                <span class="label">Product:</span>
                <span class="value">${receipt.product.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Amount:</span>
                <span class="value">${receipt.product.amount}</span>
            </div>
            <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${receipt.payment.method}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="info-row" style="border: none;">
                <span class="label" style="font-size: 20px;">Total Amount:</span>
                <span class="total">${receipt.product.price} Ks</span>
            </div>
        </div>
        
        ${receipt.message ? `
        <div class="section">
            <div class="section-title">Admin Message</div>
            <p style="color: #666; line-height: 1.6;">${receipt.message}</p>
        </div>
        ` : ''}
        
        <div class="footer">
            Thank you for your purchase!<br>
            This is a computer-generated receipt.
        </div>
    </div>
</body>
</html>
    `;
    
    return htmlReceipt;
}

// Note: For proper PDF generation, would need jsPDF library
// For now, this creates a printable HTML receipt

// ==================== LOAD ORDERS ====================
async function loadOrders() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${currentUser.id}&select=*,products(*),payment_methods(*)&order=created_at.desc`, {
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

function renderOrders() {
    const orderList = document.getElementById('orderList');
    if (!orderList) return;
    
    orderList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        orderList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No orders yet</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderItem = createOrderItem(order);
        orderList.appendChild(orderItem);
    });
}

function createOrderItem(order) {
    const item = document.createElement('div');
    item.className = 'order-item';
    
    // Header
    const header = document.createElement('div');
    header.className = 'order-header';
    
    const orderId = document.createElement('div');
    orderId.className = 'order-id';
    orderId.textContent = `Order #${order.order_id}`;
    header.appendChild(orderId);
    
    const status = document.createElement('div');
    status.className = `order-status ${order.status}`;
    status.textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    header.appendChild(status);
    
    item.appendChild(header);
    
    // Info
    const info = document.createElement('div');
    info.className = 'order-info';
    
    if (order.products && order.products.icon_url) {
        const icon = document.createElement('img');
        icon.src = order.products.icon_url;
        icon.className = 'order-product-icon';
        info.appendChild(icon);
    }
    
    const details = document.createElement('div');
    details.className = 'order-details';
    
    const productName = document.createElement('div');
    productName.className = 'order-product-name';
    productName.textContent = order.products ? order.products.name : 'Product';
    details.appendChild(productName);
    
    const productAmount = document.createElement('div');
    productAmount.className = 'order-product-amount';
    productAmount.textContent = order.products ? order.products.amount : '';
    details.appendChild(productAmount);
    
    const price = document.createElement('div');
    price.className = 'order-price';
    price.textContent = `${order.total_price} Ks`;
    details.appendChild(price);
    
    info.appendChild(details);
    item.appendChild(info);
    
    // Admin message
    if (order.admin_message) {
        const message = document.createElement('div');
        message.style.cssText = 'background: var(--dark-elevated); padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 14px;';
        message.innerHTML = `<strong>Admin:</strong> ${order.admin_message}`;
        item.appendChild(message);
    }
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'order-footer';
    
    const date = document.createElement('div');
    date.className = 'order-date';
    date.textContent = new Date(order.created_at).toLocaleString();
    footer.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'order-actions';
    
    // Download button (if approved)
    if (order.status === 'approved') {
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'order-action-btn';
        downloadBtn.textContent = '📥 Download';
        downloadBtn.onclick = () => downloadOrderReceipt(order);
        actions.appendChild(downloadBtn);
    }
    
    // View details button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'order-action-btn';
    viewBtn.textContent = '👁️ View';
    viewBtn.onclick = () => viewOrderDetails(order);
    actions.appendChild(viewBtn);
    
    footer.appendChild(actions);
    item.appendChild(footer);
    
    // Rating (if approved and not rated)
    if (order.status === 'approved' && !order.rating) {
        const ratingSection = document.createElement('div');
        ratingSection.className = 'order-rating';
        ratingSection.innerHTML = '<p style="font-size: 13px; margin-bottom: 8px;">Rate this product:</p>';
        
        const stars = document.createElement('div');
        stars.style.display = 'flex';
        stars.style.gap = '4px';
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '⭐';
            star.onclick = () => rateOrder(order, i, star.parentElement);
            stars.appendChild(star);
        }
        
        ratingSection.appendChild(stars);
        item.appendChild(ratingSection);
    } else if (order.rating) {
        const ratingDisplay = document.createElement('div');
        ratingDisplay.style.cssText = 'margin-top: 12px; font-size: 13px; color: var(--text-secondary);';
        ratingDisplay.innerHTML = `Your rating: ${'⭐'.repeat(order.rating)}`;
        item.appendChild(ratingDisplay);
    }
    
    return item;
}

async function rateOrder(order, rating, starsContainer) {
    try {
        // Update order rating
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: rating })
        });
        
        if (response.ok) {
            // Prompt for feedback message
            const message = prompt('Please share your feedback (optional):');
            
            if (message) {
                await submitFeedback(order.products.category_card_id, rating, message);
            }
            
            showNotification('Thank you for your rating!', 'success');
            loadOrders();
        }
        
    } catch (error) {
        console.error('Error rating order:', error);
        showNotification('Failed to submit rating', 'error');
    }
}

async function submitFeedback(categoryCardId, rating, message) {
    try {
        const feedback = {
            category_card_id: categoryCardId,
            user_id: currentUser.id,
            rating: rating,
            message: message,
            created_at: new Date().toISOString()
        };
        
        await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
    }
}

function viewOrderDetails(order) {
    const modal = document.createElement('div');
    modal.className = 'product-details-modal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    const content = document.createElement('div');
    content.className = 'product-details-content';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'product-details-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => modal.remove();
    content.appendChild(closeBtn);
    
    content.innerHTML += `
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${order.order_id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Product:</strong> ${order.products ? order.products.name : 'N/A'}</p>
        <p><strong>Amount:</strong> ${order.products ? order.products.amount : 'N/A'}</p>
        <p><strong>Total Price:</strong> ${order.total_price} Ks</p>
        <p><strong>Payment Method:</strong> ${order.payment_methods ? order.payment_methods.name : 'N/A'}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        ${order.approved_at ? `<p><strong>Approved:</strong> ${new Date(order.approved_at).toLocaleString()}</p>` : ''}
        ${order.admin_message ? `<p><strong>Admin Message:</strong> ${order.admin_message}</p>` : ''}
        ${order.proof_image_url ? `<p><strong>Payment Proof:</strong></p><img src="${order.proof_image_url}" style="max-width: 100%; border-radius: 8px;">` : ''}
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

async function downloadOrderReceipt(order) {
    showLoading();
    
    try {
        // Generate PDF receipt (simplified version)
        const receipt = await generateOrderReceipt(order);
        
        // Create download link
        const blob = new Blob([receipt], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Order_${order.order_id}.pdf`;
        a.click();
        
        showNotification('Receipt downloaded successfully', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download receipt', 'error');
    } finally {
        hideLoading();
    }
}

function generateOrderReceipt(order) {
    // Simple text-based receipt (in real app, use PDF library)
    const receipt = `
ORDER RECEIPT
=============

Order ID: ${order.order_id}
Date: ${new Date(order.created_at).toLocaleString()}

Product: ${order.products ? order.products.name : 'N/A'}
Amount: ${order.products ? order.products.amount : 'N/A'}
Price: ${order.total_price} Ks

Payment Method: ${order.payment_methods ? order.payment_methods.name : 'N/A'}
Status: ${order.status}

${order.admin_message ? `Admin Note: ${order.admin_message}` : ''}

Thank you for your purchase!
    `;
    
    return receipt;
}

// ==================== LOAD BANNERS ====================
async function loadBanners() {
    try {
        // Main banners
        const mainResponse = await fetch(`${SUPABASE_URL}/rest/v1/main_banners?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const mainBanners = await mainResponse.json();
        renderMainBanners(mainBanners);
        
        // Link banners
        const linkResponse = await fetch(`${SUPABASE_URL}/rest/v1/link_banners?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const linkBanners = await linkResponse.json();
        renderLinkBanners(linkBanners);
        
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

function renderMainBanners(banners) {
    const slider = document.getElementById('bannerSlider');
    const indicators = document.getElementById('bannerIndicators');
    
    if (!slider || !indicators || !banners || banners.length === 0) return;
    
    slider.innerHTML = '';
    indicators.innerHTML = '';
    
    banners.forEach((banner, index) => {
        // Slide
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        if (index === 0) slide.classList.add('active');
        
        const img = document.createElement('img');
        img.src = banner.image_url;
        slide.appendChild(img);
        
        slider.appendChild(slide);
        
        // Indicator
        const indicator = document.createElement('div');
        indicator.className = 'banner-indicator';
        if (index === 0) indicator.classList.add('active');
        indicator.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });
    
    // Auto slide
    if (banners.length > 1) {
        let currentSlide = 0;
        setInterval(() => {
            currentSlide = (currentSlide + 1) % banners.length;
            goToSlide(currentSlide);
        }, 5000);
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.banner-slide');
    const indicators = document.querySelectorAll('.banner-indicator');
    
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
    
    indicators.forEach((indicator, i) => {
        indicator.classList.remove('active');
        if (i === index) {
            indicator.classList.add('active');
        }
    });
}

function renderLinkBanners(banners) {
    const container = document.getElementById('bannerLink');
    if (!container || !banners || banners.length === 0) return;
    
    container.innerHTML = '';
    
    let currentBannerIndex = 0;
    
    const showBanner = (index) => {
        const banner = banners[index];
        container.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = banner.image_url;
        img.onclick = () => {
            if (banner.link_url) {
                window.open(banner.link_url, '_blank');
            }
        };
        container.appendChild(img);
    };
    
    showBanner(0);
    
    // Auto slide
    if (banners.length > 1) {
        setInterval(() => {
            currentBannerIndex = (currentBannerIndex + 1) % banners.length;
            showBanner(currentBannerIndex);
        }, 10000);
    }
}

// ==================== LOAD NEWS ====================
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
    const newsList = document.getElementById('newsList');
    if (!newsList) return;
    
    newsList.innerHTML = '';
    
    if (!newsItems || newsItems.length === 0) {
        newsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No news available</p>';
        return;
    }
    
    newsItems.forEach(news => {
        const newsItem = createNewsItem(news);
        newsList.appendChild(newsItem);
    });
}

function createNewsItem(news) {
    const item = document.createElement('div');
    item.className = 'news-item';
    
    // Media
    if (news.media_url) {
        if (news.media_type === 'video') {
            const video = document.createElement('video');
            video.src = news.media_url;
            video.className = 'news-media';
            video.controls = true;
            item.appendChild(video);
        } else if (news.media_type === 'youtube') {
            const iframe = document.createElement('iframe');
            iframe.src = convertYouTubeUrl(news.media_url);
            iframe.className = 'news-media';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            item.appendChild(iframe);
        } else {
            const img = document.createElement('img');
            img.src = news.media_url;
            img.className = 'news-media';
            item.appendChild(img);
        }
    }
    
    // Content
    const content = document.createElement('div');
    content.className = 'news-content';
    
    const title = document.createElement('h3');
    title.className = 'news-title';
    title.textContent = news.title;
    content.appendChild(title);
    
    const text = document.createElement('div');
    text.className = 'news-text';
    text.innerHTML = formatNewsContent(news.content);
    content.appendChild(text);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'news-footer';
    
    const date = document.createElement('div');
    date.style.fontSize = '13px';
    date.style.color = 'var(--text-secondary)';
    date.textContent = new Date(news.created_at).toLocaleDateString();
    footer.appendChild(date);
    
    // Contact icons
    if (news.contact_ids) {
        const contactsDiv = document.createElement('div');
        contactsDiv.className = 'news-contacts';
        // Load and display contact icons
        loadNewsContacts(news.contact_ids, contactsDiv);
        footer.appendChild(contactsDiv);
    }
    
    content.appendChild(footer);
    item.appendChild(content);
    
    return item;
}

function formatNewsContent(content) {
    if (!content) return '';
    
    // Replace image links with actual images
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/gi;
    content = content.replace(imageRegex, '<img src="$1" style="max-width: 100%; border-radius: 8px; margin: 8px 0;">');
    
    // Preserve line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

async function loadNewsContacts(contactIds, container) {
    if (!contactIds) return;
    
    const ids = JSON.parse(contactIds);
    
    for (let id of ids) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const contacts = await response.json();
            if (contacts && contacts.length > 0) {
                const contact = contacts[0];
                const icon = document.createElement('img');
                icon.src = contact.icon_url;
                icon.className = 'news-contact-icon';
                icon.onclick = () => window.open(contact.link_url, '_blank');
                container.appendChild(icon);
            }
        } catch (error) {
            console.error('Error loading contact:', error);
        }
    }
}

function convertYouTubeUrl(url) {
    // Convert YouTube URL to embed format
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

// ==================== LOAD CONTACTS ====================
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
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    
    contactsList.innerHTML = '';
    
    if (!contacts || contacts.length === 0) {
        contactsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No contacts available</p>';
        return;
    }
    
    contacts.forEach(contact => {
        const contactItem = createContactItem(contact);
        contactsList.appendChild(contactItem);
    });
}

function createContactItem(contact) {
    const item = document.createElement('div');
    item.className = 'contact-item';
    
    const icon = document.createElement('img');
    icon.src = contact.icon_url;
    icon.className = 'contact-icon';
    item.appendChild(icon);
    
    const info = document.createElement('div');
    info.className = 'contact-info';
    
    const name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = contact.name;
    info.appendChild(name);
    
    if (contact.description) {
        const desc = document.createElement('div');
        desc.className = 'contact-description';
        desc.textContent = contact.description;
        info.appendChild(desc);
    }
    
    if (contact.address) {
        const address = document.createElement('div');
        address.className = 'contact-address';
        address.textContent = contact.address;
        info.appendChild(address);
    }
    
    item.appendChild(info);
    
    if (contact.link_url) {
        const linkBtn = document.createElement('button');
        linkBtn.className = 'contact-link-btn';
        linkBtn.textContent = 'Contact';
        linkBtn.onclick = () => window.open(contact.link_url, '_blank');
        item.appendChild(linkBtn);
    }
    
    return item;
}

// ==================== GUIDELINES SECTION ====================
function createGuidelinesSection(guidelines) {
    const section = document.createElement('div');
    section.className = 'guidelines-section';
    section.style.cssText = 'padding: 20px; margin-top: 20px;';
    
    guidelines.forEach(guideline => {
        const guidelineBlock = document.createElement('div');
        guidelineBlock.style.cssText = 'background: var(--dark-surface); border-radius: 16px; padding: 24px; margin-bottom: 20px;';
        
        const title = document.createElement('h3');
        title.style.cssText = 'font-size: 20px; font-weight: 700; margin-bottom: 16px;';
        title.textContent = guideline.title;
        guidelineBlock.appendChild(title);
        
        if (guideline.icon_url) {
            const icon = document.createElement('img');
            icon.src = guideline.icon_url;
            icon.style.cssText = 'max-width: 100%; border-radius: 12px; margin-bottom: 16px;';
            guidelineBlock.appendChild(icon);
        }
        
        const content = document.createElement('div');
        content.style.cssText = 'line-height: 1.8; font-size: 15px;';
        content.innerHTML = formatNewsContent(guideline.content);
        guidelineBlock.appendChild(content);
        
        // Social links
        if (guideline.social_links) {
            const socialLinks = JSON.parse(guideline.social_links);
            const socialDiv = document.createElement('div');
            socialDiv.style.cssText = 'display: flex; gap: 12px; margin-top: 16px;';
            
            socialLinks.forEach(link => {
                const icon = document.createElement('img');
                icon.src = link.icon_url;
                icon.style.cssText = 'width: 40px; height: 40px; cursor: pointer; border-radius: 50%; transition: transform 0.2s;';
                icon.onclick = () => window.open(link.url, '_blank');
                icon.onmouseover = () => icon.style.transform = 'scale(1.1)';
                icon.onmouseout = () => icon.style.transform = 'scale(1)';
                socialDiv.appendChild(icon);
            });
            
            guidelineBlock.appendChild(socialDiv);
        }
        
        section.appendChild(guidelineBlock);
    });
    
    return section;
}

// ==================== YOUTUBE SECTION ====================
function createYouTubeSection(videos) {
    const section = document.createElement('div');
    section.className = 'youtube-section';
    section.style.cssText = 'padding: 20px; margin-top: 20px;';
    
    const title = document.createElement('h3');
    title.style.cssText = 'font-size: 20px; font-weight: 700; margin-bottom: 16px;';
    title.textContent = 'Video Tutorials';
    section.appendChild(title);
    
    videos.forEach(video => {
        const videoBlock = document.createElement('div');
        videoBlock.style.cssText = 'background: var(--dark-surface); border-radius: 16px; padding: 20px; margin-bottom: 16px;';
        
        const iframe = document.createElement('iframe');
        iframe.src = convertYouTubeUrl(video.video_url);
        iframe.style.cssText = 'width: 100%; height: 240px; border-radius: 12px; border: none;';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        videoBlock.appendChild(iframe);
        
        if (video.description) {
            const desc = document.createElement('p');
            desc.style.cssText = 'margin-top: 12px; font-size: 14px; color: var(--text-secondary);';
            desc.textContent = video.description;
            videoBlock.appendChild(desc);
        }
        
        section.appendChild(videoBlock);
    });
    
    return section;
}

// ==================== FEEDBACK SECTION ====================
function createFeedbackSection(feedbackList, cardId) {
    const section = document.createElement('div');
    section.className = 'feedback-section';
    section.style.cssText = 'padding: 20px; margin-top: 20px;';
    
    const title = document.createElement('h3');
    title.style.cssText = 'font-size: 20px; font-weight: 700; margin-bottom: 16px;';
    title.textContent = 'Customer Feedback';
    section.appendChild(title);
    
    // Rating statistics
    const stats = calculateRatingStats(feedbackList);
    const statsDiv = createRatingStats(stats);
    section.appendChild(statsDiv);
    
    // Feedback list
    if (feedbackList && feedbackList.length > 0) {
        feedbackList.forEach(feedback => {
            const feedbackItem = createFeedbackItem(feedback);
            section.appendChild(feedbackItem);
        });
    } else {
        const noFeedback = document.createElement('p');
        noFeedback.style.cssText = 'text-align: center; padding: 20px; color: var(--text-secondary);';
        noFeedback.textContent = 'No feedback yet. Be the first to leave a review!';
        section.appendChild(noFeedback);
    }
    
    return section;
}

function calculateRatingStats(feedbackList) {
    const stats = {
        total: feedbackList.length,
        average: 0,
        distribution: [0, 0, 0, 0, 0]
    };
    
    if (feedbackList.length === 0) return stats;
    
    let sum = 0;
    feedbackList.forEach(feedback => {
        sum += feedback.rating;
        stats.distribution[feedback.rating - 1]++;
    });
    
    stats.average = (sum / feedbackList.length).toFixed(1);
    
    return stats;
}

function createRatingStats(stats) {
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = 'background: var(--dark-surface); border-radius: 16px; padding: 20px; margin-bottom: 20px;';
    
    const averageDiv = document.createElement('div');
    averageDiv.style.cssText = 'text-align: center; margin-bottom: 20px;';
    averageDiv.innerHTML = `
        <div style="font-size: 48px; font-weight: 700; color: var(--primary-color);">${stats.average}</div>
        <div style="font-size: 24px; color: #fbbf24;">${'⭐'.repeat(Math.round(stats.average))}</div>
        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">${stats.total} reviews</div>
    `;
    statsDiv.appendChild(averageDiv);
    
    // Distribution bars
    for (let i = 4; i >= 0; i--) {
        const barDiv = document.createElement('div');
        barDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;';
        
        const label = document.createElement('span');
        label.style.cssText = 'font-size: 14px; width: 60px;';
        label.textContent = `${i + 1} ⭐`;
        barDiv.appendChild(label);
        
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'flex: 1; height: 8px; background: var(--dark-elevated); border-radius: 4px; overflow: hidden;';
        
        const barFill = document.createElement('div');
        const percentage = stats.total > 0 ? (stats.distribution[i] / stats.total) * 100 : 0;
        barFill.style.cssText = `width: ${percentage}%; height: 100%; background: var(--primary-color); transition: width 0.3s;`;
        barContainer.appendChild(barFill);
        barDiv.appendChild(barContainer);
        
        const count = document.createElement('span');
        count.style.cssText = 'font-size: 14px; width: 40px; text-align: right;';
        count.textContent = stats.distribution[i];
        barDiv.appendChild(count);
        
        statsDiv.appendChild(barDiv);
    }
    
    return statsDiv;
}

function createFeedbackItem(feedback) {
    const item = document.createElement('div');
    item.style.cssText = 'background: var(--dark-surface); border-radius: 12px; padding: 16px; margin-bottom: 12px;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;';
    
    const avatar = document.createElement('img');
    avatar.src = feedback.users?.profile_picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
    avatar.style.cssText = 'width: 40px; height: 40px; border-radius: 50%;';
    header.appendChild(avatar);
    
    const userInfo = document.createElement('div');
    userInfo.style.flex = '1';
    
    const username = document.createElement('div');
    username.style.cssText = 'font-weight: 600; font-size: 15px;';
    username.textContent = feedback.users?.username || 'Anonymous';
    userInfo.appendChild(username);
    
    const stars = document.createElement('div');
    stars.style.cssText = 'color: #fbbf24; font-size: 14px;';
    stars.textContent = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
    userInfo.appendChild(stars);
    
    header.appendChild(userInfo);
    item.appendChild(header);
    
    const message = document.createElement('div');
    message.style.cssText = 'font-size: 14px; line-height: 1.6; color: var(--text-secondary);';
    message.textContent = feedback.message;
    item.appendChild(message);
    
    const date = document.createElement('div');
    date.style.cssText = 'font-size: 12px; color: var(--text-secondary); margin-top: 8px;';
    date.textContent = new Date(feedback.created_at).toLocaleDateString();
    item.appendChild(date);
    
    return item;
}

// ==================== NOTIFICATIONS ====================
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${currentUser.id}&select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        notifications = await response.json();
        updateNotificationBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notifCount');
    if (!badge) return;
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;
    
    if (panel.classList.contains('show')) {
        panel.classList.remove('show');
    } else {
        panel.classList.add('show');
        renderNotifications();
    }
}

function closeNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No notifications</p>';
        return;
    }
    
    notifications.forEach(notif => {
        const item = createNotificationItem(notif);
        list.appendChild(item);
    });
}

function createNotificationItem(notif) {
    const item = document.createElement('div');
    item.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background 0.2s;
        ${!notif.is_read ? 'background: rgba(99, 102, 241, 0.1);' : ''}
    `;
    item.onmouseover = () => item.style.background = 'var(--dark-elevated)';
    item.onmouseout = () => item.style.background = !notif.is_read ? 'rgba(99, 102, 241, 0.1)' : 'transparent';
    item.onclick = () => handleNotificationClick(notif);
    
    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; font-size: 15px; margin-bottom: 4px;';
    title.textContent = notif.title;
    item.appendChild(title);
    
    const message = document.createElement('div');
    message.style.cssText = 'font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;';
    message.textContent = notif.message;
    item.appendChild(message);
    
    const date = document.createElement('div');
    date.style.cssText = 'font-size: 12px; color: var(--text-secondary);';
    date.textContent = new Date(notif.created_at).toLocaleString();
    item.appendChild(date);
    
    return item;
}

async function handleNotificationClick(notif) {
    // Mark as read
    if (!notif.is_read) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_read: true })
            });
            
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    
    // Handle notification action
    if (notif.action_url) {
        window.open(notif.action_url, '_blank');
    }
    
    closeNotifications();
}

// ==================== MUSIC PLAYER ====================
function initializeMusicPlayer() {
    musicPlayer = document.getElementById('backgroundMusicPlayer');
    loadMusicPlaylist();
}

async function loadMusicPlaylist() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_playlist?select=*&order=created_at.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        musicPlaylist = await response.json();
        
        if (musicPlaylist && musicPlaylist.length > 0) {
            playMusic(0);
            
            // Auto play next
            musicPlayer.addEventListener('ended', () => {
                currentMusicIndex = (currentMusicIndex + 1) % musicPlaylist.length;
                playMusic(currentMusicIndex);
            });
        }
        
    } catch (error) {
        console.error('Error loading music playlist:', error);
    }
}

function playMusic(index) {
    if (!musicPlayer || !musicPlaylist || musicPlaylist.length === 0) return;
    
    const musicEnabled = document.getElementById('backgroundMusic')?.checked;
    if (!musicEnabled) return;
    
    const track = musicPlaylist[index];
    if (track && track.file_url) {
        musicPlayer.src = track.file_url;
        const volume = document.getElementById('musicVolume')?.value || 50;
        musicPlayer.volume = volume / 100;
        musicPlayer.play().catch(e => console.error('Music play error:', e));
    }
}

// Music controls
document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('backgroundMusic');
    const volumeControl = document.getElementById('musicVolume');
    
    if (musicToggle) {
        musicToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                playMusic(currentMusicIndex);
            } else {
                if (musicPlayer) musicPlayer.pause();
            }
        });
    }
    
    if (volumeControl) {
        volumeControl.addEventListener('input', (e) => {
            if (musicPlayer) {
                musicPlayer.volume = e.target.value / 100;
            }
        });
    }
});

// ==================== DOWNLOAD WEBAPP ====================
async function downloadWebApp() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/website_settings?select=webapp_url`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const settings = await response.json();
        
        if (settings && settings.length > 0 && settings[0].webapp_url) {
            const a = document.createElement('a');
            a.href = settings[0].webapp_url;
            a.download = 'app.apk';
            a.click();
            showNotification('Download started', 'success');
        } else {
            showNotification('WebApp not available', 'error');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed', 'error');
    }
}

// ==================== PREVENT AUTO REFRESH ====================
function preventAutoRefresh() {
    let isUploading = false;
    
    document.addEventListener('click', (e) => {
        if (e.target.type === 'file') {
            isUploading = true;
        }
    });
    
    document.addEventListener('change', (e) => {
        if (e.target.type === 'file') {
            setTimeout(() => {
                isUploading = false;
            }, 1000);
        }
    });
    
    window.addEventListener('beforeunload', (e) => {
        if (isUploading) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// ==================== COUPON VALIDATION (Add to index.js Part 3) ====================
// Add before handleBuyNow function

async function applyCoupon(productId, totalPrice) {
    const couponCode = prompt('Enter coupon code (optional):');
    
    if (!couponCode) return totalPrice;
    
    try {
        showLoading();
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${couponCode.toUpperCase()}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const coupons = await response.json();
        
        if (coupons.length === 0) {
            showNotification('Invalid coupon code', 'error');
            hideLoading();
            return totalPrice;
        }
        
        const coupon = coupons[0];
        
        // Check if coupon is expired (7 days from creation)
        const createdDate = new Date(coupon.created_at);
        const expiryDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        
        if (now > expiryDate) {
            showNotification('Coupon has expired', 'error');
            hideLoading();
            return totalPrice;
        }
        
        // Check if user is in target list
        const targetUsers = JSON.parse(coupon.target_users);
        if (!targetUsers.includes('all') && !targetUsers.includes(currentUser.id.toString())) {
            showNotification('This coupon is not available for your account', 'error');
            hideLoading();
            return totalPrice;
        }
        
        // Check if product-specific
        if (coupon.product_id && coupon.product_id != productId) {
            showNotification('This coupon cannot be used for this product', 'error');
            hideLoading();
            return totalPrice;
        }
        
        // Check if already used by this user
        const usageCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupon_usage?coupon_id=eq.${coupon.id}&user_id=eq.${currentUser.id}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const usage = await usageCheck.json();
        
        if (usage.length > 0) {
            showNotification('You have already used this coupon', 'error');
            hideLoading();
            return totalPrice;
        }
        
        // Apply discount
        const discount = Math.floor(totalPrice * coupon.discount_percentage / 100);
        const finalPrice = totalPrice - discount;
        
        // Record coupon usage
        await fetch(`${SUPABASE_URL}/rest/v1/coupon_usage`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coupon_id: coupon.id,
                user_id: currentUser.id,
                used_at: new Date().toISOString()
            })
        });
        
        // Update coupon used count
        await fetch(`${SUPABASE_URL}/rest/v1/coupons?id=eq.${coupon.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                used_count: (coupon.used_count || 0) + 1
            })
        });
        
        showNotification(`Coupon applied! ${coupon.discount_percentage}% discount`, 'success');
        hideLoading();
        
        // Store applied coupon for order submission
        sessionStorage.setItem('appliedCoupon', JSON.stringify({
            code: coupon.code,
            discount: discount
        }));
        
        return finalPrice;
        
    } catch (error) {
        console.error('Coupon error:', error);
        hideLoading();
        return totalPrice;
    }
}

// Update handleBuyNow to include coupon option
// Modify the existing handleBuyNow function to call applyCoupon before showing payment modal
