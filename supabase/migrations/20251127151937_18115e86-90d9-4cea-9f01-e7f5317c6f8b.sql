-- Drop the old constraint on orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint that includes 'completed' as a valid status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text]));