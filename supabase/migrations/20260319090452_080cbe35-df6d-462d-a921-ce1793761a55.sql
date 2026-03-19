
-- Create skin progress photos table
CREATE TABLE public.skin_progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skin_progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own progress photos"
  ON public.skin_progress_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress photos"
  ON public.skin_progress_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos"
  ON public.skin_progress_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for skin progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('skin-progress', 'skin-progress', true);

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own progress photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'skin-progress' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own photos
CREATE POLICY "Users can view their own progress photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'skin-progress' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public can view (since bucket is public, for image URLs)
CREATE POLICY "Public can view skin progress photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'skin-progress');

-- Users can delete their own photos
CREATE POLICY "Users can delete their own progress photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'skin-progress' AND (storage.foldername(name))[1] = auth.uid()::text);
