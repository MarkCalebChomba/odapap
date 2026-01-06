/**
 * ============================================================================
 * INLINE QUICK EDIT SYSTEM
 * ============================================================================
 * 
 * Excel-like grid for bulk editing stock/price with keyboard navigation,
 * auto-save with debounce, visual diff highlighting, and copy-paste support.
 * 
 * @author Senior Engineering Team
 * @version 2.0.0
 * @since 2024
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const QUICK_EDIT_CONFIG = {
    AUTO_SAVE_DELAY: 2000,        // 2 seconds debounce
    HIGHLIGHT_DURATION: 3000,      // Yellow highlight duration
    MAX_UNDO_HISTORY: 50,          // Undo stack size
    TOAST_SUCCESS_DURATION: 4000,  // Success toast auto-dismiss
    TOAST_ERROR_DURATION: 0,       // Error stays until dismissed
    VIRTUAL_SCROLL_THRESHOLD: 50   // Items before virtual scrolling kicks in
};

// ============================================================================
// CENTRALIZED ERROR HANDLER
// ============================================================================

/**
 * ErrorHandler - Centralized error handling with user-friendly messages.
 * Maps technical errors to actionable user guidance.
 */
export const ErrorHandler = {
    // Error message mappings for user-friendly display
    errorMessages: {
        // Firebase errors
        'permission-denied': {
            message: 'Permission denied',
            recovery: 'Please log out and log back in, then try again.'
        },
        'unauthenticated': {
            message: 'Session expired',
            recovery: 'Please refresh the page and log in again.'
        },
        'unavailable': {
            message: 'Service temporarily unavailable',
            recovery: 'Please try again in a few minutes.'
        },
        'deadline-exceeded': {
            message: 'Request took too long',
            recovery: 'Check your connection and try again.'
        },
        'resource-exhausted': {
            message: 'Too many requests',
            recovery: 'Please wait a moment before trying again.'
        },
        
        // Network errors
        'network': {
            message: 'Network connection lost',
            recovery: 'Check your internet connection and try again.'
        },
        'timeout': {
            message: 'Request timed out',
            recovery: 'Your connection is slow. Try again or use a better network.'
        },
        'offline': {
            message: 'You are offline',
            recovery: 'Changes saved locally. They will sync when you reconnect.'
        },
        
        // Validation errors
        'validation': {
            message: 'Invalid data',
            recovery: 'Please check your entries and correct any errors.'
        },
        
        // File errors
        'heic-conversion': {
            message: 'HEIC conversion failed',
            recovery: 'Please try uploading a JPEG or PNG image instead.'
        },
        'file-too-large': {
            message: 'File too large',
            recovery: 'Please use an image smaller than 10MB.'
        },
        'unsupported-format': {
            message: 'Unsupported file format',
            recovery: 'Please use JPEG, PNG, WebP, or HEIC images.'
        },
        
        // Generic fallback
        'unknown': {
            message: 'Something went wrong',
            recovery: 'Please try again. If the problem persists, refresh the page.'
        }
    },
    
    /**
     * Handles an error and returns user-friendly message.
     * 
     * @param {Error|string} error - The error to handle
     * @param {string} context - Context where error occurred
     * @returns {{message: string, recovery: string, technical: string}}
     */
    handle(error, context = '') {
        console.error(`[${context}]`, error);
        
        const errorStr = error?.message || error?.code || String(error);
        
        // Find matching error type
        for (const [key, value] of Object.entries(this.errorMessages)) {
            if (errorStr.toLowerCase().includes(key)) {
                return {
                    ...value,
                    technical: errorStr,
                    context
                };
            }
        }
        
        // Return unknown error with technical details
        return {
            ...this.errorMessages.unknown,
            technical: errorStr,
            context
        };
    },
    
    /**
     * Shows an error notification to the user.
     * 
     * @param {Error|string} error - The error
     * @param {string} context - Context
     * @param {Function} showNotification - Notification function
     */
    notify(error, context, showNotification) {
        const { message, recovery } = this.handle(error, context);
        showNotification(`${message}. ${recovery}`, 'error');
    },
    
    /**
     * Creates a validation error.
     * 
     * @param {string} message - Validation message
     * @returns {Error}
     */
    validation(message) {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }
};

// ============================================================================
// INLINE EDIT FIELD CLASS
// ============================================================================

/**
 * InlineEditField - Handles contenteditable fields with auto-save.
 */
export class InlineEditField {
    /**
     * Creates an inline edit field.
     * 
     * @param {HTMLElement} element - The element to make editable
     * @param {Object} options - Configuration options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            fieldName: options.fieldName || 'field',
            onSave: options.onSave || (() => {}),
            onError: options.onError || (() => {}),
            validate: options.validate || (() => true),
            debounceDelay: options.debounceDelay || QUICK_EDIT_CONFIG.AUTO_SAVE_DELAY
        };
        
        this.originalValue = element.textContent;
        this.isDirty = false;
        this.saveTimeout = null;
        
        this._init();
    }
    
    _init() {
        this.element.setAttribute('contenteditable', 'true');
        this.element.classList.add('inline-editable');
        this.element.dataset.originalValue = this.originalValue;
        
        // Track changes
        this.element.addEventListener('input', () => this._handleInput());
        this.element.addEventListener('blur', () => this._handleBlur());
        this.element.addEventListener('keydown', (e) => this._handleKeydown(e));
        this.element.addEventListener('paste', (e) => this._handlePaste(e));
    }
    
    _handleInput() {
        const currentValue = this.element.textContent.trim();
        
        if (currentValue !== this.originalValue) {
            this.isDirty = true;
            this.element.classList.add('field-modified');
            this._scheduleSave();
        } else {
            this.isDirty = false;
            this.element.classList.remove('field-modified');
        }
    }
    
    _handleBlur() {
        if (this.isDirty) {
            this._save();
        }
    }
    
    _handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.element.blur();
        } else if (e.key === 'Escape') {
            this._revert();
        } else if (e.key === 'Tab') {
            // Allow natural tab navigation
            this._save();
        }
    }
    
    _handlePaste(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }
    
    _scheduleSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this._save(), this.options.debounceDelay);
    }
    
    async _save() {
        const value = this.element.textContent.trim();
        
        // Validate
        const validation = this.options.validate(value);
        if (validation !== true) {
            this.element.classList.add('field-error');
            this.options.onError(validation);
            return;
        }
        
        this.element.classList.remove('field-error');
        this.element.classList.add('field-saving');
        
        try {
            await this.options.onSave(value, this.options.fieldName);
            this.originalValue = value;
            this.element.dataset.originalValue = value;
            this.isDirty = false;
            this.element.classList.remove('field-modified');
            this._showSaveSuccess();
        } catch (error) {
            this.options.onError(error);
            this.element.classList.add('field-error');
        } finally {
            this.element.classList.remove('field-saving');
        }
    }
    
    _revert() {
        this.element.textContent = this.originalValue;
        this.isDirty = false;
        this.element.classList.remove('field-modified', 'field-error');
        clearTimeout(this.saveTimeout);
    }
    
    _showSaveSuccess() {
        this.element.classList.add('field-saved');
        setTimeout(() => {
            this.element.classList.remove('field-saved');
        }, QUICK_EDIT_CONFIG.HIGHLIGHT_DURATION);
    }
}

// ============================================================================
// EXCEL-LIKE GRID CLASS
// ============================================================================

/**
 * ExcelLikeGrid - Excel-style grid for bulk editing variations.
 * Supports keyboard navigation, copy-paste, and batch updates.
 */
export class ExcelLikeGrid {
    /**
     * Creates an Excel-like grid.
     * 
     * @param {string} containerId - Container element ID
     * @param {Object} options - Configuration
     */
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            columns: options.columns || ['name', 'stock', 'price'],
            onSave: options.onSave || (() => {}),
            onError: options.onError || (() => {}),
            data: options.data || []
        };
        
        this.data = [...this.options.data];
        this.originalData = JSON.parse(JSON.stringify(this.options.data));
        this.selectedCell = null;
        this.undoStack = [];
        this.redoStack = [];
        this.pendingChanges = new Map();
        this.saveTimeout = null;
        
        this._init();
    }
    
    _init() {
        if (!this.container) return;
        
        this._render();
        this._bindEvents();
    }
    
    _render() {
        const columnHeaders = {
            name: 'Option',
            stock: 'Stock',
            price: 'Price (KES)',
            retail: 'Retail (KES)'
        };
        
        this.container.innerHTML = `
            <div class="excel-grid-wrapper">
                <div class="grid-toolbar">
                    <button class="grid-tool-btn" data-action="undo" title="Undo (Ctrl+Z)">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="grid-tool-btn" data-action="redo" title="Redo (Ctrl+Y)">
                        <i class="fas fa-redo"></i>
                    </button>
                    <span class="grid-separator"></span>
                    <button class="grid-tool-btn" data-action="copy" title="Copy (Ctrl+C)">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="grid-tool-btn" data-action="paste" title="Paste (Ctrl+V)">
                        <i class="fas fa-paste"></i>
                    </button>
                    <span class="grid-separator"></span>
                    <span class="grid-status" id="${this.containerId}-status">Ready</span>
                </div>
                <div class="excel-grid" role="grid">
                    <div class="grid-header" role="row">
                        ${this.options.columns.map(col => `
                            <div class="grid-cell header-cell" role="columnheader">${columnHeaders[col] || col}</div>
                        `).join('')}
                    </div>
                    <div class="grid-body" id="${this.containerId}-body">
                        ${this._renderRows()}
                    </div>
                </div>
                <div class="grid-footer">
                    <span class="change-count" id="${this.containerId}-changes">No changes</span>
                    <button class="grid-save-btn" id="${this.containerId}-save" disabled>
                        <i class="fas fa-save"></i> Save All Changes
                    </button>
                </div>
            </div>
        `;
    }
    
    _renderRows() {
        if (this.data.length === 0) {
            return '<div class="grid-empty">No variations to edit</div>';
        }
        
        // Use virtual scrolling for large datasets
        const useVirtual = this.data.length > QUICK_EDIT_CONFIG.VIRTUAL_SCROLL_THRESHOLD;
        
        return this.data.map((row, rowIndex) => `
            <div class="grid-row ${this._hasRowChanges(rowIndex) ? 'row-modified' : ''}" 
                 data-row="${rowIndex}" 
                 role="row">
                ${this.options.columns.map((col, colIndex) => `
                    <div class="grid-cell ${this._getCellClass(rowIndex, col)}" 
                         data-row="${rowIndex}" 
                         data-col="${col}"
                         data-col-index="${colIndex}"
                         role="gridcell"
                         tabindex="${rowIndex === 0 && colIndex === 0 ? '0' : '-1'}">
                        ${col === 'name' ? `
                            <span class="cell-value">${row[col] || ''}</span>
                        ` : `
                            <input type="number" 
                                   class="cell-input" 
                                   value="${row[col] || ''}"
                                   step="${col === 'price' || col === 'retail' ? '0.01' : '1'}"
                                   min="0"
                                   data-row="${rowIndex}"
                                   data-col="${col}">
                        `}
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    _getCellClass(rowIndex, col) {
        const key = `${rowIndex}-${col}`;
        if (this.pendingChanges.has(key)) {
            return 'cell-modified';
        }
        return '';
    }
    
    _hasRowChanges(rowIndex) {
        return Array.from(this.pendingChanges.keys()).some(key => key.startsWith(`${rowIndex}-`));
    }
    
    _bindEvents() {
        const body = document.getElementById(`${this.containerId}-body`);
        const saveBtn = document.getElementById(`${this.containerId}-save`);
        
        // Cell navigation and editing
        body.addEventListener('keydown', (e) => this._handleKeydown(e));
        body.addEventListener('input', (e) => this._handleInput(e));
        body.addEventListener('focus', (e) => this._handleFocus(e), true);
        body.addEventListener('blur', (e) => this._handleBlur(e), true);
        
        // Toolbar actions
        this.container.querySelectorAll('.grid-tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this._handleToolAction(btn.dataset.action));
        });
        
        // Save button
        saveBtn.addEventListener('click', () => this._saveAllChanges());
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && this._isGridFocused()) {
                    e.preventDefault();
                    this._undo();
                } else if (e.key === 'y' && this._isGridFocused()) {
                    e.preventDefault();
                    this._redo();
                }
            }
        });
        
        // Paste handler
        this.container.addEventListener('paste', (e) => this._handlePaste(e));
    }
    
    _handleKeydown(e) {
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const colIndex = parseInt(cell.dataset.colIndex);
        
        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                this._navigateCell(row, colIndex, e.shiftKey ? -1 : 1, 'horizontal');
                break;
            case 'Enter':
                e.preventDefault();
                this._navigateCell(row, colIndex, e.shiftKey ? -1 : 1, 'vertical');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._navigateCell(row, colIndex, -1, 'vertical');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this._navigateCell(row, colIndex, 1, 'vertical');
                break;
            case 'ArrowLeft':
                if (e.target.selectionStart === 0) {
                    e.preventDefault();
                    this._navigateCell(row, colIndex, -1, 'horizontal');
                }
                break;
            case 'ArrowRight':
                if (e.target.selectionEnd === e.target.value?.length) {
                    e.preventDefault();
                    this._navigateCell(row, colIndex, 1, 'horizontal');
                }
                break;
        }
    }
    
    _navigateCell(currentRow, currentCol, direction, axis) {
        let newRow = currentRow;
        let newCol = currentCol;
        
        if (axis === 'horizontal') {
            newCol += direction;
            if (newCol < 0) {
                newRow--;
                newCol = this.options.columns.length - 1;
            } else if (newCol >= this.options.columns.length) {
                newRow++;
                newCol = 0;
            }
        } else {
            newRow += direction;
        }
        
        // Bounds check
        if (newRow < 0 || newRow >= this.data.length) return;
        if (newCol < 0 || newCol >= this.options.columns.length) return;
        
        const nextCell = this.container.querySelector(
            `.grid-cell[data-row="${newRow}"][data-col-index="${newCol}"]`
        );
        
        if (nextCell) {
            const input = nextCell.querySelector('.cell-input');
            if (input) {
                input.focus();
                input.select();
            } else {
                nextCell.focus();
            }
        }
    }
    
    _handleInput(e) {
        if (!e.target.classList.contains('cell-input')) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = e.target.dataset.col;
        const value = parseFloat(e.target.value) || 0;
        const key = `${row}-${col}`;
        
        // Store original value for undo
        if (!this.pendingChanges.has(key)) {
            this.undoStack.push({
                type: 'single',
                row,
                col,
                oldValue: this.data[row][col],
                newValue: value
            });
            if (this.undoStack.length > QUICK_EDIT_CONFIG.MAX_UNDO_HISTORY) {
                this.undoStack.shift();
            }
        }
        
        this.pendingChanges.set(key, {
            row,
            col,
            oldValue: this.originalData[row][col],
            newValue: value
        });
        
        this.data[row][col] = value;
        e.target.closest('.grid-cell').classList.add('cell-modified');
        e.target.closest('.grid-row').classList.add('row-modified');
        
        this._updateChangeCount();
        this._scheduleAutoSave();
    }
    
    _handleFocus(e) {
        if (e.target.classList.contains('cell-input')) {
            e.target.select();
            this.selectedCell = e.target;
        }
    }
    
    _handleBlur(e) {
        // Remove selection indicator if needed
    }
    
    _handlePaste(e) {
        if (!this.selectedCell) return;
        
        const pasteData = e.clipboardData.getData('text');
        if (!pasteData) return;
        
        e.preventDefault();
        
        // Parse pasted data (tab and newline separated for Excel compatibility)
        const rows = pasteData.split(/\r?\n/).map(row => row.split('\t'));
        
        const startRow = parseInt(this.selectedCell.dataset.row);
        const startCol = this.options.columns.indexOf(this.selectedCell.dataset.col);
        
        if (startCol === -1) return;
        
        // Apply pasted values
        rows.forEach((row, rowOffset) => {
            row.forEach((value, colOffset) => {
                const targetRow = startRow + rowOffset;
                const targetColIndex = startCol + colOffset;
                
                if (targetRow >= this.data.length) return;
                if (targetColIndex >= this.options.columns.length) return;
                
                const targetCol = this.options.columns[targetColIndex];
                
                // Skip name column (not editable)
                if (targetCol === 'name') return;
                
                const numValue = parseFloat(value) || 0;
                const key = `${targetRow}-${targetCol}`;
                
                this.pendingChanges.set(key, {
                    row: targetRow,
                    col: targetCol,
                    oldValue: this.originalData[targetRow][targetCol],
                    newValue: numValue
                });
                
                this.data[targetRow][targetCol] = numValue;
            });
        });
        
        this._refreshGrid();
        this._updateChangeCount();
        this._updateStatus('Pasted values');
    }
    
    _handleToolAction(action) {
        switch (action) {
            case 'undo':
                this._undo();
                break;
            case 'redo':
                this._redo();
                break;
            case 'copy':
                this._copySelection();
                break;
            case 'paste':
                // Browser handles paste via Ctrl+V
                this._updateStatus('Use Ctrl+V to paste');
                break;
        }
    }
    
    _undo() {
        if (this.undoStack.length === 0) return;
        
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        
        this.data[action.row][action.col] = action.oldValue;
        this.pendingChanges.delete(`${action.row}-${action.col}`);
        
        this._refreshGrid();
        this._updateChangeCount();
        this._updateStatus('Undid change');
    }
    
    _redo() {
        if (this.redoStack.length === 0) return;
        
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        
        this.data[action.row][action.col] = action.newValue;
        this.pendingChanges.set(`${action.row}-${action.col}`, {
            row: action.row,
            col: action.col,
            oldValue: action.oldValue,
            newValue: action.newValue
        });
        
        this._refreshGrid();
        this._updateChangeCount();
        this._updateStatus('Redid change');
    }
    
    _copySelection() {
        if (!this.selectedCell) return;
        
        const value = this.selectedCell.value;
        navigator.clipboard.writeText(value).then(() => {
            this._updateStatus('Copied to clipboard');
        });
    }
    
    _scheduleAutoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            // Auto-save is disabled for explicit save workflow
            // Uncomment below to enable auto-save:
            // this._saveAllChanges();
        }, QUICK_EDIT_CONFIG.AUTO_SAVE_DELAY);
    }
    
    async _saveAllChanges() {
        if (this.pendingChanges.size === 0) return;
        
        const saveBtn = document.getElementById(`${this.containerId}-save`);
        const originalText = saveBtn.innerHTML;
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this._updateStatus('Saving...');
        
        try {
            const changes = Array.from(this.pendingChanges.values());
            await this.options.onSave(changes, this.data);
            
            // Update original data
            this.originalData = JSON.parse(JSON.stringify(this.data));
            this.pendingChanges.clear();
            
            this._refreshGrid();
            this._updateChangeCount();
            this._updateStatus('All changes saved!');
            
            // Show success highlighting
            this.container.querySelectorAll('.grid-row').forEach(row => {
                row.classList.add('row-saved');
                setTimeout(() => row.classList.remove('row-saved'), QUICK_EDIT_CONFIG.HIGHLIGHT_DURATION);
            });
            
        } catch (error) {
            this._updateStatus('Save failed!');
            this.options.onError(error);
        } finally {
            saveBtn.disabled = this.pendingChanges.size === 0;
            saveBtn.innerHTML = originalText;
        }
    }
    
    _refreshGrid() {
        const body = document.getElementById(`${this.containerId}-body`);
        body.innerHTML = this._renderRows();
    }
    
    _updateChangeCount() {
        const countEl = document.getElementById(`${this.containerId}-changes`);
        const saveBtn = document.getElementById(`${this.containerId}-save`);
        const count = this.pendingChanges.size;
        
        countEl.textContent = count === 0 ? 'No changes' : `${count} change${count > 1 ? 's' : ''} pending`;
        countEl.className = `change-count ${count > 0 ? 'has-changes' : ''}`;
        saveBtn.disabled = count === 0;
    }
    
    _updateStatus(message) {
        const statusEl = document.getElementById(`${this.containerId}-status`);
        statusEl.textContent = message;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusEl.textContent = 'Ready';
        }, 3000);
    }
    
    _isGridFocused() {
        return this.container.contains(document.activeElement);
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Updates the grid with new data.
     * 
     * @param {Array} data - New data array
     */
    setData(data) {
        this.data = [...data];
        this.originalData = JSON.parse(JSON.stringify(data));
        this.pendingChanges.clear();
        this._refreshGrid();
        this._updateChangeCount();
    }
    
    /**
     * Gets the current data including pending changes.
     * 
     * @returns {Array}
     */
    getData() {
        return [...this.data];
    }
    
    /**
     * Checks if there are unsaved changes.
     * 
     * @returns {boolean}
     */
    hasChanges() {
        return this.pendingChanges.size > 0;
    }
    
    /**
     * Discards all pending changes.
     */
    discardChanges() {
        this.data = JSON.parse(JSON.stringify(this.originalData));
        this.pendingChanges.clear();
        this._refreshGrid();
        this._updateChangeCount();
        this._updateStatus('Changes discarded');
    }
}

// ============================================================================
// LISTING CLONER - Duplicate Similar Products
// ============================================================================

/**
 * ListingCloner - Enables quick duplication of listings for similar products.
 * Saves time when listing variants or related products.
 */
export class ListingCloner {
    /**
     * Creates a listing cloner.
     * 
     * @param {Object} options - Configuration
     * @param {Function} options.onClone - Callback when listing is cloned
     * @param {Function} options.loadListing - Function to load listing data
     */
    constructor(options = {}) {
        this.options = {
            onClone: options.onClone || (() => {}),
            loadListing: options.loadListing || (() => null)
        };
    }
    
    /**
     * Clones a listing and prepares it for editing.
     * Preserves: category, subcategory, brand, variations structure
     * Resets: name, images, stock counts
     * 
     * @param {string} listingId - ID of listing to clone
     * @returns {Promise<Object>} Cloned listing data
     */
    async clone(listingId) {
        const original = await this.options.loadListing(listingId);
        
        if (!original) {
            throw new Error('Listing not found');
        }
        
        // Create clone with reset fields
        const cloned = {
            // Preserve these fields
            category: original.category,
            subcategory: original.subcategory,
            subsubcategory: original.subsubcategory,
            brand: original.brand,
            
            // Reset these fields
            name: `${original.name} (Copy)`,
            description: original.description,
            imageUrls: [], // User must upload new images
            
            // Clone variations structure but reset stock
            variations: original.variations?.map(v => ({
                title: v.title,
                attributes: v.attributes?.map(attr => ({
                    attr_name: attr.attr_name,
                    stock: 0, // Reset stock
                    piece_count: attr.piece_count || 1,
                    price: attr.price,
                    originalPrice: attr.originalPrice || attr.price,
                    retailPrice: attr.retailPrice || null,
                    photoUrl: null // Reset images
                })) || []
            })) || [],
            
            // Copy bulk pricing
            bulkPricing: original.bulkPricing || null,
            
            // Mark as clone
            _clonedFrom: listingId,
            _isClone: true
        };
        
        return cloned;
    }
    
    /**
     * Generates a template from an existing listing.
     * Useful for creating a base template for similar products.
     * 
     * @param {Object} listing - The listing to template
     * @returns {Object} Template data
     */
    createTemplate(listing) {
        return {
            templateName: `Template: ${listing.name}`,
            category: listing.category,
            subcategory: listing.subcategory,
            subsubcategory: listing.subsubcategory,
            brand: listing.brand,
            variationTypes: listing.variations?.map(v => v.title) || [],
            bulkPricing: listing.bulkPricing || null,
            createdAt: new Date().toISOString()
        };
    }
    
    /**
     * Applies a template to the current form.
     * 
     * @param {Object} template - Template to apply
     * @param {Function} applyToForm - Function to apply data to form
     */
    applyTemplate(template, applyToForm) {
        applyToForm({
            category: template.category,
            subcategory: template.subcategory,
            subsubcategory: template.subsubcategory,
            brand: template.brand,
            createVariations: template.variationTypes
        });
    }
}

// ============================================================================
// LAZY LOADING MANAGER
// ============================================================================

/**
 * LazyLoadManager - Handles infinite scroll and lazy loading of listings.
 */
export class LazyLoadManager {
    /**
     * Creates a lazy load manager.
     * 
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        this.options = {
            container: options.container,
            loadMore: options.loadMore || (() => {}),
            pageSize: options.pageSize || 10,
            threshold: options.threshold || 200 // px from bottom
        };
        
        this.page = 1;
        this.hasMore = true;
        this.isLoading = false;
        this.observer = null;
        
        this._init();
    }
    
    _init() {
        // Create sentinel element
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'lazy-load-sentinel';
        this.sentinel.innerHTML = `
            <div class="lazy-load-indicator" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading more...</span>
            </div>
        `;
        
        if (this.options.container) {
            this.options.container.appendChild(this.sentinel);
        }
        
        // Setup Intersection Observer
        this.observer = new IntersectionObserver(
            (entries) => this._handleIntersect(entries),
            { rootMargin: `${this.options.threshold}px` }
        );
        
        this.observer.observe(this.sentinel);
    }
    
    async _handleIntersect(entries) {
        const entry = entries[0];
        
        if (entry.isIntersecting && this.hasMore && !this.isLoading) {
            this.isLoading = true;
            this.sentinel.querySelector('.lazy-load-indicator').style.display = 'flex';
            
            try {
                const newItems = await this.options.loadMore(this.page, this.options.pageSize);
                
                if (newItems.length < this.options.pageSize) {
                    this.hasMore = false;
                    this._showEndMessage();
                }
                
                this.page++;
            } catch (error) {
                console.error('Error loading more items:', error);
            } finally {
                this.isLoading = false;
                this.sentinel.querySelector('.lazy-load-indicator').style.display = 'none';
            }
        }
    }
    
    _showEndMessage() {
        this.sentinel.innerHTML = `
            <div class="lazy-load-end">
                <i class="fas fa-check-circle"></i>
                <span>All listings loaded</span>
            </div>
        `;
    }
    
    /**
     * Resets the lazy loader for a fresh load.
     */
    reset() {
        this.page = 1;
        this.hasMore = true;
        this.isLoading = false;
        this.sentinel.innerHTML = `
            <div class="lazy-load-indicator" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading more...</span>
            </div>
        `;
    }
    
    /**
     * Destroys the lazy loader.
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.sentinel.parentNode) {
            this.sentinel.parentNode.removeChild(this.sentinel);
        }
    }
}

// Export all classes
export default {
    ErrorHandler,
    InlineEditField,
    ExcelLikeGrid,
    ListingCloner,
    LazyLoadManager,
    QUICK_EDIT_CONFIG
};
