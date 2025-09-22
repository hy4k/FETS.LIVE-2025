import React from 'react';
import StaffRow from './StaffRow';

interface WeekStripProps {
  weekStart: Date;
  weekEnd: Date;
  staffList: any[];
  weekData: any;
}

const WeekStrip: React.FC<WeekStripProps> = ({
  weekStart,
  weekEnd,
  staffList,
  weekData
}) => {
  return (
    <div className="week-strip">
      {/* Week header */}
      <div className="week-header">
        <h3 className="week-title">
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
          {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </h3>
        {/* Day headers */}
        <div className="day-headers">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
      </div>
      
      {/* Staff rows for this week */}
      <div className="staff-rows">
        {staffList.map(staff => (
          <StaffRow
            key={staff.id}
            staff={staff}
            weekStart={weekStart}
            weekEnd={weekEnd}
            weekData={weekData[staff.id] || {}}
          />
        ))}
      </div>
    </div>
  );
};

export default WeekStrip;