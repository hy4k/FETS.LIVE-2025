import React, { useMemo } from 'react';
import WeekStrip from './WeekStrip';
import './WeekStripsRoster.css';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface WeekStripsRosterProps {
  currentMonth?: Date;
  staffData?: Staff[];
  scheduleData?: any;
}

const WeekStripsRoster: React.FC<WeekStripsRosterProps> = ({
  currentMonth = new Date(),
  staffData = [],
  scheduleData = {}
}) => {
  // Filter out super admins
  const filteredStaff = useMemo(() => {
    return staffData.filter(staff => 
      !['Mithun', 'Niyas'].includes(staff.name)
    );
  }, [staffData]);

  // Generate weeks for the current month
  const monthWeeks = useMemo(() => {
    const weeks = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the Monday of the week containing the first day
    const startOfFirstWeek = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
    startOfFirstWeek.setDate(firstDay.getDate() - daysToSubtract);
    
    let currentWeekStart = new Date(startOfFirstWeek);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        id: `week-${currentWeekStart.getTime()}`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }, [currentMonth]);

  // Organize schedule data by staff and week
  const organizedData = useMemo(() => {
    const organized: any = {};
    
    filteredStaff.forEach(staff => {
      organized[staff.id] = scheduleData[staff.id] || {};
    });
    
    return organized;
  }, [filteredStaff, scheduleData]);

  return (
    <div className="week-strips-container">
      {/* Header */}
      <div className="roster-header">
        <h2 className="roster-title">
          {currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })} - Staff Roster
        </h2>
        <div className="roster-controls">
          <button className="bulk-operations-btn">
            Bulk Operations
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="status-legend">
        <div className="legend-item">
          <div className="legend-color bg-green-500"></div>
          <span>Working</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-yellow-500"></div>
          <span>Off</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-red-500"></div>
          <span>Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-blue-500"></div>
          <span>Training</span>
        </div>
      </div>

      {/* Week Strips */}
      {monthWeeks.length > 0 ? (
        <div className="week-strips">
          {monthWeeks.map(week => (
            <WeekStrip
              key={week.id}
              weekStart={week.start}
              weekEnd={week.end}
              staffList={filteredStaff}
              weekData={organizedData}
            />
          ))}
        </div>
      ) : (
        <div className="week-strips-empty">
          <h3>No Data Available</h3>
          <p>Please select a month to view the roster.</p>
        </div>
      )}
    </div>
  );
};

export default WeekStripsRoster;