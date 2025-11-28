-- Add location coordinates to listings table
ALTER TABLE listings 
ADD COLUMN location_lat NUMERIC,
ADD COLUMN location_lng NUMERIC;