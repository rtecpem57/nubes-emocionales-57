# Guía de Configuración - Moderación de Contenido

## 🔄 Cambio de Perspective API a Hugging Face

**Importante:** Perspective API está discontinándose. Hemos migrado a **Hugging Face Inference API** que es gratuita y de acceso abierto.

---

## 📋 Configuración del Servicio de Moderación

### Opción 1: Hugging Face (Recomendada - Gratuita)

#### Pasos para obtener tu token gratuito:

1. **Crear cuenta en Hugging Face**
   - Visitá: https://huggingface.co/join
   - Registrarse es gratuito

2. **Obtener Token de Acceso**
   - Ir a: https://huggingface.co/settings/tokens
   - Click en "Create new token"
   - Nombre: `feelings-poll-moderation`
   - Tipo: `read` (solo lectura)
   - Copiar el token generado

3. **Configurar en la aplicación**
   ```javascript
   // En config.js o desde el panel de admin
   MODERATION: {
       ENABLED: true,
       HF_API_URL: 'https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model',
       HF_API_TOKEN: 'tu_token_aqui',
       TOXICITY_THRESHOLD: 0.7
   }
   ```

4. **Modelos alternativos disponibles**
   
   | Modelo | URL | Idiomas | Notas |
   |--------|-----|---------|-------|
   | martin-ha/toxic-comment-model | `https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model` | EN/ES | Recomendado |
   | unitary/toxic-bert | `https://api-inference.huggingface.co/models/unitary/toxic-bert` | EN | Solo inglés |
   | Joaaan/bert-toxic-spanish | `https://api-inference.huggingface.co/models/Joaaan/bert-toxic-spanish` | ES | Solo español |

---

### Opción 2: Detoxify (Python - Para backend propio)

Si prefieren correr el modelo localmente (requiere backend Python):

```bash
pip install detoxify
```

```python
from detoxify import Detoxify

model = Detoxify('multilingual')  # Soporta español
results = model.predict("texto a analizar")
print(results)
# {'toxicity': 0.001, 'severe_toxicity': 0.001, ...}
```

**Ventajas:**
- ✅ Totalmente gratuito
- ✅ Sin límites de API
- ✅ Funciona offline
- ✅ Múltiples idiomas

**Desventajas:**
- ❌ Requiere servidor Python
- ❌ Más complejo de implementar

---

### Opción 3: Azure Content Safety (Gratis con límites)

Microsoft ofrece 5,000 llamadas gratuitas/mes:

1. Crear cuenta Azure: https://azure.microsoft.com/free/
2. Crear recurso "Content Safety"
3. Obtener endpoint y key
4. Usar en lugar de Hugging Face

---

## 🔧 Configuración desde el Panel de Admin

Una vez obtenida la clave de Hugging Face:

1. Abrir la aplicación web
2. Presionar `Ctrl + Shift + A` (combinación secreta)
3. Ingresar contraseña (por defecto: `admin123`)
4. Ir a sección "⚙️ Configuración"
5. Pegar el token en el campo correspondiente
6. Click en "Guardar Configuración"

---

## 🎯 Cómo Funciona la Moderación

### Flujo de procesamiento:

```
Usuario ingresa sentimiento
         ↓
    Análisis con IA
         ↓
    ¿Es tóxico? (score >= 0.7)
         ↓
    ┌───────┴───────┐
    │               │
   SÍ              NO
    │               │
    ↓               ↓
Guardar en      Guardar en
Google Sheets   Google Sheets
    │               │
    ↓               ↓
NO mostrar      Mostrar en
en nubes        nubes del juego
```

### Datos guardados en Google Sheets:

| Columna | Descripción |
|---------|-------------|
| Timestamp | Fecha y hora |
| Feeling | Sentimiento ingresado |
| Reason | Razón ingresada |
| Toxic Score | Puntaje de toxicidad (0-1) |
| Is Flagged | ¿Fue marcado como tóxico? (TRUE/FALSE) |
| Displayed | ¿Se mostró en UI? (TRUE/FALSE) |

---

## 🧪 Testing de la Moderación

### Textos de prueba:

**Tóxicos (deberían ser marcados):**
- "Eres un idiota"
- "Te odio, eres horrible"
- "Quiero lastimarte"

**No tóxicos (deberían pasar):**
- "Hoy me siento feliz"
- "Estoy un poco estresado"
- "Extraño a mis amigos"

### Verificación:

1. Ir al panel de admin (`Ctrl + Shift + A`)
2. Click en "👁️ Ver Contenido Marcado"
3. Verificar que los textos tóxicos aparecen
4. Verificar que los no tóxicos NO aparecen

---

## 📊 Límites de la API Gratuita

### Hugging Face Inference API (Free Tier):

- **Llamadas:** ~30,000/mes gratis
- **Rate Limit:** 30 requests/minuto
- **Model Load Time:** 20-30 segundos si el modelo está "dormido"

### Recomendaciones:

1. **Cache local:** Los resultados se cachean por sesión
2. **Fallback graceful:** Si la API falla, el contenido se permite pero se registra
3. **Batch processing:** Para análisis masivos, considerar backend propio

---

## 🔒 Seguridad y Privacidad

### Buenas prácticas implementadas:

✅ Los datos tóxicos se guardan pero no se muestran públicamente  
✅ El administrador puede revisar contenido marcado  
✅ Los tokens de API nunca se exponen en el código frontend  
✅ Sesión de admin expira después de 1 hora  
✅ Intentos fallidos de login se registran  

### Para producción:

⚠️ **Importante:** En un entorno de producción real:
- Validar contraseñas contra un backend seguro
- Usar HTTPS siempre
- Rotar tokens periódicamente
- Implementar rate limiting adicional
- Considerar encriptación de datos sensibles

---

## 🆘 Solución de Problemas

### Error: "HTTP error! status: 401"
- **Causa:** Token inválido o expirado
- **Solución:** Regenerar token en Hugging Face

### Error: "HTTP error! status: 429"
- **Causa:** Rate limit excedido
- **Solución:** Esperar 1 minuto o aumentar tier

### Error: "Model is loading"
- **Causa:** El modelo está "dormido" (inactivo)
- **Solución:** Esperar 20-30 segundos, reintentar automáticamente

### Moderación no funciona
- Verificar que `MODERATION.ENABLED = true`
- Verificar que hay token configurado
- Revisar consola del navegador para errores

---

## 📚 Recursos Adicionales

- [Documentación Hugging Face](https://huggingface.co/docs/api-inference)
- [Modelo Toxic Comment](https://huggingface.co/martin-ha/toxic-comment-model)
- [Detoxify GitHub](https://github.com/unitaryai/detoxify)
- [Azure Content Safety](https://learn.microsoft.com/azure/ai-services/content-safety/)

---

## 🎓 Para Estudiantes

Este módulo es un excelente ejemplo de:

1. **Arquitectura modular:** El moderador está aislado en `moderator.js`
2. **Manejo de errores:** Fallbacks graceful cuando la API falla
3. **Configuración externalizada:** Todo configurable sin tocar código
4. **Privacidad por diseño:** Datos sensibles protegidos

**Ideas para扩展:**
- Agregar más modelos de IA
- Implementar aprendizaje automático personalizado
- Crear dashboard de estadísticas de moderación
- Añadir soporte para imágenes (DALL-E moderation API)
