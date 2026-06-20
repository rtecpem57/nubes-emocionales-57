/**
 * Módulo de Administración
 * Proporciona acceso seguro al panel de administración mediante combinación de teclas secreta
 */


import { config } from './config.js';
class AdminPanel {
    constructor(config, diagnosticTester, cloudManager, moderator) {
        this.config = config;
        this.diagnosticTester = diagnosticTester;
        this.cloudManager = cloudManager;
        this.moderator = moderator;
        this.isAuthenticated = false;
        this.sessionTimeout = null;
        this.pressedKeys = new Set();
        
        this.initKeyListener();
    }

    /**
     * Inicializa el listener para la combinación de teclas secreta
     */
    initKeyListener() {
        document.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.key);
            
            // Verificar si se presionó la combinación secreta
            if (this.checkSecretCombo()) {
                this.showLoginModal();
                this.pressedKeys.clear();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });
    }

    /**
     * Verifica si se presionó la combinación de teclas secreta
     */
    checkSecretCombo() {
        const requiredKeys = this.config.ADMIN.SECRET_KEY_COMBO;
        return requiredKeys.every(key => this.pressedKeys.has(key));
    }

    /**
     * Muestra el modal de login
     */
    showLoginModal() {
        // Verificar si ya hay sesión activa
        if (this.checkSession()) {
            this.showAdminPanel();
            return;
        }

        // Crear modal de login si no existe
        let modal = document.getElementById('admin-login-modal');
        if (!modal) {
            modal = this.createLoginModal();
        }
        modal.style.display = 'flex';
    }

    /**
     * Crea el modal de login
     */
    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'admin-login-modal';
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #222, #444);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <h2 style="
                    font-family: 'Rubik Distressed', cursive;
                    color: #33ffcc;
                    margin-bottom: 20px;
                    font-size: 2rem;
                ">🔐 Panel de Administración</h2>
                
                <p style="color: #fff; margin-bottom: 20px; font-family: 'Caveat', cursive; font-size: 1.2rem;">
                    Ingresá tu contraseña de administrador
                </p>
                
                <input type="password" id="admin-password" placeholder="Contraseña" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 2px solid #33ffcc;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    background: rgba(255,255,255,0.9);
                    font-family: 'Caveat', cursive;
                ">
                
                <button id="admin-login-btn" style="
                    background: #33ffcc;
                    color: #222;
                    border: none;
                    padding: 15px 30px;
                    font-family: 'Righteous', cursive;
                    font-size: 1.2rem;
                    border-radius: 50px;
                    cursor: pointer;
                    width: 100%;
                    transition: transform 0.2s;
                ">Ingresar</button>
                
                <button id="admin-cancel-btn" style="
                    background: transparent;
                    color: #fff;
                    border: 2px solid #fff;
                    padding: 10px 20px;
                    font-family: 'Caveat', cursive;
                    font-size: 1rem;
                    border-radius: 50px;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                    transition: all 0.2s;
                ">Cancelar</button>
                
                <p id="login-error" style="
                    color: #ff3366;
                    margin-top: 15px;
                    font-family: 'Caveat', cursive;
                    display: none;
                "></p>
            </div>
        `;

        // Estilos del overlay
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('admin-login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('admin-cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        return modal;
    }

    /**
     * Maneja el intento de login
     */
    async handleLogin() {
        const passwordInput = document.getElementById('admin-password');
        const errorMsg = document.getElementById('login-error');
        const password = passwordInput.value.trim();

        // En producción, esto debería validarse contra un backend seguro
        // Por ahora, usamos una contraseña simple configurable
        const correctPassword = localStorage.getItem('adminPassword') || 'admin123';

        if (password === correctPassword) {
            this.isAuthenticated = true;
            this.startSession();
            document.getElementById('admin-login-modal').style.display = 'none';
            passwordInput.value = '';
            errorMsg.style.display = 'none';
            this.showAdminPanel();
        } else {
            errorMsg.textContent = '❌ Contraseña incorrecta';
            errorMsg.style.display = 'block';
            
            // Registrar intento fallido
            this.logFailedAttempt();
        }
    }

    /**
     * Registra intento fallido de login
     */
    logFailedAttempt() {
        const attempts = JSON.parse(localStorage.getItem('adminFailedAttempts') || '[]');
        attempts.push({
            timestamp: new Date().toISOString(),
            ip: 'local' // En producción, obtener IP real
        });
        localStorage.setItem('adminFailedAttempts', JSON.stringify(attempts.slice(-10)));
    }

    /**
     * Inicia la sesión del administrador
     */
    startSession() {
        sessionStorage.setItem(this.config.ADMIN.STORAGE_KEY, JSON.stringify({
            authenticated: true,
            timestamp: Date.now()
        }));

        // Configurar timeout de sesión
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            this.endSession();
        }, this.config.ADMIN.SESSION_DURATION);
    }

    /**
     * Verifica si hay una sesión activa
     */
    checkSession() {
        const sessionData = sessionStorage.getItem(this.config.ADMIN.STORAGE_KEY);
        if (!sessionData) return false;

        const session = JSON.parse(sessionData);
        const now = Date.now();

        if (now - session.timestamp > this.config.ADMIN.SESSION_DURATION) {
            this.endSession();
            return false;
        }

        this.isAuthenticated = true;
        
        // Reiniciar timeout
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            this.endSession();
        }, this.config.ADMIN.SESSION_DURATION);

        return true;
    }

    /**
     * Finaliza la sesión del administrador
     */
    endSession() {
        this.isAuthenticated = false;
        sessionStorage.removeItem(this.config.ADMIN.STORAGE_KEY);
        clearTimeout(this.sessionTimeout);
        this.closeAdminPanel();
    }

    /**
     * Muestra el panel de administración
     */
    showAdminPanel() {
        let panel = document.getElementById('admin-panel');
        
        if (!panel) {
            panel = this.createAdminPanel();
        }
        
        panel.style.display = 'block';
        this.loadAdminData();
    }

    /**
     * Crea el panel de administración
     */
    createAdminPanel() {
        const panel = document.createElement('div');
        panel.id = 'admin-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                right: 0;
                width: 450px;
                height: 100vh;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                z-index: 9999;
                overflow-y: auto;
                padding: 20px;
                color: #fff;
                font-family: 'Caveat', cursive;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #33ffcc;
                ">
                    <h2 style="
                        font-family: 'Rubik Distressed', cursive;
                        color: #33ffcc;
                        font-size: 1.8rem;
                        margin: 0;
                    ">🛠️ Panel de Control</h2>
                    <button id="close-admin-btn" style="
                        background: #ff3366;
                        color: #fff;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        font-size: 1.5rem;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">×</button>
                </div>

                <!-- Sección de Diagnóstico -->
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        font-family: 'Righteous', cursive;
                        color: #ffcc33;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                    ">📊 Diagnóstico del Sistema</h3>
                    
                    <button id="run-diagnostics-btn" style="
                        background: #33ffcc;
                        color: #222;
                        border: none;
                        padding: 12px 20px;
                        font-family: 'Righteous', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        margin-bottom: 15px;
                        transition: transform 0.2s;
                    ">▶️ Ejecutar Tests de Diagnóstico</button>
                    
                    <div id="diagnostics-results" style="
                        background: rgba(0,0,0,0.3);
                        padding: 15px;
                        border-radius: 10px;
                        max-height: 300px;
                        overflow-y: auto;
                        font-size: 0.95rem;
                        display: none;
                    "></div>
                    
                    <button id="export-diagnostics-btn" style="
                        background: #ffcc33;
                        color: #222;
                        border: none;
                        padding: 10px 20px;
                        font-family: 'Caveat', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        margin-top: 10px;
                        display: none;
                    ">📥 Exportar Resultados</button>
                </div>

                <!-- Sección de Contenido Marcado -->
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        font-family: 'Righteous', cursive;
                        color: #ff69b4;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                    ">⚠️ Contenido Moderado</h3>
                    
                    <button id="view-flagged-btn" style="
                        background: #ff69b4;
                        color: #fff;
                        border: none;
                        padding: 12px 20px;
                        font-family: 'Righteous', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        margin-bottom: 15px;
                        transition: transform 0.2s;
                    ">👁️ Ver Contenido Marcado</button>
                    
                    <div id="flagged-content" style="
                        background: rgba(0,0,0,0.3);
                        padding: 15px;
                        border-radius: 10px;
                        max-height: 200px;
                        overflow-y: auto;
                        font-size: 0.9rem;
                        display: none;
                    "></div>
                    
                    <button id="clear-flagged-btn" style="
                        background: #ff3366;
                        color: #fff;
                        border: none;
                        padding: 10px 20px;
                        font-family: 'Caveat', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        margin-top: 10px;
                        display: none;
                    ">🗑️ Limpiar Historial</button>
                </div>

                <!-- Sección de Mensajes Personalizados -->
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        font-family: 'Righteous', cursive;
                        color: #33ffcc;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                    ">💬 Mensajes Triple Clic</h3>
                    
                    <textarea id="custom-messages-input" placeholder="Ingresa mensajes separados por coma..." style="
                        width: 100%;
                        min-height: 100px;
                        padding: 15px;
                        border: 2px solid #33ffcc;
                        border-radius: 10px;
                        font-family: 'Caveat', cursive;
                        font-size: 1rem;
                        background: rgba(255,255,255,0.9);
                        resize: vertical;
                    "></textarea>
                    
                    <button id="save-messages-btn" style="
                        background: #33ffcc;
                        color: #222;
                        border: none;
                        padding: 12px 20px;
                        font-family: 'Righteous', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        margin-top: 15px;
                        transition: transform 0.2s;
                    ">💾 Guardar Mensajes</button>
                </div>

                <!-- Sección de Configuración -->
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        font-family: 'Righteous', cursive;
                        color: #ffcc33;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                    ">⚙️ Configuración</h3>
                    
                    <label style="display: block; margin-bottom: 10px; font-size: 1rem;">
                        🔑 Nueva Contraseña de Admin:
                    </label>
                    <input type="text" id="new-admin-password" placeholder="Dejar vacío para mantener actual" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ffcc33;
                        border-radius: 10px;
                        font-family: 'Caveat', cursive;
                        font-size: 1rem;
                        background: rgba(255,255,255,0.9);
                        margin-bottom: 15px;
                    ">
                    
                    <button id="update-password-btn" style="
                        background: #ffcc33;
                        color: #222;
                        border: none;
                        padding: 12px 20px;
                        font-family: 'Righteous', cursive;
                        font-size: 1rem;
                        border-radius: 10px;
                        cursor: pointer;
                        width: 100%;
                        transition: transform 0.2s;
                    ">🔄 Actualizar Contraseña</button>
                </div>

                <!-- Botón de Cerrar Sesión -->
                <button id="logout-btn" style="
                    background: #444;
                    color: #fff;
                    border: 2px solid #fff;
                    padding: 12px 20px;
                    font-family: 'Righteous', cursive;
                    font-size: 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s;
                ">🚪 Cerrar Sesión</button>
            </div>
        `;

        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('close-admin-btn').addEventListener('click', () => this.closeAdminPanel());
        document.getElementById('logout-btn').addEventListener('click', () => this.endSession());
        document.getElementById('run-diagnostics-btn').addEventListener('click', () => this.runDiagnostics());
        document.getElementById('export-diagnostics-btn').addEventListener('click', () => this.exportDiagnostics());
        document.getElementById('view-flagged-btn').addEventListener('click', () => this.viewFlaggedContent());
        document.getElementById('clear-flagged-btn').addEventListener('click', () => this.clearFlaggedContent());
        document.getElementById('save-messages-btn').addEventListener('click', () => this.saveCustomMessages());
        document.getElementById('update-password-btn').addEventListener('click', () => this.updatePassword());

        return panel;
    }

    /**
     * Cierra el panel de administración
     */
    closeAdminPanel() {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Carga datos iniciales del panel
     */
    loadAdminData() {
        // Cargar mensajes personalizados actuales
        const currentMessages = this.cloudManager?.getCustomMessages() || [];
        const messagesInput = document.getElementById('custom-messages-input');
        if (messagesInput && currentMessages.length > 0) {
            messagesInput.value = currentMessages.join(', ');
        }
    }

    /**
     * Ejecuta los tests de diagnóstico
     */
    async runDiagnostics() {
        const resultsDiv = document.getElementById('diagnostics-results');
        const exportBtn = document.getElementById('export-diagnostics-btn');
        
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = '<p style="color: #33ffcc;">⏳ Ejecutando tests...</p>';

        try {
            const results = await this.diagnosticTester.runAllTests();
            
            let html = `<div style="margin-bottom: 15px; padding: 10px; background: ${results.summary.overallStatus === 'HEALTHY' ? 'rgba(51,255,204,0.2)' : 'rgba(255,51,102,0.2)'}; border-radius: 10px;">`;
            html += `<strong>Resumen:</strong> ${results.summary.passed}/${results.summary.total} tests pasados (${results.summary.successRate})<br>`;
            html += `<strong>Estado:</strong> ${results.summary.overallStatus}<br>`;
            html += `<strong>Duración:</strong> ${results.duration}ms`;
            html += `</div>`;

            results.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : '❌';
                const color = test.status === 'PASS' ? '#33ffcc' : '#ff3366';
                html += `<div style="padding: 8px; margin: 5px 0; background: rgba(0,0,0,0.2); border-radius: 5px; border-left: 3px solid ${color};">`;
                html += `${icon} <strong style="color: ${color};">${test.name}</strong>: ${test.details}`;
                if (test.data) {
                    html += `<br><small style="color: #aaa;">${JSON.stringify(test.data)}</small>`;
                }
                html += `</div>`;
            });

            resultsDiv.innerHTML = html;
            exportBtn.style.display = 'block';
            
            // Guardar resultados para exportación
            this.lastDiagnosticResults = results;

        } catch (error) {
            resultsDiv.innerHTML = `<p style="color: #ff3366;">❌ Error al ejecutar diagnósticos: ${error.message}</p>`;
        }
    }

    /**
     * Exporta los resultados de diagnóstico
     */
    exportDiagnostics() {
        if (!this.lastDiagnosticResults) return;

        const dataStr = this.diagnosticTester.exportResults();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostico_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Muestra el contenido marcado
     */
    viewFlaggedContent() {
        const contentDiv = document.getElementById('flagged-content');
        const clearBtn = document.getElementById('clear-flagged-btn');
        
        const report = this.diagnosticTester.getFlaggedContentReport();
        
        if (report.error) {
            contentDiv.innerHTML = `<p style="color: #ff3366;">${report.error}</p>`;
            return;
        }

        contentDiv.style.display = 'block';
        clearBtn.style.display = 'block';

        if (report.totalFlagged === 0) {
            contentDiv.innerHTML = '<p style="color: #33ffcc;">✓ No hay contenido marcado</p>';
            return;
        }

        let html = `<p style="margin-bottom: 10px;"><strong>Total:</strong> ${report.totalFlagged} registros</p>`;
        
        report.content.slice(-10).reverse().forEach((item, index) => {
            html += `<div style="padding: 10px; margin: 5px 0; background: rgba(255,105,180,0.1); border-radius: 5px; border-left: 3px solid #ff69b4;">`;
            html += `<small style="color: #aaa;">${new Date(item.timestamp).toLocaleString()}</small><br>`;
            html += `<strong>Sentimiento:</strong> ${item.feeling}<br>`;
            html += `<strong>Razón:</strong> ${item.reason}<br>`;
            html += `<small style="color: #ffcc33;">Score: ${item.details?.feeling?.score || 0} (umbral: ${this.moderator?.threshold || 0.7})</small>`;
            html += `</div>`;
        });

        contentDiv.innerHTML = html;
    }

    /**
     * Limpia el contenido marcado
     */
    clearFlaggedContent() {
        const result = this.diagnosticTester.clearFlaggedContent();
        
        if (result.success) {
            alert('✓ Historial limpiado exitosamente');
            this.viewFlaggedContent(); // Refrescar vista
        } else {
            alert('❌ Error al limpiar historial');
        }
    }

    /**
     * Guarda mensajes personalizados
     */
    saveCustomMessages() {
        const input = document.getElementById('custom-messages-input');
        const messages = input.value.split(',').map(m => m.trim()).filter(m => m.length > 0);

        if (messages.length === 0) {
            alert('⚠️ Ingresa al menos un mensaje');
            return;
        }

        this.cloudManager?.saveCustomMessages(messages);
        alert(`✓ ${messages.length} mensajes guardados exitosamente`);
    }

    /**
     * Actualiza la contraseña de administrador
     */
    updatePassword() {
        const input = document.getElementById('new-admin-password');
        const newPassword = input.value.trim();

        if (!newPassword) {
            alert('⚠️ Ingresa una nueva contraseña');
            return;
        }

        if (newPassword.length < 6) {
            alert('⚠️ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        localStorage.setItem('adminPassword', newPassword);
        input.value = '';
        alert('✓ Contraseña actualizada exitosamente');
    }
}

// Exportar para uso en otros módulos (ES6)
export { AdminPanel };
