import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, FolderLock } from 'lucide-react'
import FetsConnectNew from './FetsConnectNew'
import ResourceCentre from './ResourceCentre'

export function MyDeskNew() {
  const [activeTab, setActiveTab] = useState<'connect' | 'resources'>('connect')

  const tabs = [
    { id: 'connect' as const, label: 'FETS Connect', icon: MessageSquare },
    { id: 'resources' as const, label: 'Resource Centre', icon: FolderLock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header with Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              My Desk
            </h1>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-6 py-3 font-medium transition-all duration-200 flex items-center space-x-2
                      ${isActive
                        ? 'text-amber-600'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'connect' && <FetsConnectNew />}
        {activeTab === 'resources' && <ResourceCentre />}
      </div>
    </div>
  )
}

export default MyDeskNew
