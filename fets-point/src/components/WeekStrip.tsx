import React from 'react';
import StaffRow from './StaffRow';

interface WeekStripProps {
  weekStart: Date;
  weekEnd: Date;
  staffList: any[];
  weekData: any;
  onCellClick: (profileId: string, date: Date) => void;
  getCurrentUserStaffProfile: () => any;
  currentDate: Date;
}

const WeekStrip: React.FC<WeekStripProps> = ({
  weekStart,
  weekEnd,
  staffList,
  weekData,
  onCellClick,
  getCurrentUserStaffProfile,
  currentDate
}) => {
  // Generate day labels for this week
  const getWeekDays = () => {
    const days = [];
    const current = new Date(weekStart);
    
    while (current <= weekEnd) {
      // Only include days that are in the current month for month view
      if (current.getMonth() === currentDate.getMonth()) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  
  if (weekDays.length === 0) {
    return null; // Don't render weeks with no days in current month
  }

  return (
    <div className="week-strip">
      {/* Week header */}
      <div className="week-header">
        <h3 className="week-title">
          {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
          {weekDays[weekDays.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </h3>
        {/* Day headers */}
        <div className="day-headers">
          <div className="staff-header">Staff</div>
          {weekDays.map(day => (
            <div key={day.getTime()} className="day-header">
              <div className="day-name">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="day-number">{day.getDate()}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Staff rows for this week */}
      <div className="staff-rows">
        {staffList.map(staff => (
          <StaffRow
            key={staff.id}
            staff={staff}
            weekDays={weekDays}
            weekData={weekData[staff.id] || {}}
            onCellClick={onCellClick}
            getCurrentUserStaffProfile={getCurrentUserStaffProfile}
          />
        ))}
      </div>
    </div>
  );
};

export default WeekStrip;