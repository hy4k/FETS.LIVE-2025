import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseHelpers, supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import type { CandidateMetrics, IncidentStats } from '../types/database.types'

// Enhanced candidates query with real-time integration
export const useCandidates = (filters?: { date?: string; status?: string }) => {
  return useQuery<any[], Error>({
    queryKey: ['candidates', filters],
    queryFn: async () => {
      const { data, error } = await supabaseHelpers.getCandidates(filters)
      if (error) throw error
      return data || []
    },
    staleTime: 10000, // Reduced to 10 seconds for better real-time experience
    gcTime: 300000, // 5 minutes cache time
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useCandidateMetrics = (date?: string, branch?: string): { data: CandidateMetrics | undefined; isLoading: boolean; error: Error | null } => {
  return useQuery({
    queryKey: ['candidates', 'metrics', date, branch],
    queryFn: async (): Promise<CandidateMetrics> => {
      const targetDate = date || new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from('candidates')
        .select('*')
        .gte('exam_date', `${targetDate}T00:00:00Z`)
        .lt('exam_date', `${targetDate}T23:59:59Z`)
      
      // Apply branch filtering
      if (branch && branch !== 'global') {
        query = query.eq('branch_location', branch)
      }
      
      const { data, error } = await query.order('exam_date', { ascending: true })
      
      if (error) throw error
      
      return {
        total: data?.length || 0,
        checkedIn: data?.filter(c => c.status === 'checked_in').length || 0,
        inProgress: data?.filter(c => c.status === 'in_progress').length || 0,
        completed: data?.filter(c => c.status === 'completed').length || 0,
      }
    },
    staleTime: 10000, // Reduced for real-time updates
    gcTime: 300000,
    refetchOnWindowFocus: true,
  })
}

// Enhanced incidents query with real-time integration
export const useIncidents = (status?: string) => {
  return useQuery<any[], Error>({
    queryKey: ['incidents', status],
    queryFn: async () => {
      const { data, error } = await supabaseHelpers.getIncidents(status)
      if (error) throw error
      return data || []
    },
    staleTime: 15000, // 15 seconds for incidents
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useIncidentStats = (branch?: string): { data: IncidentStats | undefined; isLoading: boolean; error: Error | null } => {
  return useQuery({
    queryKey: ['incidents', 'stats', branch],
    queryFn: async (): Promise<IncidentStats> => {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          profiles:incidents_reported_by_fkey(full_name)
        `)
      
      // Apply branch filtering
      if (branch && branch !== 'global') {
        query = query.eq('branch_location', branch)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        total: data?.length || 0,
        open: data?.filter(i => i.status === 'open').length || 0,
        inProgress: data?.filter(i => i.status === 'in_progress').length || 0,
        resolved: data?.filter(i => ['rectified', 'closed'].includes(i.status)).length || 0,
      }
    },
    staleTime: 15000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
  })
}

// Enhanced roster query with real-time integration
export const useRosterSchedules = (date?: string) => {
  return useQuery<any[], Error>({
    queryKey: ['roster', date],
    queryFn: async () => {
      const { data, error } = await supabaseHelpers.getRosterSchedules(date)
      if (error) throw error
      return data || []
    },
    staleTime: 30000, // 30 seconds for roster data
    gcTime: 600000, // 10 minutes cache time for roster
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Mutations
export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, { id: string; status: string }>({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('candidates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate status updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`)
    }
  })
}

export const useCreateCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, any>({
    mutationFn: async (candidateData: any) => {
      const { error } = await supabase
        .from('candidates')
        .insert(candidateData)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create candidate: ${error.message}`)
    }
  })
}

export const useUpdateIncident = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('incidents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('Incident updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update incident: ${error.message}`)
    }
  })
}

export const useCreateIncident = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, any>({
    mutationFn: async (incidentData: any) => {
      const { error } = await supabase
        .from('incidents')
        .insert(incidentData)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('Incident created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create incident: ${error.message}`)
    }
  })
}
