import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://rzuyqgkrkzurafndmcpu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6dXlxZ2tya3p1cmFmbmRtY3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDk3NDIsImV4cCI6MjA4ODc4NTc0Mn0.W7LEdaIfMkoMk4O_v8BlaS0tyOFwecq5uHd-rs8MP3o";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);