import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

export type BranchType = 'calicut' | 'cochin' | 'global'
export type ViewMode = 'single' | 'dual'

interface BranchStatus {
  branch_name: string
  workstations_total: number
  workstations_active: number
  network_status: 'optimal' | 'moderate' | 'issues'
  power_status: 'optimal' | 'moderate' | 'issues'
  staff_total: number
  staff_present: number
  system_health: 'ok' | 'warning' | 'critical'
  candidates_today: number
  incidents_open: number
  last_updated: string
}

interface BranchContextType {
  // Current branch selection
  activeBranch: BranchType
  setActiveBranch: (branch: BranchType) => void
  
  // View mode (single/dual)
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  
  // Branch access permissions
  userBranchAccess: 'calicut' | 'cochin' | 'both'
  userAccessLevel: 'staff' | 'admin' | 'super_admin'
  
  // Branch status data
  branchStatus: { [key: string]: BranchStatus }
  loading: boolean
  
  // Branch switching animation state
  isSwitching: boolean
  
  // Helper functions
  canAccessBranch: (branch: BranchType) => boolean
  canUseDualMode: () => boolean
  getBranchTheme: (branch: BranchType) => string
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

interface BranchProviderProps {
  children: ReactNode
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { profile, user } = useAuth()
  const [activeBranch, setActiveBranchState] = useState<BranchType>('calicut')
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [branchStatus, setBranchStatus] = useState<{ [key: string]: BranchStatus }>({})
  const [loading, setLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  
  // User permissions from profile
  const userBranchAccess = profile?.branch_assigned || 'calicut'
  const userAccessLevel = profile?.access_level || 'staff'
  
  // Load initial branch preference from localStorage or user's assigned branch
  useEffect(() => {
    if (profile) {
      const savedBranch = localStorage.getItem('fets-active-branch') as BranchType
      const defaultBranch = profile.branch_assigned === 'both' ? 'calicut' : profile.branch_assigned
      
      if (savedBranch && canAccessBranch(savedBranch)) {
        setActiveBranchState(savedBranch)
      } else {
        setActiveBranchState(defaultBranch)
      }
    }
  }, [profile])
  
  // Load branch status data
  useEffect(() => {
    loadBranchStatus()
  }, [])
  
  // Set up real-time subscriptions for branch status
  useEffect(() => {
    const subscription = supabase
      .channel('branch-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'branch_status' },
        () => {
          console.log('🔄 Branch status updated, reloading...')
          loadBranchStatus()
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const loadBranchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('branch_status')
        .select('*')
        .order('branch_name')
      
      if (error) {
        console.error('❌ Error loading branch status:', error.message)
        return
      }
      
      if (data) {
        const statusMap = data.reduce((acc, status) => {
          acc[status.branch_name] = status
          return acc
        }, {} as { [key: string]: BranchStatus })
        
        setBranchStatus(statusMap)
      }
    } catch (error: any) {
      console.error('❌ Exception loading branch status:', error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const setActiveBranch = async (branch: BranchType) => {
    if (!canAccessBranch(branch) || branch === activeBranch) return
    
    setIsSwitching(true)
    
    try {
      // Save to localStorage
      localStorage.setItem('fets-active-branch', branch)
      
      // Add smooth transition delay
      await new Promise(resolve => setTimeout(resolve, 150))
      
      setActiveBranchState(branch)
      
      // Reset view mode when switching branches
      if (viewMode === 'dual' && branch !== 'global') {
        setViewMode('single')
      }
      
      console.log(`🏢 Switched to ${branch} branch`)
    } finally {
      // Keep switching state for smooth animation
      setTimeout(() => setIsSwitching(false), 300)
    }
  }
  
  const canAccessBranch = (branch: BranchType): boolean => {
    if (!profile) return false
    
    // Super admins and admins can access all branches
    if (userAccessLevel === 'super_admin' || userAccessLevel === 'admin') {
      return true
    }
    
    // Staff can only access their assigned branch
    if (userBranchAccess === 'both') return true
    if (branch === 'global') return userAccessLevel !== 'staff'
    
    return userBranchAccess === branch
  }
  
  const canUseDualMode = (): boolean => {
    return userAccessLevel === 'super_admin' || userAccessLevel === 'admin'
  }
  
  const getBranchTheme = (branch: BranchType): string => {
    switch (branch) {
      case 'calicut':
        return 'branch-calicut'
      case 'cochin':
        return 'branch-cochin'
      case 'global':
        return 'branch-global'
      default:
        return 'branch-calicut'
    }
  }
  
  const value: BranchContextType = {
    activeBranch,
    setActiveBranch,
    viewMode,
    setViewMode,
    userBranchAccess,
    userAccessLevel,
    branchStatus,
    loading,
    isSwitching,
    canAccessBranch,
    canUseDualMode,
    getBranchTheme
  }
  
  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}

// Hook for branch-specific data filtering
export function useBranchFilter() {
  const { activeBranch } = useBranch()
  
  const getFilter = () => {
    if (activeBranch === 'global') {
      return {} // No filter for global view
    }
    return { branch_location: activeBranch }
  }
  
  const applyFilter = (query: any) => {
    if (activeBranch === 'global') {
      return query // No filter for global view
    }
    return query.eq('branch_location', activeBranch)
  }
  
  return {
    filter: getFilter(),
    applyFilter,
    isGlobalView: activeBranch === 'global'
  }
}
