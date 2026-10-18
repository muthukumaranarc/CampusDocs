import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { userService, mentorshipService } from '../services/api'
import './SettingsModal.css'

export default function SettingsModal({ isOpen, onClose }) {
  const { user, setUser, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Profile form state
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
  })

  // Mentorship data
  const [mentor, setMentor] = useState(null)
  const [mentees, setMentees] = useState([])
  const [loadingMentorship, setLoadingMentorship] = useState(false)

  // Delete account confirmation
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadRoleData = useCallback(async () => {
    if (!user) return
    setLoadingMentorship(true)
    try {
      if (user.role === 'STUDENT') {
        const mentorData = await mentorshipService.getMyMentor()
        setMentor(mentorData)
      } else if (user.role === 'MENTOR') {
        const menteesData = await mentorshipService.getMentees()
        setMentees(menteesData || [])
      }
    } catch {
      // Fallback silently if mentorship not yet configured
    } finally {
      setLoadingMentorship(false)
    }
  }, [user])

  // Populate form data whenever user changes or modal opens.
  useEffect(() => {
    if (user && isOpen) {
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
        })
        setSuccessMsg('')
        setErrorMsg('')
        setConfirmDelete(false)
        return loadRoleData()
      })
    }
  }, [user, isOpen, loadRoleData])

  if (!isOpen || !user) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      }
      const updatedUser = await userService.updateProfile(payload)
      setUser(updatedUser)
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setErrorMsg('')
    try {
      await userService.deleteAccount()
      onClose()
      window.location.href = '/login'
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete account.')
      setDeleting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container settings-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header settings-header">
          <div className="settings-user-summary">
            {user.pictureUrl ? (
              <img src={user.pictureUrl} alt={user.displayName} className="settings-avatar" />
            ) : (
              <div className="settings-avatar-fallback">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="settings-user-titles">
              <h2 id="settings-modal-title" className="settings-user-name">
                {user.displayName || 'CampusDocs User'}
              </h2>
              <div className="settings-meta-row">
                <span className={`role-pill role-pill-${user.role?.toLowerCase() || 'student'}`}>
                  {user.role === 'MENTOR' ? '👥 Mentor' : user.role === 'ADMIN' ? '🛡️ Admin' : '🎓 Student'}
                </span>
                <span className="settings-email">{user.email}</span>
              </div>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="settings-tabs-bar">
          <button
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Personal Details
          </button>

          {user.role === 'STUDENT' && (
            <button
              className={`settings-tab-btn ${activeTab === 'mentorship' ? 'active' : ''}`}
              onClick={() => setActiveTab('mentorship')}
            >
              🤝 Mentor Details
            </button>
          )}

          {user.role === 'MENTOR' && (
            <button
              className={`settings-tab-btn ${activeTab === 'mentorship' ? 'active' : ''}`}
              onClick={() => setActiveTab('mentorship')}
            >
              👥 Mentee Details ({mentees.length})
            </button>
          )}

          <button
            className={`settings-tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => setActiveTab('drive')}
          >
            ☁️ Google Drive
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            ⚙️ Account Actions
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body settings-body">
          {successMsg && (
            <div className="alert alert-success settings-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error settings-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile & Personal Details */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="displayName">Full Name</label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    className="form-input"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="age">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="14"
                    max="100"
                    placeholder="e.g. 21"
                    className="form-input"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="department">Department / Major</label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    className="form-input"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="rollNumber">
                    {user.role === 'MENTOR' ? 'Staff ID / Designation' : 'Roll Number / Student ID'}
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    placeholder={user.role === 'MENTOR' ? 'e.g. PROF-042' : 'e.g. 2024CS101'}
                    className="form-input"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Google Account Email</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user.email}
                    disabled
                    style={{ opacity: 0.7, background: '#f8fafc' }}
                  />
                <div className="form-group">
                  <label className="form-label" htmlFor="headline">Professional Headline / Tagline</label>
                  <input
                    id="headline"
                    name="headline"
                    type="text"
                    placeholder="e.g. Full Stack Developer | Java • Spring Boot • React"
                    className="form-input"
                    value={formData.headline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" htmlFor="bio">
                  {user.role === 'MENTOR' ? 'Office Hours & Guidance Notes' : 'Academic Goals / Bio'}
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  placeholder="Share a brief overview of your background or learning objectives..."
                  className="form-textarea"
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="githubUrl">GitHub Username / URL</label>
                  <input
                    id="githubUrl"
                    name="githubUrl"
                    type="text"
                    placeholder="e.g. muthukumaranarc"
                    className="form-input"
                    value={formData.githubUrl}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="linkedinUrl">LinkedIn Profile URL</label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="text"
                    placeholder="e.g. https://linkedin.com/in/..."
                    className="form-input"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="websiteUrl">Portfolio / Personal Website</label>
                  <input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="text"
                    placeholder="e.g. https://muthukumaran-portfolio.web.app/"
                    className="form-input"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="settings-form-actions">
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Student Mentor Details */}
          {activeTab === 'mentorship' && user.role === 'STUDENT' && (
            <div className="settings-mentorship-view">
              <h3 className="settings-section-title">Assigned Faculty Mentor</h3>
              {loadingMentorship ? (
                <p className="text-muted">Loading mentor information...</p>
              ) : mentor ? (
                <div className="mentor-detail-card">
                  <div className="mentor-avatar-box">
                    {mentor.pictureUrl ? (
                      <img src={mentor.pictureUrl} alt={mentor.name} className="mentor-img" />
                    ) : (
                      <div className="avatar-fallback large">
                        {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                    )}
                  </div>
                  <div className="mentor-info-col">
                    <h4 className="mentor-card-name">{mentor.name}</h4>
                    <p className="mentor-card-email">📧 {mentor.email}</p>
                    <span className="badge badge-success">Active 1-to-1 Mentor</span>
                    <p className="mentor-card-hint">
                      Your mentor can review, analyze, and provide structured feedback on your submitted documents.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-state-small">
                  <p className="empty-state-title">No Mentor Assigned Yet</p>
                  <p className="empty-state-description">
                    Connect with an academic mentor from the "My Mentor" tab on your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Mentor Mentee Details */}
          {activeTab === 'mentorship' && user.role === 'MENTOR' && (
            <div className="settings-mentorship-view">
              <div className="settings-section-header">
                <h3 className="settings-section-title">My Connected Students ({mentees.length})</h3>
                <span className="text-muted text-sm">1-to-N Mentorship Network</span>
              </div>

              {loadingMentorship ? (
                <p className="text-muted">Loading mentees...</p>
              ) : mentees.length > 0 ? (
                <div className="mentee-grid-settings">
                  {mentees.map((m) => (
                    <div key={m.id} className="mentee-mini-card">
                      <div className="mentee-avatar">
                        {m.pictureUrl ? (
                          <img src={m.pictureUrl} alt={m.name} />
                        ) : (
                          <span>{m.name ? m.name.charAt(0).toUpperCase() : 'S'}</span>
                        )}
                      </div>
                      <div className="mentee-mini-details">
                        <span className="mentee-mini-name">{m.name}</span>
                        <span className="mentee-mini-email">{m.email}</span>
                        <span className="mentee-mini-doc-count">
                          📄 {m.totalDocuments || 0} documents submitted
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <p className="empty-state-title">No Students Assigned Yet</p>
                  <p className="empty-state-description">
                    Students will appear here once they select you as their mentor or are assigned by the administrator.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Google Drive Storage Details */}
          {activeTab === 'drive' && (
            <div className="settings-drive-view">
              <h3 className="settings-section-title">Personal Google Drive Storage</h3>

              <div className="drive-info-box">
                <div className="drive-info-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <div>
                    <h4 className="drive-box-title">Connected Google Drive</h4>
                    <span className="badge badge-success">✓ Storage Active</span>
                  </div>
                </div>

                <div className="drive-details-table">
                  <div className="drive-detail-row">
                    <span className="detail-label">Google Account:</span>
                    <span className="detail-value">{user.email}</span>
                  </div>
                  <div className="drive-detail-row">
                    <span className="detail-label">Dedicated Folder:</span>
                    <span className="detail-value">CampusDocs</span>
                  </div>
                  <div className="drive-detail-row">
                    <span className="detail-label">Folder ID:</span>
                    <span className="detail-value code-snippet">{user.folderId || 'campusdocs-app-folder'}</span>
                  </div>
                  <div className="drive-detail-row">
                    <span className="detail-label">Storage Scope:</span>
                    <span className="detail-value">drive.file (isolated to CampusDocs only)</span>
                  </div>
                </div>

                {user.folderId && (
                  <div className="drive-actions-row">
                    <a
                      href={`https://drive.google.com/drive/folders/${user.folderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Open CampusDocs Folder in Google Drive
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Account Actions & Danger Zone */}
          {activeTab === 'account' && (
            <div className="settings-account-view">
              <h3 className="settings-section-title">Session & Account Management</h3>

              {/* Sign Out Card */}
              <div className="account-action-card">
                <div>
                  <h4 className="action-card-title">Sign Out of CampusDocs</h4>
                  <p className="action-card-desc">
                    Terminate your active session on this device.
                  </p>
                </div>
                <button onClick={logout} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone-card">
                <div className="danger-zone-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <h4 className="danger-title">Danger Zone: Delete Account</h4>
                </div>
                <p className="danger-desc">
                  Permanently delete your profile and metadata from the CampusDocs database. Your files in Google Drive will remain safe in your personal Google Drive account.
                </p>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="delete-confirm-box">
                    <p className="confirm-warning-text">
                      ⚠️ Are you sure? This action cannot be reversed.
                    </p>
                    <div className="confirm-btn-group">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="btn btn-secondary btn-sm"
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="btn btn-danger btn-sm"
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting Account...' : 'Yes, Permanently Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
