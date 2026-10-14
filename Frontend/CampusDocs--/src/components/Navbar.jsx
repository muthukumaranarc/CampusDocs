import { useAuth } from '../context/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10"/>
            <path d="M6 10h10"/>
          </svg>
        </div>
        <span className="brand-title">CampusDocs</span>
      </div>

      {user && (
        <div className="navbar-actions">
          <div className="user-badge">
            {user.pictureUrl ? (
              <img src={user.pictureUrl} alt={user.displayName} className="user-avatar" />
            ) : (
              <div className="avatar-fallback">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="user-info-snippet">
              <span className="user-name">{user.displayName || 'User'}</span>
              <span className="user-email-snippet">{user.email}</span>
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
  )
}
