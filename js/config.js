// js/config.js

// Configuración tolerante a fallos para desarrollo/local
export const config = {
  // Hugging Face: Usa variable de entorno o cadena vacía si no existe
  HF_API_KEY: import.meta.env.VITE_HF_API_KEY || '',
  HF_MODEL: 'martin-ha/toxic-comment-model',
  
  // Google Sheets: ID de tu hoja de cálculo (Cámbialo por el tuyo real)
  GOOGLE_SHEET_ID: '1BxiMvs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // Ejemplo
  
  // Supabase: Opcional. Si está vacío, el sistema usará solo Google Sheets
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Estado del modo backend
  USE_BACKEND: false // Cambiar a true solo cuando tengas Supabase configurado
};

// Función de utilidad para verificar configuración
export function checkConfig() {
  if (!config.HF_API_KEY) {
    console.warn('⚠️ AVISO: No se encontró VITE_HF_API_KEY. La moderación de contenido no funcionará hasta que la configures en Vercel/Netlify.');
  }
  if (!config.GOOGLE_SHEET_ID || config.GOOGLE_SHEET_ID === 'TU_ID_AQUI') {
    console.warn('⚠️ AVISO: Configura tu GOOGLE_SHEET_ID en el código o variables de entorno.');
  }
  return true;
}