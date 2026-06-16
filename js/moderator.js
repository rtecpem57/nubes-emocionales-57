/**
 * Módulo de Moderación de Contenido
 * Integra con Hugging Face Inference API (gratuita) para detectar lenguaje ofensivo
 * Modelo: martin-ha/toxic-comment-model (soporta español e inglés)
 */

class ContentModerator {
    constructor(config) {
        this.config = config;
        this.apiToken = config.MODERATION.HF_API_TOKEN;
        this.apiUrl = config.MODERATION.HF_API_URL;
        this.threshold = config.MODERATION.TOXICITY_THRESHOLD;
        this.enabled = config.MODERATION.ENABLED;
    }

    /**
     * Analiza un texto para detectar contenido tóxico u ofensivo
     * @param {string} text - El texto a analizar
     * @returns {Promise<object>} - Resultado del análisis
     */
    async analyzeText(text) {
        if (!this.enabled || !this.apiToken) {
            return { isToxic: false, score: 0, saveOnly: false };
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify({
                    inputs: text,
                    parameters: {
                        wait_for_model: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Hugging Face devuelve array de resultados con etiquetas y scores
            // Formato: [{label: 'toxic', score: 0.95}, {label: 'non-toxic', score: 0.05}]
            let toxicScore = 0;
            
            if (Array.isArray(data)) {
                const toxicResult = data.find(item => 
                    item.label.toLowerCase().includes('toxic') && 
                    !item.label.toLowerCase().includes('non')
                );
                toxicScore = toxicResult ? toxicResult.score : 0;
            } else if (data.toxic) {
                toxicScore = data.toxic;
            }

            const isToxic = toxicScore >= this.threshold;

            return {
                isToxic,
                score: toxicScore,
                saveOnly: isToxic, // Si es tóxico, solo guardar en Sheets, no mostrar
                rawResponse: data
            };

        } catch (error) {
            console.error('Error al analizar contenido con Hugging Face:', error);
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
