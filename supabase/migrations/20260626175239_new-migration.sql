-- ChadWallet Supabase Schema

-- 1. Create Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Trades Table
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    token_mint TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    amount_usd NUMERIC NOT NULL,
    tx_signature TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Positions Table (Optional, for caching if not fully relying on RPC)
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    token_mint TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Users can only read their own data based on wallet_address (assuming anon key usage from client)
-- WARNING: In a real production environment, you should verify JWT tokens instead of trusting wallet_address inputs blindly.
-- For this prototype using anon keys without JWT verification, we allow wide access but filter by wallet_address if passed.
CREATE POLICY "Allow public read/insert for prototype" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public read/insert for prototype" ON public.trades FOR ALL USING (true);
CREATE POLICY "Allow public read/insert for prototype" ON public.positions FOR ALL USING (true);
