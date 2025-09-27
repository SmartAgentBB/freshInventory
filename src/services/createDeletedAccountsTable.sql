-- 탈퇴한 계정 관리 테이블
-- 이 테이블은 탈퇴한 계정의 이메일을 저장하여
-- 같은 이메일로 재로그인을 방지하기 위함

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_reason TEXT,

  -- 이메일로 빠른 검색을 위한 인덱스
  UNIQUE(email)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON deleted_accounts(email);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_deleted_at ON deleted_accounts(deleted_at DESC);

-- Row Level Security 활성화
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자만 조회 가능 (로그인 시 체크용)
CREATE POLICY "Anyone can check deleted accounts" ON deleted_accounts
  FOR SELECT
  USING (true);  -- 모든 사용자가 조회 가능 (로그인 시 체크 필요)

-- 삽입은 서비스 역할만 가능 (또는 authenticated 사용자)
CREATE POLICY "Authenticated users can insert deleted accounts" ON deleted_accounts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 권한 부여
GRANT SELECT, INSERT ON deleted_accounts TO authenticated;
GRANT SELECT ON deleted_accounts TO anon;  -- 로그인 전에도 체크 가능하도록