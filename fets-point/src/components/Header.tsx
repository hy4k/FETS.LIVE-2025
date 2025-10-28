
import { LogOut, Bell, Menu, X, Moon, Sun, User, Command } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useBranch } from '../hooks/useBranch';
import { RealtimeIndicator } from './RealtimeIndicators';

interface HeaderProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  hideBranchSelector?: boolean;
}

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen, hideBranchSelector = false }: HeaderProps = {}) {
  const { signOut, profile, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { activeBranch, setActiveBranch, userAccessLevel } = useBranch();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'User';
  };

  const getUserRole = () => {
    if (profile?.role) {
      return profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
    }
    return 'Super Admin';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      {/* PREMIUM HEADER - Taller with seamless flow */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 backdrop-blur-lg shadow-2xl transition-all duration-300`}>
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left Side: Mobile Menu, Logo & Greeting */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              {isMobile && setSidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 shadow-sm"
                  aria-label="Toggle navigation menu"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5 text-black" />
                  ) : (
                    <Menu className="h-5 w-5 text-black" />
                  )}
                </button>
              )}

              {/* Logo - Enhanced */}
              <div className="w-10 h-10 bg-gradient-to-br from-black/30 to-black/20 rounded-xl flex items-center justify-center shadow-lg border border-black/10">
                <Command className="h-5 w-5 text-black font-bold" />
              </div>

              {/* Greeting - Enhanced typography */}
              <div className="hidden sm:block">
                <div className="text-lg font-extrabold text-black tracking-tight" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                  {getGreeting()}, {getDisplayName()}
                </div>
                <div className="text-sm text-black/70 font-medium">
                  All Centres • {getCurrentTime()}
                </div>
              </div>
            </div>

            {/* Center: Branch Selector - Premium Design */}
            {!isMobile && !hideBranchSelector && (
              <div className="flex items-center gap-2 bg-black/15 backdrop-blur-md rounded-2xl p-1.5 border border-black/20 shadow-xl">
                <button
                  onClick={() => setActiveBranch('calicut')}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeBranch === 'calicut'
                      ? 'bg-gradient-to-r from-black/30 to-black/25 text-black shadow-xl transform scale-105 border border-black/30'
                      : 'text-black/70 hover:text-black hover:bg-black/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Calicut
                </button>
                <button
                  onClick={() => setActiveBranch('cochin')}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeBranch === 'cochin'
                      ? 'bg-gradient-to-r from-black/30 to-black/25 text-black shadow-xl transform scale-105 border border-black/30'
                      : 'text-black/70 hover:text-black hover:bg-black/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Cochin
                </button>
                {(userAccessLevel === 'super_admin' || userAccessLevel === 'admin') && (
                  <button
                    onClick={() => setActiveBranch('global')}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      activeBranch === 'global'
                        ? 'bg-gradient-to-r from-black/30 to-black/25 text-black shadow-xl transform scale-105 border border-black/30'
                        : 'text-black/70 hover:text-black hover:bg-black/10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Global
                  </button>
                )}
              </div>
            )}

            {/* Right Side: Actions - Enhanced */}
            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 relative shadow-sm">
                  <Bell className="h-5 w-5 text-black" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-white text-[10px] font-bold">3</span>
                  </span>
                </button>

                {/* User Avatar - Enhanced */}
                <div className="w-10 h-10 bg-gradient-to-br from-black/30 to-black/20 rounded-xl flex items-center justify-center shadow-lg border border-black/10">
                  <span className="text-black text-base font-extrabold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Sign Out - Enhanced */}
                <button
                  onClick={handleSignOut}
                  className="hidden sm:block p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rounded bottom edge with subtle shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/5 rounded-b-3xl"></div>
      </div>

      {/* SPACER - Taller to accommodate larger header */}
      <div className="h-32"></div>
    </>
  )
}