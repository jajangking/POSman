# Supabase Database Schema

## Tabel Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer', 'guest')),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

## Tabel Inventory Items
```sql
CREATE TABLE inventory_items (
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
```

## Tabel Inventory Transactions
```sql
CREATE TABLE inventory_transactions (
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
```

## Tabel Members
```sql
CREATE TABLE members (
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
```

## Tabel Store Settings
```sql
CREATE TABLE store_settings (
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
```

## Row Level Security (RLS) Policies

### Users Table Policies
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Users can view their own record
CREATE POLICY "Users can view their own record" ON users
FOR SELECT USING (auth.uid() = id);

-- Admins can insert users
CREATE POLICY "Admins can insert users" ON users
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Admins can update users
CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));
```

### Inventory Items Table Policies
```sql
-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Staff and admins can view all inventory items
CREATE POLICY "Staff and admins can view all items" ON inventory_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

-- Only admins and staff can insert items
CREATE POLICY "Only admins and staff can insert items" ON inventory_items
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

-- Only admins and staff can update items
CREATE POLICY "Only admins and staff can update items" ON inventory_items
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

-- Only admins can delete items
CREATE POLICY "Only admins can delete items" ON inventory_items
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));
```

### Inventory Transactions Table Policies
```sql
-- Enable RLS
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions they created
CREATE POLICY "Users can view their own transactions" ON inventory_transactions
FOR SELECT USING (created_by = auth.uid());

-- Staff and admins can view all transactions
CREATE POLICY "Staff and admins can view all transactions" ON inventory_transactions
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

-- Users can insert transactions
CREATE POLICY "Users can insert transactions" ON inventory_transactions
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own transactions
CREATE POLICY "Users can update their own transactions" ON inventory_transactions
FOR UPDATE USING (created_by = auth.uid());

-- Admins can delete transactions
CREATE POLICY "Admins can delete transactions" ON inventory_transactions
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));
```

### Members Table Policies
```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Staff and admins can view all members
CREATE POLICY "Staff and admins can view all members" ON members
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
));

-- Staff and admins can insert members
CREATE POLICY "Staff and admins can insert members" ON members
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'
));

-- Staff and admins can update members
CREATE POLICY "Staff and admins can update members" ON members
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'
));

-- Admins can delete members
CREATE POLICY "Admins can delete members" ON members
FOR DELETE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));
```

### Store Settings Table Policies
```sql
-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Staff and admins can view store settings
CREATE POLICY "Staff and admins can view store settings" ON store_settings
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'
));

-- Only admins can update store settings
CREATE POLICY "Only admins can update store settings" ON store_settings
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Only admins can insert store settings
CREATE POLICY "Only admins can insert store settings" ON store_settings
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));
```

## Triggers for Updated At

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$ language 'plpgsql';

-- Triggers for tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```