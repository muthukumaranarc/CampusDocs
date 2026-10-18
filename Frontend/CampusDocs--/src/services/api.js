import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export const authService = {
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me')
      return response.data
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return null
      }
      throw error
    }
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout')
    return response.data
  },

  getLoginUrl: () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || ''
    return `${backendUrl}/oauth2/authorization/google`
  },
}

export const driveService = {
  getStatus: async () => {
    const response = await api.get('/api/drive/status')
    return response.data
  },

  connect: async () => {
    const response = await api.post('/api/drive/connect')
    return response.data
  },

  ensureFolder: async () => {
    const response = await api.post('/api/drive/folder/ensure')
    return response.data
  },

  disconnect: async () => {
    const response = await api.post('/api/drive/disconnect')
    return response.data
  },
}

export const documentService = {
  upload: async (formData, onUploadProgress, signal) => {
    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      signal,
    })
    return response.data
  },

  getDocuments: async (params = {}) => {
    const response = await api.get('/api/documents', { params })
    return response.data
  },

  getRecent: async () => {
    const response = await api.get('/api/documents/recent')
    return response.data
  },

  getPreviewUrl: (id) => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || ''
    return `${backendUrl}/api/documents/${id}/preview`
  },

  getPreviewBlob: async (id) => {
    const response = await api.get(`/api/documents/${id}/preview`, {
      responseType: 'blob',
    })
    return {
      blob: response.data,
      contentType: response.headers['content-type'] || 'application/octet-stream',
    }
  },

  download: async (id, originalFileName = 'document') => {
    const response = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    })
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', originalFileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    return true
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/api/documents/${id}`, data)
      return response.data
    } catch (err) {
      if (err.response && err.response.status === 405) {
        const response = await api.patch(`/api/documents/${id}`, data)
        return response.data
      }
      throw err
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/api/documents/${id}`)
    return response.data
  },

  getMentorShared: async () => {
    const response = await api.get('/api/documents/mentor-shared')
    return response.data
  },
}

// User Profile, Onboarding & Account Management
export const userService = {
  completeOnboarding: async (data) => {
    const response = await api.post('/api/user/onboarding', data)
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/user/profile', data)
    return response.data
  },

  getUserById: async (id) => {
    const response = await api.get(`/api/user/${id}`)
    return response.data
  },

  getCampusDirectory: async () => {
    const response = await api.get('/api/user/directory')
    return response.data
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/user/account')
    return response.data
  },
}

// Mentorship service (Student & Mentor functionality)
export const mentorshipService = {
  getMyMentor: async () => {
    const response = await api.get('/api/mentorship/my-mentor')
    return response.data
  },

  getFriends: async () => {
    const response = await api.get('/api/mentorship/friends')
    return response.data
  },

  getAvailableMentors: async () => {
    const response = await api.get('/api/mentorship/available-mentors')
    return response.data
  },

  getAvailableStudents: async () => {
    const response = await api.get('/api/mentorship/available-students')
    return response.data
  },

  selectMentor: async (mentorId) => {
    const response = await api.post(`/api/mentorship/select-mentor/${mentorId}`)
    return response.data
  },

  selectStudents: async (studentIds) => {
    const response = await api.post('/api/mentorship/select-students', studentIds)
    return response.data
  },

  getMentees: async () => {
    const response = await api.get('/api/mentorship/mentees')
    return response.data
  },

  getMenteeDocuments: async (studentId) => {
    const response = await api.get(`/api/mentorship/mentees/${studentId}/documents`)
    return response.data
  },

  analyzeDocument: async (documentId, data) => {
    const response = await api.post(`/api/mentorship/documents/${documentId}/analyze`, data)
    return response.data
  },
}

// Admin service (User creation, Mentor assignment, and System metrics)
export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/api/admin/users')
    return response.data
  },

  createUser: async (data) => {
    const response = await api.post('/api/admin/users', data)
    return response.data
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, { role })
    return response.data
  },

  assignMentor: async (studentId, mentorId) => {
    const response = await api.put(`/api/admin/students/${studentId}/mentor`, { mentorId })
    return response.data
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`)
    return response.data
  },

  getAdminStats: async () => {
    const response = await api.get('/api/admin/stats')
    return response.data
  },
}

// Announcements service (Public campus-wide announcements for students & mentors)
export const announcementService = {
  getAll: async () => {
    const response = await api.get('/api/announcements')
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/api/announcements', data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/api/announcements/${id}`)
    return response.data
  },
}

// Notifications service (Real student & faculty notifications)
export const notificationService = {
  getAll: async () => {
    const response = await api.get('/api/notifications')
    return response.data
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread-count')
    return response.data
  },

  markAsRead: async (id) => {
    const response = await api.put(`/api/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/api/notifications/read-all')
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/api/notifications/${id}`)
    return response.data
  },
}

export default api


