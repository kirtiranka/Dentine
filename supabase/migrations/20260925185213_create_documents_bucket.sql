-- 1. Create a public bucket for simple demo access (no signed URLs required)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-docs', 'clinic-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Open storage policies for demo/dev (Allows upload, view, update, delete without auth)
CREATE POLICY "Public Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'clinic-docs')
WITH CHECK (bucket_id = 'clinic-docs');