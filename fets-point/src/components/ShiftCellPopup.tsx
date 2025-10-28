import React, { useState, useEffect } from 'react'
import { X, Trash2, Save } from 'lucide-react'
import { SHIFT_CODES } from '../types/shared'

interface ShiftCellPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftData: { shift_code: string; overtime_hours: number }) => void
  onDelete: () => void
  currentShift?: string
  currentOvertimeHours?: number
  staffName: string
  date: string
}

// Apple-inspired shift color scheme - all options including OT
const SHIFT_OPTIONS = {
  'D': SHIFT_CODES.D,
  'E': SHIFT_CODES.E, 
  'HD': SHIFT_CODES.HD,
  'RD': SHIFT_CODES.RD,
  'L': SHIFT_CODES.L,
  'OT': SHIFT_CODES.OT,
  'T': SHIFT_CODES.T
}

export const ShiftCellPopup: React.FC<ShiftCellPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  currentShift = '',
  currentOvertimeHours = 0,
  staffName,
  date
}) => {
  const [selectedShift, setSelectedShift] = useState(currentShift)
  const [overtimeHours, setOvertimeHours] = useState(currentOvertimeHours)

  useEffect(() => {
    setSelectedShift(currentShift)
    setOvertimeHours(currentOvertimeHours)
  }, [currentShift, currentOvertimeHours])

  const handleSave = () => {
    onSave({
      shift_code: selectedShift,
      overtime_hours: overtimeHours
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  const getCellPreview = () => {
    if (!selectedShift) return { bg: '#f3f4f6', text: '#9ca3af', display: '' }
    
    const shiftInfo = SHIFT_OPTIONS[selectedShift as keyof typeof SHIFT_OPTIONS]
    if (!shiftInfo) return { bg: '#f3f4f6', text: '#9ca3af', display: selectedShift }
    
    // Handle D+OT and E+OT combinations
    if (overtimeHours > 0 && (selectedShift === 'D' || selectedShift === 'E')) {
      return {
        bg: SHIFT_CODES.OT.bgColor,
        text: SHIFT_CODES.OT.textColor,
        display: `${selectedShift}+OT`
      }
    }
    
    return {
      bg: shiftInfo.bgColor,
      text: shiftInfo.textColor,
      display: shiftInfo.letter
    }
  }

  if (!isOpen) return null

  const preview = getCellPreview()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphic backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl bg-black/30"
        onClick={onClose}
      />
      
      {/* Popup container - Apple-style */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50/90 to-gray-100/90 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-wide">{staffName}</h3>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-200/50 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Shift Selector Grid */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-4 tracking-wide uppercase">Select Shift Type</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(SHIFT_OPTIONS).map(([code, option]) => (
                <button
                  key={code}
                  onClick={() => setSelectedShift(code)}
                  className={`
                    p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105
                    ${
                      selectedShift === code
                        ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-100'
                        : 'border-gray-200/50 hover:border-gray-300 shadow-sm hover:shadow-md'
                    }
                  `}
                  style={{
                    background: selectedShift === code ? option.bgColor : 'rgb(249 250 251)',
                    color: selectedShift === code ? option.textColor : '#374151'
                  }}
                >
                  <div className="text-center">
                    <div className="font-bold text-lg mb-1">{option.letter}</div>
                    <div className="text-xs font-medium opacity-90">{option.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Overtime Hours */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 tracking-wide uppercase">Overtime Hours</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 text-lg font-semibold"
                placeholder="0"
              />
              <div className="absolute right-6 top-4 text-sm text-gray-500 font-medium">hours</div>
            </div>
            {overtimeHours > 0 && (selectedShift === 'D' || selectedShift === 'E') && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl">
                <p className="text-sm text-purple-700 font-semibold">
                  Will display as {selectedShift}+OT with pink background
                </p>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 p-6 rounded-2xl border border-gray-200/50">
            <div className="text-sm font-bold text-gray-700 mb-4 tracking-wide uppercase text-center">Preview</div>
            <div className="flex justify-center">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                style={{ 
                  background: preview.bg, 
                  color: preview.text,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                {preview.display || '?'}
              </div>
            </div>
            {selectedShift && (
              <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                {SHIFT_OPTIONS[selectedShift as keyof typeof SHIFT_OPTIONS]?.name}
                {overtimeHours > 0 && ` + ${overtimeHours}h overtime`}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-t border-gray-200/50">
          <div className="flex space-x-4">
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-red-200/50"
            >
              <Trash2 className="h-5 w-5" />
              <span>Clear Shift</span>
            </button>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Save className="h-5 w-5" />
              <span>Save Shift</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}