import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSession } from '../../contexts/SessionContext'
import { useNotification } from '../../contexts/NotificationContext'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const { isDark, toggleDark } = useTheme()
  const { sessionExpired } = useSession()
  const { addToast } = useNotification()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [remainingAttempts, setRemainingAttempts] = useState(null)
  const [lockedMessage, setLockedMessage] = useState('')

  useEffect(() => {
    if (sessionExpired) {
      addToast('Your session has expired. Please log in again.', 'warning')
    }
  }, [sessionExpired, addToast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setRemainingAttempts(null)
    setLockedMessage('')

    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter username and password.')
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      const msg = err.message
      setLoginError(msg)

      // Parse remaining attempts from error
      const attemptsMatch = msg.match(/(\d+) attempt/)
      if (attemptsMatch) {
        setRemainingAttempts(parseInt(attemptsMatch[1]))
      }

      if (msg.includes('locked')) {
        setLockedMessage(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-decoration">
        <div className="login-bg-circle c1"></div>
        <div className="login-bg-circle c2"></div>
        <div className="login-bg-circle c3"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <img
            src="https://www.nhqbd.com/storage/2020/04/logo-nhq.png"
            alt="NHQ Logo"
            className="login-logo"
            onError={(e) => { e.target.src = ''; e.target.style.display = 'none' }}
          />
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your inventory portal</p>

          {lockedMessage && (
            <div className="login-lockout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>{lockedMessage}</span>
            </div>
          )}

          {loginError && !lockedMessage && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {remainingAttempts !== null && remainingAttempts > 0 && (
            <div className="login-attempts-remaining">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{remainingAttempts} attempt(s) remaining before lockout.</span>
            </div>
          )}

          <div className="login-field">
            <label className="login-field-label">Username</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="12" r="4"/>
              </svg>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="login-input"
                autoFocus
                disabled={lockedMessage && !loginError}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-field-label">Password</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="login-input"
                disabled={lockedMessage && !loginError}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-btn-loading">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          <div className="login-footer-links">
            <button type="button" className="login-link-btn" onClick={() => alert('Contact to your administrator')}>
              Forgot password?
            </button>
          </div>
        </form>

        <div className="login-theme-toggle">
          <button onClick={toggleDark} className="theme-toggle-btn" title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        <p className="login-copyright">
          &copy; {new Date().getFullYear()} NHQ Distributions Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  )
}