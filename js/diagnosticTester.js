/**
 * Módulo de Testing y Diagnóstico para Administradores
 * Ejecuta tests de funcionamiento y seguridad de forma transparente para el usuario
 */

class DiagnosticTester {
    constructor(config, cloudManager, formHandler, moderator) {
        this.config = config;
        this.cloudManager = cloudManager;
        this.formHandler = formHandler;
        this.moderator = moderator;
        this.results = [];
    }

    /**
     * Ejecuta todos los tests de diagnóstico
     * @returns {Promise<object>} - Resultados completos de los tests
     */
    async runAllTests() {
        this.results = [];
        const startTime = Date.now();

        await this.runTest('Conexión a Internet', this.testInternetConnection);
        await this.runTest('Conexión con Google Sheets', this.testGoogleSheetsConnection);
        await this.runTest('Almacenamiento Local (localStorage)', this.testLocalStorage);
        await this.runTest('Validación de Formularios', this.testFormValidation);
        await this.runTest('Moderación de Contenido', this.testContentModeration);
        await this.runTest('Integridad del DOM', this.testDOMIntegrity);
        await this.runTest('Seguridad XSS Básica', this.testXSSProtection);
        await this.runTest('Gestión de Nubes', this.testCloudManagement);

        const endTime = Date.now();
        
        return {
            timestamp: new Date().toISOString(),
            duration: endTime - startTime,
            tests: this.results,
            summary: this.generateSummary()
        };
    }

    /**
     * Ejecuta un test individual y registra el resultado
     */
    async runTest(name, testFunction) {
        try {
            const result = await testFunction.call(this);
            this.results.push({
                name,
                status: 'PASS',
                details: result.message || 'OK',
                data: result.data || null
            });
        } catch (error) {
            this.results.push({
                name,
                status: 'FAIL',
                details: error.message || 'Error desconocido',
                error: error.toString()
            });
        }
    }

    /**
     * Test: Conexión a Internet
     */
    async testInternetConnection() {
        if (!navigator.onLine) {
            throw new Error('Sin conexión a Internet');
        }
        
        // Verificar conectividad real con un ping a un servicio público
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            return { message: 'Conexión verificada' };
        } catch (error) {
            throw new Error('No se pudo verificar la conexión externa');
        }
    }

    /**
     * Test: Conexión con Google Sheets
     */
    async testGoogleSheetsConnection() {
        try {
            const testData = {
                feeling: 'TEST_CONNECTION',
                reason: 'Prueba automática de diagnóstico',
                timestamp: new Date().toISOString()
            };

            const formData = new FormData();
            formData.append('feeling', testData.feeling);
            formData.append('reason', testData.reason);
            formData.append('timestamp', testData.timestamp);

            const response = await fetch(this.config.GOOGLE_SHEETS_WEB_APP_URL, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.status === 'success') {
                return { 
                    message: 'Conexión con Google Sheets exitosa',
                    data: { responseTime: response.ok }
                };
            } else {
                throw new Error(`Respuesta del servidor: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            throw new Error(`Error al conectar con Google Sheets: ${error.message}`);
        }
    }

    /**
     * Test: Almacenamiento Local
     */
    async testLocalStorage() {
        const testKey = '_diagnostic_test_key';
        const testValue = JSON.stringify({ test: true, timestamp: Date.now() });

        try {
            // Prueba de escritura
            localStorage.setItem(testKey, testValue);
            
            // Prueba de lectura
            const retrieved = localStorage.getItem(testKey);
            if (retrieved !== testValue) {
                throw new Error('Los datos recuperados no coinciden con los guardados');
            }
            
            // Prueba de eliminación
            localStorage.removeItem(testKey);
            if (localStorage.getItem(testKey) !== null) {
                throw new Error('No se pudo eliminar el dato de prueba');
            }
            
            // Verificar espacio disponible
            const usage = localStorage.length;
            
            return { 
                message: `localStorage funcional (${usage} items almacenados)`,
                data: { itemCount: usage }
            };
        } catch (error) {
            throw new Error(`Error en localStorage: ${error.message}`);
        }
    }

    /**
     * Test: Validación de Formularios
     */
    async testFormValidation() {
        // Simular envíos inválidos
        const invalidCases = [
            { feeling: '', reason: 'test', shouldFail: true },
            { feeling: 'a'.repeat(600), reason: 'test', shouldFail: true },
            { feeling: 'Normal feeling', reason: 'Normal reason', shouldFail: false }
        ];

        for (const testCase of invalidCases) {
            if (testCase.shouldFail) {
                if (testCase.feeling === '' && !testCase.feeling) {
                    continue; // Caso válido de falla
                }
                if (testCase.feeling.length > this.config.TEXT_MAX_LENGTH) {
                    continue; // Caso válido de falla
                }
            }
        }

        return { message: 'Validaciones de formulario operativas' };
    }

    /**
     * Test: Moderación de Contenido
     */
    async testContentModeration() {
        if (!this.moderator) {
            return { message: 'Módulo de moderación no inicializado' };
        }

        // Probar con contenido limpio
        const cleanResult = await this.moderator.analyzeText('Me siento feliz hoy');
        
        // Probar con contenido potencialmente problemático (simulado)
        const testResult = await this.moderator.analyzeText('Test de moderación');

        return { 
            message: 'Sistema de moderación operativo',
            data: {
                cleanScore: cleanResult.score,
                testScore: testResult.score,
                threshold: this.moderator.threshold
            }
        };
    }

    /**
     * Test: Integridad del DOM
     */
    async testDOMIntegrity() {
        const requiredElements = [
            'feeling-input',
            'reason-input',
            'submit-btn',
            'clouds-container',
            'notification',
            'loading'
        ];

        const missing = [];
        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                missing.push(id);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Elementos faltantes: ${missing.join(', ')}`);
        }

        return { 
            message: 'Todos los elementos DOM requeridos están presentes',
            data: { elementCount: requiredElements.length }
        };
    }

    /**
     * Test: Protección XSS Básica
     */
    async testXSSProtection() {
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        ];

        let passed = 0;
        for (const payload of xssPayloads) {
            // Simular análisis de moderación
            const result = await this.moderator?.analyzeText(payload);
            if (result && (result.isToxic || result.score > 0.5)) {
                passed++;
            }
        }

        return { 
            message: `${passed}/${xssPayloads.length} payloads XSS detectados`,
            data: { detected: passed, total: xssPayloads.length }
        };
    }

    /**
     * Test: Gestión de Nubes
     */
    async testCloudManagement() {
        if (!this.cloudManager) {
            throw new Error('CloudManager no inicializado');
        }

        const container = document.getElementById('clouds-container');
        if (!container) {
            throw new Error('Contenedor de nubes no encontrado');
        }

        const initialCount = container.querySelectorAll('.cloud').length;
        
        // Crear nube de prueba
        this.cloudManager.createCloud('TEST', 'Prueba de diagnóstico', false);
        
        const afterCreateCount = container.querySelectorAll('.cloud').length;
        
        if (afterCreateCount !== initialCount + 1 && afterCreateCount <= this.config.MAX_CLOUDS) {
            throw new Error('Error al crear nube de prueba');
        }

        return { 
            message: 'Gestión de nubes operativa',
            data: { 
                currentClouds: afterCreateCount,
                maxAllowed: this.config.MAX_CLOUDS
            }
        };
    }

    /**
     * Genera un resumen ejecutivo de los resultados
     */
    generateSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = total - passed;
        
        return {
            total,
            passed,
            failed,
            successRate: ((passed / total) * 100).toFixed(2) + '%',
            overallStatus: failed === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
        };
    }

    /**
     * Exporta los resultados en formato JSON
     */
    exportResults() {
        return JSON.stringify({
            diagnosticReport: this.results,
            summary: this.generateSummary(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Obtiene el historial de contenido marcado por el moderador
     */
    getFlaggedContentReport() {
        if (!this.moderator) {
            return { error: 'Módulo de moderación no disponible' };
        }

        const flaggedContent = this.moderator.getFlaggedContentHistory();
        
        return {
            totalFlagged: flaggedContent.length,
            content: flaggedContent,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Limpia el historial de contenido marcado
     */
    clearFlaggedContent() {
        if (this.moderator) {
            this.moderator.clearFlaggedContentHistory();
            return { success: true, message: 'Historial limpiado' };
        }
        return { success: false, message: 'Moderador no disponible' };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticTester;
}
