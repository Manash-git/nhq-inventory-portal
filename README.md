# NHQ Hardware Inventory Management Portal

**Company:** NHQ Distributions Pvt. Ltd.
**Developer:** Manash Kumar Mondal

## Overview

A modern, secure web portal for managing office hardware inventory. Features role-based access, real-time tracking, activity logs, Excel import/export, and beautiful theming.

## Features

- **Login Security:** 3-user roles (Root, Admin, NHQ) with account lockout after 3 failed attempts
- **Inventory CRUD:** Add, edit, delete, archive products with image upload
- **Quantity Management:** Increment/decrement stock levels
- **Excel Export/Import:** Download inventory as Excel, bulk import from Excel
- **Activity Logs:** Full audit trail with GitHub-style contribution timeline
- **Archived Products:** View and manage archived inventory
- **Role Management:** Root user can reset admin/nhq passwords
- **Dual Themes:** Cohesity-inspired and NHQBD-inspired themes with dark mode
- **Responsive:** Works on desktop and mobile

## Quick Start

### 1. Set up Supabase (Backend)

1. Go to https://supabase.com and create a free account
2. Create a new project (choose any name, set a secure database password)
3. Once created, go to **Project Settings > API** and copy:
   - `Project URL` (looks like `https://xxx.supabase.co`)
   - `anon public key` (starts with `eyJ...`)
4. Go to **SQL Editor** in Supabase dashboard, paste the contents of `supabase-schema.sql` file, and run it
5. Go to **Storage** > **Create bucket** > name it `product-images` > toggle **Public bucket** ON

### 2. Configure the App

1. Open the project folder
2. Rename `.env.example` to `.env`
3. Edit `.env` and paste your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install and Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Login Credentials

| User  | Username            | Password    | Permissions                  |
|-------|---------------------|-------------|------------------------------|
| Root  | manash@nhqbd.com    | Man&Mond71  | Full access, reset passwords |
| Admin | admin               | Admin@321%  | Add/Edit/Delete/Export       |
| NHQ   | nhq                 | Nhq@321%    | Read-only                    |

### 5. Import Initial Data

1. Login as **Root** or **Admin**
2. Go to **Home** page
3. Click **Import** button
4. Select your Excel file (`Veritas_Inventory_Merged.xlsx`)
5. Click Import

The Excel should have these columns:
- `Product Description`
- `Part Number (PN)`
- `Category`
- `Quantity`

---

## Root Password Reset

If you forget the root password, on the login page:

1. Click **"Forgot password?"**
2. Click **Continue**
3. **First time:** Set a security question and answer
4. **Later:** Enter your answer to verify, then set a new password

---

## Deploy to Netlify (with GitHub)

Follow these steps exactly:

### Step 1: Create a GitHub Repository

1. Go to https://github.com and sign in (create a free account if you don't have one)
2. Click the **+** icon (top right) > **New repository**
3. Repository name: `nhq-inventory` (or any name you like)
4. Keep it **Public** or **Private** (your choice)
5. Click **Create repository**
6. On the next page, you'll see commands to push an existing repository

### Step 2: Push Your Code to GitHub

Open **Command Prompt** or **PowerShell** on your computer and run:

```bash
# Go to your project folder
cd "C:\Users\Manash\Desktop\Inventory web project\Portal web project"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repo as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nhq-inventory.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANT:** Before pushing, make sure `.env` is in `.gitignore` (it already is). Your Supabase keys should NOT be committed to GitHub. You'll add them directly in Netlify.

### Step 3: Deploy on Netlify

1. Go to https://netlify.com and sign in (or create free account)
2. Click **"Add new site"** > **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Find and select your `nhq-inventory` repository
6. In **Build settings**:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
7. Click **"Show advanced"** > **"Environment variables"**
8. Add these two variables:
   - **Key:** `VITE_SUPABASE_URL` → **Value:** (your Supabase project URL)
   - **Key:** `VITE_SUPABASE_ANON_KEY` → **Value:** (your Supabase anon key)
9. Click **"Deploy site"**

Wait 1-2 minutes for deployment to finish.

### Step 4: Your Site is Live!

Netlify will give you a URL like `https://random-name-123456.netlify.app`

You can:
- Click the URL to open your portal
- Go to **Site settings** > **Change site name** to set a custom name like `nhq-inventory`
- In **Domain settings**, add your own custom domain if you have one

### Step 5: Future Updates

When you make changes to your code:

```bash
# Add your changes
git add .
git commit -m "Describe what you changed"
git push
```

Netlify will automatically rebuild and deploy! 🎉

---

## Tech Stack

- **Frontend:** React 19 + Vite 8
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Charts:** Recharts
- **Excel:** SheetJS (xlsx)
- **Icons:** Lucide React
- **Deployment:** Netlify

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Login/          # Login page with security
│   │   ├── Home/           # Inventory, CRUD, chart, export
│   │   ├── History/        # Activity logs, timeline, archived
│   │   ├── About/          # About page with developer info
│   │   ├── Common/         # Modal, ProtectedRoute, SearchFilter
│   │   └── Layout/         # Navbar with theme/user menu
│   ├── contexts/           # Auth, Theme, Notification providers
│   ├── styles/             # Theme definitions, global CSS
│   └── utils/              # Supabase client, helpers
├── scripts/                # Seed script for Excel import
├── supabase-schema.sql     # Database setup SQL
├── netlify.toml            # Netlify deployment config
└── .env.example            # Environment variables template
```

## Security Features

- **3 failed attempts** = 10-minute account lockout
- **Role-based access** (Root/Admin/NHQ)
- **Row Level Security** on Supabase tables
- **Password hashing** via Supabase Auth
- **Root password reset** via security questions
- **Environment variables** for sensitive keys
- No direct database access from frontend

## License

Internal use - NHQ Distributions Pvt. Ltd.
