import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { documentService } from '../services/api'
import DocumentPreviewModal from './DocumentPreviewModal'
import DocumentEditModal from './DocumentEditModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import DocumentThumbnail from './DocumentThumbnail'
import './DocumentLibrary.css'

const CATEGORY_TABS = ['All', 'Academic', 'Identity', 'Certificates', 'Other']

export default function DocumentLibrary({
  onOpenUpload,
  refreshTrigger,
  onActionNotification,
  onOpenNotifications,
}) {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [activeMenuDocId, setActiveMenuDocId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Real API documents
  const [realDocs, setRealDocs] = useState([])
  const [mentorDocs, setMentorDocs] = useState([])
  const [activeDocTab, setActiveDocTab] = useState('my_docs')
  const [loadingMentorDocs, setLoadingMentorDocs] = useState(false)

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [downloadingDocId, setDownloadingDocId] = useState(null)

  const menuContainerRef = useRef(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeMenuDocId && !e.target.closest('.cd-doc-menu-wrap')) {
        setActiveMenuDocId(null)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [activeMenuDocId])

  // Fetch real user documents from Google Drive / backend
  useEffect(() => {
    let active = true
    setLoading(true)
    documentService
      .getDocuments({ page: 0, size: 100 })
      .then((res) => {
        if (active) {
          setRealDocs(res.content || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('Could not load real documents:', err)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [refreshTrigger])

  // Fetch mentor shared documents for students
  useEffect(() => {
    if (user?.role === 'STUDENT' && activeDocTab === 'mentor_docs') {
      let active = true
      setLoadingMentorDocs(true)
      documentService
        .getMentorShared()
        .then((res) => {
          if (active) setMentorDocs(res || [])
        })
        .catch((err) => console.error('Failed to load mentor documents:', err))
        .finally(() => {
          if (active) setLoadingMentorDocs(false)
        })
      return () => {
        active = false
      }
    }
  }, [activeDocTab, user?.role, refreshTrigger])

  // Format only real uploaded documents (Zero mock data)
  const allDocs = useMemo(() => {
    return (realDocs || []).map((doc) => {
      let cat = 'Other'
      const c = (doc.category || '').toUpperCase()
      if (c.includes('ACADEMIC')) cat = 'Academic'
      else if (c.includes('IDENT')) cat = 'Identity'
      else if (c.includes('CERT')) cat = 'Certificates'

      const dateObj = doc.createdAt ? new Date(doc.createdAt) : new Date()
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })

      return {
        id: doc.id,
        title: doc.title,
        category: cat,
        rawCategory: doc.category,
        uploadedDate: formattedDate,
        timestamp: dateObj.getTime(),
        isReal: true,
        realData: doc,
        mimeType: doc.mimeType,
        originalFileName: doc.originalFileName,
        fileSize: doc.fileSize,
        driveWebViewLink: doc.driveWebViewLink,
      }
    })
  }, [realDocs])

  // Filter & Sort Documents
  const filteredDocs = useMemo(() => {
    let result = [...allDocs]

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (doc) => doc.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Search filter
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.category.toLowerCase().includes(query) ||
          (doc.originalFileName && doc.originalFileName.toLowerCase().includes(query)) ||
          doc.uploadedDate.toLowerCase().includes(query)
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return (b.timestamp || 0) - (a.timestamp || 0)
      }
      if (sortBy === 'oldest') {
        return (a.timestamp || 0) - (b.timestamp || 0)
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'title_desc') {
        return b.title.localeCompare(a.title)
      }
      return 0
    })

    return result
  }, [allDocs, selectedCategory, searchQuery, sortBy])

  // Handle Download Action
  const handleDownloadDoc = async (doc) => {
    if (downloadingDocId) return

    try {
      setDownloadingDocId(doc.id)
      if (onActionNotification) {
        onActionNotification({
          type: 'info',
          text: `Preparing "${doc.title}" for download...`,
        })
      }

      await documentService.download(doc.id, doc.originalFileName || doc.title || 'document')

      if (onActionNotification) {
        onActionNotification({
          type: 'success',
          text: `"${doc.title}" downloaded successfully!`,
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

  // Handle successful edit
  const handleEditSuccess = (updatedDoc) => {
    setRealDocs((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    )
    if (onActionNotification) {
      onActionNotification({
        type: 'success',
        text: `Document "${updatedDoc.title}" updated successfully!`,
      })
    }
  }

  // Handle successful delete
  const handleDeleteSuccess = (deletedDoc) => {
    setRealDocs((prev) => prev.filter((d) => d.id !== deletedDoc.id))
    if (onActionNotification) {
      onActionNotification({
        type: 'success',
        text: `Document "${deletedDoc.title}" was removed successfully.`,
      })
    }
  }

  return (
    <div className="cd-mydocs-page animate-fade-in" ref={menuContainerRef}>
      {/* 1. Header Bar: Title, Subtitle, and Notification Bell */}
      <div className="cd-mydocs-header">
        <div className="cd-mydocs-header-left">
          <h1 className="cd-mydocs-title">My Documents</h1>
          <p className="cd-mydocs-subtitle">
            View, manage, and download all your uploaded documents.
          </p>
        </div>


      </div>

      {/* Subtabs for Students to toggle between My Uploads and Mentor Shared (Optional) */}
      {user?.role === 'STUDENT' && mentorDocs.length > 0 && (
        <div className="cd-mydocs-subtabs">
          <button
            type="button"
            className={`cd-subtab-btn ${activeDocTab === 'my_docs' ? 'active' : ''}`}
            onClick={() => setActiveDocTab('my_docs')}
          >
            My Uploaded Documents ({allDocs.length})
          </button>
          <button
            type="button"
            className={`cd-subtab-btn ${activeDocTab === 'mentor_docs' ? 'active' : ''}`}
            onClick={() => setActiveDocTab('mentor_docs')}
          >
            Mentor's Shared Resources ({mentorDocs.length})
          </button>
        </div>
      )}

      {/* If viewing mentor docs */}
      {activeDocTab === 'mentor_docs' ? (
        <div className="cd-mentor-docs-wrapper">
          {loadingMentorDocs ? (
            <div className="docs-loading-state">
              <span className="spinner-border" />
              <p>Loading documents shared by your mentor...</p>
            </div>
          ) : mentorDocs.length === 0 ? (
            <div className="empty-docs-state">
              <h4>No Shared Resources Yet</h4>
              <p>Your mentor has not uploaded any study materials or reference documents yet.</p>
            </div>
          ) : (
            <div className="cd-mydocs-grid">
              {mentorDocs.map((doc) => (
                <div key={doc.id} className="cd-doc-card">
                  <DocumentThumbnail
                    doc={doc}
                    onClick={() => setPreviewDoc(doc)}
                  />
                  <div className="cd-doc-body">
                    <div className="cd-doc-body-top">
                      <h3
                        className="cd-doc-card-title"
                        onClick={() => setPreviewDoc(doc)}
                        title={doc.title}
                      >
                        {doc.title}
                      </h3>
                      <p className="cd-doc-card-category">{doc.category || 'Academic'}</p>
                      <p className="cd-doc-card-date">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </p>
                    </div>
                    <div className="cd-doc-body-bottom">
                      <button
                        type="button"
                        className="cd-doc-card-download-btn"
                        onClick={() => handleDownloadDoc(doc)}
                        title="Download"
                      >
                        ⬇
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 2. Controls Toolbar: Category Pills, Search, Sort, Upload Button */}
          <div className="cd-mydocs-toolbar">
            {/* Left: Category Filter Pills */}
            <div className="cd-mydocs-filters">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`cd-filter-pill ${selectedCategory === tab ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right: Search Input, Sort Dropdown, and + Upload Document Button */}
            <div className="cd-mydocs-controls-right">
              {/* Search Box */}
              <div className="cd-mydocs-search-box">
                <svg
                  className="cd-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="cd-mydocs-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="cd-search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="cd-mydocs-sort-wrap">
                <select
                  className="cd-mydocs-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort documents"
                >
                  <option value="latest">Sort by: Latest</option>
                  <option value="oldest">Sort by: Oldest</option>
                  <option value="title_asc">Sort by: Title (A-Z)</option>
                  <option value="title_desc">Sort by: Title (Z-A)</option>
                </select>
                <span className="cd-sort-chevron">▾</span>
              </div>

              {/* Upload Document Button */}
              <button
                type="button"
                className="cd-mydocs-upload-btn"
                onClick={onOpenUpload}
                title="Upload Document"
              >
                <span className="cd-upload-plus">+</span>
                Upload Document
              </button>
            </div>
          </div>

          {/* 3. Document Cards Grid */}
          {loading ? (
            <div className="cd-loading-state">
              <span className="spinner-border" />
              <p>Loading your documents...</p>
            </div>
          ) : allDocs.length === 0 ? (
            /* Empty state when user hasn't uploaded any documents yet */
            <div className="cd-empty-results">
              <div className="cd-empty-icon">📁</div>
              <h3>No documents uploaded yet</h3>
              <p>
                Upload your semester mark sheets, transfer certificates, identity cards, or photos.
                Files are securely transferred and stored directly in your personal Google Drive.
              </p>
              <button
                type="button"
                className="cd-mydocs-upload-btn mt-4"
                onClick={onOpenUpload}
              >
                <span className="cd-upload-plus">+</span>
                Upload Your First Document
              </button>
            </div>
          ) : filteredDocs.length === 0 ? (
            /* Empty state when filter or search has no matches */
            <div className="cd-empty-results">
              <div className="cd-empty-icon">🔍</div>
              <h3>No matching documents</h3>
              <p>
                No documents match "{searchQuery}" in category "{selectedCategory}".
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="cd-mydocs-grid">
              {filteredDocs.map((doc) => {
                return (
                  <div key={doc.id} className="cd-doc-card">
                    {/* Left: [image] Actual Cover / Front Page Thumbnail */}
                    <DocumentThumbnail
                      doc={doc}
                      onClick={() => setPreviewDoc(doc.realData || doc)}
                    />

                    {/* Right: [text] All strictly left-aligned */}
                    <div className="cd-doc-body">
                      {/* Top: Title, Category, Date */}
                      <div className="cd-doc-body-top">
                        <div className="cd-doc-header-row">
                          <h3
                            className="cd-doc-card-title"
                            onClick={() => setPreviewDoc(doc.realData || doc)}
                            title={doc.title}
                          >
                            {doc.title}
                          </h3>
                        </div>

                        <p className="cd-doc-card-category">{doc.category}</p>
                        <p className="cd-doc-card-date">{doc.uploadedDate}</p>
                      </div>

                      {/* Bottom: Context Menu on the bottom right */}
                      <div className="cd-doc-body-bottom">
                        <div className="cd-doc-menu-wrap">
                          <button
                            type="button"
                            className="cd-doc-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuDocId((prev) => (prev === doc.id ? null : doc.id))
                            }}
                            aria-label="More options"
                          >
                            ⋮
                          </button>

                          {activeMenuDocId === doc.id && (
                            <div className="cd-doc-context-dropdown animate-fade-in">
                              <button
                                type="button"
                                className="cd-menu-item"
                                onClick={() => {
                                  setActiveMenuDocId(null)
                                  setPreviewDoc(doc.realData || doc)
                                }}
                              >
                                <span className="cd-menu-icon">👁️</span>
                                Preview Document
                              </button>

                              <button
                                type="button"
                                className="cd-menu-item"
                                onClick={() => {
                                  setActiveMenuDocId(null)
                                  handleDownloadDoc(doc)
                                }}
                              >
                                <span className="cd-menu-icon">⬇️</span>
                                Download File
                              </button>

                              {doc.driveWebViewLink && (
                                <a
                                  href={doc.driveWebViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cd-menu-item"
                                  onClick={() => setActiveMenuDocId(null)}
                                >
                                  <span className="cd-menu-icon">☁️</span>
                                  Open in Drive ↗
                                </a>
                              )}

                              <button
                                type="button"
                                className="cd-menu-item"
                                onClick={() => {
                                  setActiveMenuDocId(null)
                                  setEditDoc(doc.realData || doc)
                                }}
                              >
                                <span className="cd-menu-icon">✏️</span>
                                Edit Details
                              </button>

                              <button
                                type="button"
                                className="cd-menu-item cd-menu-item-danger"
                                onClick={() => {
                                  setActiveMenuDocId(null)
                                  setDeleteDoc(doc.realData || doc)
                                }}
                              >
                                <span className="cd-menu-icon">🗑️</span>
                                Delete File
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 4. Modals */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {editDoc && (
        <DocumentEditModal
          isOpen={Boolean(editDoc)}
          onClose={() => setEditDoc(null)}
          document={editDoc}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteDoc && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteDoc)}
          onClose={() => setDeleteDoc(null)}
          document={deleteDoc}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
