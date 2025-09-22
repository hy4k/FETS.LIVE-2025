import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Check, Clock, AlertTriangle } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface NotificationPanelProps {
  onClose: () => void
  onMarkAllRead: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
}

export function NotificationPanel({ onClose, onMarkAllRead }: NotificationPanelProps) {
  // Mock notifications (replace with real data)
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New Candidate Registered',
      message: 'John Smith has been scheduled for tomorrow\'s exam',
      time: '2 minutes ago',
      type: 'success',
      read: false
    },
    {
      id: '2',
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight at 11 PM',
      time: '1 hour ago',
      type: 'info',
      read: false
    },
    {
      id: '3',
      title: 'Incident Resolved',
      message: 'Network connectivity issue has been fixed',
      time: '3 hours ago',
      type: 'success',
      read: true
    },
    {
      id: '4',
      title: 'Task Deadline Approaching',
      message: 'Complete weekly reports by Friday',
      time: '1 day ago',
      type: 'warning',
      read: true
    }
  ]
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'error': return <AlertTriangle size={16} />
      default: return <Bell size={16} />
    }
  }
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="notification-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <motion.div
        className="notification-panel"
        initial={{ opacity: 0, x: 300, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <GlassCard className="notification-container">
          {/* Header */}
          <div className="notification-header">
            <div className="notification-title">
              <Bell size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <div className="unread-badge">{unreadCount}</div>
              )}
            </div>
            
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read"
                  onClick={onMarkAllRead}
                >
                  Mark all read
                </button>
              )}
              <button className="close-button" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <h4 className="notification-item-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <Clock size={12} />
                      <span>{notification.time}</span>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="unread-indicator" />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="no-notifications">
                <Bell size={32} />
                <p>No notifications</p>
                <span>You're all caught up!</span>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  )
}