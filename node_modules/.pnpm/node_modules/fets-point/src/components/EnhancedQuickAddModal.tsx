import React, { useState, useEffect } from 'react'
import { X, RefreshCw, Users, Building, Globe, Calendar, Eye, RotateCcw, Check, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { formatDateForIST } from '../utils/dateUtils'
import { SHIFT_CODES } from '../types/shared'

// ... (imports)

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffProfiles: any[]
  currentDate: Date
}

// ... (interfaces)

export const EnhancedQuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffProfiles,
  currentDate
}) => {
  const { user, profile } = useAuth()
  const { activeBranch } = useBranch()
  const [action, setAction] = useState('create')
  const [scope, setScope] = useState('single')
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [selectedPreset, setSelectedPreset] = useState('')
  const [conflicts, setConflicts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    // ... (generation logic with conflict detection)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-xl bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <RefreshCw className="h-7 w-7 mr-3 text-blue-500" />
              Quick Add Roster Generator
            </h3>
            <button onClick={onClose} className="p-3 hover:bg-gray-100/50 rounded-full transition-all">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Action: Create, Edit, Delete */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Action</label>
            <div className="flex space-x-2">
              <button onClick={() => setAction('create')} className={`px-4 py-2 rounded-lg text-sm font-medium ${action === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Create</button>
              <button onClick={() => setAction('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium ${action === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Edit</button>
              <button onClick={() => setAction('delete')} className={`px-4 py-2 rounded-lg text-sm font-medium ${action === 'delete' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Delete</button>
            </div>
          </div>

          {/* Scope: Single, All, Filtered */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Scope</label>
            <div className="flex space-x-2">
              <button onClick={() => setScope('single')} className={`px-4 py-2 rounded-lg text-sm font-medium ${scope === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Single Staff</button>
              <button onClick={() => setScope('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${scope === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>All Staff</button>
              <button onClick={() => setScope('filtered')} className={`px-4 py-2 rounded-lg text-sm font-medium ${scope === 'filtered' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Filtered</button>
            </div>
          </div>

          {/* Staff/Role Selection */}
          {scope === 'single' && (
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-3">Select Staff</label>
              <select className="w-full p-2 border rounded">
                {staffProfiles.map(staff => <option key={staff.id} value={staff.id}>{staff.full_name}</option>)}
              </select>
            </div>
          )}
          {scope === 'filtered' && (
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-3">Filter by Role</label>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full p-2 border rounded">
                <option value="all">All Roles</option>
                <option value="TCA">TCA</option>
              </select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Date Range</label>
            <div className="flex space-x-2">
              <input type="date" className="w-full p-2 border rounded" />
              <input type="date" className="w-full p-2 border rounded" />
            </div>
          </div>

          {/* Presets & Templates */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Presets & Templates</label>
            <div className="flex space-x-2">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200">2-2-3</button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200">5-2</button>
            </div>
          </div>

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div>
              <label className="block text-lg font-bold text-red-500 mb-3">Conflicts</label>
              <div className="p-4 bg-red-100 rounded-lg">
                {conflicts.map((conflict, i) => <p key={i} className="text-red-700">{conflict}</p>)}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button onClick={handleGenerate} disabled={loading} className="w-full p-4 bg-blue-500 text-white rounded-lg font-bold">
            {loading ? 'Generating...' : 'Generate Roster'}
          </button>
        </div>
      </div>
    </div>
  )
}