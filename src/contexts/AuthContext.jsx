import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext()

const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_DELETE: 'users.delete',
  USERS_RESET_PASSWORD: 'users.reset_password',
  USERS_CHANGE_OWN_PASSWORD: 'users.change_own_password',
  USERS_VIEW: 'users.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_ARCHIVE: 'inventory.archive',
  INVENTORY_RESTORE: 'inventory.restore',
  INVENTORY_QUANTITY_INCREASE: 'inventory.quantity.increase',
  INVENTORY_QUANTITY_DECREASE: 'inventory.quantity.decrease',
  INVENTORY_VIEW: 'inventory.view',
  EXPORT_EXCEL: 'export.excel',
  EXPORT_PDF: 'export.pdf',
  LOGS_VIEW_ALL: 'logs.view.all',
  LOGS_VIEW_ADMIN_READONLY: 'logs.view.admin_readonly',
  LOGS_VIEW_OWN: 'logs.view.own'
}

function parseUA() {
  const ua = navigator.userAgent
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/')) browser = 'Safari'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile' }
  else if (ua.includes('iPhone')) { os = 'iOS'; device = 'Mobile' }
  return { browser, os, device }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const storedUser = localStorage.getItem('nhq-current-user')
    const storedToken = localStorage.getItem('nhq-session-token')
    const storedPerms = localStorage.getItem('nhq-user-permissions')
    const expiry = parseInt(localStorage.getItem('nhq-session-expiry'), 10)

    if (storedUser && storedToken && expiry && expiry > Date.now()) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        setSessionToken(storedToken)
        if (storedPerms) setPermissions(JSON.parse(storedPerms))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const ua = parseUA()

    const { data, error: rpcError } = await supabase.rpc('login_user', {
      p_username: username,
      p_password: password,
      p_browser: ua.browser,
      p_os: ua.os,
      p_device: ua.device,
      p_ip_address: null
    })

    if (rpcError) throw new Error('Login failed. Please try again.')

    if (!data.success) {
      const err = new Error(data.error)
      err.remainingAttempts = data.remaining_attempts
      err.locked = data.locked || false
      throw err
    }

    const { user: userData, token, expires_at, permissions: perms } = data

    setUser(userData)
    setSessionToken(token)
    setPermissions(perms || [])

    try {
      localStorage.setItem('nhq-current-user', JSON.stringify(userData))
      localStorage.setItem('nhq-session-token', token)
      localStorage.setItem('nhq-session-expiry', new Date(expires_at).getTime().toString())
      localStorage.setItem('nhq-user-permissions', JSON.stringify(perms || []))
    } catch {}

    return userData
  }, [])

  const logout = useCallback((msg) => {
    // Fire-and-forget server-side invalidation
    try {
      const token = localStorage.getItem('nhq-session-token')
      if (token) supabase.rpc('logout_user', { p_token: token }).catch(() => {})
    } catch {}

    // Wipe ALL auth-related storage
    ;[
      'nhq-current-user', 'nhq-session-token', 'nhq-session-expiry',
      'nhq-session-last-tab-time', 'nhq-user-permissions',
      'nhq-session-last-activity'
    ].forEach(k => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })

    if (msg) {
      try { sessionStorage.setItem('nhq-logout-message', msg) } catch {}
    }

    // Force full page redirect — replaces history so Back button can't restore session
    try { window.location.replace('/login') } catch {}
  }, [])

  const userCan = useCallback((permissionCode) => {
    return permissions.includes(permissionCode)
  }, [permissions])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error('Not authenticated.')

    const { error: rpcError } = await supabase.rpc('change_own_password', {
      p_user_id: user.id,
      p_current_password: currentPassword,
      p_new_password: newPassword
    })

    if (rpcError) throw new Error(rpcError.message)
    return true
  }, [user])

  const createUser = useCallback(async (username, password, role) => {
    if (!userCan(PERMISSIONS.USERS_CREATE)) throw new Error('Unauthorized.')

    const { data: newUser, error: rpcError } = await supabase.rpc('create_user', {
      p_admin_id: user.id,
      p_username: username,
      p_password: password,
      p_role_name: role
    })

    if (rpcError) throw new Error(rpcError.message)
    return newUser
  }, [user, userCan])

  const deleteUser = useCallback(async (userId) => {
    if (!userCan(PERMISSIONS.USERS_DELETE)) throw new Error('Unauthorized.')
    if (userId === user.id) throw new Error('Cannot delete your own account.')

    const { error: rpcError } = await supabase.rpc('deactivate_user', {
      p_admin_id: user.id,
      p_target_user_id: userId
    })

    if (rpcError) throw new Error(rpcError.message)
    return true
  }, [user, userCan])

  const resetUserPassword = useCallback(async (userId, newPassword) => {
    if (!userCan(PERMISSIONS.USERS_RESET_PASSWORD)) throw new Error('Unauthorized.')

    const { error: rpcError } = await supabase.rpc('reset_user_password', {
      p_admin_id: user.id,
      p_target_user_id: userId,
      p_new_password: newPassword
    })

    if (rpcError) throw new Error(rpcError.message)
    return true
  }, [user, userCan])

  const getUsers = useCallback(async () => {
    if (!userCan(PERMISSIONS.USERS_VIEW)) throw new Error('Unauthorized.')

    const { data, error: rpcError } = await supabase.rpc('get_all_users', {
      p_admin_id: user.id
    })

    if (rpcError) throw new Error(rpcError.message)
    return data || []
  }, [user, userCan])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_categories')
      if (error) throw error
      setCategories(data || [])
      return data || []
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      return []
    }
  }, [])

  const validateSession = useCallback(async () => {
    if (!sessionToken) return false
    const { data, error: rpcError } = await supabase.rpc('validate_session', {
      p_token: sessionToken
    })
    if (rpcError || !data?.valid) {
      if (data?.expired) logout()
      return false
    }
    return true
  }, [sessionToken, logout])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      permissions,
      categories,
      login,
      logout,
      userCan,
      changePassword,
      createUser,
      deleteUser,
      resetUserPassword,
      getUsers,
      fetchCategories,
      validateSession,
      isSuperUser: user?.role === 'super_user',
      isAdmin: user?.role === 'admin',
      isReadOnly: user?.role === 'read_only',
      canManageUsers: userCan(PERMISSIONS.USERS_CREATE) || userCan(PERMISSIONS.USERS_DELETE),
      canModifyInventory: userCan(PERMISSIONS.INVENTORY_CREATE),
      canExport: userCan(PERMISSIONS.EXPORT_EXCEL),
      canViewAllLogs: userCan(PERMISSIONS.LOGS_VIEW_ALL),
      canViewAdminLogs: userCan(PERMISSIONS.LOGS_VIEW_ADMIN_READONLY)
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

export { PERMISSIONS }
