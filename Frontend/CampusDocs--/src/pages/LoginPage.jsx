import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { authService } from '../services/api'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)
  const [dismissedError, setDismissedError] = useState(false)

  // Derive error directly from query parameter without unnecessary effect
  const rawError = searchParams.get('error')
  const authError = (!dismissedError && rawError) ? decodeURIComponent(rawError) : null

  const handleGoogleLogin = () => {
    setRedirecting(true)
    window.location.href = authService.getLoginUrl()
  }

  if (loading) {
    return (
      <div className="center-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading CampusDocs...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-icon-large">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h10"/>
              <path d="M6 14h6"/>
            </svg>
          </div>
          <h1 className="brand-heading">CampusDocs</h1>
          <p className="brand-tagline">
            Your documents, securely organized in your Google Drive.
          </p>
        </div>

        {authError && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="alert-content">
              <strong>Authentication Error</strong>
              <p>{authError}</p>
            </div>
            <button className="alert-close" onClick={() => setDismissedError(true)} aria-label="Dismiss error">×</button>
          </div>
        )}

        <div className="login-actions">
          <button
            onClick={handleGoogleLogin}
            disabled={redirecting}
            className="btn btn-google"
          >
            {redirecting ? (
              <>
                <div className="spinner-small"></div>
                Redirecting to Google...
              </>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="login-footer">
          <p className="privacy-note">
            CampusDocs stores your files directly in your personal Google Drive under a dedicated <code>CampusDocs</code> folder. Your file contents are never permanently stored on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
