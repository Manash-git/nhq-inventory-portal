import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import './Login.css'

export default function Login() {
  const { login, error, lockoutInfo, getLockoutRemaining, checkRootSecurity, setRootSecurity, resetRootPassword, user } = useAuth()
  const { isDark, toggleDark } = useTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState('') // 'question' | 'answer' | 'reset'
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')

  useEffect(() => {
    if (!lockoutInfo?.locked) return
    const timer = setInterval(() => {
      const r = getLockoutRemaining()
      setRemaining(r)
      if (r <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutInfo, getLockoutRemaining])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter username and password.')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    setForgotMsg('')
    const stored = localStorage.getItem('nhq-root-security')
    if (stored) {
      const data = JSON.parse(stored)
      setSecurityQuestion(data.question)
      setForgotStep('answer')
    } else {
      setForgotStep('question')
    }
  }

  const handleSetQuestion = async () => {
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setForgotMsg('Please fill in both fields.')
      return
    }
    await setRootSecurity(securityQuestion.trim(), securityAnswer.trim())
    setForgotMsg('Security question saved. You can now reset your password.')
    setTimeout(() => {
      setShowForgot(false)
      setForgotStep('')
      setForgotMsg('')
    }, 2000)
  }

  const handleVerifyAnswer = async () => {
    setForgotMsg('')
    const valid = await checkRootSecurity(securityAnswer.trim())
    if (!valid) {
      setForgotMsg('Incorrect answer.')
      return
    }
    setForgotStep('reset')
  }

  const handleResetPassword = async () => {
    setForgotMsg('')
    if (newPassword.length < 6) {
      setForgotMsg('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setForgotMsg('Passwords do not match.')
      return
    }
    await resetRootPassword(newPassword)
    setForgotMsg('Password reset successful! You can now login.')
    setTimeout(() => {
      setShowForgot(false)
      setForgotStep('')
      setNewPassword('')
      setConfirmPassword('')
      setForgotMsg('')
    }, 2000)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
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

        {!showForgot ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your inventory portal</p>

            {lockoutInfo?.locked && (
              <div className="login-lockout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Account locked. Try again in {formatTime(remaining)}</span>
              </div>
            )}

            {loginError && (
              <div className="login-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            <div className="login-field">
              <label className="login-field-label">Username / Email</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="12" r="4"/>
                </svg>
                <input
                  type="text"
                  placeholder="Username or email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="login-input"
                  autoFocus
                  disabled={lockoutInfo?.locked}
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
                  disabled={lockoutInfo?.locked}
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
              disabled={loading || lockoutInfo?.locked}
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
              <button type="button" className="login-link-btn" onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            </div>

            <div className="login-users-hint">
              <p>Demo Accounts:</p>
              <div className="login-users-list">
                <span><strong>manash@nhqbd.com</strong> (Root) / Man&Mond71</span>
                <span><strong>admin</strong> (Admin) / Man@321%</span>
                <span><strong>nhq</strong> (Guest) / Nhq@321%</span>
              </div>
            </div>
          </form>
        ) : (
          <div className="login-form">
            <button className="login-back-btn" onClick={() => { setShowForgot(false); setForgotStep(''); setForgotMsg('') }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to login
            </button>

            {forgotStep === '' && (
              <>
                <h2 className="login-title" style={{ marginTop: 8 }}>Reset Root Password</h2>
                <p className="login-subtitle">Set up or answer your security question</p>
                {forgotMsg && <div className="login-error" style={{ borderLeftColor: 'var(--success)' }}>{forgotMsg}</div>}
                <button className="login-btn" onClick={handleForgot} style={{ marginTop: 12 }}>
                  Continue
                </button>
              </>
            )}

            {forgotStep === 'question' && (
              <>
                <h2 className="login-title" style={{ marginTop: 8 }}>Set Security Question</h2>
                <p className="login-subtitle">This will be used to reset your password</p>
                {forgotMsg && <div className="login-error">{forgotMsg}</div>}
                <div className="login-field">
                  <label className="login-field-label">Security Question</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="e.g. What is your pet's name?"
                    value={securityQuestion}
                    onChange={e => setSecurityQuestion(e.target.value)}
                  />
                </div>
                <div className="login-field">
                  <label className="login-field-label">Answer</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Your answer"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                  />
                </div>
                <button className="login-btn" onClick={handleSetQuestion}>Save & Continue</button>
              </>
            )}

            {forgotStep === 'answer' && (
              <>
                <h2 className="login-title" style={{ marginTop: 8 }}>Verify Identity</h2>
                <p className="login-subtitle">{securityQuestion}</p>
                {forgotMsg && <div className="login-error">{forgotMsg}</div>}
                <div className="login-field">
                  <label className="login-field-label">Your Answer</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Enter your answer"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                  />
                </div>
                <button className="login-btn" onClick={handleVerifyAnswer}>Verify</button>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <h2 className="login-title" style={{ marginTop: 8 }}>Reset Password</h2>
                <p className="login-subtitle">Enter your new password</p>
                {forgotMsg && <div className="login-error">{forgotMsg}</div>}
                <div className="login-field">
                  <label className="login-field-label">New Password</label>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="login-field">
                  <label className="login-field-label">Confirm Password</label>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button className="login-btn" onClick={handleResetPassword}>Reset Password</button>
              </>
            )}
          </div>
        )}

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
