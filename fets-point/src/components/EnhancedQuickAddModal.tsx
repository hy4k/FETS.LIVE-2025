import React, { useState, useEffect } from 'react'
import { X, RefreshCw, Users, Building, Globe, Calendar, Eye, RotateCcw, Check, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { formatDateForIST } from '../utils/dateUtils'
import { SHIFT_CODES } from '../types/shared'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffProfiles: any[]
  currentDate: Date
}

interface PatternOption {
  id: string
  label: string
  pattern: string[]
  description: string
}

const PATTERNS: PatternOption[] = [
  {
    id: '6D+1RD',
    label: '6 Day + 1 Rest',
    pattern: ['D', 'D', 'D', 'D', 'D', 'D', 'RD'],
    description: '6 consecutive working days followed by 1 rest day'
  },
  {
    id: '3D+2E+2RD',
    label: '3 Day + 2 Evening + 2 Rest',
    pattern: ['D', 'D', 'D', 'E', 'E', 'RD', 'RD'],
    description: '3 day shifts, 2 evening shifts, 2 rest days'
  },
  {
    id: '5D+2RD',
    label: '5 Day + 2 Rest',
    pattern: ['D', 'D', 'D', 'D', 'D', 'RD', 'RD'],
    description: '5 working days followed by 2 rest days'
  },
  {
    id: 'Alternate D/E',
    label: 'Alternate Day/Evening',
    pattern: ['D', 'E', 'D', 'E', 'D', 'E', 'RD'],
    description: 'Alternating day and evening shifts with rest'
  },
  {
    id: 'All Day',
    label: 'All Day Shifts',
    pattern: ['D'],
    description: 'All day shifts for the period'
  },
  {
    id: 'All Evening',
    label: 'All Evening Shifts', 
    pattern: ['E'],
    description: 'All evening shifts for the period'
  }
]

type QuickAddMode = 'staff' | 'centre' | 'global' | 'week'

export const EnhancedQuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffProfiles,
  currentDate
}) => {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()
  const [mode, setMode] = useState<QuickAddMode>('staff')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [selectedPattern, setSelectedPattern] = useState('')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('staff')
      setSelectedStaff('')
      setSelectedPattern('')
      setSelectedWeek(1)
      setPreview([])
      setShowPreview(false)
      setNotification(null)
    }
  }, [isOpen])

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
  }

  // Generate weeks for current month
  const weeks = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const weeksList = []
    let currentWeekStart = new Date(firstDay)
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay())
    
    let weekNumber = 1
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(currentWeekStart.getDate() + 6)
      
      weeksList.push({
        number: weekNumber,
        label: `Week ${weekNumber}`,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd)
      })
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      weekNumber++
    }
    
    return weeksList
  }, [currentDate])

  // Get filtered staff based on mode and current branch
  const getTargetStaff = () => {
    switch (mode) {
      case 'staff':
        return selectedStaff ? staffProfiles.filter(s => s.id === selectedStaff) : []
      case 'centre':
        if (activeBranch === 'calicut') {
          return staffProfiles.filter(s => s.base_centre === 'calicut')
        } else if (activeBranch === 'cochin') {
          return staffProfiles.filter(s => s.base_centre === 'cochin')
        } else {
          return staffProfiles // Global mode shows all in current view
        }
      case 'global':
        return staffProfiles // All staff across all centers
      case 'week':
        return staffProfiles // All staff for selected week
      default:
        return []
    }
  }

  // Generate target dates based on mode
  const getTargetDates = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    if (mode === 'week') {
      const selectedWeekData = weeks[selectedWeek - 1]
      if (!selectedWeekData) return []
      
      const dates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedWeekData.startDate)
        date.setDate(selectedWeekData.startDate.getDate() + i)
        if (date.getMonth() === month) {
          dates.push(date)
        }
      }
      return dates
    } else {
      // Full month
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const dates = []
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day))
      }
      return dates
    }
  }

  // Generate preview
  const generatePreview = () => {
    if (!selectedPattern) {
      showNotification('warning', 'Please select a pattern to preview')
      return
    }
    
    const pattern = PATTERNS.find(p => p.id === selectedPattern)
    if (!pattern) {
      showNotification('error', 'Invalid pattern selected')
      return
    }
    
    const targetStaff = getTargetStaff()
    const targetDates = getTargetDates()
    
    if (targetStaff.length === 0) {
      showNotification('warning', 'No staff members found for the selected mode')
      return
    }
    
    if (targetDates.length === 0) {
      showNotification('warning', 'No target dates found')
      return
    }
    
    const previewData = []
    
    for (const staff of targetStaff) {
      for (let i = 0; i < targetDates.length; i++) {
        const date = targetDates[i]
        const patternIndex = i % pattern.pattern.length
        const shiftCode = pattern.pattern[patternIndex]
        
        previewData.push({
          staffName: staff.full_name,
          staffId: staff.id,
          date: date.toISOString().split('T')[0],
          dateDisplay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          shiftCode,
          shiftName: SHIFT_CODES[shiftCode as keyof typeof SHIFT_CODES]?.name || shiftCode
        })
      }
    }
    
    setPreview(previewData)
    setShowPreview(true)
    showNotification('success', `Preview generated: ${previewData.length} shifts for ${targetStaff.length} staff members`)
  }

  // Generate and save roster
  const generateRoster = async () => {
    if (!selectedPattern) {
      showNotification('error', 'Please select a pattern')
      return
    }
    
    if (mode === 'staff' && !selectedStaff) {
      showNotification('error', 'Please select a staff member')
      return
    }
    
    setLoading(true)
    
    try {
      const pattern = PATTERNS.find(p => p.id === selectedPattern)
      if (!pattern) throw new Error('Invalid pattern selected')
      
      const targetStaff = getTargetStaff()
      const targetDates = getTargetDates()
      
      if (targetStaff.length === 0) {
        throw new Error('No target staff found')
      }
      
      if (targetDates.length === 0) {
        throw new Error('No target dates found')
      }
      
      const newSchedules = []
      
      for (const staff of targetStaff) {
        for (let i = 0; i < targetDates.length; i++) {
          const date = targetDates[i]
          const patternIndex = i % pattern.pattern.length
          const shiftCode = pattern.pattern[patternIndex]
          
          newSchedules.push({
            profile_id: staff.id,
            date: formatDateForIST(date),
            shift_code: shiftCode,
            overtime_hours: 0,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
      
      // Clear existing schedules for target dates and staff
      const startDate = targetDates[0]
      const endDate = targetDates[targetDates.length - 1]
      
      const { error: deleteError } = await supabase
        .from('roster_schedules')
        .delete()
        .gte('date', formatDateForIST(startDate))
        .lte('date', formatDateForIST(endDate))
        .in('profile_id', targetStaff.map(s => s.id))
      
      if (deleteError) {
        console.warn('Warning: Could not clear existing schedules:', deleteError)
      }
      
      // Insert new schedules
      const { error } = await supabase
        .from('roster_schedules')
        .insert(newSchedules)
      
      if (error) throw error
      
      // Log audit trail
      await supabase
        .from('roster_audit_log')
        .insert({
          action: 'quick_add_generate',
          details: `Generated roster using ${mode} mode with ${selectedPattern} pattern for ${targetStaff.length} staff`,
          performed_by: profile?.id || user?.id,
          affected_date: formatDateForIST(new Date())
        })
      
      showNotification('success', `Roster generated successfully! ${newSchedules.length} shifts created.`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error generating roster:', error)
      showNotification('error', `Failed to generate roster: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Clear existing schedules for preview
  const clearExistingSchedules = async () => {
    if (!window.confirm('This will clear all existing schedules for the selected period. Are you sure?')) {
      return
    }
    
    setLoading(true)
    
    try {
      const targetStaff = getTargetStaff()
      const targetDates = getTargetDates()
      
      if (targetStaff.length === 0 || targetDates.length === 0) {
        throw new Error('No target staff or dates found')
      }
      
      const startDate = targetDates[0]
      const endDate = targetDates[targetDates.length - 1]
      
      const { error } = await supabase
        .from('roster_schedules')
        .delete()
        .gte('date', formatDateForIST(startDate))
        .lte('date', formatDateForIST(endDate))
        .in('profile_id', targetStaff.map(s => s.id))
      
      if (error) throw error
      
      showNotification('success', 'Existing schedules cleared successfully')
      onSuccess()
    } catch (error) {
      console.error('Error clearing schedules:', error)
      showNotification('error', `Failed to clear schedules: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl bg-black/30"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Notification */}
        {notification && (
          <div className={`absolute top-4 right-4 z-10 p-4 rounded-xl backdrop-blur-md border ${
            notification.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
            'bg-yellow-50/90 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <Check className="h-5 w-5" />}
              {notification.type === 'error' && <X className="h-5 w-5" />}
              {notification.type === 'warning' && <Clock className="h-5 w-5" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <RefreshCw className="h-7 w-7 mr-3 text-blue-500" />
                Quick Add Roster Generator
              </h3>
              <p className="text-gray-600 mt-2 font-medium">Generate roster patterns efficiently across staff, centres, or time periods</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100/50 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Mode Selection */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-4 tracking-wide">Select Application Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'staff', icon: Users, label: 'Staff-wise', desc: 'Apply to selected staff member', color: 'blue' },
                { id: 'centre', icon: Building, label: 'Centre-wise', desc: 'Apply to all staff in current center', color: 'green' },
                { id: 'global', icon: Globe, label: 'Global-wise', desc: 'Apply to all staff across centers', color: 'purple' },
                { id: 'week', icon: Calendar, label: 'Week-wise', desc: 'Apply to specific week only', color: 'orange' }
              ].map(({ id, icon: Icon, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setMode(id as QuickAddMode)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    mode === id
                      ? `border-${color}-500 bg-${color}-50 text-${color}-900 shadow-lg scale-105`
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-3 ${
                    mode === id ? `text-${color}-600` : 'text-gray-500'
                  }`} />
                  <div className="font-bold text-base mb-1">{label}</div>
                  <div className="text-sm opacity-75 leading-tight">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Staff Selection (for staff mode) */}
          {mode === 'staff' && (
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-3 tracking-wide">Select Staff Member</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg font-medium transition-all duration-200"
              >
                <option value="">Choose a staff member...</option>
                {staffProfiles.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} - {staff.base_centre} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Week Selection (for week mode) */}
          {mode === 'week' && (
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-3 tracking-wide">Select Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none text-lg font-medium transition-all duration-200"
              >
                {weeks.map(week => (
                  <option key={week.number} value={week.number}>
                    {week.label} ({week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pattern Selection */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-4 tracking-wide">Select Roster Pattern</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PATTERNS.map(pattern => (
                <button
                  key={pattern.id}
                  onClick={() => setSelectedPattern(pattern.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    selectedPattern === pattern.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-lg scale-105'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="font-bold text-base mb-2">{pattern.label}</div>
                  <div className="text-sm opacity-75 mb-3 leading-tight">{pattern.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.pattern.map((shift, idx) => {
                      const shiftInfo = SHIFT_CODES[shift as keyof typeof SHIFT_CODES]
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            background: shiftInfo?.bgColor || '#f3f4f6',
                            color: shiftInfo?.textColor || '#374151'
                          }}
                        >
                          {shift}
                        </span>
                      )
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Summary */}
          <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 p-6 rounded-2xl border border-gray-200/50">
            <h4 className="font-bold text-gray-800 mb-3 text-lg">Generation Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/60 p-4 rounded-xl">
                <div className="font-semibold text-gray-600 uppercase tracking-wide text-xs mb-1">Target Staff</div>
                <div className="font-bold text-lg text-gray-900">{getTargetStaff().length} members</div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl">
                <div className="font-semibold text-gray-600 uppercase tracking-wide text-xs mb-1">Target Dates</div>
                <div className="font-bold text-lg text-gray-900">{getTargetDates().length} days</div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl">
                <div className="font-semibold text-gray-600 uppercase tracking-wide text-xs mb-1">Total Shifts</div>
                <div className="font-bold text-lg text-gray-900">{getTargetStaff().length * getTargetDates().length}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={generatePreview}
              disabled={!selectedPattern || loading}
              className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              <Eye className="h-5 w-5" />
              <span>Preview Pattern</span>
            </button>
            
            <button
              onClick={generateRoster}
              disabled={!selectedPattern || loading || (mode === 'staff' && !selectedStaff)}
              className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              <span>{loading ? 'Generating...' : 'Generate Roster'}</span>
            </button>
            
            <button
              onClick={clearExistingSchedules}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Clear Existing</span>
            </button>
          </div>

          {/* Preview Section */}
          {showPreview && preview.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-2xl border border-indigo-200/50">
              <h4 className="font-bold text-indigo-800 mb-4 text-lg flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Pattern Preview ({preview.length} shifts)
              </h4>
              <div className="max-h-96 overflow-y-auto bg-white/60 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {preview.slice(0, 50).map((item, idx) => (
                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-gray-200/50 hover:shadow-sm transition-shadow">
                      <div className="font-semibold text-gray-900 text-sm">{item.staffName}</div>
                      <div className="text-gray-600 text-xs mt-1">{item.dateDisplay}</div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span 
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            background: SHIFT_CODES[item.shiftCode as keyof typeof SHIFT_CODES]?.bgColor || '#f3f4f6',
                            color: SHIFT_CODES[item.shiftCode as keyof typeof SHIFT_CODES]?.textColor || '#374151'
                          }}
                        >
                          {item.shiftCode}
                        </span>
                        <span className="text-xs text-gray-500">{item.shiftName}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {preview.length > 50 && (
                  <div className="text-center mt-4 text-gray-600 text-sm">
                    Showing first 50 shifts of {preview.length} total
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}