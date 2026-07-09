-- ============================================
-- NHQ Inventory Portal - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USERS TABLE (replaces hardcoded credentials)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_user', 'admin', 'read_only')),
  is_active BOOLEAN DEFAULT true,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTS (inventory)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_description TEXT NOT NULL,
  part_number TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  image_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'add', 'edit', 'delete', 'archive', 'quantity_change', 'password_change', 'user_create', 'user_delete', 'password_reset', 'export')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SESSIONS (for server-side session tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_product ON activity_logs(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id OR role = 'super_user');

CREATE POLICY "Super user can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_user')
  );

CREATE POLICY "Super user can update users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_user')
  );

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Products table policies
CREATE POLICY "All authenticated users can read products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super user and admin can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin'))
  );

CREATE POLICY "Super user and admin can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin'))
  );

CREATE POLICY "Super user and admin can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin'))
  );

-- Activity logs policies
CREATE POLICY "Super user can read all logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_user')
  );

CREATE POLICY "Admin can read admin/read_only logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    AND user_role IN ('admin', 'read_only')
  );

CREATE POLICY "Read only can read own logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'read_only')
    AND user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can insert logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sessions table policies
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- SEED DATA: Initial Super User
-- ============================================
INSERT INTO users (username, password, display_name, role)
VALUES ('manash', 'Man@123', 'Manash Kumar Mondal', 'super_user')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_product_id UUID,
  p_action TEXT,
  p_description TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Get current user info from request headers (set by Supabase)
  v_user_id := auth.uid();
  
  SELECT display_name, role INTO v_user_name, v_user_role
  FROM users WHERE id = v_user_id;
  
  INSERT INTO activity_logs (product_id, action, description, user_id, user_name, user_role)
  VALUES (p_product_id, p_action, p_description, v_user_id, v_user_name, v_user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and update login attempts
CREATE OR REPLACE FUNCTION validate_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, display_name TEXT, role TEXT, is_locked BOOLEAN, remaining_attempts INT) AS $$
DECLARE
  v_user users%ROWTYPE;
  v_locked BOOLEAN := false;
  v_remaining INT := 3;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, false, 0;
    RETURN;
  END IF;
  
  -- Check if locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    RETURN QUERY SELECT v_user.id, v_user.display_name, v_user.role, true, 0;
    RETURN;
  END IF;
  
  -- Check password
  IF v_user.password = p_password THEN
    -- Reset failed attempts on success
    UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
    RETURN QUERY SELECT v_user.id, v_user.display_name, v_user.role, false, 3;
  ELSE
    -- Increment failed attempts
    v_remaining := 2 - v_user.failed_attempts;
    IF v_user.failed_attempts >= 2 THEN
      UPDATE users SET failed_attempts = failed_attempts + 1, locked_until = now() + interval '10 minutes' WHERE id = v_user.id;
      RETURN QUERY SELECT v_user.id, v_user.display_name, v_user.role, true, 0;
    ELSE
      UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
      RETURN QUERY SELECT v_user.id, v_user.display_name, v_user.role, false, v_remaining;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;