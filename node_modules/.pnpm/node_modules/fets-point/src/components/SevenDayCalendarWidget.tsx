import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { Calendar, ChevronRight, Clock, Users, AlertCircle, ChevronDown } from 'lucide-react'
import { formatDateForIST } from '../utils/dateUtils'
import { useState } from 'react'

interface SevenDayCalendarWidgetProps {
  onNavigate?: (tab: string) => void
}

interface Session {
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
  dayNumber: string
  sessions: Session[]
  totalCandidates: number
}

const CLIENT_COLORS: { [key: string]: { border: string; bg: string; text: string; gradient: string; glow: string; badge: string } } = {
  PEARSON: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/50',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  },
  VUE: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    gradient: 'from-red-500 to-pink-500',
    glow: 'shadow-red-500/50',
    badge: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  ETS: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    gradient: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/50',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  PSI: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    gradient: 'from-purple-500 to-fuchsia-500',
    glow: 'shadow-purple-500/50',
    badge: 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
  },
  PROMETRIC: {
    border: 'border-teal-500',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    gradient: 'from-teal-500 to-cyan-500',
    glow: 'shadow-teal-500/50',
    badge: 'bg-gradient-to-r from-teal-500 to-cyan-500'
  },
  OTHER: {
    border: 'border-gray-500',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    gradient: 'from-gray-500 to-slate-500',
    glow: 'shadow-gray-500/50',
    badge: 'bg-gradient-to-r from-gray-500 to-slate-500'
  },
}

const getClientType = (clientName: string): string => {
  const upperName = clientName.toUpperCase()
  if (upperName.includes('PEARSON')) return 'PEARSON'
  if (upperName.includes('VUE')) return 'VUE'
  if (upperName.includes('ETS')) return 'ETS'
  if (upperName.includes('PSI')) return 'PSI'
  if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
  return 'OTHER'
}

export function SevenDayCalendarWidget({ onNavigate }: SevenDayCalendarWidgetProps) {
  const { activeBranch } = useBranch()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  const { data: schedule, isLoading, error } = useQuery<DaySchedule[]>({
    queryKey: ['sevenDayCalendar', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const startDate = formatDateForIST(today)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 5) // Fetch for 6 days (0-5)
      const endDateStr = formatDateForIST(endDate)

      let query = supabase
        .from('sessions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data: sessions, error } = await query
      if (error) throw error

      const days: DaySchedule[] = []
      for (let i = 0; i < 6; i++) { // Changed to 6 days
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateStr = formatDateForIST(date)
        const daySessions = sessions?.filter(s => s.date === dateStr) || []
        const totalCandidates = daySessions.reduce((sum, s) => sum + s.candidate_count, 0)

        days.push({
          date: dateStr,
          dayName: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString(),
          sessions: daySessions,
          totalCandidates: totalCandidates,
        })
      }
      return days
    },
    staleTime: 60000, // 1 minute
  })

  const getTodayIndex = () => {
    if (!schedule) return 0
    return schedule.findIndex(day => day.dayName === 'Today')
  }

  const getDayStatusColor = (dayIndex: number) => {
    if (dayIndex === getTodayIndex()) {
      return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'
    }
    return 'bg-white'
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 shadow-2xl">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#1f2937] flex items-center gap-3 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">7 Days Calendar</span>
            </h2>
            <p className="text-sm text-gray-600 font-medium">Exam sessions for the next 7 days</p>
          </div>
          <button
            onClick={() => onNavigate?.('fets-calendar')}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold transition-all hover:gap-2"
          >
            View Full
            <ChevronRight size={18} className="ml-1" />
          </button>
        </div>

      {isLoading && <div className="text-center py-12 text-gray-400 font-medium">✨ Loading calendar...</div>}
      {error && (
        <div className="text-center py-12 text-red-600 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-medium">Error loading calendar</p>
        </div>
      )}

      {/* 6-Day Stunning Grid - Wider columns */}
      <div className="grid grid-cols-6 gap-6">
        {schedule?.map((day, index) => {
          const isExpanded = true // Always expanded by default
          const isToday = index === getTodayIndex()
          return (
            <div
              key={day.date}
              className="group relative"
            >
              {/* Glassmorphism Card with Glow */}
              <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                isToday
                  ? 'bg-white/70 border-blue-400/60 shadow-2xl shadow-blue-500/30'
                  : 'bg-white/50 border-white/60 shadow-xl hover:shadow-2xl hover:border-purple-300/60'
              }`}>
                {/* Colorful Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-10 ${
                  isToday ? 'from-blue-400 via-cyan-400 to-purple-400' : 'from-purple-400 via-pink-400 to-indigo-400'
                }`} />

                {/* Floating Day Header */}
                <div className="relative px-4 py-5 text-center border-b border-white/40 backdrop-blur-sm">
                  <p className={`font-black text-sm tracking-wider mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em' }}>
                    {day.dayName === 'Today' ? (
                      <span className="inline-flex px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-black shadow-lg animate-pulse">
                        TODAY
                      </span>
                    ) : (
                      day.dayName.toUpperCase()
                    )}
                  </p>
                  <p className={`text-3xl font-black ${isToday ? 'text-blue-600' : 'text-gray-800'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {day.dayNumber}
                  </p>

                  {/* Session Count Chip */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-full border border-purple-300/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-purple-700">
                      {day.sessions.length} {day.sessions.length === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>
                </div>

              {/* Collapsible Sessions List */}
              {isExpanded && (
                <div className="px-3 py-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {day.sessions.length > 0 ? (
                    <div className="space-y-3">
                      {day.sessions.map((session, idx) => {
                        const clientType = getClientType(session.client_name)
                        const colors = CLIENT_COLORS[clientType]
                        const capacityPercent = Math.min((session.candidate_count / 50) * 100, 100) // Assuming max 50
                        return (
                          <div
                            key={session.id}
                            className={`group relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-md border-2 border-white/60 hover:border-white/90 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.03] ${colors.glow}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onNavigate?.('fets-calendar')
                            }}
                            style={{
                              animation: `slideIn 0.4s ease-out ${idx * 0.1}s both`
                            }}
                          >
                            {/* Vibrant Gradient Side Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.gradient} shadow-lg`} />

                            {/* Provider Badge Chip at top */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg ${colors.badge} text-white text-[9px] font-black tracking-wider shadow-md flex-shrink-0`}>
                                {clientType}
                              </span>
                              {/* Candidates Badge */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-[9px] font-black shadow-sm flex-shrink-0">
                                <Users size={9} />
                                {session.candidate_count}
                              </span>
                            </div>

                            {/* Exam Name */}
                            <p className="text-[11px] font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2 break-words">
                              {session.exam_name}
                            </p>

                            {/* Time - Dark Gray */}
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock size={10} />
                              <span className="text-[10px] font-bold">
                                {session.start_time?.substring(0, 5) || '--:--'}
                              </span>
                            </div>

                            {/* Hover Glow Effect */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-gray-200/60">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-gray-500">No sessions</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Floating Summary Badge with subtle color */}
              <div className="relative mt-3 px-3 pb-3">
                <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md border-2 ${
                  isToday
                    ? 'bg-gradient-to-r from-blue-400/30 to-cyan-400/30 border-blue-400/50'
                    : 'bg-gradient-to-r from-purple-400/30 to-pink-400/30 border-purple-400/50'
                }`}>
                  <Users size={12} className={isToday ? 'text-blue-600' : 'text-purple-600'} />
                  <span className={`text-sm font-black ${isToday ? 'text-blue-700' : 'text-purple-700'}`}>
                    {day.totalCandidates}
                  </span>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-blue-600/70' : 'text-purple-600/70'}`}>
                    total
                  </span>
                </div>
              </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progressGrow {
          from {
            width: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>

      {/* Today's Overview */}
      {schedule && schedule.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/40">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">📊 Today's Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const today = schedule[0] // First day is always today
              return (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/60 hover:border-blue-300 transition-all hover:shadow-lg backdrop-blur-md">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Sessions</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {today.sessions.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/60 hover:border-green-300 transition-all hover:shadow-lg backdrop-blur-md">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Candidates</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {today.totalCandidates}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200/60 hover:border-purple-300 transition-all hover:shadow-lg backdrop-blur-md">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Unique Providers</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {new Set(today.sessions.map(s => getClientType(s.client_name))).size}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-5 border border-teal-200/60 hover:border-teal-300 transition-all hover:shadow-lg backdrop-blur-md">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Peak Session</p>
                    <p className="text-3xl font-bold text-teal-600 mt-2">
                      {today.sessions.length > 0 ? Math.max(...today.sessions.map(s => s.candidate_count)) : 0}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
