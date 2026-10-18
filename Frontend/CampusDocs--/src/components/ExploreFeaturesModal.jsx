import './ExploreFeaturesModal.css'

export default function ExploreFeaturesModal({ isOpen, onClose, onOpenUpload }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card cd-explore-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="cd-modal-title-wrap">
            <span className="cd-modal-badge">CampusDocs Platform Features</span>
            <h3 className="modal-title">Your Campus. Your Verified Records.</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body cd-explore-body">
          <div className="cd-feature-grid">
            <div className="cd-feature-card">
              <div className="cd-feature-icon cd-icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h4>Private Google Drive Cloud</h4>
              <p>Documents are safely mirrored into your personal Google Drive folder using granular <code>drive.file</code> permissions.</p>
            </div>

            <div className="cd-feature-card">
              <div className="cd-feature-icon cd-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h4>Institutional Verification</h4>
              <p>Tamper-proof digital certificates, semester mark sheets, and bonafide records verified directly by authorized faculty.</p>
            </div>

            <div className="cd-feature-card">
              <div className="cd-feature-icon cd-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h4>1-to-1 Faculty Mentorship</h4>
              <p>Direct communication, academic coursework evaluation, revision annotations, and real-time mentor recommendations.</p>
            </div>

            <div className="cd-feature-card">
              <div className="cd-feature-icon cd-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <h4>Instant Status Tracking</h4>
              <p>Full audit trail and lifecycle tracking from submission, review, to official institutional stamp and issuance.</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose()
              if (onOpenUpload) onOpenUpload()
            }}
          >
            Upload a Document →
          </button>
        </div>
      </div>
    </div>
  )
}
