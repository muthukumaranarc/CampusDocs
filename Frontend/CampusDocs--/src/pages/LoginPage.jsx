import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { authService } from '../services/api'
import sunriseBg from '../assets/solitary-sunrise.png'
import './LoginPage.css'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)
  const [dismissedError, setDismissedError] = useState(false)

  // Derive error directly from query parameter
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
    if (user.onboardingCompleted === false) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div
      className="login-fullscreen-page"
      style={{ backgroundImage: `url(${sunriseBg})` }}
    >
      {/* Subtle ambient overlay */}
      <div className="canvas-gradient-overlay" />

      {/* Top Header Bar */}
      <header className="showcase-nav">
        <div className="showcase-brand">
          <div className="stacked-logo-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10.5L16 17L28 10.5L16 4Z" fill="#3B82F6" />
              <path d="M4 15.5L16 22L28 15.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20.5L16 27L28 20.5" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="showcase-brand-name">CampusDocs</span>
        </div>

        {/* Non-clickable static text */}
        <div className="showcase-nav-words">
          <span>Learn</span>
          <span>Build</span>
          <span>Grow</span>
          <span className="nav-dash" />
        </div>
      </header>

      {/* Main Content: Left Hero + Right Floating Auth Card */}
      <div className="showcase-content">
        {/* Left Hero Content */}
        <div className="hero-statement">
          <h1 className="hero-headline">
            A Smarter<br />
            Way to <span className="hero-accent">Learn</span>
          </h1>

          <p className="hero-description">
            Personalized learning. Real progress.<br />
            A better you.
          </p>

          <div className="hero-bottom-tagline">
            <span className="tagline-hyphen">—</span>
            <span>DISCOVER • PRACTICE • TRACK • ACHIEVE</span>
          </div>
        </div>

        {/* Right Floating Auth Card */}
        <div className="auth-floating-card">
          <div className="auth-card-header">
            <div className="auth-card-logo">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L4 10.5L16 17L28 10.5L16 4Z" fill="#3B82F6" />
                <path d="M4 15.5L16 22L28 15.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20.5L16 27L28 20.5" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="auth-card-title">CampusDocs</h2>
            <p className="auth-card-subtitle">
              Sign in to continue your learning journey
            </p>
          </div>

          {authError && (
            <div className="alert alert-error auth-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="alert-content">
                <p>{authError}</p>
              </div>
              <button
                className="alert-close"
                onClick={() => setDismissedError(true)}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Google Authentication Pill Button */}
          <div className="auth-actions-group">
            <button
              onClick={handleGoogleLogin}
              disabled={redirecting}
              className="btn-google-pill"
              title="Sign in with your Google account"
            >
              <div className="google-icon-wrapper">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <span className="google-btn-text">
                {redirecting ? 'Connecting...' : 'Continue with Google'}
              </span>

              <div className="google-arrow-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          </div>

          {/* Feature Highlights Row */}
          <div className="auth-features-row">
            <div className="feature-item">
              <div className="feature-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
              </div>
              <span className="feature-text">Personalized<br />Learning</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className="feature-text">Track<br />Progress</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <span className="feature-text">Achieve<br />Your Goals</span>
            </div>
          </div>

          {/* Cloud & Security Trust Feature Badge */}
          <div className="auth-drive-card">
            <div className="drive-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="drive-card-title">Google Drive Verified Storage</span>
            </div>
            <p className="drive-card-desc">
              Documents are stored in your personal Google Drive with 1-to-1 mentor analysis.
            </p>
          </div>

          {/* Disclaimer Footer */}
          <div className="auth-card-footer">
            <p className="auth-disclaimer">
              Only Google authentication is used for secure and seamless access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
