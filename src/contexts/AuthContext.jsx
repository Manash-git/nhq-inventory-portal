import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, ROLES, canManageUsers } from '../utils/supabase'

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

const AuthContext = createContext()
const SESSION_DURATION = 60 * 60 * 1000

function generateToken() {
  return generateId() + '-' + Date.now().toString(36)
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
    // Fetch user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('is_active', true)
      .limit(1)

    if (error) throw new Error('Database error. Please try again.')

    if (!users || users.length === 0) {
      throw new Error('Invalid credentials.')
    }

    const dbUser = users[0]

    // Check if account is locked
    if (dbUser.locked_until && new Date(dbUser.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(dbUser.locked_until) - new Date()) / 60000)
      throw new Error(`Account locked. Try again in ${remaining} minute(s).`)
    }

    // Verify password
    if (dbUser.password !== password) {
      const newAttempts = (dbUser.failed_attempts || 0) + 1

      if (newAttempts >= 3) {
        await supabase
          .from('users')
          .update({
            failed_attempts: newAttempts,
            locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString()
          })
          .eq('id', dbUser.id)
        throw new Error('Account locked for 10 minutes due to too many failed attempts.')
      }

      await supabase
        .from('users')
        .update({ failed_attempts: newAttempts })
        .eq('id', dbUser.id)

      const remaining = 3 - newAttempts
      throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining.`)
    }

    // Reset failed attempts on success
    await supabase
      .from('users')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', dbUser.id)

    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

    // Create session record in database
    await supabase.from('sessions').insert({
      user_id: dbUser.id,
      token: token,
      expires_at: expiresAt,
      is_valid: true
    })

    // Log login activity
    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: dbUser.id,
      user_name: dbUser.display_name,
      user_role: dbUser.role,
      action: 'login',
      description: `${dbUser.display_name} (${dbUser.role}) logged in`
    })

    const userData = {
      id: dbUser.id,
      username: dbUser.username,
      display_name: dbUser.display_name,
      role: dbUser.role
    }

    setUser(userData)
    setSessionToken(token)

    localStorage.setItem('nhq-current-user', JSON.stringify(userData))
    localStorage.setItem('nhq-session-token', token)
    localStorage.setItem('nhq-session-expiry', expiresAt)

    return userData
  }, [])

  const logout = useCallback(async () => {
    if (user && sessionToken) {
      // Invalidate session in database
      await supabase
        .from('sessions')
        .update({ is_valid: false })
        .eq('token', sessionToken)

      // Log logout
      await supabase.from('activity_logs').insert({
        product_id: null,
        user_id: user.id,
        user_name: user.display_name,
        user_role: user.role,
        action: 'logout',
        description: `${user.display_name} (${user.role}) logged out`
      })
    }

    setUser(null)
    setSessionToken(null)
    localStorage.removeItem('nhq-current-user')
    localStorage.removeItem('nhq-session-token')
    localStorage.removeItem('nhq-session-expiry')
    localStorage.removeItem('nhq-session-last-tab-time')
  }, [user, sessionToken])

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
      user_name: user.display_name,
      user_role: user.role,
      action: 'password_change',
      description: `${user.display_name} changed their password`
    })

    return true
  }, [user])

  const createUser = useCallback(async (username, password, displayName, role) => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')

    const { data: newUser, error: rpcError } = await supabase.rpc('create_user', {
      p_admin_id: user.id,
      p_username: username,
      p_password: password,
      p_display_name: displayName,
      p_role: role
    })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from('activity_logs').insert({
      product_id: null,
      user_id: user.id,
      user_name: user.display_name,
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
      .select('username, display_name')
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
      user_name: user.display_name,
      user_role: user.role,
      action: 'user_delete',
      description: `Deleted user "${targetUser.username}" (${targetUser.display_name})`
    })

    return true
  }, [user])

  const resetUserPassword = useCallback(async (userId, newPassword) => {
    if (!user || user.role !== ROLES.SUPER_USER) throw new Error('Unauthorized.')

    const { data: targetUser } = await supabase
      .from('users')
      .select('username, display_name')
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
      user_name: user.display_name,
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

    const { data, error } = await supabase
      .from('sessions')
      .select('is_valid, expires_at')
      .eq('token', sessionToken)
      .eq('is_valid', true)
      .single()

    if (error || !data) return false

    // Check if expired
    if (new Date(data.expires_at) <= new Date()) {
      await supabase.from('sessions').update({ is_valid: false }).eq('token', sessionToken)
      logout()
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