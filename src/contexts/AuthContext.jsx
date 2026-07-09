import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, ROLES } from '../utils/supabase'

const AuthContext = createContext()

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

  useEffect(() => {
    const storedUser = localStorage.getItem('nhq-current-user')
    const storedToken = localStorage.getItem('nhq-session-token')
    const expiry = parseInt(localStorage.getItem('nhq-session-expiry'), 10)

    if (storedUser && storedToken && expiry && expiry > Date.now()) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        setSessionToken(storedToken)
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
      p_device: ua.device
    })

    if (rpcError) throw new Error('Login failed. Please try again.')

    if (!data.success) {
      const err = new Error(data.error)
      err.remainingAttempts = data.remaining_attempts
      err.locked = data.locked || false
      throw err
    }

    const { user: userData, token, expires_at } = data

    setUser(userData)
    setSessionToken(token)

    localStorage.setItem('nhq-current-user', JSON.stringify(userData))
    localStorage.setItem('nhq-session-token', token)
    localStorage.setItem('nhq-session-expiry', new Date(expires_at).getTime().toString())

    return userData
  }, [])

  const logout = useCallback(async () => {
    if (sessionToken) {
      await supabase.rpc('logout_user', { p_token: sessionToken }).catch(() => {})
    }

    setUser(null)
    setSessionToken(null)
    localStorage.removeItem('nhq-current-user')
    localStorage.removeItem('nhq-session-token')
    localStorage.removeItem('nhq-session-expiry')
    localStorage.removeItem('nhq-session-last-tab-time')
  }, [sessionToken])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error('Not authenticated.')

    const { error: rpcError } = await supabase.rpc('change_own_password', {
      p_user_id: user.id,
      p_current_password: currentPassword,
      p_new_password: newPassword
    })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: user.id,
      user_name: user.username,
      user_role: user.role,
      action: 'password_change',
      description: `${user.username} changed their password`
    })

    return true
  }, [user])

  const createUser = useCallback(async (username, password, role) => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')

    const { data: newUser, error: rpcError } = await supabase.rpc('create_user', {
      p_admin_id: user.id,
      p_username: username,
      p_password: password,
      p_role: role
    })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: user.id,
      user_name: user.username,
      user_role: user.role,
      action: 'user_create',
      description: `Created user "${username}" with role "${role}"`
    })

    return newUser
  }, [user])

  const deleteUser = useCallback(async (userId) => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')
    if (userId === user.id) throw new Error('Cannot delete your own account.')

    const { data: targetUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()

    if (!targetUser) throw new Error('User not found.')

    const { error: rpcError } = await supabase.rpc('deactivate_user', {
      p_admin_id: user.id,
      p_target_user_id: userId
    })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: user.id,
      user_name: user.username,
      user_role: user.role,
      action: 'user_delete',
      description: `Deleted user "${targetUser.username}"`
    })

    return true
  }, [user])

  const resetUserPassword = useCallback(async (userId, newPassword) => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')

    const { data: targetUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()

    if (!targetUser) throw new Error('User not found.')

    const { error: rpcError } = await supabase.rpc('reset_user_password', {
      p_admin_id: user.id,
      p_target_user_id: userId,
      p_new_password: newPassword
    })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: user.id,
      user_name: user.username,
      user_role: user.role,
      action: 'password_reset',
      description: `Reset password for user "${targetUser.username}"`
    })

    return true
  }, [user])

  const getUsers = useCallback(async () => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')

    const { data, error: rpcError } = await supabase.rpc('get_all_users', {
      p_admin_id: user.id
    })

    if (rpcError) throw new Error(rpcError.message)
    return data || []
  }, [user])

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
      login,
      logout,
      changePassword,
      createUser,
      deleteUser,
      resetUserPassword,
      getUsers,
      validateSession,
      isSuperUser: user?.role === ROLES.SUPER_USER,
      isAdmin: user?.role === ROLES.ADMIN,
      isReadOnly: user?.role === ROLES.READ_ONLY,
      canManageUsers: user?.role === ROLES.SUPER_USER,
      canModifyInventory: user?.role === ROLES.SUPER_USER || user?.role === ROLES.ADMIN,
      canExport: user?.role === ROLES.SUPER_USER || user?.role === ROLES.ADMIN,
      canViewAllLogs: user?.role === ROLES.SUPER_USER,
      canViewAdminLogs: user?.role === ROLES.ADMIN
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