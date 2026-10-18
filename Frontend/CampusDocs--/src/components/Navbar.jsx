import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import SettingsModal from './SettingsModal'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span className="brand-title">CampusDocs</span>
        </div>

        {user && (
          <div className="navbar-actions">
            {/* Clickable Profile Badge */}
            <div
              className="user-badge clickable-user-badge"
              onClick={() => setShowSettings(true)}
              title="Click your profile to open Account Settings"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowSettings(true)
                }
              }}
            >
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt={user.displayName} className="user-avatar" />
              ) : (
                <div className="avatar-fallback">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="user-info-snippet">
                <div className="user-name-row">
                  <span className="user-name">{user.displayName || 'User'}</span>
                  <span className={`role-pill-nav role-pill-${user.role?.toLowerCase() || 'student'}`}>
                    {user.role === 'MENTOR' ? '👥 Mentor' : user.role === 'ADMIN' ? '🛡️ Admin' : '🎓 Student'}
                  </span>
                </div>
                <span className="user-email-snippet">{user.email}</span>
              </div>

              {/* Quick Settings Icon Hint */}
              <div className="settings-badge-icon" title="Settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out of CampusDocs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
