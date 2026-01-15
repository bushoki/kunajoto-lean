INSERT INTO public.venues (id, name, type, latitude, longitude, vibe_score, vibe_confidence, district, description, price_level, is_promoted) VALUES 
('mock-v1', 'The Vibe Spot', 'Bar', 40.7128, -74.0060, 95, 'High', 'Manhattan', 'A trendy bar with a high-energy atmosphere.', 3, TRUE),
('mock-v2', 'Quiet Corner Cafe', 'Cafe', 40.7580, -73.9855, 60, 'Medium', 'Midtown', 'A cozy, low-key spot for coffee and reading.', 2, FALSE),
('mock-v3', 'The Hidden Gem', 'Restaurant', 40.7357, -73.9951, 85, 'High', 'Greenwich Village', 'Excellent food and a great place for a date.', 4, FALSE)
ON CONFLICT (id) DO NOTHING;
