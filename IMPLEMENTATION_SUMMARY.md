# NHQ Inventory Portal - Complete Implementation Summary

## 🎯 Project Overview
A full-stack inventory management portal with role-based access control, real-time updates, session management, and GitHub-style contribution heatmap.

## 🏗️ Architecture

### Database Schema (Supabase PostgreSQL)
```
users              - Authentication & authorization
products           - Inventory items (with archive support)
activity_logs      - Complete audit trail
sessions           - Server-side session tracking
```

### Key Tables
1. **users** - username, password, role (super_user/admin/read_only), is_active, failed_attempts, locked_until
2. **products** - product_description, part_number, category, quantity, image_url, is_archived, archived_at, created_by
3. **activity_logs** - product_id, user_id, user_name, user_role, action, description, created_at
4. **sessions** - user_id, token, expires_at, is_valid

### Roles & Permissions
| Feature | Super User | Admin | Read-Only |
|---------|-----------|-------|-----------|
| View Inventory | ✅ | ✅ | ✅ |
| Add/Edit/Delete Products | ✅ | ✅ | ❌ |
| Quantity +/- | ✅ | ✅ | ❌ |
| Archive Products | ✅ | ✅ | ❌ |
| Export Excel | ✅ | ✅ | ❌ |
| View All Logs | ✅ | ❌ | ❌ |
| View Admin/Read-Only Logs | ✅ | ✅ | ❌ |
| View Own Logs | ✅ | ✅ | ✅ |
| Manage Users (Create/Delete/Reset Pwd) | ✅ | ❌ | ❌ |
| Change Own Password | ✅ | ✅ | ✅ |

---

## 🔐 Session Management
- **1-hour timeout** from login (hard limit, even if active)
- **5-minute warning** before expiry
- **Tab close detection** with 5-minute grace period
- **Multi-tab sync** via BroadcastChannel API
- **Auto-logout** with redirect to login + message
- **Account lockout**: 3 failed attempts → 10 min lock

---

## 📊 GitHub-Style Contribution Heatmap
- Year-long activity visualization
- Month labels (Jan-Dec), Day labels (Mon-Sun)
- 5 intensity levels (cyan shades per theme)
- Hover tooltip with date, count, and action details
- "78 actions in the last year" summary

---

## 🛠️ Deployment Steps

### 1. Supabase Setup
```bash
# Go to https://supabase.com → New Project
# Name: nhq-inventory
# Save the database password
```

**Run SQL Schema** in Supabase SQL Editor:
- Copy contents of `supabase-schema.sql` and execute
- This creates all tables, indexes, RLS policies, and seeds the Super User:
  - **Username:** `manash`
  - **Password:** `Man@123`
  - **Role:** Super User

**Get API Keys** from Settings → API:
- Project URL (e.g., `https://xxxxx.supabase.co`)
- anon/public key

### 2. Local Development
```bash
# Clone repo
git clone <your-repo-url>
cd nhq-inventory-portal

# Create .env file
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env

# Install & run
npm install
npm run dev
```

### 3. GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nhq-inventory-portal.git
git push -u origin main
```

### 4. Netlify Deployment
1. Go to [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project"
2. Connect GitHub → Select `nhq-inventory-portal`
3. Build settings (auto-detected from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Environment variables** (Site settings → Environment variables):
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy site**

### 5. Custom Domain (Optional)
- Site settings → Domain management → Add custom domain
- Configure DNS per Netlify instructions

---

## 🔄 Continuous Deployment
- Push to `main` branch → Netlify auto-builds & deploys
- Build time: ~30-60 seconds
- Preview deploys for PRs

---

## 📁 Key Files Structure
```
src/
├── contexts/
│   ├── AuthContext.jsx      # Authentication & user management
│   ├── SessionContext.jsx   # Session timeout, tab tracking
│   ├── ThemeContext.jsx     # Theme switching (NHQBD/Cohesity + dark)
│   └── NotificationContext.jsx # Toast notifications
├── components/
│   ├── Home/Home.jsx        # Inventory CRUD, charts, export
│   ├── History/History.jsx  # Activity logs, archived products
│   ├── History/ContributionGraph.jsx # GitHub-style heatmap
│   ├── Login/Login.jsx      # Login with lockout UI
│   └── Layout/Navbar.jsx    # Navigation, user menu, user mgmt
├── utils/
│   ├── supabase.js          # Supabase client + role helpers
│   └── helpers.js           # Date formatting, etc.
└── styles/
    ├── global.css           # Global styles, CSS variables
    └── themes.js            # Theme definitions
```

---

## 🎨 Themes
- **NHQBD** (default) - Blue primary
- **Cohesity** - Teal primary
- Both support Light/Dark mode
- Persisted in localStorage

---

## 🔑 Default Login
After deploying and running the SQL schema:
- **Username:** `manash`
- **Password:** `Man@123`
- **Role:** Super User

Use **Manage Users** in navbar dropdown to create Admin/Read-Only accounts.

---

## 📋 Supabase RLS Policies Summary
- Users: Super users manage all; users read own data
- Products: All authenticated read; Super/Admin write
- Activity Logs: Super sees all; Admin sees Admin/Read-Only; Read-Only sees own
- Sessions: Users manage own sessions

---

## ✅ Verification Checklist
- [ ] Supabase project created
- [ ] SQL schema executed (tables + seed user)
- [ ] Environment variables set in Netlify
- [ ] GitHub repo connected to Netlify
- [ ] First deploy successful
- [ ] Can login as `manash` / `Man@123`
- [ ] Can create Admin/Read-Only users
- [ ] Inventory CRUD works per role
- [ ] Session timeout works (test 1hr or reduce for testing)
- [ ] Heatmap shows activity
- [ ] Export Excel works (Super/Admin)
- [ ] Theme switching works