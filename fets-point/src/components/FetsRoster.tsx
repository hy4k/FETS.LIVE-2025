import { useState, useEffect } from 'react'
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
import { NewWeeklyRosterView } from './NewWeeklyRosterView'
import { MonthlyRosterTimeline } from './MonthlyRosterTimeline'
import { ShiftCellPopup } from './ShiftCellPopup'
import { EnhancedQuickAddModal } from './EnhancedQuickAddModal'
import { EnhancedRequestsModal } from './EnhancedRequestsModal'
import { PersonalShiftsView } from './PersonalShiftsView'
import { EnhancedAnalysisView } from './EnhancedAnalysisView'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { supabase } from '../lib/supabase'
import { formatDateForIST } from '../utils/dateUtils'
import { LeaveRequest, Schedule, StaffProfile, SHIFT_CODES, ShiftCode, ViewMode } from '../types/shared'
import '../styles/glassmorphism.css'

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
  
  // New modal states for enhanced functionality
  const [showShiftCellPopup, setShowShiftCellPopup] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [currentView, setCurrentView] = useState<'roster' | 'personal' | 'analysis'>('roster')
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
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Data loading
  const loadData = async () => {
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
  }

  const getViewDateRange = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    switch (viewMode) {
      case 'week': {
        const startDate = new Date(currentDate)
        startDate.setDate(currentDate.getDate() - currentDate.getDay())
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        return { startDate, endDate }
      }
      case '2weeks': {
        const startDate = new Date(currentDate)
        startDate.setDate(currentDate.getDate() - currentDate.getDay())
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 13)
        return { startDate, endDate }
      }
      case 'month':
      default: {
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)
        return { startDate, endDate }
      }
    }
  }

  const getViewTitle = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    switch (viewMode) {
      case 'week':
        return `Week of ${currentDate.toLocaleDateString()}`
      case '2weeks':
        return `Two Weeks from ${currentDate.toLocaleDateString()}`
      case 'month':
      default:
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case '2weeks':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 14 : -14))
        break
      case 'month':
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

    try {
      const scheduleData = {
        profile_id: selectedCellData.profileId,
        date: selectedCellData.date,
        shift_code: shiftData.shift_code,
        overtime_hours: shiftData.overtime_hours,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }

      const existing = schedules.find(s => 
        s.profile_id === selectedCellData.profileId && s.date === selectedCellData.date
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

      await updateVersionTracking(`Updated shift for ${selectedCellData.staffName}`)
      await loadData()
      showNotification('success', 'Shift updated successfully!')
    } catch (error) {
      console.error('Error saving shift:', error)
      showNotification('error', `Failed to save shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
  }, [activeBranch, currentDate, viewMode])

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

      {/* Premium Apple/iCloud Inspired Header Banner */}
      <div className="relative overflow-hidden">
        {/* Dynamic Apple-Style Gradient Background */}
        <div className="h-80 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative">
          {/* Apple-style mesh gradient overlay */}
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(98, 84, 255, 0.4) 0%, transparent 50%)`
          }}></div>
          
          {/* Premium floating elements with Apple-style animations */}
          <div className="absolute inset-0">
            <div className="absolute top-12 left-12 w-40 h-40 bg-white/8 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-32 right-16 w-32 h-32 bg-blue-300/15 rounded-full blur-xl" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
            <div className="absolute bottom-24 left-1/4 w-24 h-24 bg-purple-300/10 rounded-full blur-lg" style={{ animation: 'float 12s ease-in-out infinite reverse' }}></div>
            <div className="absolute top-20 left-1/2 w-16 h-16 bg-indigo-200/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          
          {/* Apple-style geometric pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M60 60l30-30v60l-30-30zm30 0l30-30v60l-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          {/* Main Content Container */}
          <div className="relative h-full flex flex-col justify-between">
            {/* Top Brand Section - Apple Style */}
            <div className="pt-12 px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  {/* Enhanced Branding */}
                  <div className="flex items-center space-x-6">
                    <div className="relative group">
                      <div className="relative p-4 bg-white/15 backdrop-blur-2xl rounded-3xl border border-white/25 shadow-2xl transition-all duration-300 group-hover:scale-105">
                        <img 
                          src="/fets-header-replacement.jpg" 
                          alt="FETS Logo" 
                          className="h-12 object-contain filter brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                      </div>
                      {/* Premium glow effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
                    </div>
                    
                    <div className="text-left">
                      <h1 className="text-4xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        FETS ROSTER
                      </h1>
                      <p className="text-white/90 text-lg font-medium tracking-wide">
                        Premium Workforce Management
                      </p>
                    </div>
                  </div>
                  
                  {/* Live Status Indicator - Apple Style */}
                  <div className="bg-white/15 backdrop-blur-2xl rounded-2xl px-6 py-4 border border-white/25 shadow-xl">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg" style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}></div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
                      </div>
                      <div className="text-white">
                        <div className="font-bold text-lg tracking-wide">
                          {activeBranch === 'calicut' ? 'Calicut Centre' : 
                           activeBranch === 'cochin' ? 'Cochin Centre' : 'Global Operations'}
                        </div>
                        <div className="text-white/80 text-sm font-medium">
                          {filteredStaff.length} active team members
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Control Panel - Apple/iCloud Style */}
            <div className="bg-white/10 backdrop-blur-3xl border-t border-white/20 shadow-2xl">
              <div className="px-8 py-8">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between flex-col xl:flex-row space-y-6 xl:space-y-0">
                    
                    {/* Left: Quick Stats */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{schedules.length}</div>
                        <div className="text-white/70 text-sm font-medium uppercase tracking-wider">Active Shifts</div>
                      </div>
                      <div className="w-px h-12 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{requests.length}</div>
                        <div className="text-white/70 text-sm font-medium uppercase tracking-wider">Pending Requests</div>
                      </div>
                      <div className="w-px h-12 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{getViewTitle()}</div>
                        <div className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Period</div>
                      </div>
                    </div>
                    
                    {/* Right: Action Buttons - Apple Style Grid */}
                    <div className="flex items-center space-x-4">
                      {/* Quick Add Button - Primary Action */}
                      <button
                        onClick={() => setShowQuickAddModal(true)}
                        disabled={!isAdmin}
                        className="group relative px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 rounded-2xl text-white font-bold flex items-center space-x-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="text-lg tracking-wide">Quick Add</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                      
                      {/* Secondary Actions */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCurrentView(currentView === 'personal' ? 'roster' : 'personal')}
                          className={`group relative p-4 backdrop-blur-2xl border border-white/30 rounded-2xl font-bold transition-all duration-300 hover:scale-110 hover:shadow-xl ${
                            currentView === 'personal'
                              ? 'bg-white/90 text-gray-900 shadow-2xl'
                              : 'bg-white/15 hover:bg-white/25 text-white'
                          }`}
                          title="My Shifts"
                        >
                          <User className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                          {currentView === 'personal' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-2xl"></div>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setShowRequestsModal(true)}
                          className="group relative p-4 bg-white/15 hover:bg-white/25 backdrop-blur-2xl border border-white/30 rounded-2xl text-white font-bold transition-all duration-300 hover:scale-110 hover:shadow-xl"
                          title="Requests"
                        >
                          <Users className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                        
                        <button
                          onClick={() => setCurrentView(currentView === 'analysis' ? 'roster' : 'analysis')}
                          className={`group relative p-4 backdrop-blur-2xl border border-white/30 rounded-2xl font-bold transition-all duration-300 hover:scale-110 hover:shadow-xl ${
                            currentView === 'analysis'
                              ? 'bg-white/90 text-gray-900 shadow-2xl'
                              : 'bg-white/15 hover:bg-white/25 text-white'
                          }`}
                          title="Analysis"
                        >
                          <BarChart3 className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                          {currentView === 'analysis' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Header & Filters */}
      <div className="px-6 pt-4">
        <div className="card-premium px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">FETS ROSTER</h2>
            <p className="text-sm text-gray-500">
              {activeBranch === 'calicut' ? 'Calicut Centre' : activeBranch === 'cochin' ? 'Cochin Centre' : 'Global Operations'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Month</label>
            <select
              className="input-premium text-sm"
              value={currentDate.getMonth()}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10)
                setCurrentDate(new Date(currentDate.getFullYear(), m, 1))
              }}
            >
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <label className="text-sm text-gray-600">Year</label>
            <select
              className="input-premium text-sm"
              value={currentDate.getFullYear()}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10)
                setCurrentDate(new Date(y, currentDate.getMonth(), 1))
              }}
            >
              {Array.from({length: 5}, (_,k) => currentDate.getFullYear() - 2 + k).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5">D – Day</span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5">E – Evening</span>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 px-2 py-0.5">HD – Half Day</span>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 px-2 py-0.5">RD – Rest</span>
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-2 py-0.5">L – Leave</span>
          <span className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5">OT – Overtime</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 px-2 py-0.5">T – Training</span>
        </div>
      </div>

      {/* Main Content - Dynamic Views */}
      <div className="flex-1 p-6">
        {currentView === 'roster' && (
          <MonthlyRosterTimeline
            staffProfiles={filteredStaff}
            schedules={schedules}
            currentDate={currentDate}
            onCellClick={handleCellClick}
          />
        )}
        
        {currentView === 'personal' && (
          <PersonalShiftsView 
            schedules={schedules}
            currentDate={currentDate}
            onNavigate={navigateDate}
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
      
      {/* Enhanced Quick Add Modal */}
      <EnhancedQuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSuccess={() => loadData()}
        staffProfiles={filteredStaff}
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
