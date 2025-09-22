import React, { useState } from 'react';

interface DayCellProps {
  date: Date;
  staff: any;
  dayData: any;
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  staff,
  dayData
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine status color based on dayData
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'working':
        return 'bg-green-500';
      case 'off':
        return 'bg-yellow-500';
      case 'leave':
        return 'bg-red-500';
      case 'training':
        return 'bg-blue-500';
      default:
        return 'bg-gray-200';
    }
  };

  // Check if it's a weekend for background shading
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  const handleCellClick = () => {
    // TODO: Open edit modal for this specific day
    console.log('Editing day:', date.toDateString(), 'for', staff.name);
  };

  return (
    <div 
      className={`day-cell ${
        isWeekend ? 'weekend' : ''
      } ${getStatusColor(dayData.status)}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCellClick}
    >
      {/* Status indicator (color block only, no text) */}
      <div className="status-block"></div>
      
      {/* Warning dot for overlapping leaves */}
      {dayData.hasWarning && (
        <div className="warning-dot"></div>
      )}
      
      {/* Hover tooltip */}
      {isHovered && (
        <div className="hover-tooltip">
          <div className="tooltip-date">
            {date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div className="tooltip-status">
            Status: {dayData.status || 'Not set'}
          </div>
          <div className="tooltip-hours">
            Hours: {dayData.hours || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayCell;