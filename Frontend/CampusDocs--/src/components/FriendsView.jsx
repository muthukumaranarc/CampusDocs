import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { mentorshipService, userService } from '../services/api'
import defaultAvatar from '../assets/default-avatar.png'
import muthuAvatar from '../assets/muthu-avatar.png'
import './FriendsView.css'

export default function FriendsView({ onNotification }) {
  const { user } = useAuth()

  // Tab state: 'same' | 'other' | 'all'
  const [activeTab, setActiveTab] = useState('same')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')

  // Data state
  const [loading, setLoading] = useState(false)
  const [myMentor, setMyMentor] = useState(null)
  const [sameMentorFriends, setSameMentorFriends] = useState([])
  const [otherMentorStudents, setOtherMentorStudents] = useState([])

  // Modal state for public details
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Load real friends and peers data
  useEffect(() => {
    let active = true
    setLoading(true)

    const fetchFriends = async () => {
      try {
        const data = await mentorshipService.getFriends()
        if (active && data) {
          if (data.myMentor) {
            setMyMentor(data.myMentor)
          } else {
            setMyMentor(null)
          }

          setSameMentorFriends(Array.isArray(data.sameMentorFriends) ? data.sameMentorFriends : [])
          setOtherMentorStudents(Array.isArray(data.otherMentorStudents) ? data.otherMentorStudents : [])
        }
      } catch (err) {
        console.warn('Friends endpoint fetch fallback to directory:', err)
        if (active) {
          try {
            const dir = await userService.getCampusDirectory()
            if (active && Array.isArray(dir)) {
              const currentMentorId = user?.mentorId
              const currentMentorEmail = user?.mentorEmail

              const same = []
              const other = []

              dir.forEach((m) => {
                if (m.id === user?.id || m.role !== 'STUDENT') return
                const isSame = (currentMentorId && m.mentorId === currentMentorId) ||
                              (currentMentorEmail && m.mentorEmail && m.mentorEmail.toLowerCase() === currentMentorEmail.toLowerCase())
                if (isSame) same.push(m)
                else other.push(m)
              })

              setSameMentorFriends(same)
              setOtherMentorStudents(other)
            }
          } catch (dirErr) {
            console.error('Directory fetch error:', dirErr)
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchFriends()

    return () => {
      active = false
    }
  }, [user])

  // Get unique departments for filter dropdown
  const allDepartments = useMemo(() => {
    const set = new Set()
    sameMentorFriends.forEach((f) => f.department && set.add(f.department))
    otherMentorStudents.forEach((f) => f.department && set.add(f.department))
    return Array.from(set).sort()
  }, [sameMentorFriends, otherMentorStudents])

  // Filter helper
  const filterList = (list) => {
    return list.filter((student) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        student.displayName?.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q) ||
        student.rollNumber?.toLowerCase().includes(q) ||
        student.department?.toLowerCase().includes(q) ||
        student.headline?.toLowerCase().includes(q) ||
        student.mentorName?.toLowerCase().includes(q)

      const matchesDept = selectedDept === 'ALL' || student.department === selectedDept

      return matchesSearch && matchesDept
    })
  }

  const filteredSame = useMemo(() => filterList(sameMentorFriends), [sameMentorFriends, searchQuery, selectedDept])
  const filteredOther = useMemo(() => filterList(otherMentorStudents), [otherMentorStudents, searchQuery, selectedDept])

  const effectiveMentorName = myMentor?.displayName || user?.mentorName || (user?.mentorId ? 'Assigned Mentor' : 'Not assigned yet')

  const handleShareFriend = (student) => {
    navigator.clipboard.writeText(window.location.origin + `/friends?id=${student.id}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    if (onNotification) {
      onNotification({ type: 'success', text: `Profile link for ${student.displayName} copied to clipboard.` })
    }
  }

  return (
    <div className="cd-friends-page-container animate-fade-in">
      {/* ========================================================
          1. HEADER BANNER
         ======================================================== */}
      <div className="cd-friends-banner-card">
        <div className="cd-friends-banner-art">
          <svg viewBox="0 0 540 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="cd-kaggle-svg-curves" preserveAspectRatio="none">
            <path d="M120 0C190 70 210 160 290 240" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <path d="M290 0C250 80 220 150 160 240" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <path d="M0 120C160 135 270 60 540 95" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <circle cx="380" cy="110" r="75" stroke="#bfdbfe" strokeWidth="3" opacity="0.75" />
          </svg>
        </div>

        <div className="cd-friends-banner-content">
          <div className="cd-friends-badge-tag">
            <span>👥 Campus Peer Network</span>
          </div>
          <h1 className="cd-friends-main-title">Campus Friends & Peers</h1>
          <p className="cd-friends-main-subtitle">
            Explore classmates guided by your faculty mentor and discover students working under other mentors across campus.
          </p>

          {/* Quick Mentorship Affiliation Bar */}
          <div className="cd-friends-mentor-pill-row">
            <div className="cd-friends-mentor-pill active">
              <span className="cd-pill-dot" />
              <span>Your Faculty Mentor: <strong>{effectiveMentorName}</strong></span>
            </div>
            <div className="cd-friends-mentor-subtext">
              <span>Department of {myMentor?.department || user?.department || 'Computer Science & Engineering'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. SUMMARY STAT CARDS ROW
         ======================================================== */}
      <div className="cd-friends-stats-grid">
        <div
          className={`cd-friends-stat-card ${activeTab === 'same' ? 'active' : ''}`}
          onClick={() => setActiveTab('same')}
          role="button"
          tabIndex={0}
        >
          <div className="cd-stat-card-top">
            <div className="cd-stat-icon-wrap icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="cd-stat-number">{sameMentorFriends.length}</span>
          </div>
          <h4 className="cd-stat-label">Friends Under Same Mentor</h4>
          <p className="cd-stat-sub">Mentees sharing {effectiveMentorName}</p>
        </div>

        <div
          className={`cd-friends-stat-card ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => setActiveTab('other')}
          role="button"
          tabIndex={0}
        >
          <div className="cd-stat-card-top">
            <div className="cd-stat-icon-wrap icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="cd-stat-number">{otherMentorStudents.length}</span>
          </div>
          <h4 className="cd-stat-label">Students in Other Mentors</h4>
          <p className="cd-stat-sub">Campus peers across other faculties</p>
        </div>

        <div
          className={`cd-friends-stat-card ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          role="button"
          tabIndex={0}
        >
          <div className="cd-stat-card-top">
            <div className="cd-stat-icon-wrap icon-emerald">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <span className="cd-stat-number">{sameMentorFriends.length + otherMentorStudents.length}</span>
          </div>
          <h4 className="cd-stat-label">All Campus Students</h4>
          <p className="cd-stat-sub">Total searchable peer community</p>
        </div>
      </div>

      {/* ========================================================
          3. TAB BAR & SEARCH CONTROLS
         ======================================================== */}
      <div className="cd-friends-nav-controls">
        {/* Navigation Tabs */}
        <div className="cd-friends-tabs-bar">
          <button
            type="button"
            className={`cd-friends-tab-btn ${activeTab === 'same' ? 'active' : ''}`}
            onClick={() => setActiveTab('same')}
          >
            <span>Under My Mentor</span>
            <span className="cd-friends-tab-count">{filteredSame.length}</span>
          </button>

          <button
            type="button"
            className={`cd-friends-tab-btn ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            <span>Other Mentors</span>
            <span className="cd-friends-tab-count">{filteredOther.length}</span>
          </button>

          <button
            type="button"
            className={`cd-friends-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Students</span>
            <span className="cd-friends-tab-count">{filteredSame.length + filteredOther.length}</span>
          </button>
        </div>

        {/* Search & Department Filter */}
        <div className="cd-friends-search-row">
          <div className="cd-friends-search-input-wrap">
            <svg
              className="cd-friends-search-icon"
              width="17"
              height="17"
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
              placeholder="Search by student name, roll number, or mentor..."
              className="cd-friends-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cd-dir-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="cd-friends-dept-select-wrap">
            <select
              className="cd-friends-dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. STUDENTS CARDS GRID
         ======================================================== */}
      {loading ? (
        <div className="cd-directory-loading" style={{ margin: '40px 0' }}>
          <span className="spinner-border spinner-border-sm me-2" />
          <span>Loading campus student community...</span>
        </div>
      ) : (
        <div className="cd-friends-content-area">
          {/* SECTION A: Friends under Same Mentor */}
          {(activeTab === 'same' || activeTab === 'all') && (
            <div className="cd-friends-group-section">
              <div className="cd-friends-group-header">
                <div>
                  <h3 className="cd-friends-group-title">
                    Classmates & Friends Under {effectiveMentorName}
                  </h3>
                  <p className="cd-friends-group-subtitle">
                    Students assigned to the same faculty mentor for coursework evaluation, auditing, and academic guidance.
                  </p>
                </div>
                <span className="cd-friends-group-badge blue">
                  Same Mentor Group ({filteredSame.length})
                </span>
              </div>

              {filteredSame.length === 0 ? (
                <div className="cd-friends-empty-box">
                  <p>No students found matching your search under {effectiveMentorName}.</p>
                </div>
              ) : (
                <div className="cd-friends-cards-grid">
                  {filteredSame.map((student) => (
                    <FriendCard
                      key={student.id}
                      student={student}
                      isSameMentor={true}
                      myMentorName={effectiveMentorName}
                      onViewDetails={() => setSelectedFriend(student)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: Students in Other Mentors */}
          {(activeTab === 'other' || activeTab === 'all') && (
            <div className="cd-friends-group-section" style={{ marginTop: activeTab === 'all' ? '36px' : '0' }}>
              <div className="cd-friends-group-header">
                <div>
                  <h3 className="cd-friends-group-title">
                    Students Guided by Other Mentors
                  </h3>
                  <p className="cd-friends-group-subtitle">
                    Classmates and peers supervised by other professors and faculty mentors across campus departments.
                  </p>
                </div>
                <span className="cd-friends-group-badge purple">
                  Other Mentor Groups ({filteredOther.length})
                </span>
              </div>

              {filteredOther.length === 0 ? (
                <div className="cd-friends-empty-box">
                  <p>No students found matching your search under other mentors.</p>
                </div>
              ) : (
                <div className="cd-friends-cards-grid">
                  {filteredOther.map((student) => (
                    <FriendCard
                      key={student.id}
                      student={student}
                      isSameMentor={false}
                      myMentorName={effectiveMentorName}
                      onViewDetails={() => setSelectedFriend(student)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. PUBLIC DETAILS MODAL
         ======================================================== */}
      {selectedFriend && (
        <div
          className="cd-modal-overlay animate-fade-in"
          onClick={() => setSelectedFriend(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="cd-modal-card cd-friend-details-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header with Kaggle Art */}
            <div className="cd-friend-modal-banner">
              <button
                type="button"
                className="cd-friend-modal-close"
                onClick={() => setSelectedFriend(null)}
                aria-label="Close"
              >
                ×
              </button>

              <div className="cd-friend-modal-avatar-wrap">
                <img
                  src={selectedFriend.pictureUrl || defaultAvatar}
                  alt={selectedFriend.displayName}
                  className="cd-friend-modal-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = defaultAvatar
                  }}
                />
              </div>

              <div className="cd-friend-modal-head-info">
                <div className="cd-friend-modal-role-row">
                  <span className="cd-role-chip cd-role-student">🎓 Student</span>
                  {selectedFriend.mentorName === effectiveMentorName ? (
                    <span className="cd-same-mentor-badge">
                      👥 Same Mentor ({effectiveMentorName})
                    </span>
                  ) : (
                    <span className="cd-other-mentor-badge">
                      🎓 Mentor: {selectedFriend.mentorName || 'Faculty Mentor'}
                    </span>
                  )}
                </div>
                <h2 className="cd-friend-modal-name">{selectedFriend.displayName}</h2>
                <p className="cd-friend-modal-headline">{selectedFriend.headline || selectedFriend.department}</p>
              </div>
            </div>

            {/* Modal Body: Public Details */}
            <div className="cd-friend-modal-body">
              {/* Bio Section */}
              <div className="cd-friend-modal-section">
                <h4 className="cd-friend-modal-subhead">About & Academic Goals</h4>
                <p className="cd-friend-modal-bio">
                  {selectedFriend.bio || 'CampusDocs member pursuing undergraduate studies.'}
                </p>
              </div>

              {/* Campus Credentials Table */}
              <div className="cd-friend-modal-section">
                <h4 className="cd-friend-modal-subhead">Campus Enrollment & Verification</h4>
                <div className="cd-kaggle-details-table">
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Department / School</span>
                    <span className="cd-row-value">{selectedFriend.department || 'Engineering'}</span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Roll Number / Student ID</span>
                    <span className="cd-row-value font-mono font-bold text-blue-700">
                      {selectedFriend.rollNumber || selectedFriend.email}
                    </span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Faculty Mentor</span>
                    <span className="cd-row-value font-medium text-purple-700">
                      {selectedFriend.mentorName || 'Campus Faculty Advisor'}
                    </span>
                  </div>
                  <div className="cd-kaggle-row">
                    <span className="cd-row-label">Institutional Status</span>
                    <span className="cd-row-value text-emerald-600 font-semibold">
                      ✓ Verified CampusDocs Student
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="cd-friend-modal-section">
                <h4 className="cd-friend-modal-subhead">External & Contact Links</h4>
                <div className="cd-friend-links-grid">
                  {selectedFriend.githubUrl && (
                    <a
                      href={`https://github.com/${selectedFriend.githubUrl.replace(/^https?:\/\/github\.com\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-friend-link-pill"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                  )}

                  {selectedFriend.linkedinUrl && (
                    <a
                      href={selectedFriend.linkedinUrl.startsWith('http') ? selectedFriend.linkedinUrl : `https://${selectedFriend.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-friend-link-pill"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  )}

                  {selectedFriend.websiteUrl && (
                    <a
                      href={selectedFriend.websiteUrl.startsWith('http') ? selectedFriend.websiteUrl : `https://${selectedFriend.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-friend-link-pill"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span>Website</span>
                    </a>
                  )}

                  {selectedFriend.twitterUrl && (
                    <a
                      href={selectedFriend.twitterUrl.startsWith('http') ? selectedFriend.twitterUrl : `https://x.com/${selectedFriend.twitterUrl.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-friend-link-pill"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Twitter / X</span>
                    </a>
                  )}

                  {selectedFriend.otherUrl && (
                    <a
                      href={selectedFriend.otherUrl.startsWith('http') ? selectedFriend.otherUrl : `https://${selectedFriend.otherUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-friend-link-pill"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      <span>Coding Platform</span>
                    </a>
                  )}

                  <a
                    href={`mailto:${selectedFriend.email}`}
                    className="cd-friend-link-pill"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>{selectedFriend.email}</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cd-friend-modal-actions">
                <a
                  href={`mailto:${selectedFriend.email}`}
                  className="cd-kaggle-follow-btn text-decoration-none"
                >
                  ✉️ Email Student
                </a>
                <button
                  type="button"
                  className="cd-kaggle-outline-btn"
                  onClick={() => handleShareFriend(selectedFriend)}
                >
                  {copiedLink ? '✓ Copied!' : '🔗 Share Profile'}
                </button>
                <button
                  type="button"
                  className="cd-kaggle-outline-btn"
                  onClick={() => setSelectedFriend(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Student Card Component
function FriendCard({ student, isSameMentor, myMentorName, onViewDetails }) {
  const avatarSrc = student.pictureUrl || defaultAvatar

  return (
    <div className={`cd-friends-card ${isSameMentor ? 'same-mentor' : 'other-mentor'}`}>
      <div className="cd-friends-card-head">
        <div className="cd-friends-avatar-ring">
          <img
            src={avatarSrc}
            alt={student.displayName}
            className="cd-friends-avatar-img"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = defaultAvatar
            }}
          />
        </div>

        <div className="cd-friends-card-titles">
          <h4 className="cd-friends-card-name">{student.displayName}</h4>
          <span className="cd-friends-card-roll">{student.rollNumber || student.email}</span>
          <span className="cd-friends-dept-badge">{student.department || 'Computer Science'}</span>
        </div>
      </div>

      {/* Mentor Affiliation Tag */}
      <div className="cd-friends-mentor-tag-row">
        {isSameMentor ? (
          <span className="cd-same-mentor-chip">
            👥 Same Mentor ({myMentorName})
          </span>
        ) : (
          <span className="cd-other-mentor-chip">
            🎓 Mentor: {student.mentorName || 'Faculty Mentor'}
          </span>
        )}
      </div>

      {/* Headline */}
      <p className="cd-friends-card-headline">
        {student.headline || 'Full Stack Developer | Java • Spring Boot • React'}
      </p>

      {/* Card Footer: View Details Action */}
      <div className="cd-friends-card-footer">
        <button
          type="button"
          className="cd-friends-view-btn"
          onClick={onViewDetails}
        >
          View Public Details →
        </button>
      </div>
    </div>
  )
}
