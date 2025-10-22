import React, { useState, useMemo } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Schedule, StaffProfile, SHIFT_CODES } from '../types/shared'

interface WeeklyRosterViewProps {
  staffProfiles: StaffProfile[]
  schedules: Schedule[]
  currentDate: Date
  onCellClick: (profileId: string, date: Date) => void
}

const NewWeeklyRosterView: React.FC<WeeklyRosterViewProps> = ({
  staffProfiles = [],
  schedules = [],
  currentDate,
  onCellClick
}) => {
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set())

  // Generate weeks for the current month
    const weeks = useMemo(() => {
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
            label: `Week ${weekNumber}: ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            startDate: weekStart,
            endDate: weekEnd,
            dates: weekDates
          })
          weekNumber++
        }
      }
    }
    
    return weeks
  }, [currentDate])
  // Get schedule for specific staff and date
  const getScheduleForDate = (staffId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.find(s => s.profile_id === staffId && s.date === dateStr)
  }

  // Toggle week collapse
  const toggleWeekCollapse = (weekId: string) => {
    const newCollapsed = new Set(collapsedWeeks)
    if (newCollapsed.has(weekId)) {
      newCollapsed.delete(weekId)
    } else {
      newCollapsed.add(weekId)
    }
    setCollapsedWeeks(newCollapsed)
  }

  // Render shift strip segment
  const renderShiftSegment = (staff: StaffProfile, date: Date, index: number) => {
    const schedule = getScheduleForDate(staff.id, date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
    
    let segmentStyle = {}
    let displayText = ''
    let textColor = '#6b7280'
    
    if (schedule) {
      const shiftInfo = SHIFT_CODES[schedule.shift_code as keyof typeof SHIFT_CODES]
      if (shiftInfo) {
        // Handle D+OT and E+OT combinations
        if (schedule.overtime_hours && schedule.overtime_hours > 0 && 
            (schedule.shift_code === 'D' || schedule.shift_code === 'E')) {
          segmentStyle = {
            background: SHIFT_CODES.OT.bgColor,
            color: SHIFT_CODES.OT.textColor
          }
          displayText = `${schedule.shift_code}+OT`
          textColor = SHIFT_CODES.OT.textColor
        } else {
          segmentStyle = {
            background: shiftInfo.bgColor,
            color: shiftInfo.textColor
          }
          displayText = shiftInfo.letter
          textColor = shiftInfo.textColor
        }
      }
    }
    
    return (
      <div
        key={`${staff.id}-${date.toISOString().split('T')[0]}`}
        className={`
          relative flex-1 h-14 flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-105 hover:z-10
          ${
            index > 0 ? 'border-l border-white/30' : ''
          }
          ${
            isToday ? 'ring-2 ring-blue-400 ring-inset' : ''
          }
          ${
            !isCurrentMonth ? 'opacity-40' : ''
          }
          ${
            schedule 
              ? 'shadow-sm hover:shadow-md' 
              : 'bg-gray-50/30 hover:bg-gray-100/50'
          }
        `}
        style={{
          ...segmentStyle,
          minHeight: '56px',
          ...(isToday && { boxShadow: 'inset 0 0 0 2px rgb(96 165 250)' })
        }}
        onClick={() => onCellClick(staff.id, date)}
      >
        {/* Content */}
        <div className="flex flex-col items-center justify-center p-1">
          {schedule ? (
            <>
              <span 
                className="font-bold text-xs leading-tight"
                style={{ color: textColor }}
              >
                {displayText}
              </span>
              {schedule.overtime_hours && schedule.overtime_hours > 0 && schedule.shift_code === 'OT' && (
                <span className="text-[8px] mt-1 opacity-80" style={{ color: textColor }}>
                  {schedule.overtime_hours}h
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 font-medium opacity-0">
              {/* No date number - clean cell */}
            </span>
          )}
        </div>
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
        )}
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-sm"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {weeks.map((week, weekIndex) => {
        const isCollapsed = collapsedWeeks.has(week.id)
        
        return (
          <div key={week.id} className="glassmorphic-container">
            {/* Week Header */}
            <div 
              className={`
                sticky top-20 z-20 mb-6 py-5 px-8 rounded-2xl backdrop-blur-xl border shadow-lg 
                cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
                ${
                  weekIndex % 2 === 0 
                    ? 'bg-gradient-to-r from-white/90 to-blue-50/90 border-blue-200/40 hover:from-white hover:to-blue-50' 
                    : 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-indigo-200/40 hover:from-blue-50 hover:to-indigo-50'
                }
              `}
              onClick={() => toggleWeekCollapse(week.id)}
            >
              <div className="flex items-center justify-center">
                <Calendar className="h-6 w-6 mr-4 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900 text-center flex-1 tracking-wide">
                  {week.label}
                </h3>
                <div className="ml-4 p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors">
                  {isCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Week Content - Strips Layout */}
            {!isCollapsed && (
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl overflow-hidden">
                {/* Day Headers Strip */}
                <div className="bg-gradient-to-r from-gray-50/90 to-gray-100/90 border-b border-gray-200/50">
                  <div className="flex">
                    {/* Staff Column Header */}
                    <div className="w-48 p-4 font-bold text-gray-800 bg-gray-100/70 border-r border-gray-200/50 flex items-center">
                      <span className="text-sm tracking-wide">TEAM MEMBER</span>
                    </div>
                    
                    {/* Date Headers */}
                    <div className="flex-1 flex">
                      {week.dates.map((date, index) => (
                        <div 
                          key={index} 
                          className={`
                            flex-1 p-4 text-center font-semibold text-gray-700
                            ${index > 0 ? 'border-l border-gray-200/50' : ''}
                          `}
                        >
                          <div className="text-sm font-bold">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            {date.getDate()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staff Strips */}
                <div className="divide-y divide-gray-200/40">
                  {staffProfiles.map((staff, staffIndex) => (
                    <div 
                      key={staff.id} 
                      className={`
                        flex hover:bg-blue-50/40 transition-all duration-200 group
                        ${
                          staffIndex % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/30'
                        }
                      `}
                    >
                      {/* Staff Name Column */}
                      <div className="w-48 p-4 bg-gray-50/40 border-r border-gray-200/50 flex items-center group-hover:bg-blue-50/50 transition-colors">
                        <div className="w-full">
                          <div className="font-semibold text-gray-900 text-sm leading-tight">
                            {staff.full_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {staff.department || 'Staff'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Week Strip - Horizontal Timeline */}
                      <div className="flex-1 flex bg-white/30 rounded-r-lg overflow-hidden">
                        {week.dates.map((date, dateIndex) => 
                          renderShiftSegment(staff, date, dateIndex)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
      
      {/* Empty State */}
      {staffProfiles.length === 0 && (
        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
          <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Team Members</h3>
          <p className="text-gray-500 text-lg">No staff members found for the selected branch.</p>
        </div>
      )}
    </div>
  )
}

export { NewWeeklyRosterView }