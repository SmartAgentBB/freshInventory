-- storage_info 테이블에 대한 RLS 정책 설정

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Enable read access for all users" ON storage_info;
DROP POLICY IF EXISTS "Enable insert for all users" ON storage_info;
DROP POLICY IF EXISTS "Enable update for all users" ON storage_info;

-- RLS 활성화
ALTER TABLE storage_info ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 허용
CREATE POLICY "Enable read access for all users" 
ON storage_info FOR SELECT 
USING (true);

-- 모든 인증된 사용자가 삽입할 수 있도록 허용
CREATE POLICY "Enable insert for authenticated users" 
ON storage_info FOR INSERT 
WITH CHECK (true);

-- 모든 인증된 사용자가 업데이트할 수 있도록 허용
CREATE POLICY "Enable update for authenticated users" 
ON storage_info FOR UPDATE 
USING (true);

-- 익명 사용자도 삽입할 수 있도록 허용 (필요한 경우)
CREATE POLICY "Enable insert for anon users" 
ON storage_info FOR INSERT 
TO anon
WITH CHECK (true);