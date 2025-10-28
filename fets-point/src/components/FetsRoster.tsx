import { useState, useEffect, useCallback } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  Trash2, 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus,
  Eye,
  Search,
  Users,
  Coffee,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Filter
} from 'lucide-react'
import { MonthlyRosterTimeline } from './MonthlyRosterTimeline'
import { ShiftCellPopup } from './ShiftCellPopup'
import { EnhancedQuickAddModal } from './EnhancedQuickAddModal'
import { EnhancedRequestsModal } from './EnhancedRequestsModal'
import { RosterListView } from './RosterListView'
import { EnhancedAnalysisView } from './EnhancedAnalysisView'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { formatDateForIST } from '../utils/dateUtils'
import { LeaveRequest, Schedule, StaffProfile, SHIFT_CODES, ShiftCode } from '../types/shared'

type ViewMode = 'month' | 'list';import '../styles/glassmorphism.css'

export function FetsRoster() {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()
  
  // Core state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  
  // UI state
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'edit' | 'requests' | 'analysis' | 'generate'>('edit')
  const [selectedCell, setSelectedCell] = useState<{ profileId: string; date: string } | null>(null)
  const [otHours, setOtHours] = useState(0)
  const [lastEditInfo, setLastEditInfo] = useState<{ by: string; date: string } | null>(null)
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('')
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  
  // New modal states for enhanced functionality
  const [showShiftCellPopup, setShowShiftCellPopup] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [currentView, setCurrentView] = useState<'roster' | 'analysis'>('roster')
  const [selectedCellData, setSelectedCellData] = useState<{
    profileId: string
    date: string
    staffName: string
    currentShift?: string
    currentOvertimeHours?: number
  } | null>(null)
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Permission checks - Use profile from AuthContext as primary source
  const getCurrentUserStaffProfile = () => {
    // First try to use profile from AuthContext (more reliable)
    if (profile) return profile
    
    // Fallback to finding in staffProfiles array
    if (!user) return null
    return staffProfiles.find(p => p.user_id === user.id)
  }
  
  const currentStaffProfile = getCurrentUserStaffProfile()
  const isSuperAdmin = currentStaffProfile?.role === 'super_admin'
  const isAdmin = currentStaffProfile?.role === 'admin' || isSuperAdmin

  // Notification system
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const getViewDateRange = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    return { startDate, endDate }
  }, [currentDate])

  // Data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
       
      // Load staff profiles with branch-specific filtering
      let profileQuery = supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, role, email, department, base_centre')
        .not('full_name', 'in', '("MITHUN","NIYAS","Mithun","Niyas")')
      
      // Apply branch filtering based on active branch
      if (activeBranch === 'calicut') {
        profileQuery = profileQuery.eq('base_centre', 'calicut')
      } else if (activeBranch === 'cochin') {
        profileQuery = profileQuery.eq('base_centre', 'cochin')
      }
      // For global mode, load all staff (except super admins)
      
      const { data: profiles, error: profilesError } = await profileQuery.order('full_name')
      
      if (profilesError) throw profilesError
      
      const mappedProfiles: StaffProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        role: profile.role,
        email: profile.email || '',
        department: profile.department,
        base_centre: profile.base_centre
      }))
      
      setStaffProfiles(mappedProfiles)

      // Calculate date range based on view mode
      const { startDate, endDate } = getViewDateRange()
      
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('roster_schedules')
        .select('id, profile_id, date, shift_code, overtime_hours, status, created_at, updated_at')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')
      
      if (scheduleError) throw scheduleError
      setSchedules(scheduleData || [])
      
      // Load requests
      const { data: requestData, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (requestError) throw requestError
      setRequests(requestData || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('error', `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [activeBranch, getViewDateRange, showNotification])

  const getViewTitle = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    switch (viewMode) {
      case 'month':
      case 'list':
      default:
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'month':
      case 'list':
      default:
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const getStaffName = (profileId: string): string => {
    const staff = staffProfiles.find(s => s.id === profileId)
    return staff?.full_name || 'Unknown Staff'
  }

  const updateVersionTracking = async (action: string) => {
    try {
      await supabase
        .from('roster_audit_log')
        .insert({
          action,
          performed_by: profile?.id || user?.id,
          performed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error in version tracking:', error)
    }
  }

  const handleCellClick = (profileId: string, date: Date) => {
    const dateStr = formatDateForIST(date)
    const staffMember = staffProfiles.find(s => s.id === profileId)
    const existingSchedule = schedules.find(s => s.profile_id === profileId && s.date === dateStr)
    
    setSelectedCellData({
      profileId,
      date: dateStr,
      staffName: staffMember?.full_name || 'Unknown',
      currentShift: existingSchedule?.shift_code || '',
      currentOvertimeHours: existingSchedule?.overtime_hours || 0
    })
    setShowShiftCellPopup(true)
  }

  // New handlers for ShiftCellPopup
  const handleShiftCellSave = async (shiftData: { shift_code: string; overtime_hours: number }) => {
    if (!selectedCellData || !user || !isAdmin) {
      showNotification('warning', 'Unable to save shift - permission or context issue')
      return
    }

    const scheduleData = {
      profile_id: selectedCellData.profileId,
      date: selectedCellData.date,
      shift_code: shiftData.shift_code,
      overtime_hours: shiftData.overtime_hours,
      status: 'confirmed',
      updated_at: new Date().toISOString()
    }

    const existingIndex = schedules.findIndex(s => 
      s.profile_id === selectedCellData.profileId && s.date === selectedCellData.date
    )

    const newSchedules = [...schedules];

    if (existingIndex > -1) {
      const existingSchedule = newSchedules[existingIndex];
      newSchedules[existingIndex] = { ...existingSchedule, ...scheduleData };
    } else {
      newSchedules.push({ ...scheduleData, id: 'temp-' + Date.now(), created_at: new Date().toISOString() });
    }

    setSchedules(newSchedules);

    try {
      if (existingIndex > -1) {
        const { error } = await supabase
          .from('roster_schedules')
          .update(scheduleData)
          .eq('id', schedules[existingIndex].id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('roster_schedules')
          .insert([{ ...scheduleData, created_at: new Date().toISOString() }])
        
        if (error) throw error
      }

      await updateVersionTracking(`Updated shift for ${selectedCellData.staffName}`)
      showNotification('success', 'Shift updated successfully!')
      loadData(); // Refresh data to get the real ID
    } catch (error) {
      console.error('Error saving shift:', error)
      showNotification('error', `Failed to save shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSchedules(schedules); // Revert state on error
    }
  }

  const handleShiftCellDelete = async () => {
    if (!selectedCellData || !user || !isAdmin) {
      showNotification('warning', 'Unable to delete shift - permission or context issue')
      return
    }

    try {
      const existing = schedules.find(s => 
        s.profile_id === selectedCellData.profileId && s.date === selectedCellData.date
      )
      
      if (existing) {
        const { error } = await supabase
          .from('roster_schedules')
          .delete()
          .eq('id', existing.id)
        
        if (error) throw error
        
        await updateVersionTracking(`Deleted shift for ${selectedCellData.staffName} on ${selectedCellData.date}`)
        await loadData()
        showNotification('success', 'Shift deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      showNotification('error', `Failed to delete shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Filter staff for current view
  const filteredStaff = staffProfiles.filter(staff => {
    // Filter by selected staff filter if any
    if (selectedStaffFilter && staff.id !== selectedStaffFilter) {
      return false
    }
    return true
  })

  useEffect(() => {
    loadData()
  }, [activeBranch, currentDate, viewMode, loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glassmorphic-card p-8 flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading roster data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Notification System */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl glassmorphic-card ${
          notification.type === 'success' ? 'border-green-200 bg-green-50/80' :
          notification.type === 'error' ? 'border-red-200 bg-red-50/80' :
          'border-yellow-200 bg-yellow-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            <span className="font-medium text-gray-900">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>FETS Roster</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/20 p-1 rounded-lg">
                <button onClick={() => navigateDate('prev')} className="p-2 rounded-lg hover:bg-white/20 text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{getViewTitle()}</h2>
                <button onClick={() => navigateDate('next')} className="p-2 rounded-lg hover:bg-white/20 text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30">Today</button>
              <div className="flex items-center space-x-2 bg-white/20 p-1 rounded-lg">
                <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === 'month' ? 'bg-white text-yellow-800 shadow' : 'text-white'}`}>Timeline</button>
                <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-white text-yellow-800 shadow' : 'text-white'}`}>List</button>
              </div>
              <div className="relative">
                <button onClick={() => setShowFilter(!showFilter)} className="p-2 rounded-lg hover:bg-white/20 text-white">
                  <Filter className="h-5 w-5" />
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSelectedStaffFilter('');
                          setShowFilter(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        All Staff
                      </button>
                      {staffProfiles.map(staff => (
                        <button
                          key={staff.id}
                          onClick={() => {
                            setSelectedStaffFilter(staff.id);
                            setShowFilter(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {staff.full_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowQuickAddModal(true)}
                disabled={!isAdmin}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 flex items-center space-x-2 font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Quick Add</span>
              </button>
              <button
                onClick={() => setCurrentView(currentView === 'analysis' ? 'roster' : 'analysis')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${currentView === 'analysis' ? 'bg-white text-yellow-800 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analysis</span>
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content - Dynamic Views */}
      <div className="flex-1 p-6">
        {currentView === 'roster' && viewMode === 'month' && (
          <MonthlyRosterTimeline
            staffProfiles={filteredStaff}
            schedules={schedules}
            currentDate={currentDate}
            onCellClick={handleCellClick}
          />
        )}
        {currentView === 'roster' && viewMode === 'list' && (
          <RosterListView
            schedules={schedules}
            staffProfiles={staffProfiles}
          />
        )}
        
        {currentView === 'analysis' && (
          <EnhancedAnalysisView 
            schedules={schedules}
            staffProfiles={filteredStaff}
            requests={requests}
            currentDate={currentDate}
          />
        )}
      </div>
      
      <EnhancedQuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSuccess={() => loadData()}
        staffProfiles={staffProfiles}
        currentDate={currentDate}
      />
      
      {/* Enhanced Requests Modal */}
      <EnhancedRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        onSuccess={() => loadData()}
        staffProfiles={filteredStaff}
      />
      
      {/* Shift Cell Popup */}
      <ShiftCellPopup
        isOpen={showShiftCellPopup}
        onClose={() => setShowShiftCellPopup(false)}
        onSave={handleShiftCellSave}
        onDelete={handleShiftCellDelete}
        currentShift={selectedCellData?.currentShift}
        currentOvertimeHours={selectedCellData?.currentOvertimeHours}
        staffName={selectedCellData?.staffName || ''}
        date={selectedCellData?.date || ''}
      />
    </div>
  )
}
