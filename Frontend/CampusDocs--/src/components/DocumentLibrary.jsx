import { useState, useEffect, useRef } from 'react'
import { documentService } from '../services/api'
import DocumentPreviewModal from './DocumentPreviewModal'
import DocumentEditModal from './DocumentEditModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'ACADEMIC_RECORDS', label: 'Academic Records' },
  { value: 'CERTIFICATES', label: 'Certificates' },
  { value: 'IDENTIFICATION_DOCUMENTS', label: 'Identification Documents' },
  { value: 'PERSONAL_DOCUMENTS', label: 'Personal Documents' },
  { value: 'OTHER', label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Date: Newest first' },
  { value: 'createdAt:asc', label: 'Date: Oldest first' },
  { value: 'title:asc', label: 'Title: A → Z' },
  { value: 'title:desc', label: 'Title: Z → A' },
  { value: 'fileSize:desc', label: 'Size: Largest first' },
  { value: 'fileSize:asc', label: 'Size: Smallest first' },
]

export default function DocumentLibrary({ onOpenUpload, refreshTrigger, onActionNotification }) {
  const [documents, setDocuments] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 1, totalElements: 0, size: 8 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState('createdAt:desc')
  const [currentPage, setCurrentPage] = useState(0)
  const [localRefresh, setLocalRefresh] = useState(0)

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [downloadingDocId, setDownloadingDocId] = useState(null)

  // Debounce search term
  const searchTimerRef = useRef(null)
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchTerm(val)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setCurrentPage(0)
    }, 350)
  }

  useEffect(() => {
    let active = true

    const [sortBy, sortDirection] = sortKey.split(':')
    const params = {
      query: debouncedSearch.trim() || undefined,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      sortBy,
      sortDirection,
      page: currentPage,
      size: 8,
    }

    documentService.getDocuments(params)
      .then((res) => {
        if (active) {
          setDocuments(res.content || [])
          setPageInfo({
            page: res.page,
            totalPages: res.totalPages || 1,
            totalElements: res.totalElements || 0,
            size: res.size || 8,
          })
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load documents:', err)
          const msg = err.response?.data?.message || 'Failed to load documents. Please check your connection.'
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, categoryFilter, sortKey, currentPage, refreshTrigger, localRefresh])

  const handleDownload = async (doc) => {
    if (downloadingDocId) return

    try {
      setDownloadingDocId(doc.id)
      if (onActionNotification) {
        onActionNotification({
          type: 'info',
          text: `Preparing "${doc.originalFileName || doc.title}" from your Google Drive...`,
        })
      }
      await documentService.download(doc.id, doc.originalFileName || 'document')
      if (onActionNotification) {
        onActionNotification({
          type: 'success',
          text: `"${doc.originalFileName || doc.title}" downloaded successfully!`,
        })
      }
    } catch (err) {
      console.error('Download error:', err)
      if (onActionNotification) {
        onActionNotification({
          type: 'error',
          text: err.response?.data?.message || 'Download failed. Please try again.',
        })
      }
    } finally {
      setDownloadingDocId(null)
    }
  }

  const handleEditSuccess = (updatedDoc) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    )
    if (onActionNotification) {
      onActionNotification({
        type: 'success',
        text: `Document "${updatedDoc.title}" updated successfully!`,
      })
    }
    setLocalRefresh((n) => n + 1)
  }

  const handleDeleteSuccess = (deletedDoc) => {
    setDocuments((prev) => prev.filter((d) => d.id !== deletedDoc.id))
    if (onActionNotification) {
      onActionNotification({
        type: 'success',
        text: `Document "${deletedDoc.title}" was permanently deleted from your Google Drive.`,
      })
    }
    setLocalRefresh((n) => n + 1)
  }

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  const hasActiveFilters = debouncedSearch || categoryFilter !== 'ALL'

  return (
    <section className="documents-section library-section">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="library-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <h3>Document Library</h3>
            <p className="library-subtitle">Manage, view, and organize your academic files stored in Google Drive</p>
          </div>
          <span className="count-badge">{pageInfo.totalElements} files</span>
        </div>

        <button
          onClick={onOpenUpload}
          className="btn btn-primary btn-sm"
          title="Upload new document"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="library-controls-bar">
        {/* Search Input */}
        <div className="search-input-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title or filename..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => {
                setSearchTerm('')
                setDebouncedSearch('')
                setCurrentPage(0)
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="control-group">
          <label htmlFor="filter-cat" className="control-label">Category:</label>
          <select
            id="filter-cat"
            className="form-input form-select filter-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(0)
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="control-group">
          <label htmlFor="sort-select" className="control-label">Sort by:</label>
          <select
            id="sort-select"
            className="form-input form-select filter-select"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value)
              setCurrentPage(0)
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="docs-loading-state">
          <span className="spinner-border" />
          <p>Loading documents from Google Drive & CampusDocs...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-docs-state">
          <div className="empty-docs-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          {hasActiveFilters ? (
            <>
              <h4>No matching documents found</h4>
              <p>No documents matched your search or category filter. Try clearing your filters to see all files.</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('')
                  setDebouncedSearch('')
                  setCategoryFilter('ALL')
                  setCurrentPage(0)
                }}
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h4>Your document library is empty</h4>
              <p>Upload your academic records, certificates, or identity cards. Files are securely transferred directly into your personal Google Drive.</p>
              <button onClick={onOpenUpload} className="btn btn-primary btn-sm">
                Upload First Document
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Document Table / Grid */}
          <div className="library-table-container">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isPdf = doc.mimeType === 'application/pdf'
                  return (
                    <tr key={doc.id} className="library-table-row">
                      <td className="doc-main-cell">
                        <div className="table-doc-icon-wrap">
                          {isPdf ? (
                            <div className="doc-type-icon pdf-icon" title="PDF Document">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                              </svg>
                            </div>
                          ) : (
                            <div className="doc-type-icon img-icon" title="Image File">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="table-doc-details">
                          <button
                            className="table-doc-title-btn"
                            onClick={() => setPreviewDoc(doc)}
                            title="Click to preview"
                          >
                            {doc.title}
                          </button>
                          <span className="table-doc-filename" title={doc.originalFileName}>
                            {doc.originalFileName}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="category-pill">{doc.categoryDisplayName || doc.category}</span>
                      </td>

                      <td className="text-muted text-sm">
                        {formatFileSize(doc.fileSize)}
                      </td>

                      <td className="text-muted text-sm">
                        {formatDate(doc.createdAt)}
                      </td>

                      <td>
                        <div className="table-actions-cell">
                          {/* Preview Action */}
                          <button
                            className="btn-action-icon"
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview document"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {/* Download Action with Loading Animation */}
                          <button
                            className={`btn-action-icon ${downloadingDocId === doc.id ? 'btn-action-loading' : ''}`}
                            onClick={() => handleDownload(doc)}
                            disabled={Boolean(downloadingDocId)}
                            title={downloadingDocId === doc.id ? 'Preparing download from Google Drive...' : 'Download document'}
                            aria-label={downloadingDocId === doc.id ? 'Preparing download...' : 'Download document'}
                          >
                            {downloadingDocId === doc.id ? (
                              <span className="download-spinner" aria-hidden="true" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            )}
                          </button>

                          {/* Edit Title / Category */}
                          <button
                            className="btn-action-icon"
                            onClick={() => setEditDoc(doc)}
                            title="Edit title & category"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Open in Drive Link */}
                          {doc.driveWebViewLink && (
                            <a
                              href={doc.driveWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action-icon"
                              title="Open in Google Drive"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          )}

                          {/* Delete Action */}
                          <button
                            className="btn-action-icon btn-action-delete"
                            onClick={() => setDeleteDoc(doc)}
                            title="Delete document"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pageInfo.totalPages > 1 && (
            <div className="pagination-bar">
              <span className="pagination-info">
                Page <strong>{pageInfo.page + 1}</strong> of <strong>{pageInfo.totalPages}</strong> (Total: {pageInfo.totalElements} documents)
              </span>

              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))}
                  disabled={currentPage >= pageInfo.totalPages - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      <DocumentEditModal
        isOpen={Boolean(editDoc)}
        onClose={() => setEditDoc(null)}
        document={editDoc}
        onSuccess={handleEditSuccess}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteDoc)}
        onClose={() => setDeleteDoc(null)}
        document={deleteDoc}
        onSuccess={handleDeleteSuccess}
      />
    </section>
  )
}
