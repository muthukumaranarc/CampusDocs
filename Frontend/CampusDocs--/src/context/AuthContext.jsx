import { useState, useEffect } from 'react'
import { authService } from '../services/api'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const verifyUserSession = async () => {
    try {
      const profile = await authService.getCurrentUser()
      setUser(profile)
      setError(null)
    } catch (err) {
      console.error('Failed to verify authentication session:', err)
      setUser(null)
      setError('Unable to reach server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    authService.getCurrentUser()
      .then((profile) => {
        if (isMounted) {
          setUser(profile)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to verify authentication session:', err)
          setUser(null)
          setError('Unable to reach server.')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const logout = async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  const value = {
    user,
    setUser,
    loading,
    error,
    checkAuth: verifyUserSession,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
