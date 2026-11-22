-- ============================================================================
-- HOSTNOVA — COMPLETE SUPABASE POSTGRESQL SCHEMA, RLS POLICIES & SEED MIGRATION
-- File: supabase/migrations/001_hostnova_schema.sql
-- Note: All payments, revenue, and hosting activations are simulated for demo.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  email TEXT NOT NULL UNIQUE CHECK (char_length(email) BETWEEN 3 AND 200),
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. HOSTING PLANS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hosting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  tagline TEXT NOT NULL DEFAULT '',
  monthly_price NUMERIC(10, 2) NOT NULL CHECK (monthly_price > 0),
  storage_gb INTEGER NOT NULL CHECK (storage_gb >= 1),
  website_limit INTEGER NOT NULL CHECK (website_limit >= 1),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. SUBSCRIPTION DISCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_months INTEGER NOT NULL UNIQUE CHECK (duration_months IN (1, 3, 6, 12, 24)),
  label TEXT NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 80),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. ORDERS (Immutable pricing snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.hosting_plans(id) ON DELETE RESTRICT,
  plan_name_snapshot TEXT NOT NULL,
  base_monthly_price_snapshot NUMERIC(10, 2) NOT NULL,
  storage_snapshot INTEGER NOT NULL,
  website_limit_snapshot INTEGER NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage >= 0),
  original_total NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  final_total NUMERIC(10, 2) NOT NULL,
  domain TEXT DEFAULT '',
  github_repository TEXT DEFAULT '',
  order_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. PAYMENTS (Simulated only — ZERO card numbers, CVV, or expiry columns)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  payment_status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (payment_status IN ('SUCCESS', 'PENDING', 'FAILED')),
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- ----------------------------------------------------------------------------
-- 6. INVOICES (1:1 per confirmed order)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_status TEXT NOT NULL DEFAULT 'DEMO PAID' CHECK (payment_status IN ('DEMO PAID', 'PENDING', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

-- ----------------------------------------------------------------------------
-- 7. HOSTING SERVICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hosting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hosting_id TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.hosting_plans(id) ON DELETE RESTRICT,
  domain TEXT DEFAULT '',
  github_repository TEXT DEFAULT '',
  storage_gb INTEGER NOT NULL,
  website_limit INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hosting_services_customer_id ON public.hosting_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_hosting_services_status ON public.hosting_services(status);

-- ----------------------------------------------------------------------------
-- 8. SITE SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  company_name TEXT NOT NULL DEFAULT 'HostNova',
  tagline TEXT NOT NULL DEFAULT 'Powering Your Digital World.',
  company_email TEXT NOT NULL DEFAULT 'support@hostnova.demo',
  company_address TEXT NOT NULL DEFAULT '100 Cloudway Plaza, Suite 400, Austin, TX 78701 (Demo Address)',
  logo_url TEXT NOT NULL DEFAULT '/assets/aistudio/HostNova_Cloud_Technology_Logo_2a69c7f4.png',
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for catalog and site settings
CREATE POLICY "Public can read active hosting plans" ON public.hosting_plans
  FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage hosting plans" ON public.hosting_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can read subscription discounts" ON public.subscription_discounts
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage subscription discounts" ON public.subscription_discounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles: strict owner/admin isolation, no self-escalation
CREATE POLICY "Users read own profile or admin reads all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users create own customer profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'customer');
CREATE POLICY "Users update own non-role profile fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK ((auth.uid() = id AND role = 'customer') OR public.is_admin());

-- Orders, Payments, Invoices, Hosting Services: strict customer isolation
CREATE POLICY "Customers read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());
CREATE POLICY "Admins update order status" ON public.orders
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers read own payments" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers read own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Customers read own hosting services" ON public.hosting_services
  FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());
CREATE POLICY "Admins update hosting services" ON public.hosting_services
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- SEED DEFAULT APPROVED PLANS, DISCOUNTS & SETTINGS
-- ----------------------------------------------------------------------------
INSERT INTO public.hosting_plans (slug, name, tagline, monthly_price, storage_gb, website_limit, features, is_popular, is_active, sort_order)
VALUES
  (
    'basic',
    'Basic',
    'Essential SSD hosting for personal projects and developer portfolios.',
    15.00,
    10,
    1,
    '["10 GB SSD Storage", "1 Website", "Free SSL (Demo)", "GitHub Support", "Standard Support"]'::jsonb,
    FALSE,
    TRUE,
    1
  ),
  (
    'pro',
    'Pro',
    'High-throughput SSD hosting tailored for growing businesses and apps.',
    25.00,
    50,
    2,
    '["50 GB SSD Storage", "2 Websites", "Free SSL (Demo)", "GitHub Integration Support", "Priority Support"]'::jsonb,
    TRUE,
    TRUE,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'Maximum resource allocation for multi-site agencies and production teams.',
    45.00,
    100,
    10,
    '["100 GB SSD Storage", "10 Websites", "Free SSL (Demo)", "GitHub Integration Support", "Premium Support"]'::jsonb,
    FALSE,
    TRUE,
    3
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subscription_discounts (duration_months, label, discount_percentage, is_active)
VALUES
  (1,  '1 Month',   0.00, TRUE),
  (3,  '3 Months',  3.00, TRUE),
  (6,  '6 Months',  7.00, TRUE),
  (12, '12 Months', 15.00, TRUE),
  (24, '24 Months', 25.00, TRUE)
ON CONFLICT (duration_months) DO NOTHING;

INSERT INTO public.site_settings (id, company_name, tagline, company_email, company_address, logo_url, currency)
VALUES (
  'main',
  'HostNova',
  'Powering Your Digital World.',
  'support@hostnova.demo',
  '100 Cloudway Plaza, Suite 400, Austin, TX 78701 (Demo Address)',
  '/assets/aistudio/HostNova_Cloud_Technology_Logo_2a69c7f4.png',
  'USD'
)
ON CONFLICT (id) DO NOTHING;
