import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, deleteDoc, addDoc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { app } from './js/firebase.js';
import { showNotification } from './notifications.js';

const auth = getAuth(app);
const firestore = getFirestore(app);

const cartItemsContainer = document.getElementById('cart-items');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');

class CartManager {
    constructor() {
        this.cartItems = new Map(); // Use Map for better item management
        this.user = null;
    }

    // Update cart icon with item count
    updateCartIcon(count) {
        const cartIcon = document.getElementById('cart-icon');
        let notification = cartIcon.querySelector('.cart-notification');
        
        if (!notification) {
            notification = document.createElement('span');
            notification.className = 'cart-notification';
            cartIcon.appendChild(notification);
        }
        
        notification.textContent = count;
        notification.style.display = count > 0 ? 'flex' : 'none';
    }

    // Load cart items from Firestore
    async loadCartItems(user) {
        if (!user) {
            showNotification('Please log in to view your cart.');
            return;
        }

        try {
            const cartSnapshot = await getDocs(collection(firestore, `users/${user.uid}/cart`));
            this.cartItems.clear();
            
            cartItemsContainer.innerHTML = '';

            if (cartSnapshot.empty) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
                totalPriceElement.textContent = 'KES 0.00';
                this.updateCartIcon(0);
                checkoutButton.disabled = true;
                return;
            }

            // Process cart items
            cartSnapshot.forEach(docSnap => {
                const item = docSnap.data();
                const itemKey = this.generateItemKey(item);
                
                if (this.cartItems.has(itemKey)) {
                    const existing = this.cartItems.get(itemKey);
                    existing.quantity += (item.quantity || 1);
                    existing.docIds.push(docSnap.id);
                } else {
                    this.cartItems.set(itemKey, {
                        docId: docSnap.id,
                        docIds: [docSnap.id],
                        listingId: item.listingId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity || 1,
                        selectedVariation: item.selectedVariation || null,
                        imageUrl: item.photoTraceUrl || item.imageUrls?.[0] || 'images/placeholder.png',
                        ...item
                    });
                }
            });

            this.displayCartItems();
            this.updateTotals();
            checkoutButton.disabled = false;

        } catch (error) {
            console.error('Error loading cart items:', error);
            showNotification('Error loading cart items');
        }
    }

    generateItemKey(item) {
        // Generate unique key including variation if present
        const variationKey = item.selectedVariation ? 
            `-${item.selectedVariation.attr_name}` : '';
        return `${item.listingId}${variationKey}`;
    }

    displayCartItems() {
        cartItemsContainer.innerHTML = '';

        this.cartItems.forEach((item, itemKey) => {
            const itemTotal = item.price * item.quantity;
            
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.dataset.itemKey = itemKey;
            
            cartItemEl.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    ${item.selectedVariation ? `
                        <p class="item-variation">
                            <strong>${item.selectedVariation.title}:</strong> ${item.selectedVariation.attr_name}
                        </p>
                    ` : ''}
                    <div class="quantity-controls">
                        <label>Quantity:</label>
                        <button class="qty-btn minus" data-action="decrease" data-key="${itemKey}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="qty-btn plus" data-action="increase" data-key="${itemKey}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <p class="item-price">
                        <span>Price:</span>
                        <span>KES ${item.price.toLocaleString()} × ${item.quantity}</span>
                    </p>
                    <p class="item-total">
                        <strong>Total:</strong>
                        <strong>KES ${itemTotal.toLocaleString()}</strong>
                    </p>
                    <button class="remove-btn" data-key="${itemKey}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;

            // Add click to view product (except on buttons)
            cartItemEl.addEventListener('click', (e) => {
                if (!e.target.closest('.qty-btn') && !e.target.closest('.remove-btn')) {
                    window.location.href = `product.html?id=${item.listingId}`;
                }
            });

            cartItemsContainer.appendChild(cartItemEl);
        });

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Quantity controls
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const itemKey = btn.dataset.key;
                this.updateQuantity(itemKey, action);
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemKey = btn.dataset.key;
                this.removeItem(itemKey);
            });
        });
    }

    async updateQuantity(itemKey, action) {
        const item = this.cartItems.get(itemKey);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease' && item.quantity > 1) {
            item.quantity -= 1;
        } else if (action === 'decrease' && item.quantity === 1) {
            // If decreasing to 0, remove item instead
            this.removeItem(itemKey);
            return;
        }

        // Update in Firestore
        await this.syncQuantityToFirestore(item);

        // Update display
        this.displayCartItems();
        this.updateTotals();
    }

    async syncQuantityToFirestore(item) {
        try {
            // Update the first document with the new quantity
            const docRef = doc(firestore, `users/${this.user.uid}/cart/${item.docId}`);
            await updateDoc(docRef, {
                quantity: item.quantity
            });

            // If there are duplicate documents (from old logic), remove them
            if (item.docIds.length > 1) {
                for (let i = 1; i < item.docIds.length; i++) {
                    await deleteDoc(doc(firestore, `users/${this.user.uid}/cart/${item.docIds[i]}`));
                }
                item.docIds = [item.docId]; // Keep only the first one
            }
        } catch (error) {
            console.error('Error syncing quantity:', error);
        }
    }

    async removeItem(itemKey) {
        if (!confirm('Remove this item from cart?')) return;

        const item = this.cartItems.get(itemKey);
        if (!item) return;

        try {
            // Delete all associated documents
            for (const docId of item.docIds) {
                await deleteDoc(doc(firestore, `users/${this.user.uid}/cart/${docId}`));
            }

            this.cartItems.delete(itemKey);
            this.displayCartItems();
            this.updateTotals();
            showNotification('Item removed from cart');

            // Check if cart is empty
            if (this.cartItems.size === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
                checkoutButton.disabled = true;
            }
        } catch (error) {
            console.error('Error removing item:', error);
            showNotification('Error removing item');
        }
    }

    updateTotals() {
        let total = 0;
        let itemCount = 0;

        this.cartItems.forEach(item => {
            total += item.price * item.quantity;
            itemCount += item.quantity;
        });

        totalPriceElement.textContent = `KES ${total.toLocaleString()}`;
        this.updateCartIcon(itemCount);
    }

    async addToCart(listingId) {
        if (!this.user) {
            showNotification('Please log in to add items to cart');
            return;
        }

        try {
            const listingRef = doc(firestore, `Listings/${listingId}`);
            const snapshot = await getDoc(listingRef);
            
            if (!snapshot.exists()) {
                showNotification('Product not found');
                return;
            }

            const listing = snapshot.data();

            // Check if item already exists
            const itemKey = this.generateItemKey({ listingId, selectedVariation: null });
            const existingItem = this.cartItems.get(itemKey);

            if (existingItem) {
                // Update quantity
                existingItem.quantity += 1;
                await this.syncQuantityToFirestore(existingItem);
            } else {
                // Add new item
                await addDoc(collection(firestore, `users/${this.user.uid}/cart`), {
                    userId: this.user.uid,
                    listingId: listingId,
                    quantity: 1,
                    ...listing,
                    addedAt: new Date().toISOString()
                });
            }

            showNotification('Item added to cart!');
            await this.loadCartItems(this.user);

        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add item to cart');
        }
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        cartManager.user = user;
        cartManager.loadCartItems(user);
    } else {
        showNotification('Please log in to view your cart');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// Checkout button
checkoutButton.addEventListener('click', () => {
    if (auth.currentUser && cartManager.cartItems.size > 0) {
        window.location.href = 'checkout.html?source=cart';
    } else if (!auth.currentUser) {
        showNotification('Please log in to checkout');
    } else {
        showNotification('Your cart is empty');
    }
});

// Export for use in other pages
window.addToCart = (listingId) => cartManager.addToCart(listingId);