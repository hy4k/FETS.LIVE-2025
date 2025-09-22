// Shared types for FETS application

export interface StaffProfile {
  id: string
  user_id: string
  full_name: string
  role: 'staff' | 'admin' | 'super_admin'
  email: string
  department?: string
  base_centre?: 'calicut' | 'cochin' | null
}

export interface RosterSchedule {
  id?: string
  profile_id: string
  date: string
  shift_code: string
  overtime_hours?: number
  created_at?: string
  updated_at?: string
}

export interface LeaveRequest {
  id: string
  user_id: string
  request_type: 'leave' | 'shift_swap'
  requested_date: string
  swap_with_user_id?: string
  swap_date?: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at?: string
  requestor_name?: string
  target_name?: string
}

export interface Schedule {
  id?: string
  profile_id: string
  date: string
  shift_code: string
  overtime_hours?: number
  status: string
  created_at?: string
  updated_at?: string
}

// Apple-inspired shift color scheme
export const SHIFT_CODES = {
  'D': { 
    name: 'Day Shift', 
    bgColor: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', // Apple Blue
    textColor: '#ffffff',
    borderColor: '#007AFF',
    letter: 'D'
  },
  'E': { 
    name: 'Evening Shift', 
    bgColor: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)', // Apple Green
    textColor: '#ffffff',
    borderColor: '#34C759',
    letter: 'E'
  },
  'HD': { 
    name: 'Half Day', 
    bgColor: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)', // Apple Orange
    textColor: '#ffffff',
    borderColor: '#FF9500',
    letter: 'HD'
  },
  'RD': { 
    name: 'Rest Day', 
    bgColor: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)', // Apple Light Gray
    textColor: '#1D1D1F',
    borderColor: '#D1D1D6',
    letter: 'RD'
  },
  'L': { 
    name: 'Leave', 
    bgColor: 'linear-gradient(135deg, #FF3B30 0%, #FF6961 100%)', // Apple Red
    textColor: '#ffffff',
    borderColor: '#FF3B30',
    letter: 'L'
  },
  'OT': { 
    name: 'Overtime', 
    bgColor: 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)', // Pink for OT combinations
    textColor: '#ffffff',
    borderColor: '#FF69B4',
    letter: 'OT'
  },
  'T': { 
    name: 'Training', 
    bgColor: 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)', // Apple Gray
    textColor: '#ffffff',
    borderColor: '#8E8E93',
    letter: 'T'
  }
} as const

export type ShiftCode = keyof typeof SHIFT_CODES
export type ViewMode = 'week' | '2weeks' | 'month'
