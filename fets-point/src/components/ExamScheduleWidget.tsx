import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateForIST, getCurrentISTDateString } from '../utils/dateUtils'
import { useBranch, useBranchFilter } from '../contexts/BranchContext'

interface ExamSession {
  id: number
  client_name: string
  exam_name: string
  date: string
  candidate_count: number
  start_time: string
  end_time: string
}

interface DaySchedule {
  date: string
  dayName: string
  displayDate: string
  sessions: ExamSession[]
  totalCandidates: number
}

interface ExamScheduleWidgetProps {
  onNavigate?: (tab: string) => void
}

const CLIENT_COLORS = {
  'PEARSON': 'bg-blue-500',
  'VUE': 'bg-red-500', 
  'ETS': 'bg-green-500',
  'PSI': 'bg-purple-500',
  'PROMETRIC': 'bg-orange-500',
  'OTHER': 'bg-gray-500'
}

type ClientType = keyof typeof CLIENT_COLORS

export function ExamScheduleWidget({ onNavigate }: ExamScheduleWidgetProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()

  useEffect(() => {
    loadNext3DaysSchedule()
  }, [activeBranch]) // Reload when branch changes

  const getNext3Days = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const loadNext3DaysSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const next3Days = getNext3Days()
      const startDate = formatDateForIST(next3Days[0])
      const endDate = formatDateForIST(next3Days[2])
      
      let query = supabase
        .from('sessions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
      
      // Apply branch filter
      if (!isGlobalView) {
        query = applyFilter(query)
      }
      
      const { data: sessions, error: fetchError } = await query
      
      if (fetchError) {
        throw fetchError
      }
      
      // Group sessions by date
      const scheduleByDate: { [key: string]: DaySchedule } = {}
      
      // Initialize all 3 days
      next3Days.forEach(date => {
        const dateStr = formatDateForIST(date)
        scheduleByDate[dateStr] = {
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sessions: [],
          totalCandidates: 0
        }
      })
      
      // Add sessions to their respective dates
      sessions?.forEach(session => {
        if (scheduleByDate[session.date]) {
          scheduleByDate[session.date].sessions.push(session)
          scheduleByDate[session.date].totalCandidates += session.candidate_count
        }
      })
      
      setSchedule(Object.values(scheduleByDate))
    } catch (error) {
      console.error('Error loading exam schedule:', error)
      setError('Failed to load exam schedule')
      
      // Fallback to sample data if there's an error
      const next3Days = getNext3Days()
      const sampleSchedule: DaySchedule[] = next3Days.map((date, index) => ({
        date: formatDateForIST(date),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: index === 0 ? [
          {
            id: 1,
            client_name: 'PEARSON',
            exam_name: 'PTE Academic',
            date: formatDateForIST(date),
            candidate_count: 24,
            start_time: '09:00',
            end_time: '17:00'
          },
          {
            id: 2,
            client_name: 'VUE',
            exam_name: 'CISSP Certification',
            date: formatDateForIST(date),
            candidate_count: 12,
            start_time: '14:00',
            end_time: '18:00'
          }
        ] : index === 1 ? [
          {
            id: 3,
            client_name: 'ETS',
            exam_name: 'TOEFL iBT',
            date: formatDateForIST(date),
            candidate_count: 18,
            start_time: '10:00',
            end_time: '16:00'
          }
        ] : [],
        totalCandidates: index === 0 ? 36 : index === 1 ? 18 : 0
      }))
      
      setSchedule(sampleSchedule)
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (date: string) => {
    const today = getCurrentISTDateString()
    if (date === today) return 'text-green-600 bg-green-50'
    if (date > today) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="standardized-widget">
        <div className="unified-widget-header">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Next 3 Days Exam Schedule</h2>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">Loading exam schedule...</span>
          </div>
        </div>
      </div>
    )
  }

  const totalScheduledCandidates = schedule.reduce((sum, day) => sum + day.totalCandidates, 0)

  return (
    <div className="standardized-widget">
      {/* Consistent Header Style matching Today's Activity */}
      <div className="unified-widget-header">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Next 3 Days Exam Schedule</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate?.('fets-calendar')}
              className="btn-tertiary-modern flex items-center text-xs"
              title="View Full Calendar"
            >
              <Eye className="h-4 w-4 mr-1" />
              Full Calendar
            </button>
            <button className="expand-button" title="Expand to full screen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14H5v5h5v-2H7v-3zM5 10h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {totalScheduledCandidates} candidates scheduled {isGlobalView ? 'across all branches' : `at ${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)}`} across {schedule.filter(day => day.sessions.length > 0).length} active days
        </p>
      </div>
      
      {/* Workflow Management Style Content - No Scroll */}
      <div className="workflow-content-style no-scroll-widget">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schedule.map((day, dayIndex) => (
            <div 
              key={day.date} 
              className="exam-day-card glassmorphism-card"
            >
              {/* Day Header */}
              <div className="exam-day-header">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#ffc51e' }}>{day.dayName}</h3>
                  <p className="text-sm font-medium" style={{ color: '#ffc51e' }}>{day.displayDate}</p>
                </div>
                <div className="exam-day-stats">
                  <div className="text-2xl font-bold" style={{ color: '#ffc51e' }}>{day.totalCandidates}</div>
                  <div className="text-xs uppercase font-medium" style={{ color: '#ffc51e' }}>candidates</div>
                </div>
              </div>

              {/* Sessions */}
              <div className="exam-sessions">
                {day.sessions.length > 0 ? (
                  day.sessions.map((session, sessionIndex) => (
                    <div 
                      key={session.id} 
                      className="exam-session-card"
                    >
                      {/* Session Header */}
                      <div className="exam-session-header">
                        <div className="exam-session-client">
                          <span 
                            className={`client-indicator ${CLIENT_COLORS[getClientType(session.client_name)]}`}
                          ></span>
                          <span className="client-name">{session.client_name}</span>
                        </div>
                        <span className="exam-session-count">
                          <Users className="h-3 w-3 mr-1" />
                          {session.candidate_count}
                        </span>
                      </div>
                      
                      {/* Exam Details */}
                      <div className="exam-session-details">
                        {session.exam_name}
                      </div>
                      
                      {/* Time */}
                      <div className="exam-session-time">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeRange(session.start_time, session.end_time)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="exam-no-sessions">
                    <div className="exam-no-sessions-icon">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      No exams scheduled
                    </div>
                    <p className="exam-no-sessions-text">This day is free</p>
                  </div>
                )}
              </div>
              
              {/* Day Status Indicator */}
              <div className="exam-day-status">
                <div className="exam-status-label">Status</div>
                <div className="exam-status-indicator">
                  {day.sessions.length > 0 ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="exam-status-text scheduled">Scheduled</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span className="exam-status-text available">Available</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="exam-error-message">
            <p className="exam-error-text">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error} - Showing sample data
            </p>
          </div>
        )}
      </div>
    </div>
  )
}