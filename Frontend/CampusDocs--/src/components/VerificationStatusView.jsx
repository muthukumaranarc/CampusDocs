import { useState, useEffect } from 'react'
import { documentService } from '../services/api'
import './VerificationStatusView.css'

export default function VerificationStatusView({ onOpenUpload, onSelectDocForStatus }) {
  const [filter, setFilter] = useState('ALL')
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    documentService.getDocuments({ page: 0, size: 50 })
      .then((res) => {
        if (active) {
          setDocs(res.content || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('Could not load documents for verification status:', err)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const items = docs.map((doc) => {
    const isApproved = doc.analysisStatus === 'APPROVED' || doc.mentorReviewStatus === 'APPROVED'
    const isRejected = doc.analysisStatus === 'REJECTED'
    const status = isApproved ? 'VERIFIED' : (isRejected ? 'REJECTED' : 'PENDING')

    return {
      id: doc.id,
      title: doc.title,
      category: doc.category || 'Academic Records',
      uploadedDate: doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Recently',
      status,
      reviewer: doc.analyzedByName || 'Faculty Review Cell',
      verifiedDate: doc.analyzedAt
        ? new Date(doc.analyzedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : null,
      notes: doc.analysisNotes,
      realData: doc,
    }
  })

  const verifiedCount = items.filter((i) => i.status === 'VERIFIED').length
  const pendingCount = items.filter((i) => i.status === 'PENDING').length

  const filteredItems = items.filter((item) => {
    if (filter === 'ALL') return true
    return item.status === filter
  })

  return (
    <div className="cd-view-panel animate-fade-in">
      <div className="cd-view-header">
        <div>
          <h2 className="cd-view-title">Verification Status</h2>
          <p className="cd-view-subtitle">Track real-time institutional verification and approvals for all your submitted records.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onOpenUpload}>
          + Upload Document
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="cd-filter-tabs">
        <button
          type="button"
          className={`cd-filter-tab ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All Records ({items.length})
        </button>
        <button
          type="button"
          className={`cd-filter-tab ${filter === 'VERIFIED' ? 'active' : ''}`}
          onClick={() => setFilter('VERIFIED')}
        >
          ✓ Verified ({verifiedCount})
        </button>
        <button
          type="button"
          className={`cd-filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          ⏳ In Progress ({pendingCount})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p>Loading real verification records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '16px' }}>No documents in this view</h4>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px' }}>
            {filter === 'ALL'
              ? 'Upload your marksheets, identity records, and certificates to initiate faculty verification.'
              : `No documents currently marked as ${filter.toLowerCase()}.`}
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenUpload}>
            + Upload First Document
          </button>
        </div>
      ) : (
        /* Verification Cards */
        <div className="cd-verification-list">
          {filteredItems.map((item) => {
            const isVerified = item.status === 'VERIFIED'
            const isRejected = item.status === 'REJECTED'

            return (
              <div key={item.id} className="cd-v-card">
                <div className="cd-v-card-main">
                  <div className="cd-v-card-icon-col">
                    <div className={`cd-v-big-icon ${isVerified ? 'verified' : (isRejected ? 'pending' : 'pending')}`}>
                      {isVerified ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 14 14" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="cd-v-card-details">
                    <div className="cd-v-title-row">
                      <h3 className="cd-v-card-name">{item.title}</h3>
                      <span className={`status-pill ${isVerified ? 'status-pill-success' : 'status-pill-warning'}`}>
                        {isVerified ? '● Verified' : (isRejected ? '● Needs Correction' : '● In Review')}
                      </span>
                    </div>
                    <div className="cd-v-card-meta-row">
                      <span>ID: <code>{item.id.substring(0, 10)}...</code></span>
                      <span>•</span>
                      <span>Category: {item.category}</span>
                      <span>•</span>
                      <span>Uploaded: {item.uploadedDate}</span>
                    </div>
                    <p className="cd-v-reviewer-note">
                      {isVerified
                        ? `Approved by ${item.reviewer}${item.verifiedDate ? ` on ${item.verifiedDate}` : ''}. Digital seal is active.${item.notes ? ` Notes: "${item.notes}"` : ''}`
                        : (isRejected
                          ? `Review note from ${item.reviewer}: "${item.notes || 'Document requires resubmission or clearer scan.'}"`
                          : `Under active inspection by ${item.reviewer}. Verification updates will appear here automatically.`)}
                    </p>
                  </div>
                </div>

                <div className="cd-v-card-action">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectDocForStatus(item.realData || item)}
                  >
                    View Details & Audit Trail →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
