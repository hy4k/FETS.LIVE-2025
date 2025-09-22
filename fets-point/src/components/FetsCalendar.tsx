import React, { useState, useEffect } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { supabase } from '../lib/supabase'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'

interface Session {
  id?: number
  client_name: string
  exam_name: string
  date: string
  candidate_count: number
  start_time: string
  end_time: string
  user_id: string
  created_at?: string
  updated_at?: string
}

// Premium Apple-inspired client color scheme
const CLIENT_COLORS = {
  'PEARSON': {
    bg: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', // Apple Blue
    text: '#ffffff',
    border: '#007AFF',
    shadow: 'rgba(0, 122, 255, 0.3)'
  },
  'VUE': {
    bg: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)', // Apple Green
    text: '#ffffff', 
    border: '#34C759',
    shadow: 'rgba(52, 199, 89, 0.3)'
  },
  'ETS': {
    bg: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)', // Apple Orange
    text: '#ffffff',
    border: '#FF9500',
    shadow: 'rgba(255, 149, 0, 0.3)'
  },
  'PSI': {
    bg: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)', // Apple Purple
    text: '#ffffff',
    border: '#AF52DE',
    shadow: 'rgba(175, 82, 222, 0.3)'
  },
  'PROMETRIC': {
    bg: 'linear-gradient(135deg, #FF3B30 0%, #FF6961 100%)', // Apple Red
    text: '#ffffff',
    border: '#FF3B30',
    shadow: 'rgba(255, 59, 48, 0.3)'
  },
  'OTHER': {
    bg: 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)', // Apple Gray
    text: '#ffffff',
    border: '#8E8E93',
    shadow: 'rgba(142, 142, 147, 0.3)'
  }
}

// Enhanced Centre-specific vibrant colors for premium feel
const CENTRE_COLORS = {
  'calicut': {
    primary: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', // Vibrant Orange
    secondary: '#FF6B35',
    light: '#FFF4E6',
    accent: '#FF8A50',
    shadow: 'rgba(255, 107, 53, 0.4)',
    glass: 'rgba(255, 107, 53, 0.1)'
  },
  'cochin': {
    primary: 'linear-gradient(135deg, #00C9A7 0%, #00BFA5 100%)', // Vibrant Teal
    secondary: '#00C9A7', 
    light: '#E0F7FA',
    accent: '#26E5C7',
    shadow: 'rgba(0, 201, 167, 0.4)',
    glass: 'rgba(0, 201, 167, 0.1)'
  },
  'global': {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Vibrant Purple
    secondary: '#667eea',
    light: '#F3E5F5',
    accent: '#8B7ED8',
    shadow: 'rgba(102, 126, 234, 0.4)',
    glass: 'rgba(102, 126, 234, 0.1)'
  }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendar() {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    exam_name: '',
    date: '',
    candidate_count: 1,
    start_time: '09:00',
    end_time: '17:00'
  })

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user, currentDate])

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
  }

  const loadSessions = async () => {
    try {
      setLoading(true)
      
      // Get sessions for current month using IST dates
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // Use IST date formatting for consistent query
      const startDateIST = formatDateForIST(startOfMonth)
      const endDateIST = formatDateForIST(endOfMonth)
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .gte('date', startDateIST)
        .lte('date', endDateIST)
        .order('date', { ascending: true })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
      showNotification('error', 'Failed to load sessions')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const getClientType = (clientName: string): ClientType => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PEARSON')) return 'PEARSON'
    if (upperName.includes('VUE')) return 'VUE'
    if (upperName.includes('ETS')) return 'ETS'
    if (upperName.includes('PSI')) return 'PSI'
    if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
    return 'OTHER'
  }

  // Get per-client candidate counts for a date
  const getClientCounts = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const clientCounts: { [key: string]: number } = {}
    
    daySessions.forEach(session => {
      clientCounts[session.client_name] = (clientCounts[session.client_name] || 0) + session.candidate_count
    })
    
    return clientCounts
  }

  // Calculate remaining seats for a session based on branch
  const getRemainingSeats = (candidateCount: number) => {
    const maxCapacity = getBranchCapacity(activeBranch)
    return Math.max(0, maxCapacity - candidateCount)
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes}${ampm}`
    }
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const openModal = (date?: Date, session?: Session) => {
    if (session) {
      setEditingSession(session)
      setFormData({
        client_name: session.client_name,
        exam_name: session.exam_name,
        date: session.date,
        candidate_count: session.candidate_count,
        start_time: session.start_time,
        end_time: session.end_time
      })
    } else {
      setEditingSession(null)
      const dateStr = date ? formatDateForIST(date) : getCurrentISTDateString()
      setFormData({
        client_name: '',
        exam_name: '',
        date: dateStr,
        candidate_count: 1,
        start_time: '09:00',
        end_time: '17:00'
      })
    }
    setShowModal(true)
  }

  const openDetailsModal = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    if (daySessions.length > 0) {
      setSelectedDate(date)
      setShowDetailsModal(true)
    } else {
      openModal(date)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setShowDetailsModal(false)
    setEditingSession(null)
    setSelectedDate(null)
    setFormData({
      client_name: '',
      exam_name: '',
      date: '',
      candidate_count: 1,
      start_time: '09:00',
      end_time: '17:00'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate session capacity with branch-specific limits
    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)
    
    if (!capacityValidation.isValid) {
      showNotification('error', capacityValidation.error!)
      return
    }
    
    if (capacityValidation.warning) {
      showNotification('warning', capacityValidation.warning)
    }

    try {
      const sessionData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingSession && editingSession.id) {
        // Update existing session
        const { error } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editingSession.id)
        
        if (error) throw error
        showNotification('success', 'Session updated successfully!')
      } else {
        // Create new session
        const { error } = await supabase
          .from('sessions')
          .insert([{
            ...sessionData,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        showNotification('success', 'Session created successfully!')
      }

      closeModal()
      await loadSessions()
    } catch (error) {
      console.error('Error saving session:', error)
      showNotification('error', 'Failed to save session')
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
      
      if (error) throw error
      showNotification('success', 'Session deleted successfully!')
      await loadSessions()
      
      // Close details modal if no more sessions for this date
      if (selectedDate) {
        const remainingSessions = getSessionsForDate(selectedDate).filter(s => s.id !== sessionId)
        if (remainingSessions.length === 0) {
          setShowDetailsModal(false)
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      showNotification('error', 'Failed to delete session')
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthYear = currentDate.toLocaleDateString('en-IN', { 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  })

  const days = getDaysInMonth()
  const isToday = (date: Date | null) => {
    if (!date) return false
    return isTodayIST(date)
  }

  // Get current centre theme
  const currentTheme = CENTRE_COLORS[activeBranch] || CENTRE_COLORS['global']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fdf4ff 100%)'
      }}>
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 flex flex-col items-center space-y-6 border border-white/30 shadow-2xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-bold text-xl mb-2">Loading Calendar</p>
            <p className="text-gray-500 text-sm">Preparing your premium experience...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fdf4ff 100%)'
    }}>
      {/* Premium Apple-style Notification System */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${
          notification ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className={`backdrop-blur-2xl rounded-2xl p-4 border shadow-2xl max-w-sm ${
            notification.type === 'success' ? 'bg-green-50/90 border-green-200/50 shadow-green-500/20' :
            notification.type === 'error' ? 'bg-red-50/90 border-red-200/50 shadow-red-500/20' :
            'bg-yellow-50/90 border-yellow-200/50 shadow-yellow-500/20'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                notification.type === 'success' ? 'bg-green-100' :
                notification.type === 'error' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                {notification.type === 'success' && <Check className="h-5 w-5 text-green-600" />}
                {notification.type === 'error' && <X className="h-5 w-5 text-red-600" />}
                {notification.type === 'warning' && <Clock className="h-5 w-5 text-yellow-600" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {notification.type === 'success' ? 'Success' :
                   notification.type === 'error' ? 'Error' : 'Warning'}
                </p>
                <p className="text-gray-700 text-sm">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Apple-style Header */}
      <div className="relative overflow-hidden">
        <div 
          className="relative px-8 py-16"
          style={{ 
            background: currentTheme.primary,
            boxShadow: `0 20px 40px ${currentTheme.shadow}`
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-20 animate-pulse" 
                 style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
            <div className="absolute top-20 -right-16 w-96 h-96 rounded-full opacity-15 animate-bounce" 
                 style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', animationDelay: '1s' }}></div>
            <div className="absolute bottom-10 left-1/3 w-40 h-40 rounded-full opacity-25 animate-pulse" 
                 style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)', animationDelay: '2s' }}></div>
          </div>
          
          {/* Main Header Content */}
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0">
              
              {/* Brand Section */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <div className="relative p-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl">
                    <Calendar className="h-12 w-12 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                  </div>
                  <div className="ml-6">
                    <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
                      FETS CALENDAR
                    </h1>
                    <p className="text-white/90 text-xl font-medium">
                      Premium Session Management
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center justify-center lg:justify-start">
                  <div className="bg-white/20 backdrop-blur-xl rounded-full px-6 py-3 border border-white/30 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-white font-semibold">
                        {activeBranch === 'calicut' ? 'Calicut Centre' : 
                         activeBranch === 'cochin' ? 'Cochin Centre' : 'Global View'}
                      </span>
                      <Sparkles className="h-4 w-4 text-white/80" />
                      <span className="text-white/90">{monthYear}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Controls */}
              <div className="flex flex-col space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center bg-white/15 backdrop-blur-2xl rounded-2xl p-2 border border-white/25 shadow-xl">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-4 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 group"
                  >
                    <ChevronLeft className="h-6 w-6 text-white group-hover:text-white transition-colors" />
                  </button>
                  <div className="px-8 py-2 text-white font-bold text-xl min-w-[200px] text-center">
                    {monthYear}
                  </div>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-4 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 group"
                  >
                    <ChevronRight className="h-6 w-6 text-white group-hover:text-white transition-colors" />
                  </button>
                </div>
                
                {/* Add Session Button */}
                <button
                  onClick={() => openModal()}
                  className="group relative px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 rounded-2xl text-white font-bold flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-lg tracking-wide">Add New Session</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Apple-style Calendar Grid */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
          {/* Elegant Day Headers - Removed number of sessions text */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50/90 to-white/90 border-b border-gray-200/30">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={day} className="p-6 text-center">
                <div className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-1">{day.substring(0, 3)}</div>
                <div className="text-gray-600 text-xs font-medium">{day}</div>
              </div>
            ))}
          </div>
          
          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-36 bg-gray-50/20 border-r border-b border-gray-100/50"></div>
                )
              }
              
              const daySessions = getSessionsForDate(date)
              const clientCounts = getClientCounts(date)
              const isCurrentDay = isToday(date)
              const hasEvents = Object.keys(clientCounts).length > 0
              
              return (
                <div
                  key={index}
                  onClick={() => openDetailsModal(date)}
                  className={`h-36 p-4 cursor-pointer transition-all duration-300 border-r border-b border-gray-100/50 group hover:shadow-lg ${
                    isCurrentDay 
                      ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 ring-2 ring-blue-400/60 ring-inset shadow-lg' 
                      : hasEvents
                      ? 'bg-white/40 hover:bg-white/70'
                      : 'bg-gray-50/20 hover:bg-gray-50/40'
                  }`}
                >
                  <div className="h-full flex flex-col">
                    {/* Date Number with Apple-style indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-lg font-bold transition-colors ${
                        isCurrentDay 
                          ? 'text-blue-700' 
                          : date.getMonth() === currentDate.getMonth() 
                            ? 'text-gray-900' 
                            : 'text-gray-400'
                      }`}>
                        {date.getDate()}
                      </div>
                      {isCurrentDay && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      {hasEvents && !isCurrentDay && (
                        <div className="w-2 h-2 bg-gray-400 rounded-full opacity-60"></div>
                      )}
                    </div>
                    
                    {/* Session Indicators */}
                    <div className="flex-1 space-y-2 overflow-hidden">
                      {Object.entries(clientCounts).slice(0, 2).map(([client, count]) => {
                        const clientType = getClientType(client)
                        const clientColor = CLIENT_COLORS[clientType]
                        
                        return (
                          <div
                            key={client}
                            className="text-xs rounded-xl px-3 py-2 font-semibold truncate transition-all duration-200 group-hover:scale-105"
                            style={{
                              background: clientColor.bg,
                              color: clientColor.text,
                              boxShadow: `0 4px 12px ${clientColor.shadow}`
                            }}
                            title={`${client}: ${count} candidates`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{client.substring(0, 8)}</span>
                              <span className="ml-2 font-bold">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                      
                      {Object.keys(clientCounts).length > 2 && (
                        <div className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100/50 rounded-lg">
                          +{Object.keys(clientCounts).length - 2} more clients
                        </div>
                      )}
                      
                      {daySessions.length === 0 && date.getMonth() === currentDate.getMonth() && (
                        <div className="text-xs text-gray-400 px-3 py-2 italic text-center">
                          No sessions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Premium Apple-style Session Details Modal */}
      {showDetailsModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 backdrop-blur-2xl bg-black/30"
            onClick={closeModal}
          />
          
          <div className="relative w-full max-w-6xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden max-h-[85vh] overflow-y-auto">
            {/* Premium Modal Header */}
            <div 
              className="px-8 py-8 border-b border-gray-200/30 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                boxShadow: `0 8px 32px ${currentTheme.shadow}`
              }}
            >
              {/* Header Background Animation */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full animate-pulse" 
                     style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full animate-bounce" 
                     style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', animationDelay: '0.5s' }}></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight flex items-center mb-2">
                    <Calendar className="h-8 w-8 mr-4" />
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <div className="flex items-center space-x-6 text-white/90">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).length} Sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)} Total Candidates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">{getRemainingSeats(getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0))} Seats Available</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
                >
                  <X className="h-7 w-7 text-white" />
                </button>
              </div>
            </div>

            {/* Client-wise Sessions Display */}
            <div className="p-8">
              {Object.entries(getClientCounts(selectedDate)).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(getClientCounts(selectedDate)).map(([client, totalCount]) => {
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => s.client_name === client)
                    const clientType = getClientType(client)
                    const clientColor = CLIENT_COLORS[clientType]
                    const remainingSeats = getRemainingSeats(totalCount)
                    
                    return (
                      <div key={client} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/30 shadow-lg overflow-hidden">
                        {/* Client Header */}
                        <div 
                          className="p-6 relative overflow-hidden"
                          style={{
                            background: clientColor.bg,
                            boxShadow: `0 4px 20px ${clientColor.shadow}`
                          }}
                        >
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-2 right-2 w-16 h-16 rounded-full animate-pulse" 
                                 style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}></div>
                          </div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <h4 className="text-2xl font-bold text-white flex items-center mb-2">
                                <Building className="h-6 w-6 mr-3" />
                                {client}
                              </h4>
                              <div className="flex items-center space-x-4 text-white/90">
                                <span className="font-semibold">{clientSessions.length} Sessions</span>
                                <span>•</span>
                                <span className="font-semibold">{totalCount} Candidates</span>
                              </div>
                            </div>
                            <div className="text-center bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/30">
                              <div className="text-white/90 text-sm font-medium mb-1">Remaining Seats</div>
                              <div className={`text-3xl font-bold ${
                                remainingSeats > 20 ? 'text-green-200' :
                                remainingSeats > 10 ? 'text-yellow-200' :
                                'text-red-200'
                              }`}>
                                {remainingSeats}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Client Sessions */}
                        <div className="p-6">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {clientSessions.map(session => (
                              <div key={session.id} className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2">{session.exam_name}</h5>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex items-center text-gray-600">
                                        <Clock className="h-4 w-4 mr-3 text-blue-500" />
                                        <span className="font-semibold">{formatTimeRange(session.start_time, session.end_time)}</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Users className="h-4 w-4 mr-3 text-green-500" />
                                        <span className="font-semibold">{session.candidate_count} Candidates</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-3 text-purple-500" />
                                        <span className="font-semibold">{getRemainingSeats(session.candidate_count)} Seats Available</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4 border-t border-gray-200/50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openModal(selectedDate, session)
                                    }}
                                    className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center font-medium shadow-lg"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      session.id && handleDelete(session.id)
                                    }}
                                    className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center font-medium shadow-lg"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gray-100/50 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Sessions Scheduled</h3>
                  <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">No sessions found for this date. Create your first session to get started.</p>
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center mx-auto"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Create New Session
                  </button>
                </div>
              )}
            </div>
            
            {/* Bottom Action Bar */}
            {getSessionsForDate(selectedDate).length > 0 && (
              <div className="px-8 py-6 bg-gray-50/80 backdrop-blur-xl border-t border-gray-200/30">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Add Another Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Apple-style Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 backdrop-blur-2xl bg-black/40"
            onClick={closeModal}
          />
          
          <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            {/* Premium Modal Header */}
            <div 
              className="px-8 py-8 border-b border-gray-200/30 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                boxShadow: `0 8px 32px ${currentTheme.shadow}`
              }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 right-2 w-24 h-24 rounded-full animate-pulse" 
                     style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
                <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full animate-bounce" 
                     style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', animationDelay: '0.5s' }}></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight mb-2">
                    {editingSession ? 'Edit Session' : 'Create New Session'}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {editingSession ? 'Update session information' : 'Add a new session to the calendar'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
                >
                  <X className="h-7 w-7 text-white" />
                </button>
              </div>
            </div>

            {/* Premium Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Client and Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Client Name
                    </label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <option value="">Select Client</option>
                      <option value="PEARSON">PEARSON</option>
                      <option value="VUE">VUE</option>
                      <option value="ETS">ETS</option>
                      <option value="PSI">PSI</option>
                      <option value="PROMETRIC">PROMETRIC</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({...formData, exam_name: e.target.value})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      placeholder="Enter exam name"
                    />
                  </div>
                </div>
                
                {/* Date and Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Candidate Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="80"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({...formData, candidate_count: parseInt(e.target.value) || 1})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    />
                  </div>
                </div>
                
                {/* Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                      className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    />
                  </div>
                </div>
                
                {/* Capacity Information Card */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-xl p-8 rounded-3xl border border-blue-200/50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-800 text-lg mb-2 flex items-center">
                        <Users className="h-6 w-6 mr-3" />
                        Capacity Information
                      </h4>
                      <p className="text-blue-600 font-medium">Maximum capacity: 80 candidates per session</p>
                      <p className="text-blue-600 text-sm mt-1">Current session: {formData.candidate_count} candidates</p>
                    </div>
                    <div className="text-center bg-white/60 backdrop-blur-xl rounded-2xl px-6 py-4 border border-blue-200/50 shadow-lg">
                      <div className="text-blue-800 text-sm font-medium mb-1">Seats Remaining</div>
                      <div className={`text-4xl font-bold ${
                        getRemainingSeats(formData.candidate_count) > 20 ? 'text-green-600' :
                        getRemainingSeats(formData.candidate_count) > 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getRemainingSeats(formData.candidate_count)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-8 py-4 bg-gray-200/80 hover:bg-gray-300/80 backdrop-blur-md text-gray-800 font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center"
                  >
                    {editingSession ? (
                      <>
                        <Edit className="h-5 w-5 mr-3" />
                        Update Session
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-3" />
                        Create Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
