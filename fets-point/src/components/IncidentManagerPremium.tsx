import React from 'react'
import IncidentManager from './IncidentManager'

/**
 * Premium wrapper for Incident Manager with unified design system styling
 * Applies red color scheme to match unified design system for red-themed pages
 * Preserves all original functionality while enhancing visual appearance
 */
export function IncidentManagerPremium() {
  return (
    <div className="page-wrapper--incident-manager">
      <style>{`
        .page-wrapper--incident-manager {
          background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 25%, #FCA5A5 50%, #F87171 75%, #EF4444 100%);
          background-size: 400% 400%;
          animation: subtle-gradient-shift 15s ease infinite;
          min-h-screen;
        }

        @keyframes subtle-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Override incident manager header styles */
        .page-wrapper--incident-manager .bg-white.border-b {
          background: linear-gradient(to right, rgba(255,255,255,0.95), rgba(254,242,242,0.95)) !important;
        }

        /* Enhance stat cards with red accent */
        .page-wrapper--incident-manager .stat-card {
          border-left: 4px solid #EF4444;
        }

        /* Priority badge styling */
        .page-wrapper--incident-manager .priority-critical {
          background-color: #FEE2E2 !important;
          border-left-color: #EF4444 !important;
        }

        .page-wrapper--incident-manager .priority-major {
          background-color: #FEF3C7 !important;
          border-left-color: #F59E0B !important;
        }

        .page-wrapper--incident-manager .priority-minor {
          background-color: #DBEAFE !important;
          border-left-color: #3B82F6 !important;
        }
      `}</style>

      <IncidentManager />
    </div>
  )
}

export default IncidentManagerPremium
