// Script pour la page contact
document.addEventListener('DOMContentLoaded', function() {
    setupContactForm();
    setupFAQ();
    initializeAnimations();
});

function setupContactForm() {
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission();
    });
    
    // Animation des champs au focus
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Garder l'état focused si il y a une valeur
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

function handleFormSubmission() {
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    // Récupérer les données du formulaire
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Validation simple
    if (!data.name || !data.email || !data.subject || !data.message) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Veuillez entrer une adresse email valide', 'error');
        return;
    }
    
    // Animation de loading
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Simuler l'envoi (dans une vraie app, ça serait un appel API)
    setTimeout(() => {
        // Succès
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message envoyé !';
        submitBtn.style.background = 'var(--gradient-2)';
        
        showNotification(`Merci ${data.name} ! Ton message a été envoyé. Nous te répondrons sous 24h.`, 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Créer l'effet confetti
        createConfetti();
        
        // Remettre le bouton à l'état initial après 3 secondes
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 3000);
        
        // Sauvegarder dans les stats (simulation)
        updateContactStats();
        
    }, 2000); // Délai de 2 secondes pour simuler l'envoi
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqId = this.dataset.faq;
            const answer = document.getElementById(`faq-${faqId}`);
            const icon = this.querySelector('i');
            
            // Fermer toutes les autres FAQ
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== this) {
                    const otherId = otherQuestion.dataset.faq;
                    const otherAnswer = document.getElementById(`faq-${otherId}`);
                    const otherIcon = otherQuestion.querySelector('i');
                    
                    otherQuestion.classList.remove('active');
                    otherAnswer.classList.remove('active');
                    otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle la FAQ actuelle
            const isActive = this.classList.contains('active');
            
            if (isActive) {
                this.classList.remove('active');
                answer.classList.remove('active');
                icon.style.transform = 'rotate(0deg)';
            } else {
                this.classList.add('active');
                answer.classList.add('active');
                icon.style.transform = 'rotate(180deg)';
                
                // Scroll vers la question
                this.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        });
    });
}

function initializeAnimations() {
    // Animation des cartes de contact au scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Animation spéciale pour les cartes de contact
                if (entry.target.classList.contains('contact-card')) {
                    const cards = entry.target.parentNode.children;
                    const delay = Array.from(cards).indexOf(entry.target) * 150;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
                
                // Animation pour les FAQ
                if (entry.target.classList.contains('faq-item')) {
                    const items = entry.target.parentNode.children;
                    const delay = Array.from(items).indexOf(entry.target) * 100;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    document.querySelectorAll('.contact-card, .faq-item, .contact-form-container, .contact-info').forEach(el => {
        observer.observe(el);
    });
}

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        transform: translateX(120%);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 1rem;
        border-left: 4px solid var(--primary-color);
    `;
    
    // Couleurs selon le type
    if (type === 'success') {
        notification.style.borderLeftColor = 'var(--secondary-color)';
        notification.querySelector('i:first-child').style.color = 'var(--secondary-color)';
    } else if (type === 'error') {
        notification.style.borderLeftColor = '#e74c3c';
        notification.querySelector('i:first-child').style.color = '#e74c3c';
    } else {
        notification.style.borderLeftColor = 'var(--accent-color)';
        notification.querySelector('i:first-child').style.color = 'var(--accent-color)';
    }
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Bouton de fermeture
    notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            closeNotification(notification);
        }
    }, 5000);
}

function closeNotification(notification) {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 400);
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#a8e6cf'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.opacity = Math.random() * 0.8 + 0.2;
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { 
                transform: `translateY(-10px) rotate(0deg) scale(1)`, 
                opacity: 1 
            },
            { 
                transform: `translateY(100vh) rotate(${Math.random() * 1080}deg) scale(0)`, 
                opacity: 0 
            }
        ], {
            duration: Math.random() * 2000 + 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => {
            if (document.body.contains(confetti)) {
                confetti.remove();
            }
        };
    }
}

function updateContactStats() {
    // Simuler la sauvegarde des statistiques de contact
    let stats = JSON.parse(localStorage.getItem('coverme-contact-stats') || '{"messages": 0, "lastContact": null}');
    stats.messages += 1;
    stats.lastContact = new Date().toISOString();
    localStorage.setItem('coverme-contact-stats', JSON.stringify(stats));
}

// Animation CSS pour les éléments qui entrent dans la vue
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .focused {
        transform: scale(1.02);
    }
    
    .focused input,
    .focused select,
    .focused textarea {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
    }
    
    .focused i {
        color: var(--primary-color);
    }
    
    .notification {
        font-family: 'Poppins', sans-serif;
    }
    
    .notification i:first-child {
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    
    .notification span {
        flex: 1;
        color: var(--dark-color);
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s ease;
        color: var(--gray-color);
    }
    
    .notification-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);