-- Align persisted account and trade data with the Privy-backed application.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS privy_id TEXT;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS token_symbol TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_privy_id_unique
  ON public.users (privy_id)
  WHERE privy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_user_created_at_idx
  ON public.trades (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS positions_user_token_idx
  ON public.positions (user_id, token_mint);
