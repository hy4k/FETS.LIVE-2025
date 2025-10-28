import React, { useMemo } from 'react'
import { Schedule, StaffProfile } from '../types/shared'

type Props = {
  staffProfiles: StaffProfile[]
  schedules: Schedule[]
  currentDate: Date
  onCellClick: (profileId: string, date: Date) => void
}

const shiftBadgeClass = (code: string) => {
  switch (code) {
    case 'D':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'E':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'HD':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'RD':
      return 'bg-gray-100 text-gray-700 border border-gray-200'
    case 'L':
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    case 'OT':
      return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
    case 'T':
      return 'bg-slate-50 text-slate-700 border border-slate-200'
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-200'
  }
}

const codeTitle = (code: string) => {
  switch (code) {
    case 'D': return 'D – Day'
    case 'E': return 'E – Evening'
    case 'HD': return 'HD – Half Day'
    case 'RD': return 'RD – Rest Day'
    case 'L': return 'L – Leave'
    case 'OT': return 'OT – Overtime'
    case 'T': return 'T – Training'
    default: return code
  }
}

export const MonthlyRosterTimeline: React.FC<Props> = ({ staffProfiles, schedules, currentDate, onCellClick }) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>()
    for (const s of schedules) {
      map.set(`${s.profile_id}-${s.date}`, s)
    }
    return map
  }, [schedules])

  const days: Date[] = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1)))
  }, [daysInMonth, month, year])

  const isToday = (d: Date) => new Date().toDateString() === d.toDateString()

  return (
    <div className="card-premium">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 border-b border-gray-200 text-left px-4 py-3 font-semibold text-gray-700 w-56">Staff</th>
              {days.map((d, idx) => (
                <th key={idx} className="border-b border-gray-200 px-2 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="text-gray-900 text-sm font-semibold">{d.getDate()}</div>
                  <div className="text-gray-500 text-[11px] uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffProfiles.map((staff, rIdx) => (
              <tr key={staff.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="sticky left-0 bg-inherit z-10 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 w-56">
                  <div>{staff.full_name}</div>
                  {staff.department && (
                    <div className="text-xs text-gray-500">{staff.department}</div>
                  )}
                </td>
                {days.map((d, cIdx) => {
                  const iso = d.toISOString().split('T')[0]
                  const key = `${staff.id}-${iso}`
                  const s = scheduleMap.get(key)
                  const withOT = s && s.overtime_hours && s.overtime_hours > 0 && (s.shift_code === 'D' || s.shift_code === 'E')
                  const code = withOT ? 'OT' : (s?.shift_code || '')
                  return (
                    <td
                      key={cIdx}
                      className={`border-t border-gray-100 px-2 py-2 text-center align-middle ${isToday(d) ? 'bg-blue-50' : ''}`}
                      onClick={() => onCellClick(staff.id, d)}
                    >
                      {s ? (
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${shiftBadgeClass(code)}`}
                          title={withOT ? `${s.shift_code}+OT` : codeTitle(code)}
                        >
                          {withOT ? `${s.shift_code}+OT` : (code || '')}
                        </span>
                      ) : (
                        <span className="inline-block w-6 h-6 rounded-md border border-dashed border-gray-200" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MonthlyRosterTimeline

