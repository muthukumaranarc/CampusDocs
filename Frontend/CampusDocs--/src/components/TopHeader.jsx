import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { notificationService } from '../services/api'
import defaultAvatar from '../assets/default-avatar.png'
import './TopHeader.css'

export default function TopHeader({
  onOpenNotifications,
  onOpenSettings,
  onToggleMobileMenu,
  onConnectDrive,
  isDriveConnected,
  isFolderReady,
  folderId,
  unreadCount: externalUnreadCount,
}) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [internalUnreadCount, setInternalUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const unreadCount = externalUnreadCount !== undefined ? externalUnreadCount : internalUnreadCount

  // Fetch real unread notification count if not provided externally
  useEffect(() => {
    if (externalUnreadCount !== undefined) return
    let active = true
    notificationService.getUnreadCount()
      .then((res) => {
        if (active && res && typeof res.unreadCount === 'number') {
          setInternalUnreadCount(res.unreadCount)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [externalUnreadCount])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userDisplayName = user?.displayName || user?.email || 'User'

  return (
    <header className="cd-top-header">
      {/* Left: Mobile Menu Toggle */}
      <div className="cd-header-left">
        <button
          type="button"
          className="cd-mobile-toggle-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Right: Notification Bell & User Profile Dropdown */}
      <div className="cd-header-right">
        {/* Notification Bell */}
        <button
          type="button"
          className="cd-bell-btn"
          onClick={onOpenNotifications}
          title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'Notifications'}
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && <span className="cd-bell-dot" />}
        </button>

        {/* User Pill Dropdown */}
        <div className="cd-user-menu-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={`cd-user-pill-btn ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <div className="cd-user-avatar-wrap">
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={userDisplayName}
                  className="cd-user-avatar-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = defaultAvatar
                  }}
                />
              ) : (
                <img
                  src={defaultAvatar}
                  alt={userDisplayName}
                  className="cd-user-avatar-img"
                />
              )}
            </div>
            <span className="cd-user-name">{userDisplayName}</span>
            <svg
              className={`cd-chevron-icon ${dropdownOpen ? 'rotate' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="cd-user-dropdown-popover animate-fade-in">
              <div className="cd-dropdown-header">
                <p className="cd-dropdown-name">{userDisplayName}</p>
                <p className="cd-dropdown-email">{user?.email}</p>
                <div className="cd-dropdown-badge-row">
                  <span className={`cd-role-badge cd-role-${(user?.role || 'student').toLowerCase()}`}>
                    {user?.role === 'MENTOR' ? '👥 Mentor' : user?.role === 'ADMIN' ? '🛡️ Admin' : '🎓 Student'}
                  </span>
                  {user?.department && (
                    <span className="cd-dept-badge">{user.department}</span>
                  )}
                </div>
              </div>

              <div className="cd-dropdown-divider" />

              {/* Google Drive Status snippet */}
              <div className="cd-dropdown-drive-box">
                <div className="cd-dropdown-drive-status">
                  <span className={`cd-drive-indicator ${isDriveConnected ? 'connected' : 'disconnected'}`} />
                  <span className="cd-dropdown-drive-text">
                    Google Drive: <strong>{isDriveConnected ? 'Connected' : 'Not Connected'}</strong>
                  </span>
                </div>
                {isFolderReady && folderId ? (
                  <a
                    href={`https://drive.google.com/drive/folders/${folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cd-dropdown-drive-link"
                  >
                    Open Drive Folder ↗
                  </a>
                ) : !isDriveConnected ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      onConnectDrive()
                    }}
                    className="cd-dropdown-drive-connect-btn"
                  >
                    Connect Account
                  </button>
                ) : null}
              </div>

              <div className="cd-dropdown-divider" />

              <div className="cd-dropdown-links">
                <button
                  type="button"
                  className="cd-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false)
                    onOpenSettings()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Profile & Settings</span>
                </button>

                <button
                  type="button"
                  className="cd-dropdown-item cd-dropdown-item-danger"
                  onClick={() => {
                    setDropdownOpen(false)
                    logout()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
