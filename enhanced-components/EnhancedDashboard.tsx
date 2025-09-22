import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Users, 
  CalendarDays, 
  FileText, 
  AlertTriangle, 
  BarChart3,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

// Enhanced Dashboard with React Query
export function EnhancedDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  
  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'candidates'
      }, () => {
        // Invalidate and refetch candidate data
        queryClient.invalidateQueries({ queryKey: ['candidates'] })
        toast.success('Dashboard updated with latest data')
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'incidents'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['incidents'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Candidate metrics query
  const { data: candidateMetrics, isLoading: candidatesLoading, error: candidatesError } = useQuery({
    queryKey: ['candidates', 'metrics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .gte('exam_date', `${today}T00:00:00Z`)
        .lt('exam_date', `${today}T23:59:59Z`)
      
      if (error) throw error
      
      const checkedInCount = data?.filter(c => c.status === 'checked_in').length || 0
      const inProgressCount = data?.filter(c => c.status === 'in_progress').length || 0
      const completedCount = data?.filter(c => c.status === 'completed').length || 0
      
      return {
        total: data?.length || 0,
        checkedIn: checkedInCount,
        inProgress: inProgressCount,
        completed: completedCount
      }
    },
    staleTime: 30000, // 30 seconds
  })

  // Incident stats query
  const { data: incidentStats, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
      
      if (error) throw error
      
      return {
        total: data?.length || 0,
        open: data?.filter(i => i.status === 'open').length || 0,
        inProgress: data?.filter(i => i.status === 'in_progress').length || 0,
        resolved: data?.filter(i => ['rectified', 'closed'].includes(i.status)).length || 0
      }
    },
    staleTime: 60000, // 1 minute
  })

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries()
      return 'success'
    },
    onSuccess: () => {
      toast.success('Dashboard refreshed successfully')
    },
    onError: () => {
      toast.error('Failed to refresh dashboard')
    }
  })

  const handleRefresh = () => {
    refreshMutation.mutate()
  }

  if (candidatesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{candidatesError.message}</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-600">Real-time operational overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Today's Candidates"
          value={candidatesLoading ? '...' : candidateMetrics?.total || 0}
          subtitle={candidateMetrics?.total > 0 ? 'Scheduled for today' : 'No candidates today'}
          icon={Users}
          status="primary"
          onClick={() => onNavigate?.('candidate-tracker')}
          clickable
        />
        
        <StatsCard
          title="Checked In"
          value={candidatesLoading ? '...' : candidateMetrics?.checkedIn || 0}
          subtitle={candidateMetrics?.checkedIn > 0 ? 'Currently checked in' : 'None checked in'}
          icon={UserCheck}
          status="positive"
          onClick={() => onNavigate?.('candidate-tracker')}
          clickable
        />
        
        <StatsCard
          title="In Progress"
          value={candidatesLoading ? '...' : candidateMetrics?.inProgress || 0}
          subtitle={candidateMetrics?.inProgress > 0 ? 'Active exams' : 'No active exams'}
          icon={Clock}
          status="warning"
          onClick={() => onNavigate?.('candidate-tracker')}
          clickable
        />
        
        <StatsCard
          title="Open Incidents"
          value={incidentsLoading ? '...' : incidentStats?.open || 0}
          subtitle={incidentStats?.open > 0 ? 'Require attention' : 'No open incidents'}
          icon={AlertTriangle}
          status={incidentStats?.open > 0 ? 'warning' : 'positive'}
          onClick={() => onNavigate?.('log-incident')}
          clickable
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={Plus}
            label="Add Candidate"
            onClick={() => onNavigate?.('candidate-tracker')}
          />
          <QuickActionButton
            icon={Calendar}
            label="View Schedule"
            onClick={() => onNavigate?.('fets-calendar')}
          />
          <QuickActionButton
            icon={FileText}
            label="Log Incident"
            onClick={() => onNavigate?.('log-incident')}
          />
          <QuickActionButton
            icon={BarChart3}
            label="View Reports"
            onClick={() => onNavigate?.('fets-intelligence')}
          />
        </div>
      </div>
    </div>
  )
}

// Enhanced Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, status = 'primary', onClick, clickable = false }) {
  const statusClass = {
    positive: 'status-positive',
    warning: 'status-warning', 
    neutral: 'status-neutral',
    primary: 'status-primary'
  }[status]

  return (
    <div 
      className={`stats-card ${clickable ? 'cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="stats-card-title">{title}</div>
      <div className="stats-card-number">{value}</div>
      <div className="stats-card-subtitle">{subtitle}</div>
      <div className={`stats-icon ${statusClass}`}>
        <Icon />
      </div>
    </div>
  )
}

// Quick Action Button Component
function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <Icon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 mb-2" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </button>
  )
}