import { useState } from 'react'
import { documentService } from '../services/api'
import './DocumentEditModal.css'

const CATEGORIES = [
  { value: 'ACADEMIC_RECORDS', label: 'Academic Records' },
  { value: 'CERTIFICATES', label: 'Certificates' },
  { value: 'IDENTIFICATION_DOCUMENTS', label: 'Identification Documents' },
  { value: 'PERSONAL_DOCUMENTS', label: 'Personal Documents' },
  { value: 'OTHER', label: 'Other' },
]

export default function DocumentEditModal({ isOpen, onClose, document: doc, onSuccess }) {
  if (!isOpen || !doc) return null

  return (
    <DocumentEditForm
      key={doc.id}
      doc={doc}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function DocumentEditForm({ doc, onClose, onSuccess }) {
  const normalizeCategory = (cat) => {
    if (!cat) return 'ACADEMIC_RECORDS'
    const found = CATEGORIES.find(
      (c) => c.value.toLowerCase() === String(cat).toLowerCase() || c.label.toLowerCase() === String(cat).toLowerCase()
    )
    return found ? found.value : 'ACADEMIC_RECORDS'
  }

  const [title, setTitle] = useState(doc.title || '')
  const [category, setCategory] = useState(() => normalizeCategory(doc.category || doc.categoryDisplayName))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Document title cannot be empty.')
      return
    }

    try {
      setSaving(true)
      const updated = await documentService.update(doc.id, {
        title: trimmedTitle,
        category,
      })
      if (onSuccess) onSuccess(updated)
      onClose()
    } catch (err) {
      console.error('Failed to update document:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to update document. Please try again.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge edit-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h3 id="edit-modal-title" className="modal-heading">Edit Document</h3>
              <p className="modal-subtitle" title={doc.originalFileName}>
                File: <span className="modal-subtitle-bold">{doc.originalFileName}</span>
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
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

          <div className="form-group">
            <label htmlFor="edit-doc-title" className="form-label">
              Document Title <span className="required-star">*</span>
            </label>
            <input
              id="edit-doc-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              maxLength={255}
              placeholder="e.g. 5th Semester Marksheet"
              required
            />
            <span className="input-hint">This title is how your document is identified across CampusDocs.</span>
          </div>

          <div className="form-group">
            <label htmlFor="edit-doc-category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="edit-doc-category"
              className="form-input form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="input-hint">Used for grouping and filtering your documents.</span>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !title.trim()}
            >
              {saving ? (
                <>
                  <span className="spinner-border" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
