import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Save,
  X,
  MapPin,
  Shield,
  Building,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface StaffProfile {
  id: string
  full_name: string
  role: string
  department: string
  base_centre: 'calicut' | 'cochin' | null
  user_id?: string
  created_at: string
}

interface BaseCentreBadgeProps {
  centre: 'calicut' | 'cochin' | null
  size?: 'sm' | 'md'
}

function BaseCentreBadge({ centre, size = 'sm' }: BaseCentreBadgeProps) {
  if (!centre) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Shield className="w-3 h-3 mr-1" />
        Global Access
      </span>
    )
  }
  
  const config = {
    calicut: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      name: 'Calicut'
    },
    cochin: {
      bg: 'bg-green-100', 
      text: 'text-green-800',
      border: 'border-green-200',
      name: 'Cochin'
    }
  }[centre]
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
      <MapPin className="w-3 h-3 mr-1" />
      {config.name}
    </span>
  )
}

interface EditStaffModalProps {
  staff: StaffProfile | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedStaff: Partial<StaffProfile>) => void
}

function EditStaffModal({ staff, isOpen, onClose, onSave }: EditStaffModalProps) {
  const [formData, setFormData] = useState<Partial<StaffProfile>>({})
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name,
        role: staff.role,
        department: staff.department,
        base_centre: staff.base_centre
      })
    }
  }, [staff])
  
  const handleSave = async () => {
    if (!staff) return
    
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
      toast.success('Staff member updated successfully')
    } catch (error) {
      toast.error('Failed to update staff member')
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen || !staff) return null
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Centre
              </label>
              <select
                value={formData.base_centre || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  base_centre: e.target.value as 'calicut' | 'cochin' | null
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Base Centre</option>
                <option value="calicut">Calicut Centre</option>
                <option value="cochin">Cochin Centre</option>
              </select>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export function StaffManagement() {
  const { profile } = useAuth()
  const { activeBranch, userAccessLevel } = useBranch()
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentre, setSelectedCentre] = useState<string>('all')
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  useEffect(() => {
    loadStaff()
  }, [])
  
  useEffect(() => {
    filterStaff()
  }, [staff, searchTerm, selectedCentre, activeBranch])
  
  const loadStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .order('full_name')
      
      if (error) throw error
      setStaff(data || [])
    } catch (error: any) {
      console.error('Error loading staff:', error.message)
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }
  
  const filterStaff = () => {
    let filtered = staff
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by centre selection
    if (selectedCentre !== 'all') {
      if (selectedCentre === 'global') {
        filtered = filtered.filter(s => !s.base_centre)
      } else {
        filtered = filtered.filter(s => s.base_centre === selectedCentre)
      }
    }
    
    // Role-based filtering: regular admins can only see their centre's staff
    if (userAccessLevel === 'admin' && activeBranch !== 'global') {
      filtered = filtered.filter(s => 
        s.base_centre === activeBranch || s.role === 'super_admin'
      )
    }
    
    setFilteredStaff(filtered)
  }
  
  const handleEditStaff = (staffMember: StaffProfile) => {
    setEditingStaff(staffMember)
    setShowEditModal(true)
  }
  
  const handleSaveStaff = async (updatedData: Partial<StaffProfile>) => {
    if (!editingStaff) return
    
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update(updatedData)
        .eq('id', editingStaff.id)
      
      if (error) throw error
      
      // Update local state
      setStaff(prevStaff => 
        prevStaff.map(s => 
          s.id === editingStaff.id ? { ...s, ...updatedData } : s
        )
      )
      
      setShowEditModal(false)
      setEditingStaff(null)
    } catch (error: any) {
      console.error('Error updating staff:', error.message)
      throw error
    }
  }
  
  const getStaffStats = () => {
    const total = filteredStaff.length
    const calicut = filteredStaff.filter(s => s.base_centre === 'calicut').length
    const cochin = filteredStaff.filter(s => s.base_centre === 'cochin').length
    const global = filteredStaff.filter(s => !s.base_centre).length
    
    return { total, calicut, cochin, global }
  }
  
  const stats = getStaffStats()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage staff assignments and base centre allocations</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Calicut Centre</p>
              <p className="text-xl font-bold text-gray-900">{stats.calicut}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Cochin Centre</p>
              <p className="text-xl font-bold text-gray-900">{stats.cochin}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Global Access</p>
              <p className="text-xl font-bold text-gray-900">{stats.global}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search staff by name, role, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="md:w-64">
            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Centres</option>
              <option value="calicut">Calicut Centre</option>
              <option value="cochin">Cochin Centre</option>
              <option value="global">Global Access</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Staff Member</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Base Centre</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <motion.tr
                  key={staffMember.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        staffMember.role === 'super_admin' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {staffMember.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staffMember.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {staffMember.role === 'super_admin' ? 'Super Administrator' : 'Staff Member'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{staffMember.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{staffMember.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <BaseCentreBadge centre={staffMember.base_centre} />
                  </td>
                  <td className="px-6 py-4">
                    {userAccessLevel === 'super_admin' || (
                      userAccessLevel === 'admin' && 
                      (staffMember.base_centre === activeBranch || activeBranch === 'global')
                    ) ? (
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="inline-flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">No Access</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredStaff.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditStaffModal
            staff={editingStaff}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingStaff(null)
            }}
            onSave={handleSaveStaff}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
