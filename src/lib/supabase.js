import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ssrfkclvzvjzipunpalh.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmZrY2x2enZqemlwdW5wYWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTI5NDksImV4cCI6MjA5MjM2ODk0OX0.JibvsRZB7hhfungMorwVF8Zom7_sudlVXTksAVQLsOo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
