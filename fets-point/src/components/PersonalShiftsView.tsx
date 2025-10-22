import React, { useState, useMemo } from 'react'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Schedule, SHIFT_CODES } from '../types/shared'

interface PersonalShiftsViewProps {
  schedules: Schedule[]
  currentDate: Date
  onNavigate: (direction: 'prev' | 'next') => void
}

export const PersonalShiftsView: React.FC<PersonalShiftsViewProps> = ({
  schedules,
  currentDate,
  onNavigate
}) => {
  const { profile } = useAuth()
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month')

  // Filter schedules for current user only
  const mySchedules = useMemo(() => {
    if (!profile?.id) return []
    return schedules.filter(s => s.profile_id === profile.id)
  }, [schedules, profile?.id])

  // Generate calendar view
    const { weeks, monthStats } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const weeks = []
    let weekNumber = 1
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      if (date.getDay() === 0 || day === 1) {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const weekDates = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart)
          d.setDate(weekStart.getDate() + i)
          weekDates.push(d)
        }
        
        const hasCurrentMonthDays = weekDates.some(d => d.getMonth() === month)
        
        if (hasCurrentMonthDays) {
          weeks.push({
            id: `week-${weekNumber}`,
            label: `Week ${weekNumber}`,
            dates: weekDates
          })
          weekNumber++
        }
      }
    }
    
    // Calculate monthly statistics
    const monthlySchedules = mySchedules.filter(s => {
      const scheduleDate = new Date(s.date)
      return scheduleDate.getMonth() === month && scheduleDate.getFullYear() === year
    })
    
    const stats = {
      totalShifts: monthlySchedules.length,
      dayShifts: monthlySchedules.filter(s => s.shift_code === 'D').length,
      eveningShifts: monthlySchedules.filter(s => s.shift_code === 'E').length,
      restDays: monthlySchedules.filter(s => s.shift_code === 'RD').length,
      leaveDays: monthlySchedules.filter(s => s.shift_code === 'L').length,
      totalOvertimeHours: monthlySchedules.reduce((sum, s) => sum + (s.overtime_hours || 0), 0)
    }
    
    return { weeks, monthStats: stats }
  }, [currentDate, mySchedules])
  // Get schedule for a specific date
  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return mySchedules.find(s => s.date === dateStr)
  }

  // Render shift cell
  const renderShiftCell = (date: Date) => {
    const schedule = getScheduleForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
    
    let cellContent = null
    let cellStyle = {}
    let displayText = ''
    
    if (schedule) {
      const shiftInfo = SHIFT_CODES[schedule.shift_code as keyof typeof SHIFT_CODES]
      if (shiftInfo) {
        // Handle D+OT and E+OT combinations
        if (schedule.overtime_hours && schedule.overtime_hours > 0 && 
            (schedule.shift_code === 'D' || schedule.shift_code === 'E')) {
          cellStyle = {
            background: SHIFT_CODES.OT.bgColor,
            color: SHIFT_CODES.OT.textColor
          }
          displayText = `${schedule.shift_code}+OT`
        } else {
          cellStyle = {
            background: shiftInfo.bgColor,
            color: shiftInfo.textColor
          }
          displayText = shiftInfo.letter
        }
        
        cellContent = (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <span className="font-bold text-sm">{displayText}</span>
            {schedule.overtime_hours && schedule.overtime_hours > 0 && (
              <span className="text-xs font-medium opacity-90">{schedule.overtime_hours}h</span>
            )}
          </div>
        )
      }
    }
    
    return (
      <div
        key={date.toISOString()}
        className={`
          h-20 w-full rounded-xl transition-all duration-200
          flex items-center justify-center relative backdrop-blur-sm border
          ${isToday ? 'ring-2 ring-blue-500' : ''}
          ${schedule ? 'border-white/30 shadow-md' : 'border-gray-200 bg-gray-50/50'}
          ${!isCurrentMonth ? 'opacity-30' : ''}
        `}
        style={cellStyle}
      >
        {cellContent || (
          <div className="text-gray-400 text-sm font-medium">
            {date.getDate()}
          </div>
        )}
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">My Shifts</h2>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-colors text-sm ${
                viewMode === 'week'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-colors text-sm ${
                viewMode === 'month'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('prev')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button
            onClick={() => onNavigate('next')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
          Monthly Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-blue-50/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{monthStats.totalShifts}</div>
            <div className="text-sm text-blue-700">Total Shifts</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{monthStats.dayShifts}</div>
            <div className="text-sm text-blue-700">Day Shifts</div>
          </div>
          
          <div className="text-center p-3 bg-green-50/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{monthStats.eveningShifts}</div>
            <div className="text-sm text-green-700">Evening Shifts</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{monthStats.restDays}</div>
            <div className="text-sm text-gray-700">Rest Days</div>
          </div>
          
          <div className="text-center p-3 bg-red-50/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{monthStats.leaveDays}</div>
            <div className="text-sm text-red-700">Leave Days</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{monthStats.totalOvertimeHours}</div>
            <div className="text-sm text-purple-700">OT Hours</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
        {/* Days Header */}
        <div className="bg-gray-50/80 border-b border-gray-200/50">
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center font-semibold text-sm text-gray-700">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {weeks.map((week, weekIndex) => (
            <div key={week.id} className="grid grid-cols-7 gap-2 mb-2">
              {week.dates.map((date, dateIndex) => (
                <div key={dateIndex}>
                  {renderShiftCell(date)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Shift Legend */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(SHIFT_CODES).map(([code, info]) => (
            <div key={code} className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: info.bgColor, color: info.textColor }}
              >
                {info.letter}
              </div>
              <span className="text-sm text-gray-700">{info.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}