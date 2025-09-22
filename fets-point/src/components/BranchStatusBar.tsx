import React from 'react'
import { motion } from 'framer-motion'
import { 
  Monitor, 
  Users, 
  Calendar, 
  Wifi, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'

interface StatusIndicatorProps {
  status: 'ok' | 'warning' | 'critical' | 'optimal' | 'moderate' | 'issues'
  size?: 'sm' | 'md' | 'lg'
}

function StatusIndicator({ status, size = 'sm' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  }
  
  const getStatusColor = () => {
    switch (status) {
      case 'ok':
      case 'optimal':
        return 'bg-green-500'
      case 'warning':
      case 'moderate':
        return 'bg-yellow-500'
      case 'critical':
      case 'issues':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }
  
  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full ${getStatusColor()}`}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    />
  )
}

interface BranchStatusBarProps {
  className?: string
}

export function BranchStatusBar({ className = '' }: BranchStatusBarProps) {
  const { activeBranch, branchStatus, loading, viewMode } = useBranch()
  
  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
          <span className="ml-2 text-sm text-gray-600">Loading branch status...</span>
        </div>
      </div>
    )
  }
  
  const currentStatus = activeBranch === 'global' 
    ? null 
    : branchStatus[activeBranch]
  
  const renderBranchStatus = (status: any, branchName: string) => {
    if (!status) return null
    
    const getSystemHealthIcon = () => {
      switch (status.system_health) {
        case 'ok':
          return <CheckCircle className="h-5 w-5 text-green-500" />
        case 'warning':
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />
        case 'critical':
          return <AlertCircle className="h-5 w-5 text-red-500" />
        default:
          return <CheckCircle className="h-5 w-5 text-gray-400" />
      }
    }
    
    const getSystemHealthText = () => {
      switch (status.system_health) {
        case 'ok':
          return 'All Systems OK'
        case 'warning':
          return 'Issues Pending'
        case 'critical':
          return 'Critical Alerts'
        default:
          return 'Unknown Status'
      }
    }
    
    return (
      <div className="flex items-center space-x-6">
        {/* System Health */}
        <div className="flex items-center space-x-2">
          {getSystemHealthIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getSystemHealthText()}
          </span>
        </div>
        
        {/* Workstations */}
        <div className="flex items-center space-x-2">
          <Monitor className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold">{status.workstations_active}/{status.workstations_total}</span> Online
          </span>
          <div className="w-12 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(status.workstations_active / status.workstations_total) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Candidates Today */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold">{status.candidates_today}</span> Scheduled
          </span>
        </div>
        
        {/* Staff on Duty */}
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold">{status.staff_present}/{status.staff_total}</span> Present
          </span>
        </div>
        
        {/* Network Status */}
        <div className="flex items-center space-x-2">
          <Wifi className="h-4 w-4 text-gray-600" />
          <StatusIndicator status={status.network_status} size="md" />
          <span className="text-sm text-gray-600 capitalize">{status.network_status}</span>
        </div>
        
        {/* Power Status */}
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-gray-600" />
          <StatusIndicator status={status.power_status} size="md" />
          <span className="text-sm text-gray-600 capitalize">{status.power_status}</span>
        </div>
      </div>
    )
  }
  
  // Global view - show combined status
  if (activeBranch === 'global') {
    const caliStatus = branchStatus['calicut']
    const cochinStatus = branchStatus['cochin']
    
    if (!caliStatus || !cochinStatus) {
      return (
        <div className={`bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 ${className}`}>
          <div className="text-center text-sm text-gray-500">Loading global status...</div>
        </div>
      )
    }
    
    const totalWorkstationsActive = caliStatus.workstations_active + cochinStatus.workstations_active
    const totalWorkstations = caliStatus.workstations_total + cochinStatus.workstations_total
    const totalStaffPresent = caliStatus.staff_present + cochinStatus.staff_present
    const totalStaff = caliStatus.staff_total + cochinStatus.staff_total
    const totalCandidates = caliStatus.candidates_today + cochinStatus.candidates_today
    
    return (
      <motion.div 
        className={`bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
              <span className="text-sm font-semibold text-gray-700">Global Operations</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Combined Workstations */}
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{totalWorkstationsActive}/{totalWorkstations}</span> Online
              </span>
            </div>
            
            {/* Combined Candidates */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{totalCandidates}</span> Scheduled
              </span>
            </div>
            
            {/* Combined Staff */}
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{totalStaffPresent}/{totalStaff}</span> Present
              </span>
            </div>
            
            {/* Branch Status Summary */}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-300">
              <div className="flex items-center space-x-1">
                <StatusIndicator status={caliStatus.system_health} size="sm" />
                <span className="text-xs text-gray-600">Calicut</span>
              </div>
              <div className="flex items-center space-x-1">
                <StatusIndicator status={cochinStatus.system_health} size="sm" />
                <span className="text-xs text-gray-600">Cochin</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
  
  // Dual view mode
  if (viewMode === 'dual') {
    const caliStatus = branchStatus['calicut']
    const cochinStatus = branchStatus['cochin']
    
    return (
      <motion.div 
        className={`bg-white/90 backdrop-blur-sm border-b border-gray-200/50 ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Calicut Status */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">Calicut Branch</span>
              </div>
            </div>
            {renderBranchStatus(caliStatus, 'Calicut')}
          </div>
          
          {/* Cochin Status */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" />
                <span className="text-sm font-semibold text-gray-700">Cochin Branch</span>
              </div>
            </div>
            {renderBranchStatus(cochinStatus, 'Cochin')}
          </div>
        </div>
      </motion.div>
    )
  }
  
  // Single branch view
  return (
    <motion.div 
      className={`bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            activeBranch === 'calicut' 
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
              : 'bg-gradient-to-r from-green-400 to-green-500'
          }`} />
          <span className="text-sm font-semibold text-gray-700">
            {activeBranch === 'calicut' ? 'Calicut' : 'Cochin'} Branch Status
          </span>
        </div>
        
        {renderBranchStatus(currentStatus, activeBranch === 'calicut' ? 'Calicut' : 'Cochin')}
      </div>
    </motion.div>
  )
}
