import { useState, useEffect } from 'react'
import { documentService } from '../services/api'
import './DocumentPreviewModal.css'

export default function DocumentPreviewModal({ isOpen, onClose, document: doc }) {
  if (!isOpen || !doc) return null

  return (
    <DocumentPreviewContent
      key={doc.id}
      doc={doc}
      onClose={onClose}
    />
  )
}

function DocumentPreviewContent({ doc, onClose }) {
  const isPdf = doc.mimeType === 'application/pdf'
  const isImage = doc.mimeType?.startsWith('image/')
  const isShowcase = Boolean(doc.thumbnail || doc.previewImg) && !doc.isReal
  const isPreviewable = isPdf || isImage || isShowcase

  const [blobUrl, setBlobUrl] = useState(isShowcase ? (doc.previewImg || doc.thumbnail) : null)
  const [loading, setLoading] = useState(isPreviewable && !isShowcase)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true
    let createdUrl = null

    if (isShowcase) {
      setBlobUrl(doc.previewImg || doc.thumbnail)
      setLoading(false)
      return
    }

    if (!isPreviewable || !doc.id) {
      return
    }

    documentService.getPreviewBlob(doc.id)
      .then(({ blob }) => {
        if (active) {
          createdUrl = URL.createObjectURL(blob)
          setBlobUrl(createdUrl)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load preview:', err)
          const msg = err.response?.data?.message || 'Unable to stream document preview from Google Drive.'
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [doc.id, isPreviewable, isShowcase, doc.previewImg, doc.thumbnail])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      if (doc.isReal && doc.id) {
        await documentService.download(doc.id, doc.originalFileName || doc.title || 'document')
      } else {
        const demoContent = `CAMPUS DOCUMENTS INSTITUTIONAL RECORD\nDocument: ${doc.title}\nCategory: ${doc.category || 'Academic'}\nStatus: ${doc.status || 'Verified'}\nIssued: ${doc.uploadedDate || 'Oct 2025'}\nDigital Seal: VALID [SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069]`
        const blob = new Blob([demoContent], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${(doc.title || 'document').replace(/\\s+/g, '_')}_Verified.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download error:', err)
      alert(err.response?.data?.message || 'Failed to download document.')
    } finally {
      setDownloading(false)
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
    <div className="modal-backdrop preview-backdrop" onClick={onClose}>
      <div
        className="modal-container preview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        {/* Header */}
        <div className="modal-header preview-header">
          <div className="preview-header-meta">
            <div className="preview-type-badge">
              {isPdf ? (
                <span className="badge-pdf">PDF</span>
              ) : isImage ? (
                <span className="badge-img">IMG</span>
              ) : (
                <span className="badge-generic">DOC</span>
              )}
            </div>
            <div className="preview-title-info">
              <h3 id="preview-modal-title" className="preview-title" title={doc.title}>
                {doc.title}
              </h3>
              <p className="preview-filename">
                {doc.originalFileName} • {formatFileSize(doc.fileSize)} • <span className="preview-cat-text">{doc.categoryDisplayName || doc.category}</span>
              </p>
            </div>
          </div>

          <div className="preview-header-actions">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`btn btn-secondary btn-sm preview-btn ${downloading ? 'btn-action-loading' : ''}`}
              title={downloading ? "Preparing download from Google Drive..." : "Download to computer"}
            >
              {downloading ? (
                <>
                  <span className="download-spinner download-spinner-inline" aria-hidden="true" />
                  Preparing...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </>
              )}
            </button>

            {doc.driveWebViewLink && (
              <a
                href={doc.driveWebViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm preview-btn"
                title="Open in Google Drive"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Drive
              </a>
            )}

            <button
              className="modal-close-btn preview-close-btn"
              onClick={onClose}
              aria-label="Close Preview"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="preview-body">
          {loading ? (
            <div className="preview-loading-box">
              <span className="spinner" />
              <p className="preview-loading-text">Streaming document from your personal Google Drive...</p>
              <span className="preview-loading-sub">Zero permanent storage • Private stream</span>
            </div>
          ) : error ? (
            <div className="unsupported-preview-box preview-error-box">
              <div className="preview-error-icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h4>Unable to load preview</h4>
              <p>{error}</p>
              <div className="preview-fallback-actions">
                {doc.driveWebViewLink && (
                  <a
                    href={doc.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Open in Google Drive
                  </a>
                )}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn btn-secondary btn-sm"
                >
                  {downloading ? 'Preparing...' : 'Download File'}
                </button>
              </div>
            </div>
          ) : !isPreviewable ? (
            <div className="unsupported-preview-box">
              <div className="unsupported-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h4>Direct in-browser preview not supported</h4>
              <p>This file format cannot be rendered inline. You can download the file to view on your device.</p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-primary"
              >
                {downloading ? (
                  <>
                    <span className="spinner-border" />
                    Preparing Download...
                  </>
                ) : (
                  'Download Document'
                )}
              </button>
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={doc.title}
              className="preview-iframe"
            />
          ) : (
            <div className="preview-image-container">
              <img
                src={blobUrl}
                alt={doc.title}
                className="preview-image"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
