import { useState, useEffect } from 'react'
import { Settings, User, Shield, Bell, Monitor, Database, Key, Save, RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff, X, Info, Clock, Users, Edit, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    security: boolean
    updates: boolean
  }
  display: {
    theme: 'dark' | 'light' | 'auto'
    language: string
    timezone: string
    dateFormat: string
  }
  security: {
    twoFactor: boolean
    sessionTimeout: number
    loginAlerts: boolean
  }
  system: {
    autoBackup: boolean
    maintenanceMode: boolean
    debugMode: boolean
  }
}

export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      desktop: false,
      security: true,
      updates: true
    },
    display: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginAlerts: true
    },
    system: {
      autoBackup: true,
      maintenanceMode: false,
      debugMode: false
    }
  })
  const [profileData, setProfileData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: '',
    role: profile?.role || '',
    department: '',
    bio: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
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
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  // User Management State
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // Branch context
  const { userAccessLevel } = useBranch()

  // Role-based access control
  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin = profile?.role === 'admin' || isSuperAdmin
  const canAccessSystemSettings = isSuperAdmin
  const canAccessUserManagement = isAdmin

  useEffect(() => {
    loadUserSettings()
  }, [])
  
  useEffect(() => {
    if (activeTab === 'user-management' && canAccessUserManagement) {
      loadAllUsers()
    }
  }, [activeTab, canAccessUserManagement])

  const loadUserSettings = async () => {
    try {
      // Load user settings from database or localStorage
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
      
      // Save settings to localStorage (in production, save to database)
      localStorage.setItem('fets-point-settings', JSON.stringify(settings))
      
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Error saving settings')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          // Add other profile fields as needed
        })
        .eq('user_id', profile?.user_id)

      if (error) {
        console.error('Error updating profile:', error)
        setSaveMessage('Error updating profile')
      } else {
        setSaveMessage('Profile updated successfully!')
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveMessage('Error updating profile')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setIsLoading(true)
      setPasswordError('')
      setPasswordSuccess('')
      // Validate form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError('All fields are required')
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('New passwords do not match')
        return
      }

      if (passwordForm.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long')
        return
      }

      if (passwordForm.newPassword === passwordForm.currentPassword) {
        setPasswordError('New password must be different from current password')
        return
      }

      // Verify current password by attempting to sign in
      if (profile?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: passwordForm.currentPassword
        })

        if (verifyError) {
          setPasswordError('Current password is incorrect')
          return
        }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
        setPasswordError(updateError.message || 'Failed to update password')
        return
      }

      setPasswordSuccess('Password updated successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Close modal after success
      setTimeout(() => {
        setShowChangePasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordError(error.message || 'An unexpected error occurred')
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
    setPasswordError('')
    setPasswordSuccess('')
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
  
  // User Management Functions
  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error loading users:', error)
        setSaveMessage('Error loading users')
        setTimeout(() => setSaveMessage(''), 3000)
        return
      }
      
      setAllUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setSaveMessage('Error loading users')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setLoadingUsers(false)
    }
  }
  
  const handleUpdateUserBaseCentre = async (userId: string, newBaseCentre: string) => {
    try {
      setIsLoading(true)
      
      const { error } = await supabase
        .from('users')
        .update({ base_centre: newBaseCentre })
        .eq('id', userId)
      
      if (error) {
        console.error('Error updating user base centre:', error)
        setSaveMessage('Error updating base centre')
      } else {
        setSaveMessage('Base centre updated successfully!')
        // Refresh users list
        await loadAllUsers()
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error updating user base centre:', error)
      setSaveMessage('Error updating base centre')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsLoading(false)
      setEditingUser(null)
    }
  }
  
  const getBranchBadge = (baseCentre: string) => {
    switch (baseCentre?.toLowerCase()) {
      case 'calicut':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <MapPin className="h-3 w-3 mr-1" />
            Calicut
          </span>
        )
      case 'cochin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <MapPin className="h-3 w-3 mr-1" />
            Cochin
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <MapPin className="h-3 w-3 mr-1" />
            Not Assigned
          </span>
        )
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'display', name: 'Display', icon: Monitor },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'user-management', name: 'User Management', icon: Users, restricted: !canAccessUserManagement },
    { id: 'system', name: 'System', icon: Database, restricted: !canAccessSystemSettings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-3 mr-4 shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
              <p className="text-gray-600">Customize your FETS POINT experience and manage system preferences</p>
            </div>
          </div>
          {saveMessage && (
            <div className={`px-4 py-3 rounded-lg shadow-md border ${
              saveMessage.includes('Error') 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <div className="flex items-center">
                {saveMessage.includes('Error') ? (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {saveMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings Menu</h3>
              <p className="text-sm text-gray-600">Choose a category to configure</p>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isRestricted = tab.restricted
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isRestricted && setActiveTab(tab.id)}
                    disabled={isRestricted}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200 shadow-sm'
                        : isRestricted
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                    {isRestricted && <Key className="h-4 w-4 ml-auto" />}
                  </button>
                )
              })}
            </nav>
            
            {/* User Info Card */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {profileData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profileData.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profileData.role || 'Staff Member'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                    <p className="text-gray-600">Manage your personal information and account preferences</p>
                  </div>
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="btn-primary-modern flex items-center space-x-2"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                {/* Profile Avatar */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {profileData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{profileData.fullName || 'User'}</h3>
                      <p className="text-gray-600 mb-2">{profileData.role || 'Staff Member'}</p>
                      <p className="text-sm text-gray-500">{profileData.email}</p>
                      <button className="text-orange-600 hover:text-orange-700 text-sm mt-2 font-medium transition-colors">
                        Change Avatar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      value={profileData.role}
                      disabled
                      placeholder="Your role"
                    />
                    <p className="text-xs text-gray-500 mt-1">Role is managed by administrators</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/500 characters</p>
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        resetPasswordForm()
                        setShowChangePasswordModal(true)
                      }}
                      className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Key className="h-4 w-4" />
                      <span>Change Password</span>
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                    <p className="text-gray-600">Control how and when you receive notifications</p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="btn-primary-modern flex items-center space-x-2"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email', icon: Bell },
                    { key: 'push', label: 'Push Notifications', description: 'Browser push notifications', icon: Monitor },
                    { key: 'desktop', label: 'Desktop Notifications', description: 'System desktop notifications', icon: Monitor },
                    { key: 'security', label: 'Security Alerts', description: 'Important security notifications', icon: Shield },
                    { key: 'updates', label: 'System Updates', description: 'Notifications about system updates', icon: Info }
                  ].map((setting) => {
                    const Icon = setting.icon
                    return (
                      <div key={setting.key} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-2">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{setting.label}</h4>
                            <p className="text-sm text-gray-600">{setting.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.notifications[setting.key as keyof typeof settings.notifications]}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                [setting.key]: e.target.checked
                              }
                            })}
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-400 peer-checked:to-orange-500"></div>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Display Settings */}
            {activeTab === 'display' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Display Settings</h2>
                    <p className="text-gray-600">Customize your visual experience and preferences</p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="btn-primary-modern flex items-center space-x-2"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
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
                  
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
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
                  
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Timezone</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      value={settings.display.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        display: { ...settings.display, timezone: e.target.value }
                      })}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">Eastern Time (EST/EDT)</option>
                      <option value="America/Chicago">Central Time (CST/CDT)</option>
                      <option value="America/Denver">Mountain Time (MST/MDT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Time zone for date and time display</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Date Format</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      value={settings.display.dateFormat}
                      onChange={(e) => setSettings({
                        ...settings,
                        display: { ...settings.display, dateFormat: e.target.value }
                      })}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU Format)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">How dates are displayed throughout the app</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                    <p className="text-gray-600">Manage your account security and authentication preferences</p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="btn-primary-modern flex items-center space-x-2"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500 rounded-lg p-2">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.security.twoFactor}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, twoFactor: e.target.checked }
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-blue-500 rounded-lg p-2">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Session Timeout</h4>
                        <p className="text-sm text-gray-600">Automatic logout after inactivity</p>
                      </div>
                    </div>
                    <select
                      className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                    </select>
                  </div>

                  {/* Login Alerts */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-500 rounded-lg p-2">
                          <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Login Alerts</h4>
                          <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.security.loginAlerts}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, loginAlerts: e.target.checked }
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeTab === 'user-management' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
                    <p className="text-gray-600">Manage staff base centre assignments and user roles</p>
                    {!canAccessUserManagement && (
                      <div className="flex items-center space-x-2 mt-2 text-amber-600">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">Administrator access required</span>
                      </div>
                    )}
                  </div>
                  {canAccessUserManagement && (
                    <button
                      onClick={loadAllUsers}
                      disabled={loadingUsers}
                      className="btn-primary-modern flex items-center space-x-2"
                    >
                      {loadingUsers ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span>Refresh Users</span>
                    </button>
                  )}
                </div>

                {canAccessUserManagement ? (
                  <div className="space-y-6">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-600">Loading users...</span>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Staff Base Centre Assignments</h3>
                          <p className="text-sm text-gray-600 mt-1">Manage which centre each staff member is assigned to</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Centre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {allUsers.filter(user => user.role !== 'super_admin').map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                        {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</div>
                                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                      {user.role || 'staff'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser === user.id ? (
                                      <select
                                        className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                                        defaultValue={user.base_centre || ''}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleUpdateUserBaseCentre(user.id, e.target.value)
                                          }
                                        }}
                                        onBlur={() => setEditingUser(null)}
                                        autoFocus
                                      >
                                        <option value="">Select Centre</option>
                                        <option value="Calicut">Calicut</option>
                                        <option value="Cochin">Cochin</option>
                                      </select>
                                    ) : (
                                      getBranchBadge(user.base_centre)
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => setEditingUser(user.id)}
                                      disabled={isLoading || editingUser === user.id}
                                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {allUsers.filter(user => user.role !== 'super_admin').length === 0 && (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No staff members found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center">
                          <div className="bg-yellow-500 rounded-lg p-2 mr-3">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Calicut Staff</p>
                            <p className="text-2xl font-bold text-yellow-900">
                              {allUsers.filter(user => user.base_centre?.toLowerCase() === 'calicut' && user.role !== 'super_admin').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                        <div className="flex items-center">
                          <div className="bg-emerald-500 rounded-lg p-2 mr-3">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Cochin Staff</p>
                            <p className="text-2xl font-bold text-emerald-900">
                              {allUsers.filter(user => user.base_centre?.toLowerCase() === 'cochin' && user.role !== 'super_admin').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <div className="bg-gray-500 rounded-lg p-2 mr-3">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Unassigned</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {allUsers.filter(user => !user.base_centre && user.role !== 'super_admin').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-8 text-center">
                    <div className="bg-amber-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Key className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrator Access Required</h3>
                    <p className="text-gray-600 mb-4">User management can only be accessed by administrators to maintain system security.</p>
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <p className="text-sm text-gray-700">Contact your system administrator if you need to manage user assignments.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
                    <p className="text-gray-600">Advanced system configuration and maintenance options</p>
                    {!canAccessSystemSettings && (
                      <div className="flex items-center space-x-2 mt-2 text-amber-600">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">Super Admin access required</span>
                      </div>
                    )}
                  </div>
                  {canAccessSystemSettings && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="btn-primary-modern flex items-center space-x-2"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>

                {canAccessSystemSettings ? (
                  <div className="space-y-6">
                    {[
                      { 
                        key: 'autoBackup', 
                        label: 'Automatic Backup', 
                        description: 'Automatically backup system data daily',
                        color: 'blue',
                        icon: Database
                      },
                      { 
                        key: 'maintenanceMode', 
                        label: 'Maintenance Mode', 
                        description: 'Enable system maintenance mode',
                        color: 'red',
                        icon: AlertTriangle
                      },
                      { 
                        key: 'debugMode', 
                        label: 'Debug Mode', 
                        description: 'Enable detailed system logging',
                        color: 'purple',
                        icon: Info
                      }
                    ].map((setting) => {
                      const Icon = setting.icon
                      const colorClasses = {
                        blue: 'from-blue-50 to-indigo-50 border-blue-200 bg-blue-500',
                        red: 'from-red-50 to-rose-50 border-red-200 bg-red-500',
                        purple: 'from-purple-50 to-violet-50 border-purple-200 bg-purple-500'
                      }
                      return (
                        <div key={setting.key} className={`bg-gradient-to-r ${colorClasses[setting.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} p-6 rounded-lg border ${colorClasses[setting.color as keyof typeof colorClasses].split(' ')[2]}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`${colorClasses[setting.color as keyof typeof colorClasses].split(' ')[3]} rounded-lg p-2`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{setting.label}</h4>
                                <p className="text-sm text-gray-600">{setting.description}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.system[setting.key as keyof typeof settings.system]}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  system: {
                                    ...settings.system,
                                    [setting.key]: e.target.checked
                                  }
                                })}
                              />
                              <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${setting.color}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${colorClasses[setting.color as keyof typeof colorClasses].split(' ')[3]}`}></div>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-8 text-center">
                    <div className="bg-amber-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Key className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Super Admin Access Required</h3>
                    <p className="text-gray-600 mb-4">System settings can only be modified by Super Administrators to ensure system security and stability.</p>
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <p className="text-sm text-gray-700">Contact your system administrator if you need to modify these settings.</p>
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Version</p>
                      <p className="text-gray-900 font-medium">FETS POINT v2.0.1</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Last Updated</p>
                      <p className="text-gray-900 font-medium">September 19, 2025</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Database</p>
                      <p className="text-gray-900 font-medium">PostgreSQL 15.3</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Environment</p>
                      <p className="text-gray-900 font-medium">Production</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false)
                  resetPasswordForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
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
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter your new password"
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
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
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
                
                {/* Error Message */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-sm text-red-700">{passwordError}</p>
                    </div>
                  </div>
                )}
                
                {/* Success Message */}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-green-700">{passwordSuccess}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    resetPasswordForm()
                  }}
                  className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
