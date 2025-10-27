-- 프롬프트 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,
  template_content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- 프롬프트 변경 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE,
  template_content TEXT NOT NULL,
  version INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER trigger_update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_templates_updated_at();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_prompt_templates_key ON prompt_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_history_template_id ON prompt_history(template_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (프롬프트 템플릿)
CREATE POLICY "Anyone can read active prompt templates"
  ON prompt_templates FOR SELECT
  USING (is_active = true);

-- 인증된 사용자만 히스토리 조회 가능
CREATE POLICY "Authenticated users can read prompt history"
  ON prompt_history FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 수정 가능 (추후 is_admin 플래그로 변경 가능)
-- 현재는 생성자만 수정 가능
CREATE POLICY "Creator can update prompt templates"
  ON prompt_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can insert prompt templates"
  ON prompt_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 버전 업데이트 및 히스토리 저장 함수
CREATE OR REPLACE FUNCTION update_prompt_with_history(
  p_template_key TEXT,
  p_new_content TEXT,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS prompt_templates AS $$
DECLARE
  v_template prompt_templates;
  v_old_content TEXT;
  v_old_version INTEGER;
BEGIN
  -- 기존 템플릿 조회
  SELECT * INTO v_template
  FROM prompt_templates
  WHERE template_key = p_template_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template with key % not found', p_template_key;
  END IF;

  v_old_content := v_template.template_content;
  v_old_version := v_template.version;

  -- 히스토리에 이전 버전 저장
  INSERT INTO prompt_history (template_id, template_content, version, changed_by, change_reason)
  VALUES (v_template.id, v_old_content, v_old_version, auth.uid(), p_change_reason);

  -- 템플릿 업데이트
  UPDATE prompt_templates
  SET
    template_content = p_new_content,
    version = version + 1,
    updated_at = NOW()
  WHERE id = v_template.id
  RETURNING * INTO v_template;

  RETURN v_template;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE prompt_templates IS 'AI 프롬프트 템플릿 저장소';
COMMENT ON TABLE prompt_history IS 'AI 프롬프트 변경 히스토리';
COMMENT ON FUNCTION update_prompt_with_history IS '프롬프트 업데이트 시 자동으로 히스토리 저장';
