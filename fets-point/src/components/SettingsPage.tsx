import { useState, useEffect } from 'react'
import { Settings, User, Shield, Monitor, Save, RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff, X, Key, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

interface UserSettings {
  display: {
    theme: 'dark' | 'light' | 'auto'
    language: string
    timezone: string
    dateFormat: string
  }
}

export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings>({
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    }
  })
  const [profileData, setProfileData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: '',
    bio: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('fets-point-settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)
      localStorage.setItem('fets-point-settings', JSON.stringify(settings))
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)

      const { error } = await supabase
        .from('staff_profiles')
        .update({
          full_name: profileData.fullName,
        })
        .eq('user_id', profile?.user_id)

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('Error updating profile')
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error updating profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setIsLoading(true)

      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast.error('All fields are required')
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New passwords do not match')
        return
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long')
        return
      }

      if (passwordForm.newPassword === passwordForm.currentPassword) {
        toast.error('New password must be different from current password')
        return
      }

      // Verify current password
      if (profile?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: passwordForm.currentPassword
        })

        if (verifyError) {
          toast.error('Current password is incorrect')
          return
        }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
        toast.error(updateError.message || 'Failed to update password')
        return
      }

      toast.success('Password updated successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setTimeout(() => {
        setShowChangePasswordModal(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'display', name: 'Display', icon: Monitor },
    { id: 'security', name: 'Security & Privacy', icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
              <p className="text-gray-600 text-sm mt-0.5">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Modern Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm mb-6 p-2">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl ring-4 ring-white/30">
                        {profileData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{profileData.fullName || 'User'}</h2>
                        <p className="text-blue-100 mb-2">{profile?.role || 'Staff Member'}</p>
                        <p className="text-sm text-blue-100">{profileData.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Information Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                    <button
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                        value={profile?.role || 'Staff'}
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Managed by administrators</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-32 resize-none bg-white"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/500 characters</p>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        resetPasswordForm()
                        setShowChangePasswordModal(true)
                      }}
                      className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                    >
                      <Key className="h-5 w-5" />
                      <span className="font-semibold">Change Password</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Display Preferences</h3>
                      <p className="text-gray-600 text-sm mt-1">Customize your visual experience</p>
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Theme Preference</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={settings.display.theme}
                        onChange={(e) => setSettings({
                          ...settings,
                          display: { ...settings.display, theme: e.target.value as any }
                        })}
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">Choose your preferred color scheme</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Language</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={settings.display.language}
                        onChange={(e) => setSettings({
                          ...settings,
                          display: { ...settings.display, language: e.target.value }
                        })}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">Select your preferred language</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Timezone</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={settings.display.timezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          display: { ...settings.display, timezone: e.target.value }
                        })}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Kolkata">IST (India)</option>
                        <option value="America/New_York">EST (US East)</option>
                        <option value="America/Los_Angeles">PST (US West)</option>
                        <option value="Europe/London">GMT (UK)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">Time zone for date display</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Date Format</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={settings.display.dateFormat}
                        onChange={(e) => setSettings({
                          ...settings,
                          display: { ...settings.display, dateFormat: e.target.value }
                        })}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">Date display format</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Password Management</h3>
                      <p className="text-gray-600 text-sm">Keep your account secure</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <p className="text-gray-700 mb-4">Use a strong, unique password to protect your account. Change it regularly for better security.</p>
                    <button
                      onClick={() => {
                        resetPasswordForm()
                        setShowChangePasswordModal(true)
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                    >
                      <Key className="h-4 w-4" />
                      <span className="font-semibold">Change Password</span>
                    </button>
                  </div>
                </div>

                {/* Account Security Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Account Security</h3>
                      <p className="text-gray-600 text-sm">Your account information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Email Address</p>
                      <p className="text-gray-900 font-medium">{profile?.email}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Account Role</p>
                      <p className="text-gray-900 font-medium capitalize">{profile?.role || 'Staff'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Account Status</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-green-600 font-medium">Active</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Last Password Change</p>
                      <p className="text-gray-900 font-medium">Recently</p>
                    </div>
                  </div>
                </div>

                {/* Sign Out Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                      <LogOut className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Session Management</h3>
                      <p className="text-gray-600 text-sm">Sign out of your account</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
                    <p className="text-gray-700 mb-4">Sign out to end your current session. You'll need to sign in again to access your account.</p>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Change Password</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(false)
                      resetPasswordForm()
                    }}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{isLoading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false)
                      resetPasswordForm()
                    }}
                    className="px-6 py-3 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');
      `}</style>
    </div>
  )
}
