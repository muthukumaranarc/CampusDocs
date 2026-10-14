import { useState, useRef } from 'react'
import { documentService } from '../services/api'

const CATEGORIES = [
  { value: 'ACADEMIC_RECORDS', label: 'Academic Records' },
  { value: 'CERTIFICATES', label: 'Certificates' },
  { value: 'IDENTIFICATION_DOCUMENTS', label: 'Identification Documents' },
  { value: 'PERSONAL_DOCUMENTS', label: 'Personal Documents' },
  { value: 'OTHER', label: 'Other' },
]

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('ACADEMIC_RECORDS')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)

  if (!isOpen) return null

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const validateAndSetFile = (file) => {
    setError(null)
    if (!file) return

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the 10 MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`)
      return
    }

    // Validate extension
    const fileName = file.name || ''
    const extIndex = fileName.lastIndexOf('.')
    const ext = extIndex !== -1 ? fileName.substring(extIndex).toLowerCase() : ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type: ${ext || 'unknown'}. Only PDF, JPG, JPEG, and PNG files are allowed.`)
      return
    }

    setSelectedFile(file)
    // Auto-fill title if user hasn't typed one yet
    if (!title.trim()) {
      const defaultTitle = fileName.substring(0, extIndex).replace(/[_-]+/g, ' ')
      setTitle(defaultTitle)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (uploading) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    if (uploading) return
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setUploading(false)
    setUploadProgress(0)
    setStatusMessage('')
    setError('Upload was cancelled.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }

    if (!title.trim()) {
      setError('Please provide a document title.')
      return
    }

    if (!category) {
      setError('Please select a document category.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('title', title.trim())
    formData.append('category', category)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setUploading(true)
      setUploadProgress(0)
      setStatusMessage('Uploading to server...')

      const uploadedDoc = await documentService.upload(
        formData,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
            if (percent >= 100) {
              setStatusMessage('Saving file to your Google Drive folder...')
            } else {
              setStatusMessage(`Uploading: ${percent}%`)
            }
          }
        },
        controller.signal
      )

      setStatusMessage('Upload successful!')
      setTimeout(() => {
        handleModalClose()
        if (onSuccess) onSuccess(uploadedDoc)
      }, 500)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        setError('Upload was cancelled.')
      } else {
        console.error('Upload error:', err)
        const serverMsg = err.response?.data?.message
        const defaultMsg = 'Document upload failed. Please verify your Google Drive connection and try again.'
        setError(serverMsg || defaultMsg)
      }
    } finally {
      setUploading(false)
      abortControllerRef.current = null
    }
  }

  const handleModalClose = () => {
    if (uploading) {
      if (!window.confirm('An upload is in progress. Are you sure you want to cancel and exit?')) {
        return
      }
      handleCancelUpload()
    }
    setSelectedFile(null)
    setTitle('')
    setCategory('ACADEMIC_RECORDS')
    setError(null)
    setUploadProgress(0)
    setStatusMessage('')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleModalClose}>
      <div
        className="modal-container upload-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h3 id="upload-modal-title">Upload Document</h3>
              <p className="modal-subtitle">Directly stored into your dedicated Google Drive "CampusDocs" folder</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleModalClose}
            disabled={uploading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

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

          {/* Drag & Drop Zone */}
          <div
            className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${selectedFile ? 'dropzone-has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && !selectedFile && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
              disabled={uploading}
            />

            {!selectedFile ? (
              <div className="dropzone-empty">
                <div className="dropzone-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                </div>
                <p className="dropzone-primary-text">
                  Drag and drop your file here, or <span className="browse-link">browse</span>
                </p>
                <p className="dropzone-sub-text">
                  Supported formats: <strong>PDF, JPG, JPEG, PNG</strong> (Max 10 MB)
                </p>
              </div>
            ) : (
              <div className="selected-file-card" onClick={(e) => e.stopPropagation()}>
                <div className="selected-file-icon">
                  {selectedFile.type === 'application/pdf' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                <div className="selected-file-details">
                  <span className="selected-file-name" title={selectedFile.name}>{selectedFile.name}</span>
                  <span className="selected-file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    className="btn-remove-file"
                    onClick={handleRemoveFile}
                    title="Choose a different file"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Document Metadata Fields */}
          <div className="form-group">
            <label htmlFor="doc-title" className="form-label">
              Document Title <span className="required-star">*</span>
            </label>
            <input
              id="doc-title"
              type="text"
              className="form-input"
              placeholder="e.g., 5th Semester Grade Sheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="doc-category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="doc-category"
              className="form-input form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="upload-progress-section">
              <div className="progress-info">
                <span className="progress-status">{statusMessage}</span>
                <span className="progress-percentage">{uploadProgress}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-footer">
            {uploading ? (
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={handleCancelUpload}
              >
                Cancel Upload
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleModalClose}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !selectedFile || !title.trim()}
            >
              {uploading ? (
                <>
                  <span className="spinner-border" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
