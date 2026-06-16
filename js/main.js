/**
 * Script Principal de Inicialización
 * Orquesta todos los módulos y configura la aplicación
 */

(function() {
    'use strict';

    // Verificar que APP_CONFIG esté disponible
    if (typeof APP_CONFIG === 'undefined') {
        console.error('❌ Error: APP_CONFIG no está cargado. Verifica el orden de los scripts.');
        return;
    }

    // Variables globales de la aplicación
    let cloudManager;
    let moderator;
    let formHandler;
    let diagnosticTester;
    let adminPanel;

    /**
     * Inicializa todos los módulos de la aplicación
     */
    function initApp() {
        console.log('🚀 Iniciando Nubes Emocionales...');

        // 1. Inicializar moderador de contenido
        moderator = new ContentModerator(APP_CONFIG);
        console.log('✓ Moderador de contenido inicializado');

        // 2. Inicializar gestor de nubes
        const cloudsContainer = document.getElementById('clouds-container');
        if (!cloudsContainer) {
            console.error('❌ Contenedor de nubes no encontrado');
            return;
        }
        
        cloudManager = new CloudManager(APP_CONFIG);
        cloudManager.init(cloudsContainer);
        console.log('✓ Gestor de nubes inicializado');

        // 3. Inicializar manejador de formularios
        formHandler = new FormHandler(APP_CONFIG, cloudManager, moderator);
        formHandler.init('feeling-input', 'reason-input', 'submit-btn');
        console.log('✓ Manejador de formularios inicializado');

        // 4. Inicializar tester de diagnóstico
        diagnosticTester = new DiagnosticTester(APP_CONFIG, cloudManager, formHandler, moderator);
        console.log('✓ Tester de diagnóstico inicializado');

        // 5. Inicializar panel de administración
        adminPanel = new AdminPanel(APP_CONFIG, diagnosticTester, cloudManager, moderator);
        console.log('✓ Panel de administración inicializado');

        // 6. Configurar movimiento del bobblehead
        setupBobblehead();

        // 7. Registrar service worker para PWA (opcional, futuro)
        // registerServiceWorker();

        console.log('✅ Aplicación completamente inicializada');
        console.log('💡 Tip: Presioná Ctrl+Shift+A para acceder al panel de administración');
    }

    /**
     * Configura el movimiento del bobblehead
     */
    function setupBobblehead() {
        const bobblehead = document.getElementById('bobblehead');
        const feelingInput = document.getElementById('feeling-input');
        const reasonInput = document.getElementById('reason-input');

        if (!bobblehead || !feelingInput || !reasonInput) return;

        function moveBobblehead(e) {
            const inputRect = e.target.getBoundingClientRect();
            
            bobblehead.style.left = `${inputRect.left - 120}px`;
            bobblehead.style.top = `${inputRect.top - 50}px`;
        }

        feelingInput.addEventListener('focus', moveBobblehead);
        reasonInput.addEventListener('focus', moveBobblehead);

        // Resetear posición al perder foco
        feelingInput.addEventListener('blur', resetBobblehead);
        reasonInput.addEventListener('blur', resetBobblehead);

        function resetBobblehead() {
            bobblehead.style.left = '';
            bobblehead.style.top = '';
        }
    }

    /**
     * Registra un service worker para funcionalidad offline avanzada
     * (Implementación futura para PWA)
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado:', registration.scope);
                })
                .catch(error => {
                    console.log('Error al registrar ServiceWorker:', error);
                });
        }
    }

    /**
     * Expone funciones útiles para debugging en consola (solo desarrollo)
     */
    function exposeDebugFunctions() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.appDebug = {
                config: APP_CONFIG,
                cloudManager,
                moderator,
                formHandler,
                diagnosticTester,
                adminPanel,
                runDiagnostics: () => diagnosticTester.runAllTests(),
                getFlaggedContent: () => moderator.getFlaggedContentHistory(),
                clearFlaggedContent: () => moderator.clearFlaggedContentHistory()
            };
            console.log('🔧 Funciones de debug disponibles en window.appDebug');
        }
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initApp();
            exposeDebugFunctions();
        });
    } else {
        initApp();
        exposeDebugFunctions();
    }

    // Manejar cambios de conexión
    window.addEventListener('online', () => {
        console.log('🌐 Conexión restaurada');
        if (formHandler) {
            formHandler.checkAndSyncOfflineData();
        }
    });

    window.addEventListener('offline', () => {
        console.log('📴 Sin conexión');
        if (cloudManager) {
            cloudManager.showNotification('Sin conexión. Los datos se guardarán localmente.', 'info');
        }
    });

})();
