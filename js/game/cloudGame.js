/**
 * Módulo del Juego de Nubes
 * Maneja el mini-juego interactivo de nubes en la parte inferior
 */

(function() {
    // Configuración del juego
    const CONFIG = {
        CONTAINER_ID: 'cloud-game-section',
        CLOUD_SIZE: 120,
        TITLE_HEIGHT: 50,
        FADE_DURATION: 400,
        GREEN_CLOUD_MIN_TIME: 5000,
        GREEN_CLOUD_MAX_TIME: 15000
    };

    let gameContainer;
    let greenCloudTimer;

    /**
     * Inicializa el juego
     */
    function init() {
        gameContainer = document.getElementById(CONFIG.CONTAINER_ID);
        if (!gameContainer) {
            console.error('Contenedor del juego no encontrado');
            return;
        }
        
        startGame();
    }

    /**
     * Inicia/reinicia el juego
     */
    function startGame() {
        // Limpiar el contenedor, excepto el título
        const title = gameContainer.querySelector('h2');
        gameContainer.innerHTML = '';
        
        if (title) {
            gameContainer.appendChild(title);
        } else {
            gameContainer.innerHTML = '<h2 style="position:absolute; top:10px; left:20px; z-index:5; color:white; font-size:1.2rem; opacity:0.8;">Relax: Pop the Clouds</h2>';
        }
        
        if (greenCloudTimer) clearTimeout(greenCloudTimer);
        
        createGameCloud(false, true); // Crear la primera nube blanca
        scheduleNextGreenCloud();
    }

    /**
     * Crea una nube del juego
     * @param {boolean} isGreen - Si es la nube verde especial
     * @param {boolean} isWhite - Si es una nube blanca normal
     */
    function createGameCloud(isGreen = false, isWhite = false) {
        const cloud = document.createElement('div');
        cloud.className = 'game-cloud';

        if (isGreen) {
            cloud.classList.add('game-cloud-green');
        } else if (isWhite) {
            cloud.classList.add('game-cloud-white');
        } else {
            const hue = Math.floor(Math.random() * 360);
            cloud.style.setProperty('--cloud-color', `hsl(${hue}, 70%, 85%)`);
        }

        // Calcular posición basada en el tamaño del CONTENEDOR
        const containerRect = gameContainer.getBoundingClientRect();
        const randomTop = Math.random() * (containerRect.height - CONFIG.CLOUD_SIZE - CONFIG.TITLE_HEIGHT) + CONFIG.TITLE_HEIGHT;
        const randomLeft = Math.random() * (containerRect.width - CONFIG.CLOUD_SIZE);

        cloud.style.top = `${randomTop}px`;
        cloud.style.left = `${randomLeft}px`;

        cloud.addEventListener('pointerdown', onGameCloudClick);
        gameContainer.appendChild(cloud);

        // Forzar un reflow antes de aplicar la transición
        cloud.offsetHeight;
        cloud.style.opacity = '1';
        cloud.style.transform = 'scale(1)';
    }

    /**
     * Maneja el clic en una nube del juego
     * @param {Event} e - Evento de clic
     */
    function onGameCloudClick(e) {
        const clickedCloud = e.currentTarget;
        if (clickedCloud.classList.contains('game-cloud-fading')) return;

        if (clickedCloud.classList.contains('game-cloud-green')) {
            resetGame();
        } else {
            splitGameCloud(clickedCloud);
        }
    }

    /**
     * Divide una nube en dos
     * @param {HTMLElement} cloud - La nube a dividir
     */
    function splitGameCloud(cloud) {
        cloud.classList.add('game-cloud-fading');
        cloud.removeEventListener('pointerdown', onGameCloudClick);
        
        setTimeout(() => cloud.remove(), CONFIG.FADE_DURATION);
        createGameCloud();
        createGameCloud();
    }

    /**
     * Reinicia el juego
     */
    function resetGame() {
        const allClouds = gameContainer.querySelectorAll('.game-cloud');
        allClouds.forEach(cloud => {
            cloud.classList.add('game-cloud-fading');
            cloud.removeEventListener('pointerdown', onGameCloudClick);
            setTimeout(() => cloud.remove(), CONFIG.FADE_DURATION);
        });
        
        setTimeout(() => startGame(), CONFIG.FADE_DURATION + 50);
    }

    /**
     * Programa la próxima nube verde
     */
    function scheduleNextGreenCloud() {
        const randomTime = Math.random() * (CONFIG.GREEN_CLOUD_MAX_TIME - CONFIG.GREEN_CLOUD_MIN_TIME) + CONFIG.GREEN_CLOUD_MIN_TIME;
        
        greenCloudTimer = setTimeout(() => {
            if (document.body.contains(gameContainer)) {
                createGameCloud(true);
                scheduleNextGreenCloud();
            }
        }, randomTime);
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
