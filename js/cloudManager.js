/**
 * Módulo de Gestión de Nubes
 * Maneja la creación, visualización y eventos de las nubes emocionales
 */


import { config } from './config.js';
class CloudManager {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.clouds = [];
        this.zIndexCounter = 1;
        this.customMessages = this.loadCustomMessages();
    }

    /**
     * Inicializa el gestor de nubes
     * @param {HTMLElement} container - El contenedor DOM para las nubes
     */
    init(container) {
        this.container = container;
        this.loadSampleClouds();
    }

    /**
     * Carga mensajes personalizados desde localStorage
     */
    loadCustomMessages() {
        const stored = localStorage.getItem(this.config.STORAGE_KEYS.CUSTOM_MESSAGES);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Crea una nube con el contenido del usuario
     * @param {string} feeling - El sentimiento
     * @param {string} reason - La razón
     * @param {boolean} display - Si debe mostrarse (false si es contenido tóxico)
     */
    createCloud(feeling, reason, display = true) {
        if (!this.container) return;

        const cloud = document.createElement('div');
        cloud.className = 'cloud';

        // Gestionar cantidad máxima de nubes
        const existingClouds = this.container.querySelectorAll('.cloud');
        if (existingClouds.length >= this.config.MAX_CLOUDS) {
            this.container.removeChild(existingClouds[0]);
        }

        // Posición aleatoria
        const maxLeft = this.container.offsetWidth - 300;
        const maxTop = this.container.offsetHeight - 200;
        cloud.style.left = `${Math.random() * maxLeft}px`;
        cloud.style.top = `${Math.random() * maxTop}px`;

        // Retraso de animación aleatorio
        cloud.style.animationDelay = `${Math.random() * 5}s`;

        // Fuente aleatoria
        const randomFont = this.config.AVAILABLE_FONTS[Math.floor(Math.random() * this.config.AVAILABLE_FONTS.length)];
        cloud.style.setProperty('--random-font', randomFont);

        // Almacenar datos de clic
        cloud.clickCount = 0;
        cloud.lastClickTime = 0;

        // Agregar event listener de clic
        cloud.addEventListener('click', (e) => this.handleCloudClick(cloud, e));

        // Contenido de la nube
        if (display) {
            const combinedText = `<strong>Sentimiento:</strong> ${feeling}<br><strong>Por qué:</strong> ${reason}`;
            cloud.innerHTML = `
                <div class="cloud-text">${combinedText}</div>
                <div class="cloud-instruction">Clic para traer al frente • Triple clic para sorpresa</div>
            `;
        } else {
            // Nube oculta (contenido marcado como tóxico pero guardado en Sheets)
            cloud.style.opacity = '0';
            cloud.style.pointerEvents = 'none';
            console.log('Contenido guardado pero no mostrado por moderación:', { feeling, reason });
        }

        this.container.appendChild(cloud);
        this.clouds.push(cloud);
    }

    /**
     * Maneja los eventos de clic en las nubes
     * @param {HTMLElement} cloud - La nube clickeada
     * @param {Event} event - El evento de clic
     */
    handleCloudClick(cloud, event) {
        const currentTime = Date.now();

        // Traer nube al frente
        this.bringToFront(cloud);

        // Verificar triple clic
        if (currentTime - cloud.lastClickTime < this.config.TRIPLE_CLICK_WINDOW) {
            cloud.clickCount++;

            if (cloud.clickCount === 3) {
                this.triggerSpecialEffect(cloud);
                cloud.clickCount = 0;
            }
        } else {
            cloud.clickCount = 1;
        }

        cloud.lastClickTime = currentTime;
    }

    /**
     * Trae una nube al frente
     * @param {HTMLElement} cloud - La nube a traer al frente
     */
    bringToFront(cloud) {
        const allClouds = document.querySelectorAll('.cloud');
        allClouds.forEach(c => c.classList.remove('front'));

        cloud.classList.add('front');
        this.zIndexCounter++;
        cloud.style.zIndex = this.zIndexCounter;
    }

    /**
     * Activa un efecto especial (corazón, mensaje personalizado, etc.)
     * @param {HTMLElement} cloud - La nube activadora
     */
    triggerSpecialEffect(cloud) {
        cloud.classList.add('pop');

        // Crear corazón
        const heart = document.createElement('div');
        heart.className = 'heart';
        cloud.appendChild(heart);

        setTimeout(() => {
            heart.classList.add('animate');
        }, 100);

        setTimeout(() => {
            heart.remove();
            cloud.classList.remove('pop');
        }, 1500);

        // Mostrar mensaje (personalizado o default)
        const messages = this.customMessages.length > 0 
            ? this.customMessages 
            : [this.config.TRIPLE_CLICK_MESSAGES.default];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(randomMessage, 'success');
    }

    /**
     * Carga nubes de ejemplo para demostración
     */
    loadSampleClouds() {
        this.config.SAMPLE_RESPONSES.forEach((response, index) => {
            setTimeout(() => {
                this.createCloud(response.feeling, response.reason);
            }, index * 500);
        });
    }

    /**
     * Muestra una notificación
     * @param {string} message - El mensaje a mostrar
     * @param {string} type - El tipo de notificación (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = 'notification show';

        if (type === 'error') {
            notification.style.background = '#ff3366';
            notification.style.color = '#fff';
        } else if (type === 'info') {
            notification.style.background = '#33ffcc';
            notification.style.color = '#222';
        } else {
            notification.style.background = '#fff';
            notification.style.color = '#222';
        }

        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }

    /**
     * Guarda mensajes personalizados para el triple clic
     * @param {Array} messages - Lista de mensajes personalizados
     */
    saveCustomMessages(messages) {
        this.customMessages = messages;
        localStorage.setItem(this.config.STORAGE_KEYS.CUSTOM_MESSAGES, JSON.stringify(messages));
    }

    /**
     * Obtiene los mensajes personalizados actuales
     * @returns {Array} - Lista de mensajes personalizados
     */
    getCustomMessages() {
        return this.customMessages;
    }
}

// Exportar para uso en otros módulos (ES6)
export { CloudManager };
