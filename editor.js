// Editor JavaScript
class CoverMeEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentImage = null;
        this.layers = [];
        this.currentLayer = null;
        this.history = [];
        this.historyIndex = -1;
        this.zoom = 1;
        this.isDragging = false;
        this.isResizing = false;
        this.currentTool = 'select';
        this.cameraStream = null;
        
        // Image adjustments
        this.adjustments = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            noise: 0,
            blur: 0
        };
        
        this.init();
    }
    
    init() {
        this.showSourceModal();
        this.setupEventListeners();
        this.loadDecorations();
    }
    
    showSourceModal() {
        const modal = document.getElementById('sourceModal');
        modal.style.display = 'flex';
        
        // Animation d'apparition
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    }
    
    hideSourceModal() {
        const modal = document.getElementById('sourceModal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    setupEventListeners() {
        // Source selection
        document.getElementById('cameraBtn').addEventListener('click', () => this.openCamera());
        document.getElementById('galleryBtn').addEventListener('click', () => this.openGallery());
        document.getElementById('uploadBtn').addEventListener('click', () => this.openFileUpload());
        
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Toolbar
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('saveBtn').addEventListener('click', () => this.save());
        document.getElementById('downloadBtn').addEventListener('click', () => this.download());
        document.getElementById('shareBtn').addEventListener('click', () => this.share());
        
        // Tools
        document.querySelectorAll('.tool-btn[id$="Tool"]').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e.target.id.replace('Tool', '')));
        });
        
        // Zoom
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomFit').addEventListener('click', () => this.zoomFit());
        
        // Image adjustments
        this.setupAdjustmentSliders();
        
        // Filters
        document.querySelectorAll('.filter-preset').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyFilter(e.target.dataset.filter));
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Background categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchCategory(e.target.dataset.category));
        });
        
        // Camera modal
        document.getElementById('closeCameraBtn').addEventListener('click', () => this.closeCamera());
        document.getElementById('cancelCameraBtn').addEventListener('click', () => this.closeCamera());
        document.getElementById('captureBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('switchCameraBtn').addEventListener('click', () => this.switchCamera());
    }
    
    setupAdjustmentSliders() {
        Object.keys(this.adjustments).forEach(key => {
            const slider = document.getElementById(key);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.adjustments[key] = parseInt(e.target.value);
                    this.applyAdjustments();
                });
            }
        });
    }
    
    async openCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            const video = document.getElementById('cameraVideo');
            video.srcObject = this.cameraStream;
            
            document.getElementById('cameraModal').style.display = 'flex';
            this.hideSourceModal();
        } catch (error) {
            console.error('Erreur d\'accès à la caméra:', error);
            alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
        }
    }
    
    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        document.getElementById('cameraModal').style.display = 'none';
        this.showSourceModal();
    }
    
    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('photoCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            this.loadImageFromUrl(url);
            this.closeCamera();
        });
    }
    
    async switchCamera() {
        if (this.cameraStream) {
            const currentFacingMode = this.cameraStream.getVideoTracks()[0].getSettings().facingMode;
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            
            this.cameraStream.getTracks().forEach(track => track.stop());
            
            try {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: newFacingMode } 
                });
                
                const video = document.getElementById('cameraVideo');
                video.srcObject = this.cameraStream;
            } catch (error) {
                console.error('Erreur de changement de caméra:', error);
            }
        }
    }
    
    openGallery() {
        // Simuler l'ouverture de la galerie locale
        const savedImages = JSON.parse(localStorage.getItem('coverme-gallery') || '[]');
        
        if (savedImages.length === 0) {
            alert('Votre galerie est vide. Créez d\'abord quelques images !');
            return;
        }
        
        // Créer une modal de sélection d'image
        this.showGalleryModal(savedImages);
    }
    
    showGalleryModal(images) {
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Choisir une image de votre galerie</h3>
                    <button class="close-btn" onclick="this.closest('.gallery-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="gallery-grid">
                    ${images.map((img, index) => `
                        <div class="gallery-thumb" data-url="${img.dataUrl}">
                            <img src="${img.dataUrl}" alt="Image ${index + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer la sélection
        modal.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                this.loadImageFromUrl(url);
                modal.remove();
            });
        });
        
        this.hideSourceModal();
    }
    
    openFileUpload() {
        document.getElementById('fileInput').click();
        this.hideSourceModal();
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            this.loadImageFromUrl(url);
        }
    }
    
    loadImageFromUrl(url) {
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.initializeCanvas();
            this.showEditor();
            this.addToHistory();
        };
        img.src = url;
    }
    
    initializeCanvas() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Calculer les dimensions optimales
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = this.currentImage;
        const aspectRatio = width / height;
        
        if (width > height) {
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
        } else {
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.redraw();
    }
    
    showEditor() {
        document.getElementById('editorContainer').style.display = 'flex';
    }
    
    redraw() {
        if (!this.canvas || !this.currentImage) return;
        
        // Nettoyer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Appliquer les ajustements à l'image
        this.applyAdjustments();
        
        // Dessiner l'image principale
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner les calques
        this.layers.forEach(layer => this.drawLayer(layer));
    }
    
    applyAdjustments() {
        const { brightness, contrast, saturation, hue, blur } = this.adjustments;
        
        let filter = '';
        if (brightness !== 100) filter += `brightness(${brightness}%) `;
        if (contrast !== 100) filter += `contrast(${contrast}%) `;
        if (saturation !== 100) filter += `saturate(${saturation}%) `;
        if (hue !== 0) filter += `hue-rotate(${hue}deg) `;
        if (blur > 0) filter += `blur(${blur}px) `;
        
        this.ctx.filter = filter || 'none';
        
        // Appliquer le bruit si nécessaire
        if (this.adjustments.noise > 0) {
            this.addNoise();
        }
    }
    
    addNoise() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const noise = this.adjustments.noise;
        
        for (let i = 0; i < data.length; i += 4) {
            const random = (Math.random() - 0.5) * noise;
            data[i] = Math.max(0, Math.min(255, data[i] + random));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + random)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + random)); // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    applyFilter(filterName) {
        // Retirer l'état actif de tous les filtres
        document.querySelectorAll('.filter-preset').forEach(btn => btn.classList.remove('active'));
        
        // Activer le filtre sélectionné
        document.querySelector(`[data-filter="${filterName}"]`).classList.add('active');
        
        let filter = '';
        switch(filterName) {
            case 'vintage':
                filter = 'sepia(0.5) contrast(1.2) brightness(0.9)';
                break;
            case 'bw':
                filter = 'grayscale(1) contrast(1.1)';
                break;
            case 'sepia':
                filter = 'sepia(1)';
                break;
            case 'vibrant':
                filter = 'saturate(1.5) contrast(1.2) brightness(1.1)';
                break;
            case 'cool':
                filter = 'hue-rotate(180deg) saturate(1.2)';
                break;
            case 'warm':
                filter = 'hue-rotate(30deg) saturate(1.1)';
                break;
            case 'retro':
                filter = 'sepia(0.3) saturate(1.4) contrast(1.1)';
                break;
            default:
                filter = 'none';
        }
        
        this.ctx.filter = filter;
        this.redraw();
        this.addToHistory();
    }
    
    loadDecorations() {
        this.loadBackgrounds();
        this.loadStickers();
    }
    
    loadBackgrounds() {
        const grid = document.getElementById('decorationGrid');
        
        // Couleurs
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#a8e6cf',
            '#f8b500', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
            '#ff9f43', '#ff6348', '#2ed573', '#3742fa', '#f1c40f'
        ];
        
        // Dégradés
        const gradients = [
            'linear-gradient(45deg, #ff6b6b, #feca57)',
            'linear-gradient(45deg, #4ecdc4, #45b7d1)',
            'linear-gradient(45deg, #a8e6cf, #dcedc8)',
            'linear-gradient(45deg, #ff9a9e, #fecfef)',
            'linear-gradient(45deg, #667eea, #764ba2)',
            'linear-gradient(45deg, #f093fb, #f5576c)',
            'linear-gradient(45deg, #4facfe, #00f2fe)',
            'linear-gradient(45deg, #43e97b, #38f9d7)'
        ];
        
        // Motifs et textures (URLs d'exemple)
        const patterns = [
            'https://www.transparenttextures.com/patterns/45-degree-fabric-light.png',
            'https://www.transparenttextures.com/patterns/asfalt-light.png',
            'https://www.transparenttextures.com/patterns/brick-wall.png',
            'https://www.transparenttextures.com/patterns/concrete-wall.png'
        ];
        
        this.renderDecorations(grid, 'colors', colors);
    }
    
    renderDecorations(grid, category, items) {
        grid.innerHTML = '';
        
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'decoration-item';
            div.dataset.type = category;
            div.dataset.value = item;
            
            if (category === 'colors') {
                div.style.background = item;
            } else if (category === 'gradients') {
                div.style.background = item;
            } else if (category === 'patterns') {
                div.style.backgroundImage = `url(${item})`;
                div.style.backgroundSize = 'cover';
            }
            
            div.addEventListener('click', () => this.applyBackground(category, item));
            grid.appendChild(div);
        });
    }
    
    loadStickers() {
        const grid = document.getElementById('stickerGrid');
        
        // Emoji stickers
        const emojis = [
            '😀', '😂', '🥰', '😎', '🤔', '😴', '🤗', '🙃',
            '❤️', '💕', '💖', '💯', '🔥', '⭐', '✨', '🌟',
            '🎉', '🎊', '🎈', '🎀', '🌈', '☀️', '🌙', '⚡'
        ];
        
        this.renderStickers(grid, emojis);
    }
    
    renderStickers(grid, stickers) {
        grid.innerHTML = '';
        
        stickers.forEach(sticker => {
            const div = document.createElement('div');
            div.className = 'sticker-item';
            div.textContent = sticker;
            div.style.fontSize = '2rem';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.cursor = 'pointer';
            
            div.addEventListener('click', () => this.addSticker(sticker));
            grid.appendChild(div);
        });
    }
    
    applyBackground(type, value) {
        // Créer un arrière-plan sur le canvas
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        if (type === 'colors') {
            tempCtx.fillStyle = value;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else if (type === 'gradients') {
            // Créer un dégradé
            const gradient = tempCtx.createLinearGradient(0, 0, tempCanvas.width, tempCanvas.height);
            // Parser le dégradé CSS (simplifié)
            tempCtx.fillStyle = value;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Redessiner avec le nouvel arrière-plan
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
        
        this.addToHistory();
    }
    
    addSticker(sticker) {
        const layer = {
            type: 'sticker',
            content: sticker,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 60,
            height: 60,
            rotation: 0,
            id: Date.now()
        };
        
        this.layers.push(layer);
        this.redraw();
        this.addToHistory();
    }
    
    drawLayer(layer) {
        this.ctx.save();
        
        if (layer.type === 'sticker') {
            this.ctx.font = `${layer.height}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.translate(layer.x, layer.y);
            this.ctx.rotate(layer.rotation);
            this.ctx.fillText(layer.content, 0, 0);
        }
        
        this.ctx.restore();
    }
    
    switchTab(tabName) {
        // Retirer l'état actif de tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Activer l'onglet sélectionné
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }
    
    switchCategory(category) {
        const btn = event.target;
        btn.parentNode.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Charger les éléments de la catégorie
        this.loadCategoryItems(category);
    }
    
    loadCategoryItems(category) {
        const grid = document.getElementById('decorationGrid');
        
        switch(category) {
            case 'colors':
                this.loadBackgrounds();
                break;
            case 'gradients':
                const gradients = [
                    'linear-gradient(45deg, #ff6b6b, #feca57)',
                    'linear-gradient(45deg, #4ecdc4, #45b7d1)',
                    'linear-gradient(45deg, #a8e6cf, #dcedc8)',
                    'linear-gradient(45deg, #ff9a9e, #fecfef)',
                    'linear-gradient(45deg, #667eea, #764ba2)',
                    'linear-gradient(45deg, #f093fb, #f5576c)',
                    'linear-gradient(45deg, #4facfe, #00f2fe)',
                    'linear-gradient(45deg, #43e97b, #38f9d7)'
                ];
                this.renderDecorations(grid, 'gradients', gradients);
                break;
            case 'patterns':
                // Charger des motifs
                break;
            case 'textures':
                // Charger des textures
                break;
        }
    }
    
    selectTool(toolName) {
        this.currentTool = toolName;
        
        // Mettre à jour l'UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(toolName + 'Tool').classList.add('active');
    }
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateZoom();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateZoom();
    }
    
    zoomFit() {
        this.zoom = 1;
        this.updateZoom();
    }
    
    updateZoom() {
        if (this.canvas) {
            this.canvas.style.transform = `scale(${this.zoom})`;
            document.querySelector('.zoom-info').textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }
    
    addToHistory() {
        if (!this.canvas) return;
        
        const imageData = this.canvas.toDataURL();
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({
            imageData,
            layers: JSON.parse(JSON.stringify(this.layers)),
            adjustments: { ...this.adjustments }
        });
        this.historyIndex++;
        
        // Limiter l'historique
        if (this.history.length > 20) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
        }
    }
    
    restoreFromHistory() {
        const state = this.history[this.historyIndex];
        if (state) {
            this.layers = state.layers;
            this.adjustments = state.adjustments;
            
            // Restaurer les sliders
            Object.keys(this.adjustments).forEach(key => {
                const slider = document.getElementById(key);
                if (slider) slider.value = this.adjustments[key];
            });
            
            this.redraw();
        }
    }
    
    save() {
        if (!this.canvas) return;
        
        const imageData = {
            dataUrl: this.canvas.toDataURL('image/png'),
            filter: 'custom',
            frame: 'none'
        };
        
        // Sauvegarder dans localStorage
        let savedImages = JSON.parse(localStorage.getItem('coverme-gallery') || '[]');
        const newImage = {
            id: 'img-' + Date.now(),
            dataUrl: imageData.dataUrl,
            timestamp: Date.now(),
            filter: imageData.filter,
            frame: imageData.frame,
            favorite: false,
            downloads: 0,
            shares: 0
        };
        
        savedImages.unshift(newImage);
        localStorage.setItem('coverme-gallery', JSON.stringify(savedImages));
        
        this.showNotification('Image sauvegardée !', 'success');
    }
    
    download() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = `coverme-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.showNotification('Image téléchargée !', 'success');
    }
    
    share() {
        if (!this.canvas) return;
        
        if (navigator.share) {
            this.canvas.toBlob(blob => {
                const file = new File([blob], 'coverme-creation.png', { type: 'image/png' });
                navigator.share({
                    title: 'Ma création CoverMe',
                    text: 'Regarde ma création faite avec CoverMe !',
                    files: [file]
                });
            });
        } else {
            this.showNotification('Fonction de partage non supportée', 'info');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--primary-color);
            color: white;
            border-radius: 8px;
            z-index: 4000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.background = 'var(--secondary-color)';
        } else if (type === 'error') {
            notification.style.background = '#e74c3c';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialiser l'éditeur
document.addEventListener('DOMContentLoaded', () => {
    new CoverMeEditor();
});

// Styles CSS supplémentaires pour la modal de galerie
const style = document.createElement('style');
style.textContent = `
    .gallery-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.8);
    }
    
    .gallery-modal .modal-content {
        background: var(--light-color);
        border-radius: var(--border-radius);
        max-width: 80vw;
        max-height: 80vh;
        overflow: hidden;
    }
    
    .gallery-modal .modal-header {
        padding: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .gallery-modal .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
        padding: 1rem;
        max-height: 60vh;
        overflow-y: auto;
    }
    
    .gallery-thumb {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: var(--transition);
        border: 2px solid transparent;
    }
    
    .gallery-thumb:hover {
        border-color: var(--primary-color);
        transform: scale(1.05);
    }
    
    .gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;
document.head.appendChild(style);