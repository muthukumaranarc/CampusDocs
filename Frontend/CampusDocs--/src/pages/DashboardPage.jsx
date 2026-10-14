import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { driveService } from '../services/api'
import Navbar from '../components/Navbar'
import UploadModal from '../components/UploadModal'
import DocumentLibrary from '../components/DocumentLibrary'

export default function DashboardPage() {
  const { user, checkAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [driveStatus, setDriveStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [actionType, setActionType] = useState('success')
  const [errorMessage, setErrorMessage] = useState(null)

  // Module 2 & 3: Upload modal and library refresh trigger
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchDriveStatus = useCallback(async () => {
    try {
      const status = await driveService.getStatus()
      setDriveStatus(status)
    } catch (err) {
      console.error('Failed to load drive status:', err)
      const msg = err.response?.data?.message || 'Unable to check Google Drive status.'
      setErrorMessage(msg)
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    driveService.getStatus()
      .then((status) => {
        if (active) {
          setDriveStatus(status)
          setLoadingStatus(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load drive status:', err)
          const msg = err.response?.data?.message || 'Unable to check Google Drive status.'
          setErrorMessage(msg)
          setLoadingStatus(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Check URL notification parameters on mount
  useEffect(() => {
    if (searchParams.get('drive_connected') === 'true') {
      const timer = setTimeout(() => {
        setActionMessage('Google Drive was connected successfully! Your CampusDocs folder is ready.')
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

  const handleEnsureFolder = async () => {
    try {
      setActionLoading(true)
      setErrorMessage(null)
      setActionMessage(null)
      const res = await driveService.ensureFolder()
      setDriveStatus(res)
      setActionMessage('CampusDocs folder successfully verified in your Google Drive!')
      await checkAuth()
    } catch (err) {
      console.error('Error verifying folder:', err)
      const errorData = err.response?.data
      if (errorData?.authorizationRequired) {
        setErrorMessage('Google Drive authorization has expired or was revoked. Please reconnect your account.')
      } else {
        setErrorMessage(errorData?.message || 'Failed to verify or create CampusDocs folder.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisconnectDrive = async () => {
    const confirmed = window.confirm('Are you sure you want to disconnect Google Drive? CampusDocs will no longer access your Drive until reconnected.')
    if (!confirmed) return

    try {
      setActionLoading(true)
      setErrorMessage(null)
      setActionMessage(null)
      await driveService.disconnect()
      await checkAuth()
      await fetchDriveStatus()
      setActionMessage('Google Drive has been disconnected from CampusDocs.')
    } catch (err) {
      console.error('Error disconnecting Drive:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to disconnect Google Drive.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadSuccess = (newDoc) => {
    setIsUploadModalOpen(false)
    setRefreshTrigger((prev) => prev + 1)
    setActionMessage(`Document "${newDoc.title}" successfully uploaded and saved into your Google Drive CampusDocs folder!`)
  }

  const isDriveConnected = driveStatus?.driveConnected ?? user?.driveConnected
  const isFolderReady = driveStatus?.folderReady ?? user?.folderReady
  const folderId = driveStatus?.folderId || user?.folderId

  return (
    <div className="dashboard-container">
      <Navbar />

      <main className="dashboard-main">
        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div className="welcome-text">
            <h2>Welcome, {user?.displayName || 'Student'}! 👋</h2>
            <p className="welcome-subtitle">
              Manage your academic document storage securely in your personal Google Drive.
            </p>
          </div>
          <div className="welcome-actions">
            {isFolderReady && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn btn-primary btn-upload-banner"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Document
              </button>
            )}
            <div className="user-profile-chip">
              <span className="user-email-label">{user?.email}</span>
              <span className="user-id-label">ID: #{user?.id}</span>
            </div>
          </div>
        </section>

        {/* Notifications / Alerts */}
        {actionMessage && (
          <div className={`alert ${actionType === 'info' ? 'alert-info' : 'alert-success'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {actionType === 'info' ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </>
              ) : (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              )}
            </svg>
            <div className="alert-content">
              <p>{actionMessage}</p>
            </div>
            <button className="alert-close" onClick={() => setActionMessage(null)}>×</button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="alert-content">
              <strong>Error</strong>
              <p>{errorMessage}</p>
            </div>
            <button className="alert-close" onClick={() => setErrorMessage(null)}>×</button>
          </div>
        )}

        {/* Status Cards Grid */}
        <div className="cards-grid">
          {/* Card 1: Google Drive Connection */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon drive-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="card-title-group">
                <h3>Google Drive Connection</h3>
                <span className={`status-pill ${isDriveConnected ? 'status-pill-success' : 'status-pill-warning'}`}>
                  <span className="status-dot"></span>
                  {loadingStatus ? 'Checking...' : isDriveConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>

            <div className="card-body">
              <p className="card-description">
                {isDriveConnected
                  ? 'Your personal Google Drive account is authorized. CampusDocs can securely manage documents within your dedicated folder.'
                  : 'Connect your Google Drive to enable dedicated document storage for your certificates and academic records.'}
              </p>

              <div className="meta-box">
                <div className="meta-row">
                  <span className="meta-label">Storage Scope:</span>
                  <span className="meta-value"><code>drive.file</code> (Minimum required)</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Account:</span>
                  <span className="meta-value">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="card-footer">
              {!isDriveConnected ? (
                <button
                  onClick={handleConnectDrive}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  {actionLoading ? 'Connecting...' : 'Connect Google Drive'}
                </button>
              ) : (
                <div className="action-buttons-group">
                  <button
                    onClick={handleConnectDrive}
                    disabled={actionLoading}
                    className="btn btn-secondary btn-sm"
                    title="Refresh or re-authorize Google Drive permissions"
                  >
                    Reconnect Drive
                  </button>
                  <button
                    onClick={handleDisconnectDrive}
                    disabled={actionLoading}
                    className="btn btn-danger-outline btn-sm"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Dedicated Folder Management */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon folder-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="card-title-group">
                <h3>CampusDocs Folder</h3>
                <span className={`status-pill ${isFolderReady ? 'status-pill-success' : 'status-pill-secondary'}`}>
                  <span className="status-dot"></span>
                  {loadingStatus ? 'Checking...' : isFolderReady ? 'Ready' : 'Not Initialized'}
                </span>
              </div>
            </div>

            <div className="card-body">
              <p className="card-description">
                {isFolderReady
                  ? 'Your dedicated folder "CampusDocs" is active in your Google Drive and ready for file management.'
                  : isDriveConnected
                  ? 'Drive is connected. Click below to create or verify your dedicated CampusDocs folder.'
                  : 'Connect your Google Drive first to create your dedicated folder.'}
              </p>

              <div className="meta-box">
                <div className="meta-row">
                  <span className="meta-label">Folder Name:</span>
                  <span className="meta-value font-medium">CampusDocs</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Folder ID:</span>
                  <span className="meta-value">
                    {folderId ? (
                      <code className="folder-id-code" title={folderId}>{folderId}</code>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <div className="action-buttons-group">
                <button
                  onClick={handleEnsureFolder}
                  disabled={!isDriveConnected || actionLoading}
                  className="btn btn-secondary"
                  title="Verify or create dedicated folder"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  {actionLoading ? 'Working...' : isFolderReady ? 'Verify Folder' : 'Initialize Folder'}
                </button>

                {isFolderReady && folderId && (
                  <a
                    href={`https://drive.google.com/drive/folders/${folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Open in Drive
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Complete Document Library */}
        {isFolderReady && (
          <DocumentLibrary
            onOpenUpload={() => setIsUploadModalOpen(true)}
            refreshTrigger={refreshTrigger}
            onActionNotification={({ type, text }) => {
              if (type === 'error') {
                setErrorMessage(text)
              } else {
                setActionType(type || 'success')
                setActionMessage(text)
              }
            }}
          />
        )}

        {/* Info Banner */}
        <section className="info-banner">
          <div className="info-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="info-text">
            <strong>Module 3 Implementation Active: Complete Document Management</strong>
            <p>
              Full document management is live. Search across filenames & titles, category filtering, multi-field sorting, in-browser previews for PDFs and images, secure streaming downloads, metadata edits, and Google Drive synchronized deletions are all operational.
            </p>
          </div>
        </section>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
