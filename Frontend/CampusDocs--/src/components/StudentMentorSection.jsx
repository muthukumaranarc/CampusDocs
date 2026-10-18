import { useState, useEffect } from 'react'
import { mentorshipService } from '../services/api'
import { useAuth } from '../context/useAuth'
import './StudentMentorSection.css'

export default function StudentMentorSection({ onNotification }) {
  const { user, checkAuth } = useAuth()

  // Initialize from user profile if already connected
  const [mentor, setMentor] = useState(() => {
    if (user?.mentorId && user?.mentorName) {
      return {
        id: user.mentorId,
        displayName: user.mentorName,
        email: user.mentorEmail || '',
        pictureUrl: null,
      }
    }
    return null
  })

  const [availableMentors, setAvailableMentors] = useState([])
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [loading, setLoading] = useState(!user?.mentorId)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [copiedEmail, setCopiedEmail] = useState(false)

  useEffect(() => {
    let active = true

    // Fetch in parallel using settled promises
    Promise.allSettled([
      mentorshipService.getMyMentor(),
      mentorshipService.getAvailableMentors(),
    ]).then(([myMentorResult, availMentorsResult]) => {
      if (!active) return

      if (myMentorResult.status === 'fulfilled' && myMentorResult.value && myMentorResult.value.id) {
        setMentor(myMentorResult.value)
      } else if (user?.mentorId && user?.mentorName) {
        setMentor({
          id: user.mentorId,
          displayName: user.mentorName,
          email: user.mentorEmail || '',
          pictureUrl: null,
        })
      } else {
        setMentor(null)
      }

      if (availMentorsResult.status === 'fulfilled' && Array.isArray(availMentorsResult.value)) {
        setAvailableMentors(availMentorsResult.value)
      }

      setError(null)
      setLoading(false)
    }).catch((err) => {
      if (active) {
        console.warn('Mentorship data check note:', err)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [refreshCount, user])

  const handleConnectMentor = async (e) => {
    e.preventDefault()
    if (!selectedMentorId) {
      if (onNotification) onNotification({ type: 'error', text: 'Please select a faculty mentor to connect with.' })
      return
    }

    try {
      setConnecting(true)
      const res = await mentorshipService.selectMentor(selectedMentorId)
      const mentorName = res.mentorName || res.displayName || 'Faculty Mentor'
      setMentor({
        id: res.mentorId || selectedMentorId,
        displayName: mentorName,
        email: res.mentorEmail || '',
        pictureUrl: null,
      })
      if (onNotification) {
        onNotification({
          type: 'success',
          text: `Successfully connected with Mentor ${mentorName}! They can now review your coursework.`,
        })
      }
      await checkAuth()
      setRefreshCount((c) => c + 1)
    } catch (err) {
      console.error('Failed to select mentor:', err)
      const msg = err.response?.data?.message || 'Failed to connect with selected mentor.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setConnecting(false)
    }
  }

  const handleCopyEmail = (email) => {
    if (!email) return
    navigator.clipboard.writeText(email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
    if (onNotification) {
      onNotification({ type: 'info', text: 'Mentor email copied to clipboard!' })
    }
  }

  const mentorName = mentor?.displayName || mentor?.name || user?.mentorName || 'Assigned Faculty Mentor'
  const mentorEmail = mentor?.email || user?.mentorEmail || ''

  return (
    <div className="cd-mentor-container animate-fade-in">
      {/* Page Header */}
      <div className="cd-mentor-header-section">
        <div className="cd-mentor-header-badge">
          <span className="cd-mentor-pulse-dot" />
          Academic Mentorship
        </div>
        <h1 className="cd-mentor-page-title">My Faculty Mentor</h1>
        <p className="cd-mentor-page-desc">
          Your assigned faculty mentor reviews your uploaded marksheets, identity records, and certificates to ensure academic compliance and authenticity.
        </p>
      </div>

      {error && (
        <div className="cd-banner-alert cd-banner-error mb-4">
          <div className="cd-banner-content">
            <span className="cd-banner-icon">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="cd-mentor-loading-card">
          <div className="loading-spinner" />
          <p className="mt-3 text-muted">Retrieving your faculty mentor details...</p>
        </div>
      ) : mentor ? (
        /* ================= Connected Mentor View ================= */
        <div className="cd-mentor-modern-card">
          {/* Top Banner Accent */}
          <div className="cd-mentor-banner-accent" />

          {/* Profile Section */}
          <div className="cd-mentor-profile-wrap">
            <div className="cd-mentor-avatar-holder">
              {mentor.pictureUrl ? (
                <img src={mentor.pictureUrl} alt={mentorName} className="cd-mentor-photo" />
              ) : (
                <div className="cd-mentor-avatar-fallback">
                  {mentorName ? mentorName.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
              <span className="cd-mentor-online-badge" title="Active Connection" />
            </div>

            <div className="cd-mentor-identity-block">
              <div className="cd-mentor-title-row">
                <h2 className="cd-mentor-full-name">{mentorName}</h2>
                <span className="cd-mentor-verified-badge" title="Officially Verified Faculty">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Verified Faculty
                </span>
              </div>

              <div className="cd-mentor-meta-pill-group">
                <span className="cd-mentor-role-pill">Academic Mentor</span>
                <span className="cd-mentor-dept-pill">Department Advisory</span>
                <span className="cd-mentor-active-pill">
                  <span className="cd-pill-pulse-dot" />
                  Connected
                </span>
              </div>

              <p className="cd-mentor-email-text">{mentorEmail}</p>
            </div>

            {/* Quick Action Buttons */}
            <div className="cd-mentor-actions-col">
              <a
                href={`mailto:${mentorEmail}?subject=CampusDocs%20Document%20Verification%20Inquiry`}
                className="cd-mentor-btn cd-mentor-btn-primary"
                title="Send an email to your mentor"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Send Email
              </a>

              <button
                type="button"
                className="cd-mentor-btn cd-mentor-btn-outline"
                onClick={() => handleCopyEmail(mentorEmail)}
                title="Copy mentor email address"
              >
                {copiedEmail ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: '#16a34a' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Address
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Modern Feature Cards */}
          <div className="cd-mentor-features-grid">
            <div className="cd-mentor-feature-box">
              <div className="cd-mentor-feat-icon feat-icon-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="cd-mentor-feat-content">
                <h4>Document Verification</h4>
                <p>Authorized to review, evaluate, and certify documents uploaded to your personal repository.</p>
              </div>
            </div>

            <div className="cd-mentor-feature-box">
              <div className="cd-mentor-feat-icon feat-icon-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="cd-mentor-feat-content">
                <h4>Status & Notes</h4>
                <p>Provides actionable feedback and review notes if a document needs revision or re-upload.</p>
              </div>
            </div>

            <div className="cd-mentor-feature-box">
              <div className="cd-mentor-feat-icon feat-icon-emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="cd-mentor-feat-content">
                <h4>Academic Authenticity</h4>
                <p>Protects your credentials with an institutional verification trail stored directly with your records.</p>
              </div>
            </div>
          </div>

          {/* Details Metadata Grid */}
          <div className="cd-mentor-meta-grid">
            <div className="cd-mentor-meta-item">
              <span className="cd-meta-title">Mentorship Scope</span>
              <span className="cd-meta-value">1-on-1 Document Review & Academic Audit</span>
            </div>
            <div className="cd-mentor-meta-item">
              <span className="cd-meta-title">Official Contact</span>
              <a href={`mailto:${mentorEmail}`} className="cd-meta-email-link">
                {mentorEmail} ↗
              </a>
            </div>
            <div className="cd-mentor-meta-item">
              <span className="cd-meta-title">Review Access</span>
              <span className="cd-meta-value text-emerald-600">● Granted & Authorized</span>
            </div>
          </div>
        </div>
      ) : (
        /* ================= Unconnected / Select Mentor View ================= */
        <div className="cd-mentor-connect-card">
          <div className="cd-mentor-connect-header">
            <div className="cd-mentor-connect-icon">
              🎓
            </div>
            <div>
              <h2 className="cd-connect-title">Connect with your Faculty Mentor</h2>
              <p className="cd-connect-subtitle">
                You are currently not connected to an assigned faculty mentor. Select your advisor from the faculty directory below to link your account.
              </p>
            </div>
          </div>

          {availableMentors.length === 0 ? (
            <div className="cd-mentor-empty-notice">
              <div className="cd-empty-icon">🏢</div>
              <h4>No Faculty Mentors Listed</h4>
              <p>Faculty mentors are currently being assigned by administration. Please check back shortly or reach out to your department office.</p>
            </div>
          ) : (
            <form onSubmit={handleConnectMentor} className="cd-mentor-connect-form">
              <div className="cd-form-row">
                <label htmlFor="studentSelectMentor" className="cd-form-label">
                  Choose Your Assigned Faculty Mentor:
                </label>
                <div className="cd-select-wrapper">
                  <select
                    id="studentSelectMentor"
                    className="cd-modern-select"
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    disabled={connecting}
                    required
                  >
                    <option value="">-- Select Faculty Member --</option>
                    {availableMentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName || m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                  <span className="cd-select-arrow">▾</span>
                </div>
                <span className="cd-form-helper">
                  Tip: If unsure who your assigned advisor is, refer to your semester enrolment sheet.
                </span>
              </div>

              <div className="cd-connect-actions">
                <button
                  type="submit"
                  className="cd-mentor-submit-btn"
                  disabled={connecting || !selectedMentorId}
                >
                  {connecting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Connecting with Mentor...
                    </>
                  ) : (
                    <>
                      Connect with Mentor
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ms-2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="cd-connect-info-footer">
            <div className="cd-info-footer-icon">💡</div>
            <p>
              Once linked, your faculty mentor will be able to review your uploaded academic documents, provide notes, and certify your submissions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
