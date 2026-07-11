import './Footer.css'

export default function Footer() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const shortYear = String(year).slice(-2)
  const version = `${shortYear}.${month}`

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copyright">
          &copy; {year} <strong>NHQ Distributions Pvt. Ltd.</strong> All Rights Reserved.
        </span>
        <span className="footer-version">Version - {version}</span>
      </div>
    </footer>
  )
}
