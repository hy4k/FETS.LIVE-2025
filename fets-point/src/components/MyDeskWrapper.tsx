import { useState } from 'react';
import { MessageSquare, FolderLock } from 'lucide-react';
import FetsConnectNew from './FetsConnectNew';
import ResourceCentre from './ResourceCentre';

export default function MyDeskWrapper() {
  const [activeTab, setActiveTab] = useState<'feed' | 'resources'>('feed');

  const tabs = [
    { id: 'feed' as const, label: 'Feed', icon: MessageSquare },
    { id: 'resources' as const, label: 'Resources', icon: FolderLock }
  ];

  return (
    <div className="min-h-screen -mt-32 pt-48" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-7xl mx-auto px-8">
        {/* Header with Tabs */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-6" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
            My Desk
          </h1>

          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-white/10 backdrop-blur-md p-2 rounded-xl inline-flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
                    ${isActive
                      ? 'bg-white text-purple-700 shadow-lg transform scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === 'feed' && <FetsConnectNew />}
          {activeTab === 'resources' && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <ResourceCentre />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
