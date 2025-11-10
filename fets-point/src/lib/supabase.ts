import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Production-ready environment variable configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuration validation and logging
console.log('🔧 Supabase Configuration:')
console.log('URL Source:', import.meta.env.VITE_SUPABASE_URL ? 'Environment Variable ✅' : 'Missing ❌')
console.log('Key Source:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Environment Variable ✅' : 'Missing ❌')

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
}

console.log('Connection Ready ✅')

// Create and export Supabase client with proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application': 'fets-point'
    }
  }
})

console.log('✅ Supabase client created successfully')

// Helper functions for common operations
export const supabaseHelpers = {
  // Candidates
  async getCandidates(filters?: { date?: string; status?: string; branch_location?: string }) {
    let query = supabase.from('candidates').select('*')
    
    if (filters?.date) {
      query = query.gte('exam_date', `${filters.date}T00:00:00Z`)
                   .lt('exam_date', `${filters.date}T23:59:59Z`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.branch_location && filters.branch_location !== 'global') {
      query = query.eq('branch_location', filters.branch_location)
    }
    
    return query.order('exam_date', { ascending: true })
  },
  
  // Incidents (Events Table)
  async getIncidents(status?: string) {
    let query = supabase.from('events').select('*')

    if (status) {
      query = query.eq('status', status)
    }

    return query.order('created_at', { ascending: false })
  },
  
  // Roster
  async getRosterSchedules(date?: string) {
    let query = supabase
      .from('roster_schedules')
      .select(`
        *,
        staff_profiles!roster_schedules_profile_id_fkey(full_name, role)
      `)

    if (date) {
      query = query.eq('date', date)
    }

    return query.order('date', { ascending: true })
  }
}

// Export configuration for debugging
export const config = {
  url: supabaseUrl,
  keyPreview: supabaseAnonKey.substring(0, 20) + '...'
}

export default supabase
