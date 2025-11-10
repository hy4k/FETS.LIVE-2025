import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from './useBranch'

const STALE_TIME = 60000 // 1 minute

const applyBranchFilter = (query: any, activeBranch: string) => {
  if (activeBranch !== 'global') {
    return query.eq('branch_location', activeBranch)
  }
  return query
}

// Hook for main KPI stats
export const useDashboardStats = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['dashboardStats', activeBranch],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [
        { count: totalCandidates },
        { count: todayCandidates },
        { count: openEvents },
        { count: pendingChecklists },
        { data: todaysRosterData },
        { count: newPosts }, // This will now correctly query the 'posts' table
        { count: newMessages },
        { count: pendingIncidents },
        { data: todaysExams },
      ] = await Promise.all([
        applyBranchFilter(supabase.from('candidates').select('*', { count: 'exact', head: true }), activeBranch),
        applyBranchFilter(supabase.from('candidates').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_pending', true), activeBranch),
        applyBranchFilter(supabase.from('checklist_items').select('*', { count: 'exact', head: true }).is('completed_at', null), activeBranch),
        applyBranchFilter(supabase.from('staff_schedules').select('staff_profiles(full_name)').eq('schedule_date', today), activeBranch),
        applyBranchFilter(supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('events').select('*', { count: 'exact', head: true }).neq('status', 'closed'), activeBranch),
        applyBranchFilter(supabase.from('sessions').select('client_name, candidate_count').eq('date', today), activeBranch),
      ])

      const todaysRoster = todaysRosterData && todaysRosterData.length > 0
        ? { date: today, day: new Date().toLocaleDateString('en-US', { weekday: 'short' }), staff: todaysRosterData.map((r: any) => r.staff_profiles.full_name) }
        : null

      return {
        totalCandidates: totalCandidates ?? 0,
        todayCandidates: todayCandidates ?? 0,
        openEvents: openEvents ?? 0,
        pendingChecklists: pendingChecklists ?? 0,
        todaysRoster,
        newPosts: newPosts ?? 0,
        newMessages: newMessages ?? 0,
        pendingIncidents: pendingIncidents ?? 0,
        todaysExams: todaysExams || [],
      }
    },
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  })
}

// Hook for candidate trend data
export const useCandidateTrend = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['candidateTrend', activeBranch],
    queryFn: async () => {
      const trendPromises = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        const query = supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateString}T00:00:00`)
          .lt('created_at', `${dateString}T23:59:59`)
        
        return applyBranchFilter(query, activeBranch).then(({ count }) => ({ date: dateString, count: count ?? 0 }))
      })
      const trendData = await Promise.all(trendPromises)
      return trendData.reverse()
    },
    staleTime: STALE_TIME * 5, // Refresh less often
  })
}

// Hook for upcoming exam schedule
export const useUpcomingSchedule = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['upcomingSchedule', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const sevenDaysLater = new Date(today)
      sevenDaysLater.setDate(today.getDate() + 7)

      const query = supabase
        .from('sessions')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', sevenDaysLater.toISOString().split('T')[0])
        .order('date')

      const { data, error } = await applyBranchFilter(query, activeBranch)
      if (error) throw error
      return data || []
    },
    staleTime: STALE_TIME,
  })
}

// Hook for checklist templates
export const useChecklistTemplates = () => {
  return useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*, items:checklist_template_items(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const templates = data || []
      return {
        preExamTemplate: templates.find(t => t.category === 'pre-exam'),
        postExamTemplate: templates.find(t => t.category === 'post-exam'),
        customTemplates: templates.filter(t => t.category === 'custom'),
      }
    },
    staleTime: Infinity, // Templates rarely change
  })
}