import './About.css'

export default function About() {
  return (
    <div className="about-page animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">About</h1>
          <p className="page-subtitle">About the Inventory Management Portal</p>
        </div>
      </div>

      <div className="about-grid">
        <div className="card about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          </div>
          <h3>About the Portal</h3>
          <p>
            The NHQ Inventory Management Portal is a comprehensive web-based solution designed
            to streamline the tracking and management of hardware assets across the organization.
            Built with modern web technologies, this portal provides real-time visibility into
            inventory levels, product details, and historical activity logs.
          </p>
          <p>
            The system supports role-based access control with three tiers: Super User, Admin,
            and Read-Only, ensuring that only authorized personnel can make changes while
            maintaining a complete audit trail of all actions.
          </p>
        </div>

        <div className="card about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>Key Features</h3>
          <ul className="about-features">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Real-time inventory tracking with quantity management
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Role-based access control (Super User, Admin, Read-Only)
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Complete audit trail with activity logs and timeline
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Export inventory to Excel format
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Archive management for discontinued products
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Dual theme support with dark mode
            </li>
          </ul>
        </div>

        <div className="card about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3>Frequently Asked Questions</h3>
          <div className="about-faq">
            <div className="faq-item">
              <h4>How do I add a new product?</h4>
              <p>Navigate to the Home page and click the "Add Product" button. Fill in the required fields including Product Description, Part Number, Category, and Quantity. Image URL is optional.</p>
            </div>
            <div className="faq-item">
              <h4>Can I recover a deleted product?</h4>
              <p>No, deletions are permanent. However, instead of deleting, you can archive products with quantity 1 to keep them in the system.</p>
            </div>
            <div className="faq-item">
              <h4>What is the difference between users?</h4>
              <p><strong>Super User</strong> has full access including user management. <strong>Admin</strong> can add, edit, delete, archive, and export. <strong>Read-Only</strong> users can only view the inventory.</p>
            </div>
            <div className="faq-item">
              <h4>How do I export the inventory?</h4>
              <p>Super User and Admin users will see an "Export" button on the Home page. Click it to download the current inventory as an Excel file.</p>
            </div>
            <div className="faq-item">
              <h4>How secure is my data?</h4>
              <p>The portal uses Supabase for backend services with Row Level Security. Passwords are stored securely, and accounts lock after 3 failed login attempts for 10 minutes.</p>
            </div>
          </div>
        </div>

        <div className="card about-card about-contact-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h3>Developer Information</h3>
          <div className="about-developer">
            <div className="developer-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="developer-details">
              <h4>Manash Kumar Mondal</h4>
              <div className="developer-contact">
                <a href="mailto:manash@nhqbd.com" className="developer-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  manash@nhqbd.com
                </a>
                <span className="developer-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  01332814434
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <p>Company: NHQ Distributions Pvt. Ltd.</p>
            <p style={{ marginTop: 4 }}>Location: Middle Badda, Bir Uttam Rafiqul Islam Avenue, Azahar Comfort Complex (Level 14/C), 130/A Progati Sarani, Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>
    </div>
  )
}