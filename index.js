import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";
import { app } from "./js/firebase.js";
import { logoutUser, onAuthChange } from "./js/auth.js";
import { initializeImageSliders } from './imageSlider.js';
import { showLoader, hideLoader } from './loader.js';
import { showNotification } from './notifications.js';
import { animateButton, animateIconToCart, updateCartCounter, updateWishlistCounter, updateChatCounter } from './js/utils.js';
import { categoryHierarchy, brandsByCategory } from './js/categoryData.js';

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);

// ================= RANKING ALGORITHM =================
/**
 * STEP 1: Track time spent on each product
 * STEP 2: Calculate scores based on:
 *   - Time spent (weight: 40%)
 *   - Product name similarity (weight: 30%)
 *   - Subcategory match (weight: 20%)
 *   - Brand match (weight: 10%)
 * STEP 3: Store user preferences in localStorage
 * STEP 4: Rank future products based on learned preferences
 */

class ProductRankingEngine {
  constructor() {
    this.viewHistory = this.loadViewHistory();
    this.startTime = Date.now();
    this.currentProduct = null;
  }

  /**
   * Load view history from localStorage
   */
  loadViewHistory() {
    const saved = localStorage.getItem('productViewHistory');
    return saved ? JSON.parse(saved) : {};
  }

  /**
   * Save view history to localStorage
   */
  saveViewHistory() {
    localStorage.setItem('productViewHistory', JSON.stringify(this.viewHistory));
  }

  /**
   * Track when user starts viewing a product
   */
  startViewingProduct(productId, productData) {
    if (this.currentProduct) {
      this.endViewingProduct(); // End previous product tracking
    }
    
    this.currentProduct = productId;
    this.startTime = Date.now();
  }

  /**
   * Track when user stops viewing a product
   * Calculate time spent and update rankings
   */
  endViewingProduct() {
    if (!this.currentProduct) return;

    const timeSpent = (Date.now() - this.startTime) / 1000; // Convert to seconds

    if (timeSpent > 2) { // Only track if spent more than 2 seconds
      const productId = this.currentProduct;

      if (!this.viewHistory[productId]) {
        this.viewHistory[productId] = {
          views: 0,
          totalTime: 0,
          lastViewed: null
        };
      }

      this.viewHistory[productId].views++;
      this.viewHistory[productId].totalTime += timeSpent;
      this.viewHistory[productId].lastViewed = new Date().toISOString();

      this.saveViewHistory();
    }

    this.currentProduct = null;
  }

  /**
   * Calculate engagement score for a product
   */
  getEngagementScore(productId) {
    if (!this.viewHistory[productId]) return 0;

    const history = this.viewHistory[productId];
    const avgTimePerView = history.totalTime / history.views;
    const views = history.views;

    // Score = (views * weight1) + (avgTime * weight2)
    // Normalized to 0-100
    const score = (views * 10) + (Math.min(avgTimePerView, 60) * 0.5);
    return Math.min(score, 100);
  }

  /**
   * Get user preferences based on view history
   * Returns object with preferred: { names, brands, subcategories, categories }
   */
  getUserPreferences() {
    const preferences = {
      names: {},
      brands: {},
      subcategories: {},
      categories: {}
    };

    Object.keys(this.viewHistory).forEach(productId => {
      const score = this.getEngagementScore(productId);
      // Preferences will be matched during ranking
    });

    return preferences;
  }

  /**
   * Rank products based on user viewing history
   * Higher score = more likely to match user interests
   */
  rankProducts(products, userProductData = {}) {
    return products.map(product => {
      let score = 0;

      // 40% - Time spent on similar products
      const engagementScore = this.getEngagementScore(product.id);
      score += engagementScore * 0.4;

      // 30% - Product name similarity with viewed products
      const nameBoost = this.getNameSimilarityBoost(product.name);
      score += nameBoost * 0.3;

      // 20% - Subcategory preference
      const subcategoryBoost = this.getSubcategoryBoost(product.subcategory);
      score += subcategoryBoost * 0.2;

      // 10% - Brand preference
      const brandBoost = this.getBrandBoost(product.brand);
      score += brandBoost * 0.1;

      return {
        ...product,
        rankingScore: score
      };
    }).sort((a, b) => b.rankingScore - a.rankingScore);
  }

  /**
   * Check if product name matches previously viewed products
   */
  getNameSimilarityBoost(productName) {
    let boost = 0;
    const weight = 25; // Max boost points

    Object.keys(this.viewHistory).forEach(viewedId => {
      const words = productName.toLowerCase().split(/\s+/);
      // Simple word matching
      words.forEach(word => {
        if (viewedId.toLowerCase().includes(word)) {
          boost += weight / Object.keys(this.viewHistory).length;
        }
      });
    });

    return Math.min(boost, weight);
  }

  /**
   * Boost score if user frequently views this subcategory
   */
  getSubcategoryBoost(subcategory) {
    // This would be calculated from view history
    // For now, return 0 (will be implemented when tracking full product data)
    return 0;
  }

  /**
   * Boost score if user frequently views this brand
   */
  getBrandBoost(brand) {
    // This would be calculated from view history
    // For now, return 0 (will be implemented when tracking full product data)
    return 0;
  }

  /**
   * Clear view history (for testing/reset)
   */
  clearHistory() {
    this.viewHistory = {};
    localStorage.removeItem('productViewHistory');
  }
}

// Initialize ranking engine
const rankingEngine = new ProductRankingEngine();

// ================= CATEGORY STRIP FUNCTIONALITY =================
/**
 * Load and display category cards in scrollable strip
 */
async function loadCategoryStrip() {
  const categoryStrip = document.getElementById('categoryStrip');
  const listings = await getDocs(collection(firestore, "Listings"));
  
  // Count listings per category
  const categoryCounts = {};
  listings.forEach(doc => {
    const category = doc.data().category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Create category cards
  Object.keys(categoryHierarchy).forEach(categoryKey => {
    const categoryData = categoryHierarchy[categoryKey];
    const count = categoryCounts[categoryKey] || 0;

    const card = document.createElement('a');
    card.href = `category.html?category=${categoryKey}`;
    card.className = 'category-card';
    card.innerHTML = `
      <div class="category-card-icon">
        <i class="fas fa-${getCategoryIcon(categoryKey)}"></i>
      </div>
      <p class="category-card-name">${categoryData.label}</p>
      <span class="category-card-count">${count} items</span>
    `;
    
    categoryStrip.appendChild(card);
  });
}

/**
 * Get icon for category (helper function)
 */
function getCategoryIcon(category) {
  const icons = {
    'fashion': 'tshirt',
    'electronics': 'tv',
    'phones': 'mobile-alt',
    'beauty': 'heart',
    'health': 'capsules',
    'kitchenware': 'blender',
    'furniture': 'couch',
    'appliances': 'microwave',
    'baby': 'baby-carriage',
    'sports': 'football-ball',
    'automotive': 'car',
    'books': 'book',
    'groceries': 'carrot',
    'pets': 'paw',
    'jewelry': 'ring',
    'office': 'briefcase',
    'garden': 'leaf',
    'industrial': 'hammer',
    'accessories': 'headphones',
    'foodstuffs': 'carrot',
    'pharmaceutical': 'pills',
    'kids': 'hat-wizard',
    'rentals': 'building',
    'service-men': 'tools',
    'student-centre': 'graduation-cap'
  };
  return icons[category] || 'box';
}

/**
 * Scroll category strip left or right
 */
window.scrollCategories = function(direction) {
  const strip = document.getElementById('categoryStrip');
  const scrollAmount = 300;
  strip.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
};

// ================= DISPLAY AUTH STATUS =================
const displayAuthStatus = (user) => {
  const authStatusDiv = document.getElementById("auth-status");
  authStatusDiv.innerHTML = "";

  if (user) {
    const logoutButton = document.createElement("button");
    logoutButton.innerText = "Logout";
    logoutButton.addEventListener("click", async () => {
      await logoutUser();
      window.location.reload();
    });

    const welcomeMessage = document.createElement("span");
    welcomeMessage.innerText = `Welcome to Oda-Pap, ${user.email}`;

    authStatusDiv.appendChild(welcomeMessage);
    authStatusDiv.appendChild(logoutButton);
  } else {
    authStatusDiv.innerHTML =
      '<a href="login.html">Login</a> | <a href="signup.html">Sign Up</a>';
  }
};

onAuthChange(displayAuthStatus);

// ================= SHARE PRODUCT =================
window.shareProduct = async function(listingId, productName, productDescription, imageUrl) {
  try {
    const shareUrl = `${window.location.origin}/product.html?id=${listingId}`;
    if (navigator.share) {
      await navigator.share({
        title: productName,
        text: productDescription,
        url: shareUrl
      });
    } else {
      const shareModal = document.createElement('div');
      shareModal.className = 'share-modal';
      shareModal.innerHTML = `
        <div class="share-modal-content">
          <h3>Share via:</h3>
          <div class="share-buttons">
            <a href="https://wa.me/?text=${encodeURIComponent(`Check out ${productName}: ${shareUrl}`)}" target="_blank">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a href="https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(productName)}" target="_blank">
              <i class="fab fa-telegram"></i> Telegram
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${productName}`)}&url=${encodeURIComponent(shareUrl)}" target="_blank">
              <i class="fab fa-twitter"></i> Twitter
            </a>
            <button onclick="copyToClipboard('${shareUrl}')">
              <i class="fas fa-copy"></i> Copy Link
            </button>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      document.body.appendChild(shareModal);
    }
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

window.copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Link copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// ================= NAVIGATION FUNCTIONS =================
window.goToUserProfile = function(userId) {
  window.location.href = `user.html?userId=${userId}`;
};

window.goToProduct = function(productId) {
  // Track product view start
  rankingEngine.startViewingProduct(productId);
  window.location.href = `product.html?id=${productId}`;
};

// Track when user leaves the page
window.addEventListener('beforeunload', () => {
  rankingEngine.endViewingProduct();
});

// ================= LOAD FEATURED LISTINGS =================
const loadFeaturedListings = async () => {
  showLoader();
  try {
    const listingsSnapshot = await getDocs(collection(firestore, "Listings"));
    const listingsContainer = document.getElementById("listings-container");
    listingsContainer.innerHTML = "";

    let allListings = [];

    for (const listingDoc of listingsSnapshot.docs) {
      const listing = listingDoc.data();
      const uploaderId = listing.uploaderId || listing.userId;
      let userData = {};

      if (uploaderId) {
        try {
          const userDoc = await getDoc(doc(firestore, "Users", uploaderId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.error(`Error fetching user data:`, error);
        }
      }

      const displayName = userData?.name || userData?.username || "Unknown User";
      const imageUrls = listing.imageUrls || [];
      const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : "images/product-placeholder.png";
      const sellerId = listing.uploaderId || listing.userId;

      allListings.push({
        id: listingDoc.id,
        ...listing,
        displayName,
        userData,
        imageUrls,
        firstImageUrl,
        sellerId
      });
    }

    // Rank listings based on user preferences
    const rankedListings = rankingEngine.rankProducts(allListings);

    rankedListings.forEach(listing => {
      const listingElement = document.createElement("div");
      listingElement.className = "listing-item";
      listingElement.innerHTML = `
        <div class="product-item">
          <div class="profile">
            <img src="${listing.userData.profilePicUrl || "images/profile-placeholder.png"}" alt="${listing.displayName}" onclick="goToUserProfile('${listing.userData.uid || listing.uploaderId}')">
            <div>
              <p><strong>${listing.displayName}</strong></p>
              <p>${listing.name}</p>
            </div>
            <div class="product-actions">
              <div>
                <i class="fas fa-comments" onclick="goToChat('${listing.sellerId}', '${listing.id}')"></i>
                <small> Message </small>
              </div>
              <div>
                <i class="fas fa-share" onclick="shareProduct('${listing.id}', '${listing.name}', '${listing.description}', '${listing.firstImageUrl}')"></i>
                <small> Share </small>
              </div>
            </div>
          </div>
          <div class="product-image-container" onclick="goToProduct('${listing.id}')">
            <div class="image-slider">
              ${listing.imageUrls.map(url => `
                <img src="${url}" alt="Product Image" class="product-image">
              `).join('')}
              <div class="product-tags">
                ${listing.subcategory ? `<span class="product-condition">${listing.subcategory}</span>` : ''}
                ${listing.brand ? `<span class="product-age">${listing.brand}</span>` : ''}
              </div>
            </div>
          </div>
          <p class="product-price">
            <strong>KES ${listing.price.toLocaleString()}</strong>
            <span class="initial-price">${listing.initialPrice ? `<s>KES ${listing.initialPrice.toLocaleString()}</s>` : ''}</span>
          </p>
          <p class="product-description">${listing.description || ''}</p>
          
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
      `;

      listingsContainer.appendChild(listingElement);
    });
    
    initializeImageSliders();
    hideLoader();

  } catch (error) {
    console.error("Error loading featured listings:", error);
    showNotification("Failed to load listings. Please try again later.", "error");
    hideLoader();
  }
};

// ...existing code for addToCart, addToWishlist, buyNow, goToChat, etc...
window.addToCart = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    try {
      await addDoc(collection(firestore, `users/${user.uid}/cart`), {
        userId: user.uid,
        listingId: listingId,
        quantity: 1,
        ...listing,
        addedAt: new Date().toISOString()
      });
      showNotification("Item added to cart!");
      await updateCartCounter(firestore, user.uid);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      showNotification("Failed to add item to cart. Please try again.");
    }
  } else {
    showNotification("Please log in to add items to the cart.", "warning");
  }
};

window.addToWishlist = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    try {
      await addDoc(collection(firestore, `users/${user.uid}/wishlist`), {
        userId: user.uid,
        listingId: listingId,
        ...listing,
        addedAt: new Date().toISOString()
      });
      showNotification("Item added to wishlist!");
      await updateWishlistCounter(firestore, user.uid);
    } catch (error) {
      console.error("Error adding item to wishlist:", error);
      showNotification("Failed to add item to wishlist. Please try again.");
    }
  } else {
    showNotification("Please log in to add items to the wishlist.", "warning");
  }
};

window.buyNow = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    try {
      // Store in cookie and redirect
      const buyNowData = {
        listingId: listingId,
        name: listing.name,
        price: listing.price,
        quantity: 1,
        photoTraceUrl: listing.photoTraceUrl,
        imageUrls: listing.imageUrls,
        brand: listing.brand,
        category: listing.category
      };

      const expires = new Date();
      expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
      document.cookie = `buyNowItem=${encodeURIComponent(JSON.stringify(buyNowData))};expires=${expires.toUTCString()};path=/`;
      
      showNotification("Proceeding to checkout!");
      window.location.href = "checkout.html?source=buynow";
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
      showNotification("Failed to proceed to checkout. Please try again.");
    }
  } else {
    showNotification("Please log in to buy items.", "warning");
  }
};

window.goToChat = function (sellerId, listingId) {
  const user = auth.currentUser;
  if (user) {
    window.location.href = `chat.html?sellerId=${sellerId}&listingId=${listingId}`;
  } else {
    showNotification("Please log in to message the seller.", "error");
  }
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", async () => {
  await loadCategoryStrip();
  await loadFeaturedListings();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await updateCartCounter(firestore, user.uid);
      await updateWishlistCounter(firestore, user.uid);
      await updateChatCounter(firestore, user.uid);
    }
  });
});
