import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, CheckCircle, XCircle, AlertCircle, Search, ToggleLeft, ToggleRight, NotebookPen, Copy, Shuffle, X, MapPin, Calendar, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDateForIST } from '../utils/dateUtils'


interface RosterSchedule {
  id?: string
  profile_id: string
  date: string
  shift_code: string
  overtime_hours?: number
  status: string
  created_at?: string
  updated_at?: string
}

interface StaffProfile {
  id: string
  user_id?: string
  full_name: string
  role: string
  email: string
  department?: string
  position?: string
}

interface LeaveRequest {
  id?: string
  user_id: string
  request_type: string
  requested_date: string
  swap_with_user_id?: string
  swap_date?: string
  reason?: string
  status: string
  approved_by?: string
  approved_at?: string
  created_at?: string
  updated_at?: string
}



// Terracotta/Mint Green Theme Shift Codes
const SHIFT_CODES = {
  'D': { 
    name: 'Day Shift (8AM-5PM)', 
    color: 'bg-gradient-to-r from-yellow-300 to-yellow-400', 
    bgColor: '#F4D07A',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-300'
  },
  'HD': { 
    name: 'Half Day', 
    color: 'bg-gradient-to-r from-orange-400 to-orange-500', 
    bgColor: '#E8A55E',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-300'
  },
  'RD': { 
    name: 'Rest Day', 
    color: 'bg-gradient-to-r from-emerald-400 to-emerald-500', 
    bgColor: '#8FB6A0',
    textColor: 'text-emerald-900',
    borderColor: 'border-emerald-300'
  },
  'TOIL': { 
    name: 'Time Off In Lieu', 
    color: 'bg-gradient-to-r from-stone-400 to-stone-500', 
    bgColor: '#C2B8A3',
    textColor: 'text-stone-900',
    borderColor: 'border-stone-300'
  },
  'L': { 
    name: 'Leave', 
    color: 'bg-gradient-to-r from-red-400 to-red-500', 
    bgColor: '#C16A6A',
    textColor: 'text-red-900',
    borderColor: 'border-red-300'
  },
  'OT': { 
    name: 'Overtime', 
    color: 'bg-gradient-to-r from-purple-400 to-purple-500', 
    bgColor: '#e1c9f8',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-300'
  },
  'Training': { 
    name: 'Training', 
    color: 'bg-gradient-to-r from-blue-400 to-blue-500', 
    bgColor: '#7AA6B8',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-300'
  }
}

type ShiftCode = keyof typeof SHIFT_CODES



export function FetsRoster() {
  const { user } = useAuth()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<RosterSchedule[]>([])
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Enhanced state for new functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [showOnlyMyShifts, setShowOnlyMyShifts] = useState(false)

  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'edit' | 'note' | 'bulk'>('edit')
  const [selectedCell, setSelectedCell] = useState<{ profileId: string; date: string } | null>(null)
  const [cellNote, setCellNote] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  
  // Form states
  const [requestForm, setRequestForm] = useState({
    type: 'leave',
    date: '',
    reason: '',
    swapPartner: '',
    swapDate: ''
  })
  

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Permission checks - use staff profile role, not auth profile role
  const getCurrentUserStaffProfile = () => {
    if (!user) return null
    return staffProfiles.find(p => p.user_id === user.id)
  }
  
  const currentStaffProfile = getCurrentUserStaffProfile()
  const isSuperAdmin = currentStaffProfile?.role === 'super_admin'
  const isAdmin = currentStaffProfile?.role === 'admin' || isSuperAdmin

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, currentDate])

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load staff profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, role, email, department')
        .order('full_name')
      
      if (profilesError) throw profilesError
      
      const mappedProfiles: StaffProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        role: profile.role,
        email: profile.email || '',
        department: profile.department
      }))
      
      setStaffProfiles(mappedProfiles)

      // Load schedules for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('roster_schedules')
        .select('id, profile_id, date, shift_code, overtime_hours, status, created_at, updated_at')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date')
      
      if (scheduleError) throw scheduleError
      setSchedules(scheduleData || [])

      // Load current version for display purposes
      const { data: versionData, error: versionError } = await supabase
        .from('roster_versions')
        .select('*')
        .eq('month', currentDate.getMonth() + 1)
        .eq('year', currentDate.getFullYear())
        .eq('is_active', true)
        .maybeSingle()
      
      if (versionError && versionError.code !== 'PGRST116') throw versionError
      console.log('Current version:', versionData)

      // Load requests
      if (isSuperAdmin) {
        const { data: requestData, error: requestError } = await supabase
          .from('leave_requests')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (requestError) throw requestError
        setRequests(requestData || [])
      } else if (user) {
        const userStaffProfile = mappedProfiles.find(p => p.user_id === user.id)
        if (userStaffProfile) {
          const { data: requestData, error: requestError } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_id', userStaffProfile.id)
            .order('created_at', { ascending: false })
          
          if (requestError) throw requestError
          setRequests(requestData || [])
        }
      }
    } catch (error) {
      console.error('Error loading roster data:', error)
      showNotification('error', `Database error: ${error instanceof Error ? error.message : 'Connection failed'}`)
      setStaffProfiles([])
      setSchedules([])
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getScheduleForDate = (profileId: string, date: Date) => {
    const dateStr = formatDateForIST(date)
    return schedules.find(s => s.profile_id === profileId && s.date === dateStr)
  }

  const getStaffName = (profileId: string): string => {
    return staffProfiles.find(s => s.id === profileId)?.full_name || 'Unknown'
  }

  const handleCellClick = (profileId: string, date: Date) => {
    const dateStr = formatDateForIST(date)
    setSelectedCell({ profileId, date: dateStr })
    setDrawerMode('edit')
    setIsRightDrawerOpen(true)
  }

  const handleStaffNameClick = (profileId: string) => {
    setSelectedCell({ profileId, date: '' })
    setDrawerMode('bulk')
    setIsRightDrawerOpen(true)
  }

  const saveShift = async (shiftCode: ShiftCode, overtimeHours = 0) => {
    if (!selectedCell || !user || !isAdmin) {
      showNotification('warning', 'Unable to save shift - permission or context issue')
      return
    }

    try {
      const scheduleData = {
        profile_id: selectedCell.profileId,
        date: selectedCell.date,
        shift_code: shiftCode,
        overtime_hours: overtimeHours,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }

      const existing = schedules.find(s => 
        s.profile_id === selectedCell.profileId && s.date === selectedCell.date
      )

      if (existing) {
        const { error } = await supabase
          .from('roster_schedules')
          .update(scheduleData)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('roster_schedules')
          .insert([{ ...scheduleData, created_at: new Date().toISOString() }])
        
        if (error) throw error
      }

      setIsRightDrawerOpen(false)
      setSelectedCell(null)
      await loadData()
      showNotification('success', 'Shift updated successfully!')
    } catch (error) {
      console.error('Error saving shift:', error)
      showNotification('error', `Failed to save shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  const days = getDaysInMonth()
  const filteredStaff = staffProfiles.filter(staff => {
    if (searchQuery) {
      return staff.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    if (showOnlyMyShifts && currentStaffProfile) {
      return staff.id === currentStaffProfile.id
    }
    if (locationFilter !== 'all') {
      return staff.department === locationFilter
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-screen" style={{ backgroundColor: '#EEE4D2' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#C8703E' }}></div>
          <p style={{ color: '#6A684F' }}>Loading roster data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen relative" style={{ backgroundColor: '#EEE4D2' }}>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-md ${
          notification.type === 'success' ? 'bg-green-100/90 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-100/90 text-red-800 border border-red-200' :
          'bg-yellow-100/90 text-yellow-800 border border-yellow-200'
        } transition-all duration-300`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5" />}
            {notification.type === 'warning' && <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* 3D Terracotta Cube Header */}
      <div className="sticky top-0 z-30 p-6" style={{ backgroundColor: '#EEE4D2' }}>
        <div className="flex items-center justify-center mb-6">
          <div className="relative group">
            {/* 3D Cube Effect */}
            <div 
              className="w-24 h-24 rounded-2xl shadow-2xl transform transition-all duration-300 group-hover:scale-105 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C8703E 0%, #D4824A 50%, #C8703E 100%)',
                boxShadow: `
                  0 0 0 1px rgba(200, 112, 62, 0.3),
                  0 8px 25px rgba(200, 112, 62, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `
              }}
            >
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: '#7FC6A4' }}>FETS</div>
                <div className="text-sm font-semibold" style={{ color: '#7FC6A4' }}>ROSTER</div>
              </div>
            </div>
            {/* 3D Side Effects */}
            <div 
              className="absolute -bottom-1 -right-1 w-24 h-24 rounded-2xl -z-10"
              style={{
                background: 'linear-gradient(135deg, #A85A2E 0%, #B8643A 100%)',
                filter: 'blur(1px)'
              }}
            ></div>
          </div>
        </div>

        {/* Sticky Navigation Bar */}
        <div className="rounded-xl shadow-lg p-4" style={{ backgroundColor: '#DDB38C', border: '2px solid rgba(200, 112, 62, 0.2)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:shadow-md transform hover:scale-105 transition-all duration-200"
                style={{ backgroundColor: '#C8703E', color: 'white' }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="px-4 py-2 rounded-lg font-bold text-lg" style={{ backgroundColor: '#C8703E', color: 'white' }}>
                {monthYear}
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:shadow-md transform hover:scale-105 transition-all duration-200"
                style={{ backgroundColor: '#C8703E', color: 'white' }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center space-x-3">
              {/* Location Filter */}
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 appearance-none pr-8"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    borderColor: '#C8703E', 
                    color: '#6A684F'
                  }}
                >
                  <option value="all">All Locations</option>
                  <option value="main">Main Office</option>
                  <option value="branch">Branch Office</option>
                  <option value="remote">Remote</option>
                </select>
                <MapPin className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#6A684F' }} />
              </div>

              {/* Show Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: '#6A684F' }}>Show:</span>
                <button
                  onClick={() => setShowOnlyMyShifts(!showOnlyMyShifts)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
                  style={{ 
                    backgroundColor: showOnlyMyShifts ? '#7FC6A4' : '#EEE4D2',
                    color: showOnlyMyShifts ? 'white' : '#6A684F'
                  }}
                >
                  {showOnlyMyShifts ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  <span className="text-sm">{showOnlyMyShifts ? 'My shifts' : 'All'}</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    borderColor: '#C8703E', 
                    color: '#6A684F'
                  }}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#6A684F' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#DDB38C' }}>
          <div className="text-center mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#6A684F' }}>Apply</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setRequestForm({ ...requestForm, type: 'leave' })
                setShowRequestModal(true)
              }}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: '#C8703E' }}
            >
              Leave
            </button>
            <button
              onClick={() => {
                setRequestForm({ ...requestForm, type: 'shift_swap' })
                setShowRequestModal(true)
              }}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: '#C8703E' }}
            >
              Shift Swap
            </button>
            <button
              onClick={() => {
                setRequestForm({ ...requestForm, type: 'toil' })
                setShowRequestModal(true)
              }}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: '#7FC6A4' }}
            >
              TOIL
            </button>
            <button
              onClick={() => {
                setRequestForm({ ...requestForm, type: 'overtime' })
                setShowRequestModal(true)
              }}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: '#7FC6A4' }}
            >
              OT
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized Grid System */}
      <div className="flex-1 relative" ref={containerRef}>
        <div className="sticky-grid-container" style={{ height: 'calc(100vh - 320px)' }}>
          {/* Header Row - Days */}
          <div className="sticky top-0 z-20 flex" style={{ backgroundColor: '#DDB38C' }}>
            {/* Staff Names Column Header */}
            <div className="w-48 p-3 border-r-2 font-semibold" style={{ backgroundColor: '#DDB38C', borderColor: '#C8703E', color: '#6A684F' }}>
              Staff Names
            </div>
            {/* Days Header */}
            <div className="flex-1 flex">
              {days.map((day) => (
                <div
                  key={day.getDate()}
                  className="flex-1 min-w-[60px] p-3 border-r border-gray-300 text-center font-semibold"
                  style={{ color: '#6A684F' }}
                >
                  <div className="text-sm">{day.getDate()}</div>
                  <div className="text-xs opacity-75">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Rows */}
          <div className="overflow-auto" style={{ height: 'calc(100% - 80px)' }}>
            {filteredStaff.map((staff) => {
              const isMyRow = currentStaffProfile?.id === staff.id
              return (
                <div key={staff.id} className="flex border-b" style={{ backgroundColor: isMyRow ? '#F0E6D7' : '#EEE4D2' }}>
                  {/* Sticky Staff Name */}
                  <div 
                    className="sticky left-0 w-48 p-3 border-r-2 cursor-pointer hover:shadow-md transition-all duration-200 z-10"
                    style={{ 
                      backgroundColor: isMyRow ? '#F0E6D7' : '#EEE4D2', 
                      borderColor: '#C8703E'
                    }}
                    onClick={() => handleStaffNameClick(staff.id)}
                  >
                    <div className="font-medium" style={{ color: '#6A684F' }}>{staff.full_name}</div>
                    <div className="text-xs opacity-75" style={{ color: '#6A684F' }}>{staff.department}</div>
                  </div>
                  
                  {/* Schedule Cells */}
                  <div className="flex-1 flex">
                    {days.map((day) => {
                      const schedule = getScheduleForDate(staff.id, day)
                      const shiftInfo = schedule ? SHIFT_CODES[schedule.shift_code as ShiftCode] : null
                      
                      return (
                        <div
                          key={`${staff.id}-${day.getDate()}`}
                          className="flex-1 min-w-[60px] p-2 border-r border-gray-300 cursor-pointer hover:shadow-md transition-all duration-200 text-center"
                          onClick={() => handleCellClick(staff.id, day)}
                        >
                          {schedule ? (
                            <div
                              className="w-full h-8 rounded-lg flex items-center justify-center text-xs font-semibold shadow-sm"
                              style={{
                                backgroundColor: shiftInfo?.bgColor,
                                color: '#6A684F',
                                border: `1px solid ${shiftInfo?.bgColor}`
                              }}
                              title={shiftInfo?.name}
                            >
                              {schedule.shift_code}
                              {schedule.overtime_hours && schedule.overtime_hours > 0 && (
                                <span className="ml-1 text-xs">+{schedule.overtime_hours}h</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-8 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: '#C8703E' }}>
                              <Plus className="h-4 w-4" style={{ color: '#C8703E' }} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Drawer */}
      {isRightDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-96 z-40 transform transition-transform duration-300 ease-in-out">
          <div className="h-full p-6 shadow-2xl overflow-y-auto" style={{ backgroundColor: '#DDB38C' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#6A684F' }}>
                {drawerMode === 'edit' ? 'Edit Shift' : drawerMode === 'note' ? 'Add Note' : 'Bulk Operations'}
              </h3>
              <button
                onClick={() => setIsRightDrawerOpen(false)}
                className="p-2 rounded-lg hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: '#C8703E', color: 'white' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {drawerMode === 'edit' && selectedCell && (
              <div className="space-y-4">
                <div className="text-sm" style={{ color: '#6A684F' }}>
                  <div>Staff: {getStaffName(selectedCell.profileId)}</div>
                  <div>Date: {new Date(selectedCell.date).toLocaleDateString()}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SHIFT_CODES).map(([code, info]) => (
                    <button
                      key={code}
                      onClick={() => saveShift(code as ShiftCode)}
                      className="p-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-center"
                      style={{
                        backgroundColor: info.bgColor,
                        color: '#6A684F'
                      }}
                    >
                      <div className="text-lg">{code}</div>
                      <div className="text-xs mt-1">{info.name}</div>
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setDrawerMode('note')}
                    className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2"
                    style={{ backgroundColor: '#7FC6A4' }}
                  >
                    <NotebookPen className="h-4 w-4" />
                    <span>Add Note</span>
                  </button>
                  
                  {isAdmin && (
                    <button
                      className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2"
                      style={{ backgroundColor: '#C16A6A' }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Single Day</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {drawerMode === 'note' && (
              <div className="space-y-4">
                <textarea
                  value={cellNote}
                  onChange={(e) => setCellNote(e.target.value)}
                  placeholder="Add a note for this shift..."
                  rows={4}
                  className="w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    borderColor: '#C8703E', 
                    color: '#6A684F'
                  }}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDrawerMode('edit')}
                    className="flex-1 p-3 rounded-xl font-medium" 
                    style={{ backgroundColor: '#EEE4D2', color: '#6A684F' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 p-3 rounded-xl font-medium text-white"
                    style={{ backgroundColor: '#7FC6A4' }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {drawerMode === 'bulk' && selectedCell && (
              <div className="space-y-4">
                <div className="text-sm font-medium" style={{ color: '#6A684F' }}>
                  Staff: {getStaffName(selectedCell.profileId)}
                </div>
                
                <div className="space-y-3">
                  <button className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2" style={{ backgroundColor: '#C8703E' }}>
                    <Calendar className="h-4 w-4" />
                    <span>Fill Range</span>
                  </button>
                  
                  <button className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2" style={{ backgroundColor: '#7FC6A4' }}>
                    <Copy className="h-4 w-4" />
                    <span>Pattern Fill</span>
                  </button>
                  
                  <button className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2" style={{ backgroundColor: '#E8A55E' }}>
                    <Shuffle className="h-4 w-4" />
                    <span>Randomize OFF (Rules-aware)</span>
                  </button>
                  
                  <button className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2" style={{ backgroundColor: '#C16A6A' }}>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Entire Month</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ backgroundColor: '#DDB38C' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#6A684F' }}>New Request</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#6A684F' }}>Request Type</label>
                <select
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    border: '2px solid #C8703E', 
                    color: '#6A684F'
                  }}
                >
                  <option value="leave">Leave Request</option>
                  <option value="half_day">Half Day Request</option>
                  <option value="shift_swap">Shift Swap</option>
                  <option value="off_day_swap">Off Day Swap</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#6A684F' }}>Date</label>
                <input
                  type="date"
                  value={requestForm.date}
                  onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    border: '2px solid #C8703E', 
                    color: '#6A684F'
                  }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#6A684F' }}>Reason (Optional)</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 h-20 resize-none"
                  style={{ 
                    backgroundColor: '#EEE4D2', 
                    border: '2px solid #C8703E', 
                    color: '#6A684F'
                  }}
                  placeholder="Additional details..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
                  style={{ backgroundColor: '#EEE4D2', color: '#6A684F' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  style={{ backgroundColor: '#7FC6A4' }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ backgroundColor: '#DDB38C' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#6A684F' }}>Generate Roster</h2>
            <div className="space-y-4">
              <button className="w-full p-4 rounded-xl font-medium text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200" style={{ backgroundColor: '#C8703E' }}>
                Continue from Previous Month
              </button>
              <button className="w-full p-4 rounded-xl font-medium text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200" style={{ backgroundColor: '#7FC6A4' }}>
                Generate (Bulk)
              </button>
              <button className="w-full p-4 rounded-xl font-medium text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200" style={{ backgroundColor: '#E8A55E' }}>
                Generate (Per-Staff)
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="w-full p-4 rounded-xl font-medium transition-all"
                style={{ backgroundColor: '#EEE4D2', color: '#6A684F' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
