-- Add bio field to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create favorites table for bookmarking listings and farmers
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT either_listing_or_farmer CHECK (
    (listing_id IS NOT NULL AND farmer_id IS NULL) OR 
    (listing_id IS NULL AND farmer_id IS NOT NULL)
  ),
  UNIQUE(user_id, listing_id),
  UNIQUE(user_id, farmer_id)
);

-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own favorites
CREATE POLICY "Users can create own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_farmer_id ON favorites(farmer_id);