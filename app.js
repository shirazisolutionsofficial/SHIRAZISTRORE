const CLOUDFLARE_API_URL = "https://shirazistore.shirazi-solutions.workers.dev"; 

let allProducts = [];
let cart = [];
let orders = [];
let notifs = [];
let currentCategory = "All";
let currentEditingSpecs = [];

let sysConfig = {
    id: 'SYSTEM_CONFIG',
    name: 'System',
    price: 0,
    cat: 'System',
    siteName: 'SHIRAZI',
    siteSubName: 'STORE',
    logoColorHex: '#ea580c',
    sublogoColorHex: '#0f172a',
    heroBadge: 'Exclusive Collections',
    heroTitle: 'Timeless Elegance',
    heroDesc: 'Discover premium quality items, tailored for perfection and modern lifestyle.',
    offerBadge: 'Summer Vault Deal',
    offerTitle: 'The Royal Emerald Collection', 
    offerDesc: 'FLAT 40% OFF! Experience the allure of meticulously handcrafted emeralds.',
    contactPhone: '+92 300 1234567',
    contactEmail: 'support@shirazi.com',
    contactAddress: 'Faisalabad, Pakistan',
    socialFacebook: '',
    socialInstagram: '',
    socialWhatsapp: '', // Default empty so it doesn't show
    socialTiktok: '',
    socialYoutube: '',
    discountPercent: 0,
    jazzcash: '',
    easypaisa: '',
    bankName: '',
    bankAcc: '',
    allCategories: ['Rings', 'Necklaces & Pendants', 'Bracelets', 'Ear-Rings', 'Watches'],
    customSocials: []
};

try {
    const savedConfig = localStorage.getItem('luxe_sysConfig');
    if (savedConfig) { 
        let parsed = JSON.parse(savedConfig); 
        sysConfig = { ...sysConfig, ...parsed }; 
    }
} catch(e) {}

function initApp() {
    applySystemConfigToUI(); 
    loadCloudflareData().then(hideLoader).catch(hideLoader);
    reveal(); 
    window.addEventListener('scroll', reveal); 
    setTimeout(hideLoader, 2500); 
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }

function hideLoader() {
    const loader = document.getElementById('loader-wrapper');
    if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 300); }
}

function getSecureHeaders() { 
    return { 'Content-Type': 'application/json', 'X-Admin-Token': sessionStorage.getItem('admin_session_token') || '' }; 
}

function compressImage(dataUrl) { 
    return new Promise((resolve) => { 
        const img = new Image(); 
        img.onload = () => { 
            const canvas = document.createElement('canvas'); 
            const MAX_WIDTH = 500; let width = img.width, height = img.height; 
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } 
            canvas.width = width; canvas.height = height; 
            canvas.getContext('2d').drawImage(img, 0, 0, width, height); 
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
        }; 
        img.src = dataUrl; 
    }); 
}

async function loadCloudflareData() {
    try {
        const prodRes = await fetch(`${CLOUDFLARE_API_URL}/products`, { cache: "no-store" });
        if (prodRes.ok) { 
            let fetchedProducts = await prodRes.json(); 
            const dbConfig = fetchedProducts.find(p => p.id === 'SYSTEM_CONFIG');
            if (dbConfig) { 
                sysConfig = { ...sysConfig, ...dbConfig }; 
                localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig));
            }
            allProducts = fetchedProducts.filter(p => p.id !== 'SYSTEM_CONFIG');
            applySystemConfigToUI();
            updateCategoriesUI();
            applyFilters(); 
            updateSpecsDropdown(); 
            renderAdminProducts(); 
            updateInvoiceDashboard();
            renderAdminCustomSocials();
        }
        if (sessionStorage.getItem('admin_session_token')) { loadCloudflareOrdersSecure(); }
    } catch(err) {}
}

async function loadCloudflareOrdersSecure() {
    try {
        const orderRes = await fetch(`${CLOUDFLARE_API_URL}/orders`, { cache: "no-store", headers: getSecureHeaders() });
        if (orderRes.ok) { orders = (await orderRes.json()).reverse(); updateDetailsView(); updateReceiptsView(); }
    } catch(err) {}
}

// FORMATTER FOR USERNAME OR URL
function formatSocialLink(platform, input) {
    if (!input || input.trim() === '') return '';
    let val = input.trim();
    
    // If it's already a full URL
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    if (val.startsWith('www.')) return 'https://' + val;

    // It's a username, let's construct the URL
    if (val.startsWith('@')) val = val.substring(1);

    switch(platform.toLowerCase()) {
        case 'facebook': return `https://facebook.com/${val}`;
        case 'instagram': return `https://instagram.com/${val}`;
        case 'tiktok': return `https://tiktok.com/@${val}`;
        case 'youtube': return `https://youtube.com/@${val}`;
        case 'whatsapp': 
            let clean = val.replace(/[^0-9]/g, '');
            return 'https://wa.me/' + (clean.startsWith('0') ? '92' + clean.substring(1) : clean);
        default:
            // Custom fallback
            return `https://${platform.toLowerCase()}.com/${val}`; 
    }
}

function applySystemConfigToUI() {
    document.querySelectorAll('.dynamic-sitename').forEach(el => el.innerHTML = sysConfig.siteName || 'SHIRAZI');
    document.querySelectorAll('.dynamic-sitesubname').forEach(el => el.innerHTML = sysConfig.siteSubName || 'STORE');
    
    document.querySelectorAll('nav .corevia-logo-text').forEach(el => el.style.color = sysConfig.logoColorHex || '#ea580c');
    document.querySelectorAll('nav .corevia-sublogo').forEach(el => el.style.color = sysConfig.sublogoColorHex || '#0f172a');

    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val || ''; };

    setTxt('hero-badge-disp', sysConfig.heroBadge);
    setTxt('hero-title-disp', sysConfig.heroTitle);
    setTxt('hero-desc-disp', sysConfig.heroDesc);
    setTxt('offer-badge', sysConfig.offerBadge); 
    setTxt('offer-title', sysConfig.offerTitle); 
    setTxt('offer-desc', sysConfig.offerDesc);
    setTxt('contact-phone-disp', sysConfig.contactPhone); 
    setTxt('contact-email-disp', sysConfig.contactEmail); 
    setTxt('contact-address-disp', sysConfig.contactAddress);

    setVal('conf-site-name', sysConfig.siteName); 
    setVal('conf-site-subname', sysConfig.siteSubName); 
    setVal('conf-logo-color', sysConfig.logoColorHex); 
    setVal('conf-sublogo-color', sysConfig.sublogoColorHex); 
    setVal('conf-hero-badge', sysConfig.heroBadge); 
    setVal('conf-hero-title', sysConfig.heroTitle); 
    setVal('conf-hero-desc', sysConfig.heroDesc); 
    setVal('conf-offer-badge', sysConfig.offerBadge); 
    setVal('conf-offer-title', sysConfig.offerTitle); 
    setVal('conf-offer-desc', sysConfig.offerDesc);
    setVal('conf-contact-phone', sysConfig.contactPhone); 
    setVal('conf-contact-email', sysConfig.contactEmail); 
    setVal('conf-contact-address', sysConfig.contactAddress);
    setVal('conf-discount', sysConfig.discountPercent);
    setVal('pay-jazzcash', sysConfig.jazzcash); 
    setVal('pay-easypaisa', sysConfig.easypaisa); 
    setVal('pay-bank-name', sysConfig.bankName); 
    setVal('pay-bank-acc', sysConfig.bankAcc);
    
    // Admin Inputs
    setVal('conf-social-fb', sysConfig.socialFacebook); 
    setVal('conf-social-ig', sysConfig.socialInstagram); 
    setVal('conf-social-wa', sysConfig.socialWhatsapp); 
    setVal('conf-social-tt', sysConfig.socialTiktok); 
    setVal('conf-social-yt', sysConfig.socialYoutube);

    // DYNAMIC FOOTER SOCIAL LINKS
    const footerSocials = document.getElementById('footer-social-links');
    if (footerSocials) {
        let html = '';
        const createIcon = (iconClass, url, hoverColor) => {
            if (url && url.trim() !== '') {
                html += `<a href="${url}" target="_blank" class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white ${hoverColor} transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1"><i class="${iconClass}"></i></a>`;
            }
        };

        createIcon('fa-brands fa-facebook-f', formatSocialLink('facebook', sysConfig.socialFacebook), 'hover:bg-blue-600');
        createIcon('fa-brands fa-instagram', formatSocialLink('instagram', sysConfig.socialInstagram), 'hover:bg-pink-600');
        createIcon('fa-brands fa-whatsapp', formatSocialLink('whatsapp', sysConfig.socialWhatsapp), 'hover:bg-green-500');
        createIcon('fa-brands fa-tiktok', formatSocialLink('tiktok', sysConfig.socialTiktok), 'hover:bg-slate-900');
        createIcon('fa-brands fa-youtube', formatSocialLink('youtube', sysConfig.socialYoutube), 'hover:bg-red-600');

        if(sysConfig.customSocials) {
            sysConfig.customSocials.forEach(cs => {
                let lowerName = cs.name.toLowerCase();
                let iconClass = `fa-brands fa-${lowerName}`;
                if (['website', 'web', 'link'].includes(lowerName)) iconClass = 'fa-solid fa-link';
                createIcon(iconClass, formatSocialLink(cs.name, cs.url), 'hover:bg-orange-500');
            });
        }
        footerSocials.innerHTML = html;
    }

    const paySelect = document.getElementById('pay-method');
    if (paySelect) {
        let options = `<option value="" selected disabled>Select Payment Method</option><option value="Cash on Delivery">Cash on Delivery</option>`;
        if(sysConfig.jazzcash) options += `<option value="JazzCash">JazzCash</option>`;
        if(sysConfig.easypaisa) options += `<option value="Easypaisa">Easypaisa</option>`;
        if(sysConfig.bankName && sysConfig.bankAcc) options += `<option value="Bank">Bank Account</option>`;
        paySelect.innerHTML = options;
    }
}

// ----------------- DYNAMIC SOCIAL LINKS ADMIN LOGIC -----------------
window.addCustomSocial = async function(e) {
    e.preventDefault();
    const name = document.getElementById('new-social-name').value.trim();
    const url = document.getElementById('new-social-url').value.trim();
    if(!name || !url) return;
    
    if(!sysConfig.customSocials) sysConfig.customSocials = [];
    sysConfig.customSocials.push({ id: Date.now(), name, url });
    
    const btn = e.target.querySelector('button');
    const ogTxt = btn.innerText;
    btn.innerText = "Adding..."; btn.disabled = true;
    try {
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) });
        localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig));
        applySystemConfigToUI();
        renderAdminCustomSocials();
        e.target.reset();
        alert(`Successfully added ${name} to Footer!`);
    } catch(err) { alert("Error adding link"); }
    finally { btn.innerText = ogTxt; btn.disabled = false; }
}

window.deleteCustomSocial = async function(id) {
    if(!confirm("Remove this social link from footer?")) return;
    sysConfig.customSocials = sysConfig.customSocials.filter(s => s.id !== id);
    try {
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) });
        localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig));
        applySystemConfigToUI();
        renderAdminCustomSocials();
    } catch(err) {}
}

window.renderAdminCustomSocials = function() {
    const list = document.getElementById('admin-custom-socials-list');
    if(!list) return;
    if(!sysConfig.customSocials || sysConfig.customSocials.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = sysConfig.customSocials.map(s => `
        <div class="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
            <div>
                <p class="text-xs font-black text-slate-800 capitalize"><i class="fa-brands fa-${s.name.toLowerCase()} text-orange-500 mr-2"></i> ${s.name}</p>
                <p class="text-[10px] text-slate-500 truncate max-w-[200px] mt-1">${s.url}</p>
            </div>
            <button type="button" onclick="deleteCustomSocial(${s.id})" class="w-8 h-8 flex justify-center items-center rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i class="fa-solid fa-trash text-xs"></i></button>
        </div>
    `).join('');
}

window.saveSystemConfig = async function(e, section) {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
    
    if (section === 'profile') { 
        sysConfig.siteName = document.getElementById('conf-site-name').value;
        sysConfig.siteSubName = document.getElementById('conf-site-subname').value; 
        sysConfig.logoColorHex = document.getElementById('conf-logo-color').value; 
        sysConfig.sublogoColorHex = document.getElementById('conf-sublogo-color').value; 
    }
    else if (section === 'home') {
        sysConfig.heroBadge = document.getElementById('conf-hero-badge').value;
        sysConfig.heroTitle = document.getElementById('conf-hero-title').value;
        sysConfig.heroDesc = document.getElementById('conf-hero-desc').value;
    }
    else if (section === 'pricing') { sysConfig.discountPercent = Number(document.getElementById('conf-discount').value) || 0; }
    else if (section === 'contact') { sysConfig.contactPhone = document.getElementById('conf-contact-phone').value; sysConfig.contactEmail = document.getElementById('conf-contact-email').value; sysConfig.contactAddress = document.getElementById('conf-contact-address').value; }
    else if (section === 'payment') { sysConfig.jazzcash = document.getElementById('pay-jazzcash').value; sysConfig.easypaisa = document.getElementById('pay-easypaisa').value; sysConfig.bankName = document.getElementById('pay-bank-name').value; sysConfig.bankAcc = document.getElementById('pay-bank-acc').value; }
    else if (section === 'offer') { sysConfig.offerBadge = document.getElementById('conf-offer-badge').value; sysConfig.offerTitle = document.getElementById('conf-offer-title').value; sysConfig.offerDesc = document.getElementById('conf-offer-desc').value; }
    else if (section === 'social') {
        sysConfig.socialFacebook = document.getElementById('conf-social-fb').value;
        sysConfig.socialInstagram = document.getElementById('conf-social-ig').value;
        sysConfig.socialWhatsapp = document.getElementById('conf-social-wa').value;
        sysConfig.socialTiktok = document.getElementById('conf-social-tt').value;
        sysConfig.socialYoutube = document.getElementById('conf-social-yt').value;
    }
    
    try { 
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) }); 
        localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); applySystemConfigToUI(); alert("Saved Successfully! ✅"); 
    } catch(err) {} finally { btn.disabled = false; }
}

window.updateSpecsDropdown = function() {
    const select = document.getElementById('spec-p-id');
    if(!select) return;
    let options = `<option value="" disabled selected>Select Product</option>`;
    allProducts.forEach(p => {
        options += `<option value="${p.id}">${p.name}</option>`;
    });
    select.innerHTML = options;
}

window.loadSpecDataIntoForm = function() {
    const id = document.getElementById('spec-p-id').value; const p = allProducts.find(x => String(x.id) === String(id));
    if(!p) return; document.getElementById('spec-p-desc').value = p.desc || ""; document.getElementById('spec-p-old-price').value = p.oldPrice || "";
    currentEditingSpecs = p.specs || []; renderSpecsList();
}
window.addSpecToList = function() {
    const input = document.getElementById('new-spec-input'); const val = input.value.trim();
    if(val) { currentEditingSpecs.push(val); input.value = ''; renderSpecsList(); }
}
window.removeSpecFromList = function(index) { currentEditingSpecs.splice(index, 1); renderSpecsList(); }
function renderSpecsList() {
    const container = document.getElementById('dynamic-specs-container');
    if(currentEditingSpecs.length === 0) { container.innerHTML = `<p class="text-[10px] font-bold text-slate-400 italic">No features added yet.</p>`; return; }
    container.innerHTML = currentEditingSpecs.map((s, i) => `
        <div class="flex justify-between items-center bg-white border border-indigo-100 p-2.5 rounded-xl shadow-sm text-xs font-bold text-slate-700">
            <span><i class="fa-solid fa-check text-green-500 mr-2"></i> ${s}</span>
            <button type="button" onclick="removeSpecFromList(${i})" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}
window.saveProductSpecs = async function(e) {
    e.preventDefault(); const id = document.getElementById('spec-p-id').value; let p = allProducts.find(x => String(x.id) === String(id)); if(!p) return;
    p.desc = document.getElementById('spec-p-desc').value; p.oldPrice = parseInt(document.getElementById('spec-p-old-price').value) || 0; p.specs = [...currentEditingSpecs];
    try {
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(p) });
        await loadCloudflareData(); alert("Specifications Updated! ✅"); document.getElementById('specs-form').reset(); currentEditingSpecs = []; renderSpecsList();
    } catch(err) {}
}

window.addCustomCategory = async function(e) {
    if(e) e.preventDefault();
    const input = document.getElementById('custom-cat-input'); const newCat = input.value.trim();
    if(!newCat) return alert("Enter category name!");
    if(!sysConfig.allCategories) sysConfig.allCategories = [];
    if(sysConfig.allCategories.includes(newCat)) return alert("Category already exists!");
    const btn = document.getElementById('add-cat-btn'); const ogText = btn.innerHTML; btn.innerHTML = '...'; btn.disabled = true;
    sysConfig.allCategories.push(newCat);
    try { await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) }); localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); input.value = ''; updateCategoriesUI(); alert(`Category "${newCat}" added successfully!`); } catch(err) { alert("Error adding category."); } finally { btn.innerHTML = ogText; btn.disabled = false; }
}
window.deleteSelectedCategory = async function() {
    const sel = document.getElementById('delete-cat-select'); const catToRemove = sel.value;
    if(!catToRemove) return alert("No category selected!");
    if(!confirm(`Are you sure you want to permanently delete the category "${catToRemove}"?`)) return;
    sysConfig.allCategories = (sysConfig.allCategories || []).filter(c => c !== catToRemove);
    try { await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) }); localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); updateCategoriesUI(); alert("Category Deleted Successfully!"); } catch(err) { alert("Error deleting category."); }
}
window.updateCategoriesUI = function() {
    let cats = sysConfig.allCategories || [];
    const navContainer = document.getElementById('dynamic-nav-categories');
    if (navContainer) {
        let navHTML = '';
        cats.forEach(c => navHTML += `<a href="#" onclick="filterByCategory('${c}')" class="block px-6 py-3 hover:bg-slate-50 hover:text-orange-600 transition-colors">${c}</a>`);
        navHTML += `<div class="border-t border-slate-100 my-1"></div><a href="#" onclick="filterByCategory('All')" class="block px-6 py-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">View All Products</a>`;
        navContainer.innerHTML = navHTML;
    }
    const adminSelect = document.getElementById('new-p-cat');
    if (adminSelect) {
        adminSelect.removeAttribute('required'); 
        let adminHTML = `<option value="">No Category (Optional)</option>`;
        cats.forEach(c => adminHTML += `<option value="${c}">${c}</option>`);
        adminSelect.innerHTML = adminHTML;
    }
    const delSelect = document.getElementById('delete-cat-select');
    if (delSelect) {
        let delHTML = `<option value="" disabled selected>Select Category to Delete</option>`;
        cats.forEach(c => delHTML += `<option value="${c}">${c}</option>`);
        delSelect.innerHTML = delHTML;
    }
};

window.renderProducts = function(data) {
    const grid = document.getElementById('product-grid'); if(!grid) return;
    if(!data || data.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-slate-500 font-bold">No items found.</p></div>`; return; }
    grid.innerHTML = data.map(p => {
        let priceHtml = `<span class="text-slate-900 font-black text-sm md:text-base">Rs. ${p.price.toLocaleString()}</span>`;
        let saleBadge = '';
        if (p.oldPrice && p.oldPrice > p.price) {
            priceHtml = `<div class="flex items-center gap-2"><span class="text-slate-900 font-black text-sm md:text-base">Rs. ${p.price.toLocaleString()}</span><span class="text-[10px] font-bold text-slate-400 line-through">Rs. ${p.oldPrice.toLocaleString()}</span></div>`;
            saleBadge = `<div class="absolute top-2 right-2 bg-rose-500 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-widest">SALE</div>`;
        }
        return `<div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"><div class="overflow-hidden rounded-xl mb-3 h-36 sm:h-44 md:h-48 bg-slate-50 relative cursor-pointer" onclick="openProductDetails('${p.id}')"><img src="${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"><div class="absolute top-2 left-2 bg-white/95 text-[8px] md:text-[9px] font-black text-slate-800 px-2 py-0.5 rounded-full shadow-sm">${p.cat}</div>${saleBadge}</div><div class="flex flex-col gap-0.5 mb-3 px-1 cursor-pointer" onclick="openProductDetails('${p.id}')"><h3 class="font-bold text-xs md:text-sm text-slate-800 line-clamp-1 hover:text-orange-600 transition-colors">${p.name}</h3>${priceHtml}</div><button onclick="flyToCart(event, '${p.id}')" class="w-full bg-slate-900 text-white text-[10px] md:text-xs py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors">ADD TO BAG</button></div>`
    }).join('');
}

window.openProductDetails = function(id) {
    const p = allProducts.find(x => String(x.id) === String(id)); if (!p) return;
    document.getElementById('specs-main-img').src = p.img;
    document.getElementById('specs-title').innerText = p.name;
    document.getElementById('specs-price').innerText = `Rs. ${p.price.toLocaleString()}`;
    const oldPriceEl = document.getElementById('specs-old-price'); const badgeEl = document.getElementById('specs-sale-badge');
    if(p.oldPrice && p.oldPrice > p.price) { oldPriceEl.innerText = `Rs. ${p.oldPrice.toLocaleString()}`; oldPriceEl.classList.remove('hidden'); badgeEl.classList.remove('hidden'); } else { oldPriceEl.classList.add('hidden'); badgeEl.classList.add('hidden'); }
    document.getElementById('specs-desc').innerText = p.desc || "Premium quality items crafted to perfection. Experience the allure and elegance of timeless design.";
    const specsList = document.getElementById('specs-features-list');
    specsList.innerHTML = p.specs && p.specs.length > 0 ? p.specs.map(s => `<p class="text-xs md:text-sm text-slate-700 font-bold"><i class="fa-solid fa-check text-green-500 mr-2"></i> ${s}</p>`).join('') : '';
    document.getElementById('specs-add-cart-btn').onclick = function(e) { flyToCart(e, p.id); closeModal('product-specs-modal'); };
    openModal('product-specs-modal');
}

window.applyFilters = function() { 
    let searchVal = document.getElementById('hero-search') ? document.getElementById('hero-search').value.toLowerCase() : ""; 
    let minPrice = parseFloat(document.getElementById('filter-min-price').value) || 0;
    let maxPrice = parseFloat(document.getElementById('filter-max-price').value) || Infinity;
    let sortLogic = document.getElementById('sort-logic').value;
    let filtered = [...allProducts]; 
    if (currentCategory !== "All") filtered = filtered.filter(p => p.cat === currentCategory); 
    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal)); 
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
    if (sortLogic === 'low') filtered.sort((a, b) => a.price - b.price);
    if (sortLogic === 'high') filtered.sort((a, b) => b.price - a.price);
    renderProducts(filtered); 
}

window.filterByCategory = function(cat) { currentCategory = cat; document.getElementById('current-category-label').innerText = cat === "All" ? "Showing All Products" : `Category: ${cat}`; if(document.getElementById('hero-search')) document.getElementById('hero-search').value = ""; applyFilters(); document.getElementById('products').scrollIntoView(); }
window.filterItemsFromHero = function() { currentCategory = "All"; document.getElementById('current-category-label').innerText = "Search Results"; applyFilters(); }
window.reveal = function() { document.querySelectorAll(".reveal").forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add("active"); }); }

window.flyToCart = function(e, id) { 
    const p = allProducts.find(x => String(x.id) === String(id)); 
    if(p) { cart.push({...p, cartId: Date.now()}); document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = cart.length); pushNotif(`Added ${p.name} to bag`); } 
}
window.openCart = function() { if(cart.length) { updateCartUI(); openModal('cart-modal'); } else { alert("Your bag is empty!"); } }

window.updateCartUI = function() {
    let sub = 0; 
    document.getElementById('cart-items').innerHTML = cart.map(i => { 
        sub += i.price; 
        return `<div class="flex justify-between bg-slate-50 p-2 md:p-3 rounded-xl items-center gap-2"><div class="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0"><img src="${i.img}" class="w-full h-full object-cover"></div><div class="flex-1 min-w-0"><p class="font-bold text-[10px] md:text-xs text-slate-800 line-clamp-1">${i.name}</p><p class="text-orange-600 text-[10px] md:text-xs font-black">Rs. ${i.price.toLocaleString()}</p></div><button onclick="removeCart(${i.cartId})" class="text-slate-400 hover:text-red-500 text-sm p-1.5"><i class="fa-solid fa-trash-can"></i></button></div>`; 
    }).join('');
    
    let discountPercent = Number(sysConfig.discountPercent) || 0; let discountAmount = Math.round(sub * (discountPercent / 100)); let finalTotal = sub - discountAmount;
    document.getElementById('sub-total').innerText = "Rs. " + sub.toLocaleString();
    if (discountPercent > 0) { document.getElementById('discount-row').classList.remove('hidden'); document.getElementById('discount-row').classList.add('flex'); document.getElementById('discount-percent-badge').innerText = discountPercent; document.getElementById('discount-val').innerText = "- Rs. " + discountAmount.toLocaleString(); } else { document.getElementById('discount-row').classList.add('hidden'); document.getElementById('discount-row').classList.remove('flex'); }
    document.getElementById('total-val').innerText = "Rs. " + finalTotal.toLocaleString();
    window.currentCheckoutMeta = { subtotal: sub, discountAmount, finalTotal };
}

window.removeCart = function(cid) { cart = cart.filter(i => i.cartId !== cid); updateCartUI(); document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = cart.length); if(!cart.length) closeModal('cart-modal'); }

window.togglePaymentProof = function() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const methodId = document.getElementById('pay-method').value; 
    
    if(methodId && (!name || !phone)) {
        alert("Please enter your Full Name and Phone Number before selecting a payment method.");
        document.getElementById('pay-method').value = "";
        return;
    }

    const instructionsOverlay = document.getElementById('payment-instructions-overlay');
    const nameDisplay = document.getElementById('pay-method-name-display'); 
    const numDisplay = document.getElementById('pay-number-display');
    const appNameDisp = document.getElementById('pay-app-name');
    const uploadBox = document.getElementById('payment-upload-box');
    
    if(!methodId || methodId === "Cash on Delivery") { 
        instructionsOverlay.classList.add('hidden'); instructionsOverlay.classList.remove('flex');
        uploadBox.classList.add('hidden'); uploadBox.classList.remove('flex');
        return; 
    } 

    if(methodId === 'JazzCash') { nameDisplay.innerText = "JazzCash"; numDisplay.innerText = sysConfig.jazzcash; appNameDisp.innerText = "JazzCash"; }
    else if(methodId === 'Easypaisa') { nameDisplay.innerText = "Easypaisa"; numDisplay.innerText = sysConfig.easypaisa; appNameDisp.innerText = "Easypaisa"; }
    else if(methodId === 'Bank') { nameDisplay.innerText = sysConfig.bankName; numDisplay.innerText = sysConfig.bankAcc; appNameDisp.innerText = sysConfig.bankName || "Bank"; }

    instructionsOverlay.classList.remove('hidden'); instructionsOverlay.classList.add('flex');
    uploadBox.classList.add('hidden'); uploadBox.classList.remove('flex');
}

window.cancelPaymentSelection = function() {
    document.getElementById('pay-method').value = "";
    document.getElementById('payment-instructions-overlay').classList.add('hidden');
    document.getElementById('payment-instructions-overlay').classList.remove('flex');
    document.getElementById('payment-upload-box').classList.add('hidden');
    document.getElementById('payment-upload-box').classList.remove('flex');
}

window.proceedToUpload = function() {
    document.getElementById('payment-instructions-overlay').classList.add('hidden');
    document.getElementById('payment-instructions-overlay').classList.remove('flex');
    document.getElementById('payment-upload-box').classList.remove('hidden');
    document.getElementById('payment-upload-box').classList.add('flex');
}

window.showPaymentInstructions = function() {
    document.getElementById('payment-instructions-overlay').classList.remove('hidden');
    document.getElementById('payment-instructions-overlay').classList.add('flex');
}

window.copyPaymentNumber = function() { navigator.clipboard.writeText(document.getElementById('pay-number-display').innerText).then(() => alert("Account Number Copied! ✅")); }

window.submitOrder = async function() {
    const cName = document.getElementById('cust-name').value.trim();
    const cPhone = document.getElementById('cust-phone').value.trim();
    const methodId = document.getElementById('pay-method').value; 
    
    const cEmail = document.getElementById('cust-email').value.trim();
    const cUsername = document.getElementById('cust-username').value.trim();
    const cLink = document.getElementById('cust-link').value.trim();

    if(!cName || !cPhone || !methodId) { alert("Please complete required shipping fields and payment selection."); return; }
    
    let paymentProofBase64 = null;
    if (methodId !== "Cash on Delivery") { 
        const fileInput = document.getElementById('pay-proof-img'); 
        if (fileInput.files.length === 0) { alert("Please upload payment screenshot."); return; } 
        paymentProofBase64 = await new Promise((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target.result); r.readAsDataURL(fileInput.files[0]); }); 
        paymentProofBase64 = await compressImage(paymentProofBase64); 
    }
    
    const btn = document.getElementById('confirm-order-btn'); btn.disabled = true; btn.innerText = 'Processing...';
    const orderId = 'SH-' + Math.floor(10000 + Math.random() * 89999);
    
    const order = { 
        id: orderId, customer: cName, phone: cPhone, email: cEmail, username: cUsername, link: cLink, 
        subtotal: window.currentCheckoutMeta.subtotal, discount: window.currentCheckoutMeta.discountAmount, total: "Rs. " + window.currentCheckoutMeta.finalTotal.toLocaleString(), 
        items: [...cart], date: new Date().toLocaleString(), status: "Unpaid", paymentMethod: methodId, paymentProof: paymentProofBase64 
    };
    
    try { await fetch(`${CLOUDFLARE_API_URL}/orders`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(order) }); loadCloudflareData(); cart = []; document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = "0"); closeModal('cart-modal'); alert(`Order Confirmed!`); } catch (e) { alert("Network Error."); } finally { btn.innerText = 'CONFIRM ORDER'; btn.disabled = false; }
}

window.generateReceiptImageAndDownload = function(order) {
    document.getElementById('receipt-metadata').innerHTML = `<strong>ID:</strong> #${order.id}<br><strong>DATE:</strong> ${order.date}<br><strong>CLIENT:</strong> ${order.customer}<br><strong>PHONE:</strong> ${order.phone} ${order.email ? `<br><strong>EMAIL:</strong> ${order.email}` : ''}`;
    document.getElementById('receipt-items-list').innerHTML = order.items.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>- ${i.name}</span><span style="font-weight:bold;">Rs. ${i.price.toLocaleString()}</span></div>`).join('');
    
    let summaryHtml = '';
    if (order.subtotal !== undefined) {
        summaryHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px;"><span>Subtotal:</span><span style="font-weight:bold;">Rs. ${order.subtotal.toLocaleString()}</span></div>`;
        if (order.discount > 0) summaryHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#16a34a;"><span>Discount:</span><span style="font-weight:bold;">- Rs. ${order.discount.toLocaleString()}</span></div>`;
    }
    document.getElementById('receipt-summary-breakdown').innerHTML = summaryHtml;
    document.getElementById('receipt-sum').innerText = order.total;
    
    const paidBadge = document.getElementById('receipt-paid-status');
    paidBadge.style.display = 'inline-block';
    if (order.status === 'Paid') { paidBadge.innerHTML = '&#10004; PAID'; paidBadge.style.color = '#16a34a'; } else { paidBadge.innerHTML = '&#10008; UNPAID'; paidBadge.style.color = '#dc2626'; }

    setTimeout(() => { html2canvas(document.getElementById('receipt-area'), { scale: 2, useCORS: true }).then(canvas => { const link = document.createElement('a'); link.download = `Receipt-${order.id}.png`; link.href = canvas.toDataURL('image/png'); link.click(); paidBadge.style.display = 'none'; }); }, 150);
}

window.updateDetailsView = function(filteredOrders = null) {
    const log = document.getElementById('details-log'); if(!log) return;
    const data = filteredOrders || orders;
    if(!data || data.length === 0) { log.innerHTML = `<p class="text-xs font-bold text-slate-500 text-center py-5">No orders found.</p>`; return; }
    log.innerHTML = data.map(o => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <p class="font-black text-sm text-slate-800">#${o.id} - ${o.customer}</p>
                    <p class="text-[10px] text-slate-500 font-bold mb-1"><i class="fa-solid fa-phone"></i> ${o.phone} ${o.email ? `| <i class="fa-solid fa-envelope"></i> ${o.email}`:''}</p>
                    <p class="text-[10px] text-slate-600 font-bold">Total: <span class="text-slate-900">${o.total}</span> | Status: <span class="${o.status === 'Paid' ? 'text-green-600' : 'text-red-600'}">${o.status}</span> | Method: ${o.paymentMethod}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="markOrderPaid('${o.id}')" class="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black hover:bg-green-600 hover:text-white transition-colors border border-green-200"><i class="fa-solid fa-check"></i> PAID</button>
                    <button onclick='generateReceiptImageAndDownload(${JSON.stringify(o).replace(/'/g, "\\'")})' class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-colors border border-blue-200"><i class="fa-solid fa-download"></i> RECEIPT</button>
                    <button onclick="deleteOrder('${o.id}')" class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black hover:bg-red-600 hover:text-white transition-colors border border-red-200"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            ${(o.username || o.link) ? `
            <div class="flex flex-col sm:flex-row gap-2 mt-2 pt-3 border-t border-slate-100">
                ${o.username ? `
                <div class="flex-1 bg-slate-50 border rounded-lg p-2 flex justify-between items-center">
                    <div class="min-w-0 pr-2">
                        <span class="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Username</span>
                        <span class="text-xs font-bold text-slate-800 truncate block">${o.username}</span>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${o.username}'); alert('Username Copied!')" class="text-slate-400 hover:text-orange-600 p-1"><i class="fa-solid fa-copy"></i></button>
                </div>
                ` : ''}
                ${o.link ? `
                <div class="flex-1 bg-slate-50 border rounded-lg p-2 flex justify-between items-center">
                    <div class="min-w-0 pr-2">
                        <span class="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Link</span>
                        <span class="text-xs font-bold text-blue-600 truncate block">${o.link}</span>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${o.link}'); alert('Link Copied!')" class="text-slate-400 hover:text-orange-600 p-1"><i class="fa-solid fa-copy"></i></button>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
    `).join('');
}

window.updateReceiptsView = function(filteredOrders = null) {
    const log = document.getElementById('receipts-log'); if(!log) return;
    const data = filteredOrders || orders;
    
    let paidCount = data.filter(o => o.status === 'Paid').length;
    let unpaidCount = data.length - paidCount;
    document.getElementById('receipt-paid-count').innerText = paidCount;
    document.getElementById('receipt-unpaid-count').innerText = unpaidCount;

    if(!data || data.length === 0) { log.innerHTML = `<p class="text-xs font-bold text-slate-500 text-center py-5">No receipts available.</p>`; return; }
    log.innerHTML = data.map(o => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
                <p class="font-black text-sm text-slate-800">${o.customer} (#${o.id})</p>
                <p class="text-[10px] text-slate-500 font-bold">${o.date} | Status: <span class="${o.status === 'Paid' ? 'text-green-600' : 'text-red-600'}">${o.status}</span></p>
            </div>
            <button onclick='generateReceiptImageAndDownload(${JSON.stringify(o).replace(/'/g, "\\'")})' class="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-orange-600 transition-colors"><i class="fa-solid fa-download mr-1"></i> EXPORT</button>
        </div>
    `).join('');
}

window.searchDetails = function() { const t = document.getElementById('search-details-n').value.toLowerCase(); updateDetailsView(orders.filter(o => o.customer.toLowerCase().includes(t) || o.phone.includes(t) || (o.username && o.username.toLowerCase().includes(t)))); }
window.searchReceipts = function() { const t = document.getElementById('search-receipts-id').value.toLowerCase(); updateReceiptsView(orders.filter(o => o.id.toLowerCase().includes(t))); }

window.deleteOrder = async function(id) { if(!confirm("Delete order permanently?")) return; try { await fetch(`${CLOUDFLARE_API_URL}/orders/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); loadCloudflareOrdersSecure(); alert("Order Deleted."); } catch(err) {} }
window.markOrderPaid = async function(id) { let order = orders.find(o => o.id === id); if(order && order.status !== "Paid") { order.status = "Paid"; try { await fetch(`${CLOUDFLARE_API_URL}/orders/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); await fetch(`${CLOUDFLARE_API_URL}/orders`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(order) }); loadCloudflareOrdersSecure(); alert("Marked as Paid! ✅"); } catch(e) { alert("Error marking paid."); } } }

window.updateInvoiceDashboard = function() {
    const statsBoard = document.getElementById('invoice-stats-board'); const prodLog = document.getElementById('invoice-products-log');
    if(!statsBoard || !prodLog) return;
    let totalInitial = 0; let totalSelling = 0;
    allProducts.forEach(p => { totalInitial += (p.initialCost || 0); totalSelling += (p.price || 0); });
    let totalProfit = totalSelling - totalInitial;

    statsBoard.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100"><p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Inv. Cost</p><h3 class="text-xl md:text-2xl font-black text-slate-800">Rs. ${totalInitial.toLocaleString()}</h3></div>
        <div class="bg-purple-50 p-4 rounded-xl border border-purple-100"><p class="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Est. Revenue</p><h3 class="text-xl md:text-2xl font-black text-slate-800">Rs. ${totalSelling.toLocaleString()}</h3></div>
        <div class="bg-green-50 p-4 rounded-xl border border-green-100"><p class="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Est. Profit</p><h3 class="text-xl md:text-2xl font-black text-slate-800">Rs. ${totalProfit.toLocaleString()}</h3></div>
    `;

    if(allProducts.length === 0) { prodLog.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">No products in inventory.</p>'; return; }
    prodLog.innerHTML = allProducts.map(p => { let pProfit = (p.price || 0) - (p.initialCost || 0); return `<div class="bg-white p-3 rounded-xl border flex justify-between items-center text-[10px] md:text-xs"><div class="font-bold text-slate-800 line-clamp-1 flex-1 pr-2">${p.name}</div><div class="text-slate-500 font-bold shrink-0 w-24 text-right">In: Rs. ${p.initialCost || 0}</div><div class="text-slate-500 font-bold shrink-0 w-24 text-right">Out: Rs. ${p.price || 0}</div><div class="text-green-600 font-black shrink-0 w-24 text-right">+ Rs. ${pProfit}</div></div>`; }).join('');
}

window.addNewProduct = async function(e) { 
    e.preventDefault(); const btn = document.getElementById('add-btn-submit'); btn.disabled = true; const originalText = btn.innerHTML; btn.innerHTML = 'Publishing...';
    
    let catSelect = document.getElementById('new-p-cat');
    let finalCategory = catSelect ? catSelect.value : '';
    if (finalCategory === 'Custom') { 
        finalCategory = document.getElementById('custom-cat-input').value.trim(); 
        if (!finalCategory) { alert("Please type a name for the new category!"); btn.disabled = false; btn.innerHTML = originalText; return; } 
    }
    if (!finalCategory || finalCategory === "") {
        finalCategory = "Uncategorized";
    }

    const file = document.getElementById('new-p-img-file').files[0]; 
    if (!file) { alert("Please select an image first!"); btn.disabled = false; btn.innerHTML = originalText; return; }
    
    const reader = new FileReader(); 
    reader.onload = function(event) { 
        const img = new Image(); 
        img.onload = async function() { 
            try {
                const MAX_WIDTH = 800; let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); 
                
                const newProduct = { 
                    id: Date.now().toString(), name: document.getElementById('new-p-name').value, 
                    initialCost: parseInt(document.getElementById('new-p-initial').value) || 0,
                    price: parseInt(document.getElementById('new-p-price').value), cat: finalCategory, img: canvas.toDataURL('image/jpeg', 0.8) 
                }; 
                
                await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(newProduct) }); 
                loadCloudflareData(); 
                document.getElementById('add-product-form').reset(); 
                document.getElementById('custom-cat-input').classList.add('hidden'); 
                alert("Published Successfully! 💎"); 
            } catch (err) { alert("Error publishing product."); } finally { btn.disabled = false; btn.innerHTML = originalText; }
        }; img.src = event.target.result; 
    }; reader.readAsDataURL(file); 
}

window.updatePrices = async function(id) {
    const product = allProducts.find(p => String(p.id) === String(id)); if(!product) return;
    
    const newInitial = prompt(`Enter new INITIAL cost for "${product.name}":`, product.initialCost || 0);
    if (newInitial === null) return; 
    
    const newSelling = prompt(`Enter new SELLING price for "${product.name}":`, product.price || 0);
    if (newSelling === null) return; 

    if (newInitial.trim() !== '' && newSelling.trim() !== '' && !isNaN(newInitial) && !isNaN(newSelling)) {
        product.initialCost = parseInt(newInitial) || 0;
        product.price = parseInt(newSelling) || 0;
        try { 
            await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(product) }); 
            await loadCloudflareData(); 
            alert("Prices updated successfully! ✅"); 
        } catch(err) { alert("Error updating prices."); }
    } else {
        alert("Invalid numbers entered.");
    }
}

window.goToEditSpecs = function(id) {
    switchSidebarTab('specs');
    const select = document.getElementById('spec-p-id');
    if(select) {
        select.value = id;
        loadSpecDataIntoForm();
    }
}

window.deleteProduct = async function(id) { if(confirm("Delete item permanently?")) { await fetch(`${CLOUDFLARE_API_URL}/products/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); loadCloudflareData(); } }

window.renderAdminProducts = function() { 
    updateSpecsDropdown(); 
    const log = document.getElementById('admin-product-log'); if(!log) return; 
    log.innerHTML = allProducts.map(p => `
    <div class="bg-slate-50 p-2 md:p-3 rounded-xl flex justify-between items-center border text-[10px] md:text-xs font-bold">
        <div class="flex items-center gap-2 md:gap-3">
            <img src="${p.img}" class="w-8 h-8 md:w-10 md:h-10 object-cover rounded shadow-sm">
            <div>
                <h4 class="text-slate-800 mb-0.5">${p.name}</h4>
                <span class="text-orange-600">Sell: Rs. ${p.price} | In: Rs. ${p.initialCost || 0}</span>
                <p class="text-[9px] text-slate-400 mt-0.5">Cat: ${p.cat}</p>
            </div>
        </div>
        <div class="flex items-center gap-1 md:gap-2">
            <button onclick="updatePrices('${p.id}')" class="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors" title="Edit Prices"><i class="fa-solid fa-money-bill-wave"></i> Edit Price</button>
            <button onclick="goToEditSpecs('${p.id}')" class="text-indigo-500 hover:text-indigo-700 p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors" title="Edit Specs"><i class="fa-solid fa-list-check"></i> Edit Specs</button>
            <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>`).join(''); 
}

window.submitContactForm = async function(e) { e.preventDefault(); const btn = document.getElementById('contact-f-btn'); const ogText = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'SENDING...'; const name = document.getElementById('contact-f-name').value; const email = document.getElementById('contact-f-email').value; const message = document.getElementById('contact-f-msg').value; try { const res = await fetch(`${CLOUDFLARE_API_URL}/contact-msg`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) }); const data = await res.json(); if (res.ok) { alert("Message Sent! 💎 We have forwarded it directly to the admin."); document.getElementById('public-contact-form').reset(); } else { alert("Failed to send message: " + data.error); } } catch (err) { alert("Network Error. Cannot reach server."); } finally { btn.disabled = false; btn.innerHTML = ogText; } }
window.pushNotif = function(msg) { notifs.unshift({ msg }); updateNotifUI(); }
window.updateNotifUI = function() { const feed = document.getElementById('notif-feed'); if(notifs.length === 0) { feed.innerHTML = `<p class="text-slate-400 text-sm italic text-center py-10">No alerts...</p>`; return; } document.getElementById('notif-dot').style.display = 'block'; feed.innerHTML = notifs.map(n => `<div class="bg-slate-50 p-3 rounded-xl border shadow-sm text-xs font-bold text-slate-700">${n.msg}</div>`).join(''); }
window.toggleNotif = function() { document.getElementById('notif-sidebar').classList.toggle('open'); document.getElementById('notif-dot').style.display = 'none'; }
window.toggleMobileMenu = function() { const menu = document.getElementById('mobile-menu'); menu.classList.toggle('hidden'); menu.classList.toggle('flex'); document.querySelector('.modern-hamburger').classList.toggle('open'); }
window.togglePasswordVisibility = function(inputId, iconId) { const input = document.getElementById(inputId); const icon = document.getElementById(iconId); if (input && icon) { if (input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); } else { input.type = 'password'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } } }
function clientValidatePassword(password) { if (!password || password.length < 12) return false; return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[@#\.]/.test(password); }
window.openModal = function(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = 'auto'; }

window.checkAdminAccess = async function() {
    if (sessionStorage.getItem('admin_session_token')) {
        showAdminPanel();
        return;
    }
    
    openModal('admin-lock');
    document.getElementById('admin-modal-title').innerText = "Connecting...";
    
    try {
        const res = await fetch(`${CLOUDFLARE_API_URL}/admin/status`);
        const data = await res.json();
        
        if (data.isSetup) {
            document.getElementById('admin-modal-title').innerText = "Gateway Secured";
            document.getElementById('admin-modal-desc').innerText = "Enter master password to unlock.";
            document.getElementById('auth-setup-form').classList.add('hidden');
            document.getElementById('auth-login-form').classList.remove('hidden');
        } else {
            document.getElementById('admin-modal-title').innerText = "Initial Setup";
            document.getElementById('admin-modal-desc').innerText = "Create a master password for the admin portal.";
            document.getElementById('auth-login-form').classList.add('hidden');
            document.getElementById('auth-setup-form').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('admin-modal-desc').innerText = "Error connecting to server.";
    }
}

window.authCreateMasterPassword = async function(e) {
    e.preventDefault();
    const pass = document.getElementById('auth-setup-pass').value;
    const conf = document.getElementById('auth-setup-confirm').value;
    
    if (pass !== conf) return alert("Passwords do not match!");
    if (!clientValidatePassword(pass)) return alert("Password does not meet security requirements. Check instructions!");
    
    const btn = document.getElementById('btn-auth-setup');
    btn.innerText = "Securing..."; btn.disabled = true;
    
    try {
        const res = await fetch(`${CLOUDFLARE_API_URL}/admin/setup-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();
        if (data.token) {
            sessionStorage.setItem('admin_session_token', data.token);
            closeModal('admin-lock');
            showAdminPanel();
        }
    } catch (err) {
        alert("Error setting up password.");
    } finally {
        btn.innerText = "LOCK SYSTEM PERMANENTLY"; btn.disabled = false;
    }
}

window.authLoginMaster = async function(e) {
    e.preventDefault();
    const pass = document.getElementById('auth-login-pass').value;
    const btn = document.getElementById('btn-auth-login');
    btn.innerText = "Verifying..."; btn.disabled = true;
    
    try {
        const res = await fetch(`${CLOUDFLARE_API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });
        
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('admin_session_token', data.token);
            closeModal('admin-lock');
            showAdminPanel();
            document.getElementById('auth-login-form').reset();
        } else {
            alert("Incorrect Password!");
        }
    } catch (err) {
        alert("Login failed. Check connection.");
    } finally {
        btn.innerText = "UNLOCK OS"; btn.disabled = false;
    }
}

window.showAdminPanel = function() {
    document.getElementById('main-site-content').style.display = 'none';
    document.getElementById('admin-os').classList.remove('hidden');
    document.getElementById('admin-os').classList.add('flex');
    switchSidebarTab('profile');
    if (typeof loadCloudflareOrdersSecure === 'function') {
        loadCloudflareOrdersSecure();
    }
}

window.logoutAdmin = function() {
    sessionStorage.removeItem('admin_session_token');
    location.reload(); 
}

window.toggleAdminSidebar = function() {
    const sidebar = document.getElementById('admin-sidebar-container');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
    }
}

window.switchSidebarTab = function(tabId) {
    document.querySelectorAll('.admin-view').forEach(el => {
        el.classList.add('hidden');
        if(el.classList.contains('flex-col')) el.classList.remove('flex'); 
    });
    
    const target = document.getElementById(`view-${tabId}`);
    if(target) {
        target.classList.remove('hidden');
        if (['home', 'addprod', 'specs', 'invoice', 'payment', 'social', 'pricing', 'details', 'receipts', 'inventory'].includes(tabId)) {
            target.classList.add('flex');
        }
    }
    
    document.querySelectorAll('.sidebar-tab').forEach(el => {
        el.classList.remove('bg-white/10', 'text-white');
        el.classList.add('text-slate-400');
    });
    
    const activeBtn = document.getElementById(`btn-tab-${tabId}`);
    if(activeBtn) {
        activeBtn.classList.add('bg-white/10', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }
    
    if (window.innerWidth < 1024) toggleAdminSidebar();
}
