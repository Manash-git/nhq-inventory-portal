-- ============================================
-- NHQ Inventory Portal - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS TABLE (replaces hardcoded credentials)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
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
  inventory_box_serial TEXT,
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
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if upgrading from older schema
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_box_serial TEXT;

-- 4. LOGIN HISTORY (detailed auth events)
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  username TEXT NOT NULL,
  user_role TEXT NOT NULL,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  login_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_time TIMESTAMPTZ,
  session_duration INT DEFAULT 0,
  failure_reason TEXT
);

-- 5. SESSIONS (for server-side session tracking)
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
CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_changes ON activity_logs USING gin(changes);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean re-run
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Super user can insert users" ON users;
DROP POLICY IF EXISTS "Super user can update users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "All authenticated users can read products" ON products;
DROP POLICY IF EXISTS "Super user and admin can insert products" ON products;
DROP POLICY IF EXISTS "Super user and admin can update products" ON products;
DROP POLICY IF EXISTS "Super user and admin can delete products" ON products;
DROP POLICY IF EXISTS "Super user can read all logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can read admin/read_only logs" ON activity_logs;
DROP POLICY IF EXISTS "Read only can read own logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

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
INSERT INTO users (username, password, role)
VALUES ('manash', crypt('Man@123', gen_salt('bf')), 'super_user')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create a new user (super user only, bypass RLS)
CREATE OR REPLACE FUNCTION create_user(
  p_admin_id UUID,
  p_username TEXT,
  p_password TEXT,
  p_role TEXT
) RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_new_user users%ROWTYPE;
BEGIN
  SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
  IF NOT FOUND OR v_admin_role != 'super_user' THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE username = lower(p_username)) THEN
    RAISE EXCEPTION 'Username already exists.';
  END IF;
  INSERT INTO users (username, password, role)
  VALUES (lower(p_username), crypt(p_password, gen_salt('bf')), p_role)
  RETURNING * INTO v_new_user;
  RETURN jsonb_build_object(
    'id', v_new_user.id,
    'username', v_new_user.username,
    'role', v_new_user.role,
    'created_at', v_new_user.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate session token (bypass RLS)
CREATE OR REPLACE FUNCTION validate_session(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_session sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM sessions WHERE token = p_token AND is_valid = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  IF v_session.expires_at <= now() THEN
    UPDATE sessions SET is_valid = false WHERE id = v_session.id;
    RETURN jsonb_build_object('valid', false, 'expired', true);
  END IF;
  RETURN jsonb_build_object('valid', true, 'user_id', v_session.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get paginated activity logs with filters (bypass RLS)
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 50,
  p_action TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_items JSONB;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  
  SELECT count(*) INTO v_total FROM activity_logs l
  WHERE (p_action IS NULL OR l.action = p_action)
    AND (p_search IS NULL OR l.description ILIKE '%' || p_search || '%' OR l.user_name ILIKE '%' || p_search || '%')
    AND (p_user_id IS NULL OR l.user_id = p_user_id)
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to);
  
  SELECT jsonb_agg(sub) INTO v_items FROM (
    SELECT l.*, row_to_json(p.*) AS product
    FROM activity_logs l
    LEFT JOIN products p ON l.product_id = p.id
    WHERE (p_action IS NULL OR l.action = p_action)
      AND (p_search IS NULL OR l.description ILIKE '%' || p_search || '%' OR l.user_name ILIKE '%' || p_search || '%')
      AND (p_user_id IS NULL OR l.user_id = p_user_id)
      AND (p_date_from IS NULL OR l.created_at >= p_date_from)
      AND (p_date_to IS NULL OR l.created_at <= p_date_to)
    ORDER BY l.created_at DESC
    LIMIT p_per_page OFFSET v_offset
  ) sub;
  
  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'pages', ceil(v_total::numeric / p_per_page)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get paginated login history with filters (bypass RLS)
CREATE OR REPLACE FUNCTION get_login_history(
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 50,
  p_status TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_items JSONB;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  
  SELECT count(*) INTO v_total FROM login_history l
  WHERE (p_status IS NULL OR l.status = p_status)
    AND (p_user_id IS NULL OR l.user_id = p_user_id)
    AND (p_date_from IS NULL OR l.login_time >= p_date_from)
    AND (p_date_to IS NULL OR l.login_time <= p_date_to);
  
  SELECT jsonb_agg(sub) INTO v_items FROM (
    SELECT * FROM login_history l
    WHERE (p_status IS NULL OR l.status = p_status)
      AND (p_user_id IS NULL OR l.user_id = p_user_id)
      AND (p_date_from IS NULL OR l.login_time >= p_date_from)
      AND (p_date_to IS NULL OR l.login_time <= p_date_to)
    ORDER BY l.login_time DESC
    LIMIT p_per_page OFFSET v_offset
  ) sub;
  
  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'pages', ceil(v_total::numeric / p_per_page)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  
  SELECT username, role INTO v_user_name, v_user_role
  FROM users WHERE id = v_user_id;
  
  INSERT INTO activity_logs (product_id, action, description, user_id, user_name, user_role)
  VALUES (p_product_id, p_action, p_description, v_user_id, v_user_name, v_user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change own password (bypass RLS)
CREATE OR REPLACE FUNCTION change_own_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_stored TEXT;
BEGIN
  SELECT password INTO v_stored FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
  IF v_stored != crypt(p_current_password, v_stored) THEN
    RAISE EXCEPTION 'Current password is incorrect.';
  END IF;
  UPDATE users SET password = crypt(p_new_password, gen_salt('bf')), last_password_change = now()
  WHERE id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset any user's password (super user only, bypass RLS)
CREATE OR REPLACE FUNCTION reset_user_password(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
  IF NOT FOUND OR v_admin_role != 'super_user' THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;
  UPDATE users SET password = crypt(p_new_password, gen_salt('bf')), last_password_change = now(),
    failed_attempts = 0, locked_until = NULL
  WHERE id = p_target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users (super user only, bypass RLS)
CREATE OR REPLACE FUNCTION get_all_users(p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_result JSONB;
BEGIN
  SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
  IF NOT FOUND OR v_admin_role != 'super_user' THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'username', username,
    'role', role,
    'is_active', is_active,
    'created_at', created_at,
    'last_password_change', last_password_change,
    'failed_attempts', failed_attempts,
    'locked_until', locked_until
  ) ORDER BY created_at ASC) INTO v_result FROM users;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Logout function: invalidates session and logs activity, updates login_history (bypass RLS)
CREATE OR REPLACE FUNCTION logout_user(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_session sessions%ROWTYPE;
  v_lh_id UUID;
BEGIN
  SELECT * INTO v_session FROM sessions WHERE token = p_token AND is_valid = true;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  UPDATE sessions SET is_valid = false WHERE token = p_token;
  -- Update latest login_history record for this user
  SELECT id INTO v_lh_id FROM login_history
    WHERE user_id = v_session.user_id AND status = 'success' AND logout_time IS NULL
    ORDER BY login_time DESC LIMIT 1;
  IF FOUND THEN
    UPDATE login_history SET logout_time = now(),
      session_duration = extract(epoch from (now() - login_time))::int
    WHERE id = v_lh_id;
  END IF;
  INSERT INTO activity_logs (user_id, action, description, user_name, user_role)
  SELECT v_session.user_id, 'logout', u.username || ' (' || u.role || ') logged out',
    u.username, u.role
  FROM users u WHERE u.id = v_session.user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate a user (super user only, bypass RLS)
CREATE OR REPLACE FUNCTION deactivate_user(
  p_admin_id UUID,
  p_target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
  IF NOT FOUND OR v_admin_role != 'super_user' THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;
  IF p_admin_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;
  UPDATE users SET is_active = false WHERE id = p_target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Login function: validates password hash, manages lockout, creates session (bypass RLS)
CREATE OR REPLACE FUNCTION login_user(
  p_username TEXT,
  p_password TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user users%ROWTYPE;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_remaining INT;
  v_login_id UUID;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = lower(p_username) AND is_active = true;
  
  IF NOT FOUND THEN
    INSERT INTO login_history (username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (lower(p_username), 'unknown', p_ip_address, p_browser, p_os, p_device, 'failed', 'Invalid credentials');
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials.');
  END IF;
  
  -- Check if locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    v_remaining := ceil(extract(epoch from (v_user.locked_until - now())) / 60);
    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (v_user.id, v_user.username, v_user.role, p_ip_address, p_browser, p_os, p_device, 'failed', 'Account locked');
    RETURN jsonb_build_object(
      'success', false, 'locked', true,
      'error', format('Account locked. Try again in %s minute(s).', v_remaining),
      'remaining_attempts', 0
    );
  END IF;
  
  -- Verify password hash
  IF v_user.password = crypt(p_password, v_user.password) THEN
    -- Success: reset counter, create session, log activity
    UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
    
    v_token := encode(gen_random_bytes(24), 'hex');
    v_expires_at := now() + interval '1 hour';
    
    INSERT INTO sessions (user_id, token, expires_at) VALUES (v_user.id, v_token, v_expires_at);
    
    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status)
    VALUES (v_user.id, v_user.username, v_user.role, p_ip_address, p_browser, p_os, p_device, 'success')
    RETURNING id INTO v_login_id;
    
    INSERT INTO activity_logs (user_id, user_name, user_role, action, description)
    VALUES (v_user.id, v_user.username, v_user.role, 'login',
      format('%s (%s) logged in', v_user.username, v_user.role));
    
    RETURN jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'role', v_user.role
      ),
      'token', v_token,
      'expires_at', v_expires_at,
      'login_id', v_login_id
    );
  ELSE
    -- Failed attempt
    v_remaining := 2 - v_user.failed_attempts;
    
    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (v_user.id, v_user.username, v_user.role, p_ip_address, p_browser, p_os, p_device, 'failed', 'Wrong password');
    
    IF v_user.failed_attempts >= 2 THEN
      UPDATE users SET failed_attempts = failed_attempts + 1,
        locked_until = now() + interval '10 minutes'
      WHERE id = v_user.id;
      RETURN jsonb_build_object(
        'success', false, 'locked', true,
        'error', 'Account locked for 10 minutes due to too many failed attempts.',
        'remaining_attempts', 0
      );
    ELSE
      UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
      RETURN jsonb_build_object(
        'success', false, 'locked', false,
        'error', format('Invalid credentials. %s attempt(s) remaining.', v_remaining),
        'remaining_attempts', v_remaining
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;