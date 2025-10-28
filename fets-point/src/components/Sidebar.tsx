import {
  Users,
  UserCog,
  Settings,
  Calendar,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Home,
  Vault,
  Bell,
  LayoutDashboard,
  UserSearch,
  CalendarDays,
  MessageSquare,
  ShieldAlert,
  FolderLock,
  UsersRound,
  Megaphone,
  Sliders,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isMobile?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  setIsCollapsed?: (collapsed: boolean) => void
}

interface NavigationItem {
  id: string
  name: string
  icon: any
  badge?: string | number
  group?: string
  role?: string[]
}

// NAVIGATION STRUCTURE - PREMIUM ICONS FOR VISUAL RECOGNITION
const navigationGroups = {
  operations: [
    { id: 'command-center', name: 'Command Centre', icon: LayoutDashboard, badge: 'Home' },
    { id: 'candidate-tracker', name: 'Candidate Tracker', icon: UserSearch },
    { id: 'fets-roster', name: 'FETS Roster', icon: UserCheck },
    { id: 'fets-calendar', name: 'FETS Calendar', icon: CalendarDays },
    { id: 'incident-manager', name: 'Incident Manager', icon: ShieldAlert },
  ],
  compliance: [
    { id: 'fets-connect', name: 'FETS Connect', icon: MessageSquare, badge: 'NEW' },
    { id: 'fets-vault', name: 'Resource Centre', icon: FolderLock },
  ],
  admin: [
    { id: 'fets-manager', name: 'FETS Manager', icon: Shield, role: ['super_admin', 'admin'], badge: 'ADMIN' },
    { id: 'settings', name: 'Settings', icon: Sliders },
  ]
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isMobile = false, 
  onClose,
  isCollapsed = false,
  setIsCollapsed
}: SidebarProps) {

  const { profile } = useAuth();

  const handleItemClick = (item: NavigationItem) => {
    setActiveTab(item.id)
    if (isMobile && onClose) {
      onClose()
    }
  }

  const renderMenuItem = (item: NavigationItem) => {
    const Icon = item.icon
    const isActive = activeTab === item.id

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`reference-menu-item group ${isActive ? 'active' : ''}`}
        title={isCollapsed ? item.name : undefined}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className={`reference-menu-icon ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
          <Icon size={isCollapsed ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {!isCollapsed && (
          <>
            <span className="reference-menu-text group-hover:translate-x-1 transition-transform duration-300" style={{
              fontSize: '0.9375rem',
              fontWeight: isActive ? '700' : '600',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              {item.name}
            </span>
            {item.badge && (
              <span className={`reference-menu-badge ${isActive ? 'active' : ''} group-hover:scale-110 transition-transform duration-300`}>
                {item.badge}
              </span>
            )}
          </>
        )}
        {/* Hover effect indicator */}
        {!isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-r-full group-hover:h-8 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
        )}
      </button>
    )
  }

  const sidebarClassName = `reference-glassmorphic-sidebar ${
    isMobile ? 'w-96' : isCollapsed ? 'w-24' : 'w-96'
  }`

  const sidebarContent = (
    <div className={sidebarClassName}>
      {/* Brand Area - Premium Bold Design */}
      <div className="reference-brand-area">
        {!isCollapsed || isMobile ? (
          <>
            <div className="reference-brand-logo group mb-4">
              <div className="relative">
                {/* Glow effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <img
                  src="/fets-live-golden-logo.jpg"
                  alt="FETS.LIVE"
                  className="h-40 w-full object-cover relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  style={{ filter: 'drop-shadow(0 8px 24px rgba(245, 158, 11, 0.4))' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center group">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <img
                src="/fets-live-golden-logo.jpg"
                alt="FETS.LIVE"
                className="h-16 w-auto object-contain mx-auto relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                style={{ filter: 'drop-shadow(0 6px 16px rgba(245, 158, 11, 0.4))' }}
              />
            </div>
          </div>
        )}
        
        {/* Desktop Collapse Toggle */}
        {!isMobile && setIsCollapsed && (
          <div className="absolute top-6 right-6">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-white/20 transition-all"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-gray-600" />
              ) : (
                <ChevronLeft size={16} className="text-gray-600" />
              )}
            </button>
          </div>
        )}
        
        {/* Mobile Close Button */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/20 transition-all"
            aria-label="Close navigation menu"
          >
            <X size={20} className="text-gray-600" />
          </button>
        )}
      </div>
      
      {/* Navigation Area - Exactly matching reference */}
      <div className="reference-navigation-area">
        {Object.entries(navigationGroups).map(([groupName, items]) => {
          const sectionTitles: { [key: string]: string } = {
            operations: 'OPERATIONS',
            compliance: 'COMPLIANCE', 
            admin: 'ADMIN'
          }
          
          let itemsToRender = items;
          if (groupName === 'admin') {
            itemsToRender = items.filter(item => {
              if (item.role) {
                return item.role.includes(profile?.role || '');
              }
              return true;
            });
          }

          return (
            itemsToRender.length > 0 && <div key={groupName} className="reference-menu-section">
              {!isCollapsed && (
                <div className="reference-section-label">
                  {sectionTitles[groupName]}
                </div>
              )}
              <div className="reference-menu-items">
                {itemsToRender.map(renderMenuItem)}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Footer - Matching reference */}
      <div className="reference-sidebar-footer">
        {!isCollapsed || isMobile ? (
          <>
            <div className="reference-footer-version">FETS.LIVE v2.0</div>
            <div className="reference-footer-caption">Platform Management Console</div>
          </>
        ) : (
          <div className="text-center">
            <div className="reference-footer-version">v2.0</div>
          </div>
        )}
      </div>
    </div>
  )

  // For mobile, wrap in overlay
  if (isMobile && onClose) {
    return (
      <div className="mobile-sidebar" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          {sidebarContent}
        </div>
      </div>
    )
  }

  return sidebarContent
}