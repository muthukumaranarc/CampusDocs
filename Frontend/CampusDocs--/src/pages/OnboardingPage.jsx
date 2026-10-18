import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { userService, mentorshipService } from '../services/api'
import sunriseBg from '../assets/solitary-sunrise.png'
import './OnboardingPage.css'

export default function OnboardingPage() {
  const { user, setUser, loading } = useAuth()
  const navigate = useNavigate()

  // 3-step wizard state: 1 = Role Selection, 2 = Profile Details, 3 = Connect Mentor / Mentees
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Role
  const [selectedRole, setSelectedRole] = useState('STUDENT')

  // Step 2: Profile details
  const [formData, setFormData] = useState({
    age: '',
    department: '',
    rollNumber: '',
    phone: '',
    bio: '',
  })

  // Step 3: Mentor/Student selection
  const [availableMentors, setAvailableMentors] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [searchPartner, setSearchPartner] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch mentors or students when moving to step 3
  useEffect(() => {
    if (currentStep === 3) {
      let active = true
      Promise.resolve().then(() => {
        setLoadingPartners(true)
        return selectedRole === 'STUDENT'
          ? mentorshipService.getAvailableMentors()
          : mentorshipService.getAvailableStudents()
      })
          .then((data) => {
            if (active) {
              if (selectedRole === 'STUDENT') {
                setAvailableMentors(data || [])
              } else {
                setAvailableStudents(data || [])
              }
              setLoadingPartners(false)
            }
          })
          .catch((err) => {
            if (active) {
              console.error('Failed to load mentors:', err)
              setLoadingPartners(false)
            }
          })

      return () => {
        active = false
      }
    }
  }, [currentStep, selectedRole])

  if (loading) {
    return (
      <div className="center-container">
        <div className="spinner"></div>
        <p className="loading-text">Verifying session...</p>
      </div>
    )
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If onboarding is already completed, redirect straight to dashboard
  if (user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errorMsg) setErrorMsg('')
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    if (errorMsg) setErrorMsg('')
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
    if (errorMsg) setErrorMsg('')
  }

  // Step 1 -> Step 2: Validate role is selected
  const handleNextFromRole = (e) => {
    if (e) e.preventDefault()
    if (!selectedRole) {
      setErrorMsg('Please select your role (Student or Mentor) to continue.')
      return
    }
    setErrorMsg('')
    setCurrentStep(2)
  }

  // Step 2 -> Step 3: Validate all required profile fields are filled
  const handleNextFromDetails = (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    const missing = []
    if (!formData.age || !formData.age.toString().trim()) {
      missing.push('Age')
    }
    if (!formData.department || !formData.department.trim()) {
      missing.push('Department / Specialization')
    }
    if (!formData.rollNumber || !formData.rollNumber.trim()) {
      missing.push(selectedRole === 'MENTOR' ? 'Staff ID / Designation' : 'Roll Number / Student ID')
    }
    if (!formData.phone || !formData.phone.trim()) {
      missing.push('Phone Number')
    }
    if (!formData.bio || !formData.bio.trim()) {
      missing.push(selectedRole === 'MENTOR' ? 'Guidance Notes' : 'Academic Goals / Bio')
    }

    if (missing.length > 0) {
      setErrorMsg(`Please fill in all required fields before continuing: ${missing.join(', ')}.`)
      return
    }

    const parsedAge = parseInt(formData.age, 10)
    if (isNaN(parsedAge) || parsedAge < 14 || parsedAge > 100) {
      setErrorMsg('Please enter a valid age between 14 and 100.')
      return
    }

    setCurrentStep(3)
  }

  // Step 3 Completion: Complete Onboarding + Optional Mentor/Student connection
  const handleFinalSubmit = async (skipPartnership = false) => {
    setErrorMsg('')

    // Validate details are intact
    if (!formData.age || !formData.department?.trim() || !formData.rollNumber?.trim() || !formData.phone?.trim() || !formData.bio?.trim()) {
      setErrorMsg('Profile details are missing. Please complete your profile details.')
      setCurrentStep(2)
      return
    }

    // If user clicks Finish without skipping, ensure selection was made if options exist
    if (!skipPartnership) {
      if (selectedRole === 'STUDENT' && !selectedMentorId) {
        if (availableMentors.length > 0) {
          setErrorMsg('Please select a faculty mentor to proceed, or click "Skip for Now" to configure later.')
          return
        }
      } else if (selectedRole === 'MENTOR' && selectedStudentIds.length === 0) {
        if (availableStudents.length > 0) {
          setErrorMsg('Please select at least one student, or click "Skip for Now" to configure later.')
          return
        }
      }
    }

    setSubmitting(true)

    try {
      const payload = {
        role: selectedRole,
        age: formData.age ? parseInt(formData.age, 10) : null,
        department: formData.department.trim(),
        rollNumber: formData.rollNumber.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
      }

      let updatedUser = await userService.completeOnboarding(payload)

      // If user did not skip and selected a partner:
      if (!skipPartnership) {
        if (selectedRole === 'STUDENT' && selectedMentorId) {
          try {
            updatedUser = await mentorshipService.selectMentor(selectedMentorId)
          } catch (mentorErr) {
            console.warn('Mentor connection failed during onboarding:', mentorErr)
          }
        } else if (selectedRole === 'MENTOR' && selectedStudentIds.length > 0) {
          try {
            await mentorshipService.selectStudents(selectedStudentIds)
          } catch (studentErr) {
            console.warn('Student assignment failed during onboarding:', studentErr)
          }
        }
      }

      setUser(updatedUser)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to complete profile onboarding.')
      setSubmitting(false)
    }
  }

  const firstName = user.displayName ? user.displayName.split(' ')[0] : 'there'

  // Filtered lists for step 3
  const filteredMentors = availableMentors.filter((m) =>
    (m.displayName || '').toLowerCase().includes(searchPartner.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchPartner.toLowerCase())
  )

  const filteredStudents = availableStudents.filter((s) =>
    (s.displayName || '').toLowerCase().includes(searchPartner.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchPartner.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchPartner.toLowerCase()) ||
    (s.rollNumber || '').toLowerCase().includes(searchPartner.toLowerCase())
  )

  return (
    <div
      className="onboarding-page-layout login-fullscreen-bg"
      style={{ backgroundImage: `url(${sunriseBg})` }}
    >
      {/* Ambient gradient overlay identical to login page */}
      <div className="canvas-gradient-overlay" />

      {/* Top Header Bar: Clean branding only */}
      <header className="onboarding-brand-header">
        <div className="showcase-brand">
          <div className="stacked-logo-icon">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10.5L16 17L28 10.5L16 4Z" fill="#3B82F6" />
              <path d="M4 15.5L16 22L28 15.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20.5L16 27L28 20.5" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="onboarding-brand-text">CampusDocs</span>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="onboarding-main-container">
        <div className="onboarding-card-glass">
          {/* Header & Step Indicator */}
          <div className="onboarding-card-header">
            <h1 className="onboarding-page-title">
              {currentStep === 1 && `Welcome to CampusDocs, ${firstName}!`}
              {currentStep === 2 && 'Complete Your Profile Details'}
              {currentStep === 3 && (selectedRole === 'STUDENT' ? 'Connect with a Faculty Mentor' : 'Assign Your Students')}
            </h1>

            <p className="onboarding-page-subtitle">
              {currentStep === 1 && 'Step 1 of 3: Are you joining as a Student or a Mentor?'}
              {currentStep === 2 && 'Step 2 of 3: Provide your department, roll number, and contact details'}
              {currentStep === 3 && (selectedRole === 'STUDENT' 
                ? 'Step 3 of 3: Select your faculty mentor for evaluations (or skip for now)'
                : 'Step 3 of 3: Select students to guide under your mentorship (or skip for now)')}
            </p>

            {/* Stepper Progress Indicator */}
            <div className="onboarding-stepper">
              <div className={`step-node ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                <div className="node-bubble">{currentStep > 1 ? '✓' : '1'}</div>
                <span className="node-label">Role</span>
              </div>
              <div className={`step-connector ${currentStep >= 2 ? 'filled' : ''}`} />
              <div className={`step-node ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                <div className="node-bubble">{currentStep > 2 ? '✓' : '2'}</div>
                <span className="node-label">Details</span>
              </div>
              <div className={`step-connector ${currentStep >= 3 ? 'filled' : ''}`} />
              <div className={`step-node ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                <div className="node-bubble">3</div>
                <span className="node-label">{selectedRole === 'MENTOR' ? 'Students' : 'Mentor'}</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-error onboarding-compact-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================
              SCREEN 1: ROLE SELECTION
             ======================================================== */}
          {currentStep === 1 && (
            <div className="onboarding-step-body animate-fade-in">
              <div className="onboarding-role-grid">
                <div
                  className={`onboarding-role-card ${selectedRole === 'STUDENT' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('STUDENT')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRoleSelect('STUDENT')
                  }}
                >
                  <div className="role-card-top-row">
                    <span className="role-card-badge">🎓 Student</span>
                    <span className={`role-pill-status ${selectedRole === 'STUDENT' ? 'active' : ''}`}>
                      {selectedRole === 'STUDENT' ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                  <h3 className="role-card-title">I am a Student</h3>
                  <p className="role-card-desc">
                    Store coursework in Google Drive, connect with your faculty mentor, and receive document evaluations.
                  </p>
                  <ul className="role-card-features">
                    <li>✓ Dedicated Google Drive folder</li>
                    <li>✓ 1-to-1 Mentor document review</li>
                    <li>✓ Access mentor shared resources</li>
                  </ul>
                </div>

                <div
                  className={`onboarding-role-card ${selectedRole === 'MENTOR' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('MENTOR')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRoleSelect('MENTOR')
                  }}
                >
                  <div className="role-card-top-row">
                    <span className="role-card-badge mentor-badge">👥 Mentor</span>
                    <span className={`role-pill-status ${selectedRole === 'MENTOR' ? 'active' : ''}`}>
                      {selectedRole === 'MENTOR' ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                  <h3 className="role-card-title">I am a Mentor</h3>
                  <p className="role-card-desc">
                    Guide students, review and evaluate submitted coursework with personalized feedback and grades.
                  </p>
                  <ul className="role-card-features">
                    <li>✓ 1-to-N Mentee workspace</li>
                    <li>✓ Review, annotate & analyze papers</li>
                    <li>✓ Upload shared documents for mentees</li>
                  </ul>
                </div>
              </div>

              <div className="onboarding-wizard-actions">
                <div />
                <button
                  type="button"
                  onClick={handleNextFromRole}
                  className="btn btn-primary btn-lg btn-wizard-next"
                >
                  Next: Enter Profile Details →
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 2: USER PROFILE DETAILS
             ======================================================== */}
          {currentStep === 2 && (
            <form onSubmit={handleNextFromDetails} className="onboarding-step-body animate-fade-in" noValidate={false}>
              <div className="onboarding-details-section">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="onboard-age">
                      Age <span className="required-star">*</span>
                    </label>
                    <input
                      id="onboard-age"
                      name="age"
                      type="number"
                      min="14"
                      max="100"
                      required
                      placeholder="e.g. 21"
                      className="form-input"
                      value={formData.age}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="onboard-dept">
                      Department / Specialization <span className="required-star">*</span>
                    </label>
                    <input
                      id="onboard-dept"
                      name="department"
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      className="form-input"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="onboard-roll">
                      {selectedRole === 'MENTOR' ? 'Staff ID / Designation' : 'Roll Number / Student ID'} <span className="required-star">*</span>
                    </label>
                    <input
                      id="onboard-roll"
                      name="rollNumber"
                      type="text"
                      required
                      placeholder={selectedRole === 'MENTOR' ? 'e.g. PROF-104' : 'e.g. 2024CS101'}
                      className="form-input"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="onboard-phone">
                      Phone Number <span className="required-star">*</span>
                    </label>
                    <input
                      id="onboard-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label" htmlFor="onboard-bio">
                    {selectedRole === 'MENTOR' ? 'Office Hours / Guidance Notes' : 'Academic Goals / Bio'} <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="onboard-bio"
                    name="bio"
                    rows="2"
                    required
                    placeholder={selectedRole === 'MENTOR' ? 'Availability or mentoring philosophy...' : 'Share a short bio or learning goals...'}
                    className="form-textarea"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="onboarding-wizard-actions">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('')
                    setCurrentStep(1)
                  }}
                  className="btn btn-secondary btn-lg"
                >
                  ← Back to Role
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-wizard-next"
                >
                  Next: {selectedRole === 'STUDENT' ? 'Select Mentor' : 'Select Students'} →
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              SCREEN 3: SELECT MENTOR (STUDENT) OR STUDENTS (MENTOR)
             ======================================================== */}
          {currentStep === 3 && (
            <div className="onboarding-step-body animate-fade-in">
              {/* Search Bar */}
              <div className="partner-search-bar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={selectedRole === 'STUDENT' ? 'Search available mentors by name or email...' : 'Search students by name, email, or department...'}
                  value={searchPartner}
                  onChange={(e) => setSearchPartner(e.target.value)}
                  className="partner-search-input"
                />
                {searchPartner && (
                  <button className="partner-search-clear" onClick={() => setSearchPartner('')}>×</button>
                )}
              </div>

              {/* STUDENT VIEW: Pick 1 Mentor */}
              {selectedRole === 'STUDENT' && (
                <div className="partner-selection-container">
                  {loadingPartners ? (
                    <div className="partner-loading">
                      <div className="spinner-small" />
                      <span>Loading available faculty mentors...</span>
                    </div>
                  ) : filteredMentors.length === 0 ? (
                    <div className="partner-empty">
                      <p>No mentors found matching your search.</p>
                      <span className="partner-empty-hint">You can skip this step now and connect with a mentor anytime from your dashboard.</span>
                    </div>
                  ) : (
                    <div className="partner-grid">
                      {filteredMentors.map((mentor) => {
                        const isSelected = selectedMentorId === mentor.id
                        return (
                          <div
                            key={mentor.id}
                            className={`partner-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedMentorId(isSelected ? '' : mentor.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') setSelectedMentorId(isSelected ? '' : mentor.id)
                            }}
                          >
                            <div className="partner-avatar">
                              {mentor.pictureUrl ? (
                                <img src={mentor.pictureUrl} alt={mentor.displayName} />
                              ) : (
                                <span>{(mentor.displayName || mentor.email || 'M')[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="partner-info">
                              <h4 className="partner-name">{mentor.displayName || 'Faculty Mentor'}</h4>
                              <p className="partner-email">{mentor.email}</p>
                              <span className="partner-badge">
                                👥 {mentor.menteeCount || 0} {(mentor.menteeCount === 1) ? 'Student' : 'Students'}
                              </span>
                            </div>
                            <div className="partner-check">
                              <span className={`partner-radio ${isSelected ? 'checked' : ''}`}>
                                {isSelected && '✓'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MENTOR VIEW: Pick Students (Multi-select) */}
              {selectedRole === 'MENTOR' && (
                <div className="partner-selection-container">
                  {loadingPartners ? (
                    <div className="partner-loading">
                      <div className="spinner-small" />
                      <span>Loading registered students...</span>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="partner-empty">
                      <p>No students found matching your search.</p>
                      <span className="partner-empty-hint">You can skip this step now and invite or assign students anytime from your Mentor Workspace.</span>
                    </div>
                  ) : (
                    <div className="partner-grid">
                      {filteredStudents.map((student) => {
                        const isSelected = selectedStudentIds.includes(student.id)
                        return (
                          <div
                            key={student.id}
                            className={`partner-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleStudentSelection(student.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') toggleStudentSelection(student.id)
                            }}
                          >
                            <div className="partner-avatar student-avatar">
                              {student.pictureUrl ? (
                                <img src={student.pictureUrl} alt={student.displayName} />
                              ) : (
                                <span>{(student.displayName || student.email || 'S')[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="partner-info">
                              <h4 className="partner-name">{student.displayName || 'Student'}</h4>
                              <p className="partner-email">{student.email}</p>
                              {(student.department || student.rollNumber) && (
                                <span className="partner-badge student-badge">
                                  {student.department} {student.rollNumber ? `• ${student.rollNumber}` : ''}
                                </span>
                              )}
                            </div>
                            <div className="partner-check">
                              <span className={`partner-checkbox ${isSelected ? 'checked' : ''}`}>
                                {isSelected && '✓'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Wizard Actions: Back, Skip, Complete */}
              <div className="onboarding-wizard-actions">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setErrorMsg('')
                    setCurrentStep(2)
                  }}
                  className="btn btn-secondary btn-lg"
                >
                  ← Back to Details
                </button>

                <div className="wizard-right-buttons">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFinalSubmit(true)}
                    className="btn btn-outline btn-lg btn-skip"
                    title="Skip selection and proceed to Dashboard"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFinalSubmit(false)}
                    className="btn btn-primary btn-lg btn-wizard-finish"
                  >
                    {submitting ? 'Setting up workspace...' : `Finish Setup & Enter Dashboard →`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
