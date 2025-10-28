import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBranch } from './useBranch'

export interface Notification {
  id: string
  type: 'incident' | 'exam' | 'candidate' | 'checklist' | 'system' | 'news'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  link?: string // Navigation target
  timestamp: string
  isRead: boolean
  icon: string // Icon name for rendering
  color: string // Color scheme
}

export function useNotifications() {
  const { activeBranch } = useBranch()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const applyBranchFilter = (query: any) => {
    if (activeBranch !== 'global') {
      return query.eq('branch_location', activeBranch)
    }
    return query
  }

  const fetchNotifications = async () => {
    try {
      const allNotifications: Notification[] = []
      const today = new Date().toISOString().split('T')[0]

      // 1. Critical Incidents (highest priority)
      const { data: criticalIncidents } = await applyBranchFilter(
        supabase
          .from('incidents')
          .select('*')
          .in('priority', ['critical', 'emergency'])
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(5)
      )

      if (criticalIncidents && criticalIncidents.length > 0) {
        criticalIncidents.forEach((incident: any) => {
          allNotifications.push({
            id: `incident-${incident.id}`,
            type: 'incident',
            priority: 'critical',
            title: 'Critical Incident',
            message: `${incident.title || 'Untitled Incident'} requires immediate attention`,
            link: 'incident-manager',
            timestamp: incident.created_at,
            isRead: false,
            icon: 'AlertTriangle',
            color: 'red'
          })
        })
      }

      // 2. Pending Incidents (high priority)
      const { data: pendingIncidents, count: pendingCount } = await applyBranchFilter(
        supabase
          .from('incidents')
          .select('*', { count: 'exact' })
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
      )

      if (pendingCount && pendingCount > 0) {
        allNotifications.push({
          id: `pending-incidents`,
          type: 'incident',
          priority: 'high',
          title: 'Pending Incidents',
          message: `${pendingCount} incident${pendingCount > 1 ? 's' : ''} awaiting resolution`,
          link: 'incident-manager',
          timestamp: pendingIncidents?.[0]?.created_at || new Date().toISOString(),
          isRead: false,
          icon: 'AlertCircle',
          color: 'orange'
        })
      }

      // 3. Today's Exams (high priority)
      const { data: todaysExams } = await applyBranchFilter(
        supabase
          .from('sessions')
          .select('client_name, candidate_count')
          .eq('date', today)
          .order('session_start_time', { ascending: true })
      )

      if (todaysExams && todaysExams.length > 0) {
        const totalCandidates = todaysExams.reduce((sum: number, exam: any) => sum + (exam.candidate_count || 0), 0)
        allNotifications.push({
          id: `todays-exams`,
          type: 'exam',
          priority: 'high',
          title: "Today's Exams",
          message: `${todaysExams.length} exam${todaysExams.length > 1 ? 's' : ''} scheduled with ${totalCandidates} candidate${totalCandidates > 1 ? 's' : ''}`,
          link: 'calendar',
          timestamp: new Date().toISOString(),
          isRead: false,
          icon: 'Calendar',
          color: 'blue'
        })
      }

      // 4. Incomplete Pre/Post-Exam Checklists (medium priority)
      const { data: incompleteChecklists, count: checklistCount } = await applyBranchFilter(
        supabase
          .from('checklist_instances')
          .select('*', { count: 'exact' })
          .is('completed_at', null)
          .eq('exam_date', today)
      )

      if (checklistCount && checklistCount > 0) {
        allNotifications.push({
          id: `incomplete-checklists`,
          type: 'checklist',
          priority: 'medium',
          title: 'Incomplete Checklists',
          message: `${checklistCount} checklist${checklistCount > 1 ? 's' : ''} pending completion for today`,
          link: 'command-centre',
          timestamp: incompleteChecklists?.[0]?.created_at || new Date().toISOString(),
          isRead: false,
          icon: 'ClipboardList',
          color: 'purple'
        })
      }

      // 5. New Candidates Today (medium priority)
      const { count: newCandidatesCount } = await applyBranchFilter(
        supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
      )

      if (newCandidatesCount && newCandidatesCount > 5) {
        allNotifications.push({
          id: `new-candidates`,
          type: 'candidate',
          priority: 'medium',
          title: 'New Registrations',
          message: `${newCandidatesCount} new candidate${newCandidatesCount > 1 ? 's' : ''} registered today`,
          link: 'candidates',
          timestamp: new Date().toISOString(),
          isRead: false,
          icon: 'UserCheck',
          color: 'green'
        })
      }

      // 6. Upcoming Exams (next 3 days) (low priority)
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const { data: upcomingExams, count: upcomingCount } = await applyBranchFilter(
        supabase
          .from('sessions')
          .select('*', { count: 'exact' })
          .gt('date', today)
          .lte('date', threeDaysFromNow.toISOString().split('T')[0])
      )

      if (upcomingCount && upcomingCount > 0) {
        allNotifications.push({
          id: `upcoming-exams`,
          type: 'exam',
          priority: 'low',
          title: 'Upcoming Exams',
          message: `${upcomingCount} exam${upcomingCount > 1 ? 's' : ''} scheduled in the next 3 days`,
          link: 'calendar',
          timestamp: new Date().toISOString(),
          isRead: false,
          icon: 'Calendar',
          color: 'indigo'
        })
      }

      // 7. System News (low priority)
      const { data: newsUpdates } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3)

      if (newsUpdates && newsUpdates.length > 0) {
        newsUpdates.forEach((news: any) => {
          allNotifications.push({
            id: `news-${news.id}`,
            type: 'news',
            priority: 'low',
            title: 'FETS News',
            message: news.content,
            timestamp: news.created_at,
            isRead: false,
            icon: 'Bell',
            color: 'gray'
          })
        })
      }

      // Sort by priority and timestamp
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      allNotifications.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      setNotifications(allNotifications)
      setUnreadCount(allNotifications.filter(n => !n.isRead).length)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [activeBranch])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId)
      return notification && !notification.isRead ? Math.max(0, prev - 1) : prev
    })
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refresh: fetchNotifications
  }
}
