import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, config } from '../lib/supabase'
import { Shield, Lock } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('mithun@fets.in')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (import.meta.env.DEV) {
        console.log('Login attempt for:', email)
        console.log('Supabase config:', config)
      }
      
      // Test connection first if in development
      if (import.meta.env.DEV) {
        const { error: testError } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
        if (testError) {
          console.error('Connection test failed:', testError)
          setError(`Connection failed: ${testError.message}`)
          setLoading(false)
          return
        }
        console.log('Connection test passed, proceeding with login')
      }
      
      const { error } = await signIn(email, password)
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Login failed:', error)
        }
        setError(`Login failed: ${error.message}`)
      } else {
        if (import.meta.env.DEV) {
          console.log('Login successful!')
        }
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Login exception:', err)
      }
      setError(`Exception: ${err.message || 'Login failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #FFD633 100%)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Ambient Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-orange-300/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/15 rounded-full blur-lg"></div>
      </div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md mx-auto">
          {/* FETS.LIVE 3D Logo */}
          <div className="mb-8">
            <div className="relative inline-block mb-6">
              {/* 3D Golden Cube Effect */}
              <div className="relative">
                <img 
                  src="/fets-live-logo.jpg" 
                  alt="FETS.LIVE" 
                  className="h-24 w-24 mx-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                  style={{
                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3)) drop-shadow(0 0 10px rgba(255,214,51,0.5))'
                  }}
                />
                {/* 3D Side Effects */}
                <div 
                  className="absolute -bottom-2 -right-2 h-24 w-24 rounded-2xl -z-10"
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                    filter: 'blur(2px)'
                  }}
                ></div>
              </div>
            </div>
            
            <h1 
              className="text-4xl font-bold mb-3"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                letterSpacing: '-0.02em'
              }}
            >
              FETS.LIVE
            </h1>
            <p 
              className="text-lg font-medium mb-6"
              style={{
                color: '#374151',
                textShadow: '0 1px 2px rgba(255,255,255,0.5)'
              }}
            >
              Platform Management Console
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-600 to-yellow-500 mx-auto rounded-full shadow-lg"></div>
          </div>

          {/* 3D Glassmorphism Login Card */}
          <div className="relative">
            {/* Main Card */}
            <div 
              className="p-8 rounded-2xl backdrop-blur-lg border border-white/30 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,214,51,0.2) 0%, rgba(251,191,36,0.3) 50%, rgba(245,158,11,0.2) 100%)',
                boxShadow: `
                  0 20px 40px rgba(0,0,0,0.1),
                  0 0 0 1px rgba(255,255,255,0.2),
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.1)
                `
              }}
            >
              {/* Security Header */}
              <div className="text-center mb-6">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #7FC6A4 0%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(127,198,164,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Secure Access
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your credentials to access the platform
                </p>
              </div>

              {/* Development Debug Panel */}
              {import.meta.env.DEV && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50/80 border border-blue-200/50 text-xs">
                  <div className="font-medium mb-1 text-blue-800">Development Mode</div>
                  <div className="text-blue-600 space-y-1">
                    <div>URL: {config.url}</div>
                    <div>Key: {config.keyPreview}</div>
                    <div className="text-green-600 mt-1">
                      Environment: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Fallback'}
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/50">
                    <div className="font-medium text-sm text-red-800">Error:</div>
                    <div className="text-xs mt-1 text-red-600">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/40 focus:outline-none focus:ring-3 focus:ring-mint-green/30 focus:border-mint-green transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.5)',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/40 focus:outline-none focus:ring-3 focus:ring-mint-green/30 focus:border-mint-green transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.5)',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #7FC6A4 0%, #059669 100%)',
                    boxShadow: `
                      0 10px 20px rgba(127,198,164,0.3),
                      0 0 0 1px rgba(255,255,255,0.2),
                      inset 0 1px 0 rgba(255,255,255,0.3),
                      inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <Lock className="h-5 w-5" />
                  <span>{loading ? 'Accessing Platform...' : 'Sign In to FETS.LIVE'}</span>
                </button>
              </form>

              {import.meta.env.DEV && (
                <div className="mt-4 text-center text-xs text-gray-500">
                  Test Credentials: mithun@fets.in / 123456
                </div>
              )}
            </div>

            {/* 3D Card Shadow/Depth Effect */}
            <div 
              className="absolute -bottom-2 -right-2 w-full h-full rounded-2xl -z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(217,119,6,0.3) 0%, rgba(146,64,14,0.4) 100%)',
                filter: 'blur(3px)'
              }}
            ></div>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-2 mt-8">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg"></div>
            <div className="w-3 h-3 rounded-full bg-amber-600 shadow-lg"></div>
            <div className="w-3 h-3 rounded-full bg-orange-600 shadow-lg"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm font-medium" style={{ color: '#374151', textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>
          Copyright © 2025 FORUN TESTING AND EDUCATIONAL SERVICES
        </p>
      </div>
    </div>
  )
}
