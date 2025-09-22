// Supabase type helpers to resolve type inference issues
export type SupabaseRow = Record<string, any>
export type SupabaseInsert = Record<string, any>
export type SupabaseUpdate = Record<string, any>

// Flexible database types for Supabase operations
export interface FlexibleDatabase {
  public: {
    Tables: {
      [key: string]: {
        Row: SupabaseRow
        Insert: SupabaseInsert
        Update: SupabaseUpdate
      }
    }
  }
}

// Keep existing strict types for application logic
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          role: string
          department?: string
          position?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          role: string
          department?: string
          position?: string
        }
        Update: {
          full_name?: string
          email?: string
          role?: string
          department?: string
          position?: string
          updated_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          full_name: string
          email: string
          phone?: string
          exam_date: string
          exam_name?: string
          status: 'registered' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
          confirmation_number: string
          check_in_time?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string
          exam_date: string
          exam_name?: string
          status?: string
          confirmation_number: string
          notes?: string
        }
        Update: {
          full_name?: string
          email?: string
          phone?: string
          exam_date?: string
          exam_name?: string
          status?: string
          check_in_time?: string
          notes?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'rectified' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          reported_by: string
          assigned_to?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: string
          priority?: string
          reported_by: string
          assigned_to?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string
          updated_at?: string
        }
      }
      roster_schedules: {
        Row: {
          id: string
          profile_id: string
          date: string
          shift_code: string
          overtime_hours?: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          date: string
          shift_code: string
          overtime_hours?: number
          status?: string
        }
        Update: {
          date?: string
          shift_code?: string
          overtime_hours?: number
          status?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type Candidate = Tables<'candidates'>
export type Incident = Tables<'incidents'>
export type RosterSchedule = Tables<'roster_schedules'>

// Additional common types
export interface CandidateMetrics {
  total: number
  checkedIn: number
  inProgress: number
  completed: number
}

export interface IncidentStats {
  total: number
  open: number
  inProgress: number
  resolved: number
}

export interface DashboardMetrics {
  candidates: CandidateMetrics
  incidents: IncidentStats
}

// Flexible types for Supabase operations
export type FlexibleCandidate = SupabaseRow
export type FlexibleIncident = SupabaseRow
export type FlexibleRosterSchedule = SupabaseRow
