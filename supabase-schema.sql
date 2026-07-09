-- ============================================
-- NHQ Inventory Portal - NORMALIZED SCHEMA v2
-- Run in Supabase SQL Editor
-- ============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. ROLES (normalized from text enum)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  priority INT NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO roles (name, description, priority, is_system) VALUES
  ('super_user', 'Full system access', 100, true),
  ('admin', 'Administrative access with restrictions', 50, true),
  ('read_only', 'View-only access', 10, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PERMISSIONS (granular, module-based)
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO permissions (code, name, module, description) VALUES
  -- User management
  ('users.create',       'Create Users',       'Users',   'Create new user accounts'),
  ('users.delete',       'Delete Users',       'Users',   'Deactivate/delete user accounts'),
  ('users.reset_password','Reset Passwords',   'Users',   'Reset any user password'),
  ('users.change_own_password','Change Own Password','Users','Change own password'),
  ('users.view',         'View Users',         'Users',   'View user list and details'),

  -- Inventory management
  ('inventory.create',   'Add Hardware',       'Inventory','Add new hardware items'),
  ('inventory.edit',     'Edit Hardware',       'Inventory','Edit existing hardware'),
  ('inventory.delete',   'Delete Hardware',     'Inventory','Delete hardware items'),
  ('inventory.archive',  'Archive Hardware',    'Inventory','Archive hardware items'),
  ('inventory.restore',  'Restore Hardware',    'Inventory','Restore archived hardware'),
  ('inventory.quantity.increase','Increase Quantity','Inventory','Increase hardware quantity'),
  ('inventory.quantity.decrease','Decrease Quantity','Inventory','Decrease hardware quantity'),
  ('inventory.view',     'View Inventory',      'Inventory','View inventory list'),

  -- Export
  ('export.excel',       'Export to Excel',     'Export',  'Export inventory to Excel'),
  ('export.pdf',         'Export to PDF',       'Export',  'Export inventory to PDF'),

  -- Logs (scoped by role visibility)
  ('logs.view.all',       'View All Logs',      'Logs',    'View all activity logs including super user'),
  ('logs.view.admin_readonly','View Admin/RO Logs','Logs','View admin and read-only logs'),
  ('logs.view.own',       'View Own Logs',      'Logs',    'View own activity logs')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. ROLE-PERMISSION MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Assign permissions: SUPER USER = everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_user'
ON CONFLICT DO NOTHING;

-- Assign permissions: ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.code IN (
  'inventory.create', 'inventory.edit', 'inventory.delete',
  'inventory.archive', 'inventory.restore',
  'inventory.quantity.increase', 'inventory.quantity.decrease',
  'inventory.view',
  'export.excel', 'export.pdf',
  'logs.view.admin_readonly',
  'users.change_own_password'
)
ON CONFLICT DO NOTHING;

-- Assign permissions: READ ONLY
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'read_only'
AND p.code IN (
  'inventory.view',
  'logs.view.own',
  'users.change_own_password'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CATEGORIES (normalized from text field)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories (name, description, sort_order) VALUES
  ('Backup',     'Backup appliance hardware and components',     1),
  ('System',     'System and infrastructure components',        2),
  ('Networking', 'Networking equipment and modules',            3),
  ('Data Center','Data center hardware and accessories',         4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. USERS (with role_id FK)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
ALTER TABLE users DROP COLUMN IF EXISTS display_name;

UPDATE users u SET role_id = r.id FROM roles r WHERE u.role = r.name AND u.role_id IS NULL;

-- ============================================
-- 6. PRODUCTS (with category_id FK, quantity moved to inventory_transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_description TEXT NOT NULL,
  part_number TEXT NOT NULL,
  category TEXT,
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
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_box_serial TEXT;
ALTER TABLE products ALTER COLUMN category SET DEFAULT '';
ALTER TABLE products ALTER COLUMN category DROP NOT NULL;

UPDATE products p SET category_id = c.id FROM categories c WHERE p.category = c.name AND p.category_id IS NULL;

-- Drop old text-based category index, add new FK index
DROP INDEX IF EXISTS idx_products_category;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ============================================
-- 7. PRODUCT IMAGES (multiple images per product)
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- ============================================
-- 8. INVENTORY TRANSACTIONS (quantity change audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('increase', 'decrease', 'set', 'initial')),
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  delta INT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_user ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON inventory_transactions(created_at DESC);

-- ============================================
-- 9. ACTIVITY LOGS (enhanced with target_type, target_id, metadata)
-- ============================================
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
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_users_role ON activity_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- 10. LOGIN HISTORY
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);

-- ============================================
-- 11. SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- ADDITIONAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- All access goes through SECURITY DEFINER RPCs,
-- but RLS provides defense-in-depth
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Drop old policies for clean re-run
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
DROP POLICY IF EXISTS "Users can read own logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "All authenticated can read roles" ON roles;
DROP POLICY IF EXISTS "All authenticated can read permissions" ON permissions;
DROP POLICY IF EXISTS "All authenticated can read role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "All authenticated can read categories" ON categories;
DROP POLICY IF EXISTS "All authenticated can read product_images" ON product_images;
DROP POLICY IF EXISTS "All authenticated can read inventory_transactions" ON inventory_transactions;

-- Users table policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super user can insert users" ON users
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_user'));
CREATE POLICY "Super user can update users" ON users
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_user'));
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Products table policies
CREATE POLICY "All authenticated users can read products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super user and admin can insert products" ON products
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin')));
CREATE POLICY "Super user and admin can update products" ON products
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin')));
CREATE POLICY "Super user and admin can delete products" ON products
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_user', 'admin')));

-- Activity logs policies
CREATE POLICY "Users can read own logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sessions policies
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Lookup table read-only policies (all authenticated users)
CREATE POLICY "All authenticated can read roles" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated can read permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated can read role_permissions" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated can read categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated can read product_images" ON product_images
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated can read inventory_transactions" ON inventory_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- SEED: SUPER USER (password: Man@123)
-- ============================================
INSERT INTO users (username, password, role, role_id)
SELECT 'manash', crypt('Man@123', gen_salt('bf')), 'super_user', r.id
FROM roles r WHERE r.name = 'super_user'
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: has_permission
-- ============================================
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN role_permissions rp ON u.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id AND p.code = p_permission_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: get_user_role_name
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  SELECT r.name INTO v_role_name
  FROM users u JOIN roles r ON u.role_id = r.id
  WHERE u.id = p_user_id;
  RETURN v_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: log_activity (internal)
-- ============================================
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_name TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  SELECT u.username, COALESCE(r.name, u.role) INTO v_user_name, v_user_role
  FROM users u LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.id = p_user_id;

  INSERT INTO activity_logs (
    user_id, user_name, user_role, action, description,
    target_type, target_id, changes, metadata
  ) VALUES (
    p_user_id, v_user_name, v_user_role, p_action, p_description,
    p_target_type, p_target_id, p_changes, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- LOGIN FUNCTION
-- ============================================
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
  v_role_name TEXT;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_remaining INT;
  v_login_id UUID;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = lower(p_username) AND is_active = true;

  IF NOT FOUND THEN
    INSERT INTO login_history (username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (lower(p_username), 'unknown', p_ip_address, p_browser, p_os, p_device, 'failed', 'Invalid credentials');
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials.');
  END IF;

  -- Get role name
  SELECT r.name INTO v_role_name FROM roles r WHERE r.id = v_user.role_id;

  -- Check if locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    v_remaining := ceil(extract(epoch from (v_user.locked_until - now())) / 60);
    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (v_user.id, v_user.username, v_role_name, p_ip_address, p_browser, p_os, p_device, 'failed', 'Account locked');
    RETURN jsonb_build_object('success', false, 'locked', true,
      'error', format('Account locked. Try again in %s minute(s).', v_remaining),
      'remaining_attempts', 0);
  END IF;

  -- Verify password hash
  IF v_user.password = crypt(p_password, v_user.password) THEN
    UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;

    v_token := encode(gen_random_bytes(24), 'hex');
    v_expires_at := now() + interval '1 hour';

    INSERT INTO sessions (user_id, token, expires_at) VALUES (v_user.id, v_token, v_expires_at);

    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status)
    VALUES (v_user.id, v_user.username, v_role_name, p_ip_address, p_browser, p_os, p_device, 'success')
    RETURNING id INTO v_login_id;

    -- Log activity
    PERFORM log_activity(v_user.id, 'login',
      format('%s (%s) logged in', v_user.username, v_role_name),
      'session', v_login_id::text);

    -- Load permissions
    SELECT jsonb_agg(p.code) INTO v_permissions
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = v_user.role_id;

    RETURN jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'role', v_role_name,
        'role_id', v_user.role_id
      ),
      'permissions', COALESCE(v_permissions, '[]'::jsonb),
      'token', v_token,
      'expires_at', v_expires_at,
      'login_id', v_login_id
    );
  ELSE
    v_remaining := 2 - v_user.failed_attempts;

    INSERT INTO login_history (user_id, username, user_role, ip_address, browser, os, device, status, failure_reason)
    VALUES (v_user.id, v_user.username, v_role_name, p_ip_address, p_browser, p_os, p_device, 'failed', 'Wrong password');

    IF v_user.failed_attempts >= 2 THEN
      UPDATE users SET failed_attempts = failed_attempts + 1,
        locked_until = now() + interval '10 minutes'
      WHERE id = v_user.id;
      RETURN jsonb_build_object('success', false, 'locked', true,
        'error', 'Account locked for 10 minutes due to too many failed attempts.',
        'remaining_attempts', 0);
    ELSE
      UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
      RETURN jsonb_build_object('success', false, 'locked', false,
        'error', format('Invalid credentials. %s attempt(s) remaining.', v_remaining),
        'remaining_attempts', v_remaining);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VALIDATE SESSION
-- ============================================
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

-- ============================================
-- LOGOUT
-- ============================================
CREATE OR REPLACE FUNCTION logout_user(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_session sessions%ROWTYPE;
  v_lh_id UUID;
BEGIN
  SELECT * INTO v_session FROM sessions WHERE token = p_token AND is_valid = true;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE sessions SET is_valid = false WHERE token = p_token;

  SELECT id INTO v_lh_id FROM login_history
    WHERE user_id = v_session.user_id AND status = 'success' AND logout_time IS NULL
    ORDER BY login_time DESC LIMIT 1;
  IF FOUND THEN
    UPDATE login_history SET logout_time = now(),
      session_duration = extract(epoch from (now() - login_time))::int
    WHERE id = v_lh_id;
  END IF;

  PERFORM log_activity(v_session.user_id, 'logout', 'User logged out', 'session', v_lh_id::text);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE USER (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION create_user(
  p_admin_id UUID,
  p_username TEXT,
  p_password TEXT,
  p_role_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_target_role_id UUID;
  v_new_user users%ROWTYPE;
BEGIN
  IF NOT has_permission(p_admin_id, 'users.create') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT id INTO v_target_role_id FROM roles WHERE name = p_role_name;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid role: %', p_role_name; END IF;

  IF EXISTS (SELECT 1 FROM users WHERE username = lower(p_username)) THEN
    RAISE EXCEPTION 'Username already exists.';
  END IF;

  INSERT INTO users (username, password, role, role_id)
  VALUES (lower(p_username), crypt(p_password, gen_salt('bf')), p_role_name, v_target_role_id)
  RETURNING * INTO v_new_user;

  PERFORM log_activity(p_admin_id, 'user_create',
    format('Created user "%s" with role "%s"', v_new_user.username, p_role_name),
    'user', v_new_user.id::text);

  RETURN jsonb_build_object(
    'id', v_new_user.id,
    'username', v_new_user.username,
    'role', p_role_name,
    'created_at', v_new_user.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DEACTIVATE USER (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION deactivate_user(
  p_admin_id UUID,
  p_target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_target_username TEXT;
BEGIN
  IF NOT has_permission(p_admin_id, 'users.delete') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  IF p_admin_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  SELECT username INTO v_target_username FROM users WHERE id = p_target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found.'; END IF;

  UPDATE users SET is_active = false WHERE id = p_target_user_id;

  PERFORM log_activity(p_admin_id, 'user_delete',
    format('Deleted user "%s"', v_target_username),
    'user', p_target_user_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHANGE OWN PASSWORD
-- ============================================
CREATE OR REPLACE FUNCTION change_own_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_stored TEXT;
BEGIN
  SELECT password INTO v_stored FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found.'; END IF;
  IF v_stored != crypt(p_current_password, v_stored) THEN
    RAISE EXCEPTION 'Current password is incorrect.';
  END IF;

  UPDATE users SET password = crypt(p_new_password, gen_salt('bf')), last_password_change = now()
  WHERE id = p_user_id;

  PERFORM log_activity(p_user_id, 'password_change', 'Changed own password', 'user', p_user_id::text);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RESET USER PASSWORD (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION reset_user_password(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_target_username TEXT;
BEGIN
  IF NOT has_permission(p_admin_id, 'users.reset_password') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT username INTO v_target_username FROM users WHERE id = p_target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Target user not found.'; END IF;

  UPDATE users SET password = crypt(p_new_password, gen_salt('bf')),
    last_password_change = now(), failed_attempts = 0, locked_until = NULL
  WHERE id = p_target_user_id;

  PERFORM log_activity(p_admin_id, 'password_reset',
    format('Reset password for user "%s"', v_target_username),
    'user', p_target_user_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET ALL USERS (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION get_all_users(p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT has_permission(p_admin_id, 'users.view') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', u.id,
    'username', u.username,
    'role', COALESCE(r.name, u.role),
    'role_id', u.role_id,
    'is_active', u.is_active,
    'created_at', u.created_at,
    'last_password_change', u.last_password_change,
    'failed_attempts', u.failed_attempts,
    'locked_until', u.locked_until
  ) ORDER BY u.created_at ASC) INTO v_result
  FROM users u LEFT JOIN roles r ON u.role_id = r.id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET CATEGORIES
-- ============================================
CREATE OR REPLACE FUNCTION get_categories()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'sort_order', sort_order
  ) ORDER BY sort_order ASC, name ASC) INTO v_result FROM categories;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD PRODUCT (permission-checked, with activity log + inventory tx)
-- ============================================
CREATE OR REPLACE FUNCTION add_product(
  p_user_id UUID,
  p_product_description TEXT,
  p_part_number TEXT,
  p_category_id UUID,
  p_quantity INT,
  p_image_url TEXT DEFAULT NULL,
  p_inventory_box_serial TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  IF NOT has_permission(p_user_id, 'inventory.create') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  INSERT INTO products (
    product_description, part_number, category_id, quantity,
    image_url, inventory_box_serial, created_by
  ) VALUES (
    p_product_description, p_part_number, p_category_id, p_quantity,
    p_image_url, p_inventory_box_serial, p_user_id
  ) RETURNING * INTO v_product;

  -- Record initial inventory transaction
  INSERT INTO inventory_transactions (product_id, user_id, transaction_type,
    quantity_before, quantity_after, delta, reference)
  VALUES (v_product.id, p_user_id, 'initial', 0, p_quantity, p_quantity, 'Initial stock');

  -- Log activity
  PERFORM log_activity(p_user_id, 'inventory_add',
    format('Added "%s" (%s) qty:%s', v_product.product_description, v_product.part_number, p_quantity),
    'product', v_product.id::text);

  RETURN jsonb_build_object(
    'id', v_product.id,
    'product_description', v_product.product_description,
    'part_number', v_product.part_number,
    'category_id', p_category_id,
    'quantity', v_product.quantity,
    'image_url', v_product.image_url,
    'inventory_box_serial', v_product.inventory_box_serial,
    'created_at', v_product.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE PRODUCT (permission-checked, with change tracking)
-- ============================================
CREATE OR REPLACE FUNCTION update_product(
  p_user_id UUID,
  p_product_id UUID,
  p_product_description TEXT DEFAULT NULL,
  p_part_number TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_inventory_box_serial TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_old products%ROWTYPE;
  v_changes JSONB := '{}'::jsonb;
  v_new_desc TEXT;
BEGIN
  IF NOT has_permission(p_user_id, 'inventory.edit') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT * INTO v_old FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found.'; END IF;

  -- Build changes object
  IF p_product_description IS NOT NULL AND p_product_description != v_old.product_description THEN
    v_changes := v_changes || jsonb_build_object('product_description',
      jsonb_build_object('from', v_old.product_description, 'to', p_product_description));
  END IF;
  IF p_part_number IS NOT NULL AND p_part_number != v_old.part_number THEN
    v_changes := v_changes || jsonb_build_object('part_number',
      jsonb_build_object('from', v_old.part_number, 'to', p_part_number));
  END IF;
  IF p_image_url IS DISTINCT FROM v_old.image_url THEN
    v_changes := v_changes || jsonb_build_object('image_url',
      jsonb_build_object('from', v_old.image_url, 'to', p_image_url));
  END IF;
  IF p_inventory_box_serial IS DISTINCT FROM v_old.inventory_box_serial THEN
    v_changes := v_changes || jsonb_build_object('inventory_box_serial',
      jsonb_build_object('from', v_old.inventory_box_serial, 'to', p_inventory_box_serial));
  END IF;

  UPDATE products SET
    product_description = COALESCE(p_product_description, v_old.product_description),
    part_number = COALESCE(p_part_number, v_old.part_number),
    category_id = COALESCE(p_category_id, v_old.category_id),
    image_url = p_image_url,
    inventory_box_serial = p_inventory_box_serial,
    updated_at = now()
  WHERE id = p_product_id;

  v_new_desc := COALESCE(p_product_description, v_old.product_description);

  PERFORM log_activity(p_user_id, 'inventory_edit',
    format('Edited "%s"', v_new_desc),
    'product', p_product_id::text, v_changes);

  RETURN jsonb_build_object('success', true, 'changes', v_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DELETE PRODUCT (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION delete_product(
  p_user_id UUID,
  p_product_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  IF NOT has_permission(p_user_id, 'inventory.delete') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found.'; END IF;

  DELETE FROM products WHERE id = p_product_id;

  PERFORM log_activity(p_user_id, 'inventory_delete',
    format('Deleted "%s" (%s)', v_product.product_description, v_product.part_number),
    'product', p_product_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ARCHIVE PRODUCT (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION archive_product(
  p_user_id UUID,
  p_product_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  IF NOT has_permission(p_user_id, 'inventory.archive') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found.'; END IF;

  UPDATE products SET is_archived = true, archived_at = now(), archived_by = p_user_id
  WHERE id = p_product_id;

  PERFORM log_activity(p_user_id, 'inventory_archive',
    format('Archived "%s"', v_product.product_description),
    'product', p_product_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RESTORE PRODUCT (permission-checked)
-- ============================================
CREATE OR REPLACE FUNCTION restore_product(
  p_user_id UUID,
  p_product_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  IF NOT has_permission(p_user_id, 'inventory.restore') THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found.'; END IF;

  UPDATE products SET is_archived = false, archived_at = NULL, archived_by = NULL
  WHERE id = p_product_id;

  PERFORM log_activity(p_user_id, 'inventory_restore',
    format('Restored "%s"', v_product.product_description),
    'product', p_product_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHANGE QUANTITY (permission-checked, with inventory transaction)
-- ============================================
CREATE OR REPLACE FUNCTION change_quantity(
  p_user_id UUID,
  p_product_id UUID,
  p_delta INT
) RETURNS JSONB AS $$
DECLARE
  v_old_qty INT;
  v_new_qty INT;
  v_product products%ROWTYPE;
  v_tx_type TEXT;
BEGIN
  v_tx_type := CASE WHEN p_delta > 0 THEN 'increase' WHEN p_delta < 0 THEN 'decrease' ELSE 'set' END;

  IF NOT has_permission(p_user_id,
    CASE WHEN p_delta > 0 THEN 'inventory.quantity.increase'
         WHEN p_delta < 0 THEN 'inventory.quantity.decrease'
         ELSE 'inventory.edit' END) THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found.'; END IF;

  v_old_qty := v_product.quantity;
  v_new_qty := GREATEST(0, v_old_qty + p_delta);

  IF v_new_qty = v_old_qty THEN
    RETURN jsonb_build_object('success', true, 'quantity', v_new_qty, 'changed', false);
  END IF;

  UPDATE products SET quantity = v_new_qty, updated_at = now() WHERE id = p_product_id;

  INSERT INTO inventory_transactions (product_id, user_id, transaction_type,
    quantity_before, quantity_after, delta, reference)
  VALUES (p_product_id, p_user_id, v_tx_type, v_old_qty, v_new_qty, v_new_qty - v_old_qty, NULL);

  PERFORM log_activity(p_user_id, 'inventory_quantity_change',
    format('Changed quantity of "%s" from %s to %s (%s%d)',
      v_product.product_description, v_old_qty, v_new_qty,
      CASE WHEN p_delta > 0 THEN '+' ELSE '' END, p_delta),
    'product', p_product_id::text,
    jsonb_build_object('from', v_old_qty, 'to', v_new_qty, 'delta', p_delta));

  RETURN jsonb_build_object('success', true, 'quantity', v_new_qty, 'changed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET PRODUCTS (with category name)
-- ============================================
CREATE OR REPLACE FUNCTION get_products(p_archived BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', p.id,
    'product_description', p.product_description,
    'part_number', p.part_number,
    'category_id', p.category_id,
    'category', c.name,
    'quantity', p.quantity,
    'image_url', p.image_url,
    'inventory_box_serial', p.inventory_box_serial,
    'is_archived', p.is_archived,
    'archived_at', p.archived_at,
    'created_by', p.created_by,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) ORDER BY p.created_at DESC) INTO v_result
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.is_archived = p_archived;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET ACTIVITY LOGS (with role-scoped visibility)
-- ============================================
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_user_id UUID,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 50,
  p_action TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_items JSONB;
  v_user_role TEXT;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  SELECT r.name INTO v_user_role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = p_user_id;

  -- Role-scoped visibility:
  -- super_user: sees all logs
  -- admin: sees admin + read_only logs
  -- read_only: sees only own logs

  CREATE TEMP TABLE IF NOT EXISTS _log_filter ON COMMIT DROP AS
  SELECT count(*)::int AS total FROM activity_logs l
  WHERE (p_action IS NULL OR l.action = p_action)
    AND (p_search IS NULL OR l.description ILIKE '%' || p_search || '%' OR l.user_name ILIKE '%' || p_search || '%')
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
    AND (v_user_role = 'super_user'
      OR (v_user_role = 'admin' AND l.user_role IN ('admin', 'read_only'))
      OR (v_user_role = 'read_only' AND l.user_id = p_user_id));

  SELECT total INTO v_total FROM _log_filter;

  SELECT jsonb_agg(sub) INTO v_items FROM (
    SELECT l.* FROM activity_logs l
    WHERE (p_action IS NULL OR l.action = p_action)
      AND (p_search IS NULL OR l.description ILIKE '%' || p_search || '%' OR l.user_name ILIKE '%' || p_search || '%')
      AND (p_date_from IS NULL OR l.created_at >= p_date_from)
      AND (p_date_to IS NULL OR l.created_at <= p_date_to)
      AND (v_user_role = 'super_user'
        OR (v_user_role = 'admin' AND l.user_role IN ('admin', 'read_only'))
        OR (v_user_role = 'read_only' AND l.user_id = p_user_id))
    ORDER BY l.created_at DESC
    LIMIT p_per_page OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'pages', CASE WHEN v_total > 0 THEN ceil(v_total::numeric / p_per_page) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET LOGIN HISTORY (role-scoped)
-- ============================================
CREATE OR REPLACE FUNCTION get_login_history(
  p_user_id UUID,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 50,
  p_status TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_items JSONB;
  v_user_role TEXT;
BEGIN
  v_offset := (p_page - 1) * p_per_page;
  SELECT r.name INTO v_user_role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = p_user_id;

  SELECT count(*) INTO v_total FROM login_history l
  WHERE (p_status IS NULL OR l.status = p_status)
    AND (p_date_from IS NULL OR l.login_time >= p_date_from)
    AND (p_date_to IS NULL OR l.login_time <= p_date_to)
    AND (v_user_role = 'super_user'
      OR (v_user_role = 'admin' AND l.user_role IN ('admin', 'read_only'))
      OR (v_user_role = 'read_only' AND l.user_id = p_user_id));

  SELECT jsonb_agg(sub) INTO v_items FROM (
    SELECT * FROM login_history l
    WHERE (p_status IS NULL OR l.status = p_status)
      AND (p_date_from IS NULL OR l.login_time >= p_date_from)
      AND (p_date_to IS NULL OR l.login_time <= p_date_to)
      AND (v_user_role = 'super_user'
        OR (v_user_role = 'admin' AND l.user_role IN ('admin', 'read_only'))
        OR (v_user_role = 'read_only' AND l.user_id = p_user_id))
    ORDER BY l.login_time DESC
    LIMIT p_per_page OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'pages', CASE WHEN v_total > 0 THEN ceil(v_total::numeric / p_per_page) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET TIMELINE LOGS (year of activity for ContributionGraph)
-- ============================================
CREATE OR REPLACE FUNCTION get_timeline_logs(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_user_role TEXT;
BEGIN
  SELECT r.name INTO v_user_role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'date', l.created_at::date,
    'count', count(*)
  ) ORDER BY 1) INTO v_result
  FROM activity_logs l
  WHERE l.created_at >= date_trunc('year', now())
    AND (v_user_role = 'super_user'
      OR (v_user_role = 'admin' AND l.user_role IN ('admin', 'read_only'))
      OR (v_user_role = 'read_only' AND l.user_id = p_user_id))
  GROUP BY l.created_at::date;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
