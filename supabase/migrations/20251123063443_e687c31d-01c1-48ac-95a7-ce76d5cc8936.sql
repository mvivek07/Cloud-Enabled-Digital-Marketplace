-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('farmer', 'buyer', 'logistics_admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  farm_name TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  cooperative_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create buyers table
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  harvest_date DATE,
  cosmetic_notes TEXT,
  pickup_location TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'pooled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bulk_pools table
CREATE TABLE public.bulk_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  total_quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pool_contributions table
CREATE TABLE public.pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES public.bulk_pools(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES public.bulk_pools(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'negotiating', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  pickup_time TIMESTAMPTZ,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles during signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for farmers
CREATE POLICY "Everyone can view verified farmers" ON public.farmers FOR SELECT USING (verified = true);
CREATE POLICY "Farmers can view own profile" ON public.farmers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Farmers can update own profile" ON public.farmers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Farmers can insert own profile" ON public.farmers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for buyers
CREATE POLICY "Buyers can view own profile" ON public.buyers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Buyers can update own profile" ON public.buyers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Buyers can insert own profile" ON public.buyers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for listings
CREATE POLICY "Everyone can view available listings" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Farmers can create listings" ON public.listings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farmers WHERE farmers.user_id = auth.uid() AND farmers.id = farmer_id)
);
CREATE POLICY "Farmers can update own listings" ON public.listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farmers WHERE farmers.user_id = auth.uid() AND farmers.id = farmer_id)
);
CREATE POLICY "Farmers can delete own listings" ON public.listings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.farmers WHERE farmers.user_id = auth.uid() AND farmers.id = farmer_id)
);

-- RLS Policies for bulk_pools
CREATE POLICY "Everyone can view active pools" ON public.bulk_pools FOR SELECT USING (true);

-- RLS Policies for pool_contributions
CREATE POLICY "Everyone can view pool contributions" ON public.pool_contributions FOR SELECT USING (true);

-- RLS Policies for orders
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.buyers WHERE buyers.user_id = auth.uid() AND buyers.id = buyer_id)
);
CREATE POLICY "Farmers can view orders for their listings" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.farmers f ON l.farmer_id = f.id
    WHERE l.id = listing_id AND f.user_id = auth.uid()
  )
);
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.buyers WHERE buyers.user_id = auth.uid() AND buyers.id = buyer_id)
);
CREATE POLICY "Order participants can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.buyers WHERE buyers.user_id = auth.uid() AND buyers.id = buyer_id)
  OR EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.farmers f ON l.farmer_id = f.id
    WHERE l.id = listing_id AND f.user_id = auth.uid()
  )
);

-- RLS Policies for messages
CREATE POLICY "Order participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.buyers b ON o.buyer_id = b.id
    LEFT JOIN public.listings l ON o.listing_id = l.id
    LEFT JOIN public.farmers f ON l.farmer_id = f.id
    WHERE o.id = order_id 
    AND (b.user_id = auth.uid() OR f.user_id = auth.uid())
  )
);
CREATE POLICY "Order participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.buyers b ON o.buyer_id = b.id
    LEFT JOIN public.listings l ON o.listing_id = l.id
    LEFT JOIN public.farmers f ON l.farmer_id = f.id
    WHERE o.id = order_id 
    AND (b.user_id = auth.uid() OR f.user_id = auth.uid())
  )
);

-- RLS Policies for ratings
CREATE POLICY "Everyone can view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Order participants can create ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulk_pools_updated_at BEFORE UPDATE ON public.bulk_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;