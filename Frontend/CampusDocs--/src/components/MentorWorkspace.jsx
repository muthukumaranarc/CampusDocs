import { useState, useEffect } from 'react'
import { mentorshipService, documentService } from '../services/api'
import DocumentPreviewModal from './DocumentPreviewModal'
import './MentorWorkspace.css'

export default function MentorWorkspace({ onNotification }) {
  const [mentees, setMentees] = useState([])
  const [loadingMentees, setLoadingMentees] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDocs, setStudentDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Document preview and analysis modals
  const [previewDoc, setPreviewDoc] = useState(null)
  const [analysisDoc, setAnalysisDoc] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('APPROVED')
  const [analysisNotes, setAnalysisNotes] = useState('')
  const [submittingAnalysis, setSubmittingAnalysis] = useState(false)
  const [downloadingDocId, setDownloadingDocId] = useState(null)

  // Search filter
  const [menteeSearch, setMenteeSearch] = useState('')

  useEffect(() => {
    let active = true

    mentorshipService.getMentees()
      .then((data) => {
        if (active) {
          setMentees(data || [])
          setError(null)
          setLoadingMentees(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load mentees:', err)
          const msg = err.response?.data?.message || 'Unable to fetch your assigned students.'
          setError(msg)
          setLoadingMentees(false)
        }
      })

    return () => {
      active = false
    }
  }, [refreshTrigger])

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student)
    try {
      setLoadingDocs(true)
      const docs = await mentorshipService.getMenteeDocuments(student.id)
      setStudentDocs(docs || [])
    } catch (err) {
      console.error('Failed to load mentee documents:', err)
      const msg = err.response?.data?.message || `Failed to load documents for ${student.name}.`
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleOpenAnalysisModal = (doc) => {
    setAnalysisDoc(doc)
    setAnalysisStatus(doc.analysisStatus || 'APPROVED')
    setAnalysisNotes(doc.analysisNotes || '')
  }

  const handleSaveAnalysis = async (e) => {
    e.preventDefault()
    if (!analysisDoc) return

    try {
      setSubmittingAnalysis(true)
      const updated = await mentorshipService.analyzeDocument(analysisDoc.id, {
        analysisStatus,
        analysisNotes: analysisNotes.trim(),
      })

      // Update in local document list
      setStudentDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
      )

      if (onNotification) {
        onNotification({
          type: 'success',
          text: `Analysis for "${analysisDoc.title}" saved successfully as ${analysisStatus.replace('_', ' ')}!`,
        })
      }

      setAnalysisDoc(null)
      // Refresh mentees counts in background
      setRefreshTrigger((c) => c + 1)
    } catch (err) {
      console.error('Error submitting document analysis:', err)
      const msg = err.response?.data?.message || 'Failed to submit document analysis.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setSubmittingAnalysis(false)
    }
  }

  const handleDownload = async (doc) => {
    if (downloadingDocId) return

    try {
      setDownloadingDocId(doc.id)
      if (onNotification) {
        onNotification({
          type: 'info',
          text: `Downloading "${doc.originalFileName || doc.title}"...`,
        })
      }
      await documentService.download(doc.id, doc.originalFileName || 'document')
      if (onNotification) {
        onNotification({
          type: 'success',
          text: `"${doc.originalFileName || doc.title}" downloaded successfully!`,
        })
      }
    } catch (err) {
      console.error('Download error:', err)
      if (onNotification) {
        onNotification({
          type: 'error',
          text: err.response?.data?.message || 'Download failed.',
        })
      }
    } finally {
      setDownloadingDocId(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="status-pill status-pill-success">✓ Approved</span>
      case 'NEEDS_REVISION':
        return <span className="status-pill status-pill-danger">⚠️ Needs Revision</span>
      case 'UNDER_REVIEW':
        return <span className="status-pill status-pill-info">🔍 Under Review</span>
      case 'PENDING_REVIEW':
      default:
        return <span className="status-pill status-pill-warning">⏳ Pending Review</span>
    }
  }

  const filteredMentees = mentees.filter(
    (m) =>
      m.name?.toLowerCase().includes(menteeSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(menteeSearch.toLowerCase())
  )

  return (
    <div className="mentor-workspace">
      {/* Workspace Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Mentor Workspace & Document Analysis</h2>
          <p className="section-subtitle">
            Review, inspect, and provide feedback on your assigned students&apos; uploaded documents.
          </p>
        </div>
        {selectedStudent && (
          <button
            onClick={() => setSelectedStudent(null)}
            className="btn btn-secondary btn-sm"
          >
            ← Back to All Mentees
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {!selectedStudent ? (
        /* Mentees Overview List */
        <div className="mentees-overview">
          <div className="search-bar-wrap mb-4">
            <input
              type="text"
              className="search-input"
              placeholder="Search mentees by name or email..."
              value={menteeSearch}
              onChange={(e) => setMenteeSearch(e.target.value)}
            />
          </div>

          {loadingMentees ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your assigned mentees...</p>
            </div>
          ) : filteredMentees.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon">👥</div>
              <h4>No Mentees Found</h4>
              <p>
                {menteeSearch
                  ? 'No students match your search criteria.'
                  : 'You do not have any students assigned to you as mentees yet.'}
              </p>
            </div>
          ) : (
            <div className="mentee-cards-grid">
              {filteredMentees.map((mentee) => (
                <div
                  key={mentee.id}
                  className="mentee-card"
                  onClick={() => handleSelectStudent(mentee)}
                >
                  <div className="mentee-card-header">
                    <div className="mentee-avatar">
                      {mentee.pictureUrl ? (
                        <img src={mentee.pictureUrl} alt={mentee.name} />
                      ) : (
                        <span>{mentee.name ? mentee.name.charAt(0).toUpperCase() : 'S'}</span>
                      )}
                    </div>
                    <div className="mentee-info">
                      <h4 className="mentee-name">{mentee.name}</h4>
                      <span className="mentee-email">{mentee.email}</span>
                    </div>
                  </div>

                  <div className="mentee-stats-row">
                    <div className="mentee-stat-item">
                      <span className="stat-label">Total Docs</span>
                      <span className="stat-value">{mentee.documentCount}</span>
                    </div>
                    <div className="mentee-stat-item">
                      <span className="stat-label">Pending</span>
                      <span className="stat-value text-amber">{mentee.pendingCount}</span>
                    </div>
                    <div className="mentee-stat-item">
                      <span className="stat-label">Approved</span>
                      <span className="stat-value text-green">{mentee.approvedCount}</span>
                    </div>
                    <div className="mentee-stat-item">
                      <span className="stat-label">Revision</span>
                      <span className="stat-value text-red">{mentee.needsRevisionCount}</span>
                    </div>
                  </div>

                  <div className="mentee-card-footer">
                    <span className="btn-link">View Documents & Review →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Selected Mentee's Document Analysis View */
        <div className="mentee-detail-view">
          <div className="mentee-profile-bar">
            <div className="profile-bar-left">
              <div className="mentee-avatar large">
                {selectedStudent.pictureUrl ? (
                  <img src={selectedStudent.pictureUrl} alt={selectedStudent.name} />
                ) : (
                  <span>{selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}</span>
                )}
              </div>
              <div>
                <h3 className="profile-student-name">{selectedStudent.name}</h3>
                <span className="profile-student-email">{selectedStudent.email}</span>
              </div>
            </div>
            <div className="profile-bar-stats">
              <span className="badge badge-info">
                {studentDocs.length} {studentDocs.length === 1 ? 'Document' : 'Documents'}
              </span>
            </div>
          </div>

          {loadingDocs ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Fetching mentee documents from Google Drive & Database...</p>
            </div>
          ) : studentDocs.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon">📁</div>
              <h4>No Documents Uploaded</h4>
              <p>{selectedStudent.name} has not uploaded any documents yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Mentor Status</th>
                    <th>Feedback / Notes</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDocs.map((doc) => {
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
                                </svg>
                              </div>
                            ) : (
                              <div className="doc-type-icon img-icon" title="Image File">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="table-doc-details">
                            <span className="font-semibold text-main">{doc.title}</span>
                            <span className="table-doc-filename" title={doc.originalFileName}>
                              {doc.originalFileName}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="category-pill">{doc.categoryDisplayName || doc.category}</span>
                        </td>

                        <td className="text-muted text-sm">{formatFileSize(doc.fileSize)}</td>

                        <td className="text-muted text-sm">{formatDate(doc.createdAt)}</td>

                        <td>{getStatusBadge(doc.analysisStatus)}</td>

                        <td className="analysis-notes-cell">
                          {doc.analysisNotes ? (
                            <div className="notes-snippet" title={doc.analysisNotes}>
                              💬 &quot;{doc.analysisNotes}&quot;
                            </div>
                          ) : (
                            <span className="text-muted text-sm">No feedback yet</span>
                          )}
                        </td>

                        <td>
                          <div className="table-actions-cell">
                            {/* Preview */}
                            <button
                              className="btn-action-icon"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview mentee document"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Download */}
                            <button
                              className={`btn-action-icon ${downloadingDocId === doc.id ? 'btn-action-loading' : ''}`}
                              onClick={() => handleDownload(doc)}
                              disabled={Boolean(downloadingDocId)}
                              title="Download mentee file"
                            >
                              {downloadingDocId === doc.id ? (
                                <span className="download-spinner" />
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              )}
                            </button>

                            {/* Analyse button */}
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOpenAnalysisModal(doc)}
                              title="Review and analyse this document"
                            >
                              Analyse
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analysis / Review Modal */}
      {analysisDoc && (
        <div className="modal-backdrop" onClick={() => !submittingAnalysis && setAnalysisDoc(null)}>
          <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Analyse & Review Document</h3>
              <button
                className="modal-close-btn"
                onClick={() => setAnalysisDoc(null)}
                disabled={submittingAnalysis}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveAnalysis}>
              <div className="modal-body">
                <div className="analysis-doc-summary">
                  <h4>{analysisDoc.title}</h4>
                  <p className="text-muted text-sm">
                    Student: <strong>{selectedStudent?.name}</strong> • File: {analysisDoc.originalFileName}
                  </p>
                </div>

                <div className="form-group mt-4">
                  <label htmlFor="analysisStatusSelect" className="form-label">
                    Review Status <span className="required">*</span>
                  </label>
                  <select
                    id="analysisStatusSelect"
                    className="form-control"
                    value={analysisStatus}
                    onChange={(e) => setAnalysisStatus(e.target.value)}
                    disabled={submittingAnalysis}
                  >
                    <option value="APPROVED">Approved (Verified & Satisfactory)</option>
                    <option value="UNDER_REVIEW">Under Review (Currently being checked)</option>
                    <option value="NEEDS_REVISION">Needs Revision (Changes or re-upload requested)</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                  </select>
                </div>

                <div className="form-group mt-3">
                  <label htmlFor="analysisNotesInput" className="form-label">
                    Mentor Feedback & Notes
                  </label>
                  <textarea
                    id="analysisNotesInput"
                    className="form-control"
                    rows="4"
                    placeholder="Provide detailed feedback, verification remarks, or instructions for the student..."
                    value={analysisNotes}
                    onChange={(e) => setAnalysisNotes(e.target.value)}
                    disabled={submittingAnalysis}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAnalysisDoc(null)}
                  disabled={submittingAnalysis}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingAnalysis}
                >
                  {submittingAnalysis ? 'Saving Review...' : 'Save Review & Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => handleDownload(previewDoc)}
        />
      )}
    </div>
  )
}
