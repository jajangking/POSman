-- File untuk membuat semua tabel yang diperlukan di Supabase

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer', 'guest')),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Tabel Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  sku TEXT UNIQUE,
  supplier TEXT,
  reorder_level INTEGER NOT NULL,
  min_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES inventory_items(code),
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  reference TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  birthday DATE,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_transaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  paper_size TEXT DEFAULT '80mm',
  print_auto BOOLEAN DEFAULT false,
  discount_enabled BOOLEAN DEFAULT false,
  tax_enabled BOOLEAN DEFAULT true,
  tax_percentage DECIMAL(5,2) DEFAULT 10.0,
  footer_message TEXT,
  bluetooth_device TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables with updated_at column
CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_store_settings_updated_at BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own record" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can insert users" ON users
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Inventory Items Table Policies
CREATE POLICY "Staff and admins can view all items" ON inventory_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Only admins and staff can insert items" ON inventory_items
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Only admins and staff can update items" ON inventory_items
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Only admins can delete items" ON inventory_items
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Inventory Transactions Table Policies
CREATE POLICY "Users can view their own transactions" ON inventory_transactions
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Staff and admins can view all transactions" ON inventory_transactions
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Users can insert transactions" ON inventory_transactions
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own transactions" ON inventory_transactions
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can delete transactions" ON inventory_transactions
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Members Table Policies
CREATE POLICY "Staff and admins can view all members" ON members
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Staff and admins can insert members" ON members
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Staff and admins can update members" ON members
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Admins can delete members" ON members
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Store Settings Table Policies
CREATE POLICY "Staff and admins can view store settings" ON store_settings
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

CREATE POLICY "Only admins can update store settings" ON store_settings
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only admins can insert store settings" ON store_settings
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));