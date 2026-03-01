import { createClient } from '@supabase/supabase-js';
import 'expo-sqlite/localStorage/install';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env file.');
}

if (!supabasePublishableKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable. Please add it to your .env file.');
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTPS');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})