import { GlassCard } from './iCloud/GlassCard'
import { Users, Calendar, Activity, CheckCircle, TrendingUp, AlertCircle, Shield, Bell, Clock, Sparkles, ClipboardList, ClipboardCheck, CheckCircle2, X, Plus, Trash2, ChevronRight, Zap, Target, Briefcase, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useDashboardStats, useChecklistTemplates } from '../hooks/useCommandCentre'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChecklistFillModal } from './ChecklistFillModal'
import { CreateCustomChecklistModal } from './CreateCustomChecklistModal'
import { SevenDayCalendarWidget } from './SevenDayCalendarWidget'
import { SevenDayRosterDisplay } from './SevenDayRosterDisplay'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface ChecklistItem {
  id: string
  name: string
  completed: boolean
  responsible_person: string
  completion_time: string | null
}

interface ChecklistTemplate {
  id: string
  name: string
  category: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  description?: string
}

interface ChecklistTemplateItem {
  id: string
  template_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimated_time_minutes: number
  responsible_role: string
  sort_order: number
  notes?: string
  question_type?: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time'
  dropdown_options?: string[]
}

interface RosterSession {
  id: string
  date: string
  shift_code: string
  staff_assigned: number
  overtime_hours: number
  center_name: string
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Medium' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Low' }
}

// Animated Progress Circle Component
const ProgressCircle = ({ percentage, label, value, icon: Icon, color }: any) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          initial={{ strokeDasharray: '0 339.29' }}
          animate={{ strokeDasharray: `${(percentage / 100) * 339.29} 339.29` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {Icon && <Icon className="w-8 h-8" style={{ color }} />}
      </div>
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-4 text-center"
    >
      <div className="text-2xl font-bold" style={{ color }}>{Math.round(percentage)}%</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
      {value && <div className="text-xs text-gray-500 mt-1">{Math.round(value)}</div>}
    </motion.div>
  </div>
)

export default function CommandCentrePremium() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const { data: stats, isLoading } = useDashboardStats(activeBranch?.id)
  const { data: templates, isLoading: isLoadingTemplates } = useChecklistTemplates()
  const { preExamTemplate, postExamTemplate, customTemplates } = templates || {}
  const preExamItems = preExamTemplate?.items || []
  const postExamItems = postExamTemplate?.items || []

  const [showPreExamModal, setShowPreExamModal] = useState(false)
  const [showPostExamModal, setShowPostExamModal] = useState(false)
  const [showCustomChecklistModal, setShowCustomChecklistModal] = useState(false)
  const [fillData, setFillData] = useState({ exam_date: '', items: {} as { [key: string]: boolean } })
  const [rosterSessions, setRosterSessions] = useState<RosterSession[]>([])

  const selectedTemplate = showPreExamModal ? preExamTemplate : showPostExamModal ? postExamTemplate : null
  const selectedTemplateItems = showPreExamModal ? preExamItems : showPostExamModal ? postExamItems : []

  useEffect(() => {
    if (selectedTemplate) {
      const initialItems: { [key: string]: boolean } = {}
      const items = selectedTemplate.category === 'pre-exam' ? preExamItems : postExamItems
      items.forEach(item => {
        initialItems[item.id.toString()] = false
      })
      setFillData({ exam_date: new Date().toISOString().split('T')[0], items: initialItems })
    }
  }, [showPreExamModal, showPostExamModal, preExamTemplate, postExamTemplate])

  // Fetch 7-day roster preview
  useEffect(() => {
    const fetchRosterPreview = async () => {
      try {
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const { data, error } = await supabase
          .from('calendar_sessions')
          .select('*')
          .gte('session_date', today.toISOString().split('T')[0])
          .lte('session_date', nextWeek.toISOString().split('T')[0])
          .limit(7)

        if (!error && data) {
          const sessions = data.map((session: any) => ({
            id: session.id,
            date: session.session_date,
            shift_code: session.shift_code || 'Regular',
            staff_assigned: Math.floor(Math.random() * 10) + 5,
            overtime_hours: Math.floor(Math.random() * 8),
            center_name: session.center_name || 'Main Center'
          }))
          setRosterSessions(sessions)
        }
      } catch (err) {
        console.error('Error fetching roster preview:', err)
        // Set mock data as fallback
        const mockSessions = Array.from({ length: 7 }, (_, i) => ({
          id: `mock-${i}`,
          date: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          shift_code: ['Morning', 'Afternoon', 'Evening'][i % 3],
          staff_assigned: Math.floor(Math.random() * 10) + 5,
          overtime_hours: Math.floor(Math.random() * 8),
          center_name: activeBranch?.name || 'Main Center'
        }))
        setRosterSessions(mockSessions)
      }
    }

    fetchRosterPreview()
  }, [activeBranch?.id])
  const [customChecklistData, setCustomChecklistData] = useState({
    name: '',
    description: '',
    questions: [] as Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimated_time_minutes: number;
      question_type: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time';
      dropdown_options: string[];
    }>
  })

  const handleOpenPreExam = () => {
    if (!preExamTemplate || !preExamTemplate.items || preExamTemplate.items.length === 0) {
      toast.error('Pre-exam checklist template not found')
      return
    }
    setShowPreExamModal(true)
  }

  const handleOpenPostExam = () => {
    if (!postExamTemplate || !postExamTemplate.items || postExamTemplate.items.length === 0) {
      toast.error('Post-exam checklist template not found')
      return
    }
    setShowPostExamModal(true)
  }

  const addCustomQuestion = () => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `temp-${Date.now()}`,
          title: '',
          description: '',
          priority: 'medium',
          estimated_time_minutes: 5,
          question_type: 'checkbox',
          dropdown_options: []
        }
      ]
    }))
  }

  const updateCustomQuestion = (id: string, updates: any) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }))
  }

  const deleteCustomQuestion = (id: string) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const submitChecklist = async (data: { exam_date: string; items: { [key: string]: boolean } }, template: ChecklistTemplate | null) => {
    if (!profile || !template) return
    const itemsForTemplate = template.category === 'pre-exam' ? preExamItems : postExamItems;

    const allCompleted = itemsForTemplate.every(item => data.items[item.id.toString()])

    if (!allCompleted) {
      const proceed = confirm('Not all items are checked. Do you want to submit anyway?')
      if (!proceed) return
    }

    try {
      const { data: instance, error: instanceError } = await supabase
        .from('checklist_instances')
        .insert({
          template_id: template.id,
          name: `${template.name} - ${new Date(data.exam_date).toLocaleDateString()}`,
          category: template.category,
          exam_date: data.exam_date,
          created_by: profile.user_id,
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .select()
        .single()
      if (instanceError) throw instanceError

      const instanceItems = itemsForTemplate.map(item => ({
        instance_id: instance.id,
        template_item_id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        is_completed: data.items[item.id.toString()] || false,
        completed_by: data.items[item.id.toString()] ? profile.id : null,
        completed_at: data.items[item.id.toString()] ? new Date().toISOString() : null,
        sort_order: item.sort_order
      }))

      const { error: itemsError } = await supabase
        .from('checklist_instance_items')
        .insert(instanceItems)

      if (itemsError) throw itemsError

      toast.success('Checklist submitted successfully')
      setShowPreExamModal(false)
      setShowPostExamModal(false)
    } catch (error) {
      console.error('Error submitting checklist:', error)
      toast.error('Failed to submit checklist')
    }
  }

  const createCustomChecklist = async (customChecklistData: any) => {
    if (!profile || !customChecklistData.name.trim()) {
      toast.error('Checklist name is required')
      return
    }

    if (customChecklistData.questions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    try {
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          name: customChecklistData.name,
          description: customChecklistData.description,
          category: 'custom',
          is_active: true,
          created_by: profile.user_id
        })
        .select()
        .single()

      if (templateError) throw templateError

      const items = customChecklistData.questions.map((q, index) => ({
        template_id: template.id,
        title: q.title,
        description: q.description,
        priority: q.priority,
        estimated_time_minutes: q.estimated_time_minutes,
        responsible_role: 'staff',
        sort_order: index + 1
      }))

      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(items)

      if (itemsError) throw itemsError

      toast.success('Custom checklist created successfully')
      setShowCustomChecklistModal(false)
      setCustomChecklistData({ name: '', description: '', questions: [] })
    } catch (error) {
      console.error('Error creating custom checklist:', error)
      toast.error('Failed to create custom checklist')
    }
  }

  return (
    <div className="min-h-screen -mt-32 pt-48" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-7xl mx-auto px-8">
        {/* Premium Header Section - With spacing from yellow banner */}
        <div className="mt-8 mb-12">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif", color: '#ffffff' }}>
              Command Centre
            </h1>
          </div>
          <p className="text-xl text-white/90 font-medium">
            {activeBranch?.name ? `${activeBranch.name} - ` : ''}Welcome back, {profile?.full_name || 'User'}
          </p>
          <p className="text-white/60 text-base mt-2 font-medium">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Hero Run Checklist Section - Bold Premium Color Blocking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
            {/* Vibrant Gradient Background with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative p-10 md:p-14">
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30">
                    <Target className="text-white" size={28} />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                    Daily Checklists
                  </h2>
                </div>
                <p className="text-white/90 text-lg font-medium ml-[72px]">
                  Complete your essential tasks to keep operations running smoothly
                </p>
              </div>

              {/* Checklist Buttons Grid - Premium Card Design */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pre-Exam Checklist */}
                <motion.button
                  onClick={handleOpenPreExam}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl p-7 bg-white/15 backdrop-blur-md border-2 border-white/40 hover:border-white/70 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-30 transition-all duration-500" />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  <div className="relative text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <ClipboardList className="text-white w-7 h-7" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-300/50">
                        <div className="text-xs font-bold text-blue-100">Pre-Exam</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                      Pre-Exam Checklist
                    </h3>
                    <p className="text-sm text-white/80 font-medium leading-relaxed">
                      Verify all systems before session starts
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span>Start</span>
                    <ChevronRight size={18} className="group-hover:animate-pulse" />
                  </div>
                </motion.button>

                {/* Post-Exam Checklist */}
                <motion.button
                  onClick={handleOpenPostExam}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl p-7 bg-white/15 backdrop-blur-md border-2 border-white/40 hover:border-white/70 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 opacity-0 group-hover:opacity-30 transition-all duration-500" />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  <div className="relative text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <ClipboardCheck className="text-white w-7 h-7" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-500/30 border border-green-300/50">
                        <div className="text-xs font-bold text-green-100">Post-Exam</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                      Post-Exam Checklist
                    </h3>
                    <p className="text-sm text-white/80 font-medium leading-relaxed">
                      Verify completion and cleanup procedures
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span>Start</span>
                    <ChevronRight size={18} className="group-hover:animate-pulse" />
                  </div>
                </motion.button>

                {/* Custom Checklist */}
                <motion.button
                  onClick={() => setShowCustomChecklistModal(true)}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl p-7 bg-white/15 backdrop-blur-md border-2 border-white/40 hover:border-white/70 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-600 opacity-0 group-hover:opacity-30 transition-all duration-500" />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  <div className="relative text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <Sparkles className="text-white w-7 h-7" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-purple-500/30 border border-purple-300/50">
                        <div className="text-xs font-bold text-purple-100">Custom</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                      Custom Checklist
                    </h3>
                    <p className="text-sm text-white/80 font-medium leading-relaxed">
                      Create your own task template
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span>Create</span>
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced KPI Cards with Animated Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Candidates - Progress Circle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="frosted-card p-6 flex items-center justify-center"
          >
            <ProgressCircle
              percentage={Math.min(((stats?.totalCandidates || 0) / 1000) * 100, 100)}
              label="Total Candidates"
              value={Math.floor(stats?.totalCandidates || 0)}
              icon={Users}
              color="#3b82f6"
            />
          </motion.div>

          {/* Today's Sessions - Progress Circle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="frosted-card p-6 flex items-center justify-center"
          >
            <ProgressCircle
              percentage={Math.min(((stats?.todayCandidates || 0) / 100) * 100, 100)}
              label="Today's Sessions"
              value={stats?.todayCandidates || 0}
              icon={Calendar}
              color="#10b981"
            />
          </motion.div>

          {/* Active Events - Progress Circle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="frosted-card p-6 flex items-center justify-center"
          >
            <ProgressCircle
              percentage={Math.min(((stats?.openEvents || 0) / 50) * 100, 100)}
              label="Active Events"
              value={stats?.openEvents || 0}
              icon={Activity}
              color="#f59e0b"
            />
          </motion.div>

          {/* Pending Tasks - Progress Circle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="frosted-card p-6 flex items-center justify-center"
          >
            <ProgressCircle
              percentage={Math.min(((stats?.pendingChecklists || 0) / 50) * 100, 100)}
              label="Pending Tasks"
              value={stats?.pendingChecklists || 0}
              icon={CheckCircle}
              color="#ef4444"
            />
          </motion.div>
        </div>

        {/* 7 Days Calendar Widget */}
        <div className="mb-12">
          <SevenDayCalendarWidget onNavigate={() => {}} />
        </div>

        {/* 7 Days Roster Display Widget */}
        <div className="mb-12">
          <SevenDayRosterDisplay />
        </div>

        {/* Copyright Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <p className="text-white/80 text-xs font-medium">
              © 2025-2026 Forun Testing and Educational Service
            </p>
          </div>
        </div>
      </div>

      {/* Pre/Post Exam Checklist Modal */}
      <AnimatePresence>
        {(showPreExamModal || showPostExamModal) && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                      <p className="text-blue-100 text-sm">Complete all tasks and submit</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date *</label>
                  <input
                    type="date"
                    value={fillData.exam_date}
                    onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  {selectedTemplateItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        fillData.items[item.id.toString()]
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fillData.items[item.id.toString()] || false}
                          onChange={(e) => setFillData(prev => ({
                            ...prev,
                            items: { ...prev.items, [item.id.toString()]: e.target.checked }
                          }))}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {index + 1}. {item.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${PRIORITY_CONFIG[item.priority].color}`}>
                              {PRIORITY_CONFIG[item.priority].label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {Object.values(fillData.items).filter(Boolean).length} / {selectedTemplateItems.length}
                    </span> tasks completed
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitChecklist(fillData, selectedTemplate)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Checklist
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Checklist Modal */}
      <AnimatePresence>
        {showCustomChecklistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">Create Custom Checklist</h2>
                      <p className="text-black/70 text-sm">Design your own checklist template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomChecklistModal(false)}
                    className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
                      <input
                        type="text"
                        value={customChecklistData.name}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="e.g., Weekend Checklist"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={customChecklistData.description}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Brief description of this checklist"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <button
                      onClick={addCustomQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customChecklistData.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                          <button
                            onClick={() => deleteCustomQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => updateCustomQuestion(question.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                              placeholder="Enter question text"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={question.description}
                              onChange={(e) => updateCustomQuestion(question.id, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                              rows={2}
                              placeholder="Additional details..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={question.priority}
                                onChange={(e) => updateCustomQuestion(question.id, { priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (min)</label>
                              <input
                                type="number"
                                value={question.estimated_time_minutes}
                                onChange={(e) => updateCustomQuestion(question.id, { estimated_time_minutes: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {customChecklistData.questions.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No questions added yet. Click "Add Question" to start building your checklist.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCustomChecklistModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createCustomChecklist(customChecklistData)}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Create Checklist
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Progress Circle Animations */
        @keyframes circle-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .progress-circle {
          animation: circle-pulse 3s ease-in-out infinite;
        }

        /* Roster Card Hover Effects */
        .roster-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .roster-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.1);
        }

        /* Hero Checklist Button Styles */
        .checklist-hero-btn {
          position: relative;
          overflow: hidden;
        }

        .checklist-hero-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .checklist-hero-btn:hover::before {
          left: 100%;
        }

        /* Shimmer effect for loading state */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer-loading {
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  )
}
