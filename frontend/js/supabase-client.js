/* ============================================
   Smart UNI-BOT - Supabase Client
   Cliente de Supabase para el frontend
   ============================================ */

// Configuración de Supabase
const SUPABASE_URL = 'https://fvfzscnycdzmxxsrgiyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnpzY255Y2R6bXh4c3JnaXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMTYyOTAsImV4cCI6MjA3ODU5MjI5MH0.zm7Ld_92RDdR3bDHHIHTU1OQxqUJesPMLjtbCqfW9no';

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
