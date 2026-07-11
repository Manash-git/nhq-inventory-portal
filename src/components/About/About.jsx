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
              <h4>Archive & Restore</h4>
              <p>Archive discontinued products instead of deleting them. Your active inventory stays clean, and archived items can be restored with their full record, including history and details.</p>
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
              <p>Admins can add, edit, delete, archive, restore, and export inventory. They can also view all activity logs and login history. Read-Only users can view the inventory list, access charts, and see their own activity logs, but cannot make any changes or export data.</p>
            </div>
            <div className="faq-item">
              <h4>Can I recover a deleted product?</h4>
              <p>No, deletions are permanent and cannot be undone. Instead of deleting a product with quantity 1, use the Archive option. Archived products are hidden from the main inventory but can be viewed and restored from the History page at any time.</p>
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