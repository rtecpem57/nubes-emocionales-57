/**
 * Módulo de Moderación de Contenido
 * Integra con Perspective API (gratuita de Google) para detectar lenguaje ofensivo
 */

class ContentModerator {
    constructor(config) {
        this.config = config;
        this.apiKey = config.MODERATION.API_KEY;
        this.apiUrl = config.MODERATION.API_URL;
        this.threshold = config.MODERATION.TOXICITY_THRESHOLD;
        this.enabled = config.MODERATION.ENABLED;
    }

    /**
     * Analiza un texto para detectar contenido tóxico u ofensivo
     * @param {string} text - El texto a analizar
     * @returns {Promise<object>} - Resultado del análisis
     */
    async analyzeText(text) {
        if (!this.enabled || !this.apiKey) {
            return { isToxic: false, score: 0, saveOnly: false };
        }

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    comment: {
                        text: text
                    },
                    requestedAttributes: {
                        TOXICITY: {},
                        SEVERE_TOXICITY: {},
                        INSULT: {},
                        THREAT: {},
                        PROFANITY: {}
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error('Error en Perspective API:', data.error);
                return { isToxic: false, score: 0, saveOnly: false, error: data.error.message };
            }

            // Calcular el puntaje máximo entre todos los atributos
            const maxScore = Math.max(
                data.attributeScores.TOXICITY?.summaryScore?.value || 0,
                data.attributeScores.SEVERE_TOXICITY?.summaryScore?.value || 0,
                data.attributeScores.INSULT?.summaryScore?.value || 0,
                data.attributeScores.THREAT?.summaryScore?.value || 0,
                data.attributeScores.PROFANITY?.summaryScore?.value || 0
            );

            const isToxic = maxScore >= this.threshold;

            return {
                isToxic,
                score: maxScore,
                saveOnly: isToxic, // Si es tóxico, solo guardar en Sheets, no mostrar
                attributeScores: data.attributeScores
            };

        } catch (error) {
            console.error('Error al analizar contenido:', error);
            // En caso de error, permitir el contenido pero registrar el incidente
            return { isToxic: false, score: 0, saveOnly: false, error: error.message };
        }
    }

    /**
     * Analiza tanto el sentimiento como la razón
     * @param {string} feeling - El sentimiento ingresado
     * @param {string} reason - La razón ingresada
     * @returns {Promise<object>} - Resultado combinado del análisis
     */
    async analyzeSubmission(feeling, reason) {
        const feelingAnalysis = await this.analyzeText(feeling);
        const reasonAnalysis = reason ? await this.analyzeText(reason) : { isToxic: false, score: 0 };

        const combinedResult = {
            isToxic: feelingAnalysis.isToxic || reasonAnalysis.isToxic,
            maxScore: Math.max(feelingAnalysis.score, reasonAnalysis.score),
            saveOnly: feelingAnalysis.saveOnly || reasonAnalysis.saveOnly,
            details: {
                feeling: feelingAnalysis,
                reason: reasonAnalysis
            }
        };

        // Guardar contenido marcado para revisión del administrador
        if (combinedResult.isToxic) {
            this.logFlaggedContent({
                timestamp: new Date().toISOString(),
                feeling,
                reason,
                scores: combinedResult.details
            });
        }

        return combinedResult;
    }

    /**
     * Guarda el contenido marcado para revisión posterior del administrador
     * @param {object} flaggedData - Datos del contenido marcado
     */
    logFlaggedContent(flaggedData) {
        const storageKey = this.config.STORAGE_KEYS.FLAGGED_CONTENT;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existingData.push(flaggedData);
        
        // Mantener solo los últimos 100 registros
        if (existingData.length > 100) {
            existingData.shift();
        }
        
        localStorage.setItem(storageKey, JSON.stringify(existingData));
        console.log('Contenido marcado registrado para revisión:', flaggedData.timestamp);
    }

    /**
     * Obtiene el historial de contenido marcado
     * @returns {Array} - Lista de contenidos marcados
     */
    getFlaggedContentHistory() {
        const storageKey = this.config.STORAGE_KEYS.FLAGGED_CONTENT;
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
    }

    /**
     * Limpia el historial de contenido marcado
     */
    clearFlaggedContentHistory() {
        const storageKey = this.config.STORAGE_KEYS.FLAGGED_CONTENT;
        localStorage.removeItem(storageKey);
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentModerator;
}
