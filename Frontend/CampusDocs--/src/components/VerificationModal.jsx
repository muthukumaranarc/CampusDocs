import './VerificationModal.css'

export default function VerificationModal({ isOpen, onClose, document }) {
  if (!isOpen || !document) return null

  const isVerified = document.status === 'APPROVED' || document.status === 'Verified'

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card cd-verification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="cd-modal-title-wrap">
            <span className={`status-pill ${isVerified ? 'status-pill-success' : 'status-pill-warning'}`}>
              {isVerified ? '● Verified' : '● Pending Review'}
            </span>
            <h3 className="modal-title">{document.title || 'Document Verification Status'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="cd-v-doc-info">
            <div className="cd-v-meta-item">
              <span className="cd-v-label">Document ID</span>
              <span className="cd-v-val"><code>{document.id || 'CD-2025-0891'}</code></span>
            </div>
            <div className="cd-v-meta-item">
              <span className="cd-v-label">Category</span>
              <span className="cd-v-val">{document.category || 'Institutional Certificate'}</span>
            </div>
            <div className="cd-v-meta-item">
              <span className="cd-v-label">Submitted On</span>
              <span className="cd-v-val">{document.uploadDate || '28 Sep 2025'}</span>
            </div>
            <div className="cd-v-meta-item">
              <span className="cd-v-label">Reviewing Body</span>
              <span className="cd-v-val">{document.reviewer || 'Department Verification Office'}</span>
            </div>
          </div>

          <h4 className="cd-v-timeline-title">Verification Lifecycle</h4>
          <div className="cd-v-timeline">
            {/* Step 1 */}
            <div className="cd-v-step completed">
              <div className="cd-v-step-bubble">✓</div>
              <div className="cd-v-step-content">
                <h5>Document Submitted</h5>
                <p>Digital copy successfully received and metadata recorded.</p>
                <span className="cd-v-time">28 Sep 2025, 10:14 AM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="cd-v-step completed">
              <div className="cd-v-step-bubble">✓</div>
              <div className="cd-v-step-content">
                <h5>Secure Google Drive Sync</h5>
                <p>Encrypted copy stored in personal Google Drive <code>CampusDocs</code> folder.</p>
                <span className="cd-v-time">28 Sep 2025, 10:15 AM</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`cd-v-step ${isVerified ? 'completed' : 'current'}`}>
              <div className="cd-v-step-bubble">{isVerified ? '✓' : '3'}</div>
              <div className="cd-v-step-content">
                <h5>Faculty & Department Review</h5>
                <p>{isVerified ? 'Academic records confirmed and signature verified.' : 'Staff reviewing document validity against institutional records.'}</p>
                <span className="cd-v-time">{isVerified ? '29 Sep 2025, 02:40 PM' : 'Currently in progress'}</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`cd-v-step ${isVerified ? 'completed' : 'pending'}`}>
              <div className="cd-v-step-bubble">{isVerified ? '✓' : '4'}</div>
              <div className="cd-v-step-content">
                <h5>Institutional Seal & Issuance</h5>
                <p>{isVerified ? 'Digital stamp generated. Document is officially verified and tamper-proof.' : 'Awaiting completion of faculty review stage.'}</p>
                <span className="cd-v-time">{isVerified ? '30 Sep 2025, 09:00 AM' : 'Expected within 24-48 hours'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
