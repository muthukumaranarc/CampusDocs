import { useState, useEffect } from 'react'
import { adminService, mentorshipService } from '../services/api'
import './AdminWorkspace.css'

export default function AdminWorkspace({ onNotification }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [availableMentors, setAvailableMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Filter & Search
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assignMentorStudent, setAssignMentorStudent] = useState(null)
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null)

  // Create User Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT',
    mentorId: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      adminService.getAdminStats(),
      adminService.getAllUsers(),
      mentorshipService.getAvailableMentors(),
    ])
      .then(([statsData, usersData, mentorsData]) => {
        if (active) {
          setStats(statsData)
          setUsers(usersData || [])
          setAvailableMentors(mentorsData || [])
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load admin data:', err)
          const msg = err.response?.data?.message || 'Unable to load administrator console data.'
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [refreshTrigger])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.email.trim()) {
      if (onNotification) onNotification({ type: 'error', text: 'Name and email are required.' })
      return
    }

    try {
      setFormSubmitting(true)
      await adminService.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        mentorId: createForm.role === 'STUDENT' && createForm.mentorId ? createForm.mentorId : null,
      })

      if (onNotification) {
        onNotification({
          type: 'success',
          text: `User ${createForm.name} created successfully as ${createForm.role}!`,
        })
      }

      setIsCreateModalOpen(false)
      setCreateForm({ name: '', email: '', role: 'STUDENT', mentorId: '' })
      setRefreshTrigger((c) => c + 1)
    } catch (err) {
      console.error('Error creating user:', err)
      const msg = err.response?.data?.message || 'Failed to create user.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole)
      if (onNotification) {
        onNotification({ type: 'success', text: `User role updated to ${newRole} successfully!` })
      }
      setRefreshTrigger((c) => c + 1)
    } catch (err) {
      console.error('Failed to update role:', err)
      const msg = err.response?.data?.message || 'Failed to update user role.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    }
  }

  const handleOpenAssignMentor = (student) => {
    setAssignMentorStudent(student)
    setSelectedMentorId(student.mentorId || '')
  }

  const handleSaveMentorAssignment = async (e) => {
    e.preventDefault()
    if (!assignMentorStudent) return

    try {
      setFormSubmitting(true)
      await adminService.assignMentor(assignMentorStudent.id, selectedMentorId || null)
      if (onNotification) {
        onNotification({
          type: 'success',
          text: `Mentor assignment updated for ${assignMentorStudent.displayName || assignMentorStudent.email}!`,
        })
      }
      setAssignMentorStudent(null)
      setRefreshTrigger((c) => c + 1)
    } catch (err) {
      console.error('Error assigning mentor:', err)
      const msg = err.response?.data?.message || 'Failed to assign mentor.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return

    try {
      setFormSubmitting(true)
      await adminService.deleteUser(deleteConfirmUser.id)
      if (onNotification) {
        onNotification({
          type: 'success',
          text: `User ${deleteConfirmUser.displayName || deleteConfirmUser.email} deleted successfully.`,
        })
      }
      setDeleteConfirmUser(null)
      setRefreshTrigger((c) => c + 1)
    } catch (err) {
      console.error('Error deleting user:', err)
      const msg = err.response?.data?.message || 'Failed to delete user.'
      if (onNotification) onNotification({ type: 'error', text: msg })
    } finally {
      setFormSubmitting(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const nameMatch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && (nameMatch || emailMatch)
  })

  return (
    <div className="admin-workspace">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">🛡️ System Administration & User Management</h2>
          <p className="section-subtitle">
            Manage Students, Mentors, and Administrators. Oversee 1-to-1 mentor assignments and system document volume.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create User / Mentor
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Summary Cards */}
      {stats && (
        <div className="stats-row mb-4">
          <div className="stat-card">
            <span className="stat-card-title">Total Students</span>
            <span className="stat-card-number">{stats.totalStudents}</span>
            <span className="stat-card-hint">Enrolled learners</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Total Mentors</span>
            <span className="stat-card-number">{stats.totalMentors}</span>
            <span className="stat-card-hint">Faculty advisors</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Unassigned Students</span>
            <span className={`stat-card-number ${stats.unassignedStudents > 0 ? 'text-amber' : ''}`}>
              {stats.unassignedStudents}
            </span>
            <span className="stat-card-hint">Need a mentor</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Total Documents</span>
            <span className="stat-card-number">{stats.totalDocuments}</span>
            <span className="stat-card-hint">Files in Drive & DB</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Pending Reviews</span>
            <span className={`stat-card-number ${stats.pendingReviews > 0 ? 'text-amber' : ''}`}>
              {stats.pendingReviews}
            </span>
            <span className="stat-card-hint">Awaiting mentor feedback</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar mb-4">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group-right">
          <label htmlFor="roleFilterSelect" className="text-sm text-muted">Role:</label>
          <select
            id="roleFilterSelect"
            className="form-control select-compact"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students Only</option>
            <option value="MENTOR">Mentors Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users list...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">👥</div>
          <h4>No Users Found</h4>
          <p>No user accounts matched your search or role filter.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="library-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Assigned Mentor (for Students)</th>
                <th>Google Drive</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isStudent = u.role === 'STUDENT'
                return (
                  <tr key={u.id} className="library-table-row">
                    <td className="doc-main-cell">
                      <div className="mentee-avatar">
                        {u.pictureUrl ? (
                          <img src={u.pictureUrl} alt={u.displayName} />
                        ) : (
                          <span>{u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      <div className="table-doc-details">
                        <span className="font-semibold text-main">{u.displayName || 'No Name'}</span>
                        <span className="table-doc-filename">{u.email}</span>
                      </div>
                    </td>

                    <td>
                      <select
                        className={`role-select role-${u.role?.toLowerCase()}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        title="Change user role"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="MENTOR">MENTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td>
                      {isStudent ? (
                        u.mentorId ? (
                          <div className="mentor-assignment-info">
                            <span className="font-medium text-main">{u.mentorName || 'Assigned Mentor'}</span>
                            <span className="text-muted text-xs block">{u.mentorEmail}</span>
                            <button
                              onClick={() => handleOpenAssignMentor(u)}
                              className="btn-link-xs mt-1"
                            >
                              Change Mentor
                            </button>
                          </div>
                        ) : (
                          <div className="unassigned-mentor-cell">
                            <span className="badge badge-warning">⚠️ Not Assigned</span>
                            <button
                              onClick={() => handleOpenAssignMentor(u)}
                              className="btn btn-secondary btn-xs mt-1"
                            >
                              Assign Mentor
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>

                    <td>
                      {u.driveConnected ? (
                        <span className="status-pill status-pill-success">Connected</span>
                      ) : (
                        <span className="status-pill status-pill-secondary">Not Connected</span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        {isStudent && (
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenAssignMentor(u)}
                            title="Assign or change mentor"
                          >
                            Assign Mentor
                          </button>
                        )}
                        <button
                          className="btn-action-icon text-red"
                          onClick={() => setDeleteConfirmUser(u)}
                          title="Delete User"
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
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => !formSubmitting && setIsCreateModalOpen(false)}>
          <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New User</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={formSubmitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="createUserName" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="createUserName"
                    type="text"
                    className="form-control"
                    placeholder="e.g., Alice Johnson"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                    disabled={formSubmitting}
                  />
                </div>

                <div className="form-group mt-3">
                  <label htmlFor="createUserEmail" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="createUserEmail"
                    type="email"
                    className="form-control"
                    placeholder="e.g., alice@university.edu"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    disabled={formSubmitting}
                  />
                  <span className="form-hint">
                    When this user logs in with Google OAuth using this email, their profile and role will automatically link.
                  </span>
                </div>

                <div className="form-group mt-3">
                  <label htmlFor="createUserRole" className="form-label">
                    Role <span className="required">*</span>
                  </label>
                  <select
                    id="createUserRole"
                    className="form-control"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    disabled={formSubmitting}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="MENTOR">MENTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {createForm.role === 'STUDENT' && (
                  <div className="form-group mt-3">
                    <label htmlFor="createUserMentor" className="form-label">
                      Assign Mentor (Optional)
                    </label>
                    <select
                      id="createUserMentor"
                      className="form-control"
                      value={createForm.mentorId}
                      onChange={(e) => setCreateForm({ ...createForm, mentorId: e.target.value })}
                      disabled={formSubmitting}
                    >
                      <option value="">-- No Mentor Assigned (Assign Later) --</option>
                      {availableMentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {assignMentorStudent && (
        <div className="modal-backdrop" onClick={() => !formSubmitting && setAssignMentorStudent(null)}>
          <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Mentor to Student</h3>
              <button
                className="modal-close-btn"
                onClick={() => setAssignMentorStudent(null)}
                disabled={formSubmitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveMentorAssignment}>
              <div className="modal-body">
                <p className="text-sm text-muted mb-3">
                  Assign a faculty mentor to student <strong>{assignMentorStudent.displayName || assignMentorStudent.email}</strong>.
                  Each student is connected to exactly one mentor.
                </p>

                <div className="form-group">
                  <label htmlFor="mentorSelect" className="form-label">
                    Select Mentor <span className="required">*</span>
                  </label>
                  <select
                    id="mentorSelect"
                    className="form-control"
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    disabled={formSubmitting}
                  >
                    <option value="">-- Unassigned (Remove Mentor) --</option>
                    {availableMentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAssignMentorStudent(null)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmUser && (
        <div className="modal-backdrop" onClick={() => !formSubmitting && setDeleteConfirmUser(null)}>
          <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-red">Confirm Deletion</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={formSubmitting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete user <strong>{deleteConfirmUser.displayName || deleteConfirmUser.email}</strong>?
              </p>
              <p className="text-sm text-muted mt-2">
                This will remove their profile and unassign any connected mentees.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
