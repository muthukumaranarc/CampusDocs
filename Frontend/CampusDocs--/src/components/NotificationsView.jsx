import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/useAuth'
import { announcementService, notificationService } from '../services/api'
import './NotificationsView.css'

// Helper function to format announcement timestamps
function formatAnnouncementDate(dateInput) {
  if (!dateInput) return 'Recently'
  try {
    let date
    if (Array.isArray(dateInput)) {
      date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0)
    } else {
      date = new Date(dateInput)
    }
    if (isNaN(date.getTime())) return 'Recently'

    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (e) {
    return 'Recently'
  }
}

// Category formatting helper
function formatCategoryLabel(cat) {
  if (!cat) return 'GENERAL'
  return cat.replace(/_/g, ' ').toUpperCase()
}

export default function NotificationsView({
  initialTab = 'all',
  onNavigate,
  onOpenUpload,
  onUnreadCountChange,
}) {
  const { user } = useAuth()

  // Tab State: 'all' | 'announcements' | 'unread' | 'verification' | 'mentor' | 'academic' | 'drive'
  const [activeFilter, setActiveFilter] = useState(initialTab)
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Public Announcements State
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementError, setAnnouncementError] = useState(null)

  // Modals & Actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create Announcement Form State
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('CAMPUS_EVENT')
  const [formPriority, setFormPriority] = useState('NORMAL')
  const [formPinned, setFormPinned] = useState(false)
  const [formContent, setFormContent] = useState('')
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false)
  const [formError, setFormError] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  // Real User Notifications State from MongoDB backend
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Fetch Real Notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true)
    try {
      const data = await notificationService.getAll()
      if (Array.isArray(data)) {
        setNotifications(data.map((n) => ({
          ...n,
          time: n.time || formatAnnouncementDate(n.createdAt),
          date: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recently',
        })))
      }
    } catch (err) {
      console.warn('Failed to fetch notifications from server:', err)
      setNotifications([])
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Fetch Public Announcements from API
  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true)
    try {
      const data = await announcementService.getAll()
      setAnnouncements(Array.isArray(data) ? data : [])
      setAnnouncementError(null)
    } catch (err) {
      console.warn('Failed to load public announcements from server:', err)
      setAnnouncements([])
      setAnnouncementError('Unable to load announcements at this time.')
    } finally {
      setLoadingAnnouncements(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Category filter
      let matchesCat = true
      if (announcementCategoryFilter !== 'ALL') {
        matchesCat = ann.category === announcementCategoryFilter
      }

      // Search query
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        (ann.authorName && ann.authorName.toLowerCase().includes(q)) ||
        (ann.authorDepartment && ann.authorDepartment.toLowerCase().includes(q)) ||
        (ann.category && ann.category.toLowerCase().includes(q))

      return matchesCat && matchesSearch
    })
  }, [announcements, announcementCategoryFilter, searchQuery])

  // Pinned announcements for preview on "All" tab
  const pinnedAnnouncements = useMemo(() => {
    return announcements.filter((a) => a.pinned)
  }, [announcements])

  // Computed counts for notifications
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const totalNotifCount = notifications.length

  // Notify parent of updated unread count in real time
  useEffect(() => {
    if (typeof onUnreadCountChange === 'function') {
      onUnreadCountChange(unreadCount)
    }
  }, [unreadCount, onUnreadCountChange])

  // Filtered Notifications (for the activity alerts list)
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      let matchesTab = true
      if (activeFilter === 'unread') matchesTab = !item.read
      else if (activeFilter === 'verification') matchesTab = item.type === 'verification'
      else if (activeFilter === 'mentor') matchesTab = item.type === 'mentor'
      else if (activeFilter === 'academic') matchesTab = item.type === 'academic'
      else if (activeFilter === 'drive') matchesTab = item.type === 'drive' || item.type === 'system'

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q)

      return matchesTab && matchesSearch
    })
  }, [notifications, activeFilter, searchQuery])

  // Notification Actions
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const handleToggleRead = async (id) => {
    const item = notifications.find((n) => n.id === id)
    if (!item) return
    try {
      if (!item.read) {
        await notificationService.markAsRead(id)
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
      )
    } catch (err) {
      console.error('Failed to toggle notification status:', err)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
      )
    }
  }

  const handleDeleteNotif = async (id) => {
    try {
      await notificationService.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const handleClearRead = async () => {
    const readItems = notifications.filter((n) => n.read)
    setNotifications((prev) => prev.filter((n) => !n.read))
    try {
      await Promise.all(readItems.map((n) => notificationService.delete(n.id).catch(() => {})))
    } catch (err) {
      console.error('Failed to bulk clear read notifications:', err)
    }
  }

  const handleActionClick = (n) => {
    if (n.actionUpload && onOpenUpload) {
      onOpenUpload()
    } else if (n.actionView && onNavigate) {
      onNavigate(n.actionView)
    }
  }

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('Please enter an announcement title.')
      return
    }
    if (!formContent.trim()) {
      setFormError('Please enter the announcement message content.')
      return
    }

    setSubmittingAnnouncement(true)
    setFormError(null)

    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        priority: formPriority,
        pinned: formPinned,
      }

      const created = await announcementService.create(payload)

      // Add to list
      setAnnouncements((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      setActiveFilter('announcements')
      setSuccessBanner('Public announcement posted successfully! Visible to all students and mentors.')
      setTimeout(() => setSuccessBanner(null), 5000)

      // Reset form
      setFormTitle('')
      setFormContent('')
      setFormCategory('CAMPUS_EVENT')
      setFormPriority('NORMAL')
      setFormPinned(false)
    } catch (err) {
      console.error('Failed to create announcement:', err)
      const msg = err.response?.data?.message || err.message || 'Unable to post announcement. Please try again.'
      setFormError(msg)
    } finally {
      setSubmittingAnnouncement(false)
    }
  }

  // Handle Delete Announcement
  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (isCreateModalOpen || announcementToDelete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCreateModalOpen, announcementToDelete])

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return
    setIsDeleting(true)
    try {
      await announcementService.delete(announcementToDelete.id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementToDelete.id))
      setAnnouncementToDelete(null)
      setSuccessBanner('Announcement deleted successfully.')
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert(err.response?.data?.message || 'Unable to delete announcement.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Check if current user can delete an announcement
  const canDeleteAnnouncement = (ann) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    if (user.id && ann.authorId && user.id === ann.authorId) return true
    if (user.email && ann.authorEmail && user.email.toLowerCase() === ann.authorEmail.toLowerCase()) return true
    return false
  }

  return (
    <div className="cd-notifications-page-container animate-fade-in">
      {/* ========================================================
          1. HEADER: Title & Post Announcement Action
         ======================================================== */}
      <div className="cd-notif-simple-header cd-header-with-action">
        <h1 className="cd-notif-simple-title">Notifications</h1>
        <button
          type="button"
          className="cd-post-announcement-header-btn"
          onClick={() => {
            setFormError(null)
            setIsCreateModalOpen(true)
          }}
        >
          <span className="cd-btn-icon">📢</span>
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Success notification banner */}
      {successBanner && (
        <div className="cd-ann-success-toast animate-fade-in">
          <span className="cd-toast-check">✓</span>
          <span>{successBanner}</span>
          <button
            type="button"
            className="cd-toast-close"
            onClick={() => setSuccessBanner(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================
          2. CONTROLS BAR: TABS, SEARCH, AND BULK ACTIONS
         ======================================================== */}
      <div className="cd-notif-controls-bar">
        {/* Filter Tabs */}
        <div className="cd-notif-tabs">
          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
            <span className="cd-notif-tab-badge">{totalNotifCount + announcements.length}</span>
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn tab-announcements ${activeFilter === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveFilter('announcements')}
          >
            <span style={{ marginRight: '3px' }}>📢</span>
            Campus Announcements
            {announcements.length > 0 && (
              <span className="cd-notif-tab-badge cd-badge-announcement">
                {announcements.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread
            {unreadCount > 0 && <span className="cd-notif-tab-badge unread">{unreadCount}</span>}
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveFilter('verification')}
          >
            Verifications
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'mentor' ? 'active' : ''}`}
            onClick={() => setActiveFilter('mentor')}
          >
            Mentor Reviews
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveFilter('academic')}
          >
            Exams & Notices
          </button>

          <button
            type="button"
            className={`cd-notif-tab-btn ${activeFilter === 'drive' ? 'active' : ''}`}
            onClick={() => setActiveFilter('drive')}
          >
            Google Drive & System
          </button>
        </div>

        {/* Search & Actions */}
        <div className="cd-notif-actions-cluster">
          {/* Search Box */}
          <div className="cd-notif-search-wrap">
            <svg
              className="cd-notif-search-icon"
              width="16"
              height="16"
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
              placeholder={activeFilter === 'announcements' ? "Search announcements & authors..." : "Search notices & alerts..."}
              className="cd-notif-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cd-notif-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Action Buttons (For individual notifications) */}
          {activeFilter !== 'announcements' && (
            <div className="cd-notif-buttons-pair">
              <button
                type="button"
                className="cd-notif-outline-action-btn"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                title="Mark all notifications as read"
              >
                ✓ Mark All Read
              </button>

              <button
                type="button"
                className="cd-notif-outline-action-btn"
                onClick={handleClearRead}
                title="Clear all read notifications"
              >
                Clear Read
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          3. ANNOUNCEMENTS VIEW (When Announcements Tab is Active)
         ======================================================== */}
      {activeFilter === 'announcements' && (
        <div className="cd-announcements-feed-container animate-fade-in">
          {/* Category Filter Pills */}
          <div className="cd-ann-sub-filter-row">
            <span className="cd-ann-filter-label">Filter Category:</span>
            {[
              { id: 'ALL', label: 'All Topics' },
              { id: 'CAMPUS_EVENT', label: 'Campus Events' },
              { id: 'WORKSHOP', label: 'Workshops & Hackathons' },
              { id: 'ACADEMIC_NOTICE', label: 'Academic Notices' },
              { id: 'STUDENT_CLUB', label: 'Student Clubs' },
              { id: 'RESEARCH', label: 'Research' },
              { id: 'GENERAL', label: 'General' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cd-ann-sub-pill ${announcementCategoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setAnnouncementCategoryFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Announcements Card Feed */}
          {loadingAnnouncements ? (
            <div className="cd-notif-empty-card">
              <div className="cd-ann-spinner" />
              <p className="cd-notif-empty-desc mt-2">Loading campus announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="cd-notif-empty-card">
              <div className="cd-notif-empty-icon-wrap" style={{ background: '#fef3c7' }}>
                <span style={{ fontSize: '30px' }}>📢</span>
              </div>
              <h3 className="cd-notif-empty-title">No announcements found</h3>
              <p className="cd-notif-empty-desc">
                {searchQuery
                  ? `No announcements match "${searchQuery}".`
                  : 'There are no active public announcements in this category.'}
              </p>
              <button
                type="button"
                className="cd-btn-primary-pill mt-3"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Post New Announcement
              </button>
            </div>
          ) : (
            <div className="cd-announcements-card-list">
              {filteredAnnouncements.map((ann) => {
                const isAuthorOrAdmin = canDeleteAnnouncement(ann)
                const isStudent = ann.authorRole === 'STUDENT'
                const isMentor = ann.authorRole === 'MENTOR'
                const isUrgent = ann.priority === 'URGENT'
                const isImportant = ann.priority === 'IMPORTANT'

                return (
                  <article
                    key={ann.id}
                    className={`cd-announcement-card ${ann.pinned ? 'is-pinned' : ''}`}
                  >
                    {/* Top Ribbon & Badges */}
                    <div className="cd-ann-card-top-row">
                      <div className="cd-ann-badges-group">
                        {ann.pinned && (
                          <span className="cd-ann-pill-pinned">
                            📌 PINNED TO TOP
                          </span>
                        )}

                        <span className={`cd-ann-pill-category cat-${(ann.category || 'general').toLowerCase()}`}>
                          {formatCategoryLabel(ann.category)}
                        </span>

                        {isUrgent && (
                          <span className="cd-ann-pill-priority urgent">
                            <span className="cd-pulse-dot" /> URGENT
                          </span>
                        )}

                        {isImportant && !isUrgent && (
                          <span className="cd-ann-pill-priority important">
                            ⚡ IMPORTANT
                          </span>
                        )}
                      </div>

                      <div className="cd-ann-timestamp-wrap">
                        <span className="cd-ann-date-text">
                          {formatAnnouncementDate(ann.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Announcement Title & Message Body */}
                    <h2 className="cd-ann-card-title">{ann.title}</h2>
                    <p className="cd-ann-card-content">{ann.content}</p>

                    {/* Footer: Author Card & Delete Action */}
                    <div className="cd-ann-card-footer">
                      <div className="cd-ann-author-info">
                        <div className={`cd-ann-avatar ${isMentor ? 'mentor' : isStudent ? 'student' : 'admin'}`}>
                          {ann.authorPictureUrl ? (
                            <img src={ann.authorPictureUrl} alt={ann.authorName} className="cd-ann-avatar-img" />
                          ) : (
                            <span className="cd-ann-avatar-initial">
                              {(ann.authorName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="cd-ann-author-texts">
                          <div className="cd-ann-author-name-row">
                            <span className="cd-ann-author-name">{ann.authorName}</span>
                            <span className={`cd-ann-role-chip ${isMentor ? 'role-mentor' : isStudent ? 'role-student' : 'role-admin'}`}>
                              {isMentor ? '👥 Faculty Mentor' : isStudent ? '🎓 Student' : '🛡️ Campus Admin'}
                            </span>
                          </div>
                          <span className="cd-ann-author-dept">
                            {ann.authorDepartment || 'General Campus'} • {ann.authorEmail}
                          </span>
                        </div>
                      </div>

                      {/* Delete action if current user is author or admin */}
                      {isAuthorOrAdmin && (
                        <div className="cd-ann-card-actions">
                          <button
                            type="button"
                            className="cd-ann-btn-delete"
                            onClick={() => setAnnouncementToDelete(ann)}
                            title="Delete this announcement"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. GENERAL NOTIFICATIONS VIEW (When 'All' or Other Tabs Active)
         ======================================================== */}
      {activeFilter !== 'announcements' && (
        <>
          {/* Pinned Announcements Spotlight (Shown when on 'All' tab) */}
          {activeFilter === 'all' && pinnedAnnouncements.length > 0 && !searchQuery && (
            <div className="cd-pinned-announcements-spotlight animate-fade-in">
              <div className="cd-spotlight-header">
                <div className="cd-spotlight-title-group">
                  <span className="cd-spotlight-pin-icon">📌</span>
                  <h3 className="cd-spotlight-title">Featured Campus Announcements</h3>
                  <span className="cd-spotlight-badge">Broadcast to all students & mentors</span>
                </div>
                <button
                  type="button"
                  className="cd-spotlight-view-all-btn"
                  onClick={() => setActiveFilter('announcements')}
                >
                  View All Announcements ({announcements.length}) →
                </button>
              </div>

              <div className="cd-spotlight-cards-grid">
                {pinnedAnnouncements.slice(0, 2).map((ann) => (
                  <div key={ann.id} className="cd-spotlight-mini-card">
                    <div className="cd-spotlight-card-top">
                      <span className={`cd-ann-pill-category cat-${(ann.category || 'general').toLowerCase()}`}>
                        {formatCategoryLabel(ann.category)}
                      </span>
                      <span className="cd-spotlight-time">
                        {formatAnnouncementDate(ann.createdAt)}
                      </span>
                    </div>
                    <h4 className="cd-spotlight-mini-title">{ann.title}</h4>
                    <p className="cd-spotlight-mini-desc">{ann.content}</p>
                    <div className="cd-spotlight-card-author">
                      <span className="cd-spotlight-author-name">By {ann.authorName}</span>
                      <span className={`cd-ann-role-chip ${ann.authorRole === 'MENTOR' ? 'role-mentor' : 'role-student'}`}>
                        {ann.authorRole === 'MENTOR' ? '👥 Mentor' : '🎓 Student'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Alerts List */}
          <div className="cd-notif-list-container">
            {filteredNotifications.length === 0 ? (
              <div className="cd-notif-empty-card">
                <div className="cd-notif-empty-icon-wrap">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                </div>
                <h3 className="cd-notif-empty-title">All caught up!</h3>
                <p className="cd-notif-empty-desc">
                  {searchQuery
                    ? `No notifications found matching "${searchQuery}".`
                    : activeFilter === 'unread'
                    ? 'You have zero unread notifications. Great job keeping your records current!'
                    : 'No alerts found in this category.'}
                </p>
                {(searchQuery || activeFilter !== 'all') && (
                  <button
                    type="button"
                    className="cd-notif-outline-action-btn mt-3"
                    onClick={() => {
                      setSearchQuery('')
                      setActiveFilter('all')
                    }}
                  >
                    Reset Filters & View All
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`cd-notif-card ${!notif.read ? 'unread' : 'read'} type-${notif.type}`}
                >
                  {/* Left Color Accent & Icon */}
                  <div className={`cd-notif-icon-circle ${notif.type}`}>
                    {notif.type === 'verification' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    {notif.type === 'mentor' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <polyline points="17 11 19 13 23 9" />
                      </svg>
                    )}
                    {notif.type === 'drive' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      </svg>
                    )}
                    {notif.type === 'academic' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )}
                    {notif.type === 'system' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>

                  {/* Notification Content Body */}
                  <div className="cd-notif-main-body">
                    {/* Header Row: Category Badge + Timestamp + Unread Status */}
                    <div className="cd-notif-card-header">
                      <div className="cd-notif-meta-tags">
                        <span className={`cd-notif-category-chip ${notif.type}`}>
                          {notif.category}
                        </span>
                        <span className="cd-notif-source-label">
                          • {notif.source}
                        </span>
                      </div>

                      <div className="cd-notif-time-status">
                        <span className="cd-notif-timestamp" title={notif.date}>
                          {notif.time}
                        </span>
                        {!notif.read && (
                          <span className="cd-notif-new-dot" title="Unread notification" />
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="cd-notif-title">{notif.title}</h3>
                    <p className="cd-notif-description">{notif.description}</p>

                    {/* Footer with Action & Toggles */}
                    <div className="cd-notif-footer-row">
                      {/* Action Link button */}
                      {notif.actionLabel && (
                        <button
                          type="button"
                          className="cd-notif-action-link-btn"
                          onClick={() => handleActionClick(notif)}
                        >
                          {notif.actionLabel}
                        </button>
                      )}

                      {/* Micro Actions (Toggle Read / Dismiss) */}
                      <div className="cd-notif-micro-actions">
                        <button
                          type="button"
                          className="cd-notif-tool-btn"
                          onClick={() => handleToggleRead(notif.id)}
                          title={notif.read ? 'Mark as unread' : 'Mark as read'}
                        >
                          {notif.read ? (
                            <span>Mark Unread</span>
                          ) : (
                            <span>✓ Mark Read</span>
                          )}
                        </button>

                        <button
                          type="button"
                          className="cd-notif-tool-btn danger"
                          onClick={() => handleDeleteNotif(notif.id)}
                          title="Dismiss notification"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ========================================================
          5. MODAL: CREATE PUBLIC ANNOUNCEMENT (Teleported to document.body)
         ======================================================== */}
      {isCreateModalOpen && createPortal(
        <div className="cd-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="cd-ann-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="cd-ann-modal-header">
              <div className="cd-ann-modal-title-wrap">
                <span className="cd-ann-modal-icon">📢</span>
                <div>
                  <h3 className="cd-ann-modal-title">Create Public Announcement</h3>
                  <p className="cd-ann-modal-desc">
                    Broadcast an announcement visible to all students and faculty mentors campus-wide.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cd-modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Poster Info Badge */}
            <div className="cd-ann-poster-identity-bar">
              <div className="cd-poster-badge">
                <span className="cd-poster-label">Posting As:</span>
                <span className="cd-poster-name">{user?.displayName || 'Campus User'}</span>
                <span className={`cd-ann-role-chip ${user?.role === 'MENTOR' ? 'role-mentor' : 'role-student'}`}>
                  {user?.role === 'MENTOR' ? '👥 Faculty Mentor' : user?.role === 'ADMIN' ? '🛡️ Admin' : '🎓 Student'}
                </span>
                <span className="cd-poster-dept">• {user?.department || 'Campus Department'}</span>
              </div>
            </div>

            {formError && (
              <div className="cd-ann-form-error animate-fade-in">
                ⚠️ {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAnnouncement} className="cd-ann-form">
              {/* Title Input */}
              <div className="cd-form-group">
                <label className="cd-form-label">
                  Announcement Title <span className="cd-required">*</span>
                </label>
                <input
                  type="text"
                  className="cd-form-input"
                  placeholder="e.g., Annual Tech Hackathon 2026 - Registration Open!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="cd-form-row-2">
                <div className="cd-form-group">
                  <label className="cd-form-label">Category</label>
                  <select
                    className="cd-form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="CAMPUS_EVENT">🎪 Campus Event & Fest</option>
                    <option value="WORKSHOP">🛠️ Workshop & Hackathon</option>
                    <option value="ACADEMIC_NOTICE">📚 Academic Notice & Exam</option>
                    <option value="STUDENT_CLUB">🎭 Student Club Activity</option>
                    <option value="RESEARCH">🔬 Research & Projects</option>
                    <option value="GENERAL">📢 General Announcement</option>
                  </select>
                </div>

                <div className="cd-form-group">
                  <label className="cd-form-label">Priority Level</label>
                  <select
                    className="cd-form-select"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="NORMAL">🟢 Normal Notice</option>
                    <option value="IMPORTANT">🟡 Important Announcement</option>
                    <option value="URGENT">🔴 Urgent / Immediate Attention</option>
                  </select>
                </div>
              </div>

              {/* Pin to Top Checkbox */}
              <div className="cd-form-checkbox-row">
                <label className="cd-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="cd-checkbox-input"
                  />
                  <span>📌 Pin this announcement to the top of the campus feed</span>
                </label>
              </div>

              {/* Content / Message Textarea */}
              <div className="cd-form-group">
                <label className="cd-form-label">
                  Announcement Content / Message <span className="cd-required">*</span>
                </label>
                <textarea
                  className="cd-form-textarea"
                  rows={5}
                  placeholder="Write complete details, eligibility, schedule, venue/online link, and who to contact..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="cd-ann-modal-footer">
                <button
                  type="button"
                  className="cd-btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submittingAnnouncement}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cd-btn-primary"
                  disabled={submittingAnnouncement}
                >
                  {submittingAnnouncement ? 'Publishing...' : '📢 Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          6. MODAL: DELETE CONFIRMATION (Teleported to document.body)
         ======================================================== */}
      {announcementToDelete && createPortal(
        <div className="cd-modal-overlay" onClick={() => setAnnouncementToDelete(null)}>
          <div
            className="cd-delete-confirm-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cd-delete-icon-wrap">🗑️</div>
            <h3 className="cd-delete-title">Delete Announcement?</h3>
            <p className="cd-delete-desc">
              Are you sure you want to delete <strong>"{announcementToDelete.title}"</strong>?
              This announcement will be permanently removed for all students and faculty mentors.
            </p>
            <div className="cd-delete-actions">
              <button
                type="button"
                className="cd-btn-secondary"
                onClick={() => setAnnouncementToDelete(null)}
                disabled={isDeleting}
              >
                Keep Announcement
              </button>
              <button
                type="button"
                className="cd-btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Announcement'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
