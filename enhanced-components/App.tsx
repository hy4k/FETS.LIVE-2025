import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Login } from './components/Login'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useIsMobile, useScreenSize } from './hooks/use-mobile'
import { useState } from 'react'

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'))
const CandidateTracker = lazy(() => import('./components/CandidateTracker'))
const FetsRoster = lazy(() => import('./components/FetsRoster'))
const FetsCalendar = lazy(() => import('./components/FetsCalendar'))
const StaffManagement = lazy(() => import('./components/StaffManagement'))
const FetsVault = lazy(() => import('./components/FetsVault'))
const FetsIntelligence = lazy(() => import('./components/FetsIntelligence'))
const LogIncident = lazy(() => import('./components/LogIncident'))
const ChecklistManagement = lazy(() => import('./components/ChecklistManagement'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

// Enhanced Loading Component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      <span className="ml-2 text-sm text-gray-600">Loading...</span>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('command-center')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isMobile = useIsMobile()
  const screenSize = useScreenSize()

  if (loading) {
    return (
      <div className="golden-theme flex items-center justify-center relative min-h-screen">
        <div className="text-center relative z-10 px-4">
          <div className="golden-logo inline-block mb-8 golden-pulse">
            <img 
              src="/fets-point-logo.png" 
              alt="FETS POINT" 
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>
          <h1 className="golden-title mb-4 text-2xl sm:text-3xl">FETS POINT</h1>
          <p className="golden-subtitle mb-8 text-sm sm:text-base">Loading Operational Platform Management Console...</p>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderContent = () => {
    const componentMap = {
      'command-center': <Dashboard onNavigate={setActiveTab} />,
      'candidate-tracker': <CandidateTracker />,
      'fets-roster': <FetsRoster />,
      'fets-calendar': <FetsCalendar />,
      'staff-management': <StaffManagement />,
      'fets-vault': <FetsVault />,
      'fets-intelligence': <FetsIntelligence />,
      'log-incident': <LogIncident />,
      'checklist-management': <ChecklistManagement />,
      'settings': <SettingsPage />,
    }

    const Component = componentMap[activeTab] || componentMap['command-center']
    
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary>
          {Component}
        </ErrorBoundary>
      </Suspense>
    )
  }

  return (
    <div className="golden-theme min-h-screen relative">
      <Header 
        isMobile={isMobile} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
      {!isMobile && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isMobile={false}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
      )}
      
      {isMobile && sidebarOpen && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setSidebarOpen(false)
          }}
          isMobile={true}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="content-with-single-banner">
        <div className="dashboard-centered">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App