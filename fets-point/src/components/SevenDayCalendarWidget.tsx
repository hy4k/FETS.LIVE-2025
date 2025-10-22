import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { Calendar, ChevronRight, Clock, Users, AlertCircle } from 'lucide-react'
import { formatDateForIST } from '../utils/dateUtils'

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

const CLIENT_COLORS: { [key: string]: { border: string; bg: string; text: string } } = {
  PEARSON: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  VUE: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  ETS: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  PSI: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  PROMETRIC: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  OTHER: { border: 'border-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' },
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

  const { data: schedule, isLoading, error } = useQuery<DaySchedule[]>({
    queryKey: ['sevenDayCalendar', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const startDate = formatDateForIST(today)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 6) // Fetch for 7 days
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
      for (let i = 0; i < 7; i++) {
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
    <div className="bg-gradient-to-br from-white/98 via-blue-50/30 to-gray-50/95 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
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

      {/* 7-Day Grid Layout */}
      <div className="grid grid-cols-7 gap-4">
        {schedule?.map((day, index) => (
          <div
            key={day.date}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer ${
              index === getTodayIndex()
                ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-100/50 border-blue-300 shadow-lg hover:shadow-blue-200/50'
                : 'bg-white/80 border-gray-200 hover:border-blue-200 hover:bg-white'
            }`}
            onClick={() => onNavigate?.('fets-calendar')}
          >
            {/* Day Header */}
            <div className="bg-gradient-to-r from-gray-100/80 to-gray-50 px-4 py-4 border-b border-gray-200/60">
              <div className="text-center">
                <p className="font-bold text-sm text-gray-800">
                  {day.dayName === 'Today' ? (
                    <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-bold shadow-md">
                      Today
                    </span>
                  ) : (
                    day.dayName
                  )}
                </p>
                <p className="text-xs text-gray-700 font-bold mt-1.5 text-lg">{day.dayNumber}</p>
              </div>
            </div>

            {/* Sessions List */}
            <div className="px-3 py-3 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {day.sessions.length > 0 ? (
                <div className="space-y-2">
                  {day.sessions.map(session => {
                    const clientType = getClientType(session.client_name)
                    const colors = CLIENT_COLORS[clientType]
                    return (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} text-xs transition-all hover:shadow-md hover:border-l-8 ${colors.border}`}
                      >
                        <p className={`font-bold ${colors.text} line-clamp-2 text-sm`}>
                          {session.client_name}
                        </p>
                        <p className="text-gray-700 line-clamp-1 text-xs mt-1.5 font-medium">
                          {session.exam_name}
                        </p>
                        <div className="flex items-center text-gray-600 text-xs mt-1.5 font-semibold">
                          <Clock size={12} className="mr-1.5" />
                          <span className="text-blue-700 font-bold">{session.start_time?.substring(0, 5) || '--:--'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-xs mt-1.5">
                          <Users size={12} className="mr-1.5" />
                          <span className="font-bold text-blue-700">{session.candidate_count} 👥</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center italic">No exams</p>
                </div>
              )}
            </div>

            {/* Day Summary Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/40 px-3 py-3 border-t border-gray-200/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-bold">
                  {day.sessions.length} {day.sessions.length === 1 ? 'session' : 'sessions'}
                </span>
                {day.totalCandidates > 0 && (
                  <span className="font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full">
                    {day.totalCandidates}👥
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {schedule && schedule.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200/60">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">📊 Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/60 hover:border-blue-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {schedule.reduce((sum, day) => sum + day.sessions.length, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/60 hover:border-green-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Candidates</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {schedule.reduce((sum, day) => sum + day.totalCandidates, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200/60 hover:border-purple-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Days with Exams</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {schedule.filter(day => day.sessions.length > 0).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/60 hover:border-orange-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Avg per Day</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {Math.ceil(schedule.reduce((sum, day) => sum + day.sessions.length, 0) / 7)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
