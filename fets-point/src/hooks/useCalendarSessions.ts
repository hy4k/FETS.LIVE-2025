import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDateForIST } from '../utils/dateUtils'
import { Session } from '../types' // Assuming a shared Session type

const fetchCalendarSessions = async (currentDate: Date, activeBranch: string, applyFilter: (q: any) => any, isGlobalView: boolean) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  const startDateIST = formatDateForIST(startOfMonth)
  const endDateIST = formatDateForIST(endOfMonth)
  
  let query = supabase
    .from('sessions')
    .select('*')
    .gte('date', startDateIST)
    .lte('date', endDateIST)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (!isGlobalView) {
    query = applyFilter(query)
  }

  let { data, error } = await query

  // Handle fallback for legacy Calicut data without a branch_location
  if (error || (!data || data.length === 0)) {
    const isMissingColumnError = (error as any)?.message?.includes('branch_location')
    if ((isMissingColumnError || data?.length === 0) && activeBranch === 'calicut' && !isGlobalView) {
      const fallbackQuery = supabase
        .from('sessions')
        .select('*')
        .gte('date', startDateIST)
        .lte('date', endDateIST)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      if (!fallbackError && fallbackData) {
        data = fallbackData
        error = null // Clear previous error
      }
    }
  }

  if (error) throw new Error(error.message)
  
  return (data as Session[]) || []
}

export const useCalendarSessions = (currentDate: Date, activeBranch: string, applyFilter: (q: any) => any, isGlobalView: boolean) => {
  const queryKey = ['sessions', 'calendar', currentDate.getFullYear(), currentDate.getMonth(), activeBranch]
  
  return useQuery<Session[], Error>({
    queryKey,
    queryFn: () => fetchCalendarSessions(currentDate, activeBranch, applyFilter, isGlobalView),
  })
}

const addSession = async (sessionData: Omit<Session, 'id'>) => {
  const { error } = await supabase.from('sessions').insert([sessionData])
  if (error) throw error
}

const updateSession = async (sessionData: Partial<Session> & { id: number }) => {
  const { error } = await supabase.from('sessions').update(sessionData).eq('id', sessionData.id)
  if (error) throw error
}

const deleteSession = async (sessionId: number) => {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) throw error
}

export const useSessionMutations = () => {
  const queryClient = useQueryClient()

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions', 'calendar'] })
  }

  const addMutation = useMutation({
    mutationFn: addSession,
    onSuccess: () => {
      toast.success('Session created successfully!')
      invalidateSessions()
    },
    onError: (error: Error) => toast.error(`Failed to create session: ${error.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: updateSession,
    onSuccess: () => {
      toast.success('Session updated successfully!')
      invalidateSessions()
    },
    onError: (error: Error) => toast.error(`Failed to update session: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      toast.success('Session deleted successfully!')
      invalidateSessions()
    },
    onError: (error: Error) => toast.error(`Failed to delete session: ${error.message}`),
  })

  return {
    addSession: addMutation.mutateAsync,
    updateSession: updateMutation.mutateAsync,
    deleteSession: deleteMutation.mutateAsync,
    isMutating: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}