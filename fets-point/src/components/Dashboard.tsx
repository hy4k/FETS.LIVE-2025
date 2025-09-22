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
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch, useBranchFilter } from '../contexts/BranchContext'
import { useCandidateMetrics, useIncidentStats } from '../hooks/useQueries'
import { useRealtimeCandidates, useRealtimeIncidents } from '../hooks/useRealtime'
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring'
import { RealtimeIndicator, LiveDataBadge } from './RealtimeIndicators'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { FetsTaskWidget } from './FetsTaskWidget'
import { supabase } from '../lib/supabase'

interface ModernStatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  status?: 'positive' | 'warning' | 'neutral' | 'primary'
  onClick?: () => void
  clickable?: boolean
}

function ModernStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  status = 'primary', 
  onClick, 
  clickable = false 
}: ModernStatsCardProps) {
  const statusClass = {
    positive: 'status-positive',
    warning: 'status-warning', 
    neutral: 'status-neutral',
    primary: 'status-warning' // Default to primary gradient
  }[status]

  return (
    <div 
      className={`stats-card ${clickable ? 'cursor-pointer' : ''}`}
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

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { profile } = useAuth()
  const { activeBranch, viewMode, isSwitching, getBranchTheme } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const today = new Date().toISOString().split('T')[0]
  
  // Performance monitoring
  const { measureRouteLoad } = usePerformanceMonitoring()
  
  // Measure dashboard load time
  useEffect(() => {
    const endMeasurement = measureRouteLoad('Dashboard')
    return () => endMeasurement()
  }, [])
  
  // Use React Query hooks for data fetching with branch filtering
  const { data: candidateMetrics, isLoading: candidateLoading, error: candidateError } = useCandidateMetrics(today, activeBranch)
  const { data: incidentStats, isLoading: incidentLoading } = useIncidentStats(activeBranch)
  
  // Real-time subscriptions with branch filtering
  const candidatesRealtime = useRealtimeCandidates({ date: today, branch: activeBranch })
  const incidentsRealtime = useRealtimeIncidents(activeBranch)
  
  // Checklist functionality remains manual for now (can be moved to React Query later)
  const [checklistStats, setChecklistStats] = useState({
    todayInstances: 0,
    completedInstances: 0,
    totalProgress: 0
  })

  useEffect(() => {
    loadChecklistStats()
  }, [])

  const loadChecklistStats = async () => {
    try {
      let query = supabase
        .from('checklist_instances')
        .select(`
          *,
          items:checklist_instance_items(*)
        `)
      
      // Apply branch filtering
      if (!isGlobalView) {
        query = applyFilter(query)
      }
      
      const { data: instances } = await query

      if (instances && Array.isArray(instances)) {
        const todayInstances = instances.filter((i: any) => i.exam_date === today).length
        const completedInstances = instances.filter((i: any) => i.completed_at).length
        
        let totalItems = 0
        let completedItems = 0
        instances.forEach((instance: any) => {
          if (instance.items && Array.isArray(instance.items)) {
            totalItems += instance.items.length
            completedItems += instance.items.filter((item: any) => item.is_completed).length
          }
        })
        
        const totalProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
        
        setChecklistStats({
          todayInstances,
          completedInstances,
          totalProgress
        })
      }
    } catch (error) {
      console.error('Error loading checklist stats:', error)
    }
  }

  // Helper functions for displaying metrics
  const getCandidateDisplayData = () => {
    if (candidateLoading) return {
      todaysCandidates: { count: '...', subtitle: 'Loading...' },
      checkedIn: { count: '...', subtitle: 'Loading...' },
      inProgress: { count: '...', subtitle: 'Loading...' },
      completed: { count: '...', subtitle: 'Loading...' }
    }
    
    if (candidateError) return {
      todaysCandidates: { count: '!', subtitle: 'Error loading data' },
      checkedIn: { count: '!', subtitle: 'Error loading data' },
      inProgress: { count: '!', subtitle: 'Error loading data' },
      completed: { count: '!', subtitle: 'Error loading data' }
    }
    
    if (!candidateMetrics) return {
      todaysCandidates: { count: 0, subtitle: 'No candidates today' },
      checkedIn: { count: 0, subtitle: 'None checked in' },
      inProgress: { count: 0, subtitle: 'No active exams' },
      completed: { count: 0, subtitle: 'No completions yet' }
    }
    
    return {
      todaysCandidates: {
        count: candidateMetrics.total,
        subtitle: candidateMetrics.total > 0 ? 'Scheduled for today' : 'No candidates today'
      },
      checkedIn: {
        count: candidateMetrics.checkedIn,
        subtitle: candidateMetrics.checkedIn > 0 ? 'Currently checked in' : 'None checked in'
      },
      inProgress: {
        count: candidateMetrics.inProgress,
        subtitle: candidateMetrics.inProgress > 0 ? 'Active exams' : 'No active exams'
      },
      completed: {
        count: candidateMetrics.completed,
        subtitle: candidateMetrics.completed > 0 ? 'Finished today' : 'No completions yet'
      }
    }
  }

  const candidateDisplayData = getCandidateDisplayData()

  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]
    }
    return 'User'
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className={`dashboard-modern flex-1 overflow-auto transition-all duration-300 ${
      isSwitching ? 'branch-content-fade switching' : 'branch-content-fade'
    }`} style={{ background: 'var(--fets-light-background)' }}>
      <div className="dashboard-centered">
        {/* Branch Context Indicator */}
        {!isGlobalView && (
          <div className="widget-branch-header mb-6">
            <div className="widget-branch-indicator">
              <div className={`w-3 h-3 rounded-full ${
                activeBranch === 'calicut' 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                  : 'bg-gradient-to-r from-green-400 to-green-500'
              }`} />
              <span>Viewing {activeBranch === 'calicut' ? 'Calicut' : 'Cochin'} Branch Data</span>
            </div>
          </div>
        )}
        
        {isGlobalView && (
          <div className="widget-branch-header mb-6">
            <div className="widget-branch-indicator">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
              <span>Global View - All Branches Combined</span>
            </div>
          </div>
        )}
        {/* Today's Activity - Enhanced with vibrant colors and professional styling */}
        <div className="dashboard-section">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-gradient)' }}>
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Today's Activity</h2>
                <p className="text-gray-600">Real-time operational metrics and status</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LiveDataBadge 
                count={candidateMetrics?.total} 
                label="Candidates" 
                isActive={candidatesRealtime.isSubscribed} 
              />
              <LiveDataBadge 
                count={incidentStats?.total} 
                label="Incidents" 
                isActive={incidentsRealtime.isSubscribed} 
              />
            </div>
          </div>
          
          {/* Enhanced Activity Cards with vibrant design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 cursor-pointer"
              style={{ 
                background: '#ffcc33',
                borderColor: '#e6b800'
              }}
              onClick={() => onNavigate?.('candidate-tracker')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold opacity-90 mb-1">TODAY'S CANDIDATES</h3>
                  <div className="text-3xl font-black mb-1">{candidateDisplayData.todaysCandidates.count}</div>
                  <p className="text-xs opacity-80">{candidateDisplayData.todaysCandidates.subtitle}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2"
              style={{ 
                background: '#ffcc33',
                borderColor: '#e6b800'
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold opacity-90 mb-1">CHECKED IN</h3>
                  <div className="text-3xl font-black mb-1">{candidateDisplayData.checkedIn.count}</div>
                  <p className="text-xs opacity-80">{candidateDisplayData.checkedIn.subtitle}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2"
              style={{ 
                background: '#ffcc33',
                borderColor: '#e6b800'
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold opacity-90 mb-1">IN PROGRESS</h3>
                  <div className="text-3xl font-black mb-1">{candidateDisplayData.inProgress.count}</div>
                  <p className="text-xs opacity-80">{candidateDisplayData.inProgress.subtitle}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2"
              style={{ 
                background: '#ffcc33',
                borderColor: '#e6b800'
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold opacity-90 mb-1">COMPLETED</h3>
                  <div className="text-3xl font-black mb-1">{candidateDisplayData.completed.count}</div>
                  <p className="text-xs opacity-80">{candidateDisplayData.completed.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FETS TASK Widget - Enhanced vibrant styling */}
        <div className="dashboard-section">
          <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden" style={{ borderColor: '#80c377' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #80c377 0%, #a3d69a 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">FETS TASK</h2>
                    <p className="text-white opacity-90">Task management and workflow tracking</p>
                  </div>
                </div>
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 backdrop-blur-sm">
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-96">
              <FetsTaskWidget onExpand={() => {/* TODO: Implement full-screen modal */}} />
            </div>
          </div>
        </div>

        {/* Next 3 Days Exam Schedule - Enhanced with no scroll design */}
        <div className="dashboard-section">
          <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden" style={{ borderColor: '#ffc51e' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #ffc51e 0%, #ffd45e 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Next 3 Days Exam Schedule</h2>
                    <p className="text-white opacity-90">Upcoming examination sessions and planning</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate?.('fets-calendar')}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 backdrop-blur-sm"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-96 overflow-hidden">
              <ExamScheduleWidget onNavigate={onNavigate} />
            </div>
          </div>
        </div>

        {/* Workflow Management - Enhanced vibrant styling */}
        <div className="dashboard-section">
          <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden mb-6" style={{ borderColor: '#6bb5b6' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #6bb5b6 0%, #88c4c7 100%)' }}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Workflow Management</h2>
                  <p className="text-white opacity-90">Review candidate tracker reports in fets task</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Incident Management Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Incident Management</h3>
                    <p className="text-gray-600">Track and resolve issues</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RealtimeIndicator size="sm" showLabel={false} />
                  <button
                    onClick={() => onNavigate?.('log-incident')}
                    className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-3xl font-black text-red-600 mb-2">
                    {incidentLoading ? '...' : incidentStats?.open || 0}
                  </div>
                  <div className="text-sm font-semibold text-red-700">Open Issues</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-3xl font-black text-amber-600 mb-2">
                    {incidentLoading ? '...' : incidentStats?.inProgress || 0}
                  </div>
                  <div className="text-sm font-semibold text-amber-700">In Progress</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-3xl font-black text-green-600 mb-2">
                    {incidentLoading ? '...' : incidentStats?.resolved || 0}
                  </div>
                  <div className="text-sm font-semibold text-green-700">Resolved</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-3xl font-black text-gray-800 mb-2">
                    {incidentLoading ? '...' : incidentStats?.total || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">Total</div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate?.('log-incident')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Log New Incident
              </button>
            </div>

            {/* Enhanced Checklist Management Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Checklist Overview</h3>
                    <p className="text-gray-600">Monitor task completion</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('checklist-management')}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-3xl font-black text-blue-600 mb-2">{checklistStats.todayInstances}</div>
                  <div className="text-sm font-semibold text-blue-700">Today's Lists</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-3xl font-black text-green-600 mb-2">{checklistStats.completedInstances}</div>
                  <div className="text-sm font-semibold text-green-700">Completed</div>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span className="font-semibold">Overall Progress</span>
                  <span className="font-black text-gray-800">{checklistStats.totalProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 shadow-inner"
                    style={{ width: `${checklistStats.totalProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate?.('checklist-management')}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BarChart3 className="h-5 w-5 inline mr-2" />
                Manage Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}