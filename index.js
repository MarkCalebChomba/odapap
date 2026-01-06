import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, query, limit, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { app } from "./js/firebase.js";
import { logoutUser, onAuthChange } from "./js/auth.js";
import { showNotification } from './notifications.js';
import { updateCartCounter, updateWishlistCounter, updateChatCounter } from './js/utils.js';
import { categoryHierarchy } from './js/categoryData.js';
import { initializeImageSliders } from './imageSlider.js';

// Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// State
let allListings = [];

// Category Icons
const catIcons = {
  'fashion': 'tshirt', 'electronics': 'tv', 'phones': 'mobile-alt', 'beauty': 'heart',
  'kitchenware': 'blender', 'furniture': 'couch', 'accessories': 'headphones',
  'foodstuffs': 'carrot', 'pharmaceutical': 'pills', 'kids': 'hat-wizard',
  'rentals': 'building', 'service-men': 'tools', 'student-centre': 'graduation-cap'
};

// ===== HELPERS =====
const $ = id => document.getElementById(id);

function setCookie(name, value, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires};path=/`;
}

function getGuestCart() {
  try { return JSON.parse(localStorage.getItem('guestCart')) || []; }
  catch { return []; }
}

function saveGuestCart(cart) {
  localStorage.setItem('guestCart', JSON.stringify(cart));
}

function addToGuestCart(listingId, listing, qty = 1, variation = null) {
  const cart = getGuestCart();
  const key = listingId + (variation ? JSON.stringify(variation) : '');
  const existing = cart.findIndex(i => i.listingId + (i.selectedVariation ? JSON.stringify(i.selectedVariation) : '') === key);
  
  if (existing >= 0) cart[existing].quantity += qty;
  else cart.push({
    listingId,
    name: listing.name,
    price: variation?.price || listing.price,
    quantity: qty,
    selectedVariation: variation,
    imageUrls: listing.imageUrls,
    addedAt: new Date().toISOString()
  });
  saveGuestCart(cart);
}

// Get minimum price from variations - retail stored as retailPrice in DB
function getMinPriceFromVariations(listing) {
  let minPrice = Infinity;
  let associatedRetail = null;
  let packSize = null;
  
  if (listing.variations?.length) {
    listing.variations.forEach(v => {
      if (v.attributes?.length) {
        v.attributes.forEach(a => {
          const attrPrice = a.price || a.originalPrice;
          if (attrPrice && attrPrice < minPrice) {
            minPrice = attrPrice;
            // Check both retailPrice and retail field names
            associatedRetail = a.retailPrice || a.retail || null;
            packSize = a.packSize || null;
          }
        });
      } else {
        const varPrice = v.price || v.originalPrice;
        if (varPrice && varPrice < minPrice) {
          minPrice = varPrice;
          associatedRetail = v.retailPrice || v.retail || null;
          packSize = v.packSize || null;
        }
      }
    });
  }
  
  // Fallback to listing price if no variations found
  if (minPrice === Infinity) {
    minPrice = listing.price || 0;
    associatedRetail = listing.retailPrice || listing.retail || listing.initialPrice || null;
  }
  
  return { 
    price: minPrice, 
    retailPrice: associatedRetail,
    packSize: packSize
  };
}

// Get pack size info from first/cheapest variation
function getPackInfo(listing) {
  if (listing.variations?.length) {
    // Find the cheapest option and get its pack size
    let minPrice = Infinity;
    let packSize = null;
    
    listing.variations.forEach(v => {
      if (v.attributes?.length) {
        v.attributes.forEach(a => {
          if (a.price && a.price < minPrice) {
            minPrice = a.price;
            packSize = a.packSize || null;
          }
        });
      } else if (v.price && v.price < minPrice) {
        minPrice = v.price;
        packSize = v.packSize || null;
      }
    });
    return packSize;
  }
  return null;
}

// Time greeting
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  if (h >= 18 && h < 22) return 'Good evening';
  return 'Hello';
}

// ===== AUTH STATUS =====
async function updateAuthStatus(user) {
  const el = $('auth-status');
  if (!el) return;
  
  if (user) {
    let name = user.email?.split('@')[0] || 'User';
    try {
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) name = userDoc.data().name || userDoc.data().username || name;
    } catch {}
    
    el.innerHTML = `
      <div class="welcome">
        <span class="greeting">👋 ${getGreeting()}, <strong>${name}</strong></span>
        <div class="actions">
          <a href="listing.html" class="btn btn-primary"><i class="fas fa-plus"></i> Sell</a>
          <button class="btn btn-logout" onclick="logout()"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </div>
    `;
  } else {
    const cartCount = getGuestCart().length;
    el.innerHTML = `
      <div class="welcome">
        <span class="greeting">🛒 ${getGreeting()}! Welcome to <strong>Oda Pap</strong></span>
        <div class="actions">
          ${cartCount > 0 ? `<a href="cart.html" class="btn btn-outline"><i class="fas fa-shopping-cart"></i> ${cartCount}</a>` : ''}
          <a href="login.html" class="btn btn-primary">Login</a>
          <a href="signup.html" class="btn btn-outline">Sign Up</a>
        </div>
      </div>
    `;
  }
}

window.logout = async () => {
  await logoutUser();
  location.reload();
};

// ===== CATEGORIES =====
async function loadCategories() {
  const strip = $('categoryStrip');
  if (!strip) return;
  
  // Get counts
  const snap = await getDocs(collection(db, "Listings"));
  const counts = {};
  snap.forEach(d => {
    const cat = d.data().category;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  
  // Render
  strip.innerHTML = Object.keys(categoryHierarchy)
    .filter(k => counts[k] > 0)
    .map(k => `
      <a href="category.html?category=${k}" class="cat-card">
        <i class="fas fa-${catIcons[k] || 'box'}"></i>
        <span>${categoryHierarchy[k].label}</span>
        <span class="count">${counts[k]}</span>
      </a>
    `).join('');
}

// ===== PRODUCTS - Match Category Page Gallery Style =====
async function loadProducts() {
  // Don't show blocking loader - let content load progressively
  
  try {
    const snap = await getDocs(collection(db, "Listings"));
    
    // Get unique seller IDs
    const sellerIds = new Set();
    snap.forEach(d => sellerIds.add(d.data().uploaderId || d.data().userId));
    
    // Batch fetch sellers
    const sellers = {};
    await Promise.all([...sellerIds].map(async id => {
      try {
        const u = await getDoc(doc(db, "Users", id));
        if (u.exists()) sellers[id] = u.data();
      } catch {}
    }));
    
    // Build listings
    allListings = snap.docs.map(d => {
      const data = d.data();
      const sellerId = data.uploaderId || data.userId;
      const seller = sellers[sellerId] || {};
      const priceData = getMinPriceFromVariations(data);
      const packInfo = getPackInfo(data);
      
      return {
        id: d.id,
        ...data,
        sellerId,
        sellerName: seller.name || seller.username || 'Seller',
        sellerPic: seller.profilePicUrl || 'images/profile-placeholder.png',
        sellerUid: seller.uid || sellerId,
        minPrice: priceData.price,
        retailPrice: priceData.retailPrice,
        packInfo: packInfo,
        margin: priceData.retailPrice && priceData.retailPrice > priceData.price 
          ? Math.round(((priceData.retailPrice - priceData.price) / priceData.price) * 100) 
          : 0
      };
    });
    
    // Sort by newest
    allListings.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    renderProducts();
    
  } catch (err) {
    console.error('Load error:', err);
    showNotification('Failed to load products', 'error');
  }
}

function renderProducts() {
  const container = $('listings-container');
  if (!container) return;
  
  if (allListings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No products yet. Be the first to sell!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allListings.map(listing => {
    const imageUrls = listing.imageUrls || [];
    const firstImage = imageUrls[0] || 'images/product-placeholder.png';
    
    return `
      <div class="listing-item">
        <div class="product-item">
          <div class="profile">
            <img src="${listing.sellerPic}" alt="${listing.sellerName}" onclick="goToUserProfile('${listing.sellerUid}')" loading="lazy">
            <div class="uploader-info">
              <p class="uploader-name"><strong>${listing.sellerName}</strong></p>
              <p class="product-name">${listing.name}</p>
              ${listing.packInfo ? `<p class="pack-size"><i class="fas fa-box"></i> ${listing.packInfo}</p>` : ''}
            </div>
            <div class="product-actions profile-actions">
              <div>
                <i class="fas fa-comments" onclick="goToChat('${listing.sellerId}', '${listing.id}')"></i>
                <small>Message</small>
              </div>
              <div>
                <i class="fas fa-share" onclick="shareProduct('${listing.id}', '${listing.name}', '${listing.description || ''}')"></i>
                <small>Share</small>
              </div>
            </div>
          </div>
          <div class="product-image-container" onclick="goToProduct('${listing.id}')">
            <div class="image-slider">
              ${imageUrls.map((url, index) => `
                <img src="${url}" alt="Product Image" class="product-image" loading="${index === 0 ? 'eager' : 'lazy'}">
              `).join('')}
              <div class="product-tags">
                ${listing.subcategory ? `<span>${listing.subcategory}</span>` : ''}
                ${listing.brand ? `<span>${listing.brand}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="product-price">
            <div class="price-row">
              <span class="price-label">Wholesale:</span>
              <strong class="wholesale-amount">KES ${listing.minPrice.toLocaleString()}</strong>
            </div>
            ${listing.retailPrice && listing.retailPrice > listing.minPrice ? `
            <div class="price-row retail-row">
              <span class="price-label">Retail:</span>
              <span class="retail-amount">KES ${listing.retailPrice.toLocaleString()}</span>
              <span class="profit-badge">+${listing.margin}%</span>
            </div>` : ''}
          </div>
          <p class="product-description">${listing.description || 'No description available'}</p>
          <div class="product-actions">
            <div>
              <i class="fas fa-cart-plus" onclick="addToCart('${listing.id}')"></i>
              <p>Cart</p>
            </div>
            <div>
              <i class="fas fa-bolt" onclick="buyNow('${listing.id}')"></i>
              <p>Buy Now</p>
            </div>
            <div>
              <i class="fas fa-heart" onclick="addToWishlist('${listing.id}')"></i>
              <p>Wishlist</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Initialize image sliders
  initializeImageSliders();
}

// Sort products
$('sortSelect')?.addEventListener('change', function() {
  const sortBy = this.value;
  switch (sortBy) {
    case 'price-low': allListings.sort((a, b) => a.minPrice - b.minPrice); break;
    case 'price-high': allListings.sort((a, b) => b.minPrice - a.minPrice); break;
    case 'profit': allListings.sort((a, b) => b.margin - a.margin); break;
    default: allListings.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }
  renderProducts();
});

// Navigation
window.goToProduct = id => location.href = `product.html?id=${id}`;
window.goToUserProfile = id => location.href = `user.html?userId=${id}`;

window.goToChat = function(sellerId, listingId) {
  const user = auth.currentUser;
  if (user) {
    location.href = `chat.html?sellerId=${sellerId}&listingId=${listingId}`;
  } else {
    showNotification('Please login to message seller', 'warning');
  }
};

window.shareProduct = async function(listingId, productName, productDesc) {
  const shareUrl = `${window.location.origin}/product.html?id=${listingId}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: productName, text: productDesc, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showNotification('Link copied!');
    }
  } catch (e) {
    console.error('Share error:', e);
  }
};

// ===== CART, WISHLIST, BUY =====
window.addToCart = async (id) => {
  const listing = allListings.find(l => l.id === id);
  if (!listing) return;
  
  if (listing.variations?.length) {
    showQuantityModal(id, listing, true);
    return;
  }
  
  const user = auth.currentUser;
  if (user) {
    try {
      await addDoc(collection(db, `users/${user.uid}/cart`), {
        userId: user.uid,
        listingId: id,
        quantity: 1,
        ...listing,
        addedAt: new Date().toISOString()
      });
      showNotification('Added to cart!');
      updateCartCounter(db, user.uid);
    } catch { showNotification('Failed to add', 'error'); }
  } else {
    addToGuestCart(id, listing);
    showNotification('Added to cart!');
    updateAuthStatus(null);
  }
};

window.addToWishlist = async (id) => {
  const user = auth.currentUser;
  if (!user) { showNotification('Please login first', 'warning'); return; }
  
  const listing = allListings.find(l => l.id === id);
  if (!listing) return;
  
  try {
    await addDoc(collection(db, `users/${user.uid}/wishlist`), {
      userId: user.uid,
      listingId: id,
      ...listing,
      addedAt: new Date().toISOString()
    });
    showNotification('Saved to wishlist!');
    updateWishlistCounter(db, user.uid);
  } catch { showNotification('Failed to save', 'error'); }
};

window.buyNow = async (id) => {
  const listing = allListings.find(l => l.id === id);
  if (!listing) return;
  showQuantityModal(id, listing, false);
};

// ===== QUANTITY MODAL =====
function showQuantityModal(id, listing, isCart) {
  // Get all variation options
  const options = [];
  if (listing.variations?.length) {
    listing.variations.forEach((v, vi) => {
      if (v.attributes?.length) {
        v.attributes.forEach((a, ai) => {
          options.push({
            ...a,
            varTitle: v.title,
            display: `${v.title}: ${a.attr_name}`,
            // Check both retailPrice and retail field names
            retailPrice: a.retailPrice || a.retail || null,
            photoUrl: a.photoUrl || a.imageUrl || null,
            vi, ai
          });
        });
      } else {
        options.push({ 
          ...v, 
          display: v.title || `Option ${vi + 1}`, 
          retailPrice: v.retailPrice || v.retail || null,
          photoUrl: v.photoUrl || v.imageUrl || null,
          vi 
        });
      }
    });
  }
  
  let selected = options[0] || null;
  let price = selected?.price || selected?.originalPrice || listing.minPrice;
  let maxStock = selected?.stock || listing.stock || 10;
  
  const modal = document.createElement('div');
  modal.className = 'quantity-modal';
  modal.innerHTML = `
    <div class="quantity-modal-content">
      <h3>Select Options</h3>
      <p>Stock: <strong id="modalStock">${maxStock}</strong> units</p>
      ${options.length ? `
        <div class="modal-variations">
          <h4>Select Option:</h4>
          <div class="variations-grid">
            ${options.map((o, i) => `
              <div class="variation-mini-card ${i === 0 ? 'selected' : ''}" data-idx="${i}">
                ${o.photoUrl ? `<img src="${o.photoUrl}" alt="">` : '<i class="fas fa-box"></i>'}
                <p><strong>${o.display}</strong></p>
                <p class="variation-price">KES ${(o.price || o.originalPrice || listing.minPrice).toLocaleString()}</p>
                ${o.retailPrice ? `<p class="variation-retail">Retail: KES ${o.retailPrice.toLocaleString()}</p>` : ''}
                <p class="variation-stock">${o.stock || 0} units</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="quantity-selector">
        <button class="qty-btn" id="qtyMinus">-</button>
        <input type="number" id="qtyInput" value="1" min="1" max="${maxStock}">
        <button class="qty-btn" id="qtyPlus">+</button>
      </div>
      <div class="quantity-total">Total: <span id="qtyTotal">KES ${price.toLocaleString()}</span></div>
      <div class="quantity-actions">
        <button class="cancel-btn" id="qtyCancel">Cancel</button>
        <button class="confirm-btn" id="qtyConfirm">${isCart ? 'Add to Cart' : 'Buy Now'}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const input = modal.querySelector('#qtyInput');
  const total = modal.querySelector('#qtyTotal');
  const stock = modal.querySelector('#modalStock');
  
  const updateTotal = () => total.textContent = `KES ${(price * (parseInt(input.value) || 1)).toLocaleString()}`;
  
  // Variation selection
  modal.querySelectorAll('.variation-mini-card').forEach((card, i) => {
    card.onclick = () => {
      modal.querySelectorAll('.variation-mini-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = options[i];
      price = selected.price || listing.minPrice;
      maxStock = selected.stock || 10;
      input.max = maxStock;
      stock.textContent = maxStock;
      updateTotal();
    };
  });
  
  modal.querySelector('#qtyMinus').onclick = () => {
    if (parseInt(input.value) > 1) { input.value = parseInt(input.value) - 1; updateTotal(); }
  };
  modal.querySelector('#qtyPlus').onclick = () => {
    if (parseInt(input.value) < maxStock) { input.value = parseInt(input.value) + 1; updateTotal(); }
  };
  input.oninput = updateTotal;
  
  modal.querySelector('#qtyCancel').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  
  modal.querySelector('#qtyConfirm').onclick = async () => {
    const qty = parseInt(input.value) || 1;
    
    if (isCart) {
      const user = auth.currentUser;
      if (user) {
        try {
          await addDoc(collection(db, `users/${user.uid}/cart`), {
            userId: user.uid,
            listingId: id,
            quantity: qty,
            selectedVariation: selected,
            ...listing,
            addedAt: new Date().toISOString()
          });
          showNotification('Added to cart!');
          updateCartCounter(db, user.uid);
        } catch { showNotification('Failed', 'error'); }
      } else {
        addToGuestCart(id, listing, qty, selected);
        showNotification('Added to cart!');
        updateAuthStatus(null);
      }
    } else {
      // Buy now
      const user = auth.currentUser;
      if (!user) { showNotification('Please login to buy', 'warning'); modal.remove(); return; }
      
      setCookie('buyNowItem', {
        listingId: id,
        name: listing.name,
        price: selected?.price || listing.minPrice,
        quantity: qty,
        selectedVariation: selected,
        imageUrls: listing.imageUrls,
        brand: listing.brand,
        category: listing.category
      });
      location.href = 'checkout.html?source=buynow';
    }
    modal.remove();
  };
}

// ===== SEARCH =====
$('searchForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const q = $('searchInput').value.trim();
  if (q) location.href = `search-results.html?q=${encodeURIComponent(q)}`;
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCategories(), loadProducts()]);
  
  onAuthStateChanged(auth, async user => {
    updateAuthStatus(user);
    if (user) {
      updateCartCounter(db, user.uid);
      updateWishlistCounter(db, user.uid);
      updateChatCounter(db, user.uid);
    }
  });
});

onAuthChange(updateAuthStatus);
