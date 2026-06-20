/**
 * Módulo de Gestión de Formularios y Envíos
 * Maneja la captura de datos, validación y envío a Google Sheets
 */

import { config } from './config.js';

class FormHandler {
    constructor(config, cloudManager, moderator) {
        this.config = config;
        this.cloudManager = cloudManager;
        this.moderator = moderator;
        this.feelingInput = null;
        this.reasonInput = null;
        this.submitBtn = null;
    }

    /**
     * Inicializa el manejador de formularios
     * @param {string} feelingId - ID del input de sentimiento
     * @param {string} reasonId - ID del input de razón
     * @param {string} submitBtnId - ID del botón de envío
     */
    init(feelingId, reasonId, submitBtnId) {
        this.feelingInput = document.getElementById(feelingId);
        this.reasonInput = document.getElementById(reasonId);
        this.submitBtn = document.getElementById(submitBtnId);

        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        // Verificar datos offline para sincronizar al cargar
        this.checkAndSyncOfflineData();

        // Escuchar cambios de conexión
        window.addEventListener('online', () => this.checkAndSyncOfflineData());
        window.addEventListener('offline', () => {
            this.showNotification('Sin conexión. Los datos se guardarán localmente.', 'info');
        });
    }

    /**
     * Maneja el envío del formulario
     */
    async handleSubmit() {
        const feeling = this.feelingInput?.value.trim() || '';
        const reason = this.reasonInput?.value.trim() || '';

        if (!feeling) {
            this.showNotification('¡Contanos cómo te sentís!', 'error');
            return;
        }

        // Validar longitud máxima
        if (feeling.length > this.config.TEXT_MAX_LENGTH || reason.length > this.config.TEXT_MAX_LENGTH) {
            this.showNotification(`El texto no puede superar los ${this.config.TEXT_MAX_LENGTH} caracteres.`, 'error');
            return;
        }

        // Deshabilitar botón y mostrar loading
        this.setLoadingState(true);

        try {
            // Analizar contenido con moderador
            const moderationResult = await this.moderator.analyzeSubmission(feeling, reason);

            // Enviar a Google Sheets (siempre, incluso si es tóxico)
            await this.sendToGoogleSheets(feeling, reason);

            // Crear nube solo si el contenido es apropiado
            if (moderationResult.saveOnly && !this.config.MODERATION.DISPLAY_IF_FLAGGED) {
                // Contenido guardado en Sheets pero no mostrado en la UI
                console.log('Contenido moderado: guardado en Sheets pero no mostrado');
                this.showNotification('¡Gracias por compartir! Tu mensaje fue registrado.', 'success');
            } else {
                // Mostrar la nube
                this.cloudManager.createCloud(feeling, reason, true);
                this.showNotification('¡Gracias por compartir! Tus sentimientos fueron registrados.', 'success');
            }

            // Limpiar el formulario
            this.clearForm();

        } catch (error) {
            console.error('Error de envío:', error);

            // Verificar si realmente estamos offline
            if (!navigator.onLine) {
                this.saveOfflineData(feeling, reason);
                this.showNotification('Guardado offline. Se sincronizará cuando vuelva la conexión.', 'info');
            } else {
                this.showNotification('Error del servidor. Intentá de nuevo en unos minutos.', 'error');
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Envía datos a Google Sheets via Apps Script
     * @param {string} feeling - El sentimiento
     * @param {string} reason - La razón
     */
    async sendToGoogleSheets(feeling, reason) {
        const formData = new FormData();
        formData.append('feeling', feeling);
        formData.append('reason', reason);
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch(this.config.GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Error desconocido');
        }
    }

    /**
     * Guarda datos offline para sincronizar después
     * @param {string} feeling - El sentimiento
     * @param {string} reason - La razón
     */
    saveOfflineData(feeling, reason) {
        const offlineData = {
            timestamp: new Date().toISOString(),
            feeling: feeling,
            reason: reason
        };

        const storedData = JSON.parse(localStorage.getItem(this.config.STORAGE_KEYS.OFFLINE_DATA) || '[]');
        storedData.push(offlineData);
        localStorage.setItem(this.config.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(storedData));
    }

    /**
     * Verifica y sincroniza datos offline
     */
    async checkAndSyncOfflineData() {
        if (!navigator.onLine) {
            return;
        }

        const offlineData = JSON.parse(localStorage.getItem(this.config.STORAGE_KEYS.OFFLINE_DATA) || '[]');

        if (offlineData.length > 0) {
            this.showNotification(`Sincronizando ${offlineData.length} envíos offline...`, 'info');

            let syncedCount = 0;
            for (const data of offlineData) {
                try {
                    await this.sendToGoogleSheets(data.feeling, data.reason);
                    syncedCount++;
                } catch (error) {
                    console.error('Falló la sincronización:', error);
                    break;
                }
            }

            if (syncedCount > 0) {
                const remainingData = offlineData.slice(syncedCount);
                localStorage.setItem(this.config.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(remainingData));
                this.showNotification('¡Todos los datos offline se sincronizaron exitosamente!', 'success');
            }
        }
    }

    /**
     * Limpia el formulario
     */
    clearForm() {
        if (this.feelingInput) this.feelingInput.value = '';
        if (this.reasonInput) this.reasonInput.value = '';
    }

    /**
     * Establece el estado de carga del botón
     * @param {boolean} isLoading - Si está cargando
     */
    setLoadingState(isLoading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = isLoading;
        }

        const loading = document.getElementById('loading');
        if (loading) {
            if (isLoading) {
                loading.classList.add('show');
            } else {
                loading.classList.remove('show');
            }
        }
    }

    /**
     * Muestra una notificación
     * @param {string} message - El mensaje a mostrar
     * @param {string} type - El tipo de notificación
     */
    showNotification(message, type = 'info') {
        this.cloudManager?.showNotification(message, type);
    }
}

// Exportar para uso en otros módulos (ES6)
export { FormHandler };
