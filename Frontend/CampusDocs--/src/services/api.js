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
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', originalFileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 1500)
  },

  update: async (id, data) => {
    try {
      const response = await api.patch(`/api/documents/${id}`, data)
      return response.data
    } catch (err) {
      if (err.response?.status === 405 || err.response?.status === 403) {
        const response = await api.put(`/api/documents/${id}`, data)
        return response.data
      }
      throw err
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/api/documents/${id}`)
    return response.data
  },
}

export default api
