import { useAuth } from '../context/useAuth'
import './Sidebar.css'

export default function Sidebar({
  activeView,
  setActiveView,
  onOpenExplore,
  mobileOpen,
  setMobileOpen,
  unreadCount = 0,
}) {
  const { user } = useAuth()
  const userRole = user?.role || 'STUDENT'

  const handleNavClick = (view) => {
    setActiveView(view)
    if (setMobileOpen) setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="cd-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`cd-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div
          className="cd-sidebar-brand"
          onClick={() => handleNavClick('home')}
          role="button"
          tabIndex={0}
        >
          <div className="cd-brand-logo-wrap">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h8" />
              <path d="M8 17h5" />
            </svg>
          </div>
          <span className="cd-brand-name">CampusDocs</span>
        </div>

        {/* Navigation List */}
        <nav className="cd-sidebar-nav">
          <button
            type="button"
            className={`cd-nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <span className="cd-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="cd-nav-label">Home</span>
          </button>

          <button
            type="button"
            className={`cd-nav-item ${activeView === 'documents' ? 'active' : ''}`}
            onClick={() => handleNavClick('documents')}
          >
            <span className="cd-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="cd-nav-label">My Documents</span>
          </button>

          <button
            type="button"
            className={`cd-nav-item ${activeView === 'friends' ? 'active' : ''}`}
            onClick={() => handleNavClick('friends')}
          >
            <span className="cd-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="cd-nav-label">Friends</span>
          </button>

          {userRole === 'STUDENT' && (
            <button
              type="button"
              className={`cd-nav-item ${activeView === 'mentor' ? 'active' : ''}`}
              onClick={() => handleNavClick('mentor')}
            >
              <span className="cd-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </span>
              <span className="cd-nav-label">My Faculty Mentor</span>
            </button>
          )}

          {(userRole === 'MENTOR' || userRole === 'ADMIN') && (
            <button
              type="button"
              className={`cd-nav-item ${activeView === 'mentorship' ? 'active' : ''}`}
              onClick={() => handleNavClick('mentorship')}
            >
              <span className="cd-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="cd-nav-label">Mentor Workspace</span>
            </button>
          )}

          {userRole === 'ADMIN' && (
            <button
              type="button"
              className={`cd-nav-item ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <span className="cd-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="cd-nav-label">Admin Console</span>
            </button>
          )}

          <button
            type="button"
            className={`cd-nav-item ${activeView === 'notifications' ? 'active' : ''}`}
            onClick={() => handleNavClick('notifications')}
          >
            <span className="cd-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className="cd-nav-label">Notifications</span>
            {unreadCount > 0 && <span className="cd-badge-pill">{unreadCount}</span>}
          </button>

        </nav>

        {/* Bottom Section: Settings pinned to bottom of sidebar */}
        <div className="cd-sidebar-bottom">
          <button
            type="button"
            className={`cd-nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span className="cd-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="cd-nav-label">Settings</span>
          </button>
        </div>
      </aside>
    </>
  )
}
