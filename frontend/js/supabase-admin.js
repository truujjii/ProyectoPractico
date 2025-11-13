/* ============================================
   Smart UNI-BOT - Supabase Admin Client
   Cliente con Service Role Key para operaciones de administrador
   ============================================ */

// IMPORTANTE: Este archivo solo debe usarse en páginas de administración
// La Service Role Key tiene permisos completos

const SUPABASE_URL = 'https://fvfzscnycdzmxxsrgiyd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnpzY255Y2R6bXh4c3JnaXlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQzODM0NCwiZXhwIjoyMDQ3MDE0MzQ0fQ.kNpPu9OYL_lAEbZkPCfPKxO9f8ijYj8N_8KNZLlKLPo';

// Crear cliente de administrador con Service Role Key
const supabaseAdmin = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
