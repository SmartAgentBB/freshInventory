import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Use hardcoded values for now since environment variables might not be available
const SUPABASE_URL = 'https://fwoykfbumwsbodrconeo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0';

export const initializeSupabase = (): SupabaseClient => {
  const url = SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // Return a mock client for development/testing if no credentials
    console.warn('Supabase credentials not found, using mock client');
    // For now, still use the hardcoded values
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  return createClient(url, key);
};

// Create the default client instance
export const supabaseClient: SupabaseClient = initializeSupabase();