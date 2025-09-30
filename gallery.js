// Script pour la page galerie
document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    setupGalleryControls();
    setupModal();
    loadSavedImages();
});

let savedImages = [];
let currentFilter = 'all';
let currentView = 'grid';

function initializeGallery() {
    // Charger les images depuis localStorage
    const stored = localStorage.getItem('coverme-gallery');
    if (stored) {
        savedImages = JSON.parse(stored);
    }
    
    updateStats();
    displayImages();
}

function setupGalleryControls() {
    // Filtres de galerie
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            displayImages();
        });
    });
    
    // Options d'affichage
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            updateViewLayout();
        });
    });
    
    // Bouton vider la galerie
    document.getElementById('clearGallery').addEventListener('click', clearGallery);
}

function setupModal() {
    const modal = document.getElementById('imageModal');
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    
    // Fermer la modal
    [overlay, closeBtn].forEach(element => {
        element.addEventListener('click', closeModal);
    });
    
    // Actions de la modal
    document.getElementById('modalDownload').addEventListener('click', downloadFromModal);
    document.getElementById('modalShare').addEventListener('click', shareFromModal);
    document.getElementById('modalDelete').addEventListener('click', deleteFromModal);
    document.getElementById('modalFavorite').addEventListener('click', toggleFavoriteFromModal);
}

function loadSavedImages() {
    // Images d'exemple si la galerie est vide
    if (savedImages.length === 0) {
        const sampleImages = [
            {
                id: 'sample-1',
                dataUrl: 'https://picsum.photos/400/600?random=1',
                timestamp: Date.now() - 86400000, // 1 jour
                filter: 'vintage',
                frame: 'classic',
                favorite: false,
                downloads: 2,
                shares: 1
            },
            {
                id: 'sample-2',
                dataUrl: 'https://picsum.photos/400/600?random=2',
                timestamp: Date.now() - 172800000, // 2 jours
                filter: 'noir',
                frame: 'modern',
                favorite: true,
                downloads: 5,
                shares: 3
            },
            {
                id: 'sample-3',
                dataUrl: 'https://picsum.photos/400/600?random=3',
                timestamp: Date.now() - 259200000, // 3 jours
                filter: 'vibrant',
                frame: 'none',
                favorite: false,
                downloads: 1,
                shares: 0
            }
        ];
        savedImages = sampleImages;
        saveImagesToStorage();
    }
}

function displayImages() {
    const grid = document.getElementById('savedGalleryGrid');
    const emptyState = document.getElementById('emptyState');
    
    let filteredImages = filterImages();
    
    if (filteredImages.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = '';
    
    filteredImages.forEach((image, index) => {
        const item = createGalleryItem(image, index);
        grid.appendChild(item);
    });
}

function filterImages() {
    let filtered = [...savedImages];
    
    switch (currentFilter) {
        case 'recent':
            filtered = filtered.filter(img => {
                const daysDiff = (Date.now() - img.timestamp) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7; // Images des 7 derniers jours
            });
            break;
        case 'favorites':
            filtered = filtered.filter(img => img.favorite);
            break;
        default:
            // 'all' - pas de filtre
            break;
    }
    
    // Trier par date (plus récent en premier)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
}

function createGalleryItem(image, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const favoriteClass = image.favorite ? 'fas' : 'far';
    const timeAgo = getTimeAgo(image.timestamp);
    
    item.innerHTML = `
        <img src="${image.dataUrl}" alt="Création ${index + 1}" loading="lazy">
        <div class="gallery-overlay">
            <div class="gallery-info">
                <span class="gallery-filter">${getFilterName(image.filter)}</span>
                <span class="gallery-time">${timeAgo}</span>
            </div>
            <div class="gallery-actions">
                <button class="gallery-btn favorite-btn" data-id="${image.id}">
                    <i class="${favoriteClass} fa-heart"></i>
                </button>
                <button class="gallery-btn download-btn" data-id="${image.id}">
                    <i class="fas fa-download"></i>
                </button>
                <button class="gallery-btn share-btn" data-id="${image.id}">
                    <i class="fas fa-share"></i>
                </button>
                <button class="gallery-btn delete-btn" data-id="${image.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Événements
    item.querySelector('img').addEventListener('click', () => openModal(image));
    item.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(image.id);
    });
    item.querySelector('.download-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(image);
    });
    item.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        shareImage(image);
    });
    item.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage(image.id);
    });
    
    // Animation d'apparition
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    setTimeout(() => {
        item.style.transition = 'all 0.4s ease-out';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    }, index * 100);
    
    return item;
}

function getFilterName(filter) {
    const names = {
        'none': 'Original',
        'vintage': 'Vintage',
        'noir': 'N&B',
        'sepia': 'Sépia',
        'vibrant': 'Vibrant'
    };
    return names[filter] || 'Original';
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return 'À l\'instant';
}

function updateStats() {
    const totalPhotos = savedImages.length;
    const totalDownloads = savedImages.reduce((sum, img) => sum + (img.downloads || 0), 0);
    const totalShares = savedImages.reduce((sum, img) => sum + (img.shares || 0), 0);
    
    document.getElementById('totalPhotos').textContent = totalPhotos;
    document.getElementById('totalDownloads').textContent = totalDownloads;
    document.getElementById('totalShares').textContent = totalShares;
}

function updateViewLayout() {
    const grid = document.getElementById('savedGalleryGrid');
    if (currentView === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

function toggleFavorite(imageId) {
    const image = savedImages.find(img => img.id === imageId);
    if (image) {
        image.favorite = !image.favorite;
        saveImagesToStorage();
        displayImages();
        
        // Animation de feedback
        const btn = document.querySelector(`[data-id="${imageId}"].favorite-btn i`);
        btn.className = image.favorite ? 'fas fa-heart' : 'far fa-heart';
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
    }
}

function downloadImage(image) {
    // Simuler le téléchargement
    image.downloads = (image.downloads || 0) + 1;
    saveImagesToStorage();
    updateStats();
    
    // Créer le lien de téléchargement
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `coverme-${image.id}.png`;
    link.click();
    
    // Feedback visuel
    showToast('Image téléchargée !', 'success');
}

function shareImage(image) {
    image.shares = (image.shares || 0) + 1;
    saveImagesToStorage();
    updateStats();
    
    if (navigator.share) {
        // API de partage native si disponible
        fetch(image.dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `coverme-${image.id}.png`, { type: 'image/png' });
                navigator.share({
                    title: 'Ma création CoverMe',
                    text: 'Regarde ma création faite avec CoverMe !',
                    files: [file]
                });
            });
    } else {
        // Fallback
        showToast('Lien copié dans le presse-papier !', 'info');
    }
}

function deleteImage(imageId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
        savedImages = savedImages.filter(img => img.id !== imageId);
        saveImagesToStorage();
        displayImages();
        updateStats();
        showToast('Image supprimée', 'error');
    }
}

function clearGallery() {
    if (confirm('Êtes-vous sûr de vouloir vider toute la galerie ?')) {
        savedImages = [];
        saveImagesToStorage();
        displayImages();
        updateStats();
        showToast('Galerie vidée', 'info');
    }
}

// Fonctions pour la modal
let currentModalImage = null;

function openModal(image) {
    currentModalImage = image;
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const favoriteBtn = document.getElementById('modalFavorite');
    
    modalImage.src = image.dataUrl;
    favoriteBtn.innerHTML = image.favorite ? 
        '<i class="fas fa-heart"></i> Retirer des favoris' : 
        '<i class="far fa-heart"></i> Ajouter aux favoris';
    
    modal.style.display = 'block';
    
    // Animation d'ouverture
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        currentModalImage = null;
    }, 300);
}

function downloadFromModal() {
    if (currentModalImage) {
        downloadImage(currentModalImage);
    }
}

function shareFromModal() {
    if (currentModalImage) {
        shareImage(currentModalImage);
    }
}

function deleteFromModal() {
    if (currentModalImage) {
        deleteImage(currentModalImage.id);
        closeModal();
    }
}

function toggleFavoriteFromModal() {
    if (currentModalImage) {
        toggleFavorite(currentModalImage.id);
        // Mettre à jour le bouton de la modal
        const favoriteBtn = document.getElementById('modalFavorite');
        const image = savedImages.find(img => img.id === currentModalImage.id);
        favoriteBtn.innerHTML = image.favorite ? 
            '<i class="fas fa-heart"></i> Retirer des favoris' : 
            '<i class="far fa-heart"></i> Ajouter aux favoris';
        currentModalImage = image;
    }
}

function saveImagesToStorage() {
    localStorage.setItem('coverme-gallery', JSON.stringify(savedImages));
}

function showToast(message, type = 'info') {
    // Créer et afficher un toast de notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: var(--primary-color);
        color: white;
        border-radius: 8px;
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    if (type === 'success') {
        toast.style.background = 'var(--secondary-color)';
    } else if (type === 'error') {
        toast.style.background = '#e74c3c';
    } else if (type === 'info') {
        toast.style.background = 'var(--accent-color)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Fonction pour ajouter une nouvelle image (appelée depuis features.html)
window.addToGallery = function(imageData) {
    const newImage = {
        id: 'img-' + Date.now(),
        dataUrl: imageData.dataUrl,
        timestamp: Date.now(),
        filter: imageData.filter || 'none',
        frame: imageData.frame || 'none',
        favorite: false,
        downloads: 0,
        shares: 0
    };
    
    savedImages.unshift(newImage); // Ajouter au début
    saveImagesToStorage();
    
    if (window.location.pathname.includes('gallery.html')) {
        displayImages();
        updateStats();
    }
    
    return newImage.id;
};