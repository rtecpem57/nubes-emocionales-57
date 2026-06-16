# Nubes Emocionales - Web App Modular para Institución Educativa

## 📋 Descripción

Aplicación web que permite a los estudiantes compartir sus sentimientos de forma anónima. El contenido se guarda en Google Sheets y se visualiza como nubes flotantes interactivas.

## 🏗️ Arquitectura Modular

La aplicación está organizada en módulos independientes que los estudiantes pueden modificar o extender sin afectar la lógica central:

```
/workspace
├── index.html              # Punto de entrada principal
├── css/
│   └── main.css           # Estilos principales (extensible)
├── js/
│   ├── config.js          # Configuración centralizada
│   ├── moderator.js       # Moderación de contenido (Perspective API)
│   ├── cloudManager.js    # Gestión de nubes emocionales
│   ├── formHandler.js     # Manejo de formularios y envíos
│   ├── diagnosticTester.js # Tests de diagnóstico (solo admin)
│   ├── adminPanel.js      # Panel de administración secreto
│   ├── main.js            # Inicialización de la aplicación
│   └── game/
│       └── cloudGame.js   # Mini-juego de nubes
└── admin/                 # (Futuro) Scripts adicionales de administración
```

## 🔧 Módulos Existentes

### 1. `config.js` - Configuración Centralizada
- URLs de servicios externos (Google Sheets, Perspective API)
- Constantes y límites de la aplicación
- Configuración de moderación
- Combinación secreta para acceso admin

### 2. `moderator.js` - Moderación de Contenido
- Integra con **Perspective API** (gratuita de Google)
- Detecta lenguaje tóxico, ofensivo, insultos, amenazas
- Guarda todo en Google Sheets pero oculta contenido inapropiado de la UI
- Registra contenido marcado para revisión del administrador

### 3. `cloudManager.js` - Gestión de Nubes
- Crea y gestiona las nubes emocionales
- Maneja animaciones y eventos de clic
- Soporta mensajes personalizados para el "triple clic"

### 4. `formHandler.js` - Manejo de Formularios
- Captura y valida entradas de usuario
- Envía datos a Google Sheets
- Gestiona modo offline con sincronización automática

### 5. `diagnosticTester.js` - Tests de Diagnóstico
- Verifica conexión a Internet y Google Sheets
- Testea localStorage, validaciones, moderación
- Comprueba integridad del DOM y protección XSS
- Genera reportes exportables en JSON

### 6. `adminPanel.js` - Panel de Administración Secreto
- **Acceso**: Presionar `Ctrl + Shift + A`
- Requiere contraseña (default: `admin123`)
- Funcionalidades:
  - Ejecutar tests de diagnóstico
  - Ver contenido moderado/marcado
  - Personalizar mensajes del triple clic
  - Cambiar contraseña de admin
  - Exportar resultados

### 7. `game/cloudGame.js` - Mini-Juego
- Juego relax de "explotar nubes"
- Totalmente aislado del resto de la aplicación

### 8. `main.js` - Inicializador
- Orquesta todos los módulos
- Configura event listeners globales
- Expone funciones de debug en desarrollo

## 🎮 Características Principales

### Para Usuarios Estudiantes
- ✅ Formulario simple para compartir sentimientos
- ✅ Visualización como nubes flotantes interactivas
- ✅ Triple clic en una nube revela mensaje especial
- ✅ Mini-juego relax en la parte inferior
- ✅ Personaje bobblehead que sigue el input
- ✅ Funcionamiento offline con sincronización

### Para Administradores
- 🔐 Acceso secreto con combinación de teclas (`Ctrl+Shift+A`)
- 📊 Panel de diagnóstico con tests automáticos
- ⚠️ Visor de contenido moderado/inapropiado
- 💬 Personalización de mensajes sorpresa
- 📥 Exportación de reportes en JSON
- 🔑 Cambio de contraseña seguro

### Moderación de Contenido
- 🛡️ Integración con Perspective API (gratuita)
- 📝 Todo se guarda en Google Sheets (para registro)
- 👻 Contenido inapropiado no se muestra en la UI
- 📋 Historial de contenido marcado disponible para admin

## 🚀 Cómo Usar

### Para Estudiantes
1. Abrir `index.html` en un navegador
2. Completar los campos de sentimiento y razón
3. Click en "Compartir Mis Sentimientos"
4. Explorar las nubes existentes (triple clic para sorpresa!)
5. Jugar al mini-juego de nubes en la parte inferior

### Para Administradores
1. Presionar `Ctrl + Shift + A` simultáneamente
2. Ingresar contraseña (cambiarla después de primer uso!)
3. Acceder a:
   - Tests de diagnóstico
   - Contenido moderado
   - Configuración de mensajes
   - Exportar datos

## 🔐 Configuración de Perspective API

Para habilitar la moderación de contenido:

1. Obtener API key gratuita en: https://perspectiveapi.com/
2. Editar `js/config.js`:
```javascript
MODERATION: {
    ENABLED: true,
    API_KEY: 'TU_API_KEY_AQUI',
    TOXICITY_THRESHOLD: 0.7,
    // ...
}
```

## 📝 Extender la Aplicación (Para Estudiantes)

### Agregar un Nuevo Módulo JavaScript
1. Crear archivo en `js/` o subcarpeta
2. Usar patrón modular (clase o IIFE)
3. Importar en `index.html` en orden correcto
4. Inicializar desde `main.js`

### Agregar Nuevos Estilos
1. Editar `css/main.css`
2. Seguir convención BEM para nombres de clases
3. Usar variables CSS definidas en `:root`

### Ejemplo: Nuevo Módulo de Estadísticas
```javascript
// js/stats.js
class StatsModule {
    constructor(config) {
        this.config = config;
    }
    
    getCloudCount() {
        return document.querySelectorAll('.cloud').length;
    }
    
    // Más métodos...
}
```

## 🧪 Tests de Diagnóstico Incluidos

El sistema ejecuta automáticamente:
- ✅ Conexión a Internet
- ✅ Conexión con Google Sheets
- ✅ Almacenamiento Local (localStorage)
- ✅ Validación de Formularios
- ✅ Moderación de Contenido
- ✅ Integridad del DOM
- ✅ Protección XSS Básica
- ✅ Gestión de Nubes

## 📄 Licencia

Proyecto educativo de código abierto.

---

**Desarrollado para instituciones educativas** 🎓
**Modular • Seguro • Extensible**
