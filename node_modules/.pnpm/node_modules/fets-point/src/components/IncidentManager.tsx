import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, User, Clock, AlertTriangle,
  Monitor, Wrench, Building, Users, UserX, Globe, Zap, MoreHorizontal, MessageSquare, Send,
  X, CheckCircle, Circle, Edit3, Trash2, Calendar, Filter, Eye, MapPin
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface Incident {
  id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'major' | 'minor'
  status: 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  reporter_id: string
  assigned_to?: string
  event_date: string
  created_at: string
  updated_at: string
  closed_at?: string
  closure_remarks?: string
  branch_location: string
}

interface IncidentStats {
  total_open: number
  total_closed: number
  critical_open: number
  major_open: number
  minor_open: number
  upcoming_this_week: number
  by_category: { [key: string]: number }
}

interface Comment {
  id: string;
  created_at: string;
  body: string;
  incident_id: string;
  author_id: string;
  author_full_name: string;
}

const INCIDENT_CATEGORIES = [
  { id: 'computer', name: 'Computer/System', icon: Monitor, color: 'bg-blue-500' },
  { id: 'equipment', name: 'Equipment Failure', icon: Wrench, color: 'bg-orange-500' },
  { id: 'property', name: 'Property Damage', icon: Building, color: 'bg-red-500' },
  { id: 'staff', name: 'Staff Issue', icon: Users, color: 'bg-purple-500' },
  { id: 'candidate', name: 'Candidate Issue', icon: UserX, color: 'bg-pink-500' },
  { id: 'client', name: 'Client/Provider', icon: Globe, color: 'bg-green-500' },
  { id: 'utility', name: 'Environment/Utility', icon: Zap, color: 'bg-yellow-500' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' }
]

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Critical', border: 'border-red-200', ring: 'ring-red-500' },
  major: { color: 'bg-orange-500 text-white', dot: 'bg-orange-500', label: 'Major', border: 'border-orange-200', ring: 'ring-orange-500' },
  minor: { color: 'bg-blue-500 text-white', dot: 'bg-blue-500', label: 'Minor', border: 'border-blue-200', ring: 'ring-blue-500' }
}

const STATUS_CONFIG = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open', icon: Circle },
  assigned: { color: 'bg-teal-100 text-teal-800', label: 'Assigned', icon: User },
  in_progress: { color: 'bg-amber-100 text-amber-800', label: 'In Progress', icon: Clock },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated', icon: AlertTriangle },
  closed: { color: 'bg-green-100 text-green-800', label: 'Closed', icon: CheckCircle }
}

export default function IncidentManager() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStats>({
    total_open: 0, total_closed: 0, critical_open: 0, major_open: 0, minor_open: 0,
    upcoming_this_week: 0, by_category: {}
  })
  const [loading, setLoading] = useState(true)
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showIncidentDetail, setShowIncidentDetail] = useState(false)

  const [newCommentAlerts, setNewCommentAlerts] = useState<string[]>([])
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('incidents')
        .select('*')
        .order('event_date', { ascending: false })

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) {
        console.error('Error loading incidents:', error)
        throw new Error(`Failed to load incidents: ${error.message}`)
      }

      setIncidents(data || [])
    } catch (error: any) {
      console.error('Error loading incidents:', error)
      toast.error(error?.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [activeBranch])

  const loadStats = useCallback(async () => {
    try {
      let query = supabase
        .from('incidents')
        .select('status, priority, category, event_date, created_at, closed_at')

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) {
        console.error('Error loading stats:', error)
        throw new Error(`Failed to load stats: ${error.message}`)
      }

      const openIncidents = data?.filter(e => e.status !== 'closed') || []
      const closedIncidents = data?.filter(e => e.status === 'closed') || []

      const categoryStats: { [key: string]: number } = {}
      data?.forEach(incident => {
        const cat = incident.category || 'other'
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      })

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingThisWeek = data?.filter(e => {
        const incidentDate = new Date(e.event_date)
        return incidentDate >= now && incidentDate <= weekFromNow && e.status !== 'closed'
      }).length || 0

      setStats({
        total_open: openIncidents.length,
        total_closed: closedIncidents.length,
        critical_open: openIncidents.filter(e => e.priority === 'critical').length,
        major_open: openIncidents.filter(e => e.priority === 'major').length,
        minor_open: openIncidents.filter(e => e.priority === 'minor').length,
        upcoming_this_week: upcomingThisWeek,
        by_category: categoryStats
      })
    } catch (error: any) {
      console.error('Error loading stats:', error)
      toast.error(error?.message || 'Failed to load statistics')
    }
  }, [activeBranch])

  // Load incidents
  useEffect(() => {
    loadIncidents()
    loadStats()
  }, [activeBranch, loadIncidents, loadStats])

  // Subscribe to new comments to show alerts on cards
  useEffect(() => {
    const channel = supabase
      .channel('public:incident_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incident_comments' },
        (payload) => {
          const newComment = payload.new as { incident_id: string; author_id: string }
          // Don't show notification for user's own comments
          if (profile && newComment.author_id === profile.user_id) {
            return
          }
          // Add incident ID to alerts if not already present
          setNewCommentAlerts(prev => prev.includes(newComment.incident_id) ? prev : [...prev, newComment.incident_id])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const filteredIncidents = incidents.filter(incident => {
    if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !incident.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && incident.category !== categoryFilter) return false
    if (priorityFilter !== 'all' && incident.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false
    return true
  })

  const getTimeSince = (dateString: string) => {
    const now = new Date().getTime()
    const created = new Date(dateString).getTime()
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Incident Manager</h1>
                <p className="text-gray-600 mt-1">Track, manage, and resolve operational incidents efficiently</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Report Incident
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white transition-all appearance-none"
                >
                  <option value="all">All Categories</option>
                  {INCIDENT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white transition-all appearance-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
              <div className="relative">
                <Circle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white transition-all appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Circle className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-600">Open</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_open}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-gray-600">Closed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_closed}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 shadow-md border-2 border-red-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-bold text-red-700">Critical</p>
            </div>
            <p className="text-3xl font-bold text-red-900">{stats.critical_open}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 shadow-md border-2 border-orange-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-bold text-orange-700">Major</p>
            </div>
            <p className="text-3xl font-bold text-orange-900">{stats.major_open}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-md border-2 border-blue-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Circle className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-700">Minor</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.minor_open}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 shadow-md border-2 border-purple-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-bold text-purple-700">This Week</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.upcoming_this_week}</p>
          </div>
        </div>

        {/* Incident Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading incidents...</p>
            </div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-md border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No incidents found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Great news! There are no incidents reported. Click below to report a new incident if needed.'}
            </p>
            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Report Incident
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredIncidents.map((incident) => {
                const categoryConfig = INCIDENT_CATEGORIES.find(cat => cat.id === incident.category) || INCIDENT_CATEGORIES[INCIDENT_CATEGORIES.length - 1]
                const Icon = categoryConfig.icon
                const priorityConfig = PRIORITY_CONFIG[incident.priority] || PRIORITY_CONFIG.minor
                const statusConfig = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open
                const StatusIcon = statusConfig.icon
                const hasNewComment = newCommentAlerts.includes(incident.id)

                return (
                  <motion.div
                    key={incident.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Card Header - Category Banner */}
                    <div className={`${categoryConfig.color} h-2`}></div>

                    <div className="p-6">
                      {/* Category & Priority */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-14 h-14 ${categoryConfig.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors text-lg">
                              {incident.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">{categoryConfig.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-5 line-clamp-3 leading-relaxed">{incident.description}</p>

                      {/* Priority & Status Badges */}
                      <div className="flex items-center gap-2 mb-5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold ${priorityConfig.color} shadow-md`}>
                          <div className={`w-2 h-2 rounded-full ${priorityConfig.dot} animate-pulse`}></div>
                          {priorityConfig.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getTimeSince(incident.created_at)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedIncident(incident)
                            setShowIncidentDetail(true)
                            // Clear notification when opening details
                            setNewCommentAlerts(prev => prev.filter(id => id !== incident.id))
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>

                      {/* New Comment Alert */}
                      {hasNewComment && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse shadow-lg">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>New Comment</span>
                        </div>
                      )}

                      {/* Branch Location */}
                      {activeBranch === 'global' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600 font-medium capitalize">{incident.branch_location}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New Incident Modal */}
      {showNewIncidentModal && (
        <NewIncidentModal
          onClose={() => setShowNewIncidentModal(false)}
          onIncidentCreated={() => {
            loadIncidents()
            loadStats()
            setShowNewIncidentModal(false)
          }}
        />
      )}

      {/* Incident Detail Modal */}
      {showIncidentDetail && selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => {
            setShowIncidentDetail(false)
            setSelectedIncident(null)
          }}
          onIncidentUpdated={() => {
            loadIncidents()
            loadStats()
          }}
        />
      )}
    </div>
  )
}

// New Incident Modal Component
function NewIncidentModal({ onClose, onIncidentCreated }: {
  onClose: () => void
  onIncidentCreated: () => void
}) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'minor' as 'critical' | 'major' | 'minor',
    event_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast.error('You must be logged in to report an incident')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: 'open',
          reporter_id: profile.user_id,
          event_date: new Date(formData.event_date).toISOString(),
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
        })

      if (error) throw error

      toast.success('Incident reported successfully')
      onIncidentCreated()
    } catch (error) {
      console.error('Error creating incident:', error)
      toast.error('Failed to report incident')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Report New Incident</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="Brief description of the incident"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'critical' | 'major' | 'minor' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Incident Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
              placeholder="Provide detailed information about the incident..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Report Incident
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Incident Detail Modal Component
function IncidentDetailModal({ incident, onClose, onIncidentUpdated }: {
  incident: Incident
  onClose: () => void
  onIncidentUpdated: () => void
}) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: incident.title,
    description: incident.description,
    category: incident.category,
    priority: incident.priority,
    status: incident.status,
    event_date: new Date(incident.event_date).toISOString().split('T')[0]
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

  const categoryConfig = INCIDENT_CATEGORIES.find(cat => cat.id === incident.category) || INCIDENT_CATEGORIES[INCIDENT_CATEGORIES.length - 1]
  const Icon = categoryConfig.icon
  const canEdit = profile?.role === 'admin' || profile?.role === 'super_admin'

  const handleUpdate = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit incidents')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          priority: editForm.priority,
          status: editForm.status,
          event_date: new Date(editForm.event_date).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id)

      if (error) throw error

      toast.success('Incident updated successfully')
      setIsEditing(false)
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating incident:', error)
      toast.error('Failed to update incident')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to delete incidents')
      return
    }

    try {
      const { error } = await supabase.from('incidents').delete().eq('id', incident.id)
      if (error) throw error

      toast.success('Incident deleted successfully')
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting incident:', error)
      toast.error('Failed to delete incident')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('incidents').update(updateData).eq('id', incident.id)
      if (error) throw error

      toast.success(`Incident ${newStatus === 'closed' ? 'closed' : 'updated'} successfully`)
      onIncidentUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  // Fetch comments when the modal opens
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true)
      try {
        const { data, error } = await supabase
          .from('incident_comments')
          .select('*')
          .eq('incident_id', incident.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        setComments(data || [])
      } catch (error) {
        console.error('Error fetching comments:', error)
        toast.error('Failed to load comments')
      } finally {
        setLoadingComments(false)
      }
    }
    fetchComments()
  }, [incident.id])

  // Real-time comments subscription
  useEffect(() => {
    // Ensure we have a profile before subscribing
    if (!profile) return

    const channel = supabase
      .channel(`incident-comments-${incident.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_comments',
          filter: `incident_id=eq.${incident.id}`,
        },
        (payload) => {
          const newComment = payload.new as Comment
          // Add the new comment to the state in real-time
          // We check if the comment already exists to prevent duplicates from optimistic updates
          setComments((prev) => prev.some(c => c.id === newComment.id) ? prev : [...prev, newComment])
        }
      )
      .subscribe()

    // Cleanup function to remove the channel subscription when the modal closes
    return () => { supabase.removeChannel(channel) }
  }, [incident.id, profile])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !profile) return

    setSubmittingComment(true)
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .insert({
          body: newComment,
          incident_id: incident.id,
          author_id: profile.user_id,
          author_full_name: profile?.full_name || 'Unknown User'
        })
        .select()
        .single()

      if (error) throw error

      // Optimistically update the UI. The real-time subscription will handle updates for other users.
      // We also check to prevent duplicates in case the subscription fires for the same user.
      setComments(prev => prev.some(c => c.id === data.id) ? prev : [...prev, data])
      setNewComment('')
    } catch (error: any) {
      console.error('Error posting comment:', error)
      toast.error(error.message || 'Failed to post comment. The incident may be closed.')
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className={`p-6 border-b border-gray-200 ${categoryConfig.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{incident.title}</h2>
                <p className="text-white/90 text-sm mt-1">{categoryConfig.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="Edit incident"
                >
                  <Edit3 className="w-5 h-5 text-white" />
                </button>
              )}
              <button onClick={onClose} className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 resize-none transition-all"
                    rows={5}
                    placeholder="Description"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                    >
                      {INCIDENT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editForm.event_date}
                      onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{incident.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Incident Date</h4>
                    <p className="text-gray-700 font-medium">{new Date(incident.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Created</h4>
                    <p className="text-gray-700 font-medium">{new Date(incident.created_at).toLocaleString()}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Priority</h4>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${PRIORITY_CONFIG[incident.priority].color} shadow-sm`}>
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[incident.priority].dot} animate-pulse`}></div>
                      {PRIORITY_CONFIG[incident.priority].label}
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Status</h4>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${STATUS_CONFIG[incident.status].color}`}>
                      {STATUS_CONFIG[incident.status].label}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Comments Section */}
            {!isEditing && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-gray-600" />
                  <h3 className="text-xl font-bold text-gray-800">Comment Thread</h3>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {loadingComments ? (
                    <p className="text-gray-500">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
                          {comment.author_full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-gray-800">{comment.author_full_name}</p>
                            <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 break-words">{comment.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {incident.status !== 'closed' ? (
                  <form onSubmit={handleCommentSubmit} className="mt-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-white flex-shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all resize-none"
                        rows={2}
                        disabled={submittingComment}
                      />
                      <button type="submit" disabled={submittingComment || !newComment.trim()} className="absolute right-2 bottom-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 text-center text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                    Commenting is disabled because this incident is closed.
                  </div>
                )}
              </div>
            )}


            <div className="flex gap-3 pt-6 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="ml-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Incident
                    </button>
                  )}
                </>
              ) : (
                <>
                  {incident.status !== 'closed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md"
                      >
                        Mark as Closed
                      </button>
                    </>
                  )}
                  {incident.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold shadow-md"
                    >
                      Reopen Incident
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Incident</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this incident? All associated data will be removed from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
