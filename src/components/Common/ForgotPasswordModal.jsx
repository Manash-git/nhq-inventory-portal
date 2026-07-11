import { useEffect, useRef } from 'react'
import Modal from './Modal'

export default function ForgotPasswordModal({ isOpen, onClose, triggerRef }) {
  const okRef = useRef(null)

  useEffect(() => {
    if (isOpen && okRef.current) {
      okRef.current.focus()
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
    requestAnimationFrame(() => triggerRef?.current?.focus())
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width="420px">
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(99,102,241,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          Forgot Password
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Please contact your administrator to reset your password.
        </p>
        <button
          ref={okRef}
          className="btn btn-primary"
          onClick={handleClose}
          style={{ marginTop: 24, minWidth: 100 }}
        >
          OK
        </button>
      </div>
    </Modal>
  )
}
