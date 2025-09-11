-- Supabase Storage 버킷 및 RLS 정책 설정
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. Storage 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 Storage 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 3. 새로운 Storage 정책 생성

-- 모든 사용자가 이미지를 볼 수 있도록 허용 (public bucket)
CREATE POLICY "Anyone can view images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'food-images');

-- 인증된 사용자는 자신의 폴더에 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지를 업데이트 가능
CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);