import React from 'react';
import DayCell from './DayCell';

interface StaffRowProps {
  staff: any;
  weekStart: Date;
  weekEnd: Date;
  weekData: any;
}

const StaffRow: React.FC<StaffRowProps> = ({
  staff,
  weekStart,
  weekEnd,
  weekData
}) => {
  // Generate array of 7 days for this week
  const weekDays = [];
  const currentDate = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const handleStaffNameClick = () => {
    // TODO: Open bulk operations modal
    console.log('Opening bulk operations for:', staff.name);
  };

  return (
    <div className="staff-row">
      {/* Staff name */}
      <div 
        className="staff-name"
        onClick={handleStaffNameClick}
      >
        {staff.name}
      </div>
      
      {/* Day cells for this staff member */}
      <div className="day-cells">
        {weekDays.map(date => {
          const dateKey = date.toISOString().split('T')[0];
          const dayData = weekData[dateKey] || {};
          
          return (
            <DayCell
              key={dateKey}
              date={date}
              staff={staff}
              dayData={dayData}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StaffRow;