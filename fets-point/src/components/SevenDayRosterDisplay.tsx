import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBranch } from '../hooks/useBranch'
import { Users, Calendar, AlertCircle } from 'lucide-react'
import { formatDateForIST } from '../utils/dateUtils'

interface StaffShift {
  id: string
  staff_name: string
  shift_code: string
  overtime_hours: number
}

interface DayRoster {
  date: string
  dayName: string
  dayNumber: string
  shifts: StaffShift[]
}

const SHIFT_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  'D': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'E': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'HD': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'RD': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  'L': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'OT': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'T': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

export function SevenDayRosterDisplay() {
  const { activeBranch } = useBranch()
  const [rosterDays, setRosterDays] = useState<DayRoster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRoster = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const today = new Date()
        const startDate = formatDateForIST(today)
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 6) // 7 days
        const endDateStr = formatDateForIST(endDate)

        // Fetch roster schedules with staff profile names
        let query = supabase
          .from('roster_schedules')
          .select(`
            id,
            date,
            shift_code,
            overtime_hours,
            staff_profiles(full_name)
          `)
          .gte('date', startDate)
          .lte('date', endDateStr)
          .order('date', { ascending: true })
          .order('shift_code', { ascending: true })

        const { data: rosters, error } = await query

        if (error) {
          console.error('Error loading roster:', error)
          setError('Failed to load roster data')
          setRosterDays([])
          return
        }

        // Group roster data by date
        const rosterMap = new Map<string, StaffShift[]>()

        rosters?.forEach((roster: any) => {
          const dateKey = roster.date
          if (!rosterMap.has(dateKey)) {
            rosterMap.set(dateKey, [])
          }

          const staffName = roster.staff_profiles?.full_name || 'Unknown Staff'
          rosterMap.get(dateKey)?.push({
            id: roster.id,
            staff_name: staffName,
            shift_code: roster.shift_code,
            overtime_hours: roster.overtime_hours || 0,
          })
        })

        // Build day roster objects
        const days: DayRoster[] = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          const dateStr = formatDateForIST(date)
          const dayShifts = rosterMap.get(dateStr) || []

          days.push({
            date: dateStr,
            dayName: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: date.getDate().toString(),
            shifts: dayShifts,
          })
        }

        setRosterDays(days)
      } catch (err) {
        console.error('Error loading roster:', err)
        setError('Failed to load roster data')
        setRosterDays([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRoster()
  }, [activeBranch])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">Loading roster schedule...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-lg p-6">
        <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
          <AlertCircle className="mx-auto h-6 w-6 mb-2" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white/98 via-purple-50/30 to-gray-50/95 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#1f2937] flex items-center gap-3 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Calendar className="w-8 h-8 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">7 Days Roster Schedule</span>
          </h2>
          <p className="text-sm text-gray-600 font-medium">Staff assignments for the next 7 days</p>
        </div>
      </div>

      {/* 7-Day Roster Grid */}
      <div className="grid grid-cols-7 gap-4">
        {rosterDays.map((day) => (
          <div
            key={day.date}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl ${
              day.dayName === 'Today'
                ? 'bg-gradient-to-br from-purple-50/80 via-white to-purple-100/50 border-purple-300 shadow-lg hover:shadow-purple-200/50'
                : 'bg-white/80 border-gray-200 hover:border-purple-200 hover:bg-white'
            }`}
          >
            {/* Day Header */}
            <div className="bg-gradient-to-r from-gray-100/80 to-gray-50 px-4 py-4 border-b border-gray-200/60">
              <div className="text-center">
                <p className="font-bold text-sm text-gray-800">
                  {day.dayName === 'Today' ? (
                    <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full text-xs font-bold shadow-md">
                      Today
                    </span>
                  ) : (
                    day.dayName
                  )}
                </p>
                <p className="text-xs text-gray-700 font-bold mt-1.5 text-lg">{day.dayNumber}</p>
              </div>
            </div>

            {/* Shifts List */}
            <div className="px-3 py-3 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {day.shifts.length > 0 ? (
                <div className="space-y-2">
                  {day.shifts.map((shift, idx) => {
                    const shiftColor = SHIFT_COLORS[shift.shift_code] || SHIFT_COLORS['D']
                    return (
                      <div
                        key={`${day.date}-${shift.id}`}
                        className={`p-3 rounded-lg border-l-4 border-purple-500 ${shiftColor.bg} text-xs transition-all hover:shadow-md hover:border-purple-700 ${shiftColor.border}`}
                      >
                        <div className={`font-bold ${shiftColor.text} line-clamp-2 text-sm`}>
                          {shift.staff_name}
                        </div>
                        <div className="text-gray-600 text-xs mt-1.5 font-semibold">
                          Shift: <span className={`${shiftColor.text} font-bold text-xs`}>{shift.shift_code}</span>
                        </div>
                        {shift.overtime_hours > 0 && (
                          <div className="text-orange-600 text-xs mt-1.5 font-bold bg-orange-100/60 px-2 py-0.5 rounded inline-block">
                            ⏱️ OT: {shift.overtime_hours}h
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center italic">— No shifts assigned —</p>
                </div>
              )}
            </div>

            {/* Day Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-purple-50/40 px-3 py-3 border-t border-gray-200/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-bold">
                  {day.shifts.length} {day.shifts.length === 1 ? 'staff' : 'staff'}
                </span>
                {day.shifts.some(s => s.overtime_hours > 0) && (
                  <span className="text-orange-600 font-bold bg-orange-100/50 px-2 py-0.5 rounded-full">
                    {day.shifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0)}h OT
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {rosterDays && rosterDays.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200/60">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">📊 Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200/60 hover:border-purple-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Staff</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {rosterDays.reduce((sum, day) => sum + day.shifts.length, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/60 hover:border-blue-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Days Covered</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {rosterDays.filter(day => day.shifts.length > 0).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/60 hover:border-orange-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total OT Hours</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {rosterDays.reduce((sum, day) => sum + day.shifts.reduce((s, shift) => s + (shift.overtime_hours || 0), 0), 0)}h
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/60 hover:border-green-300 transition-all hover:shadow-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Avg Staff/Day</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {Math.ceil(rosterDays.reduce((sum, day) => sum + day.shifts.length, 0) / 7)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
