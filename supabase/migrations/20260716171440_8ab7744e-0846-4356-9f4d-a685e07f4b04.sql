
-- Add cashback to txn_type
ALTER TYPE public.txn_type ADD VALUE IF NOT EXISTS 'cashback';
