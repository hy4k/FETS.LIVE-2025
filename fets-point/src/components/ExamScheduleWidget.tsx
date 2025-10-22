import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { Calendar, ChevronRight, Clock, Users, AlertCircle } from 'lucide-react'
import { formatDateForIST } from '../utils/dateUtils'

interface ExamScheduleWidgetProps {
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
  sessions: Session[]
}

const CLIENT_COLORS: { [key: string]: string } = {
  PEARSON: 'border-blue-500',
  VUE: 'border-red-500',
  ETS: 'border-green-500',
  PSI: 'border-purple-500',
  PROMETRIC: 'border-orange-500',
  OTHER: 'border-gray-500',
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

export function ExamScheduleWidget({ onNavigate }: ExamScheduleWidgetProps) {
  const { activeBranch } = useBranch()

  const { data: schedule, isLoading, error } = useQuery<DaySchedule[]>({
    queryKey: ['examSchedule', '7days', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const startDate = formatDateForIST(today)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 3) // Fetch for 4 days (today + 3)
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
      for (let i = 0; i < 4; i++) { // Loop for 4 days
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateStr = formatDateForIST(date)
        const daySessions = sessions?.filter(s => s.date === dateStr) || []

        days.push({
          date: dateStr,
          dayName: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
          sessions: daySessions,
        })
      }
      return days
    },
    staleTime: 60000, // 1 minute
  })

  return (
    <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-[#374151] flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Calendar className="w-6 h-6 text-green-600" />
            Exam Schedule
        </h2>
        <button
          onClick={() => onNavigate?.('fets-calendar')}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Open Calendar
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-500">Loading schedule...</div>}
      {error && (
        <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
          <AlertCircle className="mx-auto h-6 w-6 mb-2" />
          Error loading schedule.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {schedule?.map(day => (
          <div key={day.date} className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all" onClick={() => onNavigate?.('fets-calendar')}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">{day.dayName}</h3>
              <span className="text-sm font-medium text-gray-500">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="space-y-2 h-64 overflow-y-auto pr-1">
              {day.sessions.length > 0 ? (
                day.sessions.map(session => {
                    const clientType = getClientType(session.client_name);
                    return (
                      <div key={session.id} className={`p-2.5 rounded-lg border-l-4 ${CLIENT_COLORS[clientType]} bg-white`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm line-clamp-1">{session.client_name} - {session.exam_name}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock size={12} className="mr-1.5" />
                              {session.start_time}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
                            <Users size={12} className="mr-1" />
                            {session.candidate_count}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-sm text-gray-500 italic">No exams scheduled.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}