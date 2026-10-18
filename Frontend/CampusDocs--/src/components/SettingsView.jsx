import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { userService } from '../services/api'
import defaultAvatar from '../assets/default-avatar.png'
import muthuAvatar from '../assets/muthu-avatar.png'
import './SettingsView.css'

export default function SettingsView({
  initialTab = 'overview',
  onNotification,
  onConnectDrive,
  isDriveConnected,
  isFolderReady,
  folderId,
}) {
  const { user, setUser, logout } = useAuth()

  // Tab navigation inside settings:
  // 'overview' (profile overview) | 'edit' (edit profile) | 'links' (social links) | 'directory' (campus directory) | 'drive' (google drive) | 'security' (security)
  const [activeTab, setActiveTab] = useState(initialTab)

  // Target user being viewed (null = viewing logged in user)
  const [viewedUser, setViewedUser] = useState(null)
  const [loadingViewedUser, setLoadingViewedUser] = useState(false)

  // Directory users list
  const [directoryUsers, setDirectoryUsers] = useState([])
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [directorySearch, setDirectorySearch] = useState('')
  const [directoryFilter, setDirectoryFilter] = useState('ALL')

  // Follow & share states
  const [followingMap, setFollowingMap] = useState({})
  const [copiedLink, setCopiedLink] = useState(false)

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    department: '',
    rollNumber: '',
    phone: '',
    bio: '',
    headline: '',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    otherUrl: '',
  })

  // Delete account confirmation
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        setFormData({
          displayName: user.displayName || '',
          age: user.age != null ? String(user.age) : '',
          department: user.department || '',
          rollNumber: user.rollNumber || '',
          phone: user.phone || '',
          bio: user.bio || '',
          headline: user.headline || '',
          githubUrl: user.githubUrl || '',
          linkedinUrl: user.linkedinUrl || '',
          websiteUrl: user.websiteUrl || '',
          twitterUrl: user.twitterUrl || '',
          otherUrl: user.otherUrl || '',
        })
      })
    }
  }, [user])

  // Load campus directory
  useEffect(() => {
    let active = true
    setLoadingDirectory(true)
    userService.getCampusDirectory()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setDirectoryUsers(data)
        }
      })
      .catch((err) => {
        console.warn('Could not load campus directory via API:', err)
        if (active) {
          setDirectoryUsers([])
        }
      })
      .finally(() => {
        if (active) setLoadingDirectory(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (successMsg) setSuccessMsg('')
    if (errorMsg) setErrorMsg('')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const payload = {
        displayName: formData.displayName,
        age: formData.age ? parseInt(formData.age, 10) : null,
        department: formData.department,
        rollNumber: formData.rollNumber,
        phone: formData.phone,
        bio: formData.bio,
        headline: formData.headline,
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        websiteUrl: formData.websiteUrl,
        twitterUrl: formData.twitterUrl,
        otherUrl: formData.otherUrl,
      }
      const updatedUser = await userService.updateProfile(payload)
      setUser(updatedUser)
      setSuccessMsg('Your profile and application links have been saved successfully.')
      if (onNotification) {
        onNotification({ type: 'success', text: 'Settings updated successfully!' })
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.'
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    try {
      setDeleting(true)
      await userService.deleteAccount()
      logout()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete account.'
      setErrorMsg(msg)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // View specific user profile from directory
  const handleSelectUserProfile = async (targetUser) => {
    if (!targetUser) return
    if (user && targetUser.id === user.id) {
      setViewedUser(null)
      setActiveTab('overview')
      return
    }

    setLoadingViewedUser(true)
    try {
      const fullProfile = await userService.getUserById(targetUser.id)
      setViewedUser(fullProfile)
    } catch {
      setViewedUser(targetUser)
    } finally {
      setLoadingViewedUser(false)
      setActiveTab('overview')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleToggleFollow = (targetId) => {
    setFollowingMap((prev) => ({
      ...prev,
      [targetId]: !prev[targetId],
    }))
  }

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Effective profile being displayed in Overview / Header
  const currentProfile = viewedUser || user
  const isOwnProfile = !viewedUser || (user && viewedUser.id === user.id)

  const displayName = currentProfile?.displayName || user?.displayName || 'Muthukumaranarc'
  const handleName = currentProfile?.email ? currentProfile.email.split('@')[0] : displayName.toLowerCase().replace(/\s+/g, '')
  const userRole = currentProfile?.role || 'STUDENT'
  const department = currentProfile?.department || 'Computer Science & Engineering'
  const rollNumber = currentProfile?.rollNumber || (userRole === 'MENTOR' ? 'FAC-2024' : '2024CS104')
  const email = currentProfile?.email || 'muthukumaranarc@gmail.com'

  const headline = currentProfile?.headline || (userRole === 'MENTOR'
    ? 'Faculty Mentor & Academic Advisor | Computer Science & Engineering'
    : 'Full Stack Developer | Java • Spring Boot • React')

  const bioText = currentProfile?.bio || (userRole === 'MENTOR'
    ? 'Faculty mentor dedicated to supervising undergraduate coursework, document verification, and academic research.'
    : "I'm a Computer Science student and Full-Stack Developer who enjoys building practical web applications with React and Spring Boot. I actively participate in hackathons and technical competitions, explore new technologies through hands-on projects, and love solving real-world problems with code.")

  const github = currentProfile?.githubUrl ?? (isOwnProfile ? (user?.githubUrl || '') : 'muthukumaranarc')
  const linkedin = currentProfile?.linkedinUrl ?? (isOwnProfile ? (user?.linkedinUrl || '') : 'https://linkedin.com/in/muthukumaranarc')
  const website = currentProfile?.websiteUrl ?? (isOwnProfile ? (user?.websiteUrl || '') : 'https://muthukumaran-portfolio.web.app/')
  const twitter = currentProfile?.twitterUrl ?? (isOwnProfile ? (user?.twitterUrl || '') : '')
  const otherUrl = currentProfile?.otherUrl ?? (isOwnProfile ? (user?.otherUrl || '') : '')

  const avatarSrc = currentProfile?.pictureUrl || (isOwnProfile ? (user?.pictureUrl || muthuAvatar) : defaultAvatar)
  const isFollowingThis = Boolean(followingMap[currentProfile?.id || 'current'])

  // Filtered campus directory
  const filteredDirectory = useMemo(() => {
    return directoryUsers.filter((u) => {
      const matchesSearch =
        u.displayName?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.department?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.rollNumber?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.headline?.toLowerCase().includes(directorySearch.toLowerCase())

      if (directoryFilter === 'STUDENT') return matchesSearch && u.role === 'STUDENT'
      if (directoryFilter === 'MENTOR') return matchesSearch && u.role === 'MENTOR'
      return matchesSearch
    })
  }, [directoryUsers, directorySearch, directoryFilter])

  return (
    <div className="cd-kaggle-page-container animate-fade-in">
      {/* Breadcrumb banner when viewing another student or mentor */}
      {!isOwnProfile && (
        <div className="cd-viewing-other-banner">
          <div className="cd-viewing-other-info">
            <span className="cd-viewing-badge">Public Profile</span>
            <span>You are viewing <strong>{displayName}</strong>&apos;s campus profile.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="cd-back-to-own-btn"
              onClick={() => {
                setViewedUser(null)
                setActiveTab('directory')
              }}
            >
              ← Back to Directory
            </button>
            <button
              type="button"
              className="cd-back-to-own-btn"
              onClick={() => setViewedUser(null)}
            >
              My Profile
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          1. KAGGLE-THEMED HEADER BANNER (SETTINGS & PROFILE)
         ======================================================== */}
      <div className="cd-kaggle-banner-card cd-kaggle-settings-banner">
        {/* Abstract Curved Line Art Graphics */}
        <div className="cd-kaggle-banner-art">
          <svg
            viewBox="0 0 540 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cd-kaggle-svg-curves"
            preserveAspectRatio="none"
          >
            <path d="M100 0C170 80 190 170 270 260" stroke="#f6d376" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            <path d="M270 0C230 90 200 160 140 260" stroke="#f6d376" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            <path d="M0 130C160 145 270 70 540 105" stroke="#f6d376" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            <path d="M210 0C320 65 390 190 460 260" stroke="#f6d376" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            <circle cx="360" cy="120" r="82" stroke="#f6d376" strokeWidth="3.5" opacity="0.85" />
          </svg>
        </div>

        {/* Content */}
        <div className="cd-kaggle-banner-content">
          <div className="cd-kaggle-avatar-ring-outer cd-settings-avatar-ring">
            <div className="cd-kaggle-avatar-ring-inner cd-settings-avatar-inner">
              <img
                src={avatarSrc}
                alt={displayName}
                className="cd-kaggle-avatar-img"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = defaultAvatar
                }}
              />
            </div>
          </div>

          <div className="cd-kaggle-user-meta">
            <span className="cd-kaggle-username">
              @{handleName} {isOwnProfile ? '· Profile & Settings' : '· Public Profile'}
            </span>
            <h1 className="cd-kaggle-display-name">{displayName}</h1>
            <p className="cd-kaggle-headline">{headline}</p>

            <div className="cd-kaggle-joined-row">
              <span className={`cd-role-chip cd-role-${userRole.toLowerCase()}`}>
                {userRole === 'MENTOR' ? '👥 Faculty Mentor' : userRole === 'ADMIN' ? '🛡️ Administrator' : '🎓 Student'}
              </span>
              <span>•</span>
              <span>{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. KAGGLE-STYLE TABS NAVIGATION (ALL PROFILE & SETTINGS)
         ======================================================== */}
      <div className="cd-kaggle-tabs-nav">
        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setViewedUser(null)
            setActiveTab('overview')
          }}
        >
          Profile Overview
        </button>

        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Profile
        </button>

        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'links' ? 'active' : ''}`}
          onClick={() => setActiveTab('links')}
        >
          Social & Links
        </button>

        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          Campus Directory
          <span className="cd-kaggle-count-pill">{directoryUsers.length}</span>
        </button>

        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'drive' ? 'active' : ''}`}
          onClick={() => setActiveTab('drive')}
        >
          Google Drive
        </button>

        <button
          type="button"
          className={`cd-kaggle-tab-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Account Security
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="cd-kaggle-alert cd-kaggle-alert-success animate-fade-in">
          <span>✓ {successMsg}</span>
          <button type="button" className="cd-alert-dismiss" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {errorMsg && (
        <div className="cd-kaggle-alert cd-kaggle-alert-error animate-fade-in">
          <span>⚠️ {errorMsg}</span>
          <button type="button" className="cd-alert-dismiss" onClick={() => setErrorMsg('')}>×</button>
        </div>
      )}

      {/* ========================================================
          3. TAB CONTENT CARDS
         ======================================================== */}
      <div className="cd-kaggle-settings-body">
        {/* TAB 1: Profile Overview (Full Public Profile Presentation) */}
        {activeTab === 'overview' && (
          <div className="cd-kaggle-about-grid animate-fade-in">
            {/* Left Column: Bio & Academic Credentials */}
            <div className="cd-kaggle-left-col">
              <div className="cd-kaggle-bio-section">
                <h2 className="cd-kaggle-section-heading">Bio</h2>
                <p className="cd-kaggle-bio-text">{bioText}</p>
              </div>

              {/* Academic Credentials Card */}
              <div className="cd-kaggle-credentials-card">
                <h3 className="cd-kaggle-subheading">Campus Enrollment Details</h3>
                <div className="cd-kaggle-details-table">
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Department / School</span>
                    <span className="cd-row-value">{department}</span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">
                      {userRole === 'MENTOR' ? 'Staff ID / Designation' : 'Roll Number / Student ID'}
                    </span>
                    <span className="cd-row-value font-mono font-bold text-blue-700">{rollNumber}</span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Role Category</span>
                    <span className="cd-row-value">
                      <span className={`cd-role-chip cd-role-${userRole.toLowerCase()}`}>
                        {userRole === 'MENTOR' ? '👥 Faculty Mentor' : userRole === 'ADMIN' ? '🛡️ Administrator' : '🎓 Student'}
                      </span>
                    </span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Institutional Verification</span>
                    <span className="cd-row-value text-emerald-600 font-semibold">
                      ✓ Verified Academic Credential
                    </span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Personal Google Drive Vault</span>
                    <span className="cd-row-value">
                      {currentProfile?.driveConnected || (isOwnProfile && isDriveConnected) ? (
                        <span className="text-blue-600 font-medium">● Connected (/CampusDocs)</span>
                      ) : (
                        <span className="text-muted">Direct Cloud Integration</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions (Edit/Share/Follow) & Social Links */}
            <div className="cd-kaggle-right-col">
              {/* Top Action Buttons */}
              <div className="cd-kaggle-actions-group">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      className="cd-kaggle-follow-btn"
                      onClick={() => setActiveTab('edit')}
                      title="Edit profile settings"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      className="cd-kaggle-outline-btn"
                      onClick={handleShareProfile}
                      title="Share profile link"
                    >
                      {copiedLink ? '✓ Copied' : 'Share'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`cd-kaggle-follow-btn ${isFollowingThis ? 'following' : ''}`}
                      onClick={() => handleToggleFollow(currentProfile?.id || 'current')}
                    >
                      {isFollowingThis ? '✓ Following' : 'Follow'}
                    </button>
                    <a
                      href={`mailto:${email}`}
                      className="cd-kaggle-outline-btn text-decoration-none"
                      title="Send official email"
                    >
                      Email
                    </a>
                  </>
                )}
              </div>

              {/* Social & Contact Links */}
              <div className="cd-kaggle-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
                <h3 className="cd-kaggle-subheading" style={{ margin: 0 }}>Social & Application Links</h3>
                {isOwnProfile && (
                  <button
                    type="button"
                    className="cd-kaggle-edit-links-btn"
                    onClick={() => setActiveTab('links')}
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ✏️ Edit Links
                  </button>
                )}
              </div>

              <div className="cd-kaggle-links-list">
                {/* GitHub */}
                <div className="cd-kaggle-link-row">
                  <svg className="cd-kaggle-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  {github ? (
                    <a
                      href={github.startsWith('http') ? github : `https://github.com/${github.replace(/^github\.com\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-kaggle-link-anchor"
                    >
                      {github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                    </a>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      className="cd-link-placeholder-btn"
                      onClick={() => setActiveTab('links')}
                    >
                      + Add GitHub profile
                    </button>
                  ) : (
                    <span className="cd-link-not-provided">Not provided</span>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="cd-kaggle-link-row">
                  <svg className="cd-kaggle-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="#0077b5">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  {linkedin ? (
                    <a
                      href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-kaggle-link-anchor"
                    >
                      {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'in/')}
                    </a>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      className="cd-link-placeholder-btn"
                      onClick={() => setActiveTab('links')}
                    >
                      + Add LinkedIn profile
                    </button>
                  ) : (
                    <span className="cd-link-not-provided">Not provided</span>
                  )}
                </div>

                {/* Website / Portfolio */}
                <div className="cd-kaggle-link-row">
                  <svg
                    className="cd-kaggle-link-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {website ? (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-kaggle-link-anchor"
                    >
                      {website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      className="cd-link-placeholder-btn"
                      onClick={() => setActiveTab('links')}
                    >
                      + Add Portfolio / Website
                    </button>
                  ) : (
                    <span className="cd-link-not-provided">Not provided</span>
                  )}
                </div>

                {/* Twitter / X */}
                <div className="cd-kaggle-link-row">
                  <svg className="cd-kaggle-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {twitter ? (
                    <a
                      href={twitter.startsWith('http') ? twitter : `https://x.com/${twitter.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-kaggle-link-anchor"
                    >
                      {twitter.startsWith('@') ? twitter : `@${twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '')}`}
                    </a>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      className="cd-link-placeholder-btn"
                      onClick={() => setActiveTab('links')}
                    >
                      + Add Twitter / X
                    </button>
                  ) : (
                    <span className="cd-link-not-provided">Not provided</span>
                  )}
                </div>

                {/* Coding & Technical Platforms (LeetCode, Kaggle, Codeforces, etc.) */}
                <div className="cd-kaggle-link-row">
                  <svg className="cd-kaggle-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  {otherUrl ? (
                    <a
                      href={otherUrl.startsWith('http') ? otherUrl : `https://${otherUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-kaggle-link-anchor"
                    >
                      {otherUrl.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      className="cd-link-placeholder-btn"
                      onClick={() => setActiveTab('links')}
                    >
                      + Add Coding Platform (LeetCode, Kaggle)
                    </button>
                  ) : (
                    <span className="cd-link-not-provided">Not provided</span>
                  )}
                </div>

                {/* Email */}
                <div className="cd-kaggle-link-row">
                  <svg
                    className="cd-kaggle-link-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5f6368"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <a href={`mailto:${email}`} className="cd-kaggle-link-anchor">
                    {email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Edit Profile (Personal & Academic Details Form) */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="cd-kaggle-settings-card animate-fade-in">
            <div className="cd-settings-card-head">
              <h2 className="cd-kaggle-section-heading">Personal & Academic Details</h2>
              <p className="cd-settings-card-subtitle">
                This information is displayed publicly on your CampusDocs profile card.
              </p>
            </div>

            <div className="cd-kaggle-form-grid">
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-displayName">
                  Full Name / Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-displayName"
                  type="text"
                  name="displayName"
                  className="cd-kaggle-input"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-headline">
                  Headline / Title
                </label>
                <input
                  id="settings-headline"
                  type="text"
                  name="headline"
                  className="cd-kaggle-input"
                  placeholder="e.g. Full Stack Developer | Java • Spring Boot • React"
                  value={formData.headline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-dept">
                  Department / Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-dept"
                  type="text"
                  name="department"
                  className="cd-kaggle-input"
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-roll">
                  {userRole === 'MENTOR' ? 'Staff ID / Designation' : 'Roll Number / Student ID'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-roll"
                  type="text"
                  name="rollNumber"
                  className="cd-kaggle-input"
                  placeholder={userRole === 'MENTOR' ? 'e.g. FAC-CSE-018' : 'e.g. 2024CS104'}
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-age">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-age"
                  type="number"
                  name="age"
                  min="14"
                  max="100"
                  className="cd-kaggle-input"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-phone">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  name="phone"
                  className="cd-kaggle-input"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="cd-kaggle-form-group mt-4">
              <label className="cd-kaggle-label" htmlFor="settings-bio">
                {userRole === 'MENTOR' ? 'Office Hours & Guidance Notes' : 'Academic Goals & Bio'}
              </label>
              <textarea
                id="settings-bio"
                name="bio"
                rows="4"
                className="cd-kaggle-textarea"
                placeholder="Share a brief overview of your background, learning goals, or research interests..."
                value={formData.bio}
                onChange={handleInputChange}
              />
              <span className="cd-kaggle-input-hint">
                Brief markdown or plain text bio shown on your profile overview card.
              </span>
            </div>

            {/* Section Divider */}
            <div style={{ margin: '24px 0 16px', borderTop: '1px solid #e2e8f0' }} />

            <div className="cd-settings-card-head">
              <h2 className="cd-kaggle-section-heading">Application & Social Links</h2>
              <p className="cd-settings-card-subtitle">
                Connect your developer repositories, professional profiles, and portfolio platforms.
              </p>
            </div>

            <div className="cd-kaggle-form-grid">
              {/* GitHub */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-edit-github">
                  GitHub Username or URL
                </label>
                <input
                  id="settings-edit-github"
                  type="text"
                  name="githubUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. muthukumaranarc or https://github.com/..."
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* LinkedIn */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-edit-linkedin">
                  LinkedIn Profile URL
                </label>
                <input
                  id="settings-edit-linkedin"
                  type="text"
                  name="linkedinUrl"
                  className="cd-kaggle-input"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Portfolio Website */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-edit-website">
                  Portfolio / Personal Website
                </label>
                <input
                  id="settings-edit-website"
                  type="text"
                  name="websiteUrl"
                  className="cd-kaggle-input"
                  placeholder="https://yourportfolio.dev"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Twitter / X */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-edit-twitter">
                  Twitter / X Profile
                </label>
                <input
                  id="settings-edit-twitter"
                  type="text"
                  name="twitterUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. @username or https://x.com/username"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Coding Platform */}
              <div className="cd-kaggle-form-group cd-full-width">
                <label className="cd-kaggle-label" htmlFor="settings-edit-other">
                  Coding / Platform Profile (LeetCode, Kaggle, Codeforces, HackerRank, etc.)
                </label>
                <input
                  id="settings-edit-other"
                  type="text"
                  name="otherUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. https://leetcode.com/u/yourname"
                  value={formData.otherUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="cd-kaggle-form-actions">
              <button
                type="submit"
                className="cd-kaggle-follow-btn"
                disabled={saving}
              >
                {saving ? 'Saving Profile & Links...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Social & Portfolio Links Form */}
        {activeTab === 'links' && (
          <form onSubmit={handleSaveProfile} className="cd-kaggle-settings-card animate-fade-in">
            <div className="cd-settings-card-head">
              <h2 className="cd-kaggle-section-heading">Social & Application Links</h2>
              <p className="cd-settings-card-subtitle">
                Add links to your code repositories, professional networks, personal projects, and coding challenge platforms.
              </p>
            </div>

            <div className="cd-kaggle-form-grid">
              {/* GitHub */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-github">
                  GitHub Username or Profile URL
                </label>
                <input
                  id="settings-github"
                  type="text"
                  name="githubUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. muthukumaranarc or https://github.com/..."
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* LinkedIn */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-linkedin">
                  LinkedIn Profile URL
                </label>
                <input
                  id="settings-linkedin"
                  type="text"
                  name="linkedinUrl"
                  className="cd-kaggle-input"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Portfolio / Personal Website */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-website">
                  Portfolio / Personal Website
                </label>
                <input
                  id="settings-website"
                  type="text"
                  name="websiteUrl"
                  className="cd-kaggle-input"
                  placeholder="https://yourportfolio.dev"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Twitter / X */}
              <div className="cd-kaggle-form-group">
                <label className="cd-kaggle-label" htmlFor="settings-twitter">
                  Twitter / X Profile
                </label>
                <input
                  id="settings-twitter"
                  type="text"
                  name="twitterUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. @username or https://x.com/username"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Coding Platform */}
              <div className="cd-kaggle-form-group cd-full-width">
                <label className="cd-kaggle-label" htmlFor="settings-other">
                  Coding Platform / Other Application Link (LeetCode, HackerRank, Kaggle, etc.)
                </label>
                <input
                  id="settings-other"
                  type="text"
                  name="otherUrl"
                  className="cd-kaggle-input"
                  placeholder="e.g. https://leetcode.com/u/yourname or other profile URL"
                  value={formData.otherUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="cd-kaggle-form-actions">
              <button
                type="submit"
                className="cd-kaggle-follow-btn"
                disabled={saving}
              >
                {saving ? 'Saving Links...' : 'Save Social & Application Links'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: Campus Community Directory */}
        {activeTab === 'directory' && (
          <div className="cd-kaggle-directory-view animate-fade-in">
            <div className="cd-directory-header-row">
              <div>
                <h2 className="cd-directory-title">Campus Community Directory</h2>
                <p className="cd-directory-subtitle">
                  Explore and view public profiles for any student, faculty mentor, or institutional member.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="cd-directory-filters">
                <button
                  type="button"
                  className={`cd-dir-filter-btn ${directoryFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('ALL')}
                >
                  All ({directoryUsers.length})
                </button>
                <button
                  type="button"
                  className={`cd-dir-filter-btn ${directoryFilter === 'STUDENT' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('STUDENT')}
                >
                  Students
                </button>
                <button
                  type="button"
                  className={`cd-dir-filter-btn ${directoryFilter === 'MENTOR' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('MENTOR')}
                >
                  Faculty Mentors
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="cd-directory-search-wrap">
              <svg
                className="cd-directory-search-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, roll number, or department..."
                className="cd-directory-search-input"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
              />
              {directorySearch && (
                <button
                  type="button"
                  className="cd-dir-clear-btn"
                  onClick={() => setDirectorySearch('')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Directory Users Grid */}
            {loadingDirectory ? (
              <div className="cd-directory-loading">
                <span className="spinner-border spinner-border-sm me-2" />
                <span>Loading campus directory...</span>
              </div>
            ) : filteredDirectory.length === 0 ? (
              <div className="cd-directory-empty">
                <p>No students or mentors match &quot;{directorySearch}&quot;.</p>
              </div>
            ) : (
              <div className="cd-directory-grid">
                {filteredDirectory.map((member) => {
                  const isMemberSelf = user && member.id === user.id
                  return (
                    <div key={member.id} className="cd-directory-card">
                      <div className="cd-dir-card-head">
                        <div className="cd-dir-avatar-circle">
                          {member.pictureUrl ? (
                            <img src={member.pictureUrl} alt={member.displayName} />
                          ) : (
                            <span>{member.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="cd-dir-card-info">
                          <h4 className="cd-dir-name">{member.displayName}</h4>
                          <span className="cd-dir-roll">
                            {member.rollNumber || member.email}
                          </span>
                          <span className={`cd-role-chip cd-role-${member.role?.toLowerCase() || 'student'}`}>
                            {member.role === 'MENTOR' ? '👥 Faculty Mentor' : '🎓 Student'}
                          </span>
                        </div>
                      </div>

                      <p className="cd-dir-card-headline">
                        {member.headline || member.department || 'CampusDocs Member'}
                      </p>

                      <div className="cd-dir-card-footer">
                        <span className="cd-dir-dept-tag">{member.department || 'Engineering'}</span>
                        <button
                          type="button"
                          className="cd-dir-view-profile-btn"
                          onClick={() => handleSelectUserProfile(member)}
                        >
                          {isMemberSelf ? 'View My Profile →' : 'View Profile →'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Google Drive Storage */}
        {activeTab === 'drive' && (
          <div className="cd-kaggle-settings-card animate-fade-in">
            <div className="cd-settings-card-head">
              <h2 className="cd-kaggle-section-heading">Google Drive Cloud Storage</h2>
              <p className="cd-settings-card-subtitle">
                Manage your personal cloud drive integration and document synchronization.
              </p>
            </div>

            <div className="cd-kaggle-drive-card">
              <div className="cd-kaggle-drive-status-strip">
                <div className="cd-drive-status-indicator-box">
                  <span className={`cd-drive-pulse-dot ${isDriveConnected ? 'connected' : 'disconnected'}`} />
                  <strong>
                    {isDriveConnected ? 'Google Drive Storage Active' : 'Drive Not Connected'}
                  </strong>
                </div>

                {isFolderReady && folderId && (
                  <a
                    href={`https://drive.google.com/drive/folders/${folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cd-kaggle-outline-btn text-decoration-none"
                  >
                    Open CampusDocs in Drive ↗
                  </a>
                )}
              </div>

              <div className="cd-kaggle-details-table mt-3">
                <div className="cd-kaggle-row">
                  <span className="cd-row-label">Google Account Email</span>
                  <span className="cd-row-value">{user?.email}</span>
                </div>
                <div className="cd-kaggle-row">
                  <span className="cd-row-label">Dedicated Folder</span>
                  <span className="cd-row-value">/CampusDocs</span>
                </div>
                <div className="cd-kaggle-row">
                  <span className="cd-row-label">Permission Scope</span>
                  <span className="cd-row-value font-mono">drive.file (isolated to CampusDocs only)</span>
                </div>
              </div>

              {!isDriveConnected && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="cd-kaggle-follow-btn"
                    onClick={onConnectDrive}
                  >
                    Connect Google Drive Account →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Account Security & Danger Zone */}
        {activeTab === 'security' && (
          <div className="cd-kaggle-settings-card animate-fade-in">
            <div className="cd-settings-card-head">
              <h2 className="cd-kaggle-section-heading">Account Actions & Security</h2>
              <p className="cd-settings-card-subtitle">
                Manage active authentication sessions and account lifecycle.
              </p>
            </div>

            <div className="cd-kaggle-security-box">
              <div className="cd-security-row-action">
                <div>
                  <h4 className="cd-action-subhead">Sign Out of CampusDocs</h4>
                  <p className="cd-action-desc">
                    Terminate your active session on this device. You can log back in with Google anytime.
                  </p>
                </div>
                <button
                  type="button"
                  className="cd-kaggle-outline-btn"
                  onClick={logout}
                >
                  Sign Out
                </button>
              </div>

              <div className="cd-danger-divider" />

              <div className="cd-danger-zone-box">
                <h4 className="cd-danger-heading">Danger Zone: Delete Account</h4>
                <p className="cd-action-desc">
                  Permanently delete your profile and metadata from the CampusDocs database. Files in your Google Drive will remain completely untouched.
                </p>

                {confirmDelete ? (
                  <div className="cd-delete-confirm-strip">
                    <span className="cd-confirm-warning">
                      ⚠️ Are you sure? This action cannot be reversed.
                    </span>
                    <div className="cd-confirm-btn-pair">
                      <button
                        type="button"
                        className="cd-kaggle-outline-btn"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="cd-delete-hard-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cd-delete-trigger-btn"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete My Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
