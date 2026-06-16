/**
 * Configuración centralizada de la aplicación
 * Incluye URLs, constantes y configuraciones globales
 */

const APP_CONFIG = {
    // Google Sheets Web App URL
    GOOGLE_SHEETS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzO7ghj0Kh5PkFT-pV4qMYNDDcmE6Ou8bgZBB_r_eN_dGAI1ggADdkQUT4mUyOWWCGK/exec',
    
    // Límites y constantes
    MAX_CLOUDS: 8,
    TEXT_MAX_LENGTH: 500,
    
    // Tiempo para triple clic (ms)
    TRIPLE_CLICK_WINDOW: 5000,
    
    // Fuentes disponibles para nubes
    AVAILABLE_FONTS: [
        "'Permanent Marker', cursive",
        "'Shadows Into Light', cursive",
        "'Caveat', cursive",
        "'Righteous', cursive",
        "'Bungee', cursive",
        "'Creepster', cursive",
        "'Fredoka One', cursive"
    ],
    
    // Datos de ejemplo para demostración
    SAMPLE_RESPONSES: [
        { feeling: "¡Hoy me siento feliz!", reason: "El sol está brillando y vi a mis amigos." },
        { feeling: "Un poco estresado.", reason: "El trabajo ha sido muy exigente últimamente." },
        { feeling: "¡Emocionado por el fin de semana!", reason: "Tengo planes para hacer senderismo y es mi actividad favorita." },
        { feeling: "Sintiéndome agradecido", reason: "Mi familia me sorprendió con un regalo detallado." },
        { feeling: "Un poco ansioso", reason: "Tengo una presentación importante mañana." }
    ],
    
    // Configuración de moderación de contenido
    MODERATION: {
        ENABLED: true,
        API_URL: 'https://api.perspectiveapi.com/v1alpha1/comments:analyze',
        API_KEY: '', // Debe ser configurado por el administrador
        TOXICITY_THRESHOLD: 0.7, // Umbral de toxicidad (0-1)
        SAVE_TO_SHEET_ALWAYS: true, // Siempre guardar en Google Sheets
        DISPLAY_IF_FLAGGED: false // No mostrar en nubes si es tóxico
    },
    
    // Configuración del administrador
    ADMIN: {
        SECRET_KEY_COMBO: ['Control', 'Shift', 'A'], // Combinación de teclas para abrir panel admin
        SESSION_DURATION: 3600000, // 1 hora en ms
        STORAGE_KEY: 'adminSession'
    },
    
    // Mensajes personalizados para triple clic
    TRIPLE_CLICK_MESSAGES: {
        default: "💖 ¡Encontraste el corazón secreto! 💖",
        custom: [] // Se puede personalizar desde el panel de administración
    },
    
    // Claves de almacenamiento local
    STORAGE_KEYS: {
        OFFLINE_DATA: 'feelingsPollOffline',
        FLAGGED_CONTENT: 'flaggedContent',
        CUSTOM_MESSAGES: 'customTripleClickMessages'
    }
};

// Exportar para uso en otros módulos (si se usa ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
