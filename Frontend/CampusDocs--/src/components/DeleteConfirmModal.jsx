import { useState } from 'react'
import { documentService } from '../services/api'
import './DeleteConfirmModal.css'

export default function DeleteConfirmModal({ isOpen, onClose, document: doc, onSuccess }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !doc) return null

  const handleDelete = async () => {
    try {
      setDeleting(true)
      setError(null)
      await documentService.delete(doc.id)
      if (onSuccess) onSuccess(doc)
      onClose()
    } catch (err) {
      console.error('Failed to delete document:', err)
      const msg = err.response?.data?.message || 'Failed to delete document from Google Drive. Please try again.'
      setError(msg)
    } finally {
      setDeleting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container delete-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge delete-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h3 id="delete-modal-title" className="modal-heading text-danger">Delete Document</h3>
              <p className="modal-subtitle">Permanent removal confirmation</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert alert-error modal-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="alert-content">
                <p>{error}</p>
              </div>
            </div>
          )}

          <p className="delete-question">
            Are you sure you want to permanently delete this document?
          </p>

          <div className="delete-target-card">
            <div className="delete-target-header">
              <span className="target-title" title={doc.title}>{doc.title}</span>
              <span className="category-pill">{doc.categoryDisplayName || doc.category}</span>
            </div>
            <div className="delete-target-details">
              <span>{doc.originalFileName}</span>
              <span className="doc-meta-dot">•</span>
              <span>{formatFileSize(doc.fileSize)}</span>
            </div>
          </div>

          <div className="delete-warning-callout">
            <div className="callout-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="callout-text">
              <strong>Google Drive Synchronization:</strong>
              <p>This file will be permanently removed from your personal Google Drive <code>CampusDocs</code> folder and deleted from your CampusDocs account. This action cannot be undone.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border" />
                Deleting from Drive...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
