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
            The system supports role-based access control with Admin and Read-Only roles,
            ensuring that only authorized personnel can make changes while
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
          <div className="about-feature-list">
            <div className="about-feature-item">
              <h4>Real-Time Inventory Tracking</h4>
              <p>Know your stock levels at a glance. Every add, edit, or quantity update reflects instantly across all active sessions. Your team always sees the latest numbers without refreshing the page.</p>
            </div>
            <div className="about-feature-item">
              <h4>Role-Based Access Control</h4>
              <p>Assign team members as Admin or Read-Only with clear permissions. Admins can add, edit, delete, archive, and export inventory. Read-Only users can view the catalog and access activity logs.</p>
            </div>
            <div className="about-feature-item">
              <h4>Complete Audit Trail</h4>
              <p>Every action is automatically logged with timestamps, user details, and before-and-after values. Review changes through the Activity Log, Login History, or the visual Timeline heatmap.</p>
            </div>
            <div className="about-feature-item">
              <h4>Powerful Search & Filters</h4>
              <p>Find any hardware item in seconds. Search across descriptions, part numbers, or serials. Narrow results by team, date range, or quantity range to quickly locate what you need.</p>
            </div>
            <div className="about-feature-item">
              <h4>Quantity & Stock Management</h4>
              <p>Adjust stock levels inline with plus and minus controls. The system records every quantity change as a transaction, giving you a complete history of inventory movement.</p>
            </div>
            <div className="about-feature-item">
              <h4>Export to Excel & PDF</h4>
              <p>Download your inventory as a formatted Excel spreadsheet or a professional PDF report with clean tables, company branding, and summary totals. Perfect for sharing with stakeholders.</p>
            </div>
            <div className="about-feature-item">
              <h4>Archive</h4>
              <p>Archive discontinued products instead of deleting them. Your active inventory stays clean.</p>
            </div>
            <div className="about-feature-item">
              <h4>Visual Dashboard Charts</h4>
              <p>Get a bird's-eye view of your inventory with bar charts showing quantity distribution by team and the top stocked hardware items. Charts update in real time as data changes.</p>
            </div>
            <div className="about-feature-item">
              <h4>Multi-Theme Support</h4>
              <p>Choose from Midnight Blue, Dark Teal, or Deep Vintage Futuristic themes. Each comes with light and dark modes, so you can customize the look to match your preference.</p>
            </div>
          </div>
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
              <h4>How do I add a new hardware item?</h4>
              <p>Navigate to the Home page and click "New Hardware." Fill in the Hardware Description, Part Number, and Team. Quantity defaults to 1 but you can choose from preset values. Inventory Serial and Image URL are optional. Click "Add Hardware" to save — it appears in the list immediately.</p>
            </div>
            <div className="faq-item">
              <h4>What's the difference between Admin and Read-Only roles?</h4>
              <p>Admins can add, edit, delete, archive,and export inventory. They can also view all activity logs and login history. Read-Only users can view the inventory list, access charts, and see their own activity logs, but cannot make any changes or export data.</p>
            </div>
            <div className="faq-item">
              <h4>Can I recover a deleted product?</h4>
              <p>No, deletions are permanent and cannot be undone. Instead of deleting a product with quantity 1, use the Archive option. Archived products are hidden from the main inventory but can be viewed.</p>
            </div>
            <div className="faq-item">
              <h4>How do I export the inventory?</h4>
              <p>Click the Export button on the Home page. You can choose between "Export as Excel (.xls)" for a spreadsheet and "Export as Report PDF" for a formatted landscape report with summary totals. All export actions are recorded in the activity logs.</p>
            </div>
            <div className="faq-item">
              <h4>How does the session timeout work?</h4>
              <p>Sessions expire after 60 minutes of inactivity. You'll see a countdown warning when less than 5 minutes remain. If you close all browser tabs and return within 5 minutes, your session is preserved. After expiry, you'll be redirected to the login page.</p>
            </div>
            <div className="faq-item">
              <h4>What happens if I enter the wrong password?</h4>
              <p>After 3 consecutive failed login attempts, your account is locked for 10 minutes. A message will show you how many attempts you have left and how long the lockout lasts. After the lockout period, you can try again. Successful logins reset the attempt counter.</p>
            </div>
            <div className="faq-item">
              <h4>How do I change my password?</h4>
              <p>Click your name in the top-right corner and select "Change Password." You'll need to enter your current password, then your new password twice for confirmation. Your session stays active after the change.</p>
            </div>
            <div className="faq-item">
              <h4>How secure is the portal?</h4>
              <p>Passwords are hashed using bcrypt encryption before storage. All data access goes through permission-checked database functions. Sessions use cryptographically random tokens. The database has Row-Level Security enabled on all tables. Activity logs provide a complete audit trail of every action.</p>
            </div>
            <div className="faq-item">
              <h4>Can I use the portal on my phone?</h4>
              <p>Yes. The interface is responsive and works on mobile browsers. The navigation collapses into a hamburger menu on smaller screens, and all key features — including adding, editing, and searching inventory — are accessible from your device.</p>
            </div>
            <div className="faq-item">
              <h4>Who do I contact for support?</h4>
              <p>For technical support or feature requests, reach out to Manash Kumar Mondal at manash@nhqbd.com or call 01332814434. NHQ Distributions Pvt. Ltd. is located in Middle Badda, Dhaka, Bangladesh.</p>
            </div>
          </div>
        </div>

        <div className="card about-card about-contact-card">
          <div className="developer-profile-layout">
            <div className="developer-profile-main">
              <div className="developer-profile-header">
                <div className="developer-avatar-circle">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="developer-name">Manash Kumar Mondal</h3>
                  <p className="developer-role">Post-Sales Engineer and Vibe Coder</p>
                </div>
              </div>

              <div className="developer-contact-grid">
                <div className="developer-contact-chip">
                  <div className="developer-chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="developer-chip-label">Email</p>
                    <a href="mailto:manash@nhqbd.com" className="developer-chip-value">manash@nhqbd.com</a>
                  </div>
                </div>
                <div className="developer-contact-chip">
                  <div className="developer-chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="developer-chip-label">Phone</p>
                    <a href="tel:01332814434" className="developer-chip-value">01332814434</a>
                  </div>
                </div>
              </div>

              <div className="developer-divider" />

              <div className="developer-actions">
                <a href="https://www.linkedin.com/in/manash-mondal/" target="_blank" rel="noopener noreferrer" className="developer-btn developer-btn-linkedin">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
                <a href="https://github.com/Manash-git" target="_blank" rel="noopener noreferrer" className="developer-btn developer-btn-github">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </div>
            </div>

            <div className="developer-graphic" aria-hidden="true">
              <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="20" width="340" height="280" rx="16" stroke="#E67E22" strokeWidth="1.5" opacity="0.12" />
                <rect x="50" y="50" width="90" height="8" rx="4" fill="#E67E22" opacity="0.12" />
                <rect x="50" y="70" width="120" height="8" rx="4" fill="#E67E22" opacity="0.08" />
                <rect x="50" y="90" width="60" height="8" rx="4" fill="#E67E22" opacity="0.10" />
                <rect x="50" y="130" width="160" height="8" rx="4" fill="#E67E22" opacity="0.12" />
                <rect x="50" y="150" width="80" height="8" rx="4" fill="#E67E22" opacity="0.08" />
                <rect x="50" y="170" width="200" height="8" rx="4" fill="#E67E22" opacity="0.10" />
                <rect x="50" y="210" width="130" height="8" rx="4" fill="#E67E22" opacity="0.12" />
                <rect x="50" y="230" width="100" height="8" rx="4" fill="#E67E22" opacity="0.08" />
                <rect x="50" y="250" width="180" height="8" rx="4" fill="#E67E22" opacity="0.10" />
                <path d="M300 260 L320 240 L340 260" stroke="#E67E22" strokeWidth="2" opacity="0.10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M280 240 L300 220 L320 240" stroke="#E67E22" strokeWidth="2" opacity="0.08" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="320" cy="240" r="4" fill="#E67E22" opacity="0.12" />
                <circle cx="300" cy="260" r="4" fill="#E67E22" opacity="0.10" />
                <circle cx="280" cy="240" r="4" fill="#E67E22" opacity="0.08" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}