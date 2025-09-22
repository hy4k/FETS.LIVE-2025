import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';

interface Staff {
  id: string;
  full_name: string;
  role: string;
  department?: string;
  user_id?: string;
  base_centre?: 'calicut' | 'cochin' | null;
}

interface Schedule {
  id?: string;
  profile_id: string;
  date: string;
  shift_code: string;
  overtime_hours?: number;
  status: string;
}

interface WeekStripsRosterProps {
  staffProfiles: Staff[];
  schedules: Schedule[];
  currentDate: Date;
  viewMode: "week" | "2weeks" | "month";
  onNavigate: (direction: "prev" | "next") => void;
  onCellClick: (profileId: string, date: Date) => void;
  getCurrentUserStaffProfile: () => any;
}

// Apple-inspired shift colors matching main component
const SHIFT_COLORS = {
  'D': { bg: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', text: '#ffffff', letter: 'D' },
  'E': { bg: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)', text: '#ffffff', letter: 'E' },
  'HD': { bg: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)', text: '#ffffff', letter: 'HD' },
  'RD': { bg: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)', text: '#1D1D1F', letter: 'RD' },
  'L': { bg: 'linear-gradient(135deg, #FF3B30 0%, #FF6961 100%)', text: '#ffffff', letter: 'L' },
  'OT': { bg: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)', text: '#ffffff', letter: 'OT' },
  'T': { bg: 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)', text: '#ffffff', letter: 'T' }
}

const WeekStripsRoster: React.FC<WeekStripsRosterProps> = ({
  staffProfiles = [],
  schedules = [],
  currentDate,
  viewMode,
  onNavigate,
  onCellClick,
  getCurrentUserStaffProfile
}) => {
  // Generate date range and weeks for timeline view
  const { dateRange, weeks } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startDate: Date, endDate: Date;
    
    switch (viewMode) {
      case 'week': {
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      }
      case '2weeks': {
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13);
        break;
      }
      case 'month':
      default: {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
      }
    }
    
    // Generate all dates in range
    const dates = [];
    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      dates.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    // Group dates into weeks for timeline strips
    const weekGroups = [];
    if (viewMode === 'month') {
      for (let i = 0; i < dates.length; i += 7) {
        const weekDates = dates.slice(i, i + 7);
        if (weekDates.length > 0) {
          weekGroups.push({
            id: `week-${Math.floor(i / 7) + 1}`,
            label: `Week ${Math.floor(i / 7) + 1}: ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[weekDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            dates: weekDates
          });
        }
      }
    } else {
      weekGroups.push({
        id: 'view-range',
        label: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        dates
      });
    }
    
    return {
      dateRange: { startDate, endDate },
      weeks: weekGroups
    };
  }, [currentDate, viewMode]);

  // Get schedule for specific staff and date
  const getScheduleForDate = (staffId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => s.profile_id === staffId && s.date === dateStr);
  };

  // Format date string for display
  const formatDateForIST = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Render shift cell with Apple-style design
  const renderShiftCell = (staff: Staff, date: Date) => {
    const schedule = getScheduleForDate(staff.id, date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    let cellContent = null;
    let cellStyle = {};
    
    if (schedule) {
      const shiftInfo = SHIFT_COLORS[schedule.shift_code as keyof typeof SHIFT_COLORS];
      if (shiftInfo) {
        cellStyle = {
          background: shiftInfo.bg,
          color: shiftInfo.text
        };
        cellContent = (
          <div className="relative">
            <div className="font-bold text-xs">{shiftInfo.letter}</div>
            {schedule.overtime_hours && schedule.overtime_hours > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center font-bold">
                {schedule.overtime_hours}
              </div>
            )}
          </div>
        );
      }
    }
    
    return (
      <button
        key={`${staff.id}-${formatDateForIST(date)}`}
        onClick={() => onCellClick(staff.id, date)}
        className={`
          h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg
          flex items-center justify-center relative backdrop-blur-sm border
          ${isToday ? 'ring-2 ring-blue-500' : ''}
          ${schedule ? 'border-white/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}
          ${isWeekend ? 'opacity-75' : ''}
        `}
        style={cellStyle}
      >
        {cellContent || (
          <div className="text-gray-400 text-xs font-medium">
            {date.getDate()}
          </div>
        )}
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 bg-gray-50/50 min-h-screen">
      {/* Navigation Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 rounded-xl bg-white/60 hover:bg-white shadow-sm border border-gray-200/50 transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={() => onNavigate('next')}
              className="p-2 rounded-xl bg-white/60 hover:bg-white shadow-sm border border-gray-200/50 transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"></div>
              <span>Day</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400"></div>
              <span>Evening</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
              <span>Rest</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-400"></div>
              <span>Leave</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Strips Container */}
      <div className="max-w-7xl mx-auto p-6">
        {weeks.map((week, weekIndex) => (
          <div key={week.id} className="mb-8">
            {/* Week Header */}
            <div className={`sticky top-24 z-10 mb-4 py-3 px-4 rounded-xl backdrop-blur-md border shadow-sm ${
              weekIndex % 2 === 0 
                ? 'bg-white/80 border-gray-200/50' 
                : 'bg-blue-50/80 border-blue-200/50'
            }`}>
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {week.label}
              </h3>
            </div>

            {/* Staff Timeline Strips */}
            <div className="space-y-3">
              {staffProfiles.map((staff, staffIndex) => (
                <div
                  key={staff.id}
                  className={`relative p-4 rounded-2xl backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${
                    weekIndex % 2 === 0
                      ? 'bg-white/60 border-gray-200/50 hover:bg-white/80'
                      : 'bg-blue-50/60 border-blue-200/50 hover:bg-blue-50/80'
                  }`}
                >
                  {/* Staff Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                        {staff.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{staff.full_name}</div>
                        <div className="text-sm text-gray-600">{staff.base_centre ? staff.base_centre.charAt(0).toUpperCase() + staff.base_centre.slice(1) : 'Global'}</div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="text-xs text-gray-500">
                      {week.dates.filter(date => {
                        const schedule = getScheduleForDate(staff.id, date);
                        return schedule && schedule.shift_code !== 'RD' && schedule.shift_code !== 'L';
                      }).length} working days
                    </div>
                  </div>

                  {/* Timeline Strip */}
                  <div className="flex space-x-1 overflow-x-auto pb-2">
                    {week.dates.map((date, dateIndex) => (
                      <div key={dateIndex} className="flex flex-col items-center space-y-1 min-w-[48px]">
                        {/* Date label */}
                        <div className="text-xs text-gray-500 font-medium">
                          {date.toLocaleDateString('en-US', { day: '2-digit', weekday: 'short' }).split(' ')[1]}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {date.toLocaleDateString('en-US', { day: '2-digit', weekday: 'short' }).split(' ')[0]}
                        </div>
                        
                        {/* Shift cell */}
                        {renderShiftCell(staff, date)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {staffProfiles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Members</h3>
            <p className="text-gray-500">No staff members found for the selected branch.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { WeekStripsRoster };