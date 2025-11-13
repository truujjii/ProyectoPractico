// Configuración de Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fvfzscnycdzmxxsrgiyd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnpzY255Y2R6bXh4c3JnaXlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAxNjI5MCwiZXhwIjoyMDc4NTkyMjkwfQ.OHi1aVkdx5jygph_v1yPdCogxiy0HOCGKWMlT_yChi4';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
