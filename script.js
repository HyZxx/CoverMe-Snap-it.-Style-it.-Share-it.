// Variables globales
let currentImage = null;
let canvas = null;
let ctx = null;
let currentFilter = 'none';
let currentFrame = 'none';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createSampleGallery();
    initializeAnimations();
});

function initializeApp() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Animation du titre au chargement
    const title = document.querySelector('.hero-title');
    title.style.opacity = '0';
    title.style.transform = 'translateY(50px)';
    
    setTimeout(() => {
        title.style.transition = 'all 1s ease-out';
        title.style.opacity = '1';
        title.style.transform = 'translateY(0)';
    }, 500);
}

function setupEventListeners() {
    // Navigation mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Smooth scrolling pour la navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Fermer le menu mobile
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    // Bouton "Commencer à créer"
    const startBtn = document.getElementById('startCreating');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.location.href = 'features.html';
        });
    }

    // Upload de fichier
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Clic sur la zone d'upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Contrôles de l'éditeur
    setupEditorControls();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        loadImage(files[0]);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            showEditor();
            drawImageOnCanvas();
            
            // Animation d'apparition de l'éditeur
            const editor = document.getElementById('editor');
            editor.style.opacity = '0';
            editor.style.transform = 'translateY(50px)';
            editor.style.display = 'grid';
            
            setTimeout(() => {
                editor.style.transition = 'all 0.6s ease-out';
                editor.style.opacity = '1';
                editor.style.transform = 'translateY(0)';
            }, 100);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showEditor() {
    document.getElementById('editor').style.display = 'grid';
}

function drawImageOnCanvas() {
    if (!currentImage) return;
    
    // Calculer les dimensions pour maintenir le ratio
    const maxWidth = 400;
    const maxHeight = 600;
    let { width, height } = currentImage;
    
    if (width > height) {
        if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
        }
    } else {
        if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Nettoyer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Appliquer le filtre
    applyFilter();
    
    // Dessiner l'image
    ctx.drawImage(currentImage, 0, 0, width, height);
    
    // Appliquer le cadre
    applyFrame();
}

function applyFilter() {
    switch(currentFilter) {
        case 'vintage':
            ctx.filter = 'sepia(0.5) contrast(1.2) brightness(0.9)';
            break;
        case 'noir':
            ctx.filter = 'grayscale(1) contrast(1.1)';
            break;
        case 'sepia':
            ctx.filter = 'sepia(1)';
            break;
        case 'vibrant':
            ctx.filter = 'saturate(1.5) contrast(1.2) brightness(1.1)';
            break;
        default:
            ctx.filter = 'none';
    }
}

function applyFrame() {
    const frameWidth = 10;
    
    switch(currentFrame) {
        case 'classic':
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = frameWidth;
            ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth, canvas.height - frameWidth);
            break;
        case 'modern':
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = frameWidth;
            ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth, canvas.height - frameWidth);
            break;
        case 'vintage':
            // Cadre vintage avec effet dégradé
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#8B4513');
            gradient.addColorStop(1, '#DEB887');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = frameWidth * 1.5;
            ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth*1.5, canvas.height - frameWidth*1.5);
            break;
    }
}

function setupEditorControls() {
    // Boutons de filtre
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            drawImageOnCanvas();
            
            // Animation du bouton
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Boutons de cadre
    document.querySelectorAll('.frame-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFrame = e.target.dataset.frame;
            drawImageOnCanvas();
            
            // Animation du bouton
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Bouton de téléchargement
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
    
    // Bouton de sauvegarde
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveToGallery);
    }
}

function downloadImage() {
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'coverme-creation.png';
    link.href = canvas.toDataURL();
    link.click();
    
    // Animation de feedback
    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
    btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
}

function shareImage() {
    if (!canvas) return;
    
    const btn = document.getElementById('shareBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<div class="loading"></div> Partage...';
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Partagé !';
        btn.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }, 1500);
    
    // Dans une vraie application, on utiliserait l'API de partage
    if (navigator.share) {
        canvas.toBlob(blob => {
            const file = new File([blob], 'coverme-creation.png', { type: 'image/png' });
            navigator.share({
                title: 'Ma création CoverMe',
                text: 'Regarde ma création faite avec CoverMe !',
                files: [file]
            });
        });
    }
}

function saveToGallery() {
    if (!canvas) return;
    
    const btn = document.getElementById('saveBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<div class="loading"></div> Sauvegarde...';
    
    // Créer les données de l'image
    const imageData = {
        dataUrl: canvas.toDataURL('image/png'),
        filter: currentFilter,
        frame: currentFrame
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
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Sauvegardé !';
        btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
        
        // Proposer d'aller voir la galerie
        setTimeout(() => {
            if (confirm('Image sauvegardée ! Voulez-vous voir votre galerie ?')) {
                window.location.href = 'gallery.html';
            } else {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }
        }, 1000);
    }, 1000);
}

function createSampleGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const sampleImages = [
        'https://picsum.photos/300/400?random=1',
        'https://picsum.photos/300/400?random=2',
        'https://picsum.photos/300/400?random=3',
        'https://picsum.photos/300/400?random=4',
        'https://picsum.photos/300/400?random=5',
        'https://picsum.photos/300/400?random=6'
    ];
    
    sampleImages.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${src}" alt="Création ${index + 1}" loading="lazy">`;
        
        // Animation d'apparition progressive
        item.style.opacity = '0';
        item.style.transform = 'translateY(50px)';
        galleryGrid.appendChild(item);
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 200);
        
        // Effet de hover interactif
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function initializeAnimations() {
    // Animation au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-in-up');
                
                // Animation spéciale pour les cartes de fonctionnalités
                if (entry.target.classList.contains('feature-card')) {
                    const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 200;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    document.querySelectorAll('.feature-card, .section-title').forEach(el => {
        observer.observe(el);
    });
    
    // Animation des icônes flottantes dans le hero
    setInterval(() => {
        const icons = document.querySelectorAll('.floating-icons i');
        icons.forEach((icon, index) => {
            setTimeout(() => {
                icon.style.transform = `translateY(-20px) rotate(${Math.random() * 360}deg) scale(1.2)`;
                setTimeout(() => {
                    icon.style.transform = 'translateY(0) rotate(0deg) scale(1)';
                }, 1000);
            }, index * 500);
        });
    }, 8000);
}

// Animation du logo dans la navigation au scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.pageYOffset;
    
    if (scrolled > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Easter egg : double clic sur le logo
document.querySelector('.nav-logo').addEventListener('dblclick', () => {
    // Créer des confettis
    createConfetti();
});

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#a8e6cf'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: `translateY(-10px) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(100vh) rotate(720deg)`, opacity: 0 }
        ], {
            duration: 3000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// PWA support (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}