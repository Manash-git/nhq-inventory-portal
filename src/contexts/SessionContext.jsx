import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'

const SESSION_DURATION = 60 * 60 * 1000
const WARNING_BEFORE = 5 * 60 * 1000
const GRACE_PERIOD = 5 * 60 * 1000
const HEARTBEAT_INTERVAL = 8000
const STALE_TIMEOUT = 25000

const KEYS = {
  EXPIRY: 'nhq-session-expiry',
  ALL_CLOSED: 'nhq-all-tabs-closed',
}

const SessionContext = createContext()

function generateTabId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function SessionProvider({ children }) {
  const { user, logout } = useAuth()
  const { addToast } = useNotification()

  const [remaining, setRemaining] = useState(null)
  const [warning, setWarning] = useState(false)

  const tabId = useRef(generateTabId())
  const channel = useRef(null)
  const tabs = useRef(new Set())
  const warned = useRef(false)
  const expired = useRef(false)

  const cleanup = useCallback(() => {
    try { channel.current?.close() } catch {}
    channel.current = null
  }, [])

  const doLogout = useCallback((msg) => {
    if (expired.current) return
    expired.current = true
    cleanup()
    localStorage.removeItem(KEYS.EXPIRY)
    localStorage.removeItem(KEYS.ALL_CLOSED)
    if (msg) addToast(msg, 'warning')
    logout()
  }, [cleanup, addToast, logout])

  useEffect(() => {
    if (!user) {
      cleanup()
      setRemaining(null)
      setWarning(false)
      warned.current = false
      expired.current = false
      return
    }

    const myId = tabId.current
    expired.current = false
    warned.current = false

    const bc = new BroadcastChannel('nhq-session')
    channel.current = bc

    bc.postMessage({ type: 'TAB_OPEN', id: myId })

    bc.onmessage = (e) => {
      const { type, id } = e.data
      if (type === 'TAB_OPEN' || type === 'HEARTBEAT') {
        tabs.current.add(id)
        localStorage.removeItem(KEYS.ALL_CLOSED)
      }
      if (type === 'TAB_CLOSE') {
        tabs.current.delete(id)
      }
      if (type === 'SESSION_GONE') {
        doLogout('Your session has expired. Please log in again.')
      }
    }

    let expiry = parseInt(localStorage.getItem(KEYS.EXPIRY), 10)
    if (!expiry || expiry <= Date.now()) {
      expiry = Date.now() + SESSION_DURATION
      localStorage.setItem(KEYS.EXPIRY, expiry)
    }

    const closedAt = localStorage.getItem(KEYS.ALL_CLOSED)
    if (closedAt) {
      const elapsed = Date.now() - parseInt(closedAt, 10)
      if (elapsed < GRACE_PERIOD) {
        localStorage.removeItem(KEYS.ALL_CLOSED)
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
      try { bc.postMessage({ type: 'HEARTBEAT', id: myId }) } catch {}
    }, HEARTBEAT_INTERVAL)

    const staleCheck = setInterval(() => {
      bc.postMessage({ type: 'STALE_CHECK', id: myId })
    }, STALE_TIMEOUT)

    const handleBeforeUnload = () => {
      try {
        bc.postMessage({ type: 'TAB_CLOSE', id: myId })
        tabs.current.delete(myId)
        if (tabs.current.size === 0) {
          localStorage.setItem(KEYS.ALL_CLOSED, Date.now().toString())
        }
      } catch {}
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(tick)
      clearInterval(heartbeat)
      clearInterval(staleCheck)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
      cleanup()
    }
  }, [user, doLogout, cleanup])

  return (
    <SessionContext.Provider value={{ remaining, warning }}>
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
