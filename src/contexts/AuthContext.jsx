import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, ROLES, USER_CREDENTIALS } from '../utils/supabase'

const AuthContext = createContext()

const LOCKOUT_DURATION = 10 * 60 * 1000
const MAX_ATTEMPTS = 3

function loadPersistedPasswords() {
  try {
    const stored = localStorage.getItem('nhq-passwords')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.admin) USER_CREDENTIALS.admin.password = data.admin
      if (data.nhq) USER_CREDENTIALS.nhq.password = data.nhq
    }
  } catch {}
}

function persistPassword(role, password) {
  try {
    const stored = JSON.parse(localStorage.getItem('nhq-passwords') || '{}')
    stored[role] = password
    localStorage.setItem('nhq-passwords', JSON.stringify(stored))
  } catch {}
}

loadPersistedPasswords()

function getStoredAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem('nhq-login-attempts') || '{}')
    const now = Date.now()
    if (data.lockedUntil && now > data.lockedUntil) {
      localStorage.removeItem('nhq-login-attempts')
      return { count: 0, lockedUntil: null }
    }
    return data
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

function storeAttempt(count, lockedUntil) {
  localStorage.setItem('nhq-login-attempts', JSON.stringify({ count, lockedUntil }))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lockoutInfo, setLockoutInfo] = useState(() => {
    const data = getStoredAttempts()
    return data.lockedUntil ? { locked: true, until: data.lockedUntil } : null
  })

  useEffect(() => {
    const stored = localStorage.getItem('nhq-current-user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch { }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!lockoutInfo) return
    if (!lockoutInfo.locked) return
    const timer = setInterval(() => {
      if (Date.now() >= lockoutInfo.until) {
        setLockoutInfo(null)
        localStorage.removeItem('nhq-login-attempts')
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutInfo])

  const login = useCallback(async (username, password) => {
    setError('')

    const attempts = getStoredAttempts()
    if (attempts.lockedUntil) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000)
      setLockoutInfo({ locked: true, until: attempts.lockedUntil })
      throw new Error(`Account locked. Try again in ${remaining} minute(s).`)
    }

    if (!username || !password) {
      throw new Error('Please enter username and password.')
    }

    const userEntry = Object.values(USER_CREDENTIALS).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    )

    if (!userEntry) {
      const newCount = attempts.count + 1
      const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : null
      storeAttempt(newCount, lockedUntil)
      if (lockedUntil) {
        setLockoutInfo({ locked: true, until: lockedUntil })
        throw new Error(`Account locked for 10 minutes due to too many failed attempts.`)
      }
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - newCount} attempt(s) remaining.`)
    }

    if (password !== userEntry.password) {
      const newCount = attempts.count + 1
      const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : null
      storeAttempt(newCount, lockedUntil)
      if (lockedUntil) {
        setLockoutInfo({ locked: true, until: lockedUntil })
        throw new Error(`Account locked for 10 minutes due to too many failed attempts.`)
      }
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - newCount} attempt(s) remaining.`)
    }

    localStorage.removeItem('nhq-login-attempts')
    setLockoutInfo(null)

    const userData = {
      id: userEntry.username,
      username: userEntry.username,
      name: userEntry.name,
      role: userEntry.role
    }

    setUser(userData)
    localStorage.setItem('nhq-current-user', JSON.stringify(userData))

    supabase.from('activity_logs').insert([{
      product_id: null,
      action: 'login',
      description: `${userEntry.name} (${userEntry.role}) logged in`,
      user_id: userEntry.username,
      user_name: userEntry.name
    }]).then().catch(() => {})

    return userData
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('nhq-current-user')
    localStorage.removeItem('nhq-login-attempts')
  }, [])

  const resetUserPassword = useCallback(async (targetUsername, newPassword) => {
    const entry = Object.values(USER_CREDENTIALS).find(
      u => u.username.toLowerCase() === targetUsername.toLowerCase()
    )
    if (!entry) throw new Error('User not found.')
    if (entry.role === 'root') throw new Error('Cannot reset root password through this interface.')
    if (entry.role === 'nhq' || entry.role === 'admin') {
      USER_CREDENTIALS[entry.role].password = newPassword
      persistPassword(entry.role, newPassword)
      return true
    }
    throw new Error('Invalid user.')
  }, [])

  const checkRootSecurity = useCallback(async (answer) => {
    const stored = localStorage.getItem('nhq-root-security')
    if (!stored) return false
    const data = JSON.parse(stored)
    if (data.answer === answer) return true
    return false
  }, [])

  const setRootSecurity = useCallback(async (question, answer) => {
    localStorage.setItem('nhq-root-security', JSON.stringify({ question, answer }))
    return true
  }, [])

  const resetRootPassword = useCallback(async (newPassword) => {
    USER_CREDENTIALS.root.password = newPassword
    localStorage.removeItem('nhq-root-security')
    return true
  }, [])

  const getLockoutRemaining = useCallback(() => {
    if (!lockoutInfo || !lockoutInfo.locked) return 0
    return Math.max(0, Math.ceil((lockoutInfo.until - Date.now()) / 1000))
  }, [lockoutInfo])

  const canEdit = user && (user.role === ROLES.ROOT || user.role === ROLES.ADMIN)
  const canExport = user && (user.role === ROLES.ROOT || user.role === ROLES.ADMIN)
  const isRoot = user?.role === ROLES.ROOT
  const isReadOnly = user?.role === ROLES.NHQ

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      resetUserPassword,
      checkRootSecurity,
      setRootSecurity,
      resetRootPassword,
      getLockoutRemaining,
      lockoutInfo,
      canEdit,
      canExport,
      isRoot,
      isReadOnly
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
