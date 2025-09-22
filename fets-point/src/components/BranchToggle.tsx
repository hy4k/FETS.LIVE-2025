import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe, Eye, EyeOff } from 'lucide-react'
import { useBranch, BranchType } from '../contexts/BranchContext'

interface BranchToggleProps {
  className?: string
}

export function BranchToggle({ className = '' }: BranchToggleProps) {
  const {
    activeBranch,
    setActiveBranch,
    viewMode,
    setViewMode,
    canAccessBranch,
    canUseDualMode,
    isSwitching,
    userAccessLevel
  } = useBranch()
  
  const [isOpen, setIsOpen] = React.useState(false)
  
  const branches: { id: BranchType; name: string; color: string }[] = [
    { id: 'calicut', name: 'Calicut', color: 'bg-gradient-to-r from-yellow-400 to-yellow-500' },
    { id: 'cochin', name: 'Cochin', color: 'bg-gradient-to-r from-green-400 to-green-500' }
  ]
  
  // Add global option for admins
  if (userAccessLevel !== 'staff') {
    branches.push({ id: 'global', name: 'Global', color: 'bg-gradient-to-r from-blue-400 to-purple-500' })
  }
  
  const currentBranch = branches.find(b => b.id === activeBranch)
  
  const handleBranchSelect = (branchId: BranchType) => {
    if (canAccessBranch(branchId)) {
      setActiveBranch(branchId)
      setIsOpen(false)
    }
  }
  
  const toggleViewMode = () => {
    if (canUseDualMode()) {
      setViewMode(viewMode === 'single' ? 'dual' : 'single')
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Branch Toggle Dropdown */}
        <div className="relative">
          <motion.button
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 hover:bg-white/95 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.98 }}
            disabled={isSwitching}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBranch}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2"
              >
                <div className={`w-3 h-3 rounded-full ${currentBranch?.color || 'bg-gray-400'}`} />
                <span className="font-semibold text-gray-700">
                  {isSwitching ? 'Switching...' : currentBranch?.name || 'Unknown'}
                </span>
              </motion.div>
            </AnimatePresence>
            <ChevronDown 
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </motion.button>
          
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsOpen(false)}
                />
                
                {/* Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden z-50"
                >
                  {branches.map((branch) => {
                    const accessible = canAccessBranch(branch.id)
                    const isActive = branch.id === activeBranch
                    
                    return (
                      <motion.button
                        key={branch.id}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 ${
                          isActive
                            ? 'bg-gray-100 text-gray-900'
                            : accessible
                            ? 'hover:bg-gray-50 text-gray-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => accessible && handleBranchSelect(branch.id)}
                        disabled={!accessible}
                        whileHover={accessible ? { x: 4 } : {}}
                        whileTap={accessible ? { scale: 0.98 } : {}}
                      >
                        <div className={`w-3 h-3 rounded-full ${branch.color} ${
                          !accessible ? 'opacity-40' : ''
                        }`} />
                        <span className="font-medium">{branch.name}</span>
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="w-2 h-2 bg-blue-500 rounded-full ml-auto"
                          />
                        )}
                        {!accessible && (
                          <span className="text-xs text-gray-400 ml-auto">No Access</span>
                        )}
                      </motion.button>
                    )
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Dual View Toggle (Admin Only) */}
        {canUseDualMode() && (
          <motion.button
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
              viewMode === 'dual'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white/95 shadow-lg border border-white/20'
            }`}
            onClick={toggleViewMode}
            whileTap={{ scale: 0.98 }}
            title={viewMode === 'dual' ? 'Switch to Single View' : 'Switch to Dual View'}
          >
            {viewMode === 'dual' ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {viewMode === 'dual' ? 'Dual' : 'Single'}
            </span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
