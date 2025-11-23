-- Drop the old constraint that doesn't include 'out_of_stock'
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;

-- Add new constraint that includes 'out_of_stock' as a valid status
ALTER TABLE listings ADD CONSTRAINT listings_status_check 
  CHECK (status = ANY (ARRAY['available'::text, 'reserved'::text, 'sold'::text, 'pooled'::text, 'out_of_stock'::text]));