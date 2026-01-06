/**
 * ============================================================================
 * UNIFIED MULTI-IMAGE UPLOADER MODULE
 * ============================================================================
 * 
 * Production-ready image upload system for wholesale sellers in Kenya.
 * Handles drag-drop, crop/rotate, HEIC conversion, mobile camera access,
 * and image reordering with offline-first architecture.
 * 
 * @author Senior Engineering Team
 * @version 2.0.0
 * @since 2024
 */

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

const IMAGE_CONFIG = {
    MAX_FILES: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    THUMBNAIL_SIZE: 200,
    PREVIEW_SIZE: 800,
    FULL_SIZE: 1200,
    COMPRESSION_QUALITY: 0.85,
    FILENAME_MAX_LENGTH: 50
};

// Character blacklist for filename sanitization
const FILENAME_BLACKLIST = /[()[\]{}<>:"/\\|?*@#$%^&!~`+\u0000-\u001f\u007f-\u009f]/g;

// ============================================================================
// FILENAME SANITIZATION
// ============================================================================

/**
 * Sanitizes a filename by removing special characters and adding timestamp.
 * Ensures unique, safe filenames for storage.
 * 
 * @param {string} originalName - The original filename
 * @param {string} prefix - Optional prefix for the filename
 * @returns {string} Sanitized filename in format: "product-name_timestamp.jpg"
 * 
 * @example
 * sanitizeFilename("My Product (NEW).heic") => "my-product-new_1704470400000.jpg"
 */
export function sanitizeFilename(originalName, prefix = 'product') {
    if (!originalName || typeof originalName !== 'string') {
        return `${prefix}_${Date.now()}.jpg`;
    }

    // Extract name without extension
    const lastDot = originalName.lastIndexOf('.');
    const nameWithoutExt = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
    
    // Clean the name
    let cleanName = nameWithoutExt
        .toLowerCase()
        .replace(FILENAME_BLACKLIST, '') // Remove blacklisted chars
        .replace(/\s+/g, '-')            // Spaces to hyphens
        .replace(/-+/g, '-')             // Multiple hyphens to single
        .replace(/^-|-$/g, '')           // Trim hyphens from edges
        .substring(0, IMAGE_CONFIG.FILENAME_MAX_LENGTH);
    
    // Ensure we have something
    if (!cleanName) {
        cleanName = prefix;
    }
    
    // Add timestamp for uniqueness
    return `${cleanName}_${Date.now()}.jpg`;
}

// ============================================================================
// HEIC/WEBP CONVERSION (Uses Canvas API)
// ============================================================================

/**
 * Converts HEIC/HEIF images to JPEG using heic2any library or Canvas fallback.
 * HEIC is common on iOS devices but not supported by most browsers.
 * 
 * @param {File} file - The HEIC/HEIF file to convert
 * @returns {Promise<Blob>} JPEG blob
 * @throws {Error} When conversion fails - suggests alternative formats
 */
export async function convertHeicToJpeg(file) {
    // Check if heic2any is available (loaded via CDN in HTML)
    if (typeof heic2any !== 'undefined') {
        try {
            const blob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: IMAGE_CONFIG.COMPRESSION_QUALITY
            });
            return blob;
        } catch (error) {
            console.error('heic2any conversion failed:', error);
            throw new Error('HEIC conversion failed - please try uploading a JPEG or PNG instead');
        }
    }
    
    // Fallback: try using native browser support (Safari may support HEIC)
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('HEIC conversion failed - try JPEG/PNG instead'));
                        }
                    },
                    'image/jpeg',
                    IMAGE_CONFIG.COMPRESSION_QUALITY
                );
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(new Error('HEIC format not supported on this device - try JPEG/PNG'));
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('HEIC format not supported - please use JPEG or PNG'));
        };
        
        img.src = url;
    });
}

/**
 * Converts WebP images to JPEG for broader compatibility.
 * Some older Android WebViews may have WebP issues.
 * 
 * @param {File} file - The WebP file to convert
 * @returns {Promise<Blob>} JPEG blob
 */
export async function convertWebpToJpeg(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF'; // White background for transparency
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    resolve(blob || file);
                },
                'image/jpeg',
                IMAGE_CONFIG.COMPRESSION_QUALITY
            );
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file); // Fallback to original
        };
        
        img.src = url;
    });
}

// ============================================================================
// IMAGE PROCESSING (Resize, Compress, Crop, Rotate)
// ============================================================================

/**
 * Creates multiple sizes of an image for progressive loading.
 * Generates thumbnail (200px), preview (800px), and full (1200px) versions.
 * 
 * @param {File|Blob} file - The image file to process
 * @returns {Promise<{thumbnail: Blob, preview: Blob, full: Blob}>}
 */
export async function generateImageSizes(file) {
    const img = await loadImageFromFile(file);
    
    return {
        thumbnail: await resizeImage(img, IMAGE_CONFIG.THUMBNAIL_SIZE, 0.7),
        preview: await resizeImage(img, IMAGE_CONFIG.PREVIEW_SIZE, 0.8),
        full: await resizeImage(img, IMAGE_CONFIG.FULL_SIZE, IMAGE_CONFIG.COMPRESSION_QUALITY)
    };
}

/**
 * Loads an image from a File/Blob into an Image element.
 * 
 * @param {File|Blob} file - The file to load
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio.
 * 
 * @param {HTMLImageElement} img - The loaded image
 * @param {number} maxSize - Maximum width or height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>}
 */
function resizeImage(img, maxSize, quality) {
    return new Promise((resolve) => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            quality
        );
    });
}

/**
 * Rotates an image by specified degrees.
 * 
 * @param {Blob} imageBlob - The image to rotate
 * @param {number} degrees - Rotation degrees (90, 180, 270, -90)
 * @returns {Promise<Blob>}
 */
export async function rotateImage(imageBlob, degrees) {
    const img = await loadImageFromBlob(imageBlob);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Swap dimensions for 90/270 degree rotations
    if (degrees === 90 || degrees === 270 || degrees === -90) {
        canvas.width = img.height;
        canvas.height = img.width;
    } else {
        canvas.width = img.width;
        canvas.height = img.height;
    }
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            IMAGE_CONFIG.COMPRESSION_QUALITY
        );
    });
}

/**
 * Loads an image from a Blob.
 * 
 * @param {Blob} blob - The blob to load
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

/**
 * Crops an image to specified coordinates.
 * 
 * @param {Blob} imageBlob - The image to crop
 * @param {Object} cropData - Crop coordinates {x, y, width, height}
 * @returns {Promise<Blob>}
 */
export async function cropImage(imageBlob, { x, y, width, height }) {
    const img = await loadImageFromBlob(imageBlob);
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            IMAGE_CONFIG.COMPRESSION_QUALITY
        );
    });
}

// ============================================================================
// UNIFIED UPLOADER CLASS
// ============================================================================

/**
 * UnifiedImageUploader - Main class for the multi-image uploader component.
 * Handles drag-drop, file selection, image editing, and reordering.
 * 
 * @class
 * @example
 * const uploader = new UnifiedImageUploader('container-id', {
 *     maxFiles: 5,
 *     onImagesChange: (images) => console.log('Images:', images)
 * });
 */
export class UnifiedImageUploader {
    /**
     * Creates a new image uploader instance.
     * 
     * @param {string} containerId - DOM ID of the container element
     * @param {Object} options - Configuration options
     * @param {number} options.maxFiles - Maximum number of files (default: 5)
     * @param {Function} options.onImagesChange - Callback when images change
     * @param {Function} options.onError - Error callback
     */
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            maxFiles: options.maxFiles || IMAGE_CONFIG.MAX_FILES,
            onImagesChange: options.onImagesChange || (() => {}),
            onError: options.onError || ((err) => console.error(err))
        };
        
        // Image storage: array of {id, file, blob, dataUrl, thumbnail}
        this.images = [];
        this.draggedItem = null;
        this.isProcessing = false;
        
        // Editor state
        this.editorOpen = false;
        this.currentEditIndex = null;
        
        this._init();
    }
    
    /**
     * Initializes the uploader UI and event listeners.
     * @private
     */
    _init() {
        if (!this.container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }
        
        this._render();
        this._bindEvents();
    }
    
    /**
     * Renders the uploader HTML structure.
     * @private
     */
    _render() {
        this.container.innerHTML = `
            <div class="unified-uploader">
                <!-- Drop Zone -->
                <div class="uploader-dropzone" id="${this.containerId}-dropzone">
                    <div class="dropzone-content">
                        <div class="dropzone-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <h4>Drag & drop your images here</h4>
                        <p class="dropzone-hint">or click to browse</p>
                        <div class="dropzone-formats">
                            <span>Supports: JPEG, PNG, WebP, HEIC</span>
                            <span class="format-divider">•</span>
                            <span>Max ${this.options.maxFiles} images</span>
                        </div>
                    </div>
                    <input type="file" 
                           id="${this.containerId}-input" 
                           accept="image/*,.heic,.heif"
                           multiple
                           class="uploader-file-input">
                </div>
                
                <!-- Mobile Camera Button -->
                <div class="uploader-camera-btn" id="${this.containerId}-camera">
                    <i class="fas fa-camera"></i>
                    <span>Take Photo</span>
                </div>
                
                <!-- Image Grid (Sortable) -->
                <div class="uploader-preview-grid" id="${this.containerId}-grid">
                    <!-- Images will be rendered here -->
                </div>
                
                <!-- Image Counter -->
                <div class="uploader-counter" id="${this.containerId}-counter">
                    <span class="counter-current">0</span>
                    <span class="counter-separator">/</span>
                    <span class="counter-max">${this.options.maxFiles}</span>
                    <span class="counter-label">images</span>
                </div>
                
                <!-- Processing Indicator -->
                <div class="uploader-processing" id="${this.containerId}-processing" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Processing images...</span>
                </div>
            </div>
            
            <!-- Image Editor Modal -->
            <div class="image-editor-modal" id="${this.containerId}-editor" style="display: none;">
                <div class="editor-backdrop"></div>
                <div class="editor-container">
                    <div class="editor-header">
                        <h4><i class="fas fa-edit"></i> Edit Image</h4>
                        <button class="editor-close-btn" id="${this.containerId}-editor-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="editor-canvas-container">
                        <canvas id="${this.containerId}-canvas"></canvas>
                    </div>
                    <div class="editor-tools">
                        <button class="editor-tool-btn" data-action="rotate-left" title="Rotate Left">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="editor-tool-btn" data-action="rotate-right" title="Rotate Right">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="editor-tool-btn" data-action="crop" title="Crop">
                            <i class="fas fa-crop-alt"></i>
                        </button>
                        <button class="editor-tool-btn" data-action="brightness" title="Brightness">
                            <i class="fas fa-sun"></i>
                        </button>
                    </div>
                    <div class="editor-actions">
                        <button class="editor-btn editor-btn-cancel" id="${this.containerId}-editor-cancel">
                            Cancel
                        </button>
                        <button class="editor-btn editor-btn-save" id="${this.containerId}-editor-save">
                            <i class="fas fa-check"></i> Apply Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Binds all event listeners.
     * @private
     */
    _bindEvents() {
        const dropzone = document.getElementById(`${this.containerId}-dropzone`);
        const fileInput = document.getElementById(`${this.containerId}-input`);
        const cameraBtn = document.getElementById(`${this.containerId}-camera`);
        const grid = document.getElementById(`${this.containerId}-grid`);
        
        // Drag & Drop events
        dropzone.addEventListener('dragover', (e) => this._handleDragOver(e));
        dropzone.addEventListener('dragleave', (e) => this._handleDragLeave(e));
        dropzone.addEventListener('drop', (e) => this._handleDrop(e));
        dropzone.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
        
        // Camera button (mobile)
        cameraBtn.addEventListener('click', () => this._openCamera());
        
        // Grid drag reordering
        grid.addEventListener('dragstart', (e) => this._handleImageDragStart(e));
        grid.addEventListener('dragover', (e) => this._handleImageDragOver(e));
        grid.addEventListener('drop', (e) => this._handleImageDrop(e));
        grid.addEventListener('dragend', (e) => this._handleImageDragEnd(e));
        
        // Editor events
        this._bindEditorEvents();
    }
    
    /**
     * Binds image editor events.
     * @private
     */
    _bindEditorEvents() {
        const editor = document.getElementById(`${this.containerId}-editor`);
        const closeBtn = document.getElementById(`${this.containerId}-editor-close`);
        const cancelBtn = document.getElementById(`${this.containerId}-editor-cancel`);
        const saveBtn = document.getElementById(`${this.containerId}-editor-save`);
        
        closeBtn.addEventListener('click', () => this._closeEditor());
        cancelBtn.addEventListener('click', () => this._closeEditor());
        saveBtn.addEventListener('click', () => this._saveEditorChanges());
        
        // Tool buttons
        editor.querySelectorAll('.editor-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this._handleEditorAction(action);
            });
        });
        
        // Close on backdrop click
        editor.querySelector('.editor-backdrop').addEventListener('click', () => this._closeEditor());
    }
    
    // ========================================================================
    // DRAG & DROP HANDLERS
    // ========================================================================
    
    _handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dropzone-active');
    }
    
    _handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dropzone-active');
    }
    
    async _handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dropzone-active');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        await this._processFiles(files);
    }
    
    async _handleFileSelect(e) {
        const files = Array.from(e.target.files);
        await this._processFiles(files);
        e.target.value = ''; // Reset for same file selection
    }
    
    // ========================================================================
    // FILE PROCESSING
    // ========================================================================
    
    /**
     * Processes selected files - validates, converts, compresses.
     * 
     * @param {File[]} files - Array of selected files
     * @private
     */
    async _processFiles(files) {
        if (this.isProcessing) return;
        
        // Check capacity
        const remainingSlots = this.options.maxFiles - this.images.length;
        if (remainingSlots <= 0) {
            this.options.onError(`Maximum ${this.options.maxFiles} images allowed`);
            return;
        }
        
        const filesToProcess = files.slice(0, remainingSlots);
        if (filesToProcess.length < files.length) {
            this.options.onError(`Only ${remainingSlots} more image(s) can be added`);
        }
        
        this._showProcessing(true);
        this.isProcessing = true;
        
        for (const file of filesToProcess) {
            try {
                await this._processSingleFile(file);
            } catch (error) {
                this.options.onError(error.message);
            }
        }
        
        this._showProcessing(false);
        this.isProcessing = false;
        this._renderGrid();
        this._updateCounter();
        this.options.onImagesChange(this.getImages());
    }
    
    /**
     * Processes a single file.
     * 
     * @param {File} file - The file to process
     * @private
     */
    async _processSingleFile(file) {
        // Validate file size
        if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
            throw new Error(`${file.name} is too large (max 10MB)`);
        }
        
        // Validate file type
        const isValidType = IMAGE_CONFIG.ACCEPTED_TYPES.some(type => 
            file.type.toLowerCase().includes(type.replace('image/', ''))
        ) || file.name.toLowerCase().match(/\.(heic|heif)$/);
        
        if (!isValidType) {
            throw new Error(`${file.name} is not a supported image format`);
        }
        
        let processedBlob = file;
        
        // Convert HEIC to JPEG
        if (file.type.includes('heic') || file.type.includes('heif') || 
            file.name.toLowerCase().match(/\.(heic|heif)$/)) {
            processedBlob = await convertHeicToJpeg(file);
        }
        // Convert WebP to JPEG for consistency
        else if (file.type.includes('webp')) {
            processedBlob = await convertWebpToJpeg(file);
        }
        
        // Generate sizes
        const sizes = await generateImageSizes(processedBlob);
        
        // Create data URL for preview
        const dataUrl = await this._blobToDataUrl(sizes.preview);
        const thumbnailUrl = await this._blobToDataUrl(sizes.thumbnail);
        
        // Create image object
        const imageObj = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            originalFile: file,
            originalName: file.name,
            sanitizedName: sanitizeFilename(file.name),
            blob: sizes.full,
            thumbnail: sizes.thumbnail,
            preview: sizes.preview,
            dataUrl: dataUrl,
            thumbnailUrl: thumbnailUrl,
            size: sizes.full.size,
            timestamp: Date.now()
        };
        
        this.images.push(imageObj);
    }
    
    /**
     * Converts a Blob to Data URL.
     * 
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>}
     * @private
     */
    _blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // ========================================================================
    // CAMERA ACCESS (Mobile)
    // ========================================================================
    
    /**
     * Opens the device camera for direct photo capture.
     * @private
     */
    _openCamera() {
        const fileInput = document.getElementById(`${this.containerId}-input`);
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
        // Remove capture attribute after to allow gallery selection later
        setTimeout(() => fileInput.removeAttribute('capture'), 1000);
    }
    
    // ========================================================================
    // GRID RENDERING & REORDERING
    // ========================================================================
    
    /**
     * Renders the image preview grid.
     * @private
     */
    _renderGrid() {
        const grid = document.getElementById(`${this.containerId}-grid`);
        
        if (this.images.length === 0) {
            grid.innerHTML = '';
            return;
        }
        
        grid.innerHTML = this.images.map((img, index) => `
            <div class="preview-item ${index === 0 ? 'primary-image' : ''}" 
                 data-id="${img.id}" 
                 data-index="${index}"
                 draggable="true">
                <img src="${img.thumbnailUrl}" alt="Preview ${index + 1}">
                <div class="preview-overlay">
                    <span class="preview-badge">${index === 0 ? 'Main' : index + 1}</span>
                    <div class="preview-actions">
                        <button class="preview-action-btn" data-action="edit" data-index="${index}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="preview-action-btn preview-delete" data-action="delete" data-index="${index}" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="preview-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
            </div>
        `).join('');
        
        // Bind action buttons
        grid.querySelectorAll('.preview-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const index = parseInt(btn.dataset.index);
                
                if (action === 'edit') {
                    this._openEditor(index);
                } else if (action === 'delete') {
                    this._removeImage(index);
                }
            });
        });
    }
    
    /**
     * Handles drag start for reordering.
     * @private
     */
    _handleImageDragStart(e) {
        if (!e.target.classList.contains('preview-item')) return;
        
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * Handles drag over for reordering.
     * @private
     */
    _handleImageDragOver(e) {
        e.preventDefault();
        const afterElement = this._getDragAfterElement(e.clientX);
        const grid = document.getElementById(`${this.containerId}-grid`);
        
        if (afterElement === null) {
            grid.appendChild(this.draggedItem);
        } else {
            grid.insertBefore(this.draggedItem, afterElement);
        }
    }
    
    /**
     * Handles drop for reordering.
     * @private
     */
    _handleImageDrop(e) {
        e.preventDefault();
        if (!this.draggedItem) return;
        
        // Reorder the images array
        const newOrder = Array.from(document.getElementById(`${this.containerId}-grid`).children)
            .map(item => item.dataset.id);
        
        this.images = newOrder.map(id => this.images.find(img => img.id === id));
        this._renderGrid();
        this.options.onImagesChange(this.getImages());
    }
    
    /**
     * Handles drag end.
     * @private
     */
    _handleImageDragEnd(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }
        this.draggedItem = null;
    }
    
    /**
     * Gets the element to insert after during drag.
     * @private
     */
    _getDragAfterElement(x) {
        const grid = document.getElementById(`${this.containerId}-grid`);
        const draggables = Array.from(grid.querySelectorAll('.preview-item:not(.dragging)'));
        
        return draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // ========================================================================
    // IMAGE REMOVAL
    // ========================================================================
    
    /**
     * Removes an image from the uploader.
     * 
     * @param {number} index - Index of image to remove
     * @private
     */
    _removeImage(index) {
        this.images.splice(index, 1);
        this._renderGrid();
        this._updateCounter();
        this.options.onImagesChange(this.getImages());
    }
    
    // ========================================================================
    // IMAGE EDITOR
    // ========================================================================
    
    /**
     * Opens the image editor for a specific image.
     * 
     * @param {number} index - Index of image to edit
     * @private
     */
    async _openEditor(index) {
        this.currentEditIndex = index;
        this.editorOpen = true;
        
        const editor = document.getElementById(`${this.containerId}-editor`);
        const canvas = document.getElementById(`${this.containerId}-canvas`);
        const ctx = canvas.getContext('2d');
        
        const img = await loadImageFromBlob(this.images[index].preview);
        
        // Size canvas to image
        const maxWidth = Math.min(600, window.innerWidth - 40);
        const maxHeight = Math.min(400, window.innerHeight - 200);
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Store original for reset
        canvas.dataset.originalData = canvas.toDataURL('image/jpeg');
        canvas.dataset.rotation = '0';
        
        editor.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Closes the image editor.
     * @private
     */
    _closeEditor() {
        const editor = document.getElementById(`${this.containerId}-editor`);
        editor.style.display = 'none';
        document.body.style.overflow = '';
        this.editorOpen = false;
        this.currentEditIndex = null;
    }
    
    /**
     * Handles editor tool actions.
     * 
     * @param {string} action - The action to perform
     * @private
     */
    async _handleEditorAction(action) {
        const canvas = document.getElementById(`${this.containerId}-canvas`);
        const ctx = canvas.getContext('2d');
        let rotation = parseInt(canvas.dataset.rotation) || 0;
        
        if (action === 'rotate-left') {
            rotation = (rotation - 90) % 360;
            await this._rotateCanvas(canvas, -90);
            canvas.dataset.rotation = rotation;
        } else if (action === 'rotate-right') {
            rotation = (rotation + 90) % 360;
            await this._rotateCanvas(canvas, 90);
            canvas.dataset.rotation = rotation;
        }
        // Crop and brightness can be implemented with more complex UI
    }
    
    /**
     * Rotates the editor canvas.
     * 
     * @param {HTMLCanvasElement} canvas - The canvas to rotate
     * @param {number} degrees - Degrees to rotate
     * @private
     */
    async _rotateCanvas(canvas, degrees) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create temp canvas with current image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        
        // Swap dimensions for 90° rotations
        if (Math.abs(degrees) === 90) {
            const temp = canvas.width;
            canvas.width = canvas.height;
            canvas.height = temp;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
        ctx.restore();
    }
    
    /**
     * Saves editor changes to the image.
     * @private
     */
    async _saveEditorChanges() {
        if (this.currentEditIndex === null) return;
        
        const canvas = document.getElementById(`${this.containerId}-canvas`);
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', IMAGE_CONFIG.COMPRESSION_QUALITY);
        });
        
        // Update image in array
        const dataUrl = await this._blobToDataUrl(blob);
        const sizes = await generateImageSizes(blob);
        const thumbnailUrl = await this._blobToDataUrl(sizes.thumbnail);
        
        this.images[this.currentEditIndex] = {
            ...this.images[this.currentEditIndex],
            blob: sizes.full,
            preview: sizes.preview,
            thumbnail: sizes.thumbnail,
            dataUrl: dataUrl,
            thumbnailUrl: thumbnailUrl,
            edited: true
        };
        
        this._closeEditor();
        this._renderGrid();
        this.options.onImagesChange(this.getImages());
    }
    
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    
    /**
     * Shows/hides the processing indicator.
     * @private
     */
    _showProcessing(show) {
        const processing = document.getElementById(`${this.containerId}-processing`);
        processing.style.display = show ? 'flex' : 'none';
    }
    
    /**
     * Updates the image counter display.
     * @private
     */
    _updateCounter() {
        const counter = document.getElementById(`${this.containerId}-counter`);
        counter.querySelector('.counter-current').textContent = this.images.length;
        
        // Visual feedback when full
        if (this.images.length >= this.options.maxFiles) {
            counter.classList.add('counter-full');
        } else {
            counter.classList.remove('counter-full');
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Gets all images in the uploader.
     * 
     * @returns {Array<{blob: Blob, dataUrl: string, name: string}>}
     */
    getImages() {
        return this.images.map(img => ({
            blob: img.blob,
            dataUrl: img.dataUrl,
            name: img.sanitizedName,
            originalName: img.originalName,
            thumbnail: img.thumbnail,
            thumbnailUrl: img.thumbnailUrl
        }));
    }
    
    /**
     * Sets images from external source (e.g., when editing a listing).
     * 
     * @param {Array<{dataUrl: string, name: string}>} images - Images to set
     */
    async setImages(images) {
        this.images = [];
        
        for (const img of images) {
            if (img.dataUrl) {
                // Convert data URL to blob
                const response = await fetch(img.dataUrl);
                const blob = await response.blob();
                
                this.images.push({
                    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    originalName: img.name || 'image.jpg',
                    sanitizedName: sanitizeFilename(img.name || 'image'),
                    blob: blob,
                    dataUrl: img.dataUrl,
                    thumbnailUrl: img.thumbnailUrl || img.dataUrl,
                    thumbnail: blob,
                    preview: blob,
                    timestamp: Date.now()
                });
            }
        }
        
        this._renderGrid();
        this._updateCounter();
    }
    
    /**
     * Clears all images from the uploader.
     */
    clear() {
        this.images = [];
        this._renderGrid();
        this._updateCounter();
        this.options.onImagesChange([]);
    }
    
    /**
     * Checks if the uploader has any images.
     * 
     * @returns {boolean}
     */
    hasImages() {
        return this.images.length > 0;
    }
    
    /**
     * Gets the count of images.
     * 
     * @returns {number}
     */
    getImageCount() {
        return this.images.length;
    }
}

// Export for module usage
export default UnifiedImageUploader;
