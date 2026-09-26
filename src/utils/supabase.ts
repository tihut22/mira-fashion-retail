import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = Boolean(
  rawUrl &&
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('http') &&
  rawUrl !== 'YOUR_SUPABASE_URL'
);

const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  isValidUrl && rawKey
    ? rawKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

if (!isValidUrl) {
  console.warn(
    'Supabase URL or Anon Key is missing or unconfigured. Operating in local mode with memory/localStorage fallback.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
