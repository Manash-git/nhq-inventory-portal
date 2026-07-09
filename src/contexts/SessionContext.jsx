import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'

const SESSION_DURATION = 60 * 60 * 1000
const WARNING_BEFORE = 5 * 60 * 1000
const GRACE_PERIOD = 5 * 60 * 1000
const HEARTBEAT_INTERVAL = 5000

const SessionContext = createContext()

function generateTabId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function SessionProvider({ children }) {
  const { user, logout } = useAuth()
  const { addToast } = useNotification()

  const [remaining, setRemaining] = useState(null)
  const [warning, setWarning] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const tabId = useRef(generateTabId())
  const channel = useRef(null)
  const warned = useRef(false)
  const expired = useRef(false)

  const doLogout = useCallback((msg) => {
    if (expired.current) return
    expired.current = true
    try { channel.current?.close() } catch {}
    localStorage.removeItem('nhq-session-expiry')
    localStorage.removeItem('nhq-session-last-tab-time')
    if (msg) addToast(msg, 'warning')
    setSessionExpired(true)
    logout()
  }, [logout, addToast])

  useEffect(() => {
    if (!user) {
      try { channel.current?.close() } catch {}
      setRemaining(null)
      setWarning(false)
      warned.current = false
      expired.current = false
      setSessionExpired(false)
      return
    }

    const myId = tabId.current
    expired.current = false
    warned.current = false
    setSessionExpired(false)

    const bc = new BroadcastChannel('nhq-session')
    channel.current = bc

    const tabs = new Set()
    tabs.add(myId)

    bc.postMessage({ type: 'TAB_OPEN', id: myId })

    bc.onmessage = (e) => {
      const { type, id, data } = e.data
      if (type === 'TAB_OPEN' || type === 'HEARTBEAT') {
        tabs.add(id)
        localStorage.removeItem('nhq-session-last-tab-time')
      }
      if (type === 'TAB_CLOSE') {
        tabs.delete(id)
      }
      if (type === 'SESSION_GONE') {
        doLogout('Your session has expired. Please log in again.')
      }
    }

    // Set expiry from localStorage or create new
    let expiry = parseInt(localStorage.getItem('nhq-session-expiry'), 10)
    if (!expiry || expiry <= Date.now()) {
      expiry = Date.now() + SESSION_DURATION
      localStorage.setItem('nhq-session-expiry', expiry.toString())
    }

    // Check grace period
    const lastTabTime = localStorage.getItem('nhq-session-last-tab-time')
    if (lastTabTime) {
      const elapsed = Date.now() - parseInt(lastTabTime, 10)
      if (elapsed < GRACE_PERIOD) {
        localStorage.removeItem('nhq-session-last-tab-time')
      } else {
        doLogout('Your session has expired. Please log in again.')
        return
      }
    }

    const tick = setInterval(() => {
      const left = expiry - Date.now()
      setRemaining(left)

      if (left <= 0) {
        doLogout('Your session has expired. Please log in again.')
        return
      }

      if (left <= WARNING_BEFORE && !warned.current) {
        warned.current = true
        setWarning(true)
      }
      if (left > WARNING_BEFORE && warned.current) {
        warned.current = false
        setWarning(false)
      }
    }, 1000)

    const heartbeat = setInterval(() => {
      try {
        bc.postMessage({ type: 'HEARTBEAT', id: myId })
      } catch {}
    }, HEARTBEAT_INTERVAL)

    const handleBeforeUnload = () => {
      try {
        bc.postMessage({ type: 'TAB_CLOSE', id: myId })
        tabs.delete(myId)

        // Broadcast that user wants to know if other tabs exist
        const checkTimer = setTimeout(() => {
          if (tabs.size === 0) {
            localStorage.setItem('nhq-session-last-tab-time', Date.now().toString())
          }
        }, 100)
        ; window.addEventListener('unload', () => clearTimeout(checkTimer))
      } catch {}
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(tick)
      clearInterval(heartbeat)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
      try { bc.close() } catch {}
    }
  }, [user, doLogout])

  return (
    <SessionContext.Provider value={{ remaining, warning, sessionExpired }}>
      {children}
      {warning && user && remaining > 0 && (
        <SessionWarning remaining={remaining} />
      )}
    </SessionContext.Provider>
  )
}

function SessionWarning({ remaining }) {
  const m = Math.floor(remaining / 60000)
  const s = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="session-warning">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>Your session will expire in {m}:{s.toString().padStart(2, '0')}</span>
    </div>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}