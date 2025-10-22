# 7-Day Calendar Widget Implementation

## Overview
A beautiful, responsive 7-day calendar widget has been added to the Command Centre page showing exam sessions for the next 7 days, displaying from the current date onwards.

## What's New

### Components Created
1. **SevenDayCalendarWidget.tsx** - The main calendar widget component
   - Location: `src/components/SevenDayCalendarWidget.tsx`
   - Displays calendar sessions for next 7 days
   - Shows exam details: client name, exam name, time, candidate count
   - Responsive grid layout with beautiful UI
   - Real-time data fetching from the `sessions` table

### Styling Added
1. **seven-day-calendar.css** - Comprehensive styling
   - Location: `src/styles/seven-day-calendar.css`
   - Beautiful card-based layout with 7-column grid
   - Smooth animations and transitions
   - Client color coding (PEARSON, VUE, ETS, PSI, PROMETRIC, OTHER)
   - Responsive design for all screen sizes
   - Summary statistics at the bottom
   - Interactive hover effects

### Integration Points
- **CommandCentre.tsx**: Component imported and placed above the roster schedule
- **main.tsx**: CSS file imported in the main entry point

## Features

### 7-Day Grid Display
- **Layout**: 7 individual cards representing each day (Today + next 6 days)
- **Day Header**: Shows day name and date number
  - Today is highlighted with a blue badge
  - Other days show abbreviated weekday names (Mon, Tue, Wed, etc.)
- **Sessions List**: Shows up to 3 sessions per day
  - Client name with color-coded border
  - Exam name
  - Start time
  - Candidate count
  - "More sessions" indicator if more than 3 sessions
- **Day Footer**:
  - Total session count for the day
  - Total candidate count (👥 emoji icon)

### Color Coding System
Each client type has a distinct color:
- **PEARSON**: Blue (#2563eb)
- **VUE**: Red (#dc2626)
- **ETS**: Green (#16a34a)
- **PSI**: Purple (#9333ea)
- **PROMETRIC**: Orange (#ea580c)
- **OTHER**: Gray (#6b7280)

### Summary Statistics
Below the 7-day grid, four key metrics are displayed:
1. **Total Sessions** - Sum of all sessions across 7 days
2. **Total Candidates** - Sum of all candidates across 7 days
3. **Days with Exams** - Count of days that have at least one session
4. **Avg per Day** - Average sessions per day (rounded up)

Each stat card has:
- A descriptive label
- Large, bold number display
- Unique background color gradient
- Hover effects for interactivity

### Responsiveness
The widget is fully responsive across all screen sizes:
- **Desktop (1440px+)**: Full 7-column grid with optimal spacing
- **Tablet (1024px - 1440px)**: Adjusted font sizes and spacing
- **Mobile (768px - 1024px)**: Reduced padding and font sizes
- **Small Mobile (640px - 768px)**: Further optimized layout
- **Extra Small (< 640px)**: Single-column summary grid

### Interactive Features
- **Hover Effects**: Cards lift up on hover with shadow enhancement
- **Smooth Animations**: Session items fade in with slide animation
- **Today Highlighting**: Current day has special blue gradient background
- **Click Navigation**: Clicking any card or "View Full" button navigates to full calendar
- **Scrollable Sessions**: Each day's session list is independently scrollable
- **Custom Scrollbar**: Styled scrollbar with better aesthetics

## Data Flow

### Data Fetching
```typescript
// Fetches from 'sessions' table
const sessions = await supabase
  .from('sessions')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDateStr)
  .order('date', { ascending: true })
  .order('start_time', { ascending: true })

// Branch filtering applied if not global view
if (activeBranch !== 'global') {
  query = query.eq('branch_location', activeBranch)
}
```

### Caching Strategy
- React Query caching: `staleTime: 60000` (1 minute)
- Auto-refetch when query key changes
- Query key includes `activeBranch` for branch-specific filtering

## Implementation Details

### File Structure
```
src/
├── components/
│   ├── SevenDayCalendarWidget.tsx (new)
│   └── CommandCentre.tsx (updated)
├── styles/
│   └── seven-day-calendar.css (new)
└── main.tsx (updated)
```

### Integration in CommandCentre
The widget is placed right after the ExamScheduleWidget:
```tsx
{/* FETS Calendar Widget */}
<ExamScheduleWidget onNavigate={onNavigate} />

{/* 7 Days Calendar Widget */}
<SevenDayCalendarWidget onNavigate={onNavigate} />

{/* Main Dashboard Grid - Cards Grid */}
```

## UI/UX Highlights

### Beautiful Design Elements
1. **Glassmorphism**: Semi-transparent backgrounds with blur effects
2. **Gradient Backgrounds**: Subtle color gradients for depth
3. **Typography**: Uses 'Playfair Display' serif font for headings
4. **Spacing**: Consistent padding and margins throughout
5. **Color Scheme**: Modern, professional color palette
6. **Shadows**: Subtle elevation shadows for depth perception
7. **Borders**: Soft, subtle borders with proper opacity

### Accessibility
- High contrast text (WCAG AA compliant)
- Semantic HTML structure
- Proper font sizing for readability
- Clear visual hierarchy
- Mobile-friendly touch targets

### Performance Optimizations
- CSS-based animations (GPU accelerated)
- Efficient React Query caching
- Lazy loading of sessions data
- Optimized scrollbar styling
- Minimal DOM manipulation

## Customization Guide

### Changing Colors
Edit the CLIENT_COLORS object in SevenDayCalendarWidget.tsx:
```tsx
const CLIENT_COLORS: { [key: string]: { border: string; bg: string; text: string } } = {
  PEARSON: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  // ... other clients
}
```

### Modifying Layout
The grid layout can be changed in seven-day-calendar.css:
```css
.seven-day-grid {
  grid-template-columns: repeat(7, 1fr);  /* Change 7 to show different columns */
  gap: 12px;  /* Adjust spacing between cards */
}
```

### Changing Data Fetch Period
In SevenDayCalendarWidget.tsx, modify the loop:
```tsx
for (let i = 0; i < 7; i++) {  // Change 7 to show different number of days
  const date = new Date(today)
  date.setDate(today.getDate() + i)
  // ... rest of loop
}
```

## Testing Checklist
- [x] Component renders without errors
- [x] Calendar displays 7 days from today
- [x] Sessions load from database
- [x] Branch filtering works correctly
- [x] Color coding matches client types
- [x] Responsive design works on all screen sizes
- [x] Summary statistics calculate correctly
- [x] Navigation to full calendar works
- [x] Loading and error states display properly
- [x] Scrollbar styling appears correctly

## Browser Compatibility
- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ✓ Full support

## Notes
- The widget automatically updates based on the active branch selection
- Sessions are sorted by date and start time
- The "Today" indicator helps users quickly identify current day
- Multiple sessions per day are handled with scrolling and "more" indicators
- All times are displayed in the user's local timezone (via formatDateForIST utility)

## Future Enhancements
- Add drag-and-drop to reschedule sessions
- Add week view toggle
- Add filtering by client type
- Add export to calendar functionality
- Add session creation from widget
- Add real-time updates via Supabase subscriptions

---

**Created**: October 2024
**Component Version**: 1.0.0
**Last Updated**: October 22, 2024
