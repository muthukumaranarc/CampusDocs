import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { driveService, documentService, notificationService } from '../services/api'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import MobileBottomNav from '../components/MobileBottomNav'
import UploadModal from '../components/UploadModal'
import ExploreFeaturesModal from '../components/ExploreFeaturesModal'
import VerificationModal from '../components/VerificationModal'
import DocumentLibrary from '../components/DocumentLibrary'
import NotificationsView from '../components/NotificationsView'
import FriendsView from '../components/FriendsView'

import SettingsView from '../components/SettingsView'
import MentorWorkspace from '../components/MentorWorkspace'
import AdminWorkspace from '../components/AdminWorkspace'
import StudentMentorSection from '../components/StudentMentorSection'

import homeHeroGraphic from '../assets/home_hero_graphic.png'
import catIconAcademic from '../assets/cat_icon_academic.png'
import catIconIdentity from '../assets/cat_icon_identity.png'
import catIconCertificates from '../assets/cat_icon_certificates.png'
import catIconOthers from '../assets/cat_icon_others.png'

import docIconSheet from '../assets/doc_icon_sheet.png'
import docIconTc from '../assets/doc_icon_tc.png'
import docIconCommunity from '../assets/doc_icon_community.png'
import docIconAadhaar from '../assets/doc_icon_aadhaar.png'
import docIconPhoto from '../assets/doc_icon_photo.png'

import targetAvatar from '../assets/target-muthu-avatar.png'
import defaultAvatar from '../assets/default-avatar.png'
import './DashboardPage.css'

import qaIconUpload from '../assets/qa_icon_upload.png'
import qaIconView from '../assets/qa_icon_view.png'
import qaIconVerify from '../assets/qa_icon_verify.png'
import qaIconDownload from '../assets/qa_icon_download.png'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getDocTypeInfo(doc) {
  const mime = (doc?.mimeType || doc?.fileType || '').toLowerCase()
  const title = (doc?.title || doc?.originalFileName || '').toLowerCase()
  if (mime.includes('pdf') || title.endsWith('.pdf')) {
    return { type: 'PDF', badgeClass: 'pdf' }
  }
  if (mime.includes('word') || mime.includes('document') || title.endsWith('.doc') || title.endsWith('.docx')) {
    return { type: 'DOCX', badgeClass: 'docx' }
  }
  if (mime.startsWith('image/') || title.endsWith('.png') || title.endsWith('.jpg') || title.endsWith('.jpeg')) {
    return { type: 'IMG', badgeClass: 'img' }
  }
  return { type: 'DOC', badgeClass: 'generic' }
}

export default function DashboardPage() {
  const { user, checkAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const userRole = user?.role || 'STUDENT'

  // Derive active view from the URL endpoint pathname
  const activeView = useMemo(() => {
    const rawPath = location.pathname.replace(/^\//, '').toLowerCase()
    const path = rawPath.split('/')[0]

    if (!path || path === 'dashboard' || path === 'home') return 'home'
    if (path === 'documents') return 'documents'
    if (path === 'friends') return 'friends'
    if (path === 'mentor') return 'mentor'
    if (path === 'mentorship') return 'mentorship'
    if (path === 'admin') return 'admin'
    if (path === 'notifications') return 'notifications'
    if (path === 'announcements') return 'announcements'
    if (path === 'settings' || path === 'profile') return 'settings'

    // Also support fallback query parameter ?view=...
    const viewParam = searchParams.get('view')
    if (viewParam) return viewParam

    return 'home'
  }, [location.pathname, searchParams])

  // Central navigation handler to transition between endpoints
  const setActiveView = useCallback((targetView) => {
    if (targetView === 'home' || targetView === 'dashboard') {
      navigate('/dashboard')
    } else if (targetView === 'profile') {
      setSettingsTab('profile')
      navigate('/settings?tab=profile')
    } else {
      navigate(`/${targetView}`)
    }
  }, [navigate])

  const [settingsTab, setSettingsTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Keep settings tab synchronized with query param ?tab= or route /profile
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setSettingsTab(tabParam)
    } else if (location.pathname === '/profile') {
      setSettingsTab('profile')
    }
  }, [searchParams, location.pathname])

  // Guard role-restricted endpoints
  useEffect(() => {
    if (activeView === 'admin' && userRole !== 'ADMIN') {
      navigate('/dashboard', { replace: true })
    } else if (activeView === 'mentorship' && userRole === 'STUDENT') {
      navigate('/dashboard', { replace: true })
    } else if (activeView === 'mentor' && userRole !== 'STUDENT') {
      navigate('/dashboard', { replace: true })
    }
  }, [activeView, userRole, navigate])

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false)
  const [selectedDocForVerification, setSelectedDocForVerification] = useState(null)
  const [activeDocMenuId, setActiveDocMenuId] = useState(null)

  // Drive integration state
  const [driveStatus, setDriveStatus] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Real documents from API
  const [realDocs, setRealDocs] = useState([])

  // Real notifications unread count
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount()
      if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      }
    } catch (err) {
      // Silently ignore if network issue or guest session
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Drive Status Fetcher
  const fetchDriveStatus = useCallback(async () => {
    try {
      const status = await driveService.getStatus()
      setDriveStatus(status)
    } catch (err) {
      console.error('Failed to load drive status:', err)
      const msg = err.response?.data?.message || 'Unable to check Google Drive status.'
      setErrorMessage(msg)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(fetchDriveStatus)
  }, [fetchDriveStatus])

  // Load user's real documents if available
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => documentService.getDocuments({ page: 0, size: 20 }))
      .then((data) => {
        if (active) {
          setRealDocs(data.content || [])
        }
      })
      .catch(() => {
        if (active) {
          console.warn('Could not load real documents; continuing without dashboard records.')
        }
      })

    return () => {
      active = false
    }
  }, [refreshTrigger])

  // URL params check on mount
  useEffect(() => {
    if (searchParams.get('drive_connected') === 'true') {
      const timer = setTimeout(() => {
        setActionMessage('Google Drive was connected successfully! Your CampusDocs folder is active.')
        checkAuth()
        fetchDriveStatus()
        searchParams.delete('drive_connected')
        setSearchParams(searchParams, { replace: true })
      }, 0)
      return () => clearTimeout(timer)
    } else if (searchParams.get('login') === 'success') {
      const timer = setTimeout(() => {
        searchParams.delete('login')
        setSearchParams(searchParams, { replace: true })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [searchParams, setSearchParams, checkAuth, fetchDriveStatus])

  const handleConnectDrive = async () => {
    try {
      setActionLoading(true)
      setErrorMessage(null)
      const res = await driveService.connect()
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl
      }
    } catch (err) {
      console.error('Error connecting Drive:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to initiate Google Drive authorization.')
      setActionLoading(false)
    }
  }

  const handleUploadSuccess = (newDoc) => {
    setIsUploadModalOpen(false)
    setRefreshTrigger((prev) => prev + 1)
    setActionMessage(`Document "${newDoc.title}" successfully uploaded and saved into your Google Drive CampusDocs folder!`)
  }

  const handleNotify = ({ type, text }) => {
    if (type === 'error') {
      setErrorMessage(text)
    } else {
      setActionMessage(text)
    }
    fetchUnreadCount()
  }

  const isDriveConnected = driveStatus?.driveConnected ?? user?.driveConnected
  const isFolderReady = driveStatus?.folderReady ?? user?.folderReady
  const folderId = driveStatus?.folderId || user?.folderId

  // Real Category Counts computed from uploaded documents
  const categoryCounts = useMemo(() => {
    let academic = 0
    let identity = 0
    let certificates = 0
    let others = 0

    ;(realDocs || []).forEach((doc) => {
      const cat = (doc.category || '').toUpperCase()
      if (cat.includes('ACADEMIC') || cat.includes('MARK') || cat.includes('TRANS')) {
        academic++
      } else if (cat.includes('IDENT') || cat.includes('AADHAAR') || cat.includes('PAN') || cat.includes('ID')) {
        identity++
      } else if (cat.includes('CERT') || cat.includes('BONAFIDE') || cat.includes('COMMUNITY')) {
        certificates++
      } else {
        others++
      }
    })

    return { academic, identity, certificates, others }
  }, [realDocs])

  // Real Storage Usage computed from actual uploaded document sizes
  const storageMetrics = useMemo(() => {
    const totalBytes = (realDocs || []).reduce((acc, doc) => acc + (doc.fileSize || 0), 0)
    const mbUsed = (totalBytes / (1024 * 1024)).toFixed(1)
    const percent = Math.min(100, Math.max(totalBytes > 0 ? 1 : 0, Math.round((totalBytes / (1024 * 1024 * 1024)) * 100)))
    return { mbUsed, percent }
  }, [realDocs])

  // Real uploaded documents list for display
  const allDisplayDocs = useMemo(() => {
    return (realDocs || []).map((doc) => {
      let icon = docIconSheet
      const c = (doc.category || '').toUpperCase()
      if (c.includes('IDENT')) icon = docIconAadhaar
      else if (c.includes('CERT')) icon = docIconCommunity
      else if (c.includes('OTHER')) icon = docIconPhoto

      const isVerified = doc.analysisStatus === 'APPROVED' || doc.mentorReviewStatus === 'APPROVED'

      return {
        id: doc.id,
        title: doc.title,
        category: doc.category || 'Academic',
        uploadedDate: doc.createdAt
          ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'Recently',
        status: isVerified ? 'Verified' : 'Pending',
        iconImg: icon,
        isReal: true,
        realData: doc,
      }
    })
  }, [realDocs])

  // Dynamic Welcome Name: dynamically uses logged-in user displayName, name, or email prefix
  const welcomeName = useMemo(() => {
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName.trim()
    }
    if (user?.name && user.name.trim()) {
      return user.name.trim()
    }
    if (user?.email) {
      const local = user.email.split('@')[0]
      return local.charAt(0).toUpperCase() + local.slice(1)
    }
    return 'Student'
  }, [user])

  // Real Counts for stats bar
  const verifiedCount = useMemo(() => {
    return (realDocs || []).filter(
      (d) => d.status === 'APPROVED' || d.status === 'Verified' || d.analysisStatus === 'APPROVED' || d.mentorReviewStatus === 'APPROVED'
    ).length
  }, [realDocs])

  const certificatesCount = useMemo(() => {
    return (realDocs || []).filter((d) => (d.category || '').toUpperCase().includes('CERT')).length
  }, [realDocs])

  // Handle Download Action for Real Documents
  const handleDownloadDoc = async (doc) => {
    if (doc?.id) {
      try {
        await documentService.download(doc.id, doc.title || doc.originalFileName || 'document')
        setActionMessage(`Downloaded "${doc.title}" successfully.`)
      } catch {
        setErrorMessage('Failed to download document from Google Drive.')
      }
    } else {
      setErrorMessage('Document not found for download.')
    }
  }

  // Handle Download All Certificates Quick Action
  const handleDownloadAllCertificates = () => {
    const verified = allDisplayDocs.filter((d) => d.status === 'Verified')
    if (verified.length === 0) {
      setActionMessage('No verified certificates available for download yet.')
      return
    }
    handleDownloadDoc(verified[0])
    setActionMessage(`Preparing download for ${verified.length} verified certificate(s)...`)
  }

  return (
    <div className="cd-app-shell">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSettings={() => {
          setSettingsTab('overview')
          setActiveView('settings')
        }}
        onOpenExplore={() => setIsExploreModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        unreadCount={unreadCount}
      />

      {/* 2. Main Content Container */}
      <div className="cd-main-panel">
        {/* Top Header Bar (Search input removed) */}
        <TopHeader
          onOpenNotifications={() => setActiveView('notifications')}
          onOpenSettings={() => {
            setSettingsTab('overview')
            setActiveView('settings')
          }}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onConnectDrive={handleConnectDrive}
          isDriveConnected={isDriveConnected}
          isFolderReady={isFolderReady}
          folderId={folderId}
          unreadCount={unreadCount}
        />

        {/* Global Notifications / Error Messages */}
        {actionMessage && (
          <div className="cd-banner-alert cd-banner-success animate-fade-in">
            <div className="cd-banner-content">
              <span className="cd-banner-icon">✓</span>
              <span>{actionMessage}</span>
            </div>
            <button className="cd-banner-close" onClick={() => setActionMessage(null)}>×</button>
          </div>
        )}

        {errorMessage && (
          <div className="cd-banner-alert cd-banner-error animate-fade-in">
            <div className="cd-banner-content">
              <span className="cd-banner-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button className="cd-banner-close" onClick={() => setErrorMessage(null)}>×</button>
          </div>
        )}

        {/* Google Drive Status Bar if not ready */}
        {!isDriveConnected && (
          <div className="cd-drive-alert-bar animate-fade-in">
            <div className="cd-drive-alert-info">
              <span className="cd-drive-alert-icon">☁️</span>
              <div>
                <strong>Google Drive is not connected yet.</strong>
                <p>Connect your personal Drive account to enable dedicated cloud storage for your academic records.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm cd-drive-connect-btn"
              onClick={handleConnectDrive}
              disabled={actionLoading}
            >
              {actionLoading ? 'Connecting...' : 'Connect Google Drive →'}
            </button>
          </div>
        )}

        {/* Main View Area */}
        <div className="cd-view-container">
          {/* ========================================================
              VIEW 1: HOME (Dashboard Showcase - Exact User UI)
             ======================================================== */}
          {activeView === 'home' && (
            <div className="cd-exact-dashboard animate-fade-in">
              {/* 1. Dynamic Interactive Welcome Banner */}
              <div className="cd-home-banner">
                <div className="cd-home-banner-left">
                  <span className="cd-home-banner-tag">CAMPUSDOCS</span>
                  <h1 className="cd-home-banner-title">
                    Welcome back, {welcomeName}! <span className="cd-wave-emoji">👋</span>
                  </h1>
                  <p className="cd-home-banner-subtitle">
                    All your important college documents in one place.
                  </p>
                  <div className="cd-home-banner-features">
                    <span>Secure</span>
                    <span className="cd-banner-dot">•</span>
                    <span>Organized</span>
                    <span className="cd-banner-dot">•</span>
                    <span>Accessible Anytime</span>
                  </div>
                  <div className="cd-home-banner-actions">
                    <button
                      type="button"
                      className="cd-banner-action-btn primary"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Upload Document</span>
                    </button>
                    <button
                      type="button"
                      className="cd-banner-action-btn secondary"
                      onClick={() => setActiveView('documents')}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      </svg>
                      <span>View My Documents</span>
                    </button>
                  </div>
                </div>
                <div className="cd-home-banner-right">
                  <img
                    src={homeHeroGraphic}
                    alt="Access Your Documents Anytime, Anywhere."
                    className="cd-home-banner-img"
                  />
                </div>
              </div>

              {/* 2. Middle Row: Document Categories (Left) + Recent Documents (Right) */}
              <div className="cd-home-row-two">
                {/* Left Column: Document Categories */}
                <div className="cd-home-card cd-home-categories-card">
                  <div className="cd-home-card-header">
                    <div className="cd-home-header-title">
                      <span className="cd-home-card-icon cat-head-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </span>
                      <h3>Document Categories</h3>
                    </div>
                    <button
                      type="button"
                      className="cd-home-header-link"
                      onClick={() => setActiveView('documents')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="cd-home-categories-grid">
                    {/* Academic */}
                    <div
                      className="cd-category-pill-card academic"
                      onClick={() => setActiveView('documents')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cd-category-icon-box academic">
                        <img src={catIconAcademic} alt="Academic" className="cd-cat-img" />
                      </div>
                      <span className="cd-category-name">Academic</span>
                      <span className="cd-category-count">
                        {categoryCounts.academic} {categoryCounts.academic === 1 ? 'document' : 'documents'}
                      </span>
                      <div className="cd-category-arrow-btn academic">
                        →
                      </div>
                    </div>

                    {/* Identity */}
                    <div
                      className="cd-category-pill-card identity"
                      onClick={() => setActiveView('documents')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cd-category-icon-box identity">
                        <img src={catIconIdentity} alt="Identity" className="cd-cat-img" />
                      </div>
                      <span className="cd-category-name">Identity</span>
                      <span className="cd-category-count">
                        {categoryCounts.identity} {categoryCounts.identity === 1 ? 'document' : 'documents'}
                      </span>
                      <div className="cd-category-arrow-btn identity">
                        →
                      </div>
                    </div>

                    {/* Certificates */}
                    <div
                      className="cd-category-pill-card certificates"
                      onClick={() => setActiveView('documents')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cd-category-icon-box certificates">
                        <img src={catIconCertificates} alt="Certificates" className="cd-cat-img" />
                      </div>
                      <span className="cd-category-name">Certificates</span>
                      <span className="cd-category-count">
                        {categoryCounts.certificates} {categoryCounts.certificates === 1 ? 'document' : 'documents'}
                      </span>
                      <div className="cd-category-arrow-btn certificates">
                        →
                      </div>
                    </div>

                    {/* Others */}
                    <div
                      className="cd-category-pill-card others"
                      onClick={() => setActiveView('documents')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cd-category-icon-box others">
                        <img src={catIconOthers} alt="Others" className="cd-cat-img" />
                      </div>
                      <span className="cd-category-name">Others</span>
                      <span className="cd-category-count">
                        {categoryCounts.others} {categoryCounts.others === 1 ? 'document' : 'documents'}
                      </span>
                      <div className="cd-category-arrow-btn others">
                        →
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Recent Documents */}
                <div className="cd-home-card cd-home-recent-card">
                  <div className="cd-home-card-header">
                    <div className="cd-home-header-title">
                      <span className="cd-home-card-icon recent-head-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </span>
                      <h3>Recent Documents</h3>
                    </div>
                    <button
                      type="button"
                      className="cd-home-header-link"
                      onClick={() => setActiveView('documents')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="cd-home-recent-list">
                    {allDisplayDocs.length === 0 ? (
                      <div className="cd-home-empty-recent">
                        <p>No documents uploaded yet.</p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          + Upload Document
                        </button>
                      </div>
                    ) : (
                      allDisplayDocs.slice(0, 3).map((doc) => {
                        const isVerified = doc.status === 'Verified'
                        const typeInfo = getDocTypeInfo(doc.realData || doc)
                        return (
                          <div key={doc.id} className="cd-home-doc-item">
                            <div className={`cd-doc-badge-icon ${typeInfo.badgeClass}`}>
                              <span>{typeInfo.type === 'DOCX' ? 'W' : typeInfo.type}</span>
                            </div>

                            <div className="cd-doc-item-details">
                              <h4 className="cd-doc-item-title" title={doc.title}>
                                {doc.title}
                              </h4>
                              <div className="cd-doc-item-meta">
                                <span>{(doc.category || 'ACADEMIC_RECORDS').toUpperCase()}</span>
                                <span>•</span>
                                <span>{typeInfo.type}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.realData?.fileSize || doc.realData?.size)}</span>
                              </div>
                            </div>

                            <div className="cd-doc-item-date">
                              {doc.uploadedDate}
                            </div>

                            <div className="cd-doc-item-status">
                              <span className={`cd-status-badge ${isVerified ? 'verified' : 'pending'}`}>
                                {doc.status}
                              </span>
                            </div>

                            <div className="cd-doc-item-actions">
                              <div className="cd-doc-menu-wrap">
                                <button
                                  type="button"
                                  className="cd-doc-menu-dots"
                                  onClick={() => setActiveDocMenuId((prev) => (prev === doc.id ? null : doc.id))}
                                  aria-label="More options"
                                >
                                  ⋮
                                </button>
                                {activeDocMenuId === doc.id && (
                                  <div className="cd-doc-context-menu animate-fade-in">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDocMenuId(null)
                                        handleDownloadDoc(doc)
                                      }}
                                    >
                                      Download File
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDocMenuId(null)
                                        setSelectedDocForVerification(doc.realData || doc)
                                      }}
                                    >
                                      Verification Details
                                    </button>
                                    {isFolderReady && folderId && (
                                      <a
                                        href={`https://drive.google.com/drive/folders/${folderId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setActiveDocMenuId(null)}
                                      >
                                        Open in Drive ↗
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Bottom Row: 3 Columns (Storage Usage + Your Profile + Quick Actions) */}
              <div className="cd-home-row-three">
                {/* Column 1: Storage Usage */}
                <div className="cd-home-card cd-home-storage-card">
                  <div className="cd-home-card-header">
                    <div className="cd-home-header-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      </svg>
                      <h3>Storage Usage</h3>
                    </div>
                    <button
                      type="button"
                      className="cd-home-header-link"
                      onClick={() => {
                        setSettingsTab('drive')
                        setActiveView('settings')
                      }}
                    >
                      Upgrade →
                    </button>
                  </div>

                  <div className="cd-storage-main-stat">
                    <strong>{storageMetrics.mbUsed} MB</strong> used of 1 GB
                  </div>

                  <div className="cd-storage-progress-wrapper">
                    <div className="cd-storage-track">
                      <div className="cd-storage-fill" style={{ width: `${Math.max(2, storageMetrics.percent)}%` }} />
                    </div>
                    <span className="cd-storage-percent-label">{storageMetrics.percent}%</span>
                  </div>

                  <div className="cd-storage-info-box">
                    <div className="cd-storage-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="8" rx="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" />
                        <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth="3" />
                        <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
                      </svg>
                    </div>
                    <div className="cd-storage-info-text">
                      <h5>You have plenty of space left!</h5>
                      <p>Upload and store all your important documents securely on CampusDocs.</p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Your Profile */}
                <div className="cd-home-card cd-home-profile-card">
                  <div className="cd-home-card-header">
                    <div className="cd-home-header-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <h3>Your Profile</h3>
                    </div>
                    <button
                      type="button"
                      className="cd-home-header-link"
                      onClick={() => {
                        setSettingsTab('overview')
                        setActiveView('settings')
                      }}
                    >
                      View Profile →
                    </button>
                  </div>

                  <div className="cd-home-profile-body">
                    <div className="cd-home-profile-avatar-wrap">
                      <img
                        src={user?.pictureUrl || defaultAvatar}
                        alt={welcomeName}
                        className="cd-home-profile-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = defaultAvatar
                        }}
                      />
                      <span className="cd-home-online-badge" title="Online" />
                    </div>

                    <div className="cd-home-profile-details">
                      <h4 className="cd-home-user-name">
                        {welcomeName}
                      </h4>
                      <div className="cd-home-profile-field">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Reg / Roll: {user?.rollNumber || '20235468236'}</span>
                      </div>
                      <div className="cd-home-profile-field">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span>{user?.department || 'B.tech in AI and DS'}</span>
                      </div>
                      <div className="cd-home-profile-field">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <polyline points="17 11 19 13 23 9" />
                        </svg>
                        <span>Mentor: {user?.mentorName || (user?.role === 'MENTOR' ? 'Faculty Mentor' : 'Ravi Meiyappan')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cd-home-profile-stats-bar">
                    <div className="cd-home-stat-col">
                      <span className="cd-stat-digit blue">{realDocs.length}</span>
                      <span className="cd-stat-text">Documents</span>
                    </div>
                    <div className="cd-home-stat-divider" />
                    <div className="cd-home-stat-col">
                      <span className="cd-stat-digit green">{verifiedCount}</span>
                      <span className="cd-stat-text">Verifications</span>
                    </div>
                    <div className="cd-home-stat-divider" />
                    <div className="cd-home-stat-col">
                      <span className="cd-stat-digit purple">{certificatesCount}</span>
                      <span className="cd-stat-text">Certificates</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Quick Actions */}
                <div className="cd-home-card cd-home-quick-card">
                  <div className="cd-home-card-header">
                    <div className="cd-home-header-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <h3>Quick Actions</h3>
                    </div>
                  </div>

                  <div className="cd-home-qa-grid">
                    {/* Action 1: Upload Document */}
                    <button
                      type="button"
                      className="cd-home-qa-card blue"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      <div className="cd-home-qa-icon blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className="cd-home-qa-text">
                        <strong>Upload Document</strong>
                        <span>Add new documents</span>
                      </div>
                    </button>

                    {/* Action 2: View My Documents */}
                    <button
                      type="button"
                      className="cd-home-qa-card green"
                      onClick={() => setActiveView('documents')}
                    >
                      <div className="cd-home-qa-icon green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                        </svg>
                      </div>
                      <div className="cd-home-qa-text">
                        <strong>View My Documents</strong>
                        <span>Browse all files</span>
                      </div>
                    </button>

                    {/* Action 3: Check Verification */}
                    <button
                      type="button"
                      className="cd-home-qa-card purple"
                      onClick={() => setActiveView('verification')}
                    >
                      <div className="cd-home-qa-icon purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div className="cd-home-qa-text">
                        <strong>Check Verification</strong>
                        <span>Verify document status</span>
                      </div>
                    </button>

                    {/* Action 4: Download Certificates */}
                    <button
                      type="button"
                      className="cd-home-qa-card orange"
                      onClick={handleDownloadAllCertificates}
                    >
                      <div className="cd-home-qa-icon orange">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </div>
                      <div className="cd-home-qa-text">
                        <strong>Download Certificates</strong>
                        <span>Get verified certificates</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: FULL DOCUMENTS LIBRARY
             ======================================================== */}
          {activeView === 'documents' && (
            <div className="animate-fade-in">
              <DocumentLibrary
                onOpenUpload={() => setIsUploadModalOpen(true)}
                refreshTrigger={refreshTrigger}
                onActionNotification={handleNotify}
                onOpenNotifications={() => setActiveView('notifications')}
              />
            </div>
          )}

          {/* ========================================================
              VIEW 3: CAMPUS FRIENDS & PEERS (Under same & other mentors)
             ======================================================== */}
          {activeView === 'friends' && (
            <FriendsView onNotification={handleNotify} />
          )}

          {/* ========================================================
              VIEW 3: MY FACULTY MENTOR (Students)
             ======================================================== */}
          {activeView === 'mentor' && userRole === 'STUDENT' && (
            <StudentMentorSection onNotification={handleNotify} />
          )}

          {/* ========================================================
              VIEW 4: MENTOR WORKSPACE (Mentors & Admins)
             ======================================================== */}
          {activeView === 'mentorship' && (userRole === 'MENTOR' || userRole === 'ADMIN') && (
            <MentorWorkspace onNotification={handleNotify} />
          )}

          {/* ========================================================
              VIEW 5: ADMIN CONSOLE (Admins)
             ======================================================== */}
          {activeView === 'admin' && userRole === 'ADMIN' && (
            <AdminWorkspace onNotification={handleNotify} />
          )}

          {/* ========================================================
              VIEW 6: NOTIFICATIONS & ANNOUNCEMENTS
             ======================================================== */}
          {(activeView === 'notifications' || activeView === 'announcements') && (
            <NotificationsView
              initialTab={activeView === 'announcements' ? 'announcements' : 'all'}
              onNavigate={(view) => setActiveView(view)}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onUnreadCountChange={setUnreadCount}
            />
          )}

          {/* ========================================================
              VIEW 7: SETTINGS & PROFILE (Unified Settings Page)
             ======================================================== */}
          {(activeView === 'settings' || activeView === 'profile') && (
            <SettingsView
              initialTab={settingsTab}
              onNotification={handleNotify}
              onConnectDrive={handleConnectDrive}
              isDriveConnected={isDriveConnected}
              isFolderReady={isFolderReady}
              folderId={folderId}
            />
          )}
        </div>
      </div>

      {/* 3. Mobile Bottom Navigation (Visible on mobile screens) */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* 4. Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <ExploreFeaturesModal
        isOpen={isExploreModalOpen}
        onClose={() => setIsExploreModalOpen(false)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      <VerificationModal
        isOpen={Boolean(selectedDocForVerification)}
        onClose={() => setSelectedDocForVerification(null)}
        document={selectedDocForVerification}
      />
    </div>
  )
}
